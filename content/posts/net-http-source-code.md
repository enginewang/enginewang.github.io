---
title: "Go net/http 源码解析"
date: 2022-06-27T21:56:16+08:00
draft: false
categories: ["技术"]
tags: ["Golang", "HTTP"]
---

Go web中最底层的库就是Go自带的http库，下面对这个库的源码进行解析，简单而言，http分为两个部分：Server与Client。

go http包的执行流程如下图所示：

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1659262064/net-http-1.png)

首先会创建一个Listen Socket，对指定的端口进行监听。Listen socket接受客户端的请求，得到Client socket，Client socket将负责与客户端的通信。

client socket读取HTTP请求头的内容，如果是POST还有读取提交的数据，然后交给相应的handler进行处理，再通过client socket返回给客户端。

这里主要对`ListenAndServe`的执行过程源码进行解析。

使用一个最简单的helloWorld的例子：
```go
helloHandler := func(w http.ResponseWriter, req *http.Request) {
  io.WriteString(w, "Hello, world!\n")
}
http.HandleFunc("/hello", helloHandler)
log.Fatal(http.ListenAndServe(":8080", nil))
```

首先将路由和handle函数进行绑定，使得访问这个路由的时候调用handle进行处理，然后最核心的部分就是`ListenAndServer`方法，下面一步一步来看发生了什么。

## handleFunc

`HandleFunc`将handler函数注册到对应pattern的路由中

pattern是string类型的路由
handler函数的参数包括一个ResponseWriter和*Request

`net/http/server.go`，会直接调用`DefaultServeMux`的HandleFunc方法

```go
func HandleFunc(pattern string, handler func(ResponseWriter, *Request)) {
    DefaultServeMux.HandleFunc(pattern, handler)
}
```

官方是直接用DefaultServerMux路由的，先介绍一下这个简单的路由

```go
type ServeMux struct {
    mu    sync.RWMutex
    m     map[string]muxEntry
    es    []muxEntry // slice of entries sorted from longest to shortest.
    hosts bool       // whether any patterns contain hostnames
}

type muxEntry struct {
    h       Handler
    pattern string
}

var DefaultServeMux = &defaultServeMux

var defaultServeMux ServeMux
```

核心就是一个map存储从pattern到muxEntry的映射，从而很方便的能找到对应的handler，另外还有个es数组，从长到短存储muxEntry，每次匹配的时候首先查是否就在map中，不在的话从长到短查最匹配哪个路由。
```go
func (mux *ServeMux) match(path string) (h Handler, pattern string) {
    // Check for exact match first.
    v, ok := mux.m[path]
    if ok {
        return v.h, v.pattern
    }

    // Check for longest valid match.  mux.es contains all patterns
    // that end in / sorted from longest to shortest.
    for _, e := range mux.es {
        if strings.HasPrefix(path, e.pattern) {
            return e.h, e.pattern
        }
    }
    return nil, ""
}
```

回过头来看默认mux的HandleFunc：

```go
func (mux *ServeMux) HandleFunc(pattern string, handler func(ResponseWriter, *Request)) {
    if handler == nil {
        panic("http: nil handler")
    }
    mux.Handle(pattern, HandlerFunc(handler))
}
```

会转到`Handle`函数上，这个是核心函数

```go
func (mux *ServeMux) Handle(pattern string, handler Handler) {
    // 因为要操作map什么的，需要上读写锁
    mux.mu.Lock()
    defer mux.mu.Unlock()

    // 一些错误的情况
    if pattern == "" {
        panic("http: invalid pattern")
    }
    if handler == nil {
        panic("http: nil handler")
    }
    // 如果之前已经注册过一个pattern了，再注册就会报错
    if _, exist := mux.m[pattern]; exist {
        panic("http: multiple registrations for " + pattern)
    }
    // 如果之前都是空的，就初始创建这个map
    if mux.m == nil {
        mux.m = make(map[string]muxEntry)
    }
    // 创建muxEntry并记录在map和有序数组中
    e := muxEntry{h: handler, pattern: pattern}
    mux.m[pattern] = e
    if pattern[len(pattern)-1] == '/' {
        mux.es = appendSorted(mux.es, e)
    }

    if pattern[0] != '/' {
        mux.hosts = true
    }
}
```


## ListenAndServe

首先会创建一个server实例，然后调用server的ListenAndServer

```go
func ListenAndServe(addr string, handler Handler) error {
    server := &Server{Addr: addr, Handler: handler}
    return server.ListenAndServe()
}
```

这里我们的addres是":8080"，handler是nil，因为我们没有对主页创建handler。

首先看server结构体

### Server

首先会通过给出的端口和handler创建一个Serer类，Server类的定义如下：

```go
type Server struct {
    // 端口号，默认为80
    Addr string
        // 指定handler，如果是nil就是http.DefaultServeMux
    Handler Handler
    TLSConfig *tls.Config
    // 接下来是一些timeout
    ReadTimeout time.Duration
    ReadHeaderTimeout time.Duration
    WriteTimeout time.Duration
    IdleTimeout time.Duration
    // request header的最大字节数
    MaxHeaderBytes int
        // 省略若干...
    mu         sync.Mutex
    listeners  map[*net.Listener]struct{}
    activeConn map[*conn]struct{}
    doneChan   chan struct{}
    onShutdown []func()
}
```

然后调用Server类的同名方法`ListenAndServe`：

首先会调用`net.Listen`监听相应的端口，返回对这个端口进行监听的listener实例，然后对这个listener进行serve

```go
func (srv *Server) ListenAndServe() error {
    if srv.shuttingDown() {
        return ErrServerClosed
    }
    addr := srv.Addr
    if addr == "" {
        addr = ":http"
    }
    // ln是监听该端口的listener
    ln, err := net.Listen("tcp", addr)
    if err != nil {
        return err
    }
    return srv.Serve(ln)
}
```

那么首先来看一下`net.Listen`的代码

### listen

listen包含两个参数，分别是network和address，netword是诸如"tcp"，address是端口

初始化了一个listenConfig实例，然后调用它的Listen方法。

```go
// dial.go
func Listen(network, address string) (Listener, error) {
    var lc ListenConfig
    return lc.Listen(context.Background(), network, address)
}
```

ListenConfig的Listen方法，又对address的方法进行分流，如果是TCP则调用listenTCP方法：

```go
// dial.go
func (lc *ListenConfig) Listen(ctx context.Context, network, address string) (Listener, error) {
    addrs, err := DefaultResolver.resolveAddrList(ctx, "listen", network, address, nil)
    if err != nil {
        return nil, &OpError{Op: "listen", Net: network, Source: nil, Addr: nil, Err: err}
    }
    sl := &sysListener{
        ListenConfig: *lc,
        network:      network,
        address:      address,
    }
    var l Listener
    la := addrs.first(isIPv4)
    switch la := la.(type) {
    case *TCPAddr:
        l, err = sl.listenTCP(ctx, la)
    case *UnixAddr:
        l, err = sl.listenUnix(ctx, la)
    default:
        return nil, &OpError{Op: "listen", Net: sl.network, Source: nil, Addr: la, Err: &AddrError{Err: "unexpected address type", Addr: address}}
    }
    if err != nil {
        return nil, &OpError{Op: "listen", Net: sl.network, Source: nil, Addr: la, Err: err} // l is non-nil interface containing nil pointer
    }
    return l, nil
}
```

然后会通过` syscall.SOCK_STREAM`系统调用创建一个文件标识符实例fd，后面的就是底层的创建socket，就不涉及了。

这里返回的结构体TCPListener就包含了一个listener的fd和一个ListenConfig。

```go
// tcpsock_posix.go
func (sl *sysListener) listenTCP(ctx context.Context, laddr *TCPAddr) (*TCPListener, error) {
    fd, err := internetSocket(ctx, sl.network, laddr, nil, syscall.SOCK_STREAM, 0, "listen", sl.ListenConfig.Control)
    if err != nil {
        return nil, err
    }
    return &TCPListener{fd: fd, lc: sl.ListenConfig}, nil
}
```

接着看一下serve部分

### Serve

通过调用Server实例的Serve方法进行serve，只需要传入一个listener作为参数：

```go
srv.Serve(ln)
```

Serve会通过listener来接受连接，对于每一个新的service都建立一个goroutine，service goroutine会读取request和通过Handler进行处理和返回。


首先下面的逻辑通过一个for循环嵌套，即listener一旦接受了请求，就创建一个goroutine进行连接和处理

Serve方法如下，关键部分做了注释：

```go
// http/server.go
func (srv *Server) Serve(l net.Listener) error {
    ...
    ctx := context.WithValue(baseCtx, ServerContextKey, srv)
    // 无限循环，一直监听
    for {
        // 如果监听到了有事件，获取这个conn连接
        // 当然如果没有访问这个端口的请求，会一直阻塞在这里
        rw, err := l.Accept()
        // 错误处理
        if err != nil {
            ...
        }
        connCtx := ctx
        if cc := srv.ConnContext; cc != nil {
            connCtx = cc(connCtx, rw)
            if connCtx == nil {
                panic("ConnContext returned nil")
            }
        }
        tempDelay = 0
        // 建立这个conn
        c := srv.newConn(rw)
        c.setState(c.rwc, StateNew, runHooks)
        // 对于每个conn，创建一个新的goroutine来处理这个连接
        go c.serve(connCtx)
    }
}
```

然后是conn的server函数，比较复杂，只写关键的部分：

```go
func (c *conn) serve(ctx context.Context) {
    c.remoteAddr = c.rwc.RemoteAddr().String()
    ctx = context.WithValue(ctx, LocalAddrContextKey, c.rwc.LocalAddr())
    var inFlightResponse *response
    defer func() {
      ...
    }()
    // HTTPS TLS的部分先省略
    ...
    // HTTP
    for {
        // 首先读取conn的内容
        w, err := c.readRequest(ctx)
        if c.r.remain != c.server.initialReadLimitSize() {
            // If we read any bytes off the wire, we're active.
            c.setState(c.rwc, StateActive, runHooks)
        }
        if err != nil {
            ...
        }

        // 没报错的话，获取req的内容
        // req包含请求的各种信息，比如Method、Host、Url等
        req := w.req
        c.curReq.Store(w)
        ...
        // 核心的ServeHTTP逻辑
        serverHandler{c.server}.ServeHTTP(w, w.req)
        ...
    }
}
```

下面则是`handler`的ServeHTTP方法，任何结构只要实现了ServeHTTP方法就可以作为Handler对象，就可以直接用`ListenAndServe`方法，如果没有实现的话会调用默认的DefaultServeMux

```go
func (sh serverHandler) ServeHTTP(rw ResponseWriter, req *Request) {
    handler := sh.srv.Handler
    // handler如果是nil的话就默认用DefaultServeMux
    if handler == nil {
        handler = DefaultServeMux
    }
    if req.RequestURI == "*" && req.Method == "OPTIONS" {
        handler = globalOptionsHandler{}
    }
    if req.URL != nil && strings.Contains(req.URL.RawQuery, ";") {
        var allowQuerySemicolonsInUse int32
        req = req.WithContext(context.WithValue(req.Context(), silenceSemWarnContextKey, func() {
            atomic.StoreInt32(&allowQuerySemicolonsInUse, 1)
        }))
        defer func() {
            if atomic.LoadInt32(&allowQuerySemicolonsInUse) == 0 {
                sh.srv.logf("http: URL query contains semicolon, which is no longer a supported separator; parts of the query may be stripped when parsed; see golang.org/issue/25192")
            }
        }()
    }
    handler.ServeHTTP(rw, req)
}
```

```go
func (mux *ServeMux) ServeHTTP(w ResponseWriter, r *Request) {
	if r.RequestURI == "*" {
		if r.ProtoAtLeast(1, 1) {
			w.Header().Set("Connection", "close")
		}
		w.WriteHeader(StatusBadRequest)
		return
	}
	h, _ := mux.Handler(r)
	h.ServeHTTP(w, r)
}
```

这里的mux.Handler就通过路由的match来通过路径找到已注册的handler，上面的h就是我们自己写的方法本身

```go
func (mux *ServeMux) handler(host, path string) (h Handler, pattern string) {
	mux.mu.RLock()
	defer mux.mu.RUnlock()

	// Host-specific pattern takes precedence over generic ones
	if mux.hosts {
		h, pattern = mux.match(host + path)
	}
	if h == nil {
		h, pattern = mux.match(path)
	}
	if h == nil {
		h, pattern = NotFoundHandler(), ""
	}
	return
}
```

```go
func (mux *ServeMux) match(path string) (h Handler, pattern string) {
	// Check for exact match first.
	v, ok := mux.m[path]
	if ok {
		return v.h, v.pattern
	}

	// Check for longest valid match.  mux.es contains all patterns
	// that end in / sorted from longest to shortest.
	for _, e := range mux.es {
		if strings.HasPrefix(path, e.pattern) {
			return e.h, e.pattern
		}
	}
	return nil, ""
}
```

找到了handlerFunc之后直接进入到自己写的handleFunc之中去处理路径对应的业务逻辑

```go
func (f HandlerFunc) ServeHTTP(w ResponseWriter, r *Request) {
	f(w, r)
}
```

---
title: "RPC基础"
date: 2022-01-20T13:29:14+08:00
draft: false
categories: ["理论"]
tags: ["RPC", "分布式", "Golang"]
---


#### RPC的概念

RPC（Romote Procedure Call），全称是远程过程调用，作为分布式系统中不同节点之间的通信方式，是分布式系统的基石之一，RPC不是具体的方法，而是一种解决不同服务之间调用的设计。

基于RPC开发的框架可以称为RPC框架，典型的有谷歌的gRPC、阿里的Dubbo、Facebook的Thrift等，当然成熟的RPC框架还会有服务注册与发现、服务治理、负载均衡等功能。

#### 为何需要RPC

大公司的服务往往部署在不同的机器上，调用其他机器的服务如果每次都要走网络通信会给业务开发带来复杂，希望能够将网络通信进行封装，使得远程调用和本地调用一样简单，于是诞生了RPC。

RPC对应的一个概念就是本地调用，比如最常见的函数调用，当然远程调用比本地调用复杂的多。我们最终的目的就是通过封装调用的底层过程，让远程调用和本地调用一样方便，请求方调用服务方的某个方法就像是调用本地方法一样。

>为什么不采用基于HTTP的Restful api而采用RPC呢？
实际上，广义的RPC也包括了基于HTTP的Restful api，不过默认指的是中间传输形式为二进制流的跨机器通信方式。基于HTTP协议的restful api更通用、可读性更好，但是报文比较冗余，性能不如二进制传输的RPC。RCP更接近直接调用，也更容易拓展和集成一些功能（如注册中心、负载均衡等）应该视具体情况选择，对性能要求非常高的场景可以使用RPC。


#### RPC的核心问题

##### 寻址问题

如果是本地运行，直接可以获得函数的指针，但是远程的不行，一个方法是Server和Client分别维护一个函数<->call id的映射表。服务器需要将提供的服务接口进行注册，从而让请求方可以获取到。


##### 编码方式

比如常见的可读性高的JSON、XML或者性能更好的protobuf。

##### 序列化和反序列化

Client：
① tcp/http连接
② 对象结构数据序列化
③ 发送json
④ 等待结果
⑤ 解析结果，反序列化为需要的对象结构

Server：
① 监听对应端口
② 读取数据
③ 反序列化为需要的对象结构
④ 运行对应的函数处理
⑤ 序列化
⑥ 将结果传输返回

实际上解决好了之后，语言也不重要了，都可以使用不同的语言。

##### 网络传输协议

比如考虑tcp是用长连接还是短连接，http1.0中，对方返回结果之后，会自动断开，下次连接会比较慢。http2.0可以保持长连接，所以gRPC直接用了http2.0。
可以走http，也可以自己基于tcp协议封装一个长连接。

#### RPC的四个要素

##### Client

服务调用的发起方

##### Client Stub

用于存储要调用的服务器地址、以及将要请求的数据信息打包，通过网络请求发送给Server Stub，然后阻塞，直到接受到返回的数据，然后进行解析。

##### Server

Server，包含要调用的方法

##### Server Stub

用于接受Client Stub发送的请求数据包并进行解析，完成功能调用，最后将结果进行打包并返回给Client Stub。在没有接受到请求数据包时则处于阻塞状态。

封装了Client Stub和Server Stub后，从Client的角度来看，似乎和本地调用一样。从Server的角度看，似乎就是客户直接调用。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643108079/rpc-1.png)

#### RPC的具体通信步骤

1. Client以类似本地调用的方式调Client Stub
2. Client Stub序列化生成消息，然后调用本地操作系统的通信模块， Stub阻塞
3. 本地操作系统与远程Server进行通信，消息传输到远程操作系统
4. 远程操作系统将消息传递给Server Stub
5. Server Stub进行反序列化，然后调用Server的对应方法
6. Server程序执行方法，将结果传递给Server Stub
7. Server Stub将结果进行序列化，然后传递给Server操作系统
8. Server操作系统将结果传递给Client
9. Client操作系统将其交给Client Stub， Stub从阻塞状态恢复
10. Client Stub对结果进行反序列化，并将值返回给Client程序
11. Client程序获得返回结果

RPC就是把2-10步进行了封装。

![](https://pic1.zhimg.com/80/v2-619633f1a8ff09c38a0611b1a0d62afc_1440w.jpg)

一些RPC框架可以通过一个接口定义语言（IDL）定义接口和数据类型，然后自动生成各种语言的stub代码。

#### Go的RPC：net/rpc

##### 使用

Go语言的标准库也提供了一个简单的RPC实现:`net/rpc`

Go的RPC规则：**方法只能有两个序列化参数，其中第二个参数是指针类型，并且只能返回一个error类型，同时必须是公开的方法。**

即形式只能为：`func (t *T) MethodName(argType T1, replyType *T2) error`

其中第一个参数是调用者收到的参数，第二个参数是方法返回的参数。如果

RPC的Hello World：
（ip和端口可视情况调整，Server和Client可以在不同机器上运行）
```go
// Server.go
// 先声明Service结构
type helloService struct {}
// 定义一个方法，注意只能两个参数，第二个为指针，返回一个error
func (p *helloService) Hello(request string, reply *string) error  {
	*reply = "Hello, " + request
	return nil
}

func main()  {
  // 要注册一个名字
	_ = rpc.RegisterName("HelloService", new(helloService))
	// 采用tcp通信
	listener, err := net.Listen("tcp", ":1234")
	if err != nil {
		log.Fatal(err)
	}
	conn, err := listener.Accept()
	if err != nil {
		log.Fatal(err)
	}
	rpc.ServeConn(conn)
}
```

```go
// Client.go
func main() {
	Client, err := rpc.Dial("tcp", "192.168.50.174:1234")
	if err != nil {
		log.Fatal(err)
	}
	var reply string
	err = Client.Call("HelloService.Hello", "engine", &reply)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(reply)
}
```

做一些改进，一方面，Server应该是持续保持连接，并且支持多个Client共同连接，不能Client运行完就断开。另一方面，Client做一些封装，比较方便：
```go
// Server.go
//...
for {
  conn, err := listener.Accept()
  if err != nil {
    log.Fatal(err)
  }
  go rpc.ServeConn(conn)
}
```

```go
// Client.go
const HelloServiceName = "HelloService"

type HelloServiceClient struct {
	*rpc.Client
}

func HelloServiceDial(network, address string) (*HelloServiceClient, error) {
	Client, err := rpc.Dial(network, address)
	if err != nil {
		log.Fatal(err)
	}
	return &HelloServiceClient{Client: Client}, err
}

func (h *HelloServiceClient) Hello(request string, reply *string) error {
	return h.Client.Call(HelloServiceName+".Hello", request, reply)
}

func main() {
	hs, err := HelloServiceDial("tcp", "192.168.50.174:1234")
	if err != nil {
		log.Fatal(err)
	}
	var reply string
	err = hs.Hello("engine", &reply)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(reply)
}
```

标准库的rpc采用go语言特有的gob编码，如果需要跨语言的客户端，则可以采用一种通用的编码格式，比如json，Server端可以通过：
```go
// go rpc.ServeConn(conn)
go rpc.ServeCodec(jsonrpc.NewServerCodec(conn))
```

而客户端可以使用：
```go
conn, err := net.Dial("tcp", "localhost:1234")
if err != nil {
	log.Fatal("dial error", err)
}
client := rpc.NewClientWithCodec(jsonrpc.NewClientCodec(conn))
```

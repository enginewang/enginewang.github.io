---
title: "Go并发（四）WaitGroup源码剖析"
date: 2021-03-06T22:03:48+08:00
draft: false
categories: ["技术"]
tags: ["Golang", "并发"]
---

WaitGroup用于任务编排，解决并发-等待的问题。

试想一下，某个并发场景需要完成前置的几个协程任务才能完成另一个任务，如果没有WaitGroup、Channel等机制，可能需要轮询查看前置任务是否完成，非常浪费资源。

WaitGroup的作用是阻塞goroutine，并可以在特定的情况下唤醒。

## WaitGroup使用方式

WaitGroup包含三个方法：

```go
wg.Add(int)
wg.Done()
wg.Wait()
```

Add可以设置WaitGroup的计数值，一般放在前面写
Done用来将计数值-1，写在前置goroutine里
Wait会阻塞当前的goroutine，直到WaitGroup的计数值为0，写在需要等待的goroutine里，很多情况下是main goroutine。


```go
func say(s string, wg *sync.WaitGroup) {
    defer wg.Done()
    for i := 0; i < 5; i++ {
        time.Sleep(200 * time.Millisecond)
        fmt.Println(s)
    }
}

func main() {
    wg := new(sync.WaitGroup)
    wg.Add(2)
    go say("1", wg)
    go say("2", wg)
    wg.Wait()
}
```

比如使用WaitGroup后，可以确保主协程会在前面的goroutine结束之后才会继续。

## 基础

### nocopy字段

对于一些不应该被复制的结构体，可以在里面增加`nocopy`字段，它的底层是：

```go
type noCopy struct{}

// Lock is a no-op used by -copylocks checker from `go vet`.
func (*noCopy) Lock() {}
func (*noCopy) UnLock() {}
```

用`go vet`检测就会报错。

```go
Copy passes lock by value: main.Demo contains main.noCopy
```

## 源码解析

```go
type WaitGroup struct {
  noCopy noCopy

  // 前两个元素作为state，后一个元素作为信号量
  // 第一个是当前阻塞的goroutine个数，第二个是WaitGroup计数值，第三个是信号量
  // 对于32bit和64bit系统，字段有些许差别，后面有代码表示，这里不作讨论
  state1 [3]uint32
}
```

```go
func (wg *WaitGroup) Add(delta int) {
  // 获取state和信号量
  statep, semap := wg.state()
  // 高32bit是计数值，所以把delta左移32位加到WaitGroup计数值上
  state := atomic.AddUint64(statep, uint64(delta)<<32)
  // 当前计数值
  v := int32(state >> 32)
  // 等待者数量
  w := uint32(state)
  // 计数值大于0或者w等于0，直接正常的返回
  if v > 0 || w == 0 {
    return
  }
  // 接下来的情况就是计数值等于0，但是还有等待者的情况，此时等待的已经没有意义
  // 比如说一开始只设了wg.Add(3)，结果启动了五个goroutine里面都有Done，Done了三次之后，剩下的两个协程不会等它们执行完了。
  // 直接把组合的statep设为0（v和w都设为0）
  *statep = 0
  for ; w != 0; w-- {
    runtime_Semrelease(semap, false, 0)
  }
}
```

```go
func (wg *WaitGroup) Done() {
  wg.Add(-1)
}
```

```go
// 一直阻塞，直到state的计数值=0
func (wg *WaitGroup) Wait() {
  statep, semap := wg.state()
  for {
    state := atomic.LoadUint64(statep)
    v := int32(state >> 32)
    w := uint32(state)
    // 如果为0.直接返回
    if v == 0 {
      return
    }
    // 否则阻塞
    if atomic.CompareAndSwapUint64(statep, state, state+1) {
      runtime_Semacquire(semap)
      return
    }
  }
}
```

## WaitGroup的易错场景

### Add一个负数

除非能保证Add负数之后计数器仍大于0，否则会panic。一般不会Add负数，都通过Done的方式来-1。

另一种就是Done的次数过多，这样会导致减到负数之后直接导致panic。

### Add在Wait之后调用

如果在一些子goroutine里面开头调用`Add`，结束调用`Done`，然后主协程`Wait`，会出现`Add`在`Wait`之后的情况，那么`Wait`不会被这些自协程阻塞，这些自协程很可能得不到执行。

### 未置为0就重用

WaitGroup可以完成一次编排任务，计数值降为0后可以继续被其他任务所用，但是不要在还没使用完的时候就用于其他任务，这样由于带着计数值，很可能出问题。

### 自产自销

```go
var wg sync.WaitGroup
for i:=0; i < 3; i++{
    go func() {
        wg.Add(1)
        defer wg.Done()
        fmt.Println(i)
    }()
}
wg.Wait()
```
输出是什么？大概率是什么也不会输出，或者输出0，基本不会正常输出012的排列，原因在于`wg.Add()`不应该加在goroutine里面而是应该在外面，如果像这样加在里面，实际上for循环结束之后，还没等`wg.Add(1)`开始，`wg.Wait()`就不阻塞了。

那么我们修改成下面的形式就对了吗？

```go
var wg sync.WaitGroup
for i:=0; i < 3; i++{
    wg.Add(1)
    go func() {
        defer wg.Done()
        fmt.Println(i)
    }()
}
wg.Wait()
```

最后的输出更加离谱，是`333`。
事实上，通常在进入第一个goroutine的时候，for循环就已经遍历完了，这个时候i的值就已经加到了3

如果想要正确的结果，就应该将i作为匿名函数的参数：

```go
var wg sync.WaitGroup
for i:=0; i < 3; i++{
    wg.Add(1)
    go func(i int) {
        defer wg.Done()
        fmt.Println(i)
    }(i)
}
wg.Wait()
```

### 作为参数的wg

wg是不能被复制的！

看下面的代码：

```go
func f1(wg sync.WaitGroup) {
    defer wg.Done()
}

func main() {
    var wg sync.WaitGroup
    wg.Add(1)
    go f1(wg)
    wg.Wait()
}
```

乍一看似乎没问题，但是会报死锁：
```go
fatal error: all goroutines are asleep - deadlock!
```

问题就出在参数wg，WaitGroup内部维护了计数，不允许被copy，WaitGroup的结构：

```go
type WaitGroup struct {
	noCopy noCopy

	// 64-bit value: high 32 bits are counter, low 32 bits are waiter count.
	// 64-bit atomic operations require 64-bit alignment, but 32-bit
	// compilers do not ensure it. So we allocate 12 bytes and then use
	// the aligned 8 bytes in them as state, and the other 4 as storage
	// for the sema.
	state1 [3]uint32
}
```

![waitGroup-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1646219952/waitGroup-1.jpg)

---
title: "Go并发（二）Mutex源码剖析"
date: 2021-02-06T22:03:48+08:00
draft: false
categories: ["技术"]
tags: ["Golang", "并发"]
---

## 基本并发原语

接下来的几节将会解析Go的这几个基本并发原语（同步原语）：Mutex、RWMutex、WaitGroup、Cond、Channel

为什么要用并发原语？
- 共享资源保护（通常用Mutex、RWMutex）
- 任务编排，需要goroutine按照一定规律执行（通常用WaitGroup、Channel）
- 消息传递，不同goroutine之间的消息传递（通常用Channel）

本篇要说的Mutex互斥锁是go中使用最广泛的并发原语（或者叫同步原语）。

## Mutex使用方式

Mutex互斥锁的使用方式很简单：

```go
var mu sync.Mutex
// 进入临界区之前先上锁
mu.Lock()
/*
=====================
 一些需要保护的临界区
=====================
*/
// 退出临界区之后要解锁
mu.Unlock()
```
更多的时候是嵌入到struct里，比如并发安全的计数器：

```go
type Counter struct{
  mu sync.Mutex
  Count int
}
```

如果嵌入struct中，比较好的编程风格是把Mutex字段放在需要被控制的字段的上面一个，这样比较清晰。这个结构的实例如果访问了共享资源，可以：

```go
func (c *Counter) Add(i int){
  c.mu.Lock
  defer c.mu.Unlock
  c.Count += i
}
```

Mutex不需要初始化，不会出现空指针或者获取不到锁的情况。

Mutex可以被任意一个goroutine释放锁，如果不是当前拿锁的goroutine释放锁的话就会带来严重的问题。所以务必要遵守**谁申请谁释放**的原则

另外，还要注意**Lock和Unlock成对出现**有的时候可能有一些复杂的分支，一些分支会漏写`Unlock()`，或者删除代码的时候误删等，从而造成死锁。

所以更好的方式是采用defer的方式，让Lock和Unlock总是紧凑的成对出现，以免后面忘记Unlock：
```go
mu.Lock()
defer mu.Unlock()
// 访问共享资源的操作
```

Mutex不能被复制，需要用到一个新的Mutex直接初始化，如果复制了可能会带着之前的状态，从而造成问题。

Mutex不可重入，关于重入，有些语言（如Java）支持，即一个进程获取到了锁之后，再次获取这个锁可以成功，其他进程会被阻塞。但是Mutex不支持重入，因为它不会检测哪个goroutine拥有这把锁。也就是说不能两次获取同一把锁。


## Mutex原理基础

### Mutex演进

最初的Mutex只是普通实现了抢锁、阻塞、释放锁等流程。
之后逐渐加入了：
1. 让新加入的goroutine有更多机会获取到锁
2. 让新来的和唤醒的有更多机会竞争锁
3. 解决饥饿问题，不会让goroutine阻塞太久

当一个锁被释放后，如果有多于一个协程的都在获取这个锁，锁最终会按照FIFO的原则给排队中的协程。

单纯的FIFO虽然公平但是效率不高，对于刚刚排到队刚唤醒的gorourine和新到的goroutine相比，新来的goroutine已经在CPU上运行，上下文切换会降低效率，所以新来的会和刚唤醒的goroutine对锁进行竞争。而不是直接把醒来的goroutine放到队尾。

但是这么做可能会造成饥饿，因此如果等待者在1ms之内没有获取到锁，将会从正常模式切换到饥饿模式。

### Mutex的两种模式：正常模式和饥饿模式。

正常模式下，等待的goroutine按照FIFO的顺序排队，刚唤醒的等待者与新来的goroutine进行竞争，因为新来的goroutine可能有很多。如果有等待者等待了1ms以上，就进入饥饿模式。
饥饿模式下，Mutex的所有权严格按照FIFO依次交出，新到达的goroutine不再尝试获取Mutex，也不会自旋。它们只是会排队在末尾。

如果等待者发现它是队列的最后一个等待者，或者它等待了不到1ms，那么就切换为正常模式。
正常模式的性能很好，但是饥饿模式有必要性，否则可能出现goroutine饿死的情况。

### 自旋锁

自旋这个概念也有很多很重要的应用，后面讲并发调度底层原理的时候也会提到，等待CPU调度的时候也一样有这种自旋的概念，这里先解释一下，不然后面源码看不懂。

自旋锁指的是一个线程在获取锁的时候，如果锁已经被其他线程获取，那么该线程会循环等待，不断判断是够能够被成功获取，一旦能获取到锁才会退出循环。自旋锁不会引起调用者的睡眠。

Mutex的源码出现了`sync_runtime_canSpin`和`sync_runtime_doSpin`这两个自旋锁有关的函数，由于其源码涉及到了最底层的并发原理，将放到后面再讲，这里先理解一下两个函数的作用。

`sync_runtime_canSpin`：返回目前自旋是否有意义。

`sync_runtime_doSpin`：开始自旋。

### 信号量

信号量机制（semaphore）在很多地方都有应用，在操作系统中也学习过，见之前的[操作系统基础（二）进程与线程](https://blog.engine.wang/posts/os-basics-thread/)

sema提供了`sleep`和`wakeup`的并发原语。

Mutex的源码出现了`sync_runtime_SemacquireMutex`和`poll_runtime_Semrelease`这两个信号量相关的函数，这里只理解一下函数的作用：

`sync_runtime_SemacquireMutex`：对当前锁进行sleep，阻塞自己

`poll_runtime_Semrelease`：唤醒sleep的锁，

## Mutex源码解析

### 变量

`sync/mutex`的源码只有两百行（去掉注释只有一百来行），当然其中更底层的是原子包（源码位于`sync/atomic.go`）、自旋锁（源码位于`runtime/proc.go`）、信号量（源码位于`runtime/sema.go`），这几个之后再讨论，先看`sync/mutex.go`。

`Locker`接口，`Locker`接口有两个方法`Lock()`和`Unlock()`，只要实现了这两个方法就属于Locker类，Mutex就是实现了`Locker`的接口。

```go
type Locker interface{
  Lock()
  Unlock()
}
```

```go
type Mutex{
  // state，这一个字段包含了多种数据，下面细说
  state int32
  // 等待者队列的信号量变量，用以阻塞或唤醒goroutine
  sema uint32
}
```

state是一个字段，前三个比特分别表示mutexLocked、mutexWoken和mutexStarving，剩余的bit表示mutexWaiter

```go
// state的各个字段的意义
const (
  // 上锁状态，1
  mutexLocked = 1 << iota // mutex is locked
  // 唤醒状态，2
  mutexWoken
  // 饥饿状态，4
  mutexStarving
  // mutex上阻止的goroutine个数，3
  mutexWaiterShift = iota
  starvationThresholdNs = 1e6
)
```

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645951599/mutex-2.jpg)


### Lock方法

首先看`Lock()`方法：
```go
func (m *Mutex) Lock() {
  // 通过atomic提供的CAS原子操作
  // 如果m.state是0，表示当前锁是空闲的
  // 可以获取到锁，把自己的状态设为mutexLocked（state=1）
  if atomic.CompareAndSwapInt32(&m.state, 0, mutexLocked) {
    if race.Enabled {
      race.Acquire(unsafe.Pointer(m))
    }
    return
  }
  // 当前锁被持有，调用lockSlow，尝试通过自旋竞争或者饥饿goroutine竞争
  m.lockSlow()
}
```

如果不能直接抢到锁就切换为`lockSlow`的方法获取锁：

```go
func (m *Mutex) lockSlow() {
  // 请求的初始时间
  var waitStartTime int64
  // 饥饿标记
  starving := false
  // 唤醒标记
  awoke := false
  // 自旋次数
  iter := 0
  // 当前锁的状态
  old := m.state
  for {
    // 锁未被释放，且非饥饿状态，尝试自旋
    // 这里为了效率用的位运算，不过会难读一点
    // mutexLocked = 1，mutexStarving = 100，mutexLocked|mutexStarving = 101
    // old & 101 == 1，也就是说old是0?1，也就是说是locked状态，而且非饥饿
    if old&(mutexLocked|mutexStarving) == mutexLocked && runtime_canSpin(iter) {
      // 一直自旋，直到发现锁被释放，awoke设为true，唤醒
      if !awoke && old&mutexWoken == 0 && old>>mutexWaiterShift != 0 &&
        atomic.CompareAndSwapInt32(&m.state, old, old|mutexWoken) {
        awoke = true
      }
      // 否则就自旋
      runtime_doSpin()
      // 自旋迭代次数+1
      iter++
      // 更新状态到old里
      old = m.state
      continue
    }

    new := old
    // 如果old状态非饥饿，就设置为上锁状态
    if old&mutexStarving == 0 {
      // |=位运算，可以将mutexLocked位置置1，也就是加锁
      new |= mutexLocked
    }
    // 如果mutex状态是饥饿，那新来的goroutine直接插入队尾，不会自旋也不会抢锁
    if old&(mutexLocked|mutexStarving) != 0 {
      // 等待者数量+1
      new += 1 << mutexWaiterShift
    }
    // 如果当前没上锁，而且处于饥饿状态，就设置为饥饿状态
    if starving && old&mutexLocked != 0 {
      new |= mutexStarving
    }
    // 如果被唤醒了
    if awoke {
      if new&mutexWoken == 0 {
        throw("sync: inconsistent mutex state")
      }
      // 新状态清除唤醒标记
      new &^= mutexWoken
    }
    // 成功设置新状态
    if atomic.CompareAndSwapInt32(&m.state, old, new) {
      // 正常请求到了锁，结束循环
      if old&(mutexLocked|mutexStarving) == 0 {
        break
      }
      // 如果之前就在队列里，就加入到队列头
      queueLifo := waitStartTime != 0
      if waitStartTime == 0 {
        waitStartTime = runtime_nanotime()
      }
      // 阻塞等待
      runtime_SemacquireMutex(&m.sema, queueLifo, 1)
      // 唤醒之后检查是否应该处于饥饿状态
      starving = starving || runtime_nanotime()-waitStartTime > starvationThresholdNs
      old = m.state
      // 如果饥饿
      if old&mutexStarving != 0 {
        if old&(mutexLocked|mutexWoken) != 0 || old>>mutexWaiterShift == 0 {
          throw("sync: inconsistent mutex state")
        }
        // 加锁并将等待者数量-1
        delta := int32(mutexLocked - 1<<mutexWaiterShift)
        if !starving || old>>mutexWaiterShift == 1 {
          // 退出饥饿模式
          delta -= mutexStarving
        }
        atomic.AddInt32(&m.state, delta)
        break
      }
      awoke = true
      iter = 0
    } else {
      old = m.state
    }
  }

  if race.Enabled {
    race.Acquire(unsafe.Pointer(m))
  }
}
```

### Unlock方法

Unlock比Lock的代码稍微简单一点

```go
func (m *Mutex) Unlock() {
  if race.Enabled {
    _ = m.state
    race.Release(unsafe.Pointer(m))
  }
  // 去掉锁标志
  new := atomic.AddInt32(&m.state, -mutexLocked)
  if new != 0 {
    m.unlockSlow(new)
  }
}
```

```go
func (m *Mutex) unlockSlow(new int32) {
  // 没有加锁的情况下释放了锁，报错
  // 也就是此时new=-1，new+mutexLocked=0，(new+mutexLocked)&mutexLocked = 0
  if (new+mutexLocked)&mutexLocked == 0 {
    throw("sync: unlock of unlocked mutex")
  }
  // 如果不是饥饿状态的话
  if new&mutexStarving == 0 {
    old := new
    for {
      // 如果没有等待者了，可以直接返回
      if old>>mutexWaiterShift == 0 || old&(mutexLocked|mutexWoken|mutexStarving) != 0 {
        return
      }
      // 有等待者的话，并且当前没有唤醒的等待者，就唤醒一个
      new = (old - 1<<mutexWaiterShift) | mutexWoken
      if atomic.CompareAndSwapInt32(&m.state, old, new) {
        runtime_Semrelease(&m.sema, false, 1)
        return
      }
      old = m.state
    }
  } else {
    // 如果是饥饿状态，直接交给下一个等待者，新来的goroutine不会获得锁
    runtime_Semrelease(&m.sema, true, 1)
  }
}
```

## Mutex的易错场景

### Lock和Unlock不成对出现

如果只有Lock没有Unlock，那么永远都无法解锁，造成死锁，全部饿死。

如果没有Lock就Unlock，则会panic。

最不要在前面Lock，在if里Unlock，逻辑复杂的时候容易出问题。

最好是
```go
mu.Lock()
defer mu.Unlock()
```

### 复制mutex

Mutex不可以被复制，它的state包含状态，在并发的环境下根本不知道当前状态是什么，如果要一个新的Mutex就new一个初始化为0的Mutex。

### 重入

锁的重入指的是重复加锁，比如一个线程获取到了锁，之后其他线程获取这个锁只能阻塞，此时如果这个线程又获取一次这个锁，那么会直接成功返回，这样的锁就是可重入锁。

但是**Mutex不是可重入锁**，所以不可以重入，因为Mutex并没有记录哪个goroutine拥有了这把锁。

当然如果要把go的Mutex改造成可重入的也很简答，只要建立一个结构体，封装Mutex、goroutine的标识、重入次数，

goroutine的标识可以采用goroutine id，或者自己生成一个唯一的token。

## Mutex拓展

理解好源码之后，可以开发一些拓展功能。

比如发现锁被占用了直接reture false而不是排队阻塞，比如获取等待者的数量，直接通过unsafe把state字段里的等待者数量抽出来。

还可以通过引入Mutex实现线程安全的各种数据结构。


![mutex-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645951622/mutex-1.png)

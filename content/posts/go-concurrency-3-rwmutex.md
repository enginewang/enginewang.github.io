---
title: "Go并发（三）RWMutex源码剖析"
date: 2021-02-19T22:03:48+08:00
draft: false
categories: ["技术"]
tags: ["Golang", "并发"]
---

RWMutex专门用于解决读写问题。

## RWMutex使用方式

方法有五个：
`Lock`：写操作调用，如果锁被写或读占用，会阻塞，如果拿到了锁，其他的读写都会阻塞
`Unlock`：写操作调用。释放writer的锁。
`RLock`：读操作调用，如果锁被写占用，会阻塞，否则就不会
`RUnlock`：读操作调用。释放reader的锁。
`RLocker`：返回一个读操作的接口，它的`Lock`方法会调`RLock`，`Unlock`会调`RUnlock`

使用举例，比如一个可以自增和读的计数器，其中读的频率更高。

对于这种情况，我们用Mutex的话会损失性能，因为并发读是允许的，所以采用`RWMutex`更好。

```go
type Counter struct {
  mu    sync.RWMutex
  Count int
}

func (c *Counter) Incr() {
  c.mu.Lock()
  defer c.mu.Unlock()
  c.Count++
}

func (c *Counter) Read() int {
  c.mu.RLock()
  defer c.mu.RUnlock()
  return c.Count
}

func main() {
  var c Counter
  for i := 0; i < 10; i++ {
    go func() {
      for {
        time.Sleep(time.Second)
        fmt.Println(c.Read())
      }
    }()
  }
  for {
    c.Incr()
    time.Sleep(time.Second)
  }
}
```

## RWMutex原理基础

已经有了Mutex，为什么还要RWMutex？因为对于并发读的场景，实际上没必要加锁，加锁会影响性能。

也就是说如果当前一个读操作的goroutine持有了锁，对于其他的读操作的goroutine而言，无需等待，可以并发访问变量。

当然对于写操作，必须独占锁，写完之后才能继续读或写。

RWMutex同一时间可以被任意数量的Reader持有，或者被单个的Writer持有。

读写问题一般有三种方式：

1. 读优先

2. 写优先

3. 不指定优先级

RWMutex采用写优先的策略，也就是说一旦有一个writer在请求锁的话，新来的reader不会获取锁。writer会等到来的时候存在的reader读完就开始写，保证writer不会饥饿。

RWMutex基于Mutex实现，所以代码容易很多，相当于在Mutex的基础上做了一个变体。

## 源码解析

```go
type RWMutex struct {
  // 互斥锁，解决多个writer的竞争
  w           Mutex
  // writer信号量
  writerSem   uint32
  // reader信号量
  readerSem   uint32
  // reader数量
  readerCount int32
  // 对于reader正在读的场景，记录当前正在读的reader的数量，也就是writer要等待的reader的数量
  readerWait  int32
}
// 支持的最大的reader数量，2^30个
const rwmutexMaxReaders = 1 << 30
```

这样设计的原因在于，writer的个数是无所谓的，因为都通过Mutex进行完全的互斥，但是reader的个数很关键。

没有writer竞争或持有锁的时候，readerCount就是reader的个数，如果有的话就是一个负数。

先看`RLock`，也就是读的锁，什么时候会阻塞读？就是在有writer在等锁的时候。

```go
func (rw *RWMutex) RLock() {
  // 先给readerCount+1
  // 如果结果是负值，说明有writer竞争或持有锁
  // 见后面writer的lock方法，一旦有writer拿到了写锁，readerCount就会被置为readerCount-rwmutexMaxReaders，也就是非常小的负数
  if atomic.AddInt32(&rw.readerCount, 1) < 0 {
    // 阻塞读
    runtime_SemacquireMutex(&rw.readerSem, false, 0)
  }
}
```

```go
func (rw *RWMutex) RUnlock() {
  // readCount-1，如果有writer竞争，就调用rUnlockSlow
  if r := atomic.AddInt32(&rw.readerCount, -1); r < 0 {
    rw.rUnlockSlow(r)
  }
}

func (rw *RWMutex) rUnlockSlow(r int32) {
  if atomic.AddInt32(&rw.readerWait, -1) == 0 {
    // 如果reader都释放了锁，就唤醒writer，把锁给writer
    runtime_Semrelease(&rw.writerSem, false, 1)
  }
}
```

writer通过`Mutex`保持互斥，通过`Lock`和`Unlock`加锁和释放锁：

```go
func (rw *RWMutex) Lock() {
  // writer之间的互斥
  rw.w.Lock()
  // 通知其他reader，有writer在等锁，把readerCount置为很小的负数
  r := atomic.AddInt32(&rw.readerCount, -rwmutexMaxReaders) + rwmutexMaxReaders
  // 当前的reader没读完，阻塞写
  if r != 0 && atomic.AddInt32(&rw.readerWait, r) != 0 {
    runtime_SemacquireMutex(&rw.writerSem, false, 0)
  }
}
```


```go
func (rw *RWMutex) Unlock() {
  // 通知reader当前的writer写完了
  r := atomic.AddInt32(&rw.readerCount, rwmutexMaxReaders)
  // 唤醒阻塞的reader
  for i := 0; i < int(r); i++ {
    runtime_Semrelease(&rw.readerSem, false, 0)
  }
  // 释放写锁，其他writer可以来拿
  rw.w.Unlock()
}
```

## RWMutex的易错场景

### 不可复制

因为包含了Mutex，其他字段也有状态意义，所以RWMutex肯定也是不能复制的。

### 释放没加锁的RWMutex

和前面的Mutex一样

### 重入导致死锁

和Mutex一样

### reader调用writer导致死锁

比如在reader方法里调用writer，由于writer必须等待活跃reader完成，相当于自己锁自己。

### 环形依赖导致的死锁

writer需要等待活跃的reader完成读
新来的reader会等待writer
如果活跃的reader调用新来的reader，那么就会环形依赖导致死锁。


![RWMutex-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1646219904/RWMutex-1.jpg)

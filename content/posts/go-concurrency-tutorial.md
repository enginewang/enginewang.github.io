---
  title: "Golang并发教程"
  date: 2020-09-15T23:35:12+08:00
  draft: false
  categories: ["工程"]
  tags: ["并发", "Golang", "精选"]
---

Go的并发调度非常优雅，将极其复杂的运行机制隐藏在了一个简单的关键字`go`下面，这篇文章不涉及底层并发调度的细节，之后有空再写，这里只是讲解一下如何使用go来编写一些简单的并发语句。

#### goroutine

只需要在函数前面加上go关键词就可以开启goroutine，Go就会新创建一个goroutine来执行这个函数

```go
package main

import (
	"fmt"
	"time"
)

func say(s string) {
	for i := 0; i < 3; i++ {
		time.Sleep(100 * time.Millisecond)
		fmt.Println(s)
	}
}


func main() {
	go say("routine1")
	go say("routine2")
	say("main")
}
```

output:
```bash
routine1
routine2
main
main
routine1
routine2
main
routine2
```

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1641817507/goroutine1.png)


最多可以同時执行CPU线程数相等的Goroutine

GoRoutine的优点：
1. 任何函数，前面加一个go关键字就可以送给调度器运行
2. 不需要定义函数时声明是否为异步函数
3. 调度器会在合适的时间点进行切换
4. 使用-race可以检测数据访问冲突

#### channel

通道是一个用来传递数据的数据结构

可以用于两个goroutine之间传递数据

```go
// v发送到通道ch
ch <- v
// 从ch接受数据把值赋给v
v := <- ch
```

声明通道
```Python
ch := make(chan int)
```

通道默认没有缓冲区，发送数据后需要设置接收端来接受响应的数据

比如下面这个例子，并行计算前面一半数据和后面一半数据的和，然后等它们都计算好了，把它们加起来

```go
package main

import "fmt"

func sum(s []int, c chan int) {
        sum := 0
        for _, v := range s {
                sum += v
        }
        c <- sum // 把 sum 发送到通道 c
}

func main() {
        s := []int{7, 2, 8, -9, 4, 0}

        c := make(chan int)
        go sum(s[:len(s)/2], c)
        go sum(s[len(s)/2:], c)
        x, y := <-c, <-c // 从通道 c 中接收

        fmt.Println(x, y, x+y)
}
```

output:
```bash
-5 17 12
```

创建了两个goroutine，分别运算前一半和后一半的和，结果会存进通道中，然后通过`x, y := <-c, <-c`从c中取出这两个结果。这里x和y并不能确定哪个是前一半的结果。

因为这里我们没有声明channel的缓冲区，默认是1，如果我们不取出来，只有

##### 通道缓冲区

在创建通道的时候可以在第二个参数声明一个缓冲区，比如我们要声明一个大小为100的缓冲区

`ch := make(chan int, 100)`

**假如没有缓冲区，发送方会一直阻塞到接收方接受了通道中的值；
假如带了缓冲区，缓冲区还没满，发送方阻塞到数据被拷贝到缓冲区内；
假如带了缓冲区，缓冲区已经满了，则发送方会阻塞到接收方获取到一个值；
如果运行到了接收的代码，但是通道内没有元素，则接收方会一直阻塞，直到发送方完成后代码才会继续进行。**

我们就可以同时发送多个数据，而不需要立即读取


```go
func main() {
    // 这里我们定义了一个可以存储整数类型的带缓冲通道
        // 缓冲区大小为2
        ch := make(chan int, 2)

        // 因为 ch 是带缓冲的通道，我们可以同时发送两个数据
        // 而不用立刻需要去同步读取数据
        ch <- 1
        ch <- 2

        // 获取这两个数据
        fmt.Println(<-ch)
        fmt.Println(<-ch)
}
```


取出的时候第二个参数指示了是否结束，比如`v, ok := <-ch`，当取通道内的最后一个元素，ok就会置为0
还可以通过`for i := range c`直接取尽通道中的元素

> 举例：多线程爬虫
给定一个url列表，进行多线程爬取。

思路：先构造一个`crawler`函数，该函数将并行运行，爬取这个url并将结果存入通道。在`main`函数中for循环遍历然后go关键词调用`crawler`函数并行。最后取出channel的元素。

#### 等待

等待是非常重要的一个内容

在我们最开始写第一个goroutine代码的时候，会遇到这样一种情况

```go
func main() {
	go say("1")
	go say("2")
}
```

以为会打印出1 2，然而实际情况是直接`Process finished with exit code 0`，但是并没有报错

造成这个的原因在于，这个状态下有三个goroutine：
`main`
`say("1")`
`say("2")`

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1641817507/goroutine2.png)


main结束之后，另外两个goroutine被强制关闭，导致没有打印出来，之所以下面的

```go
func main() {
	go say("1")
	go say("2")
	say("3")
}
```
没有问题，是因为main在执行到`say("3")`的时候，前面的goroutine已经开始了，因为是同一个函数形式，执行时间差不多，所以当`say("3")`执行完后，前面的goroutine有可能也执行完了，这也就是为什么这个代码有时候可以打印出`1` `2`的原因，其实每次打印的元素个数都可能不会相等，这取决于前面两个goroutine是否能在main线程结束前执行完。

所以实际上我们要做的，就是让main等待上面的goroutine执行完之后再结束

##### 方法1：`time.Sleep`

设定一个固定的时间，让main等待一段时间

比如把原来的改成

```go
func main() {
	go say("1")
	go say("2")
	time.Sleep(5 * time.Second)
}
```

这样就能正常执行上面的goroutine了

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1641817507/goroutine3.png)


优点：很简单
缺点：不好控制具体的时间，长了浪费，短了没执行完


##### 方法2：`sync.WaitGroup`


![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1641817507/goroutine4.png)


在开始的时候创建一个和goroutine个数一样的waitGroup队列计数器，main线程在waitGroup不为空的情况下持续阻塞。
在每个goroutine结束之后调用waitGroup.Done()，从等待队列中减一，在所有的goroutine执行完之后，main线程停止等待，结束整个程序


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

优点：执行完全部的goroutine后，main才会结束。时间把握的很好。
缺点：需要手动配置waitGroup

##### 方法3：Channel等待

就是我们之前提到的Channel通道，它除了可以进行goroutine间通信，同样也可以作为等待的方法

接受方会一直阻塞，直到接受到发送方传来的数据

```go
func say(s string, c chan string) {
	for i := 0; i < 5; i++ {
		time.Sleep(200 * time.Millisecond)
		fmt.Println(s)
	}
	c <- "FINISH"
}

func main() {
	ch := make(chan string)
	go say("1", ch)
	go say("2", ch)
	<-ch
	<-ch
}
```

output:
```bash
1
1
2
1
2
1
2
1
2
2
```

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1641817507/goroutine5.png)


假如我们把上面的`<-ch`放在两个goroutine之间：
```go
func main() {
	ch := make(chan string)
	go say("1", ch)
	<-ch
	go say("2", ch)
	<-ch
}
```

当main执行到第一个`<-ch`时，接收方阻塞，等待发送方（第一个say goroutine）的传入，当第一个goroutine执行完之后，执行`<-ch`，然后再开启下一个goroutine，所以最后的输出是：
```bash
1
1
1
1
1
2
2
2
2
2
```

用时间轴来表示就是

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1641817507/goroutine6.png)


优点：时序控制把握很好，语法很简洁
不过相对前面的方法，理解会稍微抽象一点


我们最常用的还是Channel的方式

#### 数据同步、互斥

在不同的线程之间涉及到处理相同数据的时候，两个routine执行的顺序会影响到结果的变化，为了保证正确性，需要引入互斥锁

Go提供了sync.Mutex的互斥锁类型，以及两个方法：Lock和Unlock


#### 实战

1. 生产者消费者模型：

注意，如果没有wg，那么消费者在消费完生产者生产的数据后还会一直等待，go就会判定为死锁。一个解决方法就是对于生产者增加一个WaitGroup，需要在调用并行的生产者方法之前就Add(1)，如果放在goroutine内部可能会直接触发掉`wg.Wait()`然后被关掉，wg在生产者方法最后Done掉。再增加一个goroutine来等待wg，如果`wg.Wait()`触发了则说明生产者生产完了，这个时候可以关掉通道，从而让消费者不会阻塞

```go
func producer(out chan int, num int, wg *sync.WaitGroup) {
	for i := 0; i < num; i++ {
		out <- i
	}
	wg.Done()
}

func consumer(in chan int, done chan string) {
	for i := range in {
		fmt.Println(i)
	}
	done <- "finish"
}

func ProducerConsumerRun() {
	var ch = make(chan int, 5)
	var done = make(chan string)
	var wg sync.WaitGroup
	for i := 0; i < 10; i++{
		wg.Add(1)
		go producer(ch, i, &wg)
	}
	go consumer(ch, done)
	go func() {
		wg.Wait()
		close(ch)
	}()
	<-done
}
```

（未完待续）

参考：

https://tour.go-zh.org/concurrency

https://www.runoob.com/go/go-concurrent.html

https://peterhpchen.github.io/2020/03/08/goroutine-and-channel.html

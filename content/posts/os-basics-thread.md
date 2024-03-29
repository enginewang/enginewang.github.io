---
title: "操作系统基础（二）进程与线程"
date: 2020-01-20T14:29:59+08:00
draft: false
categories: ["技术"]
tags: ["OS"]
---

本部分主要包括四个模块：进程与线程的概念、处理机调度算法、进程同步和死锁问题

## 一、进程与线程

### 进程

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645944201/os-thread-0.png)


进程是进程实体的运行过程。是系统进行资源分配和调度的一个独立单位。

进程包含运行时的所有信息，不仅仅包含程序代码，还包括当前活动，通过程序计数器和处理器寄存器的内容来表示；另外还经常包括堆栈端和数据段，还有可能包括堆

正文段：包括全局变量、常量等
数据栈段：局部变量、传递的实参等
数据堆段：被分配的内存
PCB：进程自身的一些信息

程序不是进程，程序是被动实体，进程是活动实体，当一个可执行文件被装入内存时，一个程序才可能成为进程。同一个程序也可以通过创建副本而成为多个独立的进程

进程控制块 (Process Control Block, PCB) 描述进程的基本信息和运行状态，所谓的创建进程和撤销进程，都是指对 PCB 的操作。

**PCB是进程存在的唯一标志，动态性是进程最基本的特征。**

（下图显示了 4 个程序创建了 4 个进程，这 4 个进程可以并发地执行。）

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645944201/os-thread-1.png)

进程是由多程序的并发执行而提出的，和程序是截然不同的概念，进程的特点如下：
（了解即可）

1. 动态性，有动态的地址空间，有生命周期（后面有图），动态产生、变化和消亡，最基本的特征
2. 并发性，多个进程实体能在一段时间内同时运行，引入进程的目的就是为了并发
3. 独立性，各进程地址空间相互独立
4. 异步性，各进程按照各自独立、不可预知的速度向前推进
5. 结构性，程序段、数据段、PCB

#### 进程和程序的区别

- 程序是静态的，进程是动态的（算一个根本区别）
- 程序是有序代码的集合，进程是程序的执行
- 程序是永久的，进程是暂时的
- 进程包括程序、数据和PCB
- 通过多次执行，一个程序可以对应多个进程；通过调用关系，一个进程可以包括多个程序


### 进程状态的切换 ★

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645944201/os-thread-2.png)

最重要的一条是从就绪到运行

- 就绪状态：等待被调度，进程已经获得了除了处理机之外的一切所需资源
- 运行状态：进程正在处理机上运行，对于单CPU而言，同一时间运行的进程只能有一个
- 等待状态：等待资源或等待I/O，即使处理机空闲也无法运行
- 新的状态：进程正在被创建，尚未转化到运行状态

应该注意以下内容：

- 只有就绪态和运行态可以相互转换，其它的都是单向转换。就绪状态的进程通过调度算法从而获得 CPU 时间，转为运行状态；而运行状态的进程，在分配给它的 CPU 时间片用完之后就会转为就绪状态，等待下一次调度。
- 不能从等待直接到运行，因为在等I/O，给CPU也没有。不能从就绪到等待，因为就绪只缺CPU，别的都不缺，给了也没用。
- 等待状态是缺少需要的资源从而由运行状态转换而来，但是该资源不包括 CPU 时间，缺少 CPU 时间会从运行态转换为就绪态。
- 某个时间点上等待只能等一个资源

### 进程间通信

不和其他任何进程共享数据的进程是独立的，如果互相有意向那么该进程是协作的

有许多理由：
1. 信息共享
2. 提高运算速度
3. 模块化
4. 方便


进程之间交换数据不能通过访问地址空间，因为进程各自的地址空间是私有的

PV操作是低级进程通信方式，高级进程通信方式包括：**共享内存、消息传递、管道通信、共享文件**

共享内存比消息传递快，它可以达到内存的速度，要求通信进程共享一些变量，进程通过使用这些变量来共享信息、主要由程序员提供通信，操作系统只需要提供共享呢内存；

消息传递更易于实现，适合交换少量的数据，不需要避免冲突，允许进程交换信息。提供通信的主要职责在于操作系统本身



### 进程控制块(PCB)
- 进程状态：包括新的、就绪、运行、等待、停止
- 程序计数器：表示要执行的下一个指令的地址
- CPU寄存器：包括很多东西，中断时要保存
- CPU调度信息：包括进程优先级、调度队列指针和其他调度参数
- 内存管理信息：
- 记账信息：
- I/O状态信息：


PCB块是进程的唯一标识，OS就是通过控制PCB来对并发执行的进程进行控制和管理的

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645944201/os-thread-3.png)


### 进程调度

进程调度会选择一个可用的程序到CPU上执行

#### 调度队列

进程到系统后会进入作业队列，包括所有进程。等待运行的会进入到就绪队列。通常用链表表示


#### 调度程序

操作系统必须按某种方式从队列中选择进程，进程的选择是由相应的调度程序来执行的

短期调度程序
长期调度程序

#### 上下文切换

一个进程运行时，CPU中所有寄存器中的内容、进程的状态以及运行栈中的内容被称为进程的上下文（和PCB对应）

通过执行一个状态保存来**保存**CPU当前状态，之后执行一个状态**恢复**重新开始运行。将CPU切换到另一个进程需要保存当前状态并恢复另一个进程的状态，这一状态切换称为上下文切换。

### 进程控制

#### 进程的创建

允许一个进程创建另一个进程，创建者称为父进程，被创建的称为子进程，子进程可以获得父进程的所有资源，子进程结束会归还资源给父进程，父进程结束必须同时撤销子进程。

创建进程的过程：
1. 分配唯一的进程标志号(pid)
2. 分配资源
3. 初始化PCB
4. 插入到就绪队列

通过fork()系统调用，可以创建新进程

#### 进程的终止

包括正常结束和异常结束

终止进程的过程
1. 根据pid搜索PCB，读出状态
2. 立即终止
3. 若还有子进程，一并终止
4. 归还资源
5. 把PCB从队列中删除

如果一个进程终止，那么它的所有子进程都终止。这种现象称为级联终止

#### 进程的阻塞

自发的行为 block()

#### 进程的唤醒

wakeup()

### 线程

线程是CPU使用的基本单元，由线程ID、程序计数器、寄存器集合和栈组成，它与属于同一进程的其他线程共享代码段、数据段和其他操作系统资源

线程是独立调度的基本单位，引入线程的目的是为了简化进程间的通信，减小程序在并发执行时所付出的时间开销，提高操作系统的并发性

线程自己不拥有系统资源，只有一点点必要的运行资源，但是它可以和同一进程的其他线程一起共享进程拥有的全部资源

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645944201/os-thread-4.png)


举个栗子：QQ和浏览器是两个进程，浏览器进程里面有很多线程，例如 HTTP 请求线程、事件响应线程、渲染线程等等，线程的并发执行使得在浏览器中点击一个新链接从而发起 HTTP 请求时，浏览器还可以响应用户的其它事件。

多线程编程的优点:
1. 响应度高
2. 资源共享
3. 经济
4. 多处理器体系机构的利用

#### 多线程模型

有两种不同的方法来提供线程支持：用户层的用户线程和内核层的内核线程，二者有三种对应关系

1. 多对一模型：多个用户线程映射到一个内核线程
2. 一对一模型：有更好的并发功能，但是开销比较大
3. 多对多模型

#### 线程池

为了解决创建线程时间和丢弃，以及没有限制线程数量可能会导致资源用尽的问题，产生了线程池的解决方法

线程池会在进程开始时创建一定数量的线程，并放入池中来等待，服务器每次收到请求就会唤醒池中的一个线程，线程完成了任务又会返回池中。如果池中没有可用线程，服务器会等待。

优点：
使用现有线程比创建新线程快
限制了数量，不会耗尽资源


#### 线程库

线程库为程序员提供创建和管理线程的api

Pthread
Win32
Java

#### 多线程问题

fork()和exec()

取消：异步取消、延迟取消

### 进程与线程的区别

#### 资源方面

**进程是资源分配的基本单位**，但是线程不拥有资源，线程可以访问隶属进程的资源，线程没有自己独立的地址空间。

#### 调度方面

**线程是独立调度的基本单位**，在同一进程中，线程的切换不会引起进程切换，从一个进程中的线程切换到另一个进程中的线程时，会引起进程切换。

#### 系统开销

由于创建或撤销进程时，系统都要为之分配或回收资源，如内存空间、I/O 设备等，所付出的开销远大于创建或撤销线程时的开销。类似地，在进行进程切换时，涉及当前执行进程 CPU 环境的保存及新调度进程 CPU 环境的设置，而线程切换时只需保存和设置少量寄存器内容，开销很小。

#### 通信方面

线程间可以通过直接读写同一进程中的数据进行通信，但是进程通信需要借助 IPC。

#### 并发性

一个进程间的多个线程可以并发

### Tips

- 一个进程被不同的地方调用，会形成不同的进程
- 同一个线程可以被多个进程调用，线程还是同一个
- 对进程的管理和控制是通过执行各种原语来实现的


## 二、处理机调度

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645944201/os-thread-5.png)


单处理器系统，每次只允许一个进程运行，这个效率啊，efficiency。

每当CPU空闲时，操作系统就必须从就绪队列中选择一个进程来执行，由短期调度程序或者CPU调度来执行。调度程序从内存中选择一个能够执行的进程并为之分配CPU

就绪队列可实现为FIFO队列、优先队列、树或者简单的无序链表

CPU调度决策可在如下四种环境下发生：
1. 进程从运行切换到等待（I/O请求、调用wait等）
2. 从运行切换到就绪（出现中断）
3. 从等待切换到就绪（I/O完成）
4. 终止

1、4的情况下，调度方式是非抢占的，2、3是抢占的


**调度的层级：**
- 作业调度：给作业获得竞争处理机的机会

- 中级调度：内存调度，提高内存利用率和系统吞吐量

- 进程调度：低级调度，从就绪队列选进程分配处理机

**进程调度方式：**
- 剥夺调度：有另一个优先级高的进程进入，立即调度

- 非剥夺调度：等一个进程介绍才会调度，不抢


### 调度准则

用于比较的特征准则有：

- CPU使用率
- 吞吐量：一个单位时间内完成进程的数量
- 周转时间：从进程提交到进程完成的时间称为周转时间
- 平均周转时间：多个作业周转时间平均值
- 带权周转时间：周转时间/运行时间
- 平均带权周转时间：多个作业带权周转时间的平均值
- 等待时间：为最就绪队列中等待所花的时间，调度算法不影响进程运行时间，只影响在队列中的等待时间
- 响应时间：从提交请求到响应请求的时间


### 调度算法

CPU调度是多道程序操作系统的基础，通过在进程之间切换CPU，操作系统可以提高计算机的吞吐率。

不同环境的调度算法目标不同，因此需要针对不同环境来讨论调度算法。

几个概念：
**周转时间**：最后完成的时刻-刚进来的时刻，即包括等待时间与运行时间
**带权周转时间**：周转时间/进程运行时间
**响应比**：（等待时间+要求服务时间）/ 要求服务时间


#### 1. 批处理系统

批处理系统没有太多的用户操作，在该系统中，调度算法目标是保证吞吐量和周转时间（从提交到终止的时间）。

**1.1 先来先服务 first-come first-serverd（FCFS）**

按照请求的顺序进行调度。

用FIFO队列就可以实现

有利于长作业，但不利于短作业，因为短作业必须一直等待前面的长作业执行完毕才能执行，而长作业又需要执行很长时间，造成了短作业等待时间过长。

**1.2 短作业优先 shortest job first（SJF）**

按估计运行时间最短的顺序进行调度。

SJF算法调度理论上确实是最佳的，但问题在于如何知道下一个CPU区间的长度

长作业有可能会饿死，处于一直等待短作业执行完毕的状态。因为如果一直有短作业到来，那么长作业永远得不到调度。

**1.3 最短剩余时间优先 shortest remaining time next（SRTN）**

按估计剩余时间最短的顺序进行调度。

#### 2. 交互式系统

交互式系统有大量的用户交互操作，在该系统中调度算法的目标是快速地进行响应。

**2.1 时间片轮转**

将所有就绪进程按 FCFS 的原则排成一个队列，每次调度时，把 CPU 时间分配给队首进程，该进程可以执行一个时间片。当时间片用完时，由计时器发出时钟中断，调度程序便停止该进程的执行，并将它送往就绪队列的末尾，同时继续把 CPU 时间分配给队首的进程。

**时间片轮转算法是为了多个用户能及时干预系统**

时间片轮转算法的效率和时间片的大小有很大关系：

- 因为进程切换都要保存进程的信息并且载入新进程的信息，如果时间片太小，会导致进程切换得太频繁，在进程切换上就会花过多时间。
- 而如果时间片过长，那么实时性就不能得到保证。

**2.2 优先级调度**

为每个进程分配一个优先级，按优先级进行调度。

为了防止低优先级的进程永远等不到调度，可以随着时间的推移增加等待进程的优先级。

**2.3 多级反馈队列**

一个进程需要执行 100 个时间片，如果采用时间片轮转调度算法，那么需要交换 100 次。

多级队列是为这种需要连续执行多个时间片的进程考虑，它设置了多个队列，每个队列时间片大小都不同，例如 1,2,4,8,..。进程在第一个队列没执行完，就会被移到下一个队列。这种方式下，之前的进程只需要交换 7 次。

每个队列优先权也不同，最上面的优先权最高。因此只有上一个队列没有进程在排队，才能调度当前队列上的进程。

可以将这种调度算法看成是时间片轮转调度算法和优先级调度算法的结合。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645944201/os-thread-7.png)



#### 3. 实时系统

实时系统要求一个请求在一个确定时间内得到响应。

分为硬实时和软实时，前者必须满足绝对的截止时间，后者可以容忍一定的超时。

### Tips

- 考虑到系统资源利用率，要选择让I/O繁忙型作业有更高的优先级
- 作业和进程的区别，作业由用户提交、以用户任务为单位，进程由系统自动生成、以操作系统控制为单位
- 分时操作系统采用时间片轮转调度算法


## 三、进程同步


![](µhttps://res.cloudinary.com/dbmkzs2ez/image/upload/v1645944201/os-thread-6.png)

### 同步与互斥

**同步**：直接相互制约同步

进程之间的合作，比如A进程向B进程提供数据，多个进程会按一定顺序执行；

**互斥**：间接相互制约

源于资源共享，几个进程抢相同的资源，多个进程在同一时刻只有一个进程能进入临界区。

互斥可能会出现两种情况：
饥饿：拥有其他所有资源却得不到CPU的就绪进程
死锁：进程之间相互等待对方资源却无法得到，陷入永远的阻塞

进程互斥实际上是进程同步的一种特殊情况，可以认为是逐次使用互斥资源

### 临界资源和临界区

**临界资源** ：一次仅允许一个进程使用的资源，比如说硬件资源打印机什么的，一些非硬件资源比如一些变量、数据

**临界区** ：对临界资源进行访问的那段代码称为临界区

不论是硬件临界资源还是软件临界资源，多个进程必须互斥地对它们进行访问

把临界资源的访问分为四个部分：进入区、临界区、退出区、剩余区

为了互斥访问临界资源，每个进程在进入临界区之前，需要先进行检查，看是否正在被访问，如果未被访问就可以进入临界区，并设置它正在被访问的标志。在进入临界区之前执行的这段代码称为进入区。

在出来之前也要运行一段代码，把访问标志清除，这段代码称为退出区。

进入区和退出区起到互斥保护临界区的作用

```c
while(1){
  entry section // 进入区
    critical section // 临界区
  exit section // 退出区
    remainer section // 剩余区
}
```

临界区不是原语的，中途可以出现中断等（反正其他的还是进不来）

**同步机制的原则：**
- 空闲让进
- 忙则等待
- 有限等待
- 让权等待

### 信号量

信号量（Semaphore）是一个整型变量，可以对其执行wait和signal操作，也就是常见的 P 和 V 操作。

wait是P（申请资源），signal是V（释放资源）

S.value的初值就代表资源的数目，如果S.value < 0，那么其绝对值表示阻塞的进程的个数

#### 整型信号量

**P** ：如果信号量S大于 0 ，执行 -1 操作；如果信号量等于 0，进程睡眠，等待信号量大于 0；
**V** ：对信号量S执行 +1 操作，唤醒睡眠的进程让其完成 down 操作。

P V操作需要被设计成原语，不可分割，通常的做法是在执行这些操作的时候屏蔽中断。

缺点是在S<=0时，会出现”忙等”，没有遵循让权等待

#### 记录型信号量

再增加一个进程链表，链接上述的等待进程
P V操作修改为

```C++
P(semaphore S) {
  S.value = S.value - 1; // 请求一个资源
  if(S.value < 0) block(S.L) // 如果资源没了，就调用block阻塞掉，插入到信号量链表S.L中
}

V(semaphore S) {
  S.value = S.value + 1 // 释放一个资源
  if(S.value <= 0) wakeup(S.L) // 如果释放掉后还是堵着的，那么唤醒一个堵着的资源
  //（如果释放掉后不堵了，前一步也是0，说明链表原本就没有东西，所以不存在wakeup）
}
```

**实现前驱关系**：比如S1结束才能执行S2，可以设置一个信号量a，初始值为0，S1中V(a)，S2中P(a)

**实现互斥关系**：比如S1和S2互斥，可以设置一个信号量a，初始值为1，S1、S2都用P(a) V(a)夹紧中间过程


如果信号量的取值只能为 0 或者 1，那么就成为了  **互斥量（Mutex）** ，0 表示临界区已经加锁，1 表示临界区解锁。

```c
typedef int semaphore;
semaphore mutex = 1;
void P1() {
    down(&mutex);
    // 临界区
    up(&mutex);
}

void P2() {
    down(&mutex);
    // 临界区
    up(&mutex);
}
```

### 实现同步互斥

#### 软件实现：Peterson's Algotithm

flag表示有这个意愿，turn表示把回合让给谁，这是一个很谦让的算法，进程i要来先打个招呼，说我有执行的打算，然后把回合让给进程j，如果j没打算，那么i直接进去，进去之后，j如果再进来，直接把回合又给了i，j达到了while等待条件，只能等着i的执行完之后，j再进去

P[i]进程
```C
flag[i] = TRUE;
turn = j;
while(flag[j]&&turn==j); // j正在访问临界区，i等着
critical section;
flag[i] = FALSE;
remainder section;
```

P[j]进程
```C
flag[j] = TRUE;
turn = i;
while(flag[i]&&turn==i);
critical section;
flag[j] = FALSE;
remainer section;
```


### 典型问题：生产者-消费者问题

这是一个非常重要而典型的问题，进程同步60%以上的题目都是生产者消费者的改编

问题描述：有一群生产者进程在生产产品，并将这些产品提供给消费者进程去进行消费。使用一个缓冲区来保存物品，只有缓冲区没有满，生产者才可以放入物品；只有缓冲区不为空，消费者才可以拿走物品。

因为缓冲区属于临界资源，因此需要使用一个互斥量 mutex 来控制对缓冲区的互斥访问。（缓冲区用循环队列就可以模拟）

为了同步生产者和消费者的行为，需要记录缓冲区中物品的数量。数量可以使用信号量来进行统计，这里需要使用两个信号量：empty 记录空缓冲区的数量，full 记录满缓冲区的数量。其中，empty 信号量是在生产者进程中使用，当 empty 不为 0 时，生产者才可以放入物品；full 信号量是在消费者进程中使用，当 full 信号量不为 0 时，消费者才可以取走物品。

注意，不能先对缓冲区进行加锁，再测试信号量。也就是说，不能先执行 down(mutex) 再执行 down(empty)。如果这么做了，那么可能会出现这种情况：生产者对缓冲区加锁后，执行 down(empty) 操作，发现 empty = 0，此时生产者睡眠。消费者不能进入临界区，因为生产者对缓冲区加锁了，消费者就无法执行 up(empty) 操作，empty 永远都为 0，导致生产者永远等待下，不会释放锁，消费者因此也会永远等待下去。

顺序执行的时候显然没有任何问题，然而在并发执行的时候，就会出现差错，比如共享变量counter，会出现冲突。解决的关键是将counter作为临界资源来处理。



```c
##define N 100
typedef int semaphore;
semaphore mutex = 1;
semaphore empty = N;
semaphore full = 0;

void producer() {
    while(TRUE) {
        int item = produce_item();
        down(&empty);
        down(&mutex);
        insert_item(item);
        up(&mutex);
        up(&full);
    }
}

void consumer() {
    while(TRUE) {
        down(&full);
        down(&mutex);
        int item = remove_item();
        consume_item(item);
        up(&mutex);
        up(&empty);
    }
}
```

**实际例子：吃水果问题**

桌子上有一个盘子，可以放一个水果。爸爸每次放一个苹果，妈妈每次放一个桔子；女儿每次吃一个苹果，儿子每次吃一个桔子。

```C++
semaphore S =  1, SA = 0, SO = 0; // 盘子的互斥信号量、苹果和桔子的互斥信号量

father(){
  while(1){
    have an apple;
    P(S);
    put an apple;
    V(SA);
  }
}

mother(){
  while(1){
    have an orange;
    P(S);
    put an orange;
    V(SO);
  }
}

daughter(){
  while(1){
    P(SA);
    get an apple;
    V(S);
    eat an apple;
  }
}

son(){
  while(1){
    P(SO);
    get an orange;
    V(S); // 吃完之后要V(S)才能接着让爸爸妈妈接着放
    eat an orange;
  }
}
```

### 典型问题：哲学家就餐问题

这是由Dijkstra提出的典型进程同步问题

5个哲学家坐在桌子边，桌子上有5个碗和5支筷子，哲学家开始思考，如果饥饿了，就拿起两边筷子进餐（两支筷子都拿起才能进餐），用餐后放下筷子，继续思考

多个临界资源的问题

只考虑筷子互斥：可能会产生死锁，比如所有人都同时拿起右边筷子，左边无限等待
再考虑吃饭行为互斥：同时只让一个人吃饭，肯定不会冲突或死锁，但是资源比较浪费

解决方法1：允许4位哲学家同时去拿左边的筷子

```C++
semaphore chopstick[5] = {1, 1, 1, 1, 1}; // 筷子信号量
semaphore eating = 4; // 允许四个哲学家可以同时拿筷子

void philosopher(int i){ // 第i个哲学家的程序
  thinking();
  P(eating);
  P(chopstick[i]); // 请求左边的筷子
  P(chopstick[(i+1)%5]); // 请求右边的筷子
  eating();
  V(chopstick[(i+1)%5]);
  V(chopstick[i]);
  V(eating);
}
```

解决方式2：奇数位置的哲学家先左后右，偶数位置的哲学家先右后左


### 典型问题：读者写者问题

读进程：Reader进程
写进程：Writer进程

允许多个进程同时读一个共享文件，因为读不会使数据混乱；但同时仅仅允许一个写者在写

写-写互斥，写-读互斥，读-读允许

纯互斥问题，没有同步关系没有先后之分

需要多加一个读者计数器，并且修改这个时要同步，所以要再加一个变量保证修改count时的互斥

```C++
semaphore rmutex = 1, wmutex = 1; // readcount的互斥信号量，数据的互斥信号量
int readcount= 0;

Reader(){ // 每次进入和退出因为涉及readcount变化，要保证同时只有一个，所以分别设置rmutex
  while(1){
    P(rmutex); // 抢readcount信号量，防止多个reader同时进入 导致readcount变化不同
    if(readcount==0){
      P(wmutex); // 第一个进来的读者，抢公共缓冲区
    }
    readcount += 1;
    V(rmutex); // 其他reader可以进来了

    perform read operation;

    P(rmutex); // 再抢一次，使每次只有一个退出
    readcount -= 1;
    if(readcount==0){
      V(wmutex); // 最后一个reader走了，释放公共缓冲区
    }
    V(rmutex);
  }
}

Writer(){ // 写者很简单，只需要考虑wmutex公共缓冲区
  while(1){
    P(wmutex);
    perform write operation;
    V(wmutex);
  }
}
```

上面的算法可能会导致写者可能会被插队，如果是RWR，中间的W被堵了，结果后面的R还能进去，W还要等后面的R读完

变形：让写者优先，如果有写者，那么后来的读者都要阻塞，实现完全按照来的顺序进行读写操作。
解决方法：再增加一个wfirst信号量，初始为1，在读者的Read()和之前的阶段和写者部分都加一个P(wfirst)作为互斥入口，结尾V(wfirst)释放即可

变形：让写者真正优先，可以插队
解决方法：增加一个writecount统计，也就是加一个写者队列，写者可以霸占这个队列一直堵着


### 例子：汽车过窄桥问题

来往各有两条路，但是中间有一个窄桥只能容纳一辆车通过，方向一样的车可以一起过

```C++
semaphore mutex1=1, mutex2=1, bridge=1;
int count1=count2=1;

Process North(i){
  while(1){
    P(mutex1);
    if(count1==0){
      P(bridge); // 第一辆车来了就抢bridge让对面的车进不来
    }
    count1++;
    V(mutex1);

    cross the bridge;

    P(mutex1);
    count1--;
    if(count1==0){
      V(bridge); // 最后一辆车走了就释放bridge让对面的车可以进来
    }
    V(mutex1);
  }
}

Process South(i){
  while(1){
    P(mutex2);
    if(count2==0){
      P(bridge);
    }
    count2++;
    V(mutex2);

    cross the bridge;

    P(mutex2);
    count2--;
    if(count2==0){
      V(bridge);
    }
    V(mutex2);
  }
}
```

### 管程

使用信号量机制实现的生产者消费者问题需要客户端代码做很多控制，而管程把控制的代码独立出来，不仅不容易出错，也使得客户端代码调用更容易。

（管程有点像用一个类来封装初始化、共享数据、操作代码等）

管程有一个重要特性：在一个时刻只能有一个进程使用管程。进程在无法继续执行的时候不能一直占用管程，否者其它进程永远不能使用管程。

管程定义了一个数据结构和能为并发进程所执行的一组操作，这组操作可以同步进程和改变管程中的数据

管程引入了  **条件变量**  以及相关的操作：**wait()** 和 **signal()** 来实现同步操作。对条件变量执行 wait() 操作会导致调用进程阻塞，把管程让出来给另一个进程持有。signal() 操作用于唤醒被阻塞的进程。

### Tips

- 临界资源同一时间只能被一个进程访问，而共享资源一段时间可以被多个访问，磁盘属于共享设备而不是临界资源
- 要对并发进程进行同步的原因是：并发进程是异步的
- PV操作由两个不可被中断的过程组成，也就是它们两个，它们都属于低级进程通信原语，不是系统调用
- 有五个并发进程涉及到同一个变量A，说明有五段代码，也就是说有5个临界区
- 信箱通信是一种间接通信方式

## 四、死锁

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645944527/os-thread-9.png)

多个程序因为竞争共享资源而造成的僵局，若无外力作用，这些进程都将永远无法继续推进

**★产生死锁的四个条件**，都满足就会产生：
1. **互斥条件**：要求某资源进行排它性占有
2. **不剥夺条件**：进程已经获得的资源在未被使用完前不可被剥夺
3. **请求和保持条件**：已经至少拥有了一个资源，但是又提出了一个新的资源请求
4. **循环/环路等待条件**（必要而非充分）：存在一个进程--资源循环链

举个例子，你手上拿着一个苹果，一个苹果只能被一个人拥有，这是互斥条件；别人不能把苹果从你手中抢走，这是不剥夺条件；你抱着这个苹果不放还想去拿别的苹果，这是请求和保持；一圈人都想拿他右边那个人的苹果，陷入循环，这是循环等待条件

### 死锁处理
1. 不让死锁发生：预防死锁、避免死锁
2. 允许死锁发生，但死锁发生时要能检测到并加以处理：检测死锁、解除死锁

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645944527/os-thread-8.png)

### 预防死锁

设置某些限制条件，破坏上面四个必要条件的一个或几个：

- （互斥在很多场合下是必须要遵循的，没办法破坏该条件）
- 摈弃“请求和保持条件”：所有进程一次性获得所有资源
- 摈弃“不可剥夺性”：如果提出新的申请无法满足，则放弃所有已经拥有的资源
- 摈弃“环路等待”：资源按顺序编号，进程必须按顺序申请资源


### 避免死锁

在资源的动态分配过程中，用某种方法防止系统进入不安全状态，从而避免死锁

**银行家算法**（过程省略，找个例子就很容易理解）（卧槽，看完了才发现不考）
尝试分配，然后检测安全性

### 死锁检测及解除

不采取任何限制措施，允许死锁，通过系统检测机构及时检测出死锁的产生，并采取某些措施解除死锁


接触死锁的方法：
1. 剥夺资源
2. 撤销进程
<br>

### Tips

- 进程产生死锁的主要原因。时间上可能是进程运行中的推进顺序不当，空间上的原因是对独占资源分配不当，而不是系统资源不足
- 死锁的避免是根据防止系统进入不安全状态采取措施，实现的结果是让进程推进合理
- 结束死锁甚至可以终止所有死锁进程，但是一般不会从非死锁进程处抢夺资源
- 死锁状态一定是不安全状态，但是不安全状态不一定有死锁，还可能是其他的
- 限制用户申请资源的顺序属于死锁预防的破坏循环等待，限制给进程分配资源的顺序属于死锁避免

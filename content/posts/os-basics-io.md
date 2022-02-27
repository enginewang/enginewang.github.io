---
title: "操作系统基础（四）文件IO"
date: 2021-06-10T16:01:08+08:00
draft: false
categories: ["技术"]
tags: ["OS"]
---

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645945891/os-io-1.png)

## 文件基本概念

文件是记录在外存上相关信息的具名集合，对于用户而言文件是逻辑外存最小的分配单位，文件是一组有意义信息的集合

在系统运行时，计算机以进程为基本单位进行资源的调度和分配，而在用户进行输入输出时，则以文件为基本单位。

需要系统提供一个文件管理系统来让用户管理文件，文件系统由一组文件和目录结构组成

### 文件属性

文件名、标志符（唯一标签，用户不可读）、类型、位置、大小、保护信息、时间、日期和用户标识

文件属于抽象数据类型

### 文件基本操作

（操作系统应该向上提供的文件操作功能）
创建文件、写文件、读文件、在文件内重定位、删除文件（完全删除）、截短文件（删除内容不删属性）

### 文件的打开与关闭

要读一个文件首先要用open系统调用打开该文件，open中的参数包括文件路径名和文件名，

read只需要使用open返回的文件描述符，不使用文件名作为参数

每个打开文件有以下信息：
- 文件指针
- 文件打开计数器
- 文件磁盘位置
- 访问权限

### 文件的逻辑结构

文件的逻辑结构是**从用户观点出发看到的文件内部的组织形式**

文件按照逻辑结构分为无结构文件（流式文件）和有结构文件（记录式文件）

无结构文件（流式文件）：以字节为单位

有结构文件（记录式文件）：分为顺序文件、索引文件、顺序索引文件、散列文件

文件的目录结构（文件之间的组织形式）
文件存放在外存中（文件的物理结构）

### 访问方法

1. 顺序访问

2. 直接访问

### 目录结构

引入**文件控制块(FCB)** 这个数据结构

FCB包括基本信息、存取控制信息和使用信息

目录相关操作有：搜索文件、创建文件、删除文件、遍历目录、重命名文件、跟踪文件系统

### 保护

信息需要被保护，不受物理损坏（可靠性）和非法访问（保护）

口令、存取控制和用户权限表都是常见的文件保护方法

可靠性通常靠文件备份来提供

访问类型：读、写、执行、添加、删除、列表清单

为每个文件添加一个访问控制列表（ACL）

加密保护和访问控制：加密保护安全性更高，访问控制灵活性更好。访问控制需要由系统实现来保证安全性

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645945891/os-io-2.png)


### 错题归纳

- 从用户的角度看，引入文件系统的目的是实现对文件的按名存取；从系统角度看，文件系统则负责对文件储存空间进行组织分配、负责文件储存并对存入的文件进行保护和检索
- FCB的有序集合称为文件目录，一个FCB就是一个文件目录项
- 逻辑结构的组织形式取决于用户，物理结构的组织形式取决于储存介质特性
- 文件目录项（FCB）不包括FCB的物理位置
- 对一个访问的限制，常由用户访问权限和文件属性共同限制，与优先级无关
- 一个文件被用户首次打开的过程中，操作系统需要将文件控制块读到内存中，不是文件内容


## 文件系统实现

### 文件系统层次结构

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645945891/os-io-3.png)

1. 用户调用接口：给用户文件操控的接口
2. 文件目录系统：管理文件目录
3. 存取控制模块：实现文件保护
4. 逻辑文件系统与文件信息缓冲区：根据逻辑结构将用户要读写的逻辑记录转换成文件逻辑结构内的相应块号
5. 物理文件系统：把相应块号转成实际物理地址
6. 辅助分配模块：管理辅存空间，辅存空间的分配和回收
7. 设备管理模块：管理相关设备

单层结构目录、双层结构目录、树状结构目录、无环图目录（同一文件可以在不同目录中）、通用图目录

物理块是分配和传输的基本单位

### 目录实现

线性链表、哈希表

### 外存分配方式

1. 连续分配

每个文件在磁盘上占有一组连续的块

分配方式可以用第一块磁盘的地址和连续块数量来确定

优点：实现简单、存取速度快
缺点：不方便动态增加，容易产生外部碎片

2. 链接分配（隐式、显式）

以离散分配的方式，消除外部碎片

隐式：除最后一个块外，每个块都有一个指向下一个盘块的指针，目录包括第一个指针和最后一个指针

显式：显式地存放在内存的一张链接表中，文件分配表（File Allocation Table, FAT）

3. 索引分配（一级、二级、多级）

每个文件设置一个索引块，是一个磁盘块地址的数组

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645945891/os-io-4.png)

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645945891/os-io-5.png)


### 错题归纳

- 文件储存空间的管理实质上是对外存空闲区的管理和组织


## 磁盘结构

概念：磁盘由表面涂有磁性物质的圆形盘片组成，每个盘片被划成一个个磁道，每个磁道被划成一个个扇区

如何读写：磁头移动到目标位置，盘片旋转，对应扇区划过磁道，完成读写

磁盘的物理地址依靠柱面号、盘面号、扇区号来确定

磁盘分类：
活动头磁盘、固定头磁盘
可换盘磁盘、固定盘磁盘

### 磁盘调度算法

一次读/写操作需要的时间包括
寻找时间：读写之前磁头移动到磁道花费的时间，$T_S = T_{启动磁头臂} + m_{跨越一个磁道耗时}*n_{需要跨越的磁道数}$
延迟时间：通过旋转磁盘让磁头定位到目标扇区所需要的时间，平均延迟时间$T_R = \frac{1}{2} * \frac{1}{r}$ (r为转速)
传输时间：从磁盘读出或向磁盘写入数据所经历的时间，转速为r，读写的字节数b，每个磁道字节数N，传输时间$T_t = \frac{1}{r} * \frac{b}{N}$

延迟时间和传输时间是硬件决定的，操作系统只能通过调度算法优化寻找时间


磁盘调度算法：
先来先服务（FCFS）：按顺序处理
最短寻找时间（SSTF）：先处理离目前磁头最近的请求，贪心算法（局部最优不一定是全局最优），可能导致饥饿
扫描算法（SCAN）：只有移动到最内侧磁道才能往外侧移动，只有移动到最外侧磁道才能往内侧移动
LOOK调度算法：扫描算法的升级，在移动方向上没有请求了就可以改变方向
循环扫描算法（C-SCAN）：扫描算法的变形，每次扫描的移动方向一样，扫到底了直接快速移到开头，中间不管，这样解决了SCAN算法两侧与中间不均的问题
C-LOOK：C-SCAN的升级，相比C-SCAN头尾不需要是磁盘的最前面和最后面，只要有请求的最前面和最后面

题目里的SCAN都默认是对应的LOOK算法

### 减少

交替编号
错位命名

## I/O管理

### I/O设备分类

按照使用特性：
人机交互外部设备：比如鼠标键盘（数据传输最慢）
储存设备：比如移动硬盘（数据传输最快）
网络通信设备：比如路由器

按照传输速率：
低速设备、中速设备、高速设备

按照信息交换的单位：
块设备（传输快、可以寻址）、字符设备（不可寻址，通常用中断驱动控制）

### I/O控制方式

程序直接控制方式：CPU不断轮询检查是否设备就绪，简单，CPU利用率低

中断驱动方式：CPU先让IO进程阻塞，之后IO设备向CPU发出中断让其执行，CPU利用率提高，但频繁中断浪费CPU时间

DMA（直接存储器存取）方式：在IO与内存之间开辟新的数据通路，仅在开始和结束时才需要CPU干预，数据传输不需要经过CPU，可以传数据块

通道控制方式：可以看成专门处理IO的阉割版CPU，完成后才向CPU发送中断

上面四个方式从上往下CPU干预程度越来越低，CPU利用率越来越高

### I/O子系统的层次结构

用户层I/O软件：比如库函数printf
设备独立性软件
设备驱动程序
中断处理程序
硬件设备

中间三层属于I/O核心子系统
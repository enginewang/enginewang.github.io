---
title: "操作系统基础（一）导论"
date: 2022-05-01T16:29:53+08:00
draft: false
categories: ["技术"]
tags: ["OS"]
---

## 概述

操作系统是指控制和管理整个计算机系统的硬件和软件资源，并且合理地组织调度计算机工作和资源的分配，以提供给用户和其他软件方便接口和环境的程序集合。


从底层到上层分别是：

硬件->操作系统->计算机程序->用户

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645632990/os-1.png)

## 操作系统的特征

**并发**：两个或多个事件在同一时间间隔内发生

**共享**：系统中的资源可供内存中多个并发执行的进程共同使用

并发和共享是操作系统两个最基本的特征

**虚拟**：把物理实体变为若干个逻辑的对应

**异步**：进程的执行走走停停，以不可预知的速度向前推进

## 操作系统的目的和功能

功能：处理机管理、存储器管理、设备管理、文件管理以及提供接口给用户。

操作系统为用户提供操作计算机硬件系统的接口

### 命令接口

联机控制方式（适用于分时、实时操作系统）：说一句做一句

脱机控制方式（适用于批处理）：写在单子上，按单子一个一个做

### 程序接口

程序接口由一组**系统调用命令**组成，在程序中使用这些调用命令来请求操作系统为其提供服务

系统调用只能用过用户程序间接使用



## 操作系统的发展

### 1. 手工操作阶段

### 2. 批处理阶段

单道批处理系统：内存中始终保持一道作业
**特征：自动性、顺序性、单道性**

多道批处理系统：允许多个程序同时进入内存并运行
**特征：多道、宏观并行、微观串行**

批处理的缺点是缺少交互性

### 3. 分时操作系统

采用分时技术，把处理器的运行时间分为很短的时间片，按照时间片轮转算法把处理器分配给各个联机作业使用。

分时操作系统可以让多个用户通过终端连接同一个主机，用户之间互不干扰。



**特征：同时性、交互性、独立性、及时性**

### 4. 实时操作系统

为了完成紧急任务而不需要时间片排队，通常采用抢占式的优先级高者优先调度

实时系统必须在被控制对象规定时间内处理来自外部的事件

通常运用场景是一些需要立即反应的场合，比如股票、订票、机床控制什么的



**特征：及时性、可靠性**

### 5. 网络操作系统和分布式计算机系统

网络中各种资源的共享以及各台计算机之间的通信

**特征：分布性、并行性**




## 操作系统的运行环境

### 内核态与用户态

程序分为内核程序和外层应用程序，他们能执行的指令的权限不一样，所以操作系统划分为了用户态（目态）和核心态（管态）来严格区分这两种程序



操作系统内核运行在核心态，用户程序运行在用户态

内核包括：

#### 1. 时钟管理

#### 2. 中断机制

#### 3. 原语

处于最底层、运行具有原子性、运行时间较短，有这些特点的程序被称为原语

#### 4. 系统控制的数据结构及处理

### 运行机制



### 中断和异常

#### 中断：外中断，与当前运行的程序无关，比如设备的中断请求、时钟中断等等

#### 异常：内中断，指令内部导致中断

中断处理一定会保存程序状态子寄存器

外部中断，PC值由中断隐指令自动保存，通用寄存器的内容由操作系统保存

### 系统调用

按照供功能可以分为设备管理、文件管理、进程控制、进程通信、内存管理等

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645632990/os-3.png)

从用户态转到核心态会用到访管指令，访管指令在用户态使用，所以它不可能是特权指令

用户态指令：

核心态指令：输入输出指令

从用户态转换到核心态，这是由硬件完成的

置时钟指令只能在核心态下完成

中断发生后，进入中断处理的程序在核心态执行，是操作系统程序

广义指令（系统调用指令），必然在核心态执行，调用都可以

输入输出必然在核心态执行

分清楚调用和执行，有不少都是用户态可以调用但是执行必须在核心态的

CPU处于核心态，除了访管指令，其余所有指令都可以调用

导致用户从用户态切到内核态的操作有：某个东西导致了异常中断、I/O等等

## Tips

- 操作系统不关心高级语言编译器
- 单处理机系统中，进程与进程不能并行
- 用户可以使用命令接口和系统调用来使用计算机
- 计算机开机后，操作系统最终被加载到RAM上（内存中的系统区）
- 提高单机资源利用率的关键技术是多道程序设计技术
- 提到多道批处理就往提交若干作业（清单）上靠，提到分时就往用户靠，提到实时就往响应速度靠
- 通用操作系统使用时间片轮转算法
- 通道技术是一种硬件技术
- 进程调度不需要硬件的支持
- 异常处理后不一定会返回到发生异常的地方继续执行，比如除以0会直接跳过
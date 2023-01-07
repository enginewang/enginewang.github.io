---
title: "MySQL进阶（二）日志"
date: 2022-02-27T21:58:29+08:00
draft: false
categories: ["技术"]
tags: ["MySQL"]
---

## 日志的概念与意义

日志在各种软件都不可或缺，尤其是数据库应用，可以看作是飞机的黑匣子，记录着发生的一切。

其意义在于：
1. 分析历史记录
2. 定位问题
3. 错误复盘
3. 误操作，借助日志恢复到某个之前的状态

## MySQL日志

MySQL有一个很神奇的特性，它可以恢复为半个月之内任意一秒的状态。这要仰仗它的日志系统中的redo log和bin log。

### redo log

每一次的更新操作不可能都直接写进磁盘里，这样IO成本过高，效率太低。InnoDB使用WAL（Write-ahead Logging）技术，也就是先写日志，然后等不忙的时候才写磁盘。

一条更新记录会先写入redo log，然后写入内存，之后等系统空闲的时候再写入磁盘。如果log写满了就只能先将里面的一部分写入磁盘，再擦掉log。InnoDB的redo log大小是固定的，一组4个文件，每个文件大小为1G。

redo log记录的是这个页做了什么改动。

![mysql02](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645639120/mysql-2.png)

这里write_pos就是目前在写的位置，checkpoint就是当前在擦除的位置，checkpoint到write_pos之间的是写入内容的redo log，而write_pos到checkpoint之间的就是空闲的区域。

通过redo log，即使数据库发生异常，之前提交的记录依然存放在log里，也不会丢失，这个能力称为**crash-safe**。

#### redo log的两阶段提交

两阶段提交的目的是让redo log和bin log之间的逻辑一致。

如果不采用两阶段提交，不论redo log和bin log的先后记录顺序，如果在两个log写的间隙时崩溃，都会导致binlog恢复的库与原库的值不同。两阶段提交可以让这两个的状态保持一致。

#### redo log的底层原理

InnoDB是Write Ahead Log机制，也就是先写log再写磁盘，处理一条更新语句时，首先会把记录写到redo log buffer中，然后更新内存数据，此时是脏页，最终会刷入磁盘中覆盖原有的数据。

### undo log

数据修改的时候，会记录相应的回滚值。

undo log和bin log记录的类型一样，都是逻辑，不过undo log记录一个相反的操作，比如delete一条记录，undo log就会记录insert这条记录。a的b字段从1update为2，那么undo log就会记录a的b从2update为1。

后面的事务MVCC会用到undo log

### bin log

bin log是二进制日志，存储所有数据库表结构变更和表数据修改的所有操作。

redo log是InnoDB存储引擎特有的log，而bin log是Server层的，所有引擎都支持。

它用于记录原始的逻辑日志，可以追加写入。

也就是记录的是每次执行语句的原始逻辑，比如给ID=1的c字段设置为5。

redo log是循环写，空间用完后会覆盖之前的日志。bin log是追加写，不会覆盖以前的日志。

### 如何依靠日志恢复到历史的某个点

假如现在的时刻时C，在之前的某个B时刻执行错误了某个操作（比如误删表），想要恢复到B操作之前的状态，那么应该先去找在B之前的最近的一次全量备份A，先恢复到A时刻的数据，然后将A-B这个时间段的binlog取出，依次执行命令。

## 一条SQL更新语句的执行过程

假设执行这样一条update语句：
`update T set c=5 where ID=1;`

那么流程如下：

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645640253/mysql-3.png)

蓝色表示在InnoDB存储引擎中执行，红色表示在执行器中执行。

## 抖动

实际工程中，大部分SQL执行都很快，但是有时候同样的一条SQL忽然就很慢，而且这种随机情况还很难复现。这种情况称为抖动

每次修改的记录顺序，都是从内存 - redo log - 硬盘存储的过程。

在把内存里的数据写入磁盘的过程称为flush

内存数据页和磁盘不一致的时候，这个内存页称为脏页，写入到磁盘后二者一致，内存页称为干净页

平时操作很快，是在写内存和日志，而某一条忽然抖一下，很有可能是在进行flush，

> 什么时候会进行flush呢？

1. redo log写满了，再写入新的日志就需要把早的一部分日志对应的脏数据flush到硬盘，然后擦掉，留出空间写新的redo log。
2. 内存不足，此时也只能淘汰一些老的内存页，在这之前先flush到硬盘。
3. mysql认为当前空闲，进行flush。如果一直都很忙也要找时间刷一点脏页
4. MySQL的关闭，在关闭之前需要将所有的脏页都flush到磁盘，这样下次启动就从磁盘直接读取。

其中前两种情况对性能的影响比较大。

第一种情况redo log满，此时数据库将不再接受更新，直到flush完。

第二种情况内存满，InnoDB的缓冲池中的内存页游三种状态：
1. 还未被使用
2. 使用了，是干净页
3. 使用了，是脏页

读入的数据不在内存中，就需要从内存中申请一个数据页，如果没有未被使用的内存页，就需要淘汰最久未使用的数据页。如果是干净页可以直接删掉，如果是脏页的话就要flush。

那么如果一个查询要淘汰很多脏页，就会导致抖动卡住的时间非常长，需要避免这种情况。

所以InnoDB需要控制脏页的比例。

首先需要告诉InnoDB主机的IO能力，设置`innodb_io_capacity`这个参数，通过`fio`命令可以测出本机的IOPS：

```bash
fio -filename=$filename -direct=1 -iodepth 1 -thread -rw=randrw -ioengine=psync -bs=16k -size=500M -numjobs=10 -runtime=10 -group_reporting -name=mytest
```

InnoDB会考虑脏页比例和redo log的写盘速度，计算得到，按照`R%`的速度来刷脏页

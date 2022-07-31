---
title: "MySQL进阶（三）再谈事务"
date: 2022-03-07T10:00:11+08:00
draft: false
categories: ["技术"]
tags: ["MySQL"]
---

## 事务的概念与意义

一个行为可能涉及到多个操作，如果进行到中途系统忽然崩溃，那么可能会造成巨大的损失。

我们想要保证一系列的数据库操作，要么全部成功，要么全部失败。这就是事务。

MySQL的InnoDB支持事务，而MyISAM不支持，所以我们这里谈的MySQL事务都基于InnoDB引擎。

## ACID

事务的ACID

Atomicity：原子性
Consistency：一致性
Isolation：隔离性
Durability：持久性

## 隔离级别

隔离的越少，越容易出现问题，隔离的越严密，效率越低。

这就有点像分布式系统对一致性的追求，我们需要根据实际场景来选择隔离等级。

不同的隔离级别会有不同的结果。SQL的隔离等级有读未提交、读提交、可重复读和串行化，它们的并行效率依次降低，安全性依次提高。下面通过一个具体的例子来了解它们。

假设数据库中有一个值，目前是1，有两个事务A、B：

![mysql-tran-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645642362/mysql-tran-1.png)


### 读未提交 RU

一个事务还没提交就能被另一个事务看到。

也就是B还没提交的时候，A就能读到修改的值，此时V1=2，V2=2，V3=2

读未提交就是每次直接返回记录中最新的值。

### 读提交 RC

一个事务提交之后就能被另一个事务看到。

如果是读提交，需要在提交之后才能读到修改，此时V1=1，V2=2，V3=2

对于读提交，数据库会创建一个视图，访问时以视图的逻辑为准，在每次SQL语句开始执行的时候创建。

### 可重复读 RR

RR是InnoDB的默认事务隔离级别。

事务执行过程中看到的数据和启动时看到的一致

如果是可重复读，事务的整个过程读到的数据都一样，V1=1，V2=1，执行完之后就不需要一样，V3=2

对于读提交，数据库会创建一个视图，在每次事务启动的时候创建。

### 串行化 Serializable

同一行记录读和写都会加锁，不允许任何并行读写

如果是串行化，B在执行修改操作时被锁住，等到A事务执行完，B才继续执行，此时V1=1，V2=1，V3=2

串行化是通过加锁的方式来避免一切并行访问。

### 配置隔离级别

事实上每一种隔离级别都要对应的使用场景，如果要配置的话，可以设置启动参数 transaction-isolation 的值

比如改为READ-COMMITTED：读提交

## 事务隔离的实现：MVCC

前面我们说了undo log，记录回滚的日志。

MVCC（Multi-Version Concurrency Control）即多版本并发控制，可以避免同一个数据在不同事务之间的竞争。通过MVCC机制，只有写写才会阻塞，读读、读写、写读都可以并行，从而大大提高效率，同时允许多个版本同时存在。

前面提到的读提交和可重复度用到了MVCC。

在介绍MVCC之前，先引出ReadView的概念。

### ReadView

是数据库某一时刻所有未提交事务的快照。

如果是读提交RC，每次开始查询时都会生成一个ReadView。
如果是可重复读RR，事务在第一次读取数据的时候就生成一个ReadView，之后再也不会生成。

包括几个参数：

| 参数 | 说明 |
| - | - |
| creator_trx_id | 当前事务Id |
| m_ids | 生成ReadView时，系统中活跃的读写事务的事务Id列表 |
|min_trx_id|生成ReadView时，系统中活跃的读写事务的最小事务Id|
|max_trx_id|生成ReadView时，将在下一次分配的事务Id|

当一个事务创建的瞬间，已提交的事务、正在活跃但还未提交的事务、未开始的事务构成了这个事务的ReadView。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645776219/mysql-tran-2.png)

### 隐藏列

InnoDB存储引擎对于每一个聚类索引都包含了两个隐藏列：

trx_id：事务Id，把改变某条聚簇索引的事务Id记录到这个列

roll_pointer：回滚指针，也就是指向对应undo log的指针

通过roll_pointer可以串成一个undo log链表，称为事务链

### 判断事务使用的版本

如果被访问的trx_id小于ReadView的低水位Id，即落在上图的绿色区域。那么说明该版本的事务在生成ReadView之前就提交了，所以可以被当前事务访问。

如果被访问的trx_id大于ReadView的高水位Id，即落在上图的红色区域。那么说明该版本事务在生成ReadView之后才生成，不能被当前事务访问。

如果介于最小Id和最大Id值之间，即落在上图的蓝色区域。需要判断trx_id是否在m_ids列表中，如果在的话说明创建ReadView时该版本事务还活跃，不能访问。如果不在的话说明创建ReadView时该版本已经提交，可以访问。

## 长事务的问题

所谓长事务，也就是运行时间比较长，长时间没有提交的事务，长事务会导致阻塞、占用锁资源、影响性能，应该尽量避免使用长事务。

`information_schema.innodb_trx`表包含当前innoDB正在运行的事务信息，包含了事务的开始时间。

可以通过以下命令查看时间超过一分钟的长事务，然后kill掉。

```sql
select * from information_schema.innodb_trx
 where TIME_TO_SEC(timediff(now(),trx_started))>60
```
---
title: "Google三驾马车（三）—— Bigtable"
date: 2021-10-27T00:21:18+08:00
draft: false
categories: ["算法"]
tags: ["Bigtable", "分布式", "大数据"]
---

## 介绍

为什么需要Bigtable？
需要一个集群支持海量的随机读写，需要支持到每秒百万级别的随机读写。在Bigtable没出之前，使用MySQL集群可以解决一些问题，然而一方面会放弃关系型数据库的很多特征，比如外键约束、跨行跨表的事务等。一方面在扩容的时候不得不翻倍扩容，非常浪费。缩减服务器也非常麻烦。另外，在每次故障恢复的时候也需要人工介入。

![bigtable-0](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640192906/bigtable-0.png)

希望的伸缩性是可以随机增加或者去掉人任何数量的服务器，并且进行这些操作时不会使服务暂停。

Bigtable建立在GFS的架构之上，是一个管理结构化数据的分布式存储系统，可以拓展到非常大的规模，比如跨越数千服务器的PB级别的数据。
Google已经将其用在了很多内部产品中，Bigtable为其提供了一套高性能的可灵活拓展的解决方案。

在很多方面，Bigtable像是数据库，但相比于以往的系统，Bigtable提供了不一样的接口。它不支持完整的关系型数据模型。可以使用任意字符的行列名对数据进行索引，Bigtable将数据都视为未解释的字符串。

当然Bigtable也有缺点，一个是放弃了关系模型，不支持SQL；一个是放弃了跨行的事务，只支持单行的事务模型。

Bigtable的解决方法是：
1. 将存储层搭建在GFS上，通过单Master调度多Tablets的形式，使得集群容易维护，伸缩性好
2. 通过MenTable+SSTable的底层文件格式，解决高速随机读写的问题
3. 通过Chubby分布式锁解决一致性的问题


## 数据模型

Bigtable是一个稀疏的、分布式的永久存储的多维排序map，这个map通过row key、column key和timestamp进行索引，每个值都是一个未解释的字符串。

(row: string, column: string, time: int64) -> string

下图是一个存储网页的table

1. row是url的倒转，比如www.google.com会存为com.google.www，这样的目的是前面的www大家都一样，而且子域名就会主域名靠一起。
2. 有多列，其中`contents:`列存储网页html内容。`anchor:`列存储指向这个页面的anchor文字，比如cnnsi.com和my.look.ca有指向www.cnn.com的anchor，就如下图所示存储。

![bigtable-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640192906/bigtable-1.png)

### Rows

行key是表的主键，可以是任意字符串，最大为64kb，在单行的读写都是原子的。
由于读写总是通过行键，这样的数据库也叫做KV数据库。
Bigtable按行key对数据进行排序，行范围动态分区，每个行的范围被称为tablet，是分布式和负载均衡的单位。

### Column Families 列族

每一行的数据需要指定列族，每个列族下不需要指定列，每个数据都可以有自己的列，每一行的列可以不一样。这也就是为什么说Bigtable是稀疏的表：

![bigtable-2](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640192908/bigtable-2.png)

列key被分组到了一个集合里，被称为column families，每个column families里的应当是相同类型。必须先创建column families，才能使用列key存储数据。
列key通过`family:qualifier`命名。比如存储web的表可以用language当做family，另一种是可以用anchor来当做family，每个列key是一个anchor，qualifier是指向该url的网址，内容是链接文本。
访问控制和硬盘内存的记录都是在列family层级下进行的。
比如Bigtable的开源实现HBase，每一个列族的数据存在同一个HFile文件下。


### Timestamp

Bigtable的每个单元格可以包含相同数据的多个版本，不同的版本通过时间戳进行索引。Bigtable的时间戳是64位的整数。不同版本以递减的形式存储，以便可以首先读取最新版本。

为了防止变得过于繁重，可以指定个数或过期时间，之前的版本被gc。

## API

Bigtable的API包括创建、删除表和列族，以及修改簇、表、列族元数据等。

```C++
// Open the table
Table *T = OpenOrDie("/bigtable/web/webtable");

// Write a new anchor and delete an old anchor
RowMutation r1(T, "com.cnn.www");
r1.Set("anchor:www.c-span.org", "CNN");
r1.Delete("anchor:www.abc.com");
Operation op;
Apply(&op, &r1);
```

```C++
Scanner scanner(T);
ScanStream *stream; stream = scanner.FetchColumnFamily("anchor");
stream->SetReturnAllVersions(); scanner.Lookup("com.cnn.www");
for (; !stream->Done(); stream->Next()) {
  printf("%s %s %lld %s\n",
  scanner.RowName(),
  stream->ColumnName(),
  stream->MicroTimestamp(),
  stream->Value());
}
```


## 构建块

Bigtable使用GFS存储日志和数据文件，`SSTable`用于存储Bigtable数据，每个SSTable包含一个块序列（每个块64kb），并且SSTable可以被完全的映射到内存中，不需要接触磁盘就可以执行查找和扫描。

Bigtable依赖于分布式锁Chubby，Chubby包含了5个副本，其中一个被选为master并提供request服务。我后面会专门再讲一下Chubby。

Bigtable通过Chubby完成以下任务：
1. 确保每个时刻只有一个master
2. 存储Bigtable数据的引导位置
3. 存储Bigtable每个表的列族信息
4. 存储访问控制列表ACL

如果Chubby不可用，那么Bigtable也将不可用

## 实现

Bigtable包含三个主要组件：
1. 链接到每个客户端的库
2. 一个master服务器
3. 多个tablet服务器

tablet可以动态的增加删除。

master的职责：
1. 负责将tablet分配给tablet服务器
2. 检测tablet的添加和过期
3. 平衡Tablet server之间的负载
4. 对GFS的文件进行gc
5. 管理Table和列族的Schema变更

每个tablet服务器存储一组tablet（通常是10-1000个），

Bigtable和Tablet Server都不进行数据的存储只负责在线业务，存储工作通过SSTable的数据格式写到GFS上。



### Tablet位置

通过B+树存储tablet的位置

定义了一张特殊的表Root tablet专门存放元数据，这个分区不会分裂，存的是元数据里其他Tablets的位置。

![bigtable-5](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640192904/bigtable-5.jpg)

第一级存储在Chubby的文件，包含root tablet的位置，root包含metadata tablets，包含了其他所有tablet的位置。tablet不做分割，确保不超过三层。

举个例子，客户端查询ECOMMERCE_ORDERS业务表行键是A20210101RST的某个记录，客户端查询的具体操作：

![bigtable-6](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640192906/bigtable-6.png)

也就是说在具体查找数据之前需要三次网络请求来获得数据的具体位置。一般前几次的查询也会缓存起来，以减少请求次数。

三层结构可以让Bigtable拓展到足够大，tablet大小限制为128MB，每条记录大约1KB，可以存$2^{34}$个Tablet，也就是160亿个Tablet。

客户端不需要经过master，让设计更加高可用

### 动态分区

Bigtable采用动态区间分区，通过自动去split的方式动态分区。
好比是往箱子里放书，按照书名的字母顺序，一旦箱子装满，就中间一分为二，将下面一半放到一个新的空箱子里去。
如果两个相邻的箱子都很空，就可以将其合并。
![bigtable-4](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640192909/bigtable-4.png)

## SSTable底层结构

Bigtable的写入数据的过程：
1. tablet server先做数据验证，以及权限验证
2. 如果合法，就以追加写的形式顺序写到GFS
3. 写入成功后还会写到一张内存表MenTable中
4. 写入的数据快要超过阈值时，会将内存的MemTable冻结，创建一个新的MemTable，被冻结的MemTable会被转换为SSTable写入到GFS，然后从内存中释放掉。


Major Compaction机制，对SSTable进行合并，把数据压实在一起，比如只留下时间戳最近的三个版本的数据。
读取数据的时候，读取的是MemTable和SSTable的合并在一起的视图。
也就是说并没有直接的修改和删除操作，一旦写入就是不可变的，写入的是数据的一个新版本，后台会定时gc，通过合并SSTable来清楚过期和被删除的数据。

![bigtable-7](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640192906/bigtable-7.png)

## 总结

Bigtable包括四个组件：
1. 负责存储数据的GFS
2. 负责作为分布式锁和目录服务的Chubby
3. 复杂提供在线服务的Tablet Server
4. 复杂调度Tablet和调整负载的Master

![bigtable-8](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640192908/bigtable-8.png)

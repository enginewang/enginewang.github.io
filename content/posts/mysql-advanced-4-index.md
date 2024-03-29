---
title: "MySQL进阶（四）索引"
date: 2022-03-17T14:21:14+08:00
draft: false
categories: ["技术"]
tags: ["MySQL"]
---

## 索引的概念与意义

索引是数据库中最重要的概念之一，它是一种特殊的查询表，可以被数据库搜索引擎用来加速数据的检索。索引能实现快速定位数据的一种存储结构，其设计思想是以空间换时间。

索引可大大提高SELECT和WHERE的查询速度，不过会降低UPDATE和INSERT的速度。

可以理解为查阅某本书的章节名，目录就是一个索引，可以通过目录快速找到有没有自己想要的内容，而不必翻遍这本书。

### 索引的优缺点

优点：
- 索引能够提高数据检索的效率，降低数据库的IO成本。
- 通过创建唯一性索引，可以保证数据库表中每一行数据的唯一性，创建唯一索引
- 在使用分组和排序子句进行数据检索时，同样可以显著减少查询中分组和排序的时间
- 加速两个表之间的连接，一般是在外键上创建索引

缺点：
- 需要占用物理空间,建立的索引越多需要的空间越大
- 创建索引和维护索引要耗费时间，这种时间随着数据量的增加而增加
- 会降低表的增删改的效率，因为每次增删改索引需要进行动态维护，导致时间变长

### 何时使用索引

什么时候不用索引：
- 查询频度比较少的字段不要创建索引，因为索引主要就是为了查询加速
- 对于字段中存在大量重复数据的不要创建索引，比如性别，因为 MySQL 还有一个查询优化器，查询优化器发现某个值出现在表的数据行中的百分比很高的时候，它一般会忽略索引，进行全表扫描。
- 表数据本身就很少，全局扫描成本很低
- 经常更新的字段，因为有增删改的B+树的成本。


什么时候用索引：
- 字段有唯一性限制
- 经常用where查询的字段
- 进程用GROUP BY、ORDER BY的字段，不需要排序了，索引排好了

## 索引的分类

按照物理结构：
- B+树索引
- Hash索引
- Full-text索引

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/mysql/%E7%B4%A2%E5%BC%95/%E7%B4%A2%E5%BC%95%E5%88%86%E7%B1%BB.drawio.png)

按照物理存储分：
- 聚簇索引（主键索引）
- 二级索引（辅助索引）

按照字段特性分：
- 主键索引
- 唯一索引
- 普通索引
- 前缀索引

按照字段个数分：
- 单列索引
- 联合索引

## MySQL索引的使用

通过`CREATE INDEX`创建索引：

创建表t1的c1字段的单字段索引，索引名是index_c1
```sql
CREATE INDEX index_c1 ON TABLE t1(c1)
```

对于主键，MySQL会自动创建索引。

创建组合索引
```sql
CREATE INDEX index_c2 ON TABLE t1(c1, c2, ...)
```

### 怎么看实际使用了什么索引？

通过explain命令的type字段，可以看到是否使用了索引

ALL全表扫描 < index全索引扫描 < range ~ index_merge 范围扫描 < ref < eq_ref < const < system


## 索引的多种实现方式

### 哈希表

哈希表的概念不做介绍，理论上它可以在$O(1)$时间内找到这个key对应的元素，然而多个key在hash之后出现同一个值的话，也就是哈希冲突，会挂在后面退化成链表，这个倒是有解决方法。

但是哈希表一方面不支持排序，也不能自持快速的范围查询，比如查询[a,b]之间的数据，哈希表就只能$O(n)$

哈希表做等值kv查询的效率不错，比如NoSQL、Memcached的一些，但是范围查询表现不佳。

### 有序数组

有序数组字在等值和范围查询的效率都很高，但是缺点也非常明显，插入和删除的复杂度很高。

适用于很少插入删除但是查询很多的场景，也就是静态存储，比如往年的一些数据，很少修改经常查询的，可以使用有序数组。

### 二叉搜索树

二叉搜索树的查询复杂度是$O(log N)$，当然为了保持这个效率还需要维持平衡，更新的复杂度也是$O(log N)$

但是大部分实际情况都不会用二叉搜索树，因为实际数据量较大时，会造成二叉树高度过高，底部节点的访问需要读取很多数据块。

更多的是使用N叉树。

### 跳表

Redis用的就是跳表，跳表的原理见`跳表.md`

### B+树

MySQL的InnoDB采用的就是B+树。其查找的复杂度是$O(log2(N))$，效率很高

B+树是一种多叉树，只在叶子节点保存数据，非叶子节点存放索引，并且是按照主键的顺序存放。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/mysql/%E7%B4%A2%E5%BC%95/btree.drawio.png)

B+树查找数据的过程：
查找数据时，B+树会从根节点开始，按照从左到右的顺序比较查询条件和节点中的键值。如果查询条件小于节点中的键值，则跳到该节点的左子节点继续查找；如果查询条件大于节点中的键值，则跳到该节点的右子节点继续查找；如果查询条件等于节点中的键值，则继续查找该节点的下一个节点。

B+Tree 存储千万级的数据只需要 3-4 层高度就可以满足，这意味着从千万级的表查询目标数据最多需要 3-4 次磁盘 I/O，所以B+Tree 相比于 B 树和二叉树来说，最大的优势在于查询效率很高，因为即使在数据量很大的情况，查询一个数据的磁盘 I/O 依然维持在 3-4次。

### 为什么InnoDB选择了B+树？

相比于B树，B树的非叶子结点也存数据，B+树在相同 的深度下能存储更多的数据。并且B+树叶子节点采用双链表连接，适合基于范围的查找，B树没有。

相比于二叉树，数据量较大时，二叉树的深度很大，效率很低，IO次数太高。

想比于哈希，哈希不支持运算和范围查找，只适合等值查询。

## InnoDB的索引

### InnoDB的数据页

InnoDB按照数据页来存储数据，读取记录的时候，以页为单位整体读入内存。InnoDB中，数据页的大小默认是16kb。数据库一次最少从磁盘中读取 16K 的内容到内存中，一次最少把内存中的 16K 内容刷新到磁盘中。

![](https://img-blog.csdnimg.cn/img_convert/243b1466779a9e107ae3ef0155604a17.png)

![](https://img-blog.csdnimg.cn/img_convert/fabd6dadd61a0aa342d7107213955a72.png)

File Header中包含两个指针，分别指向前一个和后一个数据页。从而使得在逻辑上是连续的。

![](https://img-blog.csdnimg.cn/img_convert/557d17e05ce90f18591c2305871af665.png)

数据页的记录会按照主键顺序组成单向链表。但是这样查询效率很低，所以就用到页目录来起到索引作用。

![](https://img-blog.csdnimg.cn/img_convert/261011d237bec993821aa198b97ae8ce.png)

页中的行记录会划分为多个组，页目录用来存储每组最后一条记录的偏移量。这些槽会按照顺序存储起来，相当于指向了不同组的最后一个记录。

通过槽查找记录，因为有序，可以通过二分法进行查找。定位到槽之后再遍历槽的记录。

> InnoDB的分组规定
第一个分组只有1条记录，也就是这个数据页的第一条最小记录
最后一个分组的条在1-8条之间
中间分组的条目在4-8条之间。

### 从数据页到B+数索引

实际上会有多个数据页，如何建立索引来定位记录所在的页。InnoDB利用B+树来存储，每个结点都是一个数据页。

![](https://img-blog.csdnimg.cn/img_convert/7c635d682bd3cdc421bb9eea33a5a413.png)

其中叶子节点才存放数据，而非叶子结点只存放目录项作为索引。




## 聚簇索引和非聚簇索引

### 聚簇索引

存的是主键，叶子节点的内容是整行数据

通过聚簇索引只需要查询一次，因为可以获取表的完整数据。

### 非聚簇索引（二级索引/辅助索引）

存的是非主键，叶子节点的内容是主键，需要第一次查询索引树，获取数据页的地址，然后通过地址查询数据。（除非是覆盖索引）

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/mysql/%E7%B4%A2%E5%BC%95/%E4%BA%8C%E7%BA%A7%E7%B4%A2%E5%BC%95btree.drawio.png)

(橙色的是非主键索引的key，绿色的是主键值)

为什么不也存完整数据呢？因为数据是会增删改变动的，如果非聚簇索引也保存完整数据，那么成本非常高。

一个表中聚簇索引只能有一个，因为只能有一个主键，但是非聚簇索引可以有很多个。

### InnoDB如何选择聚簇索引的索引键

> 创建的主键索引和二级索引默认使用的是 B+Tree 索引。

- 如果有主键，就默认使用主键作为聚簇索引的索引键
- 如果没有主键，就选择第一个不包含NULL的唯一值
- 如果上面两个都没有，InnoDB会使用一个隐藏的、自动生成的自增id列作为索引项。因此，在InnoDB中，即使表没有明确的主键索引，也会创建一个B+树索引。

### 查询时聚簇索引和非聚簇索引如何工作

> 如果查询语句是关于主键的查询

比如：
```sql
select * from table where ID=1
```
就需要查找聚簇索引

> 如果查询的是非主键

比如：

```sql
select * from table where c1=2
```

就需要先去查找c1这个字段的索引，得到主键值，然后回聚簇索引里搜索具体的一行数据。这个过程称为**回表**。

> 如果范围查询非主键

比如：

```sql
select * from table where c1 between 1 and 3
```

首先会在字段c1的索引表上找c1=1的记录，取得主键ID，然后回聚簇索引里取对应的行，接下来找c1索引的下一个值，取得主键ID...一直找到c1索引的c1值大于3，循环结束。

这种范围查询的情况会产生很多次回表。


这也说明了，我们应该尽量用主键进行查询。

![](https://s2.loli.net/2023/03/02/JMvPT6CHBSRh3wn.png)

## 联合索引

联合多个键进行索引，好处有：
1. 减少开销，根据最左匹配匹配，创建一个联合索引相当于建立了多个索引
2. 如果是覆盖，也就是只通过一些索引的列选取索引的其他列，可以不用回表，提高性能
3. 如果是where...and查询，只有单条索引就需要筛选很多元素然后回表，但是联合索引可以让筛选出的量大大减少。

### 联合索引的原理

比如建立(a,b,c)的联合索引，能查到的数据包含a,b,c。

其中的顺序就是先对a排序，然后对b排序，然后对c排序。**b 和 c 是全局无序，局部相对有序的，在没有遵循最左匹配原则的情况下，                                                     无法利用到索引的。**

举个例子，这些数字会按照下面的顺序存储到B+树中，先满足a有序，a相等再看b，b相等再看c

| a   | b   | c   |
| --- | --- | --- |
| 0   | 1   | 1   |
| 1   | 0   | 3   |
| 1   | 3   | 2   |
| 2   | 5   | 9   |
| 2   | 6   | 1   |

### 最左前缀原则

建立**联合索引**的时候，索引内的字段顺序，可以通过调整顺序来少维护索引，但是必须保持最左前缀原则。

比如该表：

```sql
CREATE TABLE test (
    id         INT NOT NULL,
    last_name  CHAR(30) NOT NULL,
    first_name CHAR(30) NOT NULL,
    PRIMARY KEY (id),
    INDEX name (last_name,first_name)
);
```

为`last_name`和`first_name`创建了一个联合索引`name`，这个索引支持`last_name`和`first_name`的联合查询，也支持只有`last_name`的查询，但是不支持只有`first_name`的查询

联合索引的任何一个索引的最左前缀都会被优化器用于查找列。比如，一个包含三列的联合索引 (col1, col2, col3)，索引会生效于 (col1), (col1, col2), and (col1, col2, col3)，但是其他情况的组合则不会生效。

另外，由于是按照从左往右的顺序建立的索引，遇到范围值就会停止，比如建立了(a,b,c)联合索引，查询语句为：

```sql
select * from t where a = 1 and b > 10 and c = 1;
```

会用到(a,b)索引，不会用到c，因为b是范围值。联合索引遇到范围值，那么之后的查询条件就不能再用到联合索引。

### 建立联合索引的顺序

应该把区分度更大的字段排在前面，这样更容易检索，比如某个id就适合放在前面，性别就适合放在后面。

### 建立联合索引的好处

1. 建立一个联合索引的成本略微高于单个字段索引，但是相当于建立了多个索引，比如(a,b,c)相当于建立了(a)，(a,b)，(a,b,c)三个索引
2. 更容易覆盖索引，查询的字段如果在联合索引中，如果索引没失效，就可以直接返回不需要回表
...

## 覆盖索引

覆盖索引（Covering Index）就是可以从非主键索引中就能查到的记录，而不需要回表，从而提升性能。

比如我们有一个需求就是通过查询c1获得c2的内容，如果正常的建立c1和主键ID的索引，那么每次查询一行都要回表。

而可以建立联合索引：

```sql
ALTER TABLE t DROP INDEX c1;
ALTER TABLE t ADD INDEX I_c1_c2(c1, c2);
```

之后再通过c1查询c2的话：

```sql
select col1,col2 from test where col1=1 and col2=2;
```

在联合索引上找到c1，就可以直接返回c2。

覆盖索引能够显著提高查询效率，因此在建立索引时应尽量考虑包含查询语句中所需的所有列。


## 唯一索引

唯一索引的值必须唯一，但是允许有空值，唯一索引的最大作用就是确保写入数据库的该列的值是唯一的

有些时候需要绝对的唯一，但是这个字段又不想使用主键索引，比如身份证号，因为比较长，作为主键的效率很低，就可以加唯一索引，并且允许空值，如果是主键索引是不行的。

### 唯一索引vs普通索引

- 查询

普通索引查找到第一条记录就会继续查找下一条。而唯一索引查找到第一个满足的记录就会停止搜索。普通索引多了一个查找和判断下一条的操作。

- 插入

唯一索引多了判断是否有冲突的逻辑，成本会比较高

实际场景中，如果有对某个字段需要保证唯一性的业务需求，则使用唯一索引，否则还是使用普通索引。


## 前缀索引

可以通过`col(n)`的语法来为该列的前n个字符创建索引，这样创建的索引文件会小很多。对`BLOB`和`TEXT`创建索引也必须采用这种方式。



### 字符串字段的前缀索引

正常情况来说，给字符串字段加索引，会给整个字符串建立索引，但有有些时候字符串很长，比较浪费空间，我们没必要全部存，存一部分即可。

比如有
```
123454@gmail.com
123455@gmail.com
123456@gmail.com
123457@gmail.com
```

我们只需要将前缀存在索引里，比如对于这个情况，我们存前6位即可区分出所有数据，这样既可以节约空间，又可以提高匹配效率。

```sql
alter table t add index index1(email(6));
```

如果出现数据不同只是前缀一样的情况，回表的时候会多访问一些次数，所以最好这种情况不要占比太多，也就是说前缀长度的选取有讲究。

比如可以通过下面的sql参看选取各个长度的索引的不同值，设定一个可接受的比例然后选取合适的前缀长度。

```sql
select
  count(distinct left(email,4)）as L4,
  count(distinct left(email,5)）as L5,
  count(distinct left(email,6)）as L6,
  count(distinct left(email,7)）as L7,
from t;
```

除了前缀索引之外，如果一些字符串是后面的不一样前面的一样，比如一个地区的身份证，那么可以考虑倒序存储，每次存的时候倒过来存，查的时候再倒回来。
另一个方式是使用哈希字段，也就在表上再增加一个字段，这个字段是我们需要做索引的字段的哈希值。我们在这个哈希值字段上做索引，这样索引的长度就变成了四个字节。

但是倒序和哈希的缺点是不再支持范围查询。

## 索引下推

MySQL5.6之后引入索引下推（INDEX CONDITION PUSHDOWN，ICP），InnoDB引擎包含该功能，通过把索引过滤条件从服务层下推给存储引擎，来减少 MySQL 存储引擎访问基表的次数以及 MySQL 服务层访问存储引擎的次数。

如果没有ICP，通过二级索引查找时，会检索到所有数据的主键然后回表，其他的字段索引不会使用，再把所有的这些数据返回给MySQL服务器，然后服务层进行筛选。

![](https://ask.qcloudimg.com/http-save/yehe-7565276/9e03e63bd581e9b9c14625003b3e1511.png?imageView2/2/w/1620)

使用ICP，如果有一些关于索引列的判断条件，就会将这些判断条件一起传给存储引擎，存储引擎直接进行筛选，最后给服务层筛选where条件的其他部分。


![](https://ask.qcloudimg.com/http-save/yehe-7565276/a5cebfa6295030c3906fc43dde51a9ad.png?imageView2/2/w/1620)


索引条件下推默认是开启的，可以使用系统参数optimizer_switch来控制器是否开启。

```bash
# 开启索引下推
set optimizer_switch="index_condition_pushdown=on";
# 关闭索引下推
set optimizer_switch="index_condition_pushdown=off";
```

## 哈希索引

MySQL中只有Memory引擎支持哈希索引。具有下面的特点：

- 精确查找效率极高，为$O(1)$，当然效率会随着哈希冲突而下降
- 只支持完整建立索引项的对应查找，比如建立了(a,b)的哈希索引，只查找a不会走索引
- 不支持比较和IN等运算

## 多个索引，MySQL会选择哪个

## 索引失效

在一些情况下，索引是会失效的，包括：

### 使用左边带%的like模糊查询

如果右边带%是可以使用索引的，但是左边带，索引就失效了

因为索引 B+ 树是按照「索引值」有序排列存储的，只能根据前缀进行比较。

### where里面对索引列进行运算或者函数

比如

```sql
select * from t_user where length(name)=6;
select * from t_user where id + 1 = 10;
```

因为索引保存的是索引字段的原始值，而不是经过函数或者表达式计算后的值，自然就没办法走索引了。

如果频繁用到该函数，可以直接将计算结果建立一个索引值：

```sql
alter table t_user add key idx_name_length ((length(name)));
```

### 联合索引不满足最左匹配原则的时候，联合索引会失效

联合索引要能正确使用需要遵循最左匹配原则，也就是按照最左优先的方式进行索引的匹配。

如果创建了一个 (a, b, c) 联合索引，如果查询条件是以下这几种，就可以匹配上联合索引：

where a=?；
where a=? and b=?；
where a=? and b=? and c=?；

其他的情况，联合索引都会失效。

当然a的位置不重要，因为有优化器，比如：
`where b=? and a=?` 跟`where a=? and b=?`是一样的。

### where中使用OR且存在非索引项

比如OR前面是索引项，后面是非索引项。

如果想要走索引，右边的也需要设置为索引。

## 索引优化

### 前缀索引优化

采用前缀索引，用字符串的前面几个字符建立索引，而不是完整的字符串

### 覆盖索引优化

经常select的一些字段放在一起作为联合索引，这样不需要回表。

### 主键索引最好自增

每次插入的时候直接插入到最后，不需要进行额外的B+树一些的移动或者页分裂的情况，只会开辟新页。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/mysql/%E7%B4%A2%E5%BC%95/%E9%A1%B5%E5%88%86%E8%A3%82.png)

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/mysql/%E7%B4%A2%E5%BC%95/%E5%BC%80%E8%BE%9F%E6%96%B0%E9%A1%B5.png)

另外，主键索引的字段最好别太长，因为二级索引也要存储主键。

### 索引最好设置为NOT NULL

索引存在NULL会导致优化器做索引选择的时候更困难。而且也会占用空间。

## 其他有关索引的问题

### 关于COUNT

众所周知，SELECT(\*)效率很低，那么COUNT(\*)呢?

效率：

COUNT(\*) = COUNT(1) > COUNT(主键) > COUNT(字段)

count是一种聚合函数，用于统计符合查询条件的记录的个数。（不包括NULL）

`count(字段)`就是统计有多少个该字段不为NULL的记录个数，需要全局扫描，效率最低。

`count(1)`和`count(*)`都是统计所有不为NULL的记录个数

`count(主键)`时，如果只有主键的聚簇索引，那么就会遍历聚簇索引，如果有二级索引，就会遍历二级索引，因为二级索引包含了所有的主键，并且遍历成本低。

`count(1)`相比于`count(主键)`而言，不会读取任何字段，因为1不可能是NULL，读到一条记录就直接+1。所以`count(1)`效率略高于`count(主键)`

由于MVCC，InnoDB无法确定返回多少行，所以没有记录表的条目个数的信息，而MyISAM是包含的，MyISAM的count的复杂度是$O(1)$

![](https://img-blog.csdnimg.cn/img_convert/04d714293f5c687810562e984b67d2e7.png)


比如最后的时刻，同时查询表的条目数，是不一样的。所以没法记录。

> 优化COUNT(*)

采用explain或者show table status来查看近似值

将这个计数值单独保存到另一张专门的计数表中
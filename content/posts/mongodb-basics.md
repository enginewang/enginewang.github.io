---
title: "Mongodb初级教程"
date: 2020-04-20T14:29:14+08:00
draft: false
categories: ["工程"]
tags: ["MongoDB", "Database"]
---


#### 背景

mongodb是一个基于分布式文件存储的数据库。由C++语言编写。旨在为WEB应用提供可扩展的高性能数据存储解决方案。它是一个介于关系数据库和非关系数据库之间的产品，是非关系数据库当中功能最丰富，最像关系数据库的。

这里简单的讲一下使用方法，不涉及底层理论

#### 起步

##### Mac下安装MongoDB
之前是
`brew install mongodb`

但是现在会报错：No available formula with the name “mongodb”。

先tap一个仓库 `brew tap mongodb/brew`
安装mongodb社区版 `brew install mongodb-community`

##### 运行mongod

新建一个`/data/db`文件夹

 运行MongoDB服务
`sudo mongod`

（注：macOS 10.15 Catalina无法在根目录下进行修改，可以在其他目录新建，启动服务时通过`sudo mongod --dbpath=new_path/data/db`指定）

定位和启动MongoDB命令行
`cd /usr/local/Cellar/mongodb/4.0.3_1/bin`
`./mongo`

MongoDB和关系型数据库（Oracle、MySQL等）的区别：

| SQL    | MongoDB          |
| ------ | ---------------- |
| table  | collection(集合) |
| row    | document(文档)   |
| colume | field(数据字段)  |


每个文档是一组键值对（BSON）相同的字段不需要相同的数据类型

#### 基本命令

`show dbs` 展示所有数据库

`use xx` 使用某个数据库

使用了某个数据库后：`show collections`查看所有的集合

`db.dropDatabase()` 删除当前数据库

`db.<col>.drop()` 删除某个集合

`mongodump -o <output_path>` 导出数据库
（如果设置了密码，需要通过下面的命令导出）
`sudo mongodump -o <output_path> --authenticationDatabase admin --username <db_username> --password <db_password>`

`mongorestore -d <dbname> <db_path>` 导入数据库

##### 验证

本地的还好，如果部署到服务器上，默认是无法外网访问数据库的，倘若你想访问，就得开放端口然后在mongo的配置文件里设置0.0.0.0。然后mongo默认也没有密码

这就会产生一个很蛋疼的事，当其他人访问你服务器的ip的27017端口时，可以直接完全操作你的数据库，对于非个人弄着玩的项目，这显然是不可能接受的。

所以我们需要增加数据库验证，这里最常见的就是增加账号密码登录，方法如下：
```sql
// 先使用admin
use admin
// 创建root密码
db.createUser({user: "root",pwd: "password",roles: [ "root" ]})
```

其他的role：
```
read
readWrite
dbAdmin
userAdmin
clusterAdmin
readAnyDatabase
readWriteAnyDatabase
userAdminAnyDatabase
dbAdminAnyDatabase
```

```sql
// 创建用户
db.createUser(
{
  user: "username",
  pwd: "password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})
```

在`/etc/mongo.conf`配置文件里，把auth=true前面的`#`去掉，让验证生效。

重启mongodb服务`sudo service mongodb restart`

之后的连接方式：mongo命令行连接：
`mongo admin -u username -p password`

本地GUI（如navicat）连接，设置账号密码即可

##### 字段操作

字段重命名：

```
db.col.update({},{$rename:{"old_field":"new_field"}},false,true)
```

比如：
```
db.questionnaire.update({},{$rename:{"questionList":"question"}},false,true)
```

字段增加：
还可以指定默认值xxx
```
db.col.update({},{$set:{new_field:'xxx'}},{multi:true})
```

字段删除：
```
db.col.update({},{$unset:{'old_field':''}},false, true)
```

```
db.user_questionnaire.update({},{$unset:{'inputCostEstimation':''}},false, true)
```

##### 查找

列出集合信息：
```
db.<collection-name>.find()
```

列出第一条集合的信息（按Json排版一下）：
```
db.<collection-name>.findOne()
db.<col-name>.find({query}, {show})
```

query是一个查询字段。比如{"name":"yicheng"}这种形式
后面的参数决定field是否显示，比find({"name":"yicheng"}, {"_id": 0, "age": 1}) 表示_id不会显示，age会显示

条件比较：

| 操作 | 描述   | 用法 |
| ---- | ------ | ---- |
| $gt  | >      |      |
| $gte | >=     |      |
| $lt  | <      |      |
| $lte | <=     |      |
| $eq  | =      |      |
| $ne  | !=     |      |
| $in  | in     |      |
| $nin | not in |      |


**增删改**

增加：
```
db.col.insert(json)
```

e.g.

```
db.col.insert({"name":"engine", "age":18})

db.articles.insert({"title":"Test","author":"engine","time":"2020.02.27","kind":"tech","tags":"golang,website","content":"This is a blog for test","comment":"comment1","view":10,"like":5})

db.user.insert({"name":"user1",avatar:"https://i.loli.net/2020/03/15/XsJjRomr1dy8u4D.png","type":0,"score":20,"password":"123456","todo":""})
```

删除：
```
db.col.remove(query)
```


修改
```
db.mycoll.update(query, object[, upsert_bool, multi_bool])
```

第一个参数是查询条件，第二个参数是修改信息，第三个是如果没找到是否相当于插入（默认为false），第四个参数是修改一个还是所有（默认为false）

e.g.
```
db.col.update({"name":"engine"}, {$set:{"age":20}})

db.col.update({"age": {$gt: 20}}, {$set:{"age": 30}}, false, true)
```

更复杂的逻辑：
```
db.getCollection('participant').find().forEach(
   function(item){
       db.getCollection('participant').update({"_id":item._id},{$set:{"modifyTimes": 3}})
   }
)
```

<table class="reference">
<tbody><tr>
<th>数据类型</th>
<th>描述</th>
</tr>
<tr><td>String</td><td>字符串。存储数据常用的数据类型。在 MongoDB 中，UTF-8 编码的字符串才是合法的。   </td></tr>
<tr><td>Integer</td><td>整型数值。用于存储数值。根据你所采用的服务器，可分为 32 位或 64 位。  </td></tr>
<tr><td>Boolean</td><td>布尔值。用于存储布尔值（真/假）。  </td></tr>
<tr><td>Double</td><td>双精度浮点值。用于存储浮点值。  </td></tr>
<tr><td>Min/Max keys</td><td>将一个值与 BSON（二进制的 JSON）元素的最低值和最高值相对比。  </td></tr>
<tr><td>Array</td><td>用于将数组或列表或多个值存储为一个键。  </td></tr>
<tr><td>Timestamp</td><td>时间戳。记录文档修改或添加的具体时间。  </td></tr>
<tr><td>Object</td><td>用于内嵌文档。  </td></tr>
<tr><td>Null</td><td>用于创建空值。  </td></tr>
<tr><td>Symbol</td><td>符号。该数据类型基本上等同于字符串类型，但不同的是，它一般用于采用特殊符号类型的语言。</td></tr>
<tr><td>Date</td><td>日期时间。用 UNIX 时间格式来存储当前日期或时间。你可以指定自己的日期时间：创建 Date 对象，传入年月日信息。  </td></tr>
<tr><td>Object ID</td><td>对象 ID。用于创建文档的 ID。  </td></tr>
<tr><td>Binary Data</td><td>二进制数据。用于存储二进制数据。</td></tr>
<tr><td>Code</td><td>代码类型。用于在文档中存储 JavaScript 代码。</td></tr>
<tr><td>Regular expression</td><td>正则表达式类型。用于存储正则表达式。</td></tr>
</tbody></table>


更新某个字段的值
```bash
db.getCollection('participant').find().forEach(
   function(item){
       db.getCollection('participant').update({"_id":item._id},{$set:{"modifiTimes": 2}})
   }
)
```
#### Golang的MongoDB接口：mgo

简单的使用

```go
type Person struct {
	Name  string
	Phone string
}
func main() {
        // mgo.Dial核心函数，由url新建一个session
	session, err := mgo.Dial("mongodb://127.0.0.1:27017/")
	if err != nil {
		panic(err)
	}
	defer session.Close()
	// Optional. Switch the session to a monotonic behavior.
	session.SetMode(mgo.Monotonic, true)
        // c就连到了对应的collection
	c := session.DB("test").C("people")
        // 插入数据
	err = c.Insert(&Person{"Ale", "+55 53 8116 9639"},
		&Person{"Cla", "+55 53 8402 8510"})
	if err != nil {
		log.Fatal(err)
	}
	result := Person{}
        // result是一个查询结果
	err = c.Find(bson.M{"name": "Ale"}).One(&result)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Phone:", result.Phone)
}
```

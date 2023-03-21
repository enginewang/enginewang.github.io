---
title: "关于我"
date: 2021-10-01T23:08:54+08:00
draft: false
---

<!-- ## 为什么要建立一个博客站点？

在平常的学习生活中，我总想找个地方记录一些技术笔记和生活的感悟，希望能够分享出去，也许能对一些人有所帮助，开一个博客网站无疑是一个不错的选择。

## 博客建立历程

说来也蛮折腾的，一开始选择的是省事的Hexo+GitHub Page，后来嫌静态网页没有可玩性，用Django搭了一个站点，之后采用Go+Vue重构了网站，有非常完整的功能且已开源，但后期折腾markdown渲染、页面样式等各种繁琐的问题非常痛苦:face_with_thermometer: 最终还是回到了静态网页，目前采用简单方便的Hugo，折腾一圈又回到最初的起点。 -->

## 自我介绍

同济大学软件学院本硕，目前研二，喜欢研究各种计算机技术，主要方向是服务器全栈+Ai。

目前感兴趣的技术领域有后端、机器学习、分布式、云原生、微服务、数据库、DevOps等内容。

我兴趣广泛，除了计算机之外，我还喜欢动漫、音乐和平面设计，具有很强的搜索能力和审美能力，喜欢折腾各种电子产品和探索未知的事物

<!-- ，精通PowerPoint、Photoshop、Premiere Pro等软件。 -->

## 我部署的一些其他的有趣的东西

- ChatGPT 微信机器人

微信号：chatgptbot2023

- [drive.engine.wang](https://drive.engine.wang)

基于Cloudreve的私有网盘，支持aria2离线下载

- [gitlab.engine.wang](https://gitlab.engine.wang)

私有gitlab服务器，用于托管私人仓库和CI/CD

- [harbor.engine.wang](https://harbor.engine.wang)

私有harbor，用于托管docker镜像

- [film.engine.wang](https://film.engine.wang)

emby，私有电影站点

- [nas.engine.wang](https://nas.engine.wang:5001/)

群晖NAS

- [diffusion.engine.wang](https://diffusion.engine.wang)

diffusion图片生成，已加载二次元风格，一块RTX3060

- [app.jryy.site](https://app.jryy.site)

嘉人有约，目前活动处于停止状态，今年年底会开启新的活动

## 技术能力

- **计算机基础**：数据结构与算法、计算机网络、组成原理、操作系统、软件工程等计算机基础扎实。
- **编程语言**：熟悉Go语言, 熟悉map、slice、channel等数据结构、net/http、sync、gmp、gc等原理，熟练使用gin、echo、gorm、go-micro。熟悉Python，了解Django、Scrapy、Selenium、Pytorch。
- **Linux**：熟练使用Linux及常用命令，有Linux下开发部署的经验，熟悉git、Docker，了解k8s。
- **计算机网络**：熟悉计算机网络OSI七层模型，熟悉TCP/IP、UDP、HTTP/HTTPS、DNS等协议。
- **数据库**：熟悉MySQL，了解MySQL索引、事务、MVCC等原理。熟悉Redis、MongoDB等NoSQL，了解Redis的数据结构和底层原理。了解缓存高并发场景，如缓存穿透、缓存击穿、缓存雪崩等。
- **分布式与微服务**：了解分布式理论，了解CAP、RPC、注册中心、链路追踪、熔断、限流等原理。
- **前端**：了解HTML/css/javascript和Vue/Vuex/Vue-Router等前端开发技术，有多个全栈项目的经验。
- **Data&Ai**：了解数据分析、数据挖掘、凸优化、经典的机器学习和深度学习算法并有一定的实践。
- **英语**：CET-6，习惯使用Google，有较强的搜索能力，能基本无障碍阅读技术相关英文资料。

## 项目列表

### 基于微服务的校园交友平台

- 类别：Web全栈
- 语言：Go、JavaScript
- 说明：独立开发项目

基于go-micro实现的校园交友线上平台（研会活动），主要功能包括用户注册报名、管理员审核与管理、浏览搜索其他用户基本信息、选择心动对象和匹配、帖子的浏览发布评论等。

技术栈：
- 微服务框架：go-micro
- 通信协议：grpc+protobuf
- api网关：Wygo
- 数据库：MongoDB、Redis
- 消息队列：RabbitMQ
- 链路追踪：Jeager
- 前端：Vue.js
- UI：Bootstrap、Element

部分界面预览：

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/202302022135775.png)

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/202302022136084.png)

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/202302022136712.png)

### 基于Go语言实现的简易分布式缓存系统

独立开发

- 采用TTL过期机制、LRU缓存淘汰算法，通过gob实现数据持久化，支持http、grpc通信协议。
- 采用Gossip协议保证分布式集群的AP，采用一致性哈希实现集群的负载均衡。
- 采用分段锁机制、异步技术等方法优化性能，采用singleflight机制防止缓存击穿。


### MIT6.824 分布式系统 Lab

- 底层实现MapReduce算法，多节点并发完成海量文本的词频统计任务。
- 底层实现Raft分布式共识算法，包括集群Leader选举、日志复制、SnapShot持久化等功能。
- 在此基础上实现基于Raft的可容错的分布式kv数据库，支持Put、Append、Get操作。

### 多模态肺癌病理学图像生存预测算法研究

个人科研项目

- 通过自监督对比学习方法训练得到适用于病理学patch的特征提取器，消除了病理学patch与自然图像的异质性
- 通过Kaplan-Meier和Cox比例风险回归模型对临床特征进行筛选，选择16个有效临床特征
- 提出Siamese MI-Dense并结合ABMIL学习病理学特征，对之前的方法进行改良
- 提出GAMFB模块融合病理学和临床特征，首次将MFB用于此类任务
- 采用多任务学习同时预测其他两种疾病。
- 在大型肺癌数据集NLST上，五折交叉检验，与8种之前的方法进行对比，所提模型最终效果比SOTA高3%以上

相关成果JBHI（Q1）在投。

### 上海市智能建筑诊断与节能调适系统

与同济大学土木工程学院卢昱杰教授课题组的合作项目，单人开发，上海市政人员内部使用。

研究成果已投工程类Q1顶刊BUILDING AND ENVIRONMENT，【doi.org/10.1016/j.buildenv.2022.108897】

技术栈为gin+MongoDB+Vue.js+eCharts，包含完整的问卷系统、数据计算和分析、可视化等。

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/%E7%BB%BF%E8%89%B2%E5%BB%BA%E7%AD%91%E7%B3%BB%E7%BB%9F-1.png)

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/202302022137495.png)


### 个人博客网站

（目前博客的上一个版本，由于不太想纠结于一些细节，就换回了hugo）

- 类别：Web全栈
- 语言：Go、JavaScript
- 说明：独立开发项目

基于echo和Vue.js开发的个人博客项目，包括用户管理、文章管理、在线写作、类别/tag管理、markdown渲染、文章评论等功能。

Github地址：
- 前端：https://github.com/enginewang/yichengBlog
- 后端：https://github.com/enginewang/BlogBackend

部分界面预览：

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/yichengBlog-1.png)

### 乳腺癌患者生存预测系统

本科毕设的一部分

- 类别：算法 + Web全栈
- 语言：Python、Go、JavaScript
- 说明：独立开发项目


通过对METABRIC数据集进行数据挖掘，结合Cox比例风险回归模型、RSF随机生存森林和深度神经网络对乳腺癌患者各个协变量的生存风险进行建模与预测并提出合理建议。并使用Django构建了一套基于web的乳腺癌患者生存预测系统


![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/%E4%B9%B3%E8%85%BA%E7%99%8C%E7%94%9F%E5%AD%98%E5%88%86%E6%9E%90-1.png)


### 华为杯第十八届中国大学生数学建模

- 全国二等奖
- 类别：数据挖掘 + 可视化
- 语言/框架：Python、scikit-learn、Pytorch
- 说明：队长，负责架构设计、算法实现

抗癌药物候选优化数据挖掘

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/202302022138084.png)

### 一种基于代价敏感的稀有肿瘤类别小样本分类的算法模型

专利号【202111310276.6】

将预训练网络学习到的特征分布映射为类高斯分布并存储在特征库中，在元学习阶段基于注意力机制，并引入代价敏感函数，解决了稀有肿瘤小样本问题，得到了更好的分类效果

### 基于虚幻4的局域网联机仿王者荣耀moba游戏

课程作业，团队项目，主要负责各个核心类的C++代码编写。

https://github.com/enginewang/ArenaOfValor


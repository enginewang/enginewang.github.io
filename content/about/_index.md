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

除了计算机技术之外，还喜欢动漫、音乐和平面设计，具有很强的信息检索能力和审美能力，还喜欢折腾各种电子产品和探索未知的事物。

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
- UI库：Bootstrap、Element

部分界面预览：

![](https://s2.loli.net/2023/02/02/xJYCoa1cduLzpiD.png)

![](https://s2.loli.net/2023/02/02/CfE3brg57LKWdpQ.png)

![](https://s2.loli.net/2023/02/02/d5Hw2CUjA1ISJsg.png)

### 上海市智能建筑诊断与节能调适系统

与同济大学土木工程学院卢昱杰教授课题组的合作项目，单人开发，上海市政人员内部使用。

研究成果已投工程类Q1顶刊BUILDING AND ENVIRONMENT，【doi.org/10.1016/j.buildenv.2022.108897】

技术栈为gin+MongoDB+Vue.js+eCharts，包含完整的问卷系统、数据计算和分析、可视化等。

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/%E7%BB%BF%E8%89%B2%E5%BB%BA%E7%AD%91%E7%B3%BB%E7%BB%9F-1.png)

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/2.png)


### 个人博客网站

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

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/1.png)

### 一种基于代价敏感的稀有肿瘤类别小样本分类的算法模型

专利号【202111310276.6】，将预训练网络学习到的特征分布映射为类高斯分布并存储在特征库中，在元学习阶段基于注意力机制，并引入代价敏感函数，解决了稀有肿瘤小样本问题，得到了更好的分类效果




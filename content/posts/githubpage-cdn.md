---
title: "给博客网站上CDN"
date: 2022-04-10T21:34:42+08:00
draft: false
categories: ["技术"]
tags: ["CDN", "github page", "网站"]
---

## 为什么需要CDN

因为众所周知的原因，Github在国内访问时经常抽风，page抽风概率小一点但还是有概率访问不了或者很慢。于是我尝试给博客网站进行CDN加速。

> 内容分发网络（Content Delivery Network，CDN）通过将站点内容发布至遍布全球的海量加速节点，使其用户可就近获取所需内容，避免因网络拥堵、跨运营商、跨地域、跨境等因素带来的网络不稳定、访问延迟高等问题，有效提升下载速度、降低响应时间，提供流畅的用户体验。

不说废话，先看看效果。

加速之前，惨不忍睹：

![](https://s2.loli.net/2023/01/31/oifKjkDxgcGqBOV.png)

```bash
$ ping blog.engine.wang
PING blog.engine.wang (185.199.110.153): 56 data bytes
64 bytes from 185.199.110.153: icmp_seq=0 ttl=44 time=253.192 ms
64 bytes from 185.199.110.153: icmp_seq=1 ttl=44 time=195.049 ms
64 bytes from 185.199.110.153: icmp_seq=2 ttl=44 time=237.292 ms
64 bytes from 185.199.110.153: icmp_seq=3 ttl=44 time=229.440 ms
```

加速之后，太香了：

![](https://s2.loli.net/2023/01/31/AZSGdaLjHgzJ9se.png)

```bash
$ ping blog.engine.wang
PING qtywpeac.slt.sched.tdnsv8.com (111.29.52.131): 56 data bytes
64 bytes from 111.29.52.131: icmp_seq=0 ttl=53 time=36.333 ms
64 bytes from 111.29.52.131: icmp_seq=1 ttl=53 time=133.613 ms
64 bytes from 111.29.52.131: icmp_seq=2 ttl=53 time=36.479 ms
64 bytes from 111.29.52.131: icmp_seq=3 ttl=53 time=37.851 ms
```

## 前置条件

- 有域名
- 域名已备案

因为我的域名是从腾讯云买的，而且也备了案，如果不是的话可以考虑Cloudflare cdn之类的。

## 给github page博客网站配置腾讯云CDN

前往CDN内容分发网络，配置一下加速域名

![](https://s2.loli.net/2023/01/31/xmy2hz8ksQHrL3R.png)

然后是源站地址和回源host，源站地址就是github page的一些ip：

![](https://s2.loli.net/2023/01/31/c2TR6ZgN7he8fKL.png)

前往缓存控制页，修改节点缓存过期配置：

![](https://s2.loli.net/2023/01/31/D3XnV52owhKLJWT.png)

申请一下SSL证书，然后配置HTTPS：

![](https://s2.loli.net/2023/01/31/32HZtkaxIBUWqPe.png)

需要添加一个CNAME解析，解析到提供的cdn地址：

![](https://s2.loli.net/2023/01/31/G5MuOiALaRpPmyU.png)

这里添加解析的时候，之前的CNAME、A解析会断开，再重新加上指向enginewang.github.io的CNAME解析即可。

![](https://s2.loli.net/2023/01/31/1dM7EPVbCqSgXF2.png)

境外可以仍然指向github page，境内则指向我们配置的cdn
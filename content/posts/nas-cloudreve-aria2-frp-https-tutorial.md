---
title: "Cloudreve+aria2+群晖+frp内网穿透+nginx+https搭建私有云"
date: 2023-01-29T16:21:02+08:00
draft: false
categories: ["生活"]
tags: ["nas", "群晖", "Cloudreve", "私有云", "内网穿透", "nginx"]
---

## 为什么需要一个私有云盘？

公有云，诸如百度云盘等，不充会员的话速度感人，超级会员价格很贵，而且界面冗杂广告多。另外存储空间也比较有限，买空间非常不划算。

即使我目前还是百度云盘超级会员，但我依然不会用公有云作为主力，一个最致命的点在于国内的云服务商有内容版权审查机制，甚至会自己删文件，还可能造成隐私泄露，所以我最多保存网友分享的一些资源，然后下载到本地，几乎不会用这些公有云来存储备份自己的文件。

私有云就是版本答案，也就是自己搭建一个云盘，一些比较老牌的私有云比如Seafile、Owncloud、NextCloud，但是我最后还是选择了Cloudreve。

Cloudreve是一款国人开发的公私兼备的网盘系统，技术栈是 Go + Gin + React + Redux + Material-UI，我正好也比较熟悉这一套后端架构，顺便买了一个pro版支持了一波，之后有时间的话也可以学习一下源码。

![](https://s2.loli.net/2022/12/01/fqOMpRr4Kaum9Zn.png)

Cloudreve官网：https://cloudreve.org/
Cloudreve Github：https://github.com/cloudreve/Cloudreve 目前有17k star了

它的特点包括：支持密码分享、直链提取、外部云存储、aria2离线下载、在线预览、多用户、在线解压打包等等。

> 唯一让我感到遗憾的是不支持文件同步
Dropbox（全程科学上网+免费版只能三个设备、付费版巨贵+容量只有十几G）和Synnology Drive（用户体验差、经常卡死不同步）都有不小的瑕疵，很想找个代替品。

一个更好的方式其实是在云服务器上直接搭建Cloudreve，配合阿里云OSS或者腾讯云COS等存储，这样带宽也拉满，但是：

1. 租云服务器太贵了，就算第一年很便宜，续费会很贵。之后换服务器的话迁移比较麻烦。
2. 存储资源不在本地，仍然有审查风险。
3. COS、OSS之类的存储服务或者云硬盘也是按年买的，也很贵

可以把群晖利用起来，通过内网穿透作为一块永久的10T的云硬盘。这倒不是说这种方式就没有缺点：

1. 自己没有公网ip，还是要租高带宽的云服务器，这里我租的是10M带宽的，每次换新账号，一年也要大几百
2. 传输的路径变长，同时吃frps服务器和内网的上行带宽，上传下载的速度会低于云服务器搭建
3. 最致命的点在于不能接受本地停电，nas断电直接瘫痪。（我的群晖就放在学校结果放寒假被宿管阿姨拔掉了总闸，非常难受）

整个记录包括：
1. 群晖部署和配置Cloudreve
2. 群晖部署和配置aria2
3. 云服务器配置frps
4. 群晖部署和配置frpc
5. 云服务器配置nginx
6. 云服务器配置https、DNS解析

## 群晖部署和配置Cloudreve

因为我用的是捐赠付费版Cloudreve，所以就采用可执行文件的传统搭建方式不用docker了，其实也很方便。

如果是免费版，就去 http://github.com/cloudreve/Cloudreve/releases 下载对应版本的cloudreve。付费版直接去内部渠道下载，与根域名授权密钥一起传输到nas里，然后解压，给权限、运行：

> 先开nas的ssh服务，然后ssh连接到nas

```bash
#解压获取到的主程序
$ tar -zxvf cloudreve_VERSION_OS_ARCH.tar.gz
# 赋予执行权限
$ chmod +x ./cloudreve
# 启动 Cloudreve
$ ./cloudreve
```

第一次先运行，会显示初始admin密码，记录一下，可以登录然后修改密码

```bash
root@SynologyNas:/volume1/Applications/cloudreve# ./cloudreve

   ___ _                 _
  / __\ | ___  _   _  __| |_ __ _____   _____
 / /  | |/ _ \| | | |/ _  | '__/ _ \ \ / / _ \
/ /___| | (_) | |_| | (_| | | |  __/\ V /  __/
\____/|_|\___/ \__,_|\__,_|_|  \___| \_/ \___|

   V3.6.2  Commit #b1d8e44  Pro=true
================================================

[Info]    2023-01-31 14:51:56 Initializing database connection...
[Info]    2023-01-31 14:51:56 Start initializing database schema...
[Info]    2023-01-31 14:52:03 Admin user name: admin@cloudreve.org
[Info]    2023-01-31 14:52:03 Admin password: XXX
```

之后就可以通过nohup来后台运行

```bash
$ nohup ./cloudreve &
```

更好的方式还是配置systemd进程守护，这样断了还能重启：

```bash
$ sudo -i
$ vim /usr/lib/systemd/system/cloudreve.service
```

```bash
[Unit]
Description=Cloudreve
Documentation=https://docs.cloudreve.org
After=network.target
After=mysqld.service
Wants=network.target

[Service]
WorkingDirectory=/volume1/Applications/cloudreve
ExecStart=/usr/bin/nohup /volume1/Applications/cloudreve/cloudreve  >/dev/null 2>&1 &
Restart=on-abnormal
RestartSec=5s
KillMode=mixed

StandardOutput=null
StandardError=syslog

[Install]
WantedBy=multi-user.target
```

```bash
# 启动服务
systemctl start cloudreve

# 停止服务
systemctl stop cloudreve

# 重启服务
systemctl restart cloudreve

# 查看状态
systemctl status cloudreve

# 设置为开机启动
systemctl enable cloudreve
```

> 局域网访问配置

如果是捐赠pro版，设置了域名限制，所以需要去路由器改host，直接本地局域网192.168.x.x无法访问：

```bash
$ echo "addn-hosts=/jffs/configs/hosts" > /jffs/configs/dnsmasq.conf.add
$ echo "192.168.50.98 nas.engine.wang" >> /jffs/configs/hosts
$ service restart_dnsmasq
```

通过`http://nas.engine.wang:5212`即可局域网访问（不吃内网穿透，非常快）


## 配置内网穿透

### 购买服务器和配置frps

购买服务器和搭建frps的部分见我之前的文章：[https://blog.engine.wang/posts/frp-notes](https://blog.engine.wang/posts/frp-notes)，这里就不赘述了。

推荐腾讯云的轻量应用服务器，带宽高，这里选了10M的，勉强够用，再高的也买不起了。

### 群晖的frpc配置

内网穿透时，将nas的5212端口映射到服务器的某个端口，比如这里我设的是15212。

```bash
[nas_cloudreve_5212]
type = tcp
local_ip = 192.168.50.98
local_port = 5212
remote_port = 15212
```

这样就可以通过服务器的15212端口穿透到本机的5212端口了。

## https和nginx配置

https的ssl证书可以用免费的Let's Encrypt之类的第三方免费证书服务，因为我的云服务器是腾讯云的，也有20个额度的免费ssl证书，就用腾讯云的也比较方便:

下载SSL证书的crt和key，放到云服务器上。

然后在云服务器上配置nginx，在nginx配置文件中添加下面的内容：

```nginx
server {
    listen 443 ssl;
    server_name drive.engine.wang;
    ssl_certificate /home/ubuntu/nginx/cert/drive.engine.wang.crt;
    ssl_certificate_key /home/ubuntu/nginx/cert/drive.engine.wang.key;
    ssl_session_timeout 5m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
    ssl_prefer_server_ciphers on;

    client_max_body_size 1024m;

    location / {
        proxy_set_header HOST $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://<服务器内网ip>:5222;
    }
}
server {
     listen 80;
     server_name drive.engine.wang;
     return 301 https://$host$request_uri;
}
```

重载nginx即可生效：
```bash
$ sudo nginx -s reload
```

然后加一条dns解析：

![](https://s2.loli.net/2022/12/02/8NBjAlIQ36MuESh.png)


现在访问`drive.engine.wang`即可进入Cloudreve。

## aria2配置

光有Cloudreve还不够，这里再配置一个非常方便的下载神器：aria2。aria2可以支持离线下载https、磁力等链接，相当于多了个云端的迅雷，而且速度拉满非常爽。这里建议还是配置一下。

我用的 https://github.com/P3TERX/aria2.sh

将sh执行文件下载到群晖中，然后安装一些必要的包，因为群晖不支持apt、yum等，所以使用ipkg：

```bash
# 先安装bootstrap，才有ipkg、wget等。
$ wget http://ipkg.nslu2-linux.org/feeds/optware/syno-i686/cross/unstable/syno-i686-bootstrap_1.2-7_i686.xsh
$ chmod +x syno-i686-bootstrap_1.2-7_i686.xsh
$ sh syno-i686-bootstrap_1.2-7_i686.xsh
$ ipkg update
```



```bash
# 如果下不动就自己电脑下再传输到nas
$ wget -N git.io/aria2.sh && chmod +x aria2.sh
$ ./aria2.sh
# 先安装aria2
```

配置文件位于`/root/.aria2c/aria2.conf `，默认下载目录为：`/root/downloads`，这里修改为 `/volume1/Download/aria2`

```bash
# 修改配置文件
$ su -i
$ vim /root/.aria2c/aria2.conf
# 修改为：dir=/volume1/Download/aria2
```

然后再次：
```bash
$ ./aria2.sh
# 启动aria2
```

会打印一些信息，可以修改，先记下来。

```bash
 IPv4 地址	: 182.255.34.12
 IPv6 地址	: IPv6 地址检测失败
 RPC 端口	: 6800
 RPC 密钥	: 12345687
 下载目录	: /volume1/Download/aria2
 AriaNg 链接	: http://ariang.js.org/#!/settings/rpc/set/ws/182.255.34.12/6800/jsonrpc/MTIzNDU2ODc=
```

```bash
 IPv4 地址	: 117.170.156.207
 IPv6 地址	: 2409:8a38:1623:b500:2e2:69ff:fe2c:c6e0
 RPC 端口	: 6800
 RPC 密钥	: 28e5d89b6bf2c951cb4e
 下载目录	: /volume1/Applications/cloudreve/aria2
 AriaNg 链接	: http://ariang.js.org/#!/settings/rpc/set/ws/117.170.156.207/6800/jsonrpc/MjhlNWQ4OWI2YmYyYzk1MWNiNGU=
```

浏览器打开AriaNg链接，也有一个UI，这个可以保存着用，不过我们的重点还是跟Cloudreve集成

![](https://s2.loli.net/2022/12/01/iM3HmOjpy5ArhwS.png)

Aria2 离线下载最大的速度取决于服务器带宽。

将信息填写到Cloudreve中：

![](https://s2.loli.net/2023/01/31/2TXKYm7pSwOft4o.png)

## 后续工作

配置存储策略、用户策略等，自行配置即可

---
title: "frp内网穿透记录"
date: 2022-07-17T13:43:38+08:00
draft: false
categories: ["技术"]
tags: ["内网穿透", "frp", "NAT"]
---

## 前言

如果想在内网搭建一些服务从外网进行访问，如访问内网web服务、远程ssh内网服务器、远程访问内网NAS等，而没有公网ip的话是非常麻烦的，可以采用内网穿透技术来满足这些需求。

所谓内网穿透，也称为NAT穿透，要想了解其具体原理，首先要了解NAT

## NAT技术

NAT（Network Address Translation，网络地址转换）是一个将内部私有的网络地址翻译成合法ip地址的技术。

NAT分为三种：静态NAT、动态地址NAT、网络地址端口转换NAPT。

### 静态NAT

静态NAT就是内网和公网IP一一x对应，这个方式用的很少

### 动态地址NAT

NAT网关有多个公网IP，内网机器发送IP报文的时候，NAT设备（通常是路由器或者防火墙）会分配一个可用的公网IP将源地址进行替换，目标地址不变

![](https://pic3.zhimg.com/80/v2-f3736378c423302b81ad889642ceb587_720w.jpg?source=1940ef5c)

之后路由器在自己的NAT表中增加一个私有网络到公网地址映射的记录项，之后如果收到了server的回复，就将这个报文转发给私有网络中的客户端。这里私有网络IP和公网IP也是对应的，只是可以动态变化。

![](https://picx.zhimg.com/80/v2-dc2a84984269febe7eb626b5f4a69861_720w.jpg?source=1940ef5c)

### 网络地址端口转换NAPT

NAT技术中，使用最普遍的是NAPT，它指的是将内部的地址映射到外部网络的一个IP的不同端口上，可以将一个小型的网络隐藏在一个合法的IP地址后面。

比起前面的两种公网私网ip一一对应的方式，NAPT可以将非常多的私有地址映射到一个公共IP上，国内基本都使用这种方式解决公网IP不够的问题（当然ipv6更好，但是国内并不会推，因为有其他的原因），

私有网内部的主机发送IP包经过NAT网关，私网IP与NAT网关的公共IP的一个端口进行关联然后转发到公网，此时的IP包不再含有任何私有网络的信息。

![](https://picx.zhimg.com/80/v2-34da92151023c595b9bbad1e180fde15_720w.jpg?source=1940ef5c)

这样一个私有网络（比如10.0.0.1:1024）会被映射到一个公共网络ip+端口上（比如219.134.180.11:2001）

![](https://pic2.zhimg.com/80/v2-51c40f6df15710213bedcb6d7e21976e_720w.jpg?source=1940ef5c)

路由器收到目标服务器返回的报文后，也查表进行转换，替换目标地址为私网内的ip。

完整的一个过程如下图所示：

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1663343308/nat-1.png)

当然NAT还可以细分为对称NAT、限制锥型NAT（ip限制/端口限制）、完全锥型NAT等，这里就不深入了。

## 内网穿透原理及工具

内网穿透，就是解决如何访问内网ip的技术，因为处于内网的设备可以借助NAT访问外网，却很难被外网设备有效访问，比如在内网部署了一个web服务，而外面的客户端根本不知道对应NAT的ip和端口好，也就无法访问。

内网穿透就是通过对地址进行转换，将公共的网络地址转变为私有网络地址，采用一种路由的方式将一台有公网的计算机变成路由器的功能，实现了两个不同局域网下的计算机的沟通。

不同的内网穿透工具实现的技术细节略有不同，内网穿透工具，包括一些知名的开源项目，比如frp、ngrok等，以及一些基于frp和ngrok的二次开发的商用产品，比如花生壳等。ngrok是通过反向代理的方式，在公共端点和本地运行的 Web 服务器之间建立一个安全的通道，实现内网主机的服务可以暴露给外网。

而这里重点介绍和使用的是frp，也是目前使用最广泛的一个开源内网穿透工具。

## frp

frp是一个用Go语言编写的，专注于内网穿透的高性能的反向代理应用，支持 TCP、UDP、HTTP、HTTPS 等多种协议。可以将内网服务以安全、便捷的方式通过具有公网 IP 节点的中转暴露到公网。

frp包括以下特性：
- 客户端服务端通信支持 TCP、KCP 以及 Websocket 等多种协议。
- 采用 TCP 连接流式复用，在单个连接间承载更多请求，节省连接建立时间。
- 代理组间的负载均衡。
- 端口复用，多个服务通过同一个服务端端口暴露。
- 多个原生支持的客户端插件（静态文件查看，HTTP、SOCK5 代理等），便于独立使用 frp 客户端完成某些工作。
- 高度扩展性的服务端插件系统，方便结合自身需求进行功能扩展。
- 服务端和客户端 UI 页面。


frp包含服务端frps（有公网ip，起转发作用）和客户端frpc（内网中需要做穿透的机器，提供服务供外面访问）

![](https://github.com/fatedier/frp/raw/dev/doc/pic/architecture.png)


## frp配置记录

### frps

首先去配置frps，这个比较简单，先去frp的releases页面：https://github.com/fatedier/frp/releases

下载好对应版本的frp并解压，修将frps.ini移到/etc/frp/frps.ini并修改为：

```ini
[common]
# frp监听的端口，默认是7000，可以改成其他的
bind_port = 7000
vhost_http_port = 8080

# frp管理后台端口，请按自己需求更改
dashboard_port = 7500
# frp管理后台用户名和密码，请改成自己的
dashboard_user = admin
dashboard_pwd =admin_passwd
# 开启prometheus监控
enable_prometheus = true

# frp日志配置
log_file = /var/log/frps.log
log_level = info
log_max_days = 3

# token，用于frpc验证
token = <token>
```

不要忘记去腾讯云后台把相关端口全部打开，以及在腾讯云创建安全组，允许全部端口，以及关闭防火墙，当然这里是暴力放开，最好是只开放对应的端口。

```bash
sudo systemctl stop firealld
```

采用systemd的方式，使用服务会更加方便，运行在后台而且开机自启。

创建 /etc/systemd/system/frps.service并写入以下内容：

```ini
[Unit]
Description=Frps
After=network.target syslog.target

[Service]
Type=simple
# 实际路径自行调整
ExecStart=/home/ubuntu/frp/frps -c /home/ubuntu/frp/frps.ini

[Install]
WantedBy=multi-user.target
```

然后就可以通过systemctl的方式对frps服务进行操作了
```bash
$ sudo systemctl daemon-reload
$ sudo systemctl stop frps
$ sudo systemctl start frps
$ sudo systemctl status frps
 frps.service - Frps
   Loaded: loaded (/etc/systemd/system/frps.service; enabled; vendor preset: enabled)
   Active: active (running) since Fri 2022-09-16 07:01:55 CST; 1s ago
 Main PID: 3413 (frps)
    Tasks: 3 (limit: 2366)
   CGroup: /system.slice/frps.service
           └─3413 /home/ubuntu/frp/frps -c /home/ubuntu/frp/frps.ini
```

前往server_ip:7500就可以访问到frp dashboard：

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1663351907/frp_dashboard_1.png)

## frpc配置

在需要穿透出去的内网本机上配置frpc。

也是同样去下载frp，然后修改frpc.ini配置文件：

```ini
# 常规配置，这几个要与frps对应
[common]
server_addr =  <server_ip>
server_port = 7000
accesstoken = <token>

# 后面的根据自己的需求写
[ssh]
type = tcp
local_ip = 127.0.0.1
local_port = 22
remote_port = 2220

[frontend]
type = tcp
local_ip = 127.0.0.1
local_port = 8080
remote_port = 8001

[backend]
type = tcp
local_ip = 127.0.0.1
local_port = 7439
remote_port = 7439

[cloudreve]
type = tcp
local_ip = 127.0.0.1
local_port = 5212
remote_port = 5212
```

后面的内容根据实际的需求进行添加，这里并不需要再修改frps，只要服务端的remote_port是允许访问的即可（需要去腾讯云的控制台和用命令行关闭相关防火墙开放这些端口）

然后也可以使用systemd来管理：

```bash
$ sudo vim /usr/lib/systemd/system/frpc.service
```

```ini
[Unit]
Description=FRP Server Daemon
After=network.target
Wants=network.target

[Service]
Type=simple
# 写实际的路径
ExecStart=/home/engine/Projects/frp/frpc -c /home/engine/Projects/frp/frpc.ini
Restart=always
RestartSec=2s
User=nobody
LimitNOFILE=infinity

[Install]
WantedBy=multi-user.target
```

```bash
# 更新配置
$ systemctl daemon-reload

# 启动服务
$ systemctl start cloudreve

# 设置开机启动
$ systemctl enable cloudreve
```



### ssh穿透

```ini
[ssh]
type = tcp
local_ip = 127.0.0.1
local_port = 22
remote_port = 2220
```

在外面就可以远程ssh连接寝室的服务器了，当然这里要用-p指示端口：

```bash
$ sudo ssh -p 2220 <username>@<server_ip>
```

```bash
$ ./frpc -c ./frpc.ini
```

### 内网web穿透

比如在本机部署了一个前后端的web，这里将本机前端的8080映射到服务器的8001端口。直接访问的话前端却不能跟后端连上，所以这里只好将后端也进行穿透。

```ini
[frontend]
type = tcp
local_ip = 127.0.0.1
local_port = 8080
remote_port = 8001

[backend]
type = tcp
local_ip = 127.0.0.1
local_port = 7439
remote_port = 7439
```

### Cloudreve私有云存储

使用Cloudreve搭建私有云，不仅可以当做一个不限速的大容量网盘使用，也可以通过导入本地磁盘当做nas使用。

先安装Cloudreve

```bash
#解压获取到的主程序
$ tar -zxvf cloudreve_VERSION_OS_ARCH.tar.gz
# 赋予执行权限
$ chmod +x ./cloudreve
# 启动 Cloudreve
$ ./cloudreve
```

会打印初始管理员账号和随机密码，要记住，之后需要登录。

可以通过systemd进行进程守护：

```bash
# 编辑配置文件
$ vim /usr/lib/systemd/system/cloudreve.service
```
写入：
```ini
[Unit]
Description=Cloudreve
Documentation=https://docs.cloudreve.org
After=network.target
After=mysqld.service
Wants=network.target

[Service]
WorkingDirectory=/PATH_TO_CLOUDREVE
ExecStart=/PATH_TO_CLOUDREVE/cloudreve
Restart=on-abnormal
RestartSec=5s
KillMode=mixed

StandardOutput=null
StandardError=syslog

[Install]
WantedBy=multi-user.target
```

```bash
# 更新配置
systemctl daemon-reload
# 启动服务
systemctl start cloudreve
# 设置开机启动
systemctl enable cloudreve
```

cloudreve的frpc.ini配置：
```ini
[cloudreve]
type = tcp
local_ip = 127.0.0.1
local_port = 5212
remote_port = 5212
```

通过本地的大容量硬盘，就可以有一个私有云+nas了。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1663391988/cloudreve-4.png)


### 路由器后台

如果在外面需要配置路由器的后台情况，这里对刷了梅林固件的路由器后台进行了配置，去软件中心安装Frpc内网穿透，然后配置：

```ini
# frpc custom configuration
[common]
server_addr = <server_ip>
server_port = 7000
accesstoken = <token>

[merlin]
type=tcp
local_ip=127.0.0.1
local_port=80
remote_port=8003
```

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1663389621/merlin-frpc-1.png)

就可以在外面通过 `http://<server_ip>:8003/` 访问路由器后台了。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1663389718/merlin-frpc-2.png)

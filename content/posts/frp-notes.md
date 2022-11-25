---
title: "frp内网穿透原理及配置记录"
date: 2022-07-17T13:43:38+08:00
draft: false
categories: ["技术"]
tags: ["内网穿透", "frp", "Linux"]
---


## 前言


一般来说，除了一些企业高校等机构，国内绝大部分普通人没有ipv4的公网ip且极难申请到，毕竟用一个少一个，并且由于一些原因，国内ipv6也不太可能普及的起来，这么多年基本没什么发展。我们在学校、家庭的路由器都是运营商通过NAT等方式转接，都处于内网之中，需要在局域网内才能访问到相关的服务。

但如果我们在外面有访问内网web服务、远程ssh内网服务器、远程访问内网NAS等需求的话，该怎么办呢？内网穿透可以在一定程度上解决这个需求。所谓内网穿透，也称为NAT穿透，要想了解其具体原理，首先要了解NAT技术。

## NAT技术

NAT（Network Address Translation，网络地址转换）是一个将内部私有的网络地址翻译成合法ip地址的技术。

NAT分为三种：静态NAT、动态地址NAT、网络地址端口转换NAPT。

### 静态NAT

静态NAT就是内网和公网IP一一对应，这个方式用的很少

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

不同的内网穿透工具实现的技术细节略有不同，内网穿透工具，包括一些知名的开源项目，比如frp、ngrok等，以及一些给予frp和ngrok的二次开发的商用产品，比如花生壳等。ngrok是通过反向代理的方式，在公共端点和本地运行的 Web 服务器之间建立一个安全的通道，实现内网主机的服务可以暴露给外网。

而这里重点介绍和使用的是frp，它也是目前使用最广泛的一个开源内网穿透工具。

## frp

frp是一个用Go语言编写的，专注于内网穿透的高性能的反向代理应用，支持 TCP、UDP、HTTP、HTTPS 等多种协议。可以将内网服务以安全、便捷的方式通过具有公网 IP 节点的中转暴露到公网。

frp的github地址：[https://github.com/fatedier/frp](https://github.com/fatedier/frp)

frp包括以下特性：
- 客户端服务端通信支持 TCP、KCP 以及 Websocket 等多种协议。
- 采用 TCP 连接流式复用，在单个连接间承载更多请求，节省连接建立时间。
- 代理组间的负载均衡。
- 端口复用，多个服务通过同一个服务端端口暴露。
- 多个原生支持的客户端插件（静态文件查看，HTTP、SOCK5 代理等），便于独立使用 frp 客户端完成某些工作。
- 高度扩展性的服务端插件系统，方便结合自身需求进行功能扩展。
- 服务端和客户端 UI 页面。

### frp的组成

frp包含：
- 服务端frps（有公网ip的机器，起转发作用）
- 客户端frpc（内网中需要做穿透的机器，提供服务供外面访问）

![](https://github.com/fatedier/frp/raw/dev/doc/pic/architecture.png)

### frp的工作流程

1. 首先，frpc 启动之后，会连接 frps，并且发送一个请求 login()，之后保持住这个长连接，如果断开了，就重试
2. frps 收到请求之后，会建立一个 listener 监听来自公网的请求
3. 当 frps 接受到请求之后，会在本地看是否有可用的连接( frp 可以设置连接池)，如果没有，就下发一个 msg.StartWorkConn 并且 等待来自 frpc 的请求
4. frpc 收到之后，对 frps 发起请求，请求的最开始会指名这个连接是去向哪个 proxy 的
5. frps 收到来自 frpc 的连接之后，就把新建立的连接与来自公网的连接进行流量互转
6. 如果请求断开了，那么就把另一端的请求也断开

![](https://jiajunhuang.com/articles/img/frp_flow.png)

### nginx和frp的区别

前面提到了frp的本质是反向代理，而我们熟知的nginx也基于反向代理，但是nginx主要用于负载均衡，而frp用于内网穿透。nginx的逻辑如下：

![](https://jiajunhuang.com/articles/img/nginx_flow.png)


## frp配置记录

### frps

frps需要配置在有公网ip的服务器上，可以去腾讯云、阿里云、华为云等云服务商租服务器，这里我用的是腾讯云。

新用户的话很推荐腾讯云的服务器特惠活动，应该是目前几家大厂里最便宜的，一年只需要50多就可以搞到2核2G的服务器，可以点击下面的图片进入腾讯云特惠活动：

<a href="https://url.cn/W6cMbMm6"><img src="https://s2.loli.net/2022/11/25/NtOMw7gYr32veXb.jpg" alt="腾讯云特惠服务器"></a>


先购买一台服务器，推荐选择同地域的Ubuntu或者CentOS（因为我是老用户，所以会贵很多，而且界面可能跟特惠不太一样，不过逻辑差不多），这里我选的是常用的Ubuntu，当然CcentOS也基本一样，只需要修改少量的命令。

![](https://s2.loli.net/2022/11/25/TxkczZs8BPaVviq.png)

然后查看它的公网ip，如果想在本地终端连接的话，需要设一下ubuntu账户的ssh密码（下面的重置密码）或者通过密钥连接（需要去密钥管理里上传本机的ssh密钥，这里就不说了）：

![](https://s2.loli.net/2022/11/25/32pMZSOGTh9fYba.png)

远程ssh连接到服务器：

```bash
ssh ubuntu@<你的公网ip>
# 密码是刚刚设置的密码
```

```bash
// 更新一波，并且装点常用软件
$ sudo apt-get update
$ sude apt-get upgrade
$ sudo apt-get install wget vim git
```

开始配置frps，可以先创建一个目录：

```bash
$ mkdir frp
$ cd frp
```

本机去frp的releases页面：https://github.com/fatedier/frp/releases 找一下最新版本的链接，在服务器端下载对应版本（linux_amd64）并解压：

```bash
$ wget https://github.com/fatedier/frp/releases/download/v0.45.0/frp_0.45.0_linux_amd64.tar.gz
$ tar -zxvf frp_0.45.0_linux_amd64.tar.gz
```

修改里面的`frps.ini`：

```ini
[common]
bind_addr = 0.0.0.0
# frp监听的端口，默认是7000，比较建议修改成其他的
bind_port = <port>
bind_udp_port = 7001
vhost_http_port = 8080
vhost_https_port = 4433
# frp的UI管理后台端口，请按自己需求更改
dashboard_port = 7500
# frp的UI管理后台用户名和密码，请改成自己的
dashboard_user = admin
dashboard_pwd = <设置你的密码>
enable_prometheus = true

# frp日志配置
log_file = /home/ubuntu/frp/frps.log
log_level = info
log_max_days = 3
disable_log_color = false
detailed_errors_to_client = true

# token，用于内网穿透验证，最简单的验证方式
# 下面配置的token不要泄露，否则别人也可以用你的服务器进行内网穿透，也会造成安全隐患
authentication_method = token
token = <设置你的token>
```

还可以使用OIDC来验证，配置会更复杂，我没有试过，可以参考 [Client Credentials Grant](https://tools.ietf.org/html/rfc6749#section-4.4)

另外还需要去腾讯云后台把相关端口全部打开，暴力的话可以在腾讯云创建安全组，允许全部端口，当然这里最好是只开放相关的端口。

![](https://s2.loli.net/2022/11/25/jTU5VYGheHC93go.png)


以及关闭防火墙：

```bash
sudo systemctl stop firealld
```

采用systemd的方式来配置frps服务，这样使用服务会更加方便，可以让服务运行在后台而且开机自启。

创建 /etc/systemd/system/frps.service并写入以下内容：

```ini
[Unit]
Description=Frps
After=network.target syslog.target

[Service]
Type=simple
# 根据实际路径自行调整
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

前往<ip>:7500并进行登录就可以访问到frp dashboard：

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1663351907/frp_dashboard_1.png)

至此我们的服务器frps就配置好了，是比较简单的。

## frpc配置

在需要穿透出去的内网本机上配置frpc。

也是同样去下载frp，需要下载跟frps相同版本的，然后修改frpc.ini配置文件：

```ini
# 常规配置，这几个要与frps对应
[common]
server_addr = <server_ip>
server_port = <port>
token = <token>

# 后面的根据自己的需求写，比如ssh、web前后端、路由器、samba、nas、私有网盘服务等，后面一个一个举例
```

后面的内容根据实际的需求进行添加，这里并不需要再修改frps，只要服务端的remote_port是允许访问的即可（需要去腾讯云的控制台和用命令行关闭相关防火墙开放这些端口）

当然如果也是Linux的话，我们也可以使用systemd来管理

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
# 根据frp所在的实际路径进行调整
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
$ systemctl start frpc
# 设置开机启动
$ systemctl enable frpc
```

如果是其他的系统或者路由器，修改frpc.ini然后常规启动就可以

### ssh穿透

```ini
[ssh]
type = tcp
local_ip = 127.0.0.1
local_port = 22
# 映射到远程的端口可以自己选定，选大一点的端口，自己记住就行了
# 记不住也没事，可以去web UI管理界面查
remote_port = <remote_ip>
```

在外面就可以远程ssh连接寝室的服务器了，当然这里要用-p指示端口：

```bash
$ sudo ssh -p <remote_ip> <内网用户>@<server_ip>
```

### 内网web穿透

比如在本机部署了一个前后端的web，这里将本机前端的8080映射到服务器的8001端口。直接访问的话前端是不能跟后端连上的，所以后端也需要进行穿透。

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

可以用Cloudreve搭建私有云，不仅可以当做一个不限速的大容量网盘使用，也可以通过导入本地磁盘当做nas使用。

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

如果在外面需要配置路由器的后台情况，或者觉得直接访问内网服务器不安全，需要借助第三方机器对局域网内的机器进行连接，就可以将路由器进行内网穿透。

这里对刷了梅林固件的路由器后台进行了配置，比较推荐刷了Koolshare梅林固件或者openwrt固件的路由器，可玩性比较强。



去软件中心安装Frpc内网穿透，然后配置：

```ini
# frpc custom configuration
[common]
server_addr = <server_ip>
server_port = <frps_port>
token = <token>

# ssh穿透
[merlin_ssh]
type = tcp
local_ip = 127.0.0.1
local_port = 22
remote_port = <merlin_ssh_remote_port>

# 路由器后台穿透
[merlin_center]
type=tcp
local_ip = 127.0.0.1
local_port = 80
remote_port = <merlin_center_remote_port>
```

![](https://s2.loli.net/2022/11/25/bhMZiXfIFNtx6OW.png)

就可以在外面通过 `http://<server_ip>:<merlin_center_remote_port>/` 访问路由器后台了。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1663389718/merlin-frpc-2.png)

## 群晖NAS内网穿透

群晖自带quickconnect内网穿透，并且配置了域名，但是quickconnect速度感人并且需要手机号验证，一些服务可能还无法使用，所以这里我们自己穿透。

因为没有自带的frpc客户端，去docker里找一个：（只有x86芯片的群晖才能用Docker，也就是型号带+的，型号带j的无法使用docker）

![](https://s2.loli.net/2022/10/24/OLfX7nsrodVPKlt.png)


![](https://s2.loli.net/2022/10/24/UxqNTjztEoC24Zm.png)

写一下frpc的配置，上传到群晖的某个文件夹，我这里是`/docker/frpc/frpc.ini`


后面一些是我的配置，包括dsm登录、webdav、emby、plex等

```ini
[common]
server_addr = <server_ip>
server_port = <frps_port>
token = <token>

[nas_ssh]
type = tcp
local_ip = 192.168.50.99
local_port = 22
remote_port = 2333

[dsm]
type = tcp
local_ip = 192.168.50.99
local_port = 5001
remote_port = 5001

[ds_file]
type = tcp
local_ip = 192.168.50.99
local_port = 5001
remote_port = 5002

[https_webdav]
type = tcp
local_ip = 192.168.50.99
local_port = 5006
remote_port = 5006

[http_webdav]
type = tcp
local_ip = 192.168.50.99
local_port = 5004
remote_port = 5004

[emby]
type = tcp
local_ip = 192.168.50.99
local_port = 8097
remote_port = 8097

[emby_8096]
type = tcp
local_ip = 192.168.50.99
local_port = 8096
remote_port = 8096


[plex_28888]
type = tcp
local_ip = 192.168.50.99
local_port = 28888
remote_port = 28888


[plex_32400]
type = tcp
local_ip = 192.168.50.99
local_port = 32400
remote_port = 32400

[nas_samba_445]
type = tcp
local_ip = 192.168.50.99
local_port = 445
remote_port = 4455


[nas_cloudreve_5212]
type = tcp
local_ip = 192.168.50.99
local_port = 5212
remote_port = 5212
```

DSM：
![](https://s2.loli.net/2022/10/24/jdxFe6R3iI5abs4.png)

Cloudreve:
![](https://s2.loli.net/2022/11/25/RDUAeOkNvEqdZJT.png)

Emby
![](https://s2.loli.net/2022/11/25/qKIMdsyAP9DHV3U.png)

Plex:
![](https://s2.loli.net/2022/11/25/SIQErDdzaZNhyYR.png)

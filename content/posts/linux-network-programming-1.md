---
title: "Linux网络编程（一） 从TCP/IP协议开始"
date: 2022-02-01T14:44:13+08:00
draft: false
categories: ["开发"]
tags: ["Linux", "TCP/IP"]
---


## 重温计算机网络

TCP/IP协议是目前互联网的主流协议簇，早在计算机网络中我们就已经学习过大部分的内容，现在我们从协议的角度出发再次重温计算机网络的内容，作为后续内容的基础。

在物理传输媒介的基础上的四层网络模型，自底向上分别是数据链路层、网络层、传输层、应用层，各层包含的协议如图所示：

![tcp-ip-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643112994/TCP-IP-1.png)

实体通信用实线表示，逻辑通信用虚线表示。链路层封装了物理传输的细节，网络层封装了路由逐条通信的细节，传输层开始就是端到端的协议

![tcp-ip-2](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643164972/TCP-IP-2.png)

具体的内容在前面的计算机网络基础中已经做了详细的介绍，这里只讨论各层的一部分重要协议。

ARP协议：链路层协议，完成IP地址到MAC地址的转换
IP协议：网络层协议，完成IP数据报的投递，确定通信路径
ICMP协议：网络层协议，IP协议的补充，用于检测网络连接
TCP协议：传输层协议，提供可靠的、面向连接的基于流的服务
UDP协议：传输层协议，提供不可靠的、无连接的基于数据报的服务
DNS协议：应用层协议，完成域名到IP地址的转换

## 封装与分用

封装指的是上层协议的数据沿协议栈往下传递，每经过一个协议栈就加上头部信息，最终合成以太网帧或令牌环帧在物理层上传递：

![tcp-ip-2](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643166755/TCP-IP-3.png)

分用指的是帧到了目的地后的从底向上传递的过程，每个协议栈取出自己的头部，将信息往上传递。头部包含了具体的类型参数，根据头部信息递交给不同的上层。

比如以太帧用2字节的类型字段来区分IP或ARP
IP数据报根据头部的16位协议编码区分TCP、UDP和ICMP
TCP和UDP通过头部的端口号来区分具体的应用

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643167303/TCP-IP-4.png)

对于顶层应用而言，好像封装和分用没有发生过。

## ARP协议

ARP实现的是网络层IP地址到物理网卡MAC地址的转换，原理是主机向网络广播一个ARP请求，包含目标主机的IP地址，只有被请求到的目标机器才会返回一个ARP应答，包含其物理地址。

具体的请求和应答的报文格式就不详述，这里ARP会维护一个高速缓存，包含经常访问的机器的IP地址到MAC地址的映射，从而提高效率，避免重复请求。

Unix（Linux、macOS）可以通过`arp`相关命令来管理arp缓存。

`arp -a`：查看所有arp缓存，左边括号内为IP地址，右边为MAC地址。
```
? (169.254.72.54) at 60:6d:c7:c6:4c:e5 on en0 [ethernet]
? (169.254.100.233) at 94:e9:79:ff:aa:eb on en0 [ethernet]
file-center.lan (192.168.50.1) at f8:32:e4:84:16:60 on en0 ifscope [ethernet]
? (192.168.50.43) at 3e:cc:9e:13:e6:a4 on en0 ifscope [ethernet]
...
```

`arp -d <ip>`：删除某个ip的arp缓存
`arp -s <ip> <mac>`：添加某个ip到mac的arp缓存

## DNS协议

DNS协议将域名转换为IP地址，它是一套分布式的域名服务系统，每个DNS服务器都存放大量的域名-IP地址映射，且动态更新。

Unix下在`/etc/resolv.conf`保存了DNS服务器的地址，该文件是随着网络连接状态自动更新的。

比如连接wifi后，为
```
search lan
nameserver 192.168.50.1
```
这里`192.168.50.1`是路由器的ip，即依靠局域网的路由器搜索DNS

而连接了热点之后就立刻变为了
```
nameserver 2409:8938:1610:7763::18
nameserver 192.168.109.2
```

断网之后该文件内容变为空。

`host -t A <host>`：查询某个域名的IP地址，如

```
www.baidu.com is an alias for www.a.shifen.com.
www.a.shifen.com has address 36.152.44.96
www.a.shifen.com has address 36.152.44.95
```

## IP协议

IP协议是网络层协议，是TCP/UDP的基础，它为上层提供无连接、不可靠、无状态的服务。

### ipv4的IP头部与分片传输

ipv4的IP头部：
![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643256162/TCP-IP-5.png)


IP的长度超过mtu时会被分片传输，然后在接收端整合，以太帧的mtu通常是1500字节，去掉20字节的头部，还有1480字节可以放数据，数据如果超过1480字节则必须分片传输。

比如1481字节的ICMP报文，需要分两片来传输：
![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643256162/TCP-IP-6.png)

### IP路由机制

IP协议的核心是路由，即从源机器如何通过网络转发给目标机器。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643261497/TCP-IP-7.png)

接受到了来自链路层的IP数据报后，先通过CRC校验，然后判断是否是发给本机网络或者广播的数据报，如果是的话就依据具体的头部信息传递给TCP/UDP/ICMP模块。如果不是的话就转发给下一跳，具体转发方式是路由协议的内容，比如RIP、OSPF算法等，这个在之前的计算机网络中已经学过了，就不在此细说了。

## TCP协议

TCP的特征：一对一、全双工、先建立连接、字节流传输、可靠传输

其他几个很简单，提一下字节流传输，TCP使用字节流传输，而UDP使用数据报传输，字节流的特点就是：发送端执行的写操作次数和接收端执行的读操作次数没有任何数量关系，因为发送缓冲区和接受缓冲区的存在。

### 发送缓冲区与接收缓冲区

TCP三次握手建立之后，内核会为每一个连接建立配套的基础设施，其中就包括发送缓冲区。

发送缓冲区的大小可以通过套接字的选项来调整，假如客户端调用write，实际上是将数据从应用程序拷贝到内核中的发送缓冲区中，而不是通过socket。

如果发送缓冲区足够大，那么write调用成功返回写入的字节数。
如果数据还没发送完，或者缓冲区不够大，内核并不会返回或者报错，而是被阻塞。直到发送完。

缓冲区类似一条流水线，每次都能不断将数据封装打包为TCP的MSS和IP的MTU包然后从数据链路层打包出去，缓冲区就会空一部分，可以继续搬一部分数据到缓冲区，所以最终总能搬完所有的数据。然后write阻塞就会调用返回，write返回的时候，数据并不是已经发送过去了，而是还有一部分会在缓冲区里，之后会发过去。

![TCP-IP-9](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643272895/TCP-IP-9.png)

缓冲区也是TCP字节流传输和UDP数据报传输的一个区别：

TCP字节流传输：
![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643272895/TCP-IP-10.png)

UDP数据报传输：
![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643272895/TCP-IP-11.png)

### TCP的建立：三次握手

著名的TCP三次握手：
![tcp三次握手-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643272895/TCP-IP-8.png)

1. 客户端协议栈向服务端发送SYN包，并表明当前发送序列号为j，客户端进入SYN_SENT状态
2. 服务端的协议栈收到了这个包之后，对客户端的这个SYN进行应答，值为j+1，同时服务器也发送一个SYN包，内容是k，服务器进入SYNC_RCVD状态
3. 客户端协议栈收到了ACK之后，应用程序的connect调用返回，客户端到服务端的单向通信建立成功。并进入ESTABLISH状态，同时对服务端进行ACK应答，应答值为k+1
4. 应答包到达服务器，服务器协议端的accept阻塞调用返回，服务器到客户端的单向通信也建立成功。

>思考一下为什么是三次。
我的理解是，如果A到B的传输连接要成功，至少需要两步，A尝试传一个信息到B，B再返回一个应答。这样就说明了A到B的单向没有问题。反过来也一样。正常来说应该需要四次握手，不过在服务端应答客户端的时候服务端顺便发送请求包，这样节省了一步。所以说最少是三次握手，两次必然不能保证一定连接成功，四次则多浪费了一次。

### TCP的关闭：四次挥手与TIME_WAIT

TCP是全双工的，所以存在一种半关闭状态，也就是A可以接受B发送来的数据，但是A不再发送数据给B，也就是说一端可以告诉对方自己发送的数据已经发完了，但仍然可以接受对方发送的数据，进入半关闭状态，如果对方也发送完了，就进入关闭状态。

![time_wait-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643272895/TCP-IP-12.png)

一个完整的建立和关闭的过程：

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643549232/TCP-IP-14.png)

### TIME_WAIT

这里提一下TIME_WAIT状态。假设是主机一发送FIN到主机二，在收到FIN n的时候，主机一会进入TIME_WAIT的状态，停留时间是固定的。Linux下是两个最长份节生命周期的时间（即2MSL）。只有发起连接终止的一方会进入TIME_WAIT状态。

为什么有TIME_WAIT？因为TCP要考虑各种错误情况，假如最后一次挥手客户端的ACK没有传到服务端，那么服务端之后会重发FIN报文。此时如果客户端没有维护TIME_WAIT而是直接关闭，就会失去上下文。坚持2MSL，使得这次连接所有的迟到的报文来得及被丢弃

但是TIME_WAIT过多，会导致端口资源被占用，有时候可能由于TIME_WAIT导致性能下降。

### TCP状态转移

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643273832/TCP-IP-13.png)

虚线为服务端，粗实线为客户端。


### TCP超时重传策略

每个TCP报文都维护了一个重传定时器，如果超过时间没有收到对方的应答，发送方就会重传TCP报文并reset定时器。

一般每次重传都比之前的时间间隔更长（比如是上一次的两倍），并且设置最多重传次数，超过这个次数就放弃。

### TCP拥塞控制

由于链路层的承载量有限，需要进行控制。

SWND（Send WiNDow，发送窗口）：指的是发送端向网络一次性发送的数据量。

如果RWND过小，则延迟会比较大。如果RWND过大，则容易网络拥塞。

RWND（Receive WiNDow，接收窗口）：指的是接收端一次性能接收的数据量。

CWND（Congestion WiNDow，拥塞窗口）：不造成拥塞的最大数据量

实际的 $\text{SWND} = \min(\text{RWND}, \text{CWND})$

启动阶段包括以下两种算法：

1. 慢启动

设置了一个慢启动门限ssthresh，最开始启动的时候CWND设置一个较小的值（2-4个SMSS），然后慢慢按照指数方式增大CWND的值，直到超过这个门限，然后进入拥塞避免控制。

2. 拥塞避免

每经过一个轮次，线性增加其大小而不是加倍，让其缓慢增大，出现一次超时后（发生拥塞），就让慢开始门限等于当前cwnd的一半，cwnd重新设为1

cwnd > ssthresh: 慢启动
cwnd < ssthresh: 拥塞避免

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643557367/TCP-IP-15.png)

拥塞处理包括以下两种算法：

1. 快重传

当发送方连续收到三个重复的ACK报文时，直接重传对方尚未收到的报文段，而不必等待那个报文段设置的重传计时器超时。

2. 快恢复

快恢复前面和避免算法一样，不同之处是它把cwnd的值设置为慢开始门限ssthresh改变后的数值，然后开始执行拥塞避免算法

## 代理服务器

客户机和目标服务器之间通常需要一些中转服务器进行代理中转访问。


### 正向代理

代理服务器的信息需要由客户端设置，每次请求都发送到代理服务器上，然后由代理服务器请求目标资源。
目标服务器并不清楚具体的客户端。
比如科学上网经典的shadowsocks就是这种方式。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643610218/TCP-IP-17.png)

### 反向代理

反向代理由服务端设置，代理服务器接收客户端的连接，然后转发给目标服务器，获得结果后返回给客户端，对外表现就像是目标服务器一样。
客户端并不清楚具体的服务器。很多大型网站都使用反向代理，用户访问该网站，会访问相同地域的反向代理服务器，从而节约时间。以及做负载均衡的nginx、CDN等等。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643559177/TCP-IP-16.png)

## HTTP通信

### HTTP请求

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643611443/TCP-IP-18.png)

### TCP应答

![HTTP状态码](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643698156/HTTP%E7%8A%B6%E6%80%81%E7%A0%81.png)

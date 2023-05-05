---
title: "Linux网络编程（一） 从TCP/IP协议开始"
date: 2022-02-01T14:44:13+08:00
draft: false
categories: ["技术"]
tags: ["Linux", "TCP/IP"]
---

## 重温计算机网络协议栈

### 四层协议

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

### 封装与分用

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

MAC的链路层协议是直连的两个设备的连接，而IP协议则负责没有直连的两个网络之间的连接。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/IP/3.jpg)

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

### IP地址分类

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/IP/7.jpg)

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/IP/8.jpg)

主机号全为1指定某个网络下的全部主机，用于广播
主机号全为0指定某个网络

#### CIDR

通过子网掩码和IP地址按位计算AND，得到网络号

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/IP/16.jpg)

## TCP协议

### TCP的定义

TCP 是面向连接的、可靠的、基于字节流的传输层通信协议。

特点：一对一、全双工、先建立连接、字节流传输、可靠传输

面向连接：一定是「一对一」才能连接，不能像 UDP 协议可以一个主机同时向多个主机发送消息，也就是一对多是无法做到的；

可靠的：无论的网络链路中出现了怎样的链路变化，TCP 都可以保证一个报文一定能够到达接收端；

字节流：用户消息通过 TCP 协议传输时，消息可能会被操作系统「分组」成多个的 TCP 报文，如果接收方的程序如果不知道「消息的边界」，是无法读出一个有效的用户消息的。并且 TCP 报文是「有序的」，当「前一个」TCP 报文没有收到的时候，即使它先收到了后面的 TCP 报文，那么也不能扔给应用层去处理，同时对「重复」的 TCP 报文会自动丢弃。

> TCP四元组

TCP四元组可以确定一个TCP连接，它们是
- 源地址
- 源端口
- 目的地址
- 目的端口

### TCP头部

TCP头部格式如下：

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L2doL3hpYW9saW5jb2Rlci9JbWFnZUhvc3QyLyVFOCVBRSVBMSVFNyVBRSU5NyVFNiU5QyVCQSVFNyVCRCU5MSVFNyVCQiU5Qy9UQ1AtJUU0JUI4JTg5JUU2JUFDJUExJUU2JThGJUExJUU2JTg5JThCJUU1JTkyJThDJUU1JTlCJTlCJUU2JUFDJUExJUU2JThDJUE1JUU2JTg5JThCLzYuanBn?x-oss-process=image/format,png)

序列号：用来解决网络报乱序的问题
确认应答号：下一次期望收到的序列号，之前的说明

ACK：该位为 1 时，「确认应答」的字段变为有效，TCP 规定除了最初建立连接时的 SYN 包之外该位必须设置为 1 。
RST：该位为 1 时，表示 TCP 连接中出现异常必须强制断开连接。
SYN：该位为 1 时，表示希望建立连接，并在其「序列号」的字段进行序列号初始值的设定。
FIN：该位为 1 时，表示今后不会再有数据发送，希望断开连接。当通信结束希望断开连接时，通信双方的主机之间就可以相互交换 FIN 位为 1 的 TCP 段。

### 发送缓冲区与接收缓冲区

TCP使用字节流传输，而UDP使用数据报传输，字节流的特点就是：发送端执行的写操作次数和接收端执行的读操作次数没有任何数量关系，因为发送缓冲区和接受缓冲区的存在。

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

### TCP底层

![](https://img-blog.csdnimg.cn/img_convert/28e4d6b004530fbf75fe346d181baa81.png)

发送消息时，一个数据报首先会从用户空间拷贝到内核空间的发送缓冲区，然后顺着传输层、网络层、数据链路层，经过流控（qdisc），再经过RingBuffer发到物理层的网卡，然后顺着网卡经过多个路由器和交换机的跳转，最后到目的机器的网卡。

目的机器的网卡会通知DMA将数据包信息放入RingBuffer，然后发送硬中断给CPU，CPU触发软中断让ksoftirqd去RingBuffer收包，然后顺着物理层、数据链路层、网络层、传输层，最后拷贝到用户空间的应用程序中。




### TCP粘包问题

由于TCP是面向字节流的协议，跟UDP不一样。每个UDP报文是一个完整的用户边界，但是用TCP传输数据时，用户消息可能会被拆分为多个TCP报文，并且一个报文里可能有两个消息分别的某个部分，如果接收方不知道消息边界就会产生粘包问题。

一般是应用程序来解决这个问题，比如通过特殊字符作为边界，还可以自定义消息结构，从包头中获取。

### TCP Keep-Alive

TCP的保活机制，如果没有连接活动，就会每隔一段时间发送一个探测报文，如果连续的几个报文都没响应，就说明TCP连接挂了。

### TCP的建立：三次握手

著名的TCP三次握手：
![tcp三次握手-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643272895/TCP-IP-8.png)

最开始，客户端和服务端都处于CLOSED状态，服务端先主动监听某个端口，处于LISTEN状态。

1. 客户端随机初始化一个序号`client_isn`，将其置于TCO首部的序号字段中，SYN置为1，然后向服务端发送这个SYN报文，客户端进入`SYN_SENT`状态

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L2doL3hpYW9saW5jb2Rlci9JbWFnZUhvc3QyLyVFOCVBRSVBMSVFNyVBRSU5NyVFNiU5QyVCQSVFNyVCRCU5MSVFNyVCQiU5Qy9UQ1AtJUU0JUI4JTg5JUU2JUFDJUExJUU2JThGJUExJUU2JTg5JThCJUU1JTkyJThDJUU1JTlCJTlCJUU2JUFDJUExJUU2JThDJUE1JUU2JTg5JThCLzE1LmpwZw?x-oss-process=image/format,png)

2. 服务端的协议栈收到了这个SYN报文之后，对客户端的这个SYN进行应答，值为`client_isn+1`，放入确认应答号中，同时服务器也发送一个SYN包，内容是`server_isn`放入首部的序号号中，服务器进入`SYNC_RCVD`状态

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L2doL3hpYW9saW5jb2Rlci9JbWFnZUhvc3QyLyVFOCVBRSVBMSVFNyVBRSU5NyVFNiU5QyVCQSVFNyVCRCU5MSVFNyVCQiU5Qy9UQ1AtJUU0JUI4JTg5JUU2JUFDJUExJUU2JThGJUExJUU2JTg5JThCJUU1JTkyJThDJUU1JTlCJTlCJUU2JUFDJUExJUU2JThDJUE1JUU2JTg5JThCLzE2LmpwZw?x-oss-process=image/format,png)

3. 客户端协议栈收到了ACK之后，应用程序的connect调用返回，客户端到服务端的单向通信建立成功。并进入ESTABLISH状态，同时对服务端进行ACK应答，应答值为`server_isn+1`

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L2doL3hpYW9saW5jb2Rlci9JbWFnZUhvc3QyLyVFOCVBRSVBMSVFNyVBRSU5NyVFNiU5QyVCQSVFNyVCRCU5MSVFNyVCQiU5Qy9UQ1AtJUU0JUI4JTg5JUU2JUFDJUExJUU2JThGJUExJUU2JTg5JThCJUU1JTkyJThDJUU1JTlCJTlCJUU2JUFDJUExJUU2JThDJUE1JUU2JTg5JThCLzE3LmpwZw?x-oss-process=image/format,png)

4. 应答包到达服务器，服务器协议端的accept阻塞调用返回，也进入ESTABLISH状态，至此，服务器与客户端的点对点通信建立成功。

> 其实第三次握手的时候是可以携带数据的，前两次不可以。

> 思考一下为什么是三次。
我的理解是，如果A到B的传输连接要成功，至少需要两步，A尝试传一个信息到B，B再返回一个应答。这样就说明了A到B的单向没有问题。反过来也一样。正常来说应该需要四次握手，不过在服务端应答客户端的时候服务端顺便发送请求包，这样节省了一步。所以说最少是三次握手，两次必然不能保证一定连接成功，四次则多浪费了一次。
官方指出的三次握手的首要原因是为了防止旧的重复连接初始化造成混乱。如果采用两次握手，那么假如服务端收到了一个历史连接（可能中途因为一些原因传了很久），然后服务端直接进入ESTABLISHED，

#### 每次握手失败的处理

每个TCP报文都维护了一个重传定时器，如果超过时间没有收到对方的应答，发送方就会重传TCP报文并reset定时器。

一般每次重传都比之前的时间间隔更长（比如是上一次的两倍），并且设置最多重传次数，超过这个次数就放弃。

细讲的话，我们看在TCP三次握手时每个阶段的重传策略：

- 第一次握手丢失

客户端发送了第一次握手，没接收到服务端的ACK，那么就会触发超时重传机制，重传SYN报文，序列号是一样的。

重传次数由内核参数`tcp_syn_retries`控制，一般是5.

每次重传时间翻倍，第一次隔1s，第二次隔2s，以此类推，最后五次重传总耗时63秒，如果还没收到连接就认为网络有问题或者服务器宕机，不再发送SYN

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/network/tcp/%E7%AC%AC1%E6%AC%A1%E6%8F%A1%E6%89%8B%E4%B8%A2%E5%A4%B1.png)

- 第二次握手丢失

第二次如果丢失，客户端还是收不到ACK，所以还是会重传SYN报文，跟前一个一样。

服务端则是收不到第三次的握手，会重传SYN-ACK报文。重传次数由`tcp_synack_retries`决定，默认也是5次。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/network/tcp/%E7%AC%AC2%E6%AC%A1%E6%8F%A1%E6%89%8B%E4%B8%A2%E5%A4%B1.png)

- 第三次握手丢失

跟上一个一样，服务端则是收不到第三次的握手，会重传SYN-ACK报文。重传次数由`tcp_synack_retries`决定，默认也是5次。

ACK是不会重传的

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/network/tcp/%E7%AC%AC%E4%B8%89%E6%AC%A1%E6%8F%A1%E6%89%8B%E4%B8%A2%E5%A4%B1.drawio.png)



### TCP的关闭：四次挥手与TIME_WAIT

TCP是全双工的，所以存在一种半关闭状态，也就是A可以接受B发送来的数据，但是A不再发送数据给B，也就是说一端可以告诉对方自己发送的数据已经发完了，但仍然可以接受对方发送的数据，进入半关闭状态，如果对方也发送完了，就进入关闭状态。

![time_wait-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643272895/TCP-IP-12.png)


1. 客户端想关闭连接，发送一个FIN置为1的报文FIN，之后客户端进入`FIN_WAIT_1`状态。这个的意思是客户端不再发送数据了，但是还是能接受数据。

2. 服务端收到该报文，发送ACK，然后进入`CLOSE_WAIT`状态

3. 客户端收到ACK报文之后，进入`FIN_WAIT_2`状态

4. 等待服务器处理完数据，服务器也没有数据要向客户端发送了，就发送FIN报文告诉客户端自己也发完了。

5. 客户端收到FIN报文后，回复ACK，进入`TIME_WAIT`状态

6. 服务器收到ACK报文，进入`CLOSED`

7. 客户端经过2MSL，也`CLOSED`，这里是防止最后的ACK没有到达，可以允许报文丢失一次然后重发，没必要等更久，因为丢失多次的概率极低。

#### 每次挥手失败的处理

- 第一次挥手丢失

客户端收不到ACK，在`FIN_WAIT_1`状态，就会重发FIN报文。如果几次都丢失，就close

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/network/tcp/%E7%AC%AC%E4%B8%80%E6%AC%A1%E6%8C%A5%E6%89%8B%E4%B8%A2%E5%A4%B1.png)

- 第二次挥手丢失

ACK不会重传，客户端收不到ACK，还是重传FIN，几次都没收到的话客户端就close

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/network/tcp/fin_wait_2.drawio.png)

- 第三次挥手丢失

客户端不知道服务端是否传输完了，会一直在FIN_WAIT_2等待，服务端因为收不到ACK，会重发FIN报文。

如果客户端是通过`close`关闭的，`FIN_WAIT_2`不会持续太久，超过`tcp_fin_timeout`（默认是60s）还没收到FIN报文就会close。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/network/tcp/%E7%AC%AC%E4%B8%89%E6%AC%A1%E6%8C%A5%E6%89%8B%E4%B8%A2%E5%A4%B1.drawio.png)

如果客户端是通过`shutdown`关闭的，那么只说明它不再发送，还可以接收，那么客户端可以一直处于`FIN_WAIT_2`，第三次报文丢失的话客户端会死等。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/network/tcp/fin_wait_2%E6%AD%BB%E7%AD%89.drawio.png)

- 第四次挥手丢失，此时客户端收到服务器的`FIN`报文了，开启了2MSL的定时器并返回ACK，但是这个ACK丢失了，服务端一直收不到ACK就会重传FIN，如果这个FIN能到达客户端，客户端的定时器就会重置，直到最后因为翻倍传输的原因，两边分别因为定时器超时和重传次数达到上限会都close。

> 一个完整的建立和关闭的过程：
![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643549232/TCP-IP-14.png)

### 为什么要有TIME_WAIT

这里提一下TIME_WAIT状态。假设是主机一发送FIN到主机二，在收到FIN n的时候，主机一会进入TIME_WAIT的状态，停留时间是固定的。Linux下是两个最长份节生命周期的时间（即2MSL）。只有发起连接终止的一方会进入TIME_WAIT状态。

为什么有TIME_WAIT？因为TCP要考虑各种错误情况，假如最后一次挥手客户端的ACK没有传到服务端，那么服务端之后会重发FIN报文。此时如果客户端没有维护TIME_WAIT而是直接关闭，就会失去上下文。坚持2MSL，使得这次连接所有的迟到的报文来得及被丢弃。

但是TIME_WAIT过多，会导致系统资源和端口资源被占用，有时候可能由于TIME_WAIT导致性能下降。

### 如何优化TIME_WAIT

- 开启net.ipv4.tcp_tw_reuse 和 tcp_timestamps，可以复用处于TIME_WAIT的socket为新的连接使用。

- 修改 net.ipv4.tcp_max_tw_buckets，这个是TIME_WAIT的上限，超过之后系统就会将之后的TIME_WAIT重置

- 程序中在socket里使用SO_LINGER参数，设置close的关闭行为。可以通过设置让close调用直接发送RST标志从而跳过四次回收，不过这样做很危险



### TCP状态转移

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643273832/TCP-IP-13.png)

虚线为服务端，粗实线为客户端。

#### RST复位


### TCP重传机制

通过序列号与应答，可以确保一条通信的可靠传输。如果数据包丢失，就采用重传机制解决。前面在握手和挥手也提到了超时重传等策略，不过实际上有更多的重传策略。

#### 超时重传

发送数据时设置一个定时器，如果在规定的时间之内还收到ACK就会重发数据。可能是数据包丢失，也可能是ACK丢失。ACK是不会重传的。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost2/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/TCP-%E5%8F%AF%E9%9D%A0%E7%89%B9%E6%80%A7/5.jpg?image_process=watermark,text_5YWs5LyX5Y-377ya5bCP5p6XY29kaW5n,type_ZnpsdHpoaw,x_10,y_10,g_se,size_20,color_0000CD,t_70,fill_0)

超时时间RTO的具体数值需要设定好，如果它较小，可能导致并没有丢就重发，如果过大就导致效率下降。

一般重传时间RTO会略大于报文往返时间RTT。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost2/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/TCP-%E5%8F%AF%E9%9D%A0%E7%89%B9%E6%80%A7/8.jpg?image_process=watermark,text_5YWs5LyX5Y-377ya5bCP5p6XY29kaW5n,type_ZnpsdHpoaw,x_10,y_10,g_se,size_20,color_0000CD,t_70,fill_0)

具体的计算非常复杂，是一个经验公式，并且RTT也是随时变化的。

重传仍然失败后会等待加倍的时间然后继续重传，这个之前也说过。

#### 快速重传

TCP另一个重传机制，不基于时间而是基于数据。

比如发送了一个seq1，ACK返回2，但是seq2丢失了，seq3 4 5都传到了，但是ACK仍然只返回2，因为服务器没收到seq2。这样客户端收到了几个相同的ACK就会触发重传。

由于如果中途漏掉了若干报文，不知道该重传哪些，于是出现了SACK方法：

- SACK选择性确认

在TCP头部加一个SACK，将已收到的信息发送给发送方，这样就可以让发送方知道哪些数据没有收到，从而只重传丢失的数据。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost2/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/TCP-%E5%8F%AF%E9%9D%A0%E7%89%B9%E6%80%A7/11.jpg?image_process=watermark,text_5YWs5LyX5Y-377ya5bCP5p6XY29kaW5n,type_ZnpsdHpoaw,x_10,y_10,g_se,size_20,color_0000CD,t_70,fill_0)

- Duplicate Sack

另一个是Duplicate Sack（D-SACK），用SACK来告诉发送方哪些数据被重复接受了。

如果是ACK丢失，那么发送方并不知道而是会重传数据，但是接收方已经收到过了，就会使用D-SACK来告诉发送方。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost2/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/TCP-%E5%8F%AF%E9%9D%A0%E7%89%B9%E6%80%A7/12.jpg?image_process=watermark,text_5YWs5LyX5Y-377ya5bCP5p6XY29kaW5n,type_ZnpsdHpoaw,x_10,y_10,g_se,size_20,color_0000CD,t_70,fill_0)

可见，D-SACK 有这么几个好处：

- 可以让「发送方」知道，是发出去的包丢了，还是接收方回应的 ACK 包丢了;
- 可以知道是不是「发送方」的数据包被网络延迟了;
- 可以知道网络中是不是把「发送方」的数据包给复制了;

#### 滑动窗口

之前都是一个数据一次应答，这样效率不高。TCP引入窗口缓冲区机制。无需等待ACK就可以连续发送。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost2/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/TCP-%E5%8F%AF%E9%9D%A0%E7%89%B9%E6%80%A7/15.jpg?image_process=watermark,text_5YWs5LyX5Y-377ya5bCP5p6XY29kaW5n,type_ZnpsdHpoaw,x_10,y_10,g_se,size_20,color_0000CD,t_70,fill_0)

ACK k说明k之前的报文都收到了，这种方式称为累积确认。

发送方发送的数据大小不能超过接收方的窗口大小，否则接收方就无法正常接收到数据。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost2/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/TCP-%E5%8F%AF%E9%9D%A0%E7%89%B9%E6%80%A7/16.jpg?)

总共通过三个指针来区分这四块区域

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost2/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/TCP-%E5%8F%AF%E9%9D%A0%E7%89%B9%E6%80%A7/19.jpg?image_process=watermark,text_5YWs5LyX5Y-377ya5bCP5p6XY29kaW5n,type_ZnpsdHpoaw,x_10,y_10,g_se,size_20,color_0000CD,t_70,fill_0)

### TCP流量控制

发送方需要考虑到接收方的处理能力，不能无脑的发送数据。

流量控制就是让发送方根据接收方的实际能力控制发送的数据量的机制。



### TCP拥塞控制

由于链路层的承载量有限，需要进行控制。拥塞控制的目的就是避免发送方的数据填满整个网络。

SWND（Send WiNDow，发送窗口）：指的是发送端向网络一次性发送的数据量。

如果RWND过小，则延迟会比较大。如果RWND过大，则容易网络拥塞。

RWND（Receive WiNDow，接收窗口）：指的是接收端一次性能接收的数据量。

CWND（Congestion WiNDow，拥塞窗口）：不造成拥塞的最大数据量，这个会根据网络的拥塞程度动态变化。

实际的 $\text{SWND} = \min(\text{RWND}, \text{CWND})$

CWND的变化规则：如果出现了拥塞，就减少；如果没有拥塞，就增大。

只要发送方没在规定时间内接受到ACK，发生了超时重传，就认为网络拥塞了。主要通过下面的四个算法进行控制，其中前两个属于启动阶段的算法，后两个属于拥塞处理的算法。

#### 慢启动

设置了一个慢启动门限ssthresh，最开始启动的时候CWND设置一个较小的值（2-4个SMSS），然后慢慢按照指数方式增大CWND的值，直到超过这个门限，然后进入拥塞避免控制。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost2/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/TCP-%E5%8F%AF%E9%9D%A0%E7%89%B9%E6%80%A7/27.jpg?image_process=watermark,text_5YWs5LyX5Y-377ya5bCP5p6XY29kaW5n,type_ZnpsdHpoaw,x_10,y_10,g_se,size_20,color_0000CD,t_70,fill_0)

#### 拥塞避免

当CWND超过了ssthresh之后，每经过一个轮次，线性增加其大小而不是加倍，让其缓慢增大，出现一次超时后（发生拥塞），就让慢开始门限等于当前cwnd的一半，cwnd重新设为1。

本质上就是将指数增长变成了线性增长。

cwnd > ssthresh: 慢启动
cwnd < ssthresh: 拥塞避免

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost2/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/TCP-%E5%8F%AF%E9%9D%A0%E7%89%B9%E6%80%A7/28.jpg?image_process=watermark,text_5YWs5LyX5Y-377ya5bCP5p6XY29kaW5n,type_ZnpsdHpoaw,x_10,y_10,g_se,size_20,color_0000CD,t_70,fill_0)

拥塞避免算法实际上就是将慢启动的指数增长变成了缓慢的线性增长，之后会进入拥塞。触发了重传后就开始使用下面两种拥塞处理算法。

#### 快重传

当发送方连续收到三个重复的ACK报文时，也就是发生前面说的快速重传，会直接重传对方尚未收到的报文段，而不必等待那个报文段设置的重传计时器超时。

此时cwnd设为cwnd/2，ssthresh设为cwnd，进入快速恢复算法。


#### 快恢复

如果能收到三个重复的ACK，说明网络也没那么差，所以没必要那么强烈，在快重传的ssthresh和cwnd更改之后，拥塞窗口cwnd=ssthresh+3（意思是有三个数据包收到了）

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost4@main/%E7%BD%91%E7%BB%9C/%E6%8B%A5%E5%A1%9E%E5%8F%91%E7%94%9F-%E5%BF%AB%E9%80%9F%E9%87%8D%E4%BC%A0.drawio.png?image_process=watermark,text_5YWs5LyX5Y-377ya5bCP5p6XY29kaW5n,type_ZnpsdHpoaw,x_10,y_10,g_se,size_20,color_0000CD,t_70,fill_0)


### TCP的缺陷

- 升级TCP的功能非常困难

- TCP建立连接时有延迟

需要三次握手才能建立连接

- 存在队头阻塞问题

如果后面的报文先到也无法处理，必须要等中间缺的补齐，从而保证有序性

- 网络迁移需要重新建立TCP连接

比如更换ip端口什么的，需要重新建立，因为TCP连接由四元组确定。

### 一些实际的情况分析

#### SYN何时会被丢弃

如果服务器遭受SYN攻击，TCP半连接队列满了，后面的SYN包就会被丢弃。除非开启syncookies。

#### 已经建立连接的TCP，重新收到SYN会发生什么

比如TCP连接已经建立了，但是客户端忽然断线，服务端不知道还处于ESTABLISHED状态，过了一段时间客户端恢复，重新发送SYN请求连接，如果端口号不一样，会建立新的连接，之前的会超时被释放。

如果端口号一样，服务端会返回之前的SYN的ACK，客户端收到后发现不是现在的sql+1，就会返回RST通知服务端关闭掉连接。重新连接。

#### TIME_WAIT时收到SYN

如果SYN比期望的序列号大，那么是合法的SYN，服务端会从TIME_WAIT转变为SYN_RECV，继续连接。

如果SYN比期望的小，说明是不合法的，直接返回RST

#### 挥手时收到乱序的FIN包会发生什么

![](https://img-blog.csdnimg.cn/ccabc2f21b014c6c9118cd29ae11c18c.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5bCP5p6XY29kaW5n,size_20,color_FFFFFF,t_70,g_se,x_16)

比如这里期望是seq=y+1，但是收到的却是y+100，说明中间有个数据报延迟了，此时会放入乱序队列，不会进入TIME_WAIT状态。直到收到符合这个FIN的前面的数据报。

![](https://img-blog.csdnimg.cn/4effcf2a9e7e4adeb892da98ee21694b.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBA5bCP5p6XY29kaW5n,size_20,color_FFFFFF,t_70,g_se,x_16)



#### 客户端崩溃

如果客户端崩溃，还没开启keep-alive，那么服务端将会一直处于ESTABLISDED状态。

如果是进程崩溃，操作系统是能感知到并发送FIN报文进行四次挥手的。但是宕机的话并不会。

如果客户端宕机并立刻重启，就会恢复RST重置连接。

如果宕机没有重启，服务端重发次数多次之后就断开。

#### 拔掉网线TCP连接还存在



#### 如果服务端没有listen，客户端发起连接

此时服务端会返回RST报文

#### 如果没有accept，客户端发起连接

是可以完成建立TCP连接的，因为建立连接的时候不需要accept参与，它的目的只是在完成三次握手后，从全连接队列中取出一条连接。

## UDP协议

UDP不提供复杂的控制机制，利用IP协议提供无连接的通信。

UDP头部很简单：

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L2doL3hpYW9saW5jb2Rlci9JbWFnZUhvc3QyLyVFOCVBRSVBMSVFNyVBRSU5NyVFNiU5QyVCQSVFNyVCRCU5MSVFNyVCQiU5Qy9UQ1AtJUU0JUI4JTg5JUU2JUFDJUExJUU2JThGJUExJUU2JTg5JThCJUU1JTkyJThDJUU1JTlCJTlCJUU2JUFDJUExJUU2JThDJUE1JUU2JTg5JThCLzEyLmpwZw?x-oss-process=image/format,png)

### UDP和TCP的区别

- 连接

TCP面向连接，在传输数据之前需要先建立连接。
UDP不需要连接，直接传输数据。

- 服务对象

TCP只能点对点
UDP支持一对一、一对多、多对多

- 可靠性

TCP是可靠交付，数据可以无差错不丢失不重复按序到达。
UDP尽最大努力交付，不保证可靠交付。

- 拥塞控制、流量控制

TCP有这些机制来保证数据传输安全性
UDP没有

- 首部开销

TCP首部开销大
UDP首部开销小

- 分片不同

TCP如果大于MSS，会在传输层分片，接收端会组装，中途如果丢失了一个分片，会重传

DSP如果大于MTU，会在IP层分片，接收端在IP层组装完。

> IP层就能分片，但是TCP之所以还要采用MSS分片，是因为如果只采用IP分片，一个分片丢失整个IP报文都要重传，但是TCP的重发以MSS为单位，提高重传效率。

### UDP和TCP的应用场景

TCP常用于对保证数据可靠性的场景，比如
- FTP文件传输
- HTTP/HTTPS

UDP主要用于简单高效的随时发送数据，但是对可靠性要求不高的场景，比如：
- DNS、SNMP
- 音视频通信

### tips

#### UDP和TCP可以绑定同一端口

在IP包头的协议号字段就知道是TCP还是UDP了，所以绑定同一端口号不会冲突。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/network/port/tcp%E5%92%8Cudp%E6%A8%A1%E5%9D%97.jpeg)

不过多个TCP不能绑定同一端口号

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



## HTTP

### HTTP概念

HTTP是超文本传输协议（HyperText Transfer Protoco）

### HTTP状态码

![HTTP状态码](/assets/HTTP状态码.png)
### HTTP字段

- Host

域名，比如 www.baidu.com

- Content-Length

回应的数据长度

- Connection

比如
```
Connection: keep-alive
```
客户端要求服务器的TCP持久连接，从而可以复用。HTTP1.1默认都是这个。

- Content-Type

回应的数据格式，比如
```
Content-Type: text/html; charset=utf-8
```

- Content-Encoding

压缩方法，比如：

```
Accept-Encoding: gzip, deflate
```

### HTTP缓存技术

包括强制缓存和协商缓存。

如果浏览器本地缓存没过期，显示
```
Status Code: 200 (from disk cache)
```
就是强制缓存。

协商缓存是与服务器协商后，来决定是否使用本地缓存，如果HTTP响应码为304，就使用本地缓存。

### HTTP请求

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643611443/TCP-IP-18.png)

### HTTP的Keep-Alive

前面我们说了TCP的Keep-Alive

HTTP如果每次都是建立TCP-请求资源-应答资源-释放TCP，然后多次这样，效率就很低。HTTP通过在请求的头部加入：

```
Connection: Keep-Alive
```

来开启HTTP keep-alive，服务器恢复的响应也会加这个。

![](https://img-blog.csdnimg.cn/img_convert/b3fa409edd8aa1dea830af2a69fc8a31.png)

从而可以连接一次TCP然后多次请求资源。如果长期不用的话，超过一定的时间就会自动断开。

HTTP/1.1开始就默认开启了这个选项。

### HTTP/1.1

相比于HTTP/1.0，HTTP/1.1采用了长连接的方式，减少再次连接所需的时间。可以连续发送请求而不用收到回复再发下一个请求。

它同时还有三个特点：

1. 无状态传输，可以减轻服务器负担，但是由于失去记忆能力，如果是连续的请求，则每次都要重新鉴权，所以一般采用cookies的方式

2. 明文传输，便于debug，但是容易泄露信息

3. HTTP1.1最严重的问题是安全问题，由于通信使用明文（不加密），也不验证通信方的身份和不证明报文的完整性，可以通过HTTPS的方式解决。

### HTTPS

HTTPS在HTTP的基础上增加了SSL/TLS安全协议，从而使得报文可以加密传输。建立连接时还多了一步SSL/TLS的握手过程。HTTP端口号是80，HTTPS是443。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/HTTP/19-HTTPS%E4%B8%8EHTTP.png)

HTTPS需要向CA申请数字证书，保证服务器身份可信

HTTPS通过在HTTP与TCP之间加入SSL/TLS协议层，通过**信息加密、校验机制、身份证书**解决了HTTP的风险。

- 通过混合加密的方式达到信息加密的目的

HTTPS使用对称加密和非对称加密的混合加密方式

通信建立之前通过非对称加密交换会话秘钥，会生成公钥和私钥，公钥可以任意分发，私钥保密。

在通信过程之中通过对称加密来加密明文数据

- 通过摘要算法实现完整性，防止被篡改

对内容进行摘要算法（比如哈希函数）运算算出指纹，是不可逆推导的过程，如果内容被篡改了就会被检验出来

通常采用私钥加密这个哈希值，然后用公钥解密。私钥保存在服务端，公钥被发送给客户端，如果客户端收到的信息能被公钥解密就说明信息是完整的。



- 服务器公钥放入数字证书，防止被冒充

为了防止公私钥都被伪造了，就需要将公钥注册到一个公共机构，CA（数字证书认证机构），服务器公钥放在CA颁发的数字证书中。



![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/HTTP/22-%E6%95%B0%E5%AD%97%E8%AF%81%E4%B9%A6%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%A8%8B.png)

举个例子，家长签字，老师能辨别出家长的字迹（摘要算法），但是如果能模仿家长的字迹，那么也可以混淆，所以老师还保存了家长的公钥，家长的私钥无法获取，也就是说如果修改了签名，老师将无法解密，说明内容被篡改了。但如果公钥也是伪造的呢？为了解决这个问题，需要一个权威机构来存储所有的公钥（CA）

### HTTPS的通信

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/HTTP/23-HTTPS%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%A8%8B.png)



#### TLS握手

首先TLS握手是在TCP三次握手之后才进行的，因为要先建立可靠的TCP连接。

1. 客户端发送`ClientHello`加密通信请求，发送
①客户端的SSL/TLS版本
②客户端生成的随机数`Client Random`（用于后面的会话秘钥的生成）
③客户端支持的加密算法（比如RSA）

2. 服务端收到请求后发出`ServerHello`响应，发送
①确认SSL/TLS版本
②服务端生成的随机数`Server Random`（也用于后面的会话秘钥的生成）
③确认加密算法（比如RSA）
④服务器的数字证书

3. 客户端的回应
首先通过CA公钥检查服务器的数字证书的真实性，如果没有问题，就从数字证书中取出服务器公钥，用于加密报文。发送：
①一个随机数（pre-master key），会被公钥加密
②加密算法改变通知，表明之后的消息都会用会话秘钥加密
③客户端握手结束通知，表示握手阶段结束

4. 服务端最后回应
通过协商的加密算法计算出会话秘钥，发送：
① 加密算法改变通知，表明之后的消息都会用会话秘钥加密
② 服务端握手结束通知

之后客户端和服务端就进入了加密通信，相较于HTTP，HTTPS的每次通信都会用会话秘钥加密内容

还有一种情况就是中间人服务器，类似于代理那种，客户端的请求被假基站劫持并转发给了中间人服务器，然后这个服务器跟目标服务器沟通，这样中间的信息就会被窃取。中间人服务器跟客户端TLS握手时的证书是自己伪造的，会被浏览器识破，但是如果用户还是相信了这个安全证书，那么HTTPS通信依然会被劫持。

#### 两种加密方式

> RSA加密

传统TLS握手都采用RSA算法实现密钥交换。
客户端先生成随机密钥，使用服务端的公钥加密之后传给服务端。然后服务端用它的私钥（非对称加密，公钥解私钥，私钥解公钥）来解密出这个密钥。

但是RSA有个很严重的问题，那就是如果私钥泄露了，之前的消息都会被解密，也就是不具有前向安全性。更好的方式是ECDHE加密，涉及到密码学的知识，这里就不深入了



#### 一些关于HTTPS的小总结

相比于HTTP，HTTPS在建立连接的时候，多了TLS握手的过程，内容传输的时候进行了对称加密。

> TSL和SSL的区别

可以视为一个东西

### HTTP/2

HTTP/2基于HTTPS，安全性有保障

还增加了：

- 头部压缩

如果同时发送多个请求，头部重复部分会被压缩，通过静态表、Huffman编码等，将体积压缩了一半。HPACK算法

- 二进制格式

报文不再采用纯文本形式，而是二进制格式，对计算机更友好

- 数据流

数据包不按顺序发送，连续的数据包可能是不同的回应，每个回应的所有数据包称为一个数据流，数据流对应一个独一无二的编号，规定客户端发送的为奇数，服务端发送的为偶数。

客户端还可以指定数据流的优先级，服务端会优先响应优先级高的请求

- 多路复用

多个Stram复用一条TCP连接从而达到并发，不需要按照顺序一一回应

- 服务器主动推送资源

比如客户端访问HTML时，服务器直接主动推送css文件，从而减少消息传递次数。

nginx可以这样设置：
```
location /test.html {
  http2_push /test.css;
}
```


## 网络优化

### HTTP/1.1优化

优化思路：

#### 1. 尽量避免HTTP请求

通过HTTP缓存技术，缓存之前请求的资源，下次再访问这个资源的时候直接读取本地。当然缓存是有过期时间的，在第一次获取的时候响应头部会附一个时间，如果本地超时就说明缓存过期，重新请求。

另外重新请求的时候还会附带一个当前资源的唯一摘要etag，服务器的资源如果变动了就返回这个资源，如果没有变动就返回304。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost4@main/%E7%BD%91%E7%BB%9C/http1.1%E4%BC%98%E5%8C%96/%E7%BC%93%E5%AD%98etag.png)

#### 2. 减少请求次数

措施包括：减少重定向请求、合并请求、延迟发送请求

- 减少重定向请求

比如访问某个服务器，资源迁移了，代理服务器将资源所在的服务器地址返回给客户端，然后客户端再发起请求，这样就造成了额外的重定向请求。

所以重定向的工作应该交给代理服务器，代理服务器直接帮客户端向源服务器发起请求，再把结果返回给客户端。这样客户端就可以减少HTTP请求次数。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost4@main/%E7%BD%91%E7%BB%9C/http1.1%E4%BC%98%E5%8C%96/%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%87%8D%E5%AE%9A%E5%90%91.png)

重定向的工作可以交给代理服务器：
![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost4@main/%E7%BD%91%E7%BB%9C/http1.1%E4%BC%98%E5%8C%96/%E4%BB%A3%E7%90%86%E6%9C%8D%E5%8A%A1%E5%99%A8%E9%87%8D%E5%AE%9A%E5%90%91.png)

代理服务器可以记录重定向规则，进一步减少请求数量

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost4@main/%E7%BD%91%E7%BB%9C/http1.1%E4%BC%98%E5%8C%96/%E4%BB%A3%E7%90%86%E6%9C%8D%E5%8A%A1%E5%99%A8%E9%87%8D%E5%AE%9A%E5%90%912.png)

- 合并请求

将多个访问小文件的请求合并为一个大的请求。减少了重复的HTTP头部和TCP握手和慢启动的时间。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost4@main/%E7%BD%91%E7%BB%9C/http1.1%E4%BC%98%E5%8C%96/css%E7%B2%BE%E7%81%B5.png)

比如服务端用webpack打包各种资源，也是这样的优化。

还可以将图像直接用base64编码到HTML，可以直接解码渲染图片而不需要请求。

- 延迟发送

比如请求资源的时候先请求一部分数据，而不是一次请求完。

#### 3. 减少HTTP响应数据的大小

- 无损压缩

首先是去除换行符空格这种完全不破坏信息的方式。

gzip、br（谷歌的brotli算法）是几个比较常见的无损压缩方式，head中一般有：
```
Accept-Encoding: gzip, deflate, br
```

- 有损压缩

有损压缩的数据会牺牲一些原始数据来减少数据量
可以通过HTTP请求头部的q来告知期望的资源质量：
```
Accept: audio/*; q=0.2, audio/basic
```
图片的压缩可以采用webp格式，将比png小很多

音视频则是可以通过增量数据表达后面的帧，就可以减少很多数据。

### HTTPS优化

由于HTTPS比HTTP多了一个TLS握手过程来保障安全性，就更需要优化网络了。

![](https://cdn.xiaolincoding.com/gh/xiaolincoder/ImageHost4@main/%E7%BD%91%E7%BB%9C/https%E4%BC%98%E5%8C%96/%E4%BC%98%E5%8C%96https%E6%8F%90%E7%BA%B2.png)

这里主要是TLS协议握手的过程与握手后的加密报文传输需要被优化。

- 硬件优化

HTTPS协议是计算密集型，所以需要优化CPU，尤其是支持AES-NI的CPU，这样可以在指令级别优化AES算法的计算

- 软件优化

比如升级系统内核、软件版本等

- 协议优化

采用ECDHE密钥交换而不是RSA，会减少一个RTT。

对称加密算法，如果安全性要求不高可以选用AES_128_GCM

TLS升级

- 证书优化

传输应该用ECDSA，长度更短。验证用OCSP，向CA发送查询，CA返回证书有效状态。

- 会话复用

不应该用id保存，这样服务端保存的东西太多，而且负载均衡之后访问的不一定是同一台服务器。
更好的是用session ticket，类似于HTTP cookies，保存在客户端。

TLS1.3会在重连的时候直接把ticket和HTTP请求一同发给服务器，重连不需要额外的时间成本，称为pre-shared key

### TCP优化

#### 三次握手的性能优化

- 调整SYN报文和SYN/ACK报文的重传次数

客户端和服务端默认重传5次左右，如果内网通讯可以调低重传次数提高效率，网络非常繁忙不稳定的时候调高重传次数。

- 调整SYN半连接队列/acept全连接队列的长度

如果SYN半连接队列溢出情况比较严重可以调整SYN队列大小。
如果accept队列溢出严重可以通过backlog和somaxconn等参数提高队列大小。

- 绕过三次握手

Linux3.7引入的TCP Fast Open，第一次三次握手之后会存一个Cookie，之后连接就不需要再三次握手了，客户端直接发送SYN和数据以及Cookie，如果服务端检测到Cookie有效，就在SYN-ACK中也附带数据，相当于直接可以传输。

#### shutdown和close

主动关闭报文的方式有RST和FIN，其中如果收到RST就直接暴力关闭，FIN是通过`shutdown`和`close`关闭的。

`close`是完全关闭两个方向的连接，`shutdown`只关闭单方向的连接。

`close`客户端收到第二次握手后直接返回RST，然后释放连接。是粗暴的关闭，没有经历完整的四次挥手。

![](https://img-blog.csdnimg.cn/3b5f1897d2d74028aaf4d552fbce1a74.png)

`shutdown`则是单方向的关闭，经历了完整的四次挥手。

![](https://img-blog.csdnimg.cn/71f5646ec58849e5921adc08bb6789d4.png)

#### 四次挥手的性能优化

- 调整FIN报文重传次数

- 调整FIN_WAIT2的时间与孤儿连接的上限个数（仅适用于close）

也就是关闭主动方收到第一个ACK，但是被动方还没发送FIN，此时主动方在FIN_WAIT2状态，此时就是孤儿连接。如果在一定的时间内没收到就会直接关闭。如果占用资源过多，可以调整时间和降低孤儿连接上限。

- 调整TIME_WAIT的上限

Linux 提供了 tcp_max_tw_buckets 参数，当 TIME_WAIT 的连接数量超过该参数时，新关闭的连接就不再经历 TIME_WAIT 而直接关闭

- 复用TIME_WAIT的连接（仅适用于客户端）

#### TCP数据传输的性能优化

- 扩大窗口大小

- 调整发送和接收缓冲区的范围

- 打开接收缓冲区动态调节

- 调整内存范围




### TCP应答

![HTTP状态码](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643698156/HTTP%E7%8A%B6%E6%80%81%E7%A0%81.png)

301和302的区别：
301是永久转移，302是临时转移。
会返回一个Location，然后跳转到新的Location

301：要永久更换了，比如换了个域名，返回的是新页面的内容

302：资源暂时失效，返回一个临时页，过段时间会换回来，容易遇到流量劫持
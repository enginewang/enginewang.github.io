---
title: "Linux网络编程（二） socket网络编程基础"
date: 2022-02-06T20:00:52+08:00
draft: false
categories: ["理论"]
tags: ["Linux", "TCP/IP"]
---


#### 概述

数据链路层、网络层和传输层的协议都是在操作系统内核中完成的，实现网络的系统调用的api目前最主流的就是socket。

socket是应用层与TCP/IP协议之间的软件抽象，将复杂的TCP/IP协议隐藏在socket后面，用户只需要调用合适的socket api，socket就会组织对应的协议进行通信。

最基本的客户端-服务器网络模型：
![client-server-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643894720/client-server-1.png)

运行的单位都是进程。

一个连接可以通过客户端-服务端的ip和端口号唯一确定，被称为套接字对：
```
(clientAddr:clientPort, serverAddr, serverPort)
```

![client-server-2](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643894720/client-server-2.png)

#### TCP网络

下图是客户端-服务端TCP网络的核心逻辑

![socket-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643896619/socket-1.jpg)

客户端和服务端建立TCP通信的过程：

服务端：初始化socket，bind绑定到ip和port上然后listen等待
客户端：初始化socket，通过connect发起连接请求，与服务端通过**TCP三次握手**建立连接。

连接建立好之后，数据可以双向传输，之后通过客户端的close发起关闭连接请求。处于半关闭状态，服务器收到后也执行close，进入全关闭。

**socket是用来建立网络连接，传输数据的唯一途径**，成为网络互连的标准。

可以将TCP的网络交互理解为打电话，socket是电话机，bind的过程就是把电话机连上线。listen的过程就是在家听到了铃响，accept的过程就是拿起听筒开始应答。

TCP的三次握手相当于，客户端说：你好，我是客户端。服务器说：确实是你，我是服务端。客户端说：确实是你，服务器收到了。

然后就进入了连接的过程，任意一方说话相当于write，接收到电话的相当于read，可以双向交流。

拨打电话的结束之后，挂断电话，即close。

#### UDP网络

UDP面向数据报，不基于连接，不保障顺序性、可靠性、没有拥塞控制、重传机制等。在IP协议的基础上增加的部分很有限。

但是在很多不需要完全可靠和完全顺序性的场景，如DNS、多人聊天、直播等。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643899709/socket-3.png)

服务端创建和绑定socket之后，客户端和服务端之间直接通过`sendto`和`recvfrom`来传递数据，没有建立连接的过程。

#### C语言补充

这里只记录一些后面遇到的C语言相关的一些补充。

##### 环境搭建

Linux需要安装编译环境：

Ubuntu
```bash
sudo apt-get install gcc g++ make cmake
```

CentOS
```bash
sudo yum install gcc g++ make cmake
```

mac也可以，用clion的话，需要先安装Xcode command line developer tools（不需要完整的Xcode）

```c
xcode-select --install
```

表明安装成功
```bash
> clang --version
Apple clang version 12.0.0 (clang-1200.0.32.29)
Target: x86_64-apple-darwin19.6.0
Thread model: posix
InstalledDir: /Library/Developer/CommandLineTools/usr/bin
```

然后去clion配置好gcc（C编译器）和g++（C++编译器）的路径即可

![](https://resources.jetbrains.com/help/img/idea/2021.3/cl_toolchain_detectok.png)

##### 一些C语言补充的内容

C语言中，uintx_t表示的是有x/8个字节的数据类型。
```c
uint8_t
uint16_t
uint32_t
uint64_t
```

几个表示size的类型
`size_t`就是unsigned long（64位）或者unsigned int （32位）
`ssize_t`是long或者int，有符号

#### socket数据结构

首先看一下socket的通用结构：
```c
// 描述地址类型
typedef unsigned short int sa_family_t;
/* 描述通用套接字地址  */
struct sockaddr{
    sa_family_t sa_family;  /* 地址族.  16-bit*/
    char sa_data[14];   /* 具体的地址值 112-bit */
};
```

地址族就是说明这个socket是属于哪种类型的地址。比如IPv4、iPv6、本地地址等。

包括AF_和PF_，其中AF_是地址族，PF_是协议族，一一对应，比如ipv4的就是AF_INET和PF_INET。ipv6的就是AF_INET6和PF_INET6，本地的就是AF_LOCAL和PF_LOCAL。它们也是互相对应相等的。

```c
#define PF_LOCAL	1	/* Local to host (pipes and file-domain).  #define PF_FILE		PF_LOCAL /* Another non-standard name for PF_LOCAL
#define PF_INET		2	/* IP protocol family.  */
#define PF_INET6	10	/* IP version 6.  */

#define AF_LOCAL	PF_LOCAL
#define AF_FILE		PF_FILE
#define AF_INET		PF_INET
#define AF_INET6	PF_INET6
```

IPv4套接字格式：

```c
// 地址为4个字节，32个bit
// 因为ipv4的ip形式最高是255.255.255.255，每一段需要8bit，1字节，总共需要4个字节，32bit
typedef uint32_t in_addr_t;
struct in_addr
  {
    in_addr_t s_addr;
  };
// port是两个字节，16bit，因为2^16=65526，所以port是从0-25535
typedef uint16_t in_port_t;

/* 描述 IPV4 的套接字地址格式  */
struct sockaddr_in
  {
    sa_family_t sin_family; /* 地址族 16-bit */
    in_port_t sin_port;     /* 端口口  16-bit*/
    struct in_addr sin_addr;    /* Internet address. 32-bit */
  };
```

IPv6的地址结构：
```c
/* 描述 IPV6 的套接字地址格式  */
struct sockaddr_in6
  {
    sa_family_t sin6_family; /*地址族 16-bit */
    in_port_t sin6_port;  /* 传输端口号 # 16-bit */
    uint32_t sin6_flowinfo; /* IPv6 流控信息 32-bit 先不管*/
    struct in6_addr sin6_addr;  /* IPv6 地址 从32位升级到128位，提升非常巨大 128-bit */
    uint32_t sin6_scope_id; /* IPv6 域 ID 32-bit  先不管*/
  };
```

除了英特网套接字外，还有本地套接字
```c
/* 描述本地套接字的￥地址格式  */
struct sockaddr_un {
    unsigned short sun_family; /* 固定为 AF_LOCAL */
    char sun_path[108];   /* 路径名 */
};
```

有一些保留端口，比如常见的ftp的21端口，ssh的22端口，http的80端口，一般来说大于5000的端口可以自己用。

下图是各个地址族的结构

![socket-2](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1643894800/socket-2.png)

#### 转换函数

##### IP地址转换

平常习惯使用十进制来描述ipv4的ip，用十六进制描述ipv6的ip，然而实际计算机都要转换为二进制。如果输出日志，为了可理解性又需要转换为合适的十进制或者十六进制。

Linux内置了二者互相转换的函数：
```c
int inet_aton(const char*cp,struct in_addr*inp); char *inet_ntoa(struct in_addr in);
```

`inet_aton`可以将点分十进制字符串表示的ipv4 ip转换为网络字节序表示的`in_addr`结构

`inet_ntoa`则相反，将网络字节序表示的`in_addr`结构转换为点分十进制字符串表示的ipv4 ip

一对更好的函数是`inet_pton`和`inet_ntop`，这个对于ipv4和ipv6通用。以inet_pton为例：

```c
# 将string类型的十进制字符串表示的ip写成二进制的网络字节序作为server_address的sin_addr
inet_pton(AF_INET, ip, &server_address.sin_addr);
```

##### 主机地址到网络地址

计算机硬件有两种存储方式大端字节序和小端字节序，比如数值`0x1234`，用大端字节序表示符合人类习惯，就是`0x1234`，高位是`0x12`，低位是`0x34`，而用小端字节序的话，各个字节的顺序就要反过来，高位是`0x34`，低位是`0x12`。


![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1644291229/big-endian-little-endian-1.png)

因为计算机电路先处理低位字节的效率比较高，所以计算机内部处理都是用的小端字节序，但是除了内部处理，其他场合比如网络传输、文件存储，还是使用的人类更容易理解的大端字节序。

所以主机字节序采用小端字节序和网络字节序采用大端字节序，需要进行一个转换。

转换函数如下：

```c
#include <arpa/inet.h>
// 16/32位的主机字节序转换为网络字节序
// 其实就是字节的高低位互换
uint16_t htons(uint16_t hostlong)
uint32_t htonl(uint32_t hostlong)
// 16/32位的网络字节序转换为主机字节序
uint16_t ntohs(uint16_t hostlong)
uint32_t ntohs(uint32_t hostlong)
```

#### socket编程api

##### socket的创建

通过`socket()`函数创建一个socket，具体参数如下：

```c
int socket(int domain, int type, int protocol)
```

domain是地址族，指PF_INET、PF_INET6、PF_LOCAL这种
type指的是类型，比如`SOCK_STREAM`表示字节流，对应TCP，`SOCK_DGRAM`表示数据报，对应UDP，`SOCK_RAW`表示原始套接字
第三个protocol现在已经废弃，默认填0即可，一般只需要前两个参数。

这样要创建一个ipv4的TCP socket只需要：
`socket(PF_INET, SOCK_STREAM, 0)`

##### socket绑定：bind

bind函数的作用是将套接字和套接字地址绑定，套接字只知道自己的具体结构类型等，并不知道具体的ip和地址。

bind函数的定义如下：
```c
bind(int fd, sockaddr* addr, socklen_t len)
```

第一个参数是套接字，第二个参数是sockaddr结构的套接字地址，第三个参数是地址长度。

需要将本地套接字格式转换为通用套接字格式。比如
```c
struct sockaddr_in name;
bind (sock, (struct sockaddr *) &name, sizeof (name)
```

比如把ipv4的sockaddr_in结构
```c
struct sockaddr_in
  {
    __SOCKADDR_COMMON (sin_);
    in_port_t sin_port;			/* Port number.  */
    struct in_addr sin_addr;		/* Internet address.  */

    // 占位符，无作用
    unsigned char sin_zero[sizeof (struct sockaddr)
			   - __SOCKADDR_COMMON_SIZE
			   - sizeof (in_port_t)
			   - sizeof (struct in_addr)];
  };
```
转换为通用的sockaddr结构
```c
struct sockaddr
  {
    __SOCKADDR_COMMON (sa_);	/* Common data: address family and length.  */
    char sa_data[14];		/* Address data.  */
  };
```

地址可以设置为本机的地址，但是假如说程序部署到本机，地址是本机的局域网ip 192.168.x.x，之后假如程序部署到其他机子上，需要修改为公网ip，所以需要一种通配地址的机制，来让所有目标地址是本机的请求都接收到，ipv4通过`INADDR_ANY`，ipv6通过`IN6ADDR_ANY`来设置。

##### socket监听：listen

bind函数让套接字和地址关联，但是还需要将套接字进行监听，通过调用listen让服务处于可接听的状态。

初始化的套接字是主动套接字，可以主动发起请求，而通过listen函数之后会变成被动套接字，用来等待客户的请求。

`listen(int socket, int backlog)`
第一个参数是套接字，第二个参数是未完成连接队列的大小，决定了可以接收的并发数目

##### 接受连接：accept

服务端的操作系统内核监听到了客户端的请求，类比于接电话就是此时听到了铃响，通过accept来接电话。

```c
int accept(int listensockfd, struct sockaddr *cliaddr, socklen_t *addrlen)
```

第一个参数是套接字，第二个参数是连接的客户端的socket地址，第三个参数是地址长度，第二和第三个参数都是传入空然后指针改变从而获取，accept会返回一个新的已连接套接字。因为不可能一个服务端只服务一个客户端。

##### 发起连接：connect

前面的是服务端的连接建立的方法，客户端的创建socket一样，不过之后要通过connect来主动连接服务端。

```c
int connect(int sockfd, const struct sockaddr *servaddr, socklen_t addrlen)
```

第一个参数是套接字，第二个参数是指向套接字地址结构的指针和结构的大小。套接字地址结构需要包含服务端的ip和端口。

客户端不需要调用bind，在创建完socket后就可以直接调用connect，内核会随机分配一个端口给这次连接。

##### 关闭连接：close, shutdown

关闭一个连接，实际上就是关闭连接对应的socket。

可以通过`close`来关闭连接：

```c
int close(int fd)
```

但是close不是直接关闭，实际上只是把fd的引用计数-1，如果要完全关闭的话需要在子进程和父进程都调用close。

立即终止连接则应该使用`shutdown`：

```c
int shutdown(int sockfd, int howto)
```

`howto`包括三种关闭方式：
1. SHUT_RD：关闭读
2. SHUT_WR：关闭写
3. SHUT_RDWR：关闭读写

##### TCP的数据发送和接收：write, send, sendmsg, read

建立好连接后，接下来就是发送数据。常见的发送数据的函数有write, send, sendmsg

```c
ssize_t write (int socketfd, const void *buffer, size_t size)
ssize_t send (int socketfd, const void *buffer, size_t size, int flags)
ssize_t sendmsg(int sockfd, const struct msghdr *msg, int flags)
```

write就是普通的写文件，因为套接字也是文件
如果想发送袋外数据（一种基于TCP的紧急数据），可以用带flag的send
如果想指定多重缓冲区就需要用sendmsg，通过结构体msghdr传递数据

```c
ssize_t read(int socketfd, void *buffer, size_t size)
```

read将会从socket中读取最多size个字节，然后将结果存储到buffer中。

##### UDP的数据发送和接收：sendto, recvfrom

```c
ssize_t recvfrom(int sockfd, void *buff, size_t nbytes, int flags,
　　　　　　　　　　struct sockaddr *from, socklen_t *addrlen);

ssize_t sendto(int sockfd, const void *buff, size_t nbytes, int flags,
                const struct sockaddr *to, socklen_t *addrlen);
```

由于UDP不会保存上下文的信息，所以还额外传递对端的地址端口等信息。TCP在accept阶段就拿到了对端的信息。UDP的每次接收和发送都是独立的上下文。

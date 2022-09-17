---
title: "Ubuntu配置samba共享简易记录"
date: 2021-07-23T14:47:14+08:00
draft: false
categories: ["技术"]
tags: ["nas", "Linux"]
---

nas的便捷早已融入了生活,最开始是利用路由器挂载移动硬盘的方式，目前仍在使用不过容量有限(4T)。

而我的主机是win10+Ubuntu18.04双系统，除去2T的SSD系统盘之外，去年还买了两块机械硬盘(16TB+6TB)用来存文件，也就是22T，为此我基本把百度云存的一些课程完整下到了本地，win10打开samba比较容易，勾选几个选项就好，而目前大部分时间其实是在Ubuntu下跑实验，所以需要在Ubuntu下开启samba共享，简单记录一下步骤：

## 挂载硬盘

先查一下机械硬盘的位置:

```bash
$ sudo fdisk -l
Disk /dev/sda: 14.57 TiB, 16000900661248 bytes, 31251759104 sectors
Disk model: ST16000NM000J-2T
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes
Disklabel type: gpt
Disk identifier: 50471F15-5395-44CC-94E3-CF0AE43F83A7

Device     Start         End     Sectors  Size Type
/dev/sda1     34       32767       32734   16M Microsoft reserved
/dev/sda2  32768 31251755007 31251722240 14.6T Microsoft basic data

Disk /dev/sdb: 5.47 TiB, 6001175126016 bytes, 11721045168 sectors
Disk model: ST6000NM0115-1YZ
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 4096 bytes
Disklabel type: gpt
Disk identifier: 5375EE2B-DB96-40E2-AA43-776B835D2253

Device     Start         End     Sectors  Size Type
/dev/sdb1     34       32767       32734   16M Microsoft reserved
/dev/sdb2  32768 11721041919 11721009152  5.5T Microsoft basic data
```

可以发现16T的机械硬盘分别是`/dev/sda2`

默认挂载点是`/dev/sda2`,不去动他

挂载硬盘

```bash
$ sudo umount /dev/sda2
```

```bash
$ sudo mount /dev/sda2 /dev/sda2
```

创建开机自动挂载,首先获取uuid

```bash
$ sudo blkid /dev/sda2
/dev/sda2: LABEL="File" UUID="02785C53785C4795" TYPE="ntfs" PARTLABEL="Basic data partition" PARTUUID="3dbd7fde-6292-4173-928e-1a5d2a5fb624"
```

硬盘的uuid是`02785C53785C4795

修改`/etc/fstab`,将uuid填在末尾:
```txt
UUID=02785C53785C4795 /dev/sda2 ntfs defaults 0 2
```

第一个数字：0表示开机不检查磁盘，1表示开机检查磁盘；
第二个数字：0表示交换分区，1代表启动分区（Linux），2表示普通分区
挂载的分区是在WIn系统下创建的分区，磁盘格式为ntfs

## 设立Samba共享

```bash
$ sudo apt-get install samba cifs-utils
```

```bash
# /etc/samba/smb.conf
[NASShare]
  path = /media/engine/File
  read only = no
# 视情况是否要允许guest访问
  guest ok = yes
```

```bash
# 新增samba用户，后面访问nas的时候要用
sudo smbpasswd -a <username>
# 会弹出密码，输入即可
```

```bash
$ sudo systemctl restart smbd
```

配置完成

## 访问nas

先查一下主机的ip：

```bash
$ ifconfig
eno1: flags=4099<UP,BROADCAST,MULTICAST>  mtu 1500
        ether f0:2f:74:30:7e:7b  txqueuelen 1000  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
        device interrupt 16  memory 0x92400000-92420000

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 707218  bytes 68728858 (68.7 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 707218  bytes 68728858 (68.7 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

wlp4s0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.50.174  netmask 255.255.255.0  broadcast 192.168.50.255
        inet6 fe80::6778:73ef:e70d:6cb1  prefixlen 64  scopeid 0x20<link>
        ether dc:41:a9:da:14:20  txqueuelen 1000  (Ethernet)
        RX packets 10482994  bytes 12080226956 (12.0 GB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 5291322  bytes 897290799 (897.2 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

查到局域网ip地址是192.168.50.174，之后在局域网下访问nas的时候需要通过这个地址。

不同的客户端的方式不一样

- windows

可以在我的电脑上面的地址栏输入 \\192.168.50.174 然后输入账户密码访问

- macOS

Finder - go - connect to server，输入smb://192.168.50.174

- Android/IOS

一些app可以访问nas，比如nPlayer、FE File Explorer等。

内网穿透直接访问nas好像有些问题，就采用了内网穿透cloudreve云盘挂载的方式，见后面的[内网穿透记录](https://yichengme.site/posts/frp-notes/#cloudreve%E7%A7%81%E6%9C%89%E4%BA%91%E5%AD%98%E5%82%A8)

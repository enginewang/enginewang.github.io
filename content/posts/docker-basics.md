---
title: "Docker——从入门到使用"
date: 2022-02-19T17:27:34+08:00
draft: false
categories: ["工程"]
tags: ["Docker"]
---

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645299146/docker-logo.png)

## Docker概述

> 为什么需要Docker？

项目环境需要迁移，重新配环境很麻烦、一些配置很复杂程序想让其他人运行。

一个解决方法是虚拟机，但是虚拟机过于笨重。为了克服虚拟机的缺点，Linux发展出了一种虚拟化技术：Linux Container（LXC），该技术可以对进程进行隔离，对于容器里面的进程来说，接触到的所有资源都是虚拟的。

Docker则是对LXC的一种封装，是目前最流行的Linux容器方案，甚至成已然为了容器的代名词。

> 虚拟机（Virtual Machine）和Docker的区别：

![docker-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645299151/docker-1.png)

![docker-2](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645299231/docker-2.png)

Docker相比于传统虚拟机的优点：
1. 更节约资源，同样的硬件可以运行更多的容器
2. 启动更快
3. 运行环境一致
4. 持续交付和部署
5. 更方便的迁移


Docker完美贴合DevOps理解，适用于CI/CD流程。

## Docker原理概述

![docker-3](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645299288/docker-3.png)

| 概念 | 解释 |
|-|-|
| Docker Client（客户端） | 客户端通过命令行或者其他工具与Docker Host进行通信 |
| Docker Host（主机） | 用来执行Docker守护进程和容器的物理或者虚拟的机器 |
| Docker Registry | 保存镜像的代码仓库，类似github |

## Docker三大概念

### 镜像（image）

相当于一个特殊的root文件系统，比如`ubuntu:18.04`官方镜像，就包含一套完整的Ubuntu18.04最小系统的root文件系统，image也可以是多个image堆叠在一起组成，比如在一个image里同时放centOS、MySQL、nginx、app等。

image可以看成是container的模板，一个image可以生成多个同时运行的container。

Image从哪里获得？
1. 从Docker Hub pull下来
2. 从其他地方导出的image导入进来
3. 自行写Dockerfile

大部分情况下，为了节约时间，都是使用其他人的image或者在其他image上进行一些修改，很少会从0开始写。

Dockerfile类似于一个创建container的脚本，因为Dockerfile的内容比较多，下一篇专门讲一下怎么写。

### 容器（container）

image是静态的定义，container是镜像运行时的实体，类似于跑起来的一个个虚拟机。镜像和容器的关系，类似于面向对象过程中的类与示例。容器通过镜像产生，并独立运行。

container可以被创建、启动、停止、删除、暂停等。

容器不应该向存成内写入数据，所有的文件写入操作应该使用数据卷（Volume），数据卷可以使得容器删除或者重新运行后数据不会丢失

### 仓库（repository）

Docker Registry是一个集中的存储、分发镜像的服务。可以包含多个repository，每个repository可以包含多个标签，一个标签对应一个image

最主流的仓库是官方的Docker Hub


## Docker安装

Docker的安装很简单，一般直接去官网下载安装，然后运行Docker服务，命令行输入`docker version`，出现版本即安装成功。

## Docker命令

### build

在含有Dockerfile的文件夹中执行：
```bash
docker build -t <IMAGE>:<tag> .
```

### run

```bash
# 运行容器
docker run [option] <image> [cmd]
# 比如
docker run --name ubuntu -it --rm ubuntu:18.04 bash
```

其中`--name`赋予一个名称，`-it`表示交互模式[i]的终端[t]，`--rm`表示运行完之后就删除这个container，最后的是在容器中执行的命令，这里是`bash`表示打开命令行。

这里docker run如果运行的是公用镜像，在本地找不到的话会自动去docker hub pull下来。

或者先创建不进去，之后运行交互命令行：`docker exec -it <id/name> bash`

docker run的一些参数如下：

| 参数 | 说明     |
| ---- | -------- |
| -i   | 交互式   |
| -t   | 终端     |
| -p   | 端口映射，比如 `-p 8000:3000`指的就是本机的8000端口映射容器的3000端口 |
| -P   | 让容器的端口随机映射到本机上 |
| -d | 后台运行容器 |
| -v | 绑定一个卷 |
| --name | 指定一个别名 |
| --remove | 使用完就删除 |
| --mount | 加载数据卷到容器的某个目录，比如`source=my-vol,target=/usr/share/nginx/html` |

多个可用一起使用，比如`-it`表示运行容器的交互式终端

### image相关

```bash
# 列出全部的image
docker image list
# 或者简写为
docker image ls
```

比如
```bash
REPOSITORY        TAG       IMAGE ID       CREATED         SIZE
redis             latest    f1b6973564e9   3 weeks ago     113MB
```

``` bash
# 删除image
docker image rm <id>/<短id>/<lable>
```

### container相关

```bash
# 列出所有正在运行的container
docker container list
# 或者简写为
docker container ls
# 或者进一步简写为
docker ps
```

比如

```bash
CONTAINER ID   IMAGE     COMMAND                  CREATED          STATUS          PORTS                    NAMES
29436842e21d   redis     "docker-entrypoint.s…"   52 minutes ago   Up 52 minutes   0.0.0.0:6379->6379/tcp   my-redis
```

其中CONTAINER ID和NAME都能指代唯一的container，之后说的<container_id>可以用其中之一表示，ID取前五位即可，比如`29436`和`my-redis`都可以指定这个container。

```bash
# 列出所有container，即使是已经停止运行的。
docker container ls --all

# 停止某容器，只是停止容器运行，之后可以随时启动
docker stop <container_id>

# 启动某容器，不会和run一样开一个新的，而是启动一个已经停止的container
docker start <container_id>

# 进入容器，首先这个容器需要是running的
# 比如之前创建的时候后台运行了，就可以通过exec重新进入容器
docker exec <option> <container_id> [cmd]

# 重启某容器
docker restart <container_id>

# 删除某容器，不同于停止，删除会从本地完全删掉
docker rm <container_id>

# 结束对应container的进程（如果container还在运行的话）
docker kill/stop [id]

# 列出所有被停止的container的id
docker container ls -aq

# 删除这些停止的container，不再占本地空间，之后ls --all就不会显示了
docker container rm  $(docker container ls -aq)
```

修改之后，如果要将container提交保存为image，使用commit命令：
`docker commit --author "engine" --message "msg" <name> <image:label>`
会返回一个sha256，但是并不建议这样，因为每次改动一个小地方就可能会动到很多系统文件，会很臃肿

### 其他

```bash
# 列出docker image、repository、container占用的系统空间
docker system df

# 查看某容器的端口映射
docker port <container_id>
```

## 数据管理

数据管理一般是通过数据卷或者挂载主机目录这两种方式：

![types-of-mounts](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1645299354/docker-4.png)

### 数据卷Volume

```bash
# 创建一个数据卷
docker volume create <vol_name>

# 查看所有数据卷
docker volume ls

# 删除数据卷
docker volume rm <vol_name>

# 清理无主的数据卷
docker volume prune
```

`docker run`的时候可以通过`--mount`来加载数据卷到容器的某个目录

### 挂载主机目录

或者挂载主机目录，通过`--mount type=bind,source=,target=`来挂载

```bash
docker run -d -P \
    --name web \
    # -v /src/webapp:/usr/share/nginx/html \
    --mount type=bind,source=/src/webapp,target=/usr/share/nginx/html \
    nginx:alpine
```

## Docker Compose

Docker Compose负责快速的部署分布式应用。
Compose允许用户通过一个单一的`docker-compose.yml`文件来为一个项目创建一组容器。

安装好doker后即可使用`docker-compose`命令，具体的yaml文件写法见官方文档：https://docs.docker.com/compose/compose-file/


## Docker Hub

### search

```bash
# 搜寻指定image，只看官方
docker search <image> -f is-official=true
```

### pull

```bash
docker pull [option] Registry:port/name/label
```

### push

先去Docker Hub注册，可以本地命令行登录

```bash
docker login
```

在hub上创建好一个仓库，假设叫`<REPO>`

然后将image打tag：
`docker image tag <IMAGE_ID> <HUB_ID>/<REPO>:<version>`

push到repo中
`docker push <HUB_ID>/<REPO>:<version>`




参考：
1. https://docs.docker.com/
2. https://ithelp.ithome.com.tw/users/20103456/ironman/1320
3. https://yeasy.gitbook.io/docker_practice/
4. https://www.ruanyifeng.com/blog/2018/02/docker-tutorial.html
5. https://www.runoob.com/docker/docker-container-usage.html

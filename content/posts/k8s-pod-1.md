---
title: "Kubernetes核心：Pod"
date: 2023-09-20T20:40:09+08:00
draft: false
categories: ["技术"]
tags: ["Kubernetes", "Pod", "云原生"]
---

## Pod简述

### 为什么需要Pod？

现实中经常会有多个进程密切协作才能完成任务的应用，而仅使用容器很难描述这种关系。
设想一种场景，一些容器因为联系非常紧密需要放在一起，但是某个节点资源不够，放了几个之后宿主机没有资源了，那么怎么办。

所以就出现了 Pod，它打包一个或多个容器，保证里面的进程能够被整体调度，Pod是原子调度的。

> 容器不止Docker，Kubernetes支持多种容器运行时（Container Runtime），Docker只是比较有名的那个

### Pod的概念

![](https://cizixs-blog.oss-cn-beijing.aliyuncs.com/006y8lVagw1f93i3nzo9aj30yg0lptc6.jpg)

Pod的原义是豆荚。

Pod 是可以在 Kubernetes 中创建和管理的、最小的可部署的计算单元，是k8s调度的最小单位，同一个Pod里的容器会一起被调度。

Pod和应用是一一对应的，Pod是一组功能相关的容器的组合。比如主应用、数据库、日志等容器放在一个Pod中。

Pod类似于共享Namespace和共享Volumes的一组容器，Pod天生地为其成员容器提供了两种共享资源：网络和存储。

可以把Pod当做一个虚拟机，里面的容器看成是用户程序，凡是调度、网络、存储，以及安全相关的属性，基本上是 Pod 级别的。

### Pod里的容器如何一起调度？

Kubernetes通过一个中间容器（Infra容器），首先创建这个容器，Pod内的容器则通过加入Network namespace的方式Infra关联在一起，Pod内的容器可以通过localhost通信，网络资源完全共享

Pod的生命周期只跟Infra容器有关，跟内部的容器无关。

### 管理Pod的Workload资源

Pod可以通过`kind: Pod`的yaml进行创建，但是在大部分情况下，并不是直接创建Pod，而是通过Workload（工作负载）的方式进行创建的，比如Deployment、Job这种方式。

Pod分为只有单个容器的Pod，以及多个容器的Pod。

单个容器的Pod最常见，可以将Pod看成容器的包装器，让Kubernetes管理。

如果几个容器之间关系非常紧密耦合，且需要共享资源，可以在一个Pod中运行多个容器。一般是一个容器将共享Volume提供给公众，另一个容器通过sidecar的形式更新文件。如下图所示：

![](https://d33wubrfki0l68.cloudfront.net/aecab1f649bc640ebef1f05581bfcc91a48038c4/728d6/images/docs/pod.svg)

### Kubernetes以Pod为中心

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1652022395/pod-1.png)

比如数据库密码等Credential对象作为Secret放在etcd中，k8s会在指定的Pod启动时将secret的数据通过volume的形式挂载到容器里。


首先通过编排对象，比如Pod、Job、CronJob，来描述应用。
然后通过定义服务对象，比如Service、Secret、Deployment、Ingress等来负责具体的平台级功能。

过去的集群管理项目，都是把容器按照某种规则放在最佳节点上运行，称为调度

而k8s是按照用户意愿完全自动化地处理好各个容器的关系，这称为编排


## Pod生命周期

Pod起始于Pending，如果至少有一个容器已经启动，就进入到Running阶段，看容器的状态，如果有失败的，Pod就进入到Failed，全部成功就Succeeded


每个Pod都会分配唯一的UID，Pod在生命周期中只会被调度一次，是相对临时性存在的实体。不具有自愈能力，如果运行失败，也不会调度到不同的节点，而是可能会一个新的基本完全一样的Pod完全替代（比如用了Deployment），新的Pod是另一个UID。

![](https://jimmysong.io/kubernetes-handbook/images/kubernetes-pod-life-cycle.jpg)

### Pod的阶段

Pod包含以下阶段：

| Pod阶段 | 描述 |
|-|-|
| Pending | Pod被Kubernetes接受，但是容器尚未运行，可能是刚被调度或者容器镜像正在下载 |
| Running | Pod已经被调度到一个节点上，容器都下载完，且至少有一个容器在运行 |
| Succeeded | Pod的所有容器都成功终止，且不会重启 |
| Failed | Pod的所有容器都终止，但是至少有一个是失败终止 |
| Unknown | 因为一些原因无法获得Pod的状态 |
| CrashLoopBackoff | 通常是容器进程失败，比如最后一条运行指令执行失败，然后不停重启死循环几次后崩溃的状态 |

如果某个节点直接挂了，那么Kubernetes会将该节点上运行的所有Pod都设为Failed

### Pod 状况

Pod的Status中还有一个Condition数组，用来表示Pod的一些状况

| Pod状况 | 描述 |
|-|-|
| PodSchedule | Pod已经被调度到某节点 |
| PodHasNetwork | Pod被成功创建并且配置了网络 |
| ContainersReady | Pod 中所有容器都已就绪 |
| Initialized | 所有的 Init 容器 都已成功完成 |
| Ready | Pod 可以为请求提供服务，并且应该被添加到对应服务的负载均衡池中。|



### 容器的状态

类似Docker的状态，包括：

| 容器状态 | 描述 |
|-|-|
| Waiting | 不是Running和Terminated，就是Waiting，可能是在拉取镜像，后者应用数据等 |
| Running | 容器正在执行，没有问题发生 |
| Terminated | 容器终止，可能是正常执行完成，也可能是因为异常导致终止 |

## Pod操作

### 更新与替换

Pod 更新不可以改变除 `spec.containers[*].image`、`spec.initContainers[*].image`、 `spec.activeDeadlineSeconds` 或 `spec.tolerations` 之外的字段。 对于 `spec.tolerations`，只被允许添加新的条目到其中。



## Pod实例

### 两个容器的Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: two-containers
spec:
  restartPolicy: Never
  volumes:
  - name: shared-data
    hostPath:
      path: /data
  containers:
  - name: nginx-container
    image: nginx
    volumeMounts:
    - name: shared-data
      mountPath: /usr/share/nginx/html
  - name: debian-container
    image: debian
    volumeMounts:
    - name: shared-data
      mountPath: /pod-data
    command: ["/bin/sh"]
    args: ["-c", "echo Hello from the debian container > /pod-data/index.html"]
```

宿主机的/data文件夹会被挂载到两个容器中，debian-container容器的`/pod-data`挂载了这个文件夹，并通过命令往index.html里写入了一句话。nginx-container容器的`/usr/share/nginx/html`路径也挂载了，此时内部就会有index.html，

此时访问对应的ip，就可以发现打印出Hello from the debian container 。

不过这个Pod中，nginx-container是正常运行的，但是debian-container已经运行结束关闭了，因为只执行了一个命令就结束了，是有限的

```bash
$ kubectl get pod
NAME                        READY   STATUS      RESTARTS   AGE
two-containers              1/2     NotReady    0          3m31s
```

可以去dashboard里分别进入两个container查看（debian已经关闭了进不去），nginx进入之后发现对应路径的index.html被修改




## Pod的简单实战

比如创建并应用一个pod：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ngx-pod
  labels:
    env: demo
    owner: dafault
spec:
  containers:
  - image: nginx:alpine
    name: ngx
    ports:
    - containerPort: 80
```

```bash
kubectl create -f ngx-pod.yaml
```

查看pods

```bash
$ kubectl get pods
NAME      READY   STATUS    RESTARTS   AGE
ngx-pod   1/1     Running   0          6m21s
```

查看制定pod的状态：
```bash
$ kubectl describe pod ngx-pod
Name:             ngx-pod
Namespace:        default
Priority:         0
Service Account:  default
Node:             master/192.168.50.174
Start Time:       Sat, 24 Sep 2022 17:21:21 +0800
Labels:           env=demo
                  owner=default
...
Events:
  Type    Reason     Age    From               Message
  ----    ------     ----   ----               -------
  Normal  Scheduled  6m36s  default-scheduler  Successfully assigned default/ngx-pod to master
  Normal  Pulled     6m36s  kubelet            Container image "nginx:alpine" already present on machine
  Normal  Created    6m36s  kubelet            Created container ngx
  Normal  Started    6m35s  kubelet            Started container ngx
```

kubectl有类似docker的cp命令，可以将本地的文件复制到pod里：

```bash
$ kubectl cp a.txt ngx-pod:/tmp
```

进入pod内部：

```bash
kubectl exec -it ngx-pod -- sh
```

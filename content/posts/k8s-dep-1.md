---
title: "Kubernetes在线业务：Deployment & DeamonSet"
date: 2022-09-30T20:40:09+08:00
draft: false
categories: ["技术"]
tags: ["Kubernetes", "Deployment", "DeamonSet", "云原生"]
---

## Deployment的引入

### 为什么需要Deployment

Deployment可以管理在线业务，能够让应用永不宕机，是Kubernetes最实用最常用的一个对象。它实现了Kubernetes一个相当重要的功能：水平扩展/收缩。这个功能是编排系统的必备能力。

如果只用Pod，一些熟悉比如restartPolicy也可以管理异常重启，但是太过简单。而且它只能保证容器正常工作，如果从外部删除了这个容器，那么对容器的控制也无法操作。


除此之外，还有高可用、多实例等操作，所以还需要一个对象来管理在线业务的Pod。

### Replication Controller 和 ReplicaSet

Replication Controller（复制控制器，RC）和ReplicaSet（复制集，RS）是两种部署Pod的方式，但是在实际生产中往往用的都是更高级的Deployment，所以这里只做简要介绍。

RC主要用于规定Pod副本数的期望值，Pod出现失败、删除、终止时，RC会自动替换掉，即使只有一个Pod也应该声明RC。

一个Replication Controller的示例：

ReplicaSet在RC的基础上增加了标签选择器，是一个更高级的概念。

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: nginx-set
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9
```


## Deployment

相比于直接创建一个Pod，更好的方式就是用一个replicas=1的Deployment。这样即使节点故障了，Kubernetes还可以从健康的节点自动创建一个Pod。

实际上，Deployment是ReplicaSet的母集，Deployment控制的就是ReplicaSet对象，而不是Pod。Pod的个数通过ReplicaSet管理。




```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: ngx-dep
  name: ngx-dep

spec:
  replicas: 3
  selector:
    matchLabels:
      app: ngx-dep

  template:
    metadata:
      labels:
        app: ngx-dep
    spec:
      containers:
      - image: nginx:alpine
        name: nginx
        ports:
        - containerPort: 80
```

一个Deployment api，对应N个Pods，实际上Deployment就是更高级的ReplicaSet：

![](https://s2.loli.net/2022/12/07/d1aMRTEQhVIy7sP.png)

```bash
$ kubectl get rs                   
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-7759cfdc55   3         3         3       4m59s
```

可以看到Pods被自动调度了

```bash
$ kubectl get pods -o wide           
NAME                                READY   STATUS    RESTARTS   AGE     IP            NODE             NOMINATED NODE   READINESS GATES
nginx-deployment-7759cfdc55-66j5g   1/1     Running   0          5m46s   10.244.1.77   master           <none>           <none>
nginx-deployment-7759cfdc55-77wh5   1/1     Running   0          5m46s   10.244.1.78   master           <none>           <none>
nginx-deployment-7759cfdc55-snj68   1/1     Running   0          5m46s   10.244.0.27   engine-macmini   <none>           <none>
```

相比Job多了replicas、selector字段


### replicas

在Kubernetes集群中运行多少个Pod实例，这里的话k8s会创建两个Pod实例

并且Kubernetes会持续监视Pods，如果发现个数不一样，就会新建，会一直保持Pod个数跟配置文件的一样

### selector

selector的作用是选出要被Deployment管理的Pod对象，matchLabels里的label要跟下面Pod的label一样，比如这里都是ngx-dep

这里之所以要写两次一样的，是因为下面的Pod除了被Deployment调度，还可能被其他API对象管理，比如负载均衡的Service等。之前的Job是离线对象，Pod基本都是一次性的，所以一个Job绑一个Pod即可。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1664045855/k8s-dep-1.png)


```bash
$ kubectl get deploy
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3/3     3            3           18m
```

```bash
kubectl get pods
NAME                               READY   STATUS    RESTARTS   AGE
nginx-deployment-f4488db8f-5vkhr   1/1     Running   0          116s
nginx-deployment-f4488db8f-bl9xv   1/1     Running   0          97s
nginx-deployment-f4488db8f-tflhd   1/1     Running   0          2m14s
```

如果删掉第一个：
```bash
$ kubectl delete pod nginx-deployment-f4488db8f-5vkhr
pod "nginx-deployment-f4488db8f-5vkhr" deleted
```

Kubernetes会自动创建一个Pod

```bash
$ kubectl get pods
NAME                               READY   STATUS    RESTARTS   AGE
nginx-deployment-f4488db8f-bl9xv   1/1     Running   0          2m21s
nginx-deployment-f4488db8f-pq7rk   1/1     Running   0          14s
nginx-deployment-f4488db8f-tflhd   1/1     Running   0          2m58s
```

### scale水平扩展/收缩

还可以随时调整Pod的数量：

```bash
# 把ngx-dep调整到5个
$ kubectl scale --replicas=2 deploy nginx-deployment
deployment.apps/nginx-deployment scaled
```

不过更好的方式是修改yaml的配置再重新apply

### rollout滚动更新

如果对应用进行更新，比如更新image或者label，就会出发Deployment的滚动更新。

```bash
$ kubectl set image deployment nginx-deployment nginx=nginx:1.9.1

deployment.apps/nginx-deployment image updated
```

会重新起新版本的对应数量的pod

```bash
$ kubectl get rs                                                 
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-7759cfdc55   0         0         0       18m
nginx-deployment-f4488db8f    3         3         3       73s
```

看看Deployment的详细信息

```bash
$ kubectl describe deploy nginx-deployment                                           
Name:                   nginx-deployment
Namespace:              k8s-learning
CreationTimestamp:      Tue, 06 Dec 2022 02:05:01 +0800
Labels:                 app=nginx
Annotations:            deployment.kubernetes.io/revision: 2
                        kubernetes.io/change-cause: kubectl set image deployment nginx-deployment nginx=nginx:1.9.1 --record=true
Selector:               app=nginx
Replicas:               2 desired | 2 updated | 2 total | 2 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  25% max unavailable, 25% max surge
Pod Template:
  Labels:  app=nginx
  Containers:
   nginx:
    Image:        nginx:1.9.1
    Port:         80/TCP
    Host Port:    0/TCP
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Progressing    True    NewReplicaSetAvailable
  Available      True    MinimumReplicasAvailable
OldReplicaSets:  <none>
NewReplicaSet:   nginx-deployment-f4488db8f (2/2 replicas created)
Events:
  Type    Reason             Age    From                   Message
  ----    ------             ----   ----                   -------
  Normal  ScalingReplicaSet  21m    deployment-controller  Scaled up replica set nginx-deployment-7759cfdc55 to 3
  Normal  ScalingReplicaSet  5m     deployment-controller  Scaled up replica set nginx-deployment-f4488db8f to 1
  Normal  ScalingReplicaSet  4m42s  deployment-controller  Scaled down replica set nginx-deployment-7759cfdc55 to 2 from 3
  Normal  ScalingReplicaSet  4m42s  deployment-controller  Scaled up replica set nginx-deployment-f4488db8f to 2 from 1
  Normal  ScalingReplicaSet  4m23s  deployment-controller  Scaled down replica set nginx-deployment-7759cfdc55 to 1 from 2
  Normal  ScalingReplicaSet  4m23s  deployment-controller  Scaled up replica set nginx-deployment-f4488db8f to 3 from 2
  Normal  ScalingReplicaSet  4m22s  deployment-controller  Scaled down replica set nginx-deployment-7759cfdc55 to 0 from 1
  Normal  ScalingReplicaSet  86s    deployment-controller  Scaled down replica set nginx-deployment-f4488db8f to 2 from 3
```

### 删除Deployment

```bash
kubectl delete deployment <dep_name>
```

### 节点守护：DaemonSet

Deployment不会关心这些Pod在哪些节点上运行，只关心Pod的数量等。

然而一些应用跟节点是有关的，比如网络类应用、监控类应用、日志类应用、安全类应用，需要在每个节点都进行部署。

DaemonSet的目的是在集群的每个符合匹配要求的节点上都运行且仅运行一个Pod，就像看门狗一样。

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: redis-ds
  labels:
    app: redis-ds
spec:
  selector:
    matchLabels:
      name: redis-ds
  template:
    metadata:
      labels:
        name: redis-ds
    spec:
      containers:
      - image: redis:5-alpine
        name: redis
        ports:
        - containerPort: 6379
```

跟Deployment相比其实就少了replicas字段

```bash
$ kubectl get ds
NAME       DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
redis-ds   2         2         1       2            1           <none>          10s
```

```bash
$ kubectl get pod -o wide
NAME                        READY   STATUS      RESTARTS   AGE     IP                NODE             NOMINATED NODE   READINESS GATES
redis-ds-g57tq              1/1     Running     0          44s     192.168.219.115   master           <none>           <none>
redis-ds-kq5wn              1/1     Running     0          44s     192.168.244.76    engine-macmini   <none>           <none>
```

会自己查找集群的节点，然后部署


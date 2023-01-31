---
title: "Kubernetes有状态集：StatefulSet"
date: 2023-10-24T17:02:09+08:00
draft: false
categories: ["技术"]
tags: ["Kubernetes", "StatefulSet", "云原生"]
---

## 有状态集

前面提到了Deployment，但是Deployment有一个特点，就是它认为所有的Pod都相同，不存在顺序关系，无论在哪台宿主机运行，Deployment只需要维持数量跟预设保持一致即可。

但是这样并不适用于一些Pod有顺序依赖的场景，比如分布式应用的主从、主备关系，比如存储类应用在本地磁盘保存数据，不能简单的用Deployment管理，这样重建的话就会丢失实例与数据的对应关系。

StatefulSet是一个主要用于管理**有状态应用**的API 对象，这一点是之前的容器技术很难实现的。

常见的比如ElasticSearch集群、MongoDB集群，以及Redis集群、RabbitMQ集群、Kafka集群、ZooKeeper集群等。

与Deployment不同的是，StatefulSet为每个Pod提供了一个表示，比如建立三个MongoDB Pod，那么它们的名字就是MongoDB-1，MongoDB-2，MongoDB-3。

StatefulSet用于以下场景：
1. 需要稳定的独一无二的网络标识符
2. 需要持久化数据
3. 需要有序的部署、拓展和滚动更新

使用Headless Service负责Pod通信，需要先创建该服务。

StatefulSet将应用状态抽象为了两种情况：
1. 拓扑状态，多个实例之间不对等，必须按照某种顺序来启动，如果再次创建也必须按照规定的顺序。新的Pod的网络标识也会跟原来的一样
2. 存储状态，多个实例之间绑定了不同的存储数据，对于一个Pod而言即使被重新创建，也依然读到跟之前一样的同一份数据。非常适合部署存储实例。

在将StatefulSet之前，需要了解Kubernetes中的一个重要概念：Headless Service

### Headless Service

StatefulSet创建出的Pod使用Headless Service，采用Endpoint通信。

访问Service的方式有两种：通过Service的虚拟IP访问、通过Service的DNS访问。

第二种方式，只要访问 `<service_name>.<namespace>.svc.cluster.local`，就可以访问到`<namespace>`命名空间下名为`<service_name>`的一个service

### 实战

#### 实战1：nginx集群

先创建一些持久化卷PV：

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nginx-0
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  persistentVolumeReclaimPolicy: Recycle
  storageClassName: "nginx-storage-class"
  hostPath:
    path: /data/nas/web/nginx0
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nginx-1
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  persistentVolumeReclaimPolicy: Recycle
  storageClassName: "nginx-storage-class"
  hostPath:
    path: /data/nas/web/nginx1
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nginx-2
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  persistentVolumeReclaimPolicy: Recycle
  storageClassName: "nginx-storage-class"
  hostPath:
    path: /data/nas/web/nginx2
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nginx-3
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  volumeMode: Filesystem
  persistentVolumeReclaimPolicy: Recycle
  storageClassName: "nginx-storage-class"
  hostPath:
    path: /data/nas/web/nginx3
```

```yaml
# 创建Service
apiVersion: v1
kind: Service
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  ports:
  - port: 80
    name: web
  # clusterIp是None
  clusterIP: None
  selector:
    app: nginx
---
# 创建StatefulSet，两个
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
spec:
  serviceName: "nginx"
  replicas: 2
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
        ports:
        - containerPort: 80
          name: web
        volumeMounts:
        - name: www
          mountPath: /usr/share/nginx/html
  # PVC，绑定PV
  volumeClaimTemplates:
  - metadata:
      name: www
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "nginx-storage-class"
      resources:
        requests:
          storage: 1Gi
```

```bash
$ kubectl get pv 
NAME         CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM                    STORAGECLASS          REASON   AGE
pv-nginx-0   1Gi        RWO            Recycle          Available                            nginx-storage-class            7h45m
pv-nginx-1   1Gi        RWO            Recycle          Bound       k8s-learning/www-web-1   nginx-storage-class            7h45m
pv-nginx-2   1Gi        RWO            Recycle          Bound       k8s-learning/www-web-0   nginx-storage-class            7h45m
$ kubectl get pvc
NAME        STATUS   VOLUME       CAPACITY   ACCESS MODES   STORAGECLASS          AGE
www-web-0   Bound    pv-nginx-2   1Gi        RWO            nginx-storage-class   42s
www-web-1   Bound    pv-nginx-1   1Gi        RWO            nginx-storage-class   47s
$ kubectl get svc                 
NAME    TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
nginx   ClusterIP   None         <none>        80/TCP    7h40m
$ kubectl get sts
NAME   READY   AGE
web    2/2     7h40m
```
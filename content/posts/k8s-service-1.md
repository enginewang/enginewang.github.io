---
title: "Kubernetes微服务：Service"
date: 2022-10-31T23:13:09+08:00
draft: false
categories: ["技术"]
tags: ["Kubernetes", "Service", "云原生"]
---

## Kubernetes微服务：Service

Service是集群内部的负载均衡机制，

Pod处于一种动态稳定的过程中，但是客户端等需要稳定的后端服务。负载均衡机制在二者之间加入了中间层，屏蔽了后端的变化。带来稳定的服务。


Kubernetes会给Service提供一个静态的IP，然后管理动态的Pods，客户端访问时会根据某种策略发送给某个Pod处理。


![](https://d33wubrfki0l68.cloudfront.net/27b2978647a8d7bdc2a96b213f0c0d3242ef9ce0/e8c9b/images/docs/services-iptables-overview.svg)

使用了iptables，每个节点的kube-proxy维护iptables，Services提供固定的IP

Service的地位跟Pod等同，跟Job、Deployment不同，不关联业务应用

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ngx-svc

spec:
  selector:
    app: ngx-dep

  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
```

selector用来过滤Pod，比如这里我们要代理ngx-dep这个Deployment的Pod

ports下面分别是外部端口、内部端口和协议

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1664051086/k8s-service-1.png)

下面的实例来测试service

首先创建一个nginx的ConfigMap，它会输出一些信息

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ngx-conf
data:
  default.conf: |
    server {
      listen 80;
      location / {
        default_type text/plain;
        return 200
          'srv : $server_addr:$server_port\nhost: $hostname\nuri : $request_method $host $request_uri\ndate: $time_iso8601\n';
      }
    }
```

建立一个Deployment，把刚刚创建的ConfigMap定义在spec.template.spec.volumes里，然后用volumeMounts加载进去

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ngx-dep
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ngx-dep
  template:
    metadata:
      labels:
        app: ngx-dep
    spec:
      volumes:
      - name: ngx-conf-vol
        configMap:
          name: ngx-conf
      containers:
      - image: nginx:alpine
        name: nginx
        ports:
        - containerPort: 80
        volumeMounts:
        - mountPath: /etc/nginx/conf.d
          name: ngx-conf-vol
```

然后创建Service并apply：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ngx-svc

spec:
  selector:
    app: ngx-dep

  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
    protocol: TCP
```

查看service，发现被分配了一个静态IP

```bash
$ kubectl get svc
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP   5d22h
ngx-svc      ClusterIP   10.98.150.99   <none>        80/TCP    15s
```

```bash
$ kubectl describe svc ngx-svc
Name:              ngx-svc
Namespace:         default
Labels:            <none>
Annotations:       <none>
Selector:          app=ngx-dep
Type:              ClusterIP
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                10.98.150.99
IPs:               10.98.150.99
Port:              <unset>  80/TCP
TargetPort:        80/TCP
Endpoints:         192.168.219.99:80,192.168.244.77:80
Session Affinity:  None
Events:            <none>
```

EndPoints代理的两个IP就是两个Node上对应Pod的IP

```bash
$ kubectl get pod -o wide
NAME                        READY   STATUS      RESTARTS   AGE     IP                NODE             NOMINATED NODE   READINESS GATES
ngx-dep-545884c69c-9j8wt    1/1     Running     0          4m25s   192.168.244.77    engine-macmini   <none>           <none>
ngx-dep-545884c69c-fjmgn    1/1     Running     0          4m26s   192.168.219.99    master           <none>           <none>
```

### NodePort


如果在service配置中修改为NodePort：

```yaml
...
spec:
  ...
  type: NodePort
```

```bash
$ kubectl get svc
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP        5d22h
ngx-svc      NodePort    10.98.150.99   <none>        80:32349/TCP   6m58s
```

发现对外映射到了端口32349上，此时本机访问`localhost:32349`就能看到之前nginx的页面

```json
srv : 192.168.219.99:80
host: ngx-dep-545884c69c-fjmgn
uri : GET 192.168.50.175 /
date: 2022-09-24T21:13:56+00:00
```

此时如果删掉这个ip对应的Pod：

```
kubectl delete pod ngx-dep-545884c69c-fjmgn
```

```bash
$ kubectl get pod -o wide
NAME                        READY   STATUS      RESTARTS   AGE     IP                NODE             NOMINATED NODE   READINESS GATES
ngx-dep-545884c69c-9j8wt    1/1     Running     0          12m     192.168.244.77    engine-macmini   <none>           <none>
ngx-dep-545884c69c-z57h7    1/1     Running     0          11s     192.168.219.113   master           <none>           <none>
```

此时Deployment会创建出一个新的Pod，分配的IP是192.168.219.113

再刷新nginx，就是：

```json
srv : 192.168.219.113:80
host: ngx-dep-545884c69c-z57h7
uri : GET 192.168.50.175 /
date: 2022-09-24T21:16:17+00:00
```

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1664054313/k8s-service-2.png)

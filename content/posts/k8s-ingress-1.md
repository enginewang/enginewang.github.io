---
title: "Kubernetes集群进出流量管理：Ingress"
date: 2023-11-08T23:13:09+08:00
draft: false
categories: ["技术"]
tags: ["Kubernetes", "Ingress", "云原生"]
---

## Ingress


Service里现代架构还有很大差距，Ingress是在Service之上的概念，更接近实际的业务。

Service只能在四层TCP/IP协议栈转发，只有IP端口等，但是实际应用更多的是跑在七层的HTTP/HTTPS协议上，还有更多的概念比如主机名、请求头、证书等，TCP/IP协议栈无法看到这些。

Service比较方便代理内部的服务，外部只能通过NodePort之类的方式，非常不灵活。

Service 是四层负载均衡，能力有限，所以就出现了 Ingress，它基于 HTTP/HTTPS 协议定义路由规则。


Ingress 只是规则的集合，自身不具备流量管理能力，需要 Ingress Controller 应用 Ingress 规则才能真正发挥作用。

Ingress：集群内外的流量出入口

之前说的Service也只是有一些iptables规则而本身没有服务能力，真正应用这些规则服务的是kube-proxy

Ingress只是HTTP路由规则的集合，只是静态的描述文件，实际处理这些的是 Ingress Controller，目前使用最广泛的还是nginx。


![](https://www.nginx.com/wp-content/uploads/2021/04/dia-MH-2021-04-06-NIC-for-KIC-03-no-legend-padding-LP-1400x515-1.svg)

如果都交给一个Controller处理又会太复杂，Kubernetes提出了Ingress Class，介于Ingress和Ingress Controller之间，解除二者的强绑定关系。Ingress Class 解耦了 Ingress 和 Ingress Controller，我们应当使用 Ingress Class 来管理 Ingress 资源。

可以通过Ingress Class对Ingress定义不同的逻辑分组。比如不同业务的流量用不同的来处理

创建一个Ingress Class：
```yaml
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: ngx-ink
spec:
  controller: nginx.org/ingress-controller
```

`nginx.org/ingress-controller` 指的是Nginx 开发的 Ingress Controller

可以通过create自动生成：
```bash
$ kubectl create ing ngx-ing --rule="ngx.test/=ngx-svc:80" \
--class=ngx-ink --dry-run=client -o yaml
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  creationTimestamp: null
  name: ngx-ing
spec:
  # 绑定ingress Class
  ingressClassName: ngx-ink
  rules:
  # 在/，
  - host: ngx.test
    http:
      paths:
      - backend:
          service:
            name: ngx-svc
            port:
              number: 80
        path: /
        pathType: Exact
status:
  loadBalancer: {}
```

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1664087874/k8s-ingress-1.jpg)

```bash
$ kubectl get ingressclass
NAME      CONTROLLER                     PARAMETERS   AGE
ngx-ink   nginx.org/ingress-controller   <none>       2m22s
$ kubectl get ing
NAME      CLASS     HOSTS      ADDRESS   PORTS   AGE
ngx-ing   ngx-ink   ngx.test             80      4s
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ngx-kic-dep
  namespace: nginx-ingress

spec:
  replicas: 1
  selector:
    matchLabels:
      app: ngx-kic-dep

  template:
    metadata:
      labels:
        app: ngx-kic-dep
     #annotations:
       #prometheus.io/scrape: "true"
       #prometheus.io/port: "9113"
       #prometheus.io/scheme: http
    spec:
      serviceAccountName: nginx-ingress
      containers:
      #- image: nginx/nginx-ingress:2.2.0
      - image: nginx/nginx-ingress:2.2-alpine
        imagePullPolicy: IfNotPresent
        name: nginx-ingress
        ports:
        - name: http
          containerPort: 80
        - name: https
          containerPort: 443
        - name: readiness-port
          containerPort: 8081
        - name: prometheus
          containerPort: 9113
        readinessProbe:
          httpGet:
            path: /nginx-ready
            port: readiness-port
          periodSeconds: 1
        securityContext:
          allowPrivilegeEscalation: true
          runAsUser: 101 #nginx
          capabilities:
            drop:
            - ALL
            add:
            - NET_BIND_SERVICE
        env:
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        args:
          - -ingress-class=ngx-ink
          - -health-status
          - -ready-status
          - -nginx-status

          - -nginx-configmaps=$(POD_NAMESPACE)/nginx-config
          - -default-server-tls-secret=$(POD_NAMESPACE)/default-server-secret
         #- -v=3 # Enables extensive logging. Useful for troubleshooting.
         #- -report-ingress-status
         #- -external-service=nginx-ingress
         #- -enable-prometheus-metrics
         #- -global-configuration=$(POD_NAMESPACE)/nginx-configuration
```

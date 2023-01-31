---
title: "Kubernetes配置管理：ConfigMap & Secret"
date: 2022-11-03T20:40:09+08:00
draft: false
categories: ["技术"]
tags: ["Kubernetes", "ConfigMap", "Secret", "云原生"]
---

## Projected Volume

Kubernetes中有一些特殊的Volume，其作用是为容器提供预先定义好的数据，就像被投射（Project）到容器中一样。这种Volume被称为Projected Volume。

Projected Volume共有四种：
- Secret
- ConfigMap
- Downward API
- ServiceAccountToken


配置分为两种：明文配置（可以公开的，比如端口、运行参数等）和机密配置（比如密码），ConfigMap用于管理明文配置，Secret用于管理机密配置

另一方面，各个程序的配置文件，比如数据库的配置、nginx的配置等，将配置单独集体放在一边一起配置会非常方便。

## ConfigMap


ConfigMap是一种用来将非机密性的数据保存到键值对中的API对象。可以将环境配置信息与容器镜像解耦。


```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: info
data:
  count: '10'
  debug: 'on'
  path: '/etc/systemd'
  greeting: |
    say hello to kubernetes.
```

ConfigMap的数据会存到k8s的etcd数据库

```bash
$ kubectl get cm
$ kubectl describe cm info
```

## Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: user
data:
  name: cm9vdA==  # root
  pwd: MTIzNDU2   # 123456
  db: bXlzcWw=    # mysql
```


```bash
$ kubectl apply  -f secret.yaml
secret/user created
$ kubectl get secret
NAME   TYPE     DATA   AGE
user   Opaque   3      7s
$ kubectl describe secret user
Name:         user
Namespace:    default
Labels:       <none>
Annotations:  <none>

Type:  Opaque

Data
====
name:  4 bytes
pwd:   6 bytes
db:    5 bytes
```

看不到具体的数据了。
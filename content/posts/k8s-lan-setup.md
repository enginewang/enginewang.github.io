---
title: "通过kubeadmin搭建局域网Kubernetes集群"
date: 2022-09-09T14:33:59+08:00
draft: false
categories: ["技术"]
tags: ["Kubernetes", "分布式", "Docker", "Linux"]
---

[toc]

因为在学习k8s，但是要搭建集群的话最少也要两台机子（虚拟机也可以但是不太喜欢虚拟机），然而去云服务商租的话又太贵了，因为至少需要两核，便宜的机子基本都是1核的，所以就使用了本地局域网下的两台主机进行k8s搭建。

### 准备硬件环境

k8s搭建的一些难点：
- 需要多台服务器，贵
- 搭建时需要科学上网
- 搭建比较复杂，学习起来也比较复杂

这里不想使用虚拟机的方式，计划采用局域网通过kubeadm搭建。本地有两台主机，一台主力台式机作为master。一台之前闲鱼捡的丐版mac mini 2012作为slave，之前内存只有4G（2+2），拆机升级到了10G（2+8），好在这个cpu有两个核心，能搭k8s，电子垃圾再利用。

| | 角色 | OS |  MEM |  CPU | 核心数 | IP |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| 台式工作站 | Master |  Ubuntu 18.04 | 32G | i7-10700 | 8 | 192.168.50.174 |
|Mac mini 2012 |  Slave | Ubuntu 18.04 | 10G | i5-3210M | 2 | 192.168.50.175 |


后面的操作都是以普通用户来操作，不直接用root因为不安全。

首先关闭swap

```bash
# 关闭swap
$ swapoff -a
# 检查swap是否被成功关掉了
$ free -m
```

### 安装Docker


```bash
# (Install Docker CE)
## Set up the repository:
### Install packages to allow apt to use a repository over HTTPS
$ sudo apt-get update && apt-get install -y \
  apt-transport-https ca-certificates curl software-properties-common gnupg2

# Add Docker’s official GPG key:
$ sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg |  \
sudo apt-key add -

# Add the Docker apt repository:
$ sudo add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) \
  stable"

# Install Docker CE
$ sudo apt-get update && sudo apt-get install -y \
    containerd.io=1.2.13-1 \
    docker-ce=5:19.03.8~3-0~ubuntu-$(lsb_release -cs) \
    docker-ce-cli=5:19.03.8~3-0~ubuntu-$(lsb_release -cs)


$ sudo vim /etc/docker/daemon.json
# 写入以下内容到该文件中
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
  "max-size": "100m"
  },
  "storage-driver": "overlay2"
}

sudo mkdir -p /etc/systemd/system/docker.service.d

# Restart Docker
$ systemctl daemon-reload
$ systemctl restart docker
```

### 安装Kubernetes

```bash
# Update the apt package index and install packages needed to use the Kubernetes apt repository:
$ sudo apt-get update
$ sudo apt-get install -y apt-transport-https ca-certificates curl
# Install kubeadm
$ sudo curl -s https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | sudo apt-key add -
# Add the Kubernetes apt repository
$ sudo tee /etc/apt/sources.list.d/kubernetes.list <<-'EOF'
deb https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial main
EOF
# Update apt package index, install kubelet, kubeadm and kubectl
$ sudo apt-get update
$ sudo apt-get install -y kubelet kubeadm kubectl
$ sudo apt-mark hold kubelet kubeadm kubectl
```

最关键的一步，通过`kubeadm init`进行初始化，ip根据实际情况进行修改。

```bash
$ sudo kubeadm init --apiserver-advertise-address=192.168.50.174  --pod-network-cidr=192.168.0.0/16
[init] Using Kubernetes version: v1.25.0
[preflight] Running pre-flight checks
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
...

Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.50.174:6443 --token jt7fap.t4gcisog9zc1lqqm \
	--discovery-token-ca-cert-hash sha256:49f1867877de69c1c1145fb026221b64824ed4ce993496aaeb73b1446d2b2ebc
```


复制kubeconfig
```bash
$ mkdir -p $HOME/.kube
$ sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
$ sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

> 如果要重新init，需要先停止服务，还要删除`$HOME/.kube`文件夹，否则就会报错端口被占用等。
```bash
# 需要sudo
sudo kubeadm reset
sudo rm -rf $HOME/.kube
```

### 安装网络通信插件

很多插件都可以，这里采用Calico

官网如下：
https://projectcalico.docs.tigera.io/getting-started/kubernetes/quickstart

安装calico，用于网络通信

```bash
$ kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.24.1/manifests/tigera-operator.yaml
$ kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.24.1/manifests/custom-resources.yaml
```

```bash
$ watch kubectl get pods -n calico-system
```

等待，直到里面的服务都是running状态。

设置traint污点容忍度，让master也可以被分配Pod

```bash
kubectl taint nodes --all node-role.kubernetes.io/control-plane-
kubectl taint nodes --all node-role.kubernetes.io/master-
```

查看当前的Nodes，只有master一个Node。

```bash
$ kubectl get nodes -o wide
NAME     STATUS   ROLES           AGE     VERSION   INTERNAL-IP      EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION      CONTAINER-RUNTIME
master   Ready    control-plane   3m58s   v1.25.0   192.168.50.174   <none>        Ubuntu 20.04.5 LTS   5.15.0-46-generic   containerd://1.6.8
```

### slave节点加入

在slave节点上通过`kubeadm join`加入到集群中：

```bash
$ kubeadm join 192.168.50.174:6443 --token jt7fap.t4gcisog9zc1lqqm \
	--discovery-token-ca-cert-hash sha256:49f1867877de69c1c1145fb026221b64824ed4ce993496aaeb73b1446d2b2ebc
[preflight] Running pre-flight checks
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...

This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```

在master node上查看集群中的节点，输出这些代表集群建立完成：

```bash
# 查看已加入的节点
$ kubectl get nodes -o wide
NAME             STATUS   ROLES           AGE    VERSION   INTERNAL-IP      EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION      CONTAINER-RUNTIME
master           Ready    control-plane   13m    v1.25.0   192.168.50.174   <none>        Ubuntu 20.04.5 LTS   5.15.0-46-generic   containerd://1.6.8
engine-macmini   Ready    <none>          116s   v1.25.0   192.168.50.175   <none>        Ubuntu 18.04.6 LTS   5.4.0-125-generic   containerd://1.2.13
# 查看集群状态
$ kubectl get cs
Warning: v1 ComponentStatus is deprecated in v1.19+
NAME                 STATUS    MESSAGE                         ERROR
scheduler            Healthy   ok
controller-manager   Healthy   ok
etcd-0               Healthy   {"health":"true","reason":""}
```

```bash
$ kubectl get pods --all-namespaces
NAMESPACE          NAME                                       READY   STATUS    RESTARTS   AGE
calico-apiserver   calico-apiserver-85bf56d655-5qt6d          1/1     Running   0          10m
calico-apiserver   calico-apiserver-85bf56d655-f2955          1/1     Running   0          10m
calico-system      calico-kube-controllers-85666c5b94-5nmc5   1/1     Running   0          12m
calico-system      calico-node-95tsf                          1/1     Running   0          12m
calico-system      calico-node-rhv4c                          1/1     Running   0          5m50s
calico-system      calico-typha-5b8759fbc6-jjfnb              1/1     Running   0          12m
calico-system      csi-node-driver-tmq7g                      2/2     Running   0          11m
calico-system      csi-node-driver-vpj2z                      2/2     Running   0          4m49s
kube-system        coredns-c676cc86f-gd22x                    1/1     Running   0          36m
kube-system        coredns-c676cc86f-scm5t                    1/1     Running   0          36m
kube-system        etcd-engine-macmini                        1/1     Running   0          36m
kube-system        kube-apiserver-engine-macmini              1/1     Running   0          36m
kube-system        kube-controller-manager-engine-macmini     1/1     Running   0          36m
kube-system        kube-proxy-hvtv5                           1/1     Running   0          5m50s
kube-system        kube-proxy-nn2lk                           1/1     Running   0          36m
kube-system        kube-scheduler-engine-macmini              1/1     Running   0          36m
tigera-operator    tigera-operator-6675dc47f4-j9prh           1/1     Running   0          13m
```

### k8s dashboard

通过k8s dashboard，可以更好的可视化观察k8s的各项运行情况。

官方文档：
https://kubernetes.io/zh-cn/docs/tasks/access-application-cluster/web-ui-dashboard/

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.5.0/aio/deploy/recommended.yaml
```

#### 创建用户

官方说明：
https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/creating-sample-user.md

```bash
$ vim dashboard-adminuser.yaml
# 写入以下内容
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
```

```bash
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
```

并apply

生成用户token，用于之后的dashboard登录
```bash
kubectl -n kubernetes-dashboard create token admin-user
# 会输出一长串token，复制登录即可
```

![](https://github.com/kubernetes/dashboard/raw/master/docs/images/signin.png)

> 如果要删除用户
```bash
kubectl -n kubernetes-dashboard delete serviceaccount admin-user
kubectl -n kubernetes-dashboard delete clusterrolebinding admin-user
```


```bash
# 开启proxy，设置address使得非本机也可以访问
$ kubectl proxy --address='0.0.0.0' --port=8001 --accept-hosts='.*' &
$ kubectl port-forward -n kubernetes-dashboard --address 0.0.0.0 service/kubernetes-dashboard 8080:443 &
```

本机访问（只能http）
http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

局域网其他机器访问：（只能https）
https://<master_ip>:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

之前的token复制进去即可登录

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1663857908/k8s-dashboard-1.png)


#### 延长token过期时间

dashboard的token默认15分钟就会过期，不太方便，可以修改从而延长过期时间。

取Deployment找到kubernetes-dashboard，进行修改：

```YAML
spec:
  ...
  containers:
    - name: kubernetes-dashboard
    image: kubernetesui/dashboard:v2.6.1
    args:
    ...
      - '--token-ttl=43200'
```

这样就将token延长到了43200秒，也就是12小时


### 一些报错

> The connection to the server 192.168.50.175:6443 was refused - did you specify the right host or port?

master节点重启，可能会报这个错，重新关闭swap

```bash
$ sudo swapoff -a
$ strace -eopenat kubectl version
```

> [ERROR CRI]: container runtime is not running: output: E0812

可以通过重启containered解决：

```bash
$ sudo rm -rf /etc/containerd/config.toml
$ systemctl restart containerd
```

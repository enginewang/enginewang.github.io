---
title: "通过kubeadm搭建Kubernetes集群"
date: 2022-09-09T14:33:59+08:00
draft: false
categories: ["技术"]
tags: ["Kubernetes", "分布式", "Docker", "Linux"]
---


#### 准备多台Linux服务器

k8s搭建的一些难点：
- 需要多台服务器，贵
- 搭建时需要科学上网
- 搭建比较复杂，学习起来也比较复杂

后面的操作都是以普通用户来操作，不直接用root因为不安全。

首先关闭swap

```bash
# 关闭swap
$ swapoff -a
# 检查swap是否被成功关掉了
$ free -m
```

#### 安装 Docker


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

#### 安装 kuberadm kubelet kubectl

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

#### 创建master节点

这是最关键的一步

```bash
$ sudo kubeadm init --apiserver-advertise-address=<内网ip>  --pod-network-cidr=10.244.0.0/16
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

kubeadm join ... --token ...	--discovery-token-ca-cert-hash ...
```


如果要重新init，需要先停止服务，否则就会报错端口被占用，还要删除`$HOME/.kube`文件夹
```bash
# 需要sudo
sudo kubeadm reset
sudo rm -rf $HOME/.kube
sudo rm -rf /var/lib/etcd
```

复制kubeconfig
```bash
$ mkdir -p $HOME/.kube
$ sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
$ sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

#### 安装网络通信插件

##### Calico

很多插件都可以，如果是Calico的话

https://projectcalico.docs.tigera.io/getting-started/kubernetes/quickstart

安装calico，用于网络通信

```bash
$ kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.24.1/manifests/tigera-operator.yaml
$ kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.24.1/manifests/custom-resources.yaml
```

```bash
$ watch kubectl get pods -n calico-system
```

等待，直到里面的服务都是running状态，

```bash
kubectl taint nodes --all node-role.kubernetes.io/control-plane-
kubectl taint nodes --all node-role.kubernetes.io/master-
```

##### Flannel

一开始创建的时候声明为`10.244.0.0/16`

```
wget https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

# 安装flannel
kubectl create -f kube-flannel.yml
```

```bash
$ kubectl get nodes -o wide
NAME     STATUS   ROLES           AGE     VERSION   INTERNAL-IP      EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION      CONTAINER-RUNTIME
master   Ready    control-plane   3m58s   v1.25.0   192.168.50.174   <none>        Ubuntu 20.04.5 LTS   5.15.0-46-generic   containerd://1.6.8
```

#### slave节点加入

```bash
$ kubeadm join 192.168.50.174:6443 --token m3pfuj.hh92oketgjdhcuzq \
	--discovery-token-ca-cert-hash sha256:f7235824fa136c3ef5dcc879ec4a326906166e38b1490f630e994e2e562baa0d
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

主节点
```bash
# 查看已加入的节点
$ kubectl get nodes -o wide
NAME             STATUS   ROLES           AGE    VERSION   INTERNAL-IP      EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION      CONTAINER-RUNTIME
engine-macmini   Ready    control-plane   116s   v1.25.0   192.168.50.175   <none>        Ubuntu 18.04.6 LTS   5.4.0-125-generic   containerd://1.2.13
master           Ready    <none>          13m    v1.25.0   192.168.50.174   <none>        Ubuntu 20.04.5 LTS   5.15.0-46-generic   containerd://1.6.8
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

#### k8s dashboard配置

https://kubernetes.io/zh-cn/docs/tasks/access-application-cluster/web-ui-dashboard/

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.5.0/aio/deploy/recommended.yaml
```

##### 创建用户

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
kubectl apply -f dashboard-adminuser.yaml
```

还有一种是：

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

```bash
kubectl -n kubernetes-dashboard create token admin-user
# 会输出一长串token，复制登录即可
```

![](https://github.com/kubernetes/dashboard/raw/master/docs/images/signin.png)

如果要删除用户：
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


##### 延长token过期时间

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


#### 报错

> The connection to the server 192.168.50.175:6443 was refused - did you specify the right host or port?

master节点重启，可能会报这个错。

```bash
$ sudo swapoff -a
$ strace -eopenat kubectl version
```

>  [ERROR CRI]: container runtime is not running: output: E0812

```bash
$ sudo rm -rf /etc/containerd/config.toml
$ systemctl restart containerd
```

> coredns一直pending，无法调度

```bash
kube-system    coredns-565d847f94-99kh9         0/1     Pending   0          4m55s
kube-system    coredns-565d847f94-rhmr4         0/1     Pending   0          4m55s
```

检查对应的pod：

```bash
$ kubectl describe pods -n kube-system coredns-565d847f94-99kh9
...
Warning  FailedScheduling  3m9s (x2 over 8m26s)  default-scheduler  0/1 nodes are available: 1 node(s) had untolerated taint {node.kubernetes.io/disk-pressure: }. preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.
```

看到这里是遇到了`node.kubernetes.io/disk-pressure`，主机磁盘空间不足，进行空间清理

我们可以查看这个node：

```bash
$ kubectl describe nodes <node>

```


> calico 的ready是0/1

```bash
kubectl describe pods -n calico-system calico-node-6cg6d
...
calico/node is not ready: BIRD is not ready: 
BGP not established with 172.20.0.1
```


不适用calico，改用Falnnel报错：

```bash
plugin type="calico" failed (add): error getting ClusterInformation...
```

原因：calico没卸载干净，

参考 https://qiaolb.github.io/remove-calico.html


```bash
$ ip a
```

网卡相关的错误，很多可以通过卸载网卡来解决，卸载掉比如br开头的，以及calico、flannel相关的网卡

```bash
ifconfig flannel.1 down
ip link delete flannel.1
su
rm -rf /var/lib/cni/
rm -rf /etc/cni/net.d/*
```
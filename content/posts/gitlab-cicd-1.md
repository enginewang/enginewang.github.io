---
title: "私有Gitlab部署和CI/CD搭建"
date: 2023-04-10T13:37:20+08:00
draft: false
categories: ["实战"]
tags: ["CI/CD", "Gitlab", "Linux"]
---

我搭建好的gitlab地址为[https://gitlab.engine.wang](https://gitlab.engine.wang)，欢迎访问。可自行注册。

## 搭建gitlab服务器

Gitlab是一个类似于Github的代码托管软件，搭建一个私有的git服务器，类似于游戏中的私服，可以供内部使用，并且用国内服务器的话，网络也比较好。

买一台云服务器，配置不低于2核4G，否则跑不动Gitlab。

Gitlab有很多搭建方法，Docker、Docker-compose、k8s都比较好，我这里用的是docker-compose，下面是详细的搭建过程。


### 云服务器初始化

进入云服务器，在/srv/gitlab下新建config,data,logs三个文件夹

```bash
$ cd /srv/gitlab
$ sudo mkdir data logs config
```

在`~/.zshrc`添加`GITLAB_HOME`并source

```bash
export GITLAB_HOME="/srv/gitlab"
```

改一下sshd的默认端口：

`/etc/ssh/sshd_config`
注意是sshd_config，不是ssh_config

把Port取消注释并修改成其他端口，然后重启sshd服务，重启服务器，重新用新端口连接：

```bash
sudo service ssh restart
```

### 配置SSL证书

首先去提交一个证书申请，普通用户总共能申请20个免费的域名证书（二级域名分开算），但也足够了

![](https://s2.loli.net/2022/11/26/iEdQB9PKqsU7gYh.png)

等待审核完成，下载证书，选择nginx

![](https://s2.loli.net/2022/11/26/rq42VEoAHzPDiu8.png)

将crt、key两个后缀的文件复制到/srv/gitlab/config/ssl和/root/.cert下面

写`docker-compose.yml`文件，下面是我调试很久的版本

做了smtp邮件配置、nginx的https ssl配置、性能调节防止内存消耗过高等。

这台服务器只架设 Gitlab Server 和 Gitlab Runner，所以80和443都直接映射

```yaml
version: '3.6'
services:
  web:
    image: 'gitlab/gitlab-ce:latest'
    hostname: 'gitlab.engine.wang'
    container_name: "gitlab"
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        # /srv/gitlab/config/gitlab.rb
        external_url 'https://gitlab.engine.wang'
        gitlab_rails['time_zone'] = 'Asia/Shanghai'
        gitlab_rails['backup_keep_time'] = 259200
        gitlab_rails['gitlab_shell_ssh_port'] = 22
        gitlab_rails['smtp_pool'] = true
        gitlab_rails['smtp_enable'] = true
        gitlab_rails['smtp_address'] = "smtp.qq.com"
        gitlab_rails['smtp_port'] = 465
        gitlab_rails['smtp_user_name'] = "engine.wang@qq.com"
        gitlab_rails['smtp_password'] = "xxx"
        gitlab_rails['smtp_domain'] = "smtp.qq.com"
        gitlab_rails['smtp_authentication'] = "login"
        gitlab_rails['smtp_enable_starttls_auto'] = true
        gitlab_rails['smtp_tls'] = true
        gitlab_rails['gitlab_email_from'] = 'engine.wang@qq.com'
        user["git_user_email"] = "engine.wang@qq.com"
        nginx['client_max_body_size'] = '10240m'
        nginx['redirect_http_to_https'] = true
        nginx['ssl_certificate'] = "/etc/gitlab/ssl/gitlab.engine.wang.crt"
        nginx['ssl_certificate_key'] = "/etc/gitlab/ssl/gitlab.engine.wang.key"
        nginx['ssl_ciphers'] = "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256"
        nginx['ssl_prefer_server_ciphers'] = "on"
        nginx['ssl_protocols'] = "TLSv1.1 TLSv1.2"
        nginx['ssl_session_cache'] = "builtin:1000  shared:SSL:10m"
        nginx['listen_addresses'] = ["0.0.0.0"]
        nginx['http2_enabled'] = true
        postgresql['max_worker_processes'] = 8
        postgresql['shared_buffers'] = "256MB"
        puma['worker_processes'] = 0
        sidekiq['max_concurrency'] = 5
        alertmanager['admin_email'] = 'engine74396@gmail.com'
    ports:
      - '80:80'
      - '443:443'
      - '22:22'
    volumes:
      - '$GITLAB_HOME/config:/etc/gitlab'
      - '$GITLAB_HOME/logs:/var/log/gitlab'
      - '$GITLAB_HOME/data:/var/opt/gitlab'
    restart: always
    user: root
```


```bash
# 后台启动
$ docker-compose up -d
# 查看实时日志
$ docker logs -ft gitlab
# 查看初始密码
$ docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

测试邮件服务，这里用的是qq，其他的很多邮箱都可以。

```bash
$ docker exec -it gitlab bash
$ root@engine:/# gitlab-rails console

Notify.test_email('engine74396@gmail.com', 'Message Subject', 'Message Body').deliver_now
```

### 配置swap


4G不够，通过swap加点虚拟内存，这里加2G

```bash
# 当前没有开启swap
$ free -m
              total        used        free      shared  buff/cache   available
Mem:          3.3Gi       212Mi       2.2Gi       2.0Mi       996Mi       2.9Gi
Swap:            0B          0B          0B

# 创建swap文件，这里给了2G虚拟内存
$ sudo dd if=/dev/zero of=/swapfile count=2048 bs=1M
2048+0 records in
2048+0 records out
2147483648 bytes (2.1 GB, 2.0 GiB) copied, 10.2516 s, 209 MB/s
# 查看swap文件，存在
$ ls / | grep swapfile
swapfile

$ sudo chmod 600 /swapfile

# 开启swap
$ sudo mkswap /swapfile
Setting up swapspace version 1, size = 2 GiB (2147479552 bytes)
no label, UUID=0bba6fce-e4a1-4cdf-8288-6770e4dd4266
$ sudo swapon /swapfile
$ free -m
              total        used        free      shared  buff/cache   available
Mem:           3419         234         105           2        3079        2909
Swap:          2047           0        2047
```

```bash
$ sudo vim /etc/fstab
# 最后一行加入：
# /swapfile none swap sw 0 0
```

可以看到内存降了一些，服务器不会很卡了

![](https://s2.loli.net/2022/11/28/TgqO5jHit6Ac2v9.png)

浏览器打开：`https://gitlab.engine.wang`，就可以访问到gitlab：

![](https://s2.loli.net/2022/11/28/lmbC9KkuJ5oqF6S.png)

### 后续工作

修改root账户的密码

![](https://s2.loli.net/2022/11/28/wqsKuMnyTDzFxfR.png)


改一下邮箱，默认是admin@example.com，无法发送通知
![](https://s2.loli.net/2022/11/28/WkAHCgIQqYwPzib.png)

直接去容器里改数据库：

```bash
$ docker exec -it gitlab bash
# root@gitlab:/#
$ gitlab-psql -d gitlabhq_production
psql (13.8)
Type "help" for help.
# gitlabhq_production=# 
$ update users set email='engine.wang@qq.com',notification_email='engine.wang@qq.com',commit_email='engine.wang@qq.com' where id = 1;
UPDATE 1
```

就可以了：
![](https://s2.loli.net/2022/11/28/arl2pEFfzM7vQme.png)

git@gitlab.engine.wang:enginewang/JRYY.git

## 本地机器配置

> fatal: could not read Username for 'https://gitlab.engine.wang': terminal prompts disabled

```bash
git config --global url."git@gitlab.engine.wang/".insteadof "https://gitlab.engine.wang/"
```

## 配置Gitlab runner

官方文档：https://docs.gitlab.com/runner/install/

我们需要一个runner来执行相关的代码

```bash
docker run -d --name gitlab-runner --restart always \
    -v /srv/gitlab-runner/config:/etc/gitlab-runner \
    -v /var/run/docker.sock:/var/run/docker.sock \
    gitlab/gitlab-runner
```

```bash
$ docker exec -it gitlab-runner gitlab-runner register --docker-privileged
...
# Gitlab地址
Enter the GitLab instance URL (for example, https://gitlab.com/):
https://gitlab.engine.wang/
# Gitlab token，这里是Repo->Setting->Runner里的token
Enter the registration token:
sWc-exXVycJv7dzN36u9
# 描述信息，自定义即可
Enter a description for the runner:
[47e468388f03]: default
# tag，自定义即可
Enter tags for the runner (comma-separated):
default
Registering runner... succeeded                     runner=sWc-exXV
# Runner运行的平台方式，一般选Docker
Enter an executor: docker-ssh+machine, kubernetes, custom, docker, ssh, virtualbox, docker-ssh, parallels, shell, docker+machine:
docker
# 默认镜像（如果没指定的话就会用这个）
Enter the default Docker image (for example, ruby:2.6):
alpine:latest
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
```

```bash
$ docker restart gitlab-runner
```

刷新仓库的Runner页面

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/202305012104978.png)

就可以看到这个Runner了

顺便设置一下这个Runner，因为我们就一个runner，所以将 Run untagged jobs打上勾，这样后面写job的时候就不需要指定tags就能通过这个runner运行了。

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/202305012225133.png)


## Hello World测试

验证一下Runner是否正常运行CI/CD

在那个仓库下提交一个`.gitlab-ci.yml`文件，填写下面的内容并push到仓库中。

```yaml
image: alpine:latest

test:
  script:
    - echo "Hello, GitLab Runner!"
```

提交到gitlab，查看CI/CD job是否正常运行，如果正常就说明配置成功。

![](https://wyc-1257430317.cos.ap-shanghai.myqcloud.com/202305012131300.png)
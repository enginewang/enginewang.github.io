---
title: "Django2+nginx+uwsgi+Ubuntu部署记录"
date: 2019-12-22T00:57:19+08:00
draft: false
categories: ["技术"]
tags: ["Django", "Linux", "nginx"]
---


Django项目写好了，最后一步就是部署(deployment)，部署十分关键，只有部署在服务器上，别人才能从互联网上通过ip地址或域名直接访问到你的网页。

第一步是购买vps（Virtual Private Server 虚拟服务器），这个很简单而且网上教程一大把，这里就不详述，我在vultr购买的海外服务器，这样不用浪费时间去备案了，vultr的一大特色就是按时长收费，如果你的vps出了什么问题，可以随时关停，并且它还支持微信支付宝，价格也很便宜。
<a href="https://www.vultr.com/?ref=7617179"> （vultr官网） </a>

Django的本地预览十分方便，一行`python manage.py runserver`就能搞定，但部署上线可没有这么简单。因为网上关于Django部署的教程都很杂乱，当时部署的时候就踩了很多很多坑，为了给之后一个参考，我又重新部署了一次，来记录详细的过程。

## 相关软件版本：
Django 2.1.3
Python 3.6.6
nginx 1.14.0
uwsgi 2.0.17.1

服务器：
Ubuntu-server 18.04

## 准备工作

首先打开ssh软件，Xshell、Putty什么的都行，通过vultr上vps详情页上给的ip和root密码连接到这台vps。

刚拿到的船新Linux，第一步先给它来个更新:
```shell
sudo apt-get update
sudo apt-get upgrade
```

建议使用非root用户，部署时最好使用python虚拟环境，具体操作不是本文的重点，便不赘述了

系统自带Python3.6、vim和git，所以不用装

安装python3-pip、python3-setuptools、gcc、python3-dev、wheel：
（缺一不可，不然之后用pip安装uwsgi会有各种各样的报错）
```shell
sudo apt-get install python3-pip python-setuptools python3-dev wheel
```

## 放置Django项目

直接在服务器端用vim什么的写Django当然可取（虽然会很酸爽），但更多的时候我们是在本地写好了Django项目，要把它挪到服务器上。

在传输之前，要做一些工作：

先更改一下`setting.py`里的`ALLOWED_HOSTS`，把服务器的ip加进去，有域名的话顺便把域名也加进去，要不然之后会无法加载Django项目

在本地的Python虚拟环境上使用`pip freeze > requirements.txt`,生成一个txt文件，里面是需要的Python库以及其版本，之后一并传给服务器

传输文件到服务器的方法非常之多：可以使用Xshell自带的文件传输，也可以使用linux命令scp或安装更直观的lrzsz，或者使用本地的FileZilla、Winscp等软件，当然万能的git也很不错。

不过考虑到之后这个web项目之后也要修改，用上面的方法感觉都不是特别方便，介绍一个非常好用的方法，那就是使用Pycharm自带的deployment功能，可以实现实时上传以及下载文件，很是方便。

在`Tools`->`Deployment`->`Configuration`中配置好与自己服务器的连接，IP地址、用户名、密码以及对应项目路径

<center>
<img src="https://res.cloudinary.com/dbmkzs2ez/image/upload/v1543389659/pycharm-deployment-1.jpg" width=60%>
</center>


<center>
<img src="https://res.cloudinary.com/dbmkzs2ez/image/upload/v1543389659/pycharm-deployment-2.jpg" width=60%>
</center>


在`Settings`->`Project Interpreter`里把项目解释器更改为服务器里的Python，mappings里填写两边项目的目录，再加一条`manage.py`的映射
<center>
<img src="https://res.cloudinary.com/dbmkzs2ez/image/upload/v1543389660/pycharm-deployment-3.jpg" width=60%>
</center>

apply之后Pycharm右下角会出现上传进度条，会有点慢，喝杯茶等一段时间即可

传输完毕后会发现本地的项目已经全部上传到服务器了

但这个毕竟不是这篇文章的重点，不重点介绍，遇到了什么问题可以留言或者私信我。

最后别忘了把`requirements.txt`上传到服务器，用pycharm的话只要直接把文件拖进本地项目目录，Pycharm就会自动帮我们上传到服务器。

在服务器上使用`pip install -r requirements.txt`来安装必要的Python packages
<br>
## 安装与配置uwsgi

使用pip3安装uwsgi（注意是pip安装，不是apt-get，否则之后会各种报错）
```shell
pip3 install uwsgi
```

下面来试一下uwsgi是否好使：
找个位置新建一个py文件，就叫`uwsgi_test.py`好了，然后用vim打开
```shell
touch uwsgi_test.py
vim uwsgi_test.py
```
写入以下内容：
```Python
def application(env, start_response):
    start_response('200 OK', [('Content-Type','text/html')])
    return [b"Hello Uwsgi"]
```
wq保存退出（vim的基本操作不赘述，网上教程一大把）

然后输入以下命令启动uwsgi，把这个部署到某个端口，以9090端口为例
```
uwsgi --http :9090 --wsgi-file uwsgi_test.py
```

这时会出现`spawned uWSGI worker 1 (and the only) (pid: 11812, cores: 1)
`
找个浏览器，访问`http://<你的服务器ip>:9090/`，不出意外的话你会看到Hello Uwsgi的字样，说明uwsgi能正常运行。

在项目目录下新建`uwsgi.ini`文件并编辑加入以下内容：
```python
[uwsgi]
# 直接访问uwsgi的端口号，绕过nginx
http = :8010
# 转发给nginx的端口号
socket = 127.0.0.1:8001
# 是否使用主线程
master = true
# 项目的绝对路径
chdir = /var/www/<PROJECT_NAME>/
# Django项目wsgi.py文件的相对路径
wsgi-file = <PROJECT_NAME>/wsgi.py
# 进程数
processes = 4
# 每个进程的线程数
threads = 2
# 监听端口
stats = 127.0.0.1:9191
# 每次退出时是否清理环境配置
vacuum = true
# 目录中一旦有文件被改动就自动重启
touch-reload = /var/www/my_site
# 存放日志
daemonize = /var/www/my_site/uWSGI.log
```

```
[uwsgi]
# 直接访问uwsgi的端口号，绕过nginx
http = :8010
# 转发给nginx的端口号
socket = 127.0.0.1:8001
# 是否使用主线程
master = true
# 项目的绝对路径
chdir = /var/www/bangumi_project/
# Django项目wsgi.py文件的相对路径
wsgi-file = bangumi_project/wsgi.py
# 进程数
processes = 4
# 每个进程的线程数
threads = 2
# 监听端口
stats = 127.0.0.1:9191
# 每次退出时是否清理环境配置
vacuum = true
# 目录中一旦有文件被改动就自动重启
touch-reload = /var/www/bangumi_project
# 存放日志
daemonize = /var/www/bangumi_project/uWSGI.log
```

加入uwsgi.ini的目的是使让uwsgi对接Django项目的启动变得更简便，否则就得在终端敲很长的代码

有了`uwsgi.ini`我们只需要输入`uwsgi --ini uwsgi.ini`就可以运行，浏览器输入ip地址加:8010端口（先绕过nginx因为还没配置呢），发现可以显示我们的项目了，这时css等静态文件可能没获取到，别急

## 安装和配置nginx

先`sudo apt-get install nginx`安装nginx，安装后nginx会自动启动，默认端口为80端口，浏览器输入ip地址加:80，可以看到"Welcome to nginx"的欢迎界面

把/etc/nginx/目录下的`uwsgi_params`复制到项目目录下，也可以直接项目目录下新建`uwsgi_params`文件，写入以下内容：
```shell
uwsgi_param  QUERY_STRING       $query_string;
uwsgi_param  REQUEST_METHOD     $request_method;
uwsgi_param  CONTENT_TYPE       $content_type;
uwsgi_param  CONTENT_LENGTH     $content_length;

uwsgi_param  REQUEST_URI        $request_uri;
uwsgi_param  PATH_INFO          $document_uri;
uwsgi_param  DOCUMENT_ROOT      $document_root;
uwsgi_param  SERVER_PROTOCOL    $server_protocol;
uwsgi_param  REQUEST_SCHEME     $scheme;
uwsgi_param  HTTPS              $https if_not_empty;

uwsgi_param  REMOTE_ADDR        $remote_addr;
uwsgi_param  REMOTE_PORT        $remote_port;
uwsgi_param  SERVER_PORT        $server_port;
uwsgi_param  SERVER_NAME        $server_name;
```

前往/etc/nginx/目录，查看`nginx.conf`（nginx基础配置），发现里面有这么两行，意思就是包含conf.d文件夹中所有以conf后缀的配置和site-enabled文件夹中的内容

```
include /etc/nginx/conf.d/*.conf;
include /etc/nginx/sites-enabled/*;
```
我们不更改nginx.conf基础配置，只需要修改`conf.d`目录下的conf文件即可，进入`conf.d`文件夹，修改`default.conf`文件，没有的话就新建一个（还可以修改site-enabled/default或者sites-available/default，效果都一样的）

然后写入以下内容：（务必根据自己的情况做相应更改）
```nginx
upstream django {
   server 127.0.0.1:8001;
}

server {
    # 监听端口，可改
    listen       80;
    # 修改为你的ip或者域名
    server_name  1.2.3.4;
    # 编码方式
    charset utf-8;

    # 日志记录，可选
    access_log      /var/www/<PROJECT_NAME>/nginx_access.log;
    error_log       /var/www/<PROJECT_NAME>/nginx_error.log;

    # 静态文件所在目录（自行修改）
    location /static {
        alias /var/www/my_site/blog/static;
    }
    # 媒体文件所在目录（自行修改）
    #location /media  {
    #    alias /home/www/djangotest/Hello/media; # 媒体文件所在文件夹
    #}
    location / {
        include /var/www/<PROJECT_NAME>/uwsgi_params;
        uwsgi_pass django;
    }
}
```

运行`service nginx restart`

如果报错`nginx.service failed because the control process exited with error code`，那么运行一下`nginx -t -c /etc/nginx/nginx.conf`，可以很容易的找到问题在哪。

浏览器输入ip地址，如果发现看到的还是"Welcome to nginx"，这个是因为在`nginx.conf`中还include了一个`sites-enabled/*`，它覆盖了我们在`default.conf`中的配置，可以干脆直接去`nginx.conf`里把`include /etc/nginx/sites-enabled/*;`这一行删掉，或者调换两行位置。
如果当时直接修改的sites-available或者sites-enabled中的default，就不会有这个问题

这时再访问我们的ip，就能看到自己在本地搭建的Django项目了，因为在配置nginx的时候写入了static的路径，所以css什么的都加载进来了。

至此nginx配置完毕

## 后续工作

服务器上的Django还没有执行数据库迁移与管理员创建，所以记得执行
```shell
python manage.py makemigrations
python manage.py migrate
```
以及
```shell
python manage.py createsuperuser
```

每次有更新时都要重载uwsgi与nginx才能生效，为了方便uwsgi的重载，在项目目录下新建一个`uwsgi`文件夹，然后在里面新建两个文件:`uwsgi.pid`（用于重载停止等操作）和`uwsgi.status`（用于查看状态）

修改`uwsgi.ini`，把原先的stats那行删掉，下面加上这两行：
```
stats=%(chdir)/uwsgi/uwsgi.status
pidfile=%(chdir)/uwsgi/uwsgi.pid
```
这样如果项目有更新，就可以使用这两个命令来分别重载uwsgi和nginx了
```
uwsgi --reload uwsgi/uwsgi.pid
systemctl reload nginx.service
```



至此我们的Django项目就部署完成了

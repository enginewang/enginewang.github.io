---
title: "Kubernetes离线业务：Job & CronJob"
date: 2023-10-05T13:40:09+08:00
draft: false
categories: ["技术"]
tags: ["Kubernetes", "Job", "CronJob", "云原生"]
---


## Kubernetes离线业务

Kubernetes有两类业务，一种是长时间运行的在线业务，比如Redis、MySQL、nginx；一种是短时间运行的离线业务，比如一段有限的代码的执行，比如数据分析计算、视频转码等，这种必然会退出。

这些任务跟Pod不是完全的绑定关系，不应该由Pod实现。

Job和CronJob组合Pod，实现了对离线业务的处理，这类任务还要考虑失败处理、获取结果、状态检查等管理事项。

离线任务中，只需要跑一次的临时任务就是API对象Job，按时间定时调用的定时任务就是API对象CronJob。

## Job

apiVersion是batch/v1

kind是Job

metadata没区别

创建时需要使用`kubectl create`

下面是最简单的一个Hello World的Job：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  creationTimestamp: null
  name: hello-job
spec:
  template:
    metadata:
      creationTimestamp: null
    spec:
      containers:
      - image: nginx:alpine
        name: hello-job
        resources: {}
        command: ["/bin/echo"]
        args: ["hello", "world"]
      restartPolicy: Never
status: {}
```

activeDeadlineSeconds：Pod运行的超时时间
backoffLimit：Pod的失败重试次数
completions：Job完成需要多少Pod
parallelism：允许并发的Pod数量

```bash
$ kubectl apply -f hello-job.yaml
```

k8s会从yaml中提取Pod并运行

```bash
$ kubectl get jobs
NAME        COMPLETIONS   DURATION   AGE
hello-job   1/1           4s         3m59s
```



```bash
$ kubectl get pod
NAME              READY   STATUS      RESTARTS   AGE
hello-job-gvxvz   0/1     Completed   0          4m8s
```

通过logs查看Pod的输出结果

```bash
$ kubectl logs hello-job-gvxvz
hello world
```

行的时间较长的job，通过sleep模拟
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: sleep-job
spec:
  # 15秒还没完成则认为超时
  activeDeadlineSeconds: 15
  # Pod的失败重试次数是2
  backoffLimit: 2
  # Job完成需要运行四个Pod
  completions: 4
  # 允许并发的Pod数是2
  parallelism: 2
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - image: nginx:alpine
        name: echo-job
        imagePullPolicy: IfNotPresent
        command:
          - sh
          - -c
          - sleep $(($RANDOM % 10 + 1)) && echo done
```

```bash
$ kubectl get pod
NAME                   READY   STATUS      RESTARTS   AGE
sleep-time-job-7g4qc   0/1     Completed   0          3m15s
sleep-time-job-86tqh   0/1     Completed   0          3m10s
sleep-time-job-kccn8   0/1     Completed   0          3m11s
sleep-time-job-rz27d   0/1     Completed   0          3m15s
```

## CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: hello-cj
spec:
  schedule: '*/1 * * * *'
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - image: nginx:alpine
            name: echo-cj
            imagePullPolicy: IfNotPresent
            command: ["/bin/echo"]
            args: ["hello", "world"]
```

```bash
$ kubectl get cj
NAME       SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
hello-cj   */1 * * * *   False     0        35s             8m22s
```

第一个 spec 是 CronJob 自己的对象规格声明
第二个 spec 从属于“jobTemplate”，它定义了一个 Job 对象。
第三个 spec 从属于“template”，它定义了 Job 里运行的 Pod。

CronJob 使用定时规则控制 Job，Job 使用并发数量控制 Pod，Pod 再定义参数控制容器，容器再隔离控制进程，进程最终实现业务功能


Job 的关键字段是 spec.template，里面定义了用来运行业务的 Pod 模板，其他的重要字段有 completions、parallelism 等

CronJob 的关键字段是 spec.jobTemplate 和 spec.schedule，分别定义了 Job 模板和定时运行的规则。

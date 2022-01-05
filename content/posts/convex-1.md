---
title: "凸优化（一）绪论与凸集"
date: 2021-12-27T21:10:31+08:00
draft: false
categories: ["理论"]
tags: ["凸优化", "数学"]
---


凸优化的笔记专栏，预计会分为五个部分，分别是：

- 绪论与凸集
- 凸函数
- 凸优化问题
- 凸优化问题的求解
- 无约束的优化问题

参考：
1. Stanford《convex optimization》
2. 中科大 凌青 凸优化

#### 优化问题

优化问题：从一系列可行解集合中，寻找出最优的元素

优化问题的形式：

$$
\begin{array}{ll}
\text{ minimize } & f_{0}(x) \newline
\text { subject to } & f_{i}(x) \leq b_i
\end{array}
$$

$f_0$是目标函数（$R^n \to R$）

优化问题在现实生活中各个领域都非常常见，深度学习中也是要使Loss最小，也是优化问题。

#### 优化问题的分类

##### 线性优化/非线性优化

（有时候也叫规划，和优化是一个意思）

目标函数由多个线性函数组合成，就是线性优化问题，否则就是非线性优化问题。

线性优化问题，最优解不是在顶点就是在整条边上

##### 凸优化/非凸优化

凸优化：

$$
\begin{array}{ll}
\text{ minimize } & f_{0}(x) \newline
\text { subject to } & f_{i}(x) \leq 0, \quad i=1, \ldots, m \newline
& a_{i}^{T} x=b_{i}, \quad i=1, \ldots, p
\end{array}
$$

优化问题里面，比较好求解的是凸优化问题，非凸优化问题难解决

##### 光滑/非光滑

目标函数每个点都可微就是光滑的，否则是非光滑的

##### 连续/离散

按照可行域连续或者离散分类

##### 单目标/多目标

对多个目标进行优化

这门课只研究单目标连续光滑的凸优化问题

判断是否为凸问题的一个关键，就是看约束集合、目标函数是否是凸集。所以凸集是凸优化问题最基本的一个概念。

#### 仿射集 Affine set

集合中任取两个点，形成的**直线**，如果整条线上的点也都在集合中，那么称该集合为仿射集
要求任意两点连成的直线在集合中，也就是说

$$x_1, x_2 \in C, \theta\in R \to \theta x_1 + (1- \theta)x_2 \in C$$

![convex-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640604307/convex-1.png)

仿射组合：不仅限两个点，而是多个点：
$$x_1,...x_k \in C , \theta_1 + ... \theta_k = 1 \to \theta_1 x_1 + ... \theta_k x_k \in C$$

利用
$$
(\theta_1 + \theta_2)(\frac{\theta_1}{\theta_1 + \theta_2}x_1 + \frac{\theta_2}{\theta_1 + \theta_2}x_2) + (1-\theta_1 - \theta_2)x_3 \in C
$$即可证明

**任意线性方程组$Ax = b$的解集都是仿射集，任意仿射集都可以写成线性方程组的解集**

假设该线性方程组有两个解$x_1, x_2$，则直线上的任意一点$\theta x_1+(1-\theta)x_2$代入得$A(\theta x_1+(1-\theta)x_2) = b$，说明也是该线性方程组的解

仿射包：从非仿射集合中构造一个最小的仿射集

比如两个点的集合不是仿射集，构造一个经过它们的直线，就是仿射集了，这条直线就是仿射包。三个不同直线的点，它们的最小的仿射包就是经过它们的二维平面。如果本身就是仿射集，那么仿射包就是它自己。

#### 凸集 convex set

凸集相比于仿射集条件放松，要求任意两点连成的**线段**在集合中。凸集的定义为：

$$x_1, x_2 \in C, \theta\in[0,1] \to \theta x_1 + (1- \theta_2)x_2 \in C$$

仿射集必然是凸集，可以认为是一种特殊的凸集，凸集包含的更广。

凸组合：不仅限两个点，而是多个点：
$$x_1,...x_k \in C , \theta_1 + ... \theta_k = 1, \theta_i\in[0,1] \to \theta_1 x_1 + ... \theta_k x_k \in C$$

凸包：包含集合S的最小凸集

下图2.2，只有左边的凸多边形是凸集。不过如果右图只少了角点，是凸集，少了边上或者内部的点就不是凸集了。

下图2.3是凸包，包括一组离散点的凸包，以及非凸形状的凸包。

![convex-2](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640604308/convex-2.png)

#### 典型凸集

##### 凸锥 Convex cone

锥：$\forall x \in C, \theta \geq 0, \theta x \in C$（锥尖需要在原点）

凸锥：$x_1, x_2 \in C, \theta_1 x_1 + \theta_2 x_2 \in C, \theta_1 > 0, \theta_2 > 0$


![convex-cone-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640604308/convex-cone-1.png)

图形理解，任取两点$x_1, x_2$，如果$x_1,x_2,o$不在一条直线上，那么在$\overset{\frown}{x_1 o x_2}$的扇形区域内的所有的点都在凸锥集上

过原点的直线和原点发出的射线是凸锥

凸锥组合：$x_1,... x_k \in C, \theta_1 x_1 + ... \theta_k x_k \in C, \theta_1 > 0, ...  \theta_k > 0$

凸锥包：和前面一样，如下图所示

![convex-cone-2](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640604308/convex-cone-2.png)

**对比一下前面几种组合：**
仿射组合：$\theta_1 + ... + \theta_k = 1$
凸组合：$\theta_1 + ... + \theta_k = 1, \theta_1, ... , \theta_k > 0$
凸锥组合：$\theta_1, ... , \theta_k \geq 0$

##### 超平面 Hyperplane

$\{x|a^T x = b\}$

是仿射集，也是凸集，不一定凸锥（除非过原点）

##### 半空间 Halfspace

$\{ x|a^T x \leq b \}$

半空间是凸集，不是仿射集，不一定凸锥（除非过原点）

下图分别为超平面和半空间：

![convex-5](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640604308/convex-5.png)

证明：
假设$x_1, x_2$在空间上：
$a^T x_1 \leq b$
$a^T x_2 \leq b$
对于$x_1,x_2$上的任意一点$\theta x_1 + (1-\theta) x_2$有：
$a^T(\theta x_1 + (1-\theta) x_2) = \theta (a^T x_1 -b) + (1-\theta) (a^T x_2 - b) +b \leq b$，也在集合中，所以半空间是凸集

法线的反方向

##### 空间球 Euclidean Ball

欧几里得球，就是一个空间球

$$
B\left(x_{c}, r\right)=\\{x |\ ||x-x_{c}||_{2}\leq r \\} $$

$$=\\{x |\ (x-x_{c})^{T}(x-x_{c} ) \leq r^{2}\\}
$$

证明：
假设$x_1, x_2$在空间上：
$|| x_1 - x_c ||_2 \leq r$
$|| x_2 - x_c ||_2 \leq r$
对于$x_1,x_2$上的任意一点$\theta x_1 + (1-\theta) x_2 $，（其中$\theta \in [0,1]$），有：
$$|| \theta x_1 + (1-\theta) x_2 - x_c ||_r = || \theta (x_1 - x_c) + (1-\theta)(x_2 - x_c)||\newline
\leq \theta ||x_1 - x_c||_2 + (1-\theta) ||x_2 - x_c||_2 \leq r
$$
这里用到了范数的三角不等式

> 范数性质
> 假设$x$的范数是$f(x)$，$f(x)\geq 0$，满足下面三条性质：
> $\text{if}\ f(x)=0 \to x=0$
> $kf(x) = |k|f(x)$
> $f(x+y) \leq f(x) + f(y)$（三角不等式）

##### 椭球 Ellipsoids


$$\mathcal{E} = \\{ x \mid\left(x-x_{c}\right)^{T} P^{-1}\left(x-x_{c}\right) \leq 1 \\}$$


矩阵P是一个 $n\times n$ 的对称正定矩阵

（特征值，奇异值）

##### 多面体 Polyhedra

多面体：有限个线性等式和不等式的解集
多面体是有限个半空间和超平面的交集

$$
\mathcal{P}=\\{x \mid a_{j}^{T} x \leq b_{j}, j=1, \ldots, m, c_{j}^{T} x=d_{j}, j=1, \ldots, p\\}
$$

##### 范数球 Norm Ball & 范数锥 Norm Cone

> 范数：满足以下条件的函数$||\cdot||$
> 1、$||x||\geq 0$，$||x||=0$当且仅当$x=0$
> 2、$||tx|| = t||x||$，对于任何$t\in R$成立
> 3、$||x+y|| \leq ||x|| + ||y||$

$$
C=\{(x, t) \mid\|x\| \leq t\} \subseteq \mathbf{R}^{n+1}
$$

![convex-6](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1640604308/convex-6.png)


##### 其他的例子

n*n的对称矩阵组成的集合，是凸锥，也是凸集

n*n的半正定矩阵组成的集合，是凸集

n*n的正定矩阵组成的集合不是凸集（取值只能>=0，不属于正定了）

线性矩阵不等式的解集也是凸集

#### 保凸运算

如果要证明是凸集可以用定义法，不过复杂情况会很难证明。
另一种方法是证明集合是多个凸集的保凸运算的简单组合，保凸运算包括以下几个：

##### 交集 Intersection

$C_1$, $C_2$是凸集，其交集$C = C_1 \cap C_2$也一定是凸集。

拓展到n个也是。

##### 仿射函数 Affine

$f$是仿射变换：$\mathbf{R}^{n} \rightarrow \mathbf{R}^{m}$

如果有$S \in R^n$是凸集，那么$f(S)=\\{f(x) \mid x \in S\\}$也是凸集，用定义证明即可。
逆函数$f^{-1}(S)=\\{x \mid f(x) \in S\\}$也是凸集。

##### 透视函数 Perspective functions

透视函数 $P: \mathbf{R}^{n+1} \rightarrow \mathbf{R}^{n}$，相当于通过变换（所有元素除以最后一个元素）将最后一个维度的元素变为1，然后去掉这个维度的一种变换。降低一个维度。

$P(\mathbf{X}, t) = \mathbf{X}/t, dom P = \\{(\mathbf{X}, t), t > 0\\}$
这里t是一个标量，X是矩阵，相当于P是dom(X)+1维度的，去掉最后一个维度t，X里的每一个元素除以t。

类比于针孔相机，3维的点$(x_1, x_2, x_3)$会通过孔映射到二维的平面 $-(x_1/x_3, x_2/x_3, 1)$ 上，就是一个透视函数的过程。

任意凸集的反透视映射也是凸集

##### 线性分段函数 Linear-fractional

一个Linear-fractional function是由perspective function和一个affine function组成的

$g(x)=\left[\begin{array}{c}A \newline c^{T}\end{array}\right] x+\left[\begin{array}{l}b \newline d\end{array}\right]$

#### 超平面分离定理与支撑超平面

##### 超平面分离定理

如果$C$和$D$是两个不相交的凸集，那么必然存在一个超平面$\\{x|a^Tx = b\\}$能够分离$C$和$D$，这超平面被称为分割超平面

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1641388051/convex-8.png)

##### 支撑超平面

集合C边界上的点$x_0$的支撑超平面：$\\{x | a^Tx = a^T x_0\\}$

其中$a \neq 0$，对于所有的$x \in C$满足$a^Tx \leq a^T x_0$

如果$C$是凸的，那么C边界上的每一个点都存在一个支撑超平面。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1641388051/convex-9.png)

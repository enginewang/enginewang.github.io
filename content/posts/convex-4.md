---
title: "凸优化（四）对偶"
date: 2022-01-09T21:25:05+08:00
draft: false
categories: ["算法"]
tags: ["凸优化", "数学"]
---

## Lagrange函数

原优化问题：

$$
\begin{array}{ll}
\text{ minimize } & f_0(x) \newline
\text { subject to } & f_{i}(x) \leq 0, \quad i=1, \ldots, m \newline
& h_i(x) = 0, \quad i=1, \ldots, p
\end{array}
$$


Lagrange函数是在优化目标中考虑约束条件，添加约束条件的加权和：

$$L(x, \lambda, v) = f_0(x) + \sum^m_{i=1}\lambda_if_i(x) + \sum^p_{i=1}v_i h_i(x)$$

其中包含三个自变量，$x$是原来优化问题的自变量，$\lambda$对应不等式约束，向量维度和不等式约束个数相同，$v$对应等式约束，向量维度和等式约束个数相同

如果$x$确定了，对于$\lambda$和$v$相当于线性函数

## 拉格朗日对偶函数

拉格朗日对偶函数的形式为：

$$g(\lambda, v) = \inf_{x \in \mathcal{D}} L(x, \lambda, v) = \inf_{x \in \mathcal{D}}(f_0(x) + \sum^m_{i=1}\lambda_if_i(x) + \sum^p_{i=1}v_i h_i(x))$$

**1. 不管原问题是什么问题，对偶函数一定是凹函数**

因为是取inf的分段线性函数

**2. 对偶函数构成了原优化问题的下界，也就是$g(\lambda, v) \leq p^\star $**

$p^\star $是原优化问题的最优值

> 证明：
假设最优解为$x^\star $，对应的最优值是$f_0(x^\star ) = p^\star $，最优解必然满足约束：
$$
f_i(x) \leq 0, g_i(x) = 0 \to
\sum^m_{i=1}\lambda_if_i(x) + \sum^p_{i=1}v_i h_i(x) \leq 0
$$
将最优解$x^\star $代入拉格朗日函数：
$$
\begin{array}{ll}
L(x^\star , \lambda, v) &=  f_0(x^\star ) + \sum^m_{i=1}\lambda_if_i(x^\star ) + \sum^p_{i=1}v_i h_i(x^\star ) \newline &\leq p^\star  g(\lambda, v) \leq L(x^\star , \lambda, v) \leq p^\star
\end{array}
$$

为了获得最大的下界，可以对$g$求极大，极大化凹函数也是一个凸问题。也就是将原问题转变为求解它的对偶函数：

$$
\begin{array}{ll}
\text{ maximize } & g(\lambda, v) \newline
\text { subject to } & \lambda \geq 0
\end{array}
$$

拉格朗日对偶问题的最优解$d^\star $，对应的解称为最优拉格朗日乘子$\lambda^\star , v^\star $
原问题的最优解$p^\star $，有以下式子成立：

$$
\begin{array}{ll}
d^\star  \leq p^\star
\end{array}
$$

### 例
$$
\begin{array}{ll}
\text { minimize } & x^T x \newline
\text { subject to } & Ax = b
\end{array}
$$

其拉格朗日函数为：（这里没有不等式约束，所以没有$\lambda$只有$v$）
$$
L(x, v) = x^T x + v^T(Ax - b )
$$

拉格朗日对偶函数为
$$
g(v) = \inf_{x \in \mathcal{D}} L(x, v) = \inf_{x \in \mathcal{D}} x^T x + v^T Ax - v^T b
$$

求极小值有：

$$\frac{\partial L(x, v)}{\partial x} = 2x + A^T v = 0 \to x = - \frac{A^T v}2$$

代入$x$有

$$
\frac{v^T AA^Tv}{4} - \frac{v^T AA^Tv}2 - v^Tb = -\frac{v^T AA^Tv}{4} - bv^T
$$

变成了一个关于$v$的凹二次函数


### 例

$$
\begin{array}{ll}
\text { minimize } & c^T x \newline
\text { subject to } & Ax = b \newline
& x \geq 0
\end{array}
$$

先转换为标准形式：
$$
\begin{array}{ll}
\text { minimize } & c^T x \newline
\text { subject to } & Ax - b = 0 \newline
&  -x \leq 0
\end{array}
$$

拉格朗日函数为：
$$
L(x, \lambda, v) = c^T x - \lambda^T x + v^T(Ax-b) = -b^Tv + (c + A^T v - \lambda)x
$$

是$x$的线性函数，如果$x$系数是0，那么极小值就是$-b^Tv$，如果不是0，那么就是$-\infty$

拉格朗日对偶函数为：
$$
g(\lambda, v) = \inf_x L(x, \lambda, v) = \begin{cases}
-b^T v , & \text{if } A^Tv + c - \lambda = 0\newline
-\infty, & \text{otherwise } \end{cases} $$

上面是仿射函数，加上其他情况的负无穷拓展是凹函数

要求它的极大值，负无穷的情况可以直接不考虑，也就是原问题转换为：
$$
\begin{array}{ll}
\text { max } & -b^T v \newline
\text { subject to } & \lambda \geq 0 \newline
& A^Tv + c - \lambda = 0
\end{array}
$$

即：
$$
\begin{array}{ll}
\text { max } & -b^T v \newline
\text { subject to } & A^Tv + c \geq 0
\end{array}
$$

和原问题的最优解相同，最优值不同


### 例

$$
\begin{array}{ll}
\text { minimize } & f_0(x) \newline
\text { subject to } & Ax \leq b \newline
& cx = d
\end{array}
$$

拉格朗日函数为：
$$
L(x, \lambda, v) = f_0(x) + \lambda^T(Ax-b) + v^T(cx-d)
$$

对$x$求极小

$$
g(\lambda, v) = \inf_{x\in dom f} L(x, \lambda, v) = \inf_{x\in dom f} f_0(x) + \lambda^T(Ax-b) + v^T(cx-d)
$$

之后可以使用共轭函数（略）

## 强对偶与弱对偶

之前说，对偶问题的最优解$d^\star $必然小于等于原问题的最优解$p^\star $

**弱对偶**：满足$p^\star  \geq d^\star $，原问题不管是否为凸，该式总成立
**强对偶**：满足$p^\star  = d^\star $，需要满足一些条件才能达到强对偶

在凸优化问题中，能够保证强对偶成立的条件被称为constraint qualiﬁcations

其中一种就是Slater条件

## Slater条件

有时简称为SCQ，该条件表述为：

对于凸优化问题：
$$
\begin{array}{ll}
\text{ minimize } & f_0(x) \newline
\text { subject to } & f_{i}(x) \leq 0, \quad i=1, \ldots, m \newline
& Ax = b
\end{array}
$$

如何存在可行解$x \in int \mathcal{D}$，使得：
$$
Ax = b, f_i(x) < 0, i = 1, ...m
$$
那么就能保证强对偶性

## KKT条件

KKT条件给出了最优解需要满足的必要条件，是求解优化问题最优解的一个重要方式。

对偶问题是：
$$
d^\star  = \sup_{\lambda, v} \inf_{x} L(x,\lambda, v)
$$

原问题是：
$$
p^\star  = \inf_x \sup_{\lambda, v} L(x, \lambda, v)
$$

弱对偶性实际上就是max-min不等式：
$$
\sup_{\lambda, v} \inf_{x} L(x,\lambda, v) \leq \inf_x \sup_{\lambda, v} L(x, \lambda, v)
$$

强对偶性就是：
$$
\sup_{\lambda, v} \inf_{x} L(x,\lambda, v) = \inf_x \sup_{\lambda, v} L(x, \lambda, v) = L(x^\star , \lambda^\star , v^\star )
$$

$x^\star , \lambda^\star , v^\star $也就是拉格朗日函数的鞍点，强对偶性下，$f_0(x^\star ) = g(\lambda^\star , v^\star )$

有：

$$
f_0(x^\star ) = g(\lambda^\star , v^\star ) = \inf_x (f_0(x) + \lambda^{\star T}f(x) + v^{\star T}h(x)) \leq f_0(x) + \lambda^{\star T}f(x) + v^{\star T}h(x) \leq f_0(x^\star )
$$

也就是要让这两个$\leq$都变成$=$

第一个不等号取等号的条件是：
$$
\nabla_{x}\left(f_0(x)+\lambda^{\star T} f(x)+\nu^{\star T} h(x)\right)=0
$$

第二个不等式取等号的条件是：
$$
\lambda_i^{\star T} f_i(x) = 0, \forall i
$$

上面一个条件共同构成了KKT条件：

### 1. 原始约束

$f_i(x) \leq 0, i = 0, ..., m$
$h_i(x) = 0, i = 1, ..., p$

### 2. 对偶约束

$\lambda \geq 0$

### 3. 互补松弛性

$\lambda_i f_i(x) = 0, i, ..., m$

### 4. 极值条件（稳定性条件）
$\nabla_{x}\left(f_0(x)+\lambda_i f_i(x)+\nu_i h_i(x)\right)=0$



对于一般情况而言，KKT条件只是必要条件。
但对于凸优化问题而言，如果有强对偶性，即满足Slater条件，则KKT条件是最优化性的**充要条件**


## 例题

> 注水问题，将值为1的总功率分配给不同的信道，使得总的通信功率最大，即考虑如下优化问题：
$$
\begin{array}{ll}
\text { minimize } & -\sum_{i=1}^{n} \log (x_{i}+\alpha_{i}) \newline
\text { subject to } & x \succcurlyeq 0 \newline
& 1^{T} x=1
\end{array}
$$

拉格朗日函数为：
$$
L(x, \lambda, v) = -\sum_{i=1}^{n} \log s(x_{i}+\alpha_{i}) - \lambda^T x + v^T(1^T x - 1)
$$
拉格朗日对偶函数为：
$$
g(\lambda, v) = \inf_{x\in D} L(x, \lambda, v) = \inf_{x\in D} (-\sum_{i=1}^{n} \log s(x_{i}+\alpha_{i}) - \lambda^T x + v^T(1^T x - 1))
$$
KKT条件为：
$$
x \succcurlyeq 0 \newline
1^{T} x=1 \newline
\lambda \succcurlyeq 0 \newline
\lambda_i^T x_i = 0, i = 1, ... ,n \newline
\frac{1}{x_i + \alpha_i} + \lambda_i = v, i = 1, ... ,n \newline
$$
如果$v \geq \frac{1}{\alpha_i}$，那么只有可能$x_i = 0$
如果$v < \frac{1}{\alpha_i}$，那么$\lambda_i = 0$，$x = \frac{1}{v} - \alpha_i$
最后有：
$$
x^{\star}=\left\\{\begin{array}{l}
1 / v^{\star}-\alpha_{i} \quad v^{\star}<1 / \alpha_{i} \newline
0 \quad v^{\star} \geq 1 / \alpha_{i}
\end{array}\\right.
$$

> 考虑问题：
$$
\begin{array}{ll}
\underset{\boldsymbol{x} \in \mathbb{R}^{n}}{\operatorname{minimize}} & f(\boldsymbol{x})=\boldsymbol{c}^{T} \boldsymbol{x} \newline
\text { subject to } & \boldsymbol{A} \boldsymbol{x} \geq \boldsymbol{b} \newline
& \boldsymbol{x} \geq \mathbf0
\end{array}
$$
分别基于集合约束$x \in X=\left\\{\boldsymbol{x} \in \mathbb{R}^{n} \mid \boldsymbol{x} \geq \mathbf0\right\\}$和$x \in X=\mathbb{R}^{n}$写出该问题的对偶问题。

首先看第一个集合约束，此时第二个约束因为已经在集合约束里了，不需要单独考虑了，拉格朗日函数为：
$$
L(x, \lambda) = c^T x + \lambda(b - Ax) = (c^T - \lambda^T A)x + \lambda^T b
$$
对偶函数$$
g(\lambda) = \inf_x L(x, \lambda)
$$

因为$x \geq 0$，如果$c^T - \lambda^T A < 0$的话，只要取$x = + \infty$，就会使得对偶函数为$- \infty$，因此对偶问题要增加约束$c^T - \lambda^T A \geq 0$，在此约束下，需要取$x=0$使得$g(\lambda)$最小，值为$\lambda^T b$

对偶问题为：
$$\begin{array}{ll}\underset{\boldsymbol{\lambda} \in \mathbb{R}^m}{\operatorname{maximize}} & \boldsymbol{b}^{T} \boldsymbol{\lambda} \newline \text { subject to } & \boldsymbol{\lambda}^{T} \boldsymbol{A} \leq \boldsymbol{c}^{T} \newline & \boldsymbol{\lambda} \geq \mathbf0\end{array}$$

第二个集合约束，没有对$x$的限制，拉格朗日函数为：
$$
c^T x + \lambda_1(b-Ax) - \lambda_2 x = (c^T - \lambda_1^T A -\lambda_2)x +\lambda_1^T b
$$
对偶函数$$
g(\lambda_1, \lambda_2) = \inf_x L(x, \lambda_1, \lambda_2)
$$

如果$c \neq 0$，那么$g(\lambda_1, \lambda_2)$就是$- \infty$，所以对偶问题为：
$$\begin{array}{ll}\underset{\boldsymbol{\lambda_1, \lambda_2} \in \mathbb{R}^m}{\operatorname{maximize}} & \boldsymbol{b}^{T} \boldsymbol{\lambda_1} \newline \text { subject to } & \boldsymbol{c^T} - \boldsymbol{\lambda_1^T A} -\boldsymbol{\lambda_2} = 0\newline & \boldsymbol{\lambda_1, \lambda_2} \geq \mathbf0\end{array}$$


> 一般线性规划的对偶，求解线性规划
$$
\begin{array}{ll}
\operatorname{minimize} & c^{T} x \newline
\text { subject to } & G x \preceq h \newline
& A x=b
\end{array}
$$
的对偶函数，并将隐式等式约束显式表达


拉格朗日函数：
$$
L(x, \lambda, v) = c^T x + \lambda^T(Gx - h) + v^T(Ax - b)
$$

对偶函数：

$$
g(\lambda, v) = \inf_{x \in D} L(x, \lambda, v) = \inf_{x \in D} (c^T x + \lambda^T(Gx - h) + v^T(Ax - b)) $$

$$= \left \\{ \begin{array}{ll} -\lambda^T h - v^T b & \text{if}\ c+G^T \lambda + A^T v = 0\newline -\infty & \text{otherwise}  \end{array} \right .
$$

对偶问题变为：

$$
\begin{array}{ll}
\text { maximize } & g(\lambda, \nu) \newline
\text { subject to } & \lambda \geq 0
\end{array}
$$

由于不能取负无穷的其他情况，所以增加的约束为：

$$
\begin{array}{ll}
\text { maximize} & -\lambda^{T} h-\nu^{T} b \newline
\text { subject to } & c+G^{T} \lambda+A^{T} \nu=0 \newline
& \lambda \geq 0
\end{array}
$$


> 解析中心，考虑优化问题：
$$
\text {minimize} -\sum_{i=1}^m \log(b_i - a_i^T x)
$$
其定义域为$\{ x | a_i^T x < b_i, i = 1, ..., m \}$，推导其对偶问题

代入$y_i = b_i - a_i^T x$ 得：

$$
\begin{array}{ll}
\text { maximize} & -\sum_{i=1}^m \log y_i \newline
\text { subject to } & y_i = b_i - a_i^T x , i = 1, ... m\newline
\end{array}
$$

拉格朗日函数为：

$$
L(x, y, v) = -\sum_{i=1}^m \log y_i + \sum_{i=1}^n v^T(y_i - b_i + a_i x)
$$

对偶函数为：
$$
g(v) = \inf_{x, y}(-\sum_{i=1}^m \log y_i + \sum_{i=1}^n v^T(y_i - b_i + a_i x))
$$

如果$\sum_{i=1}^m v^T a_i \neq 0$，那么$x$可以让$g(v)$取$-\infty$，如果$v \leq 0$，那么$y$可以让$g(v)$取$-\infty$，取最大时$y_i = \frac{1}{v_i}$

有：

$$
g(v) = \left \\{ \begin{array}{ll} \sum_{i=1}^m (\log v_i) -v^T b + m & \sum_{i=1}^m v^T a_i = 0, v > 0\newline -\infty & \text{otherwise}  \end{array} \right .
$$

对偶问题为：
$$
\begin{array}{ll}
\text { maximize} & \sum_{i=1}^m (\log v_i) -v^T b + m \newline
\text { subject to } & \sum_{i=1}^m v_i^T a_i = 0 , i = 1, ... m\newline
& v > 0, i = 1, ... m\newline
\end{array}
$$


> 写出下面优化问题的KKT条件，并求出最优解
$$
\begin{array}{ll}
\text { minimize } & -3 x_{1}^2+x_2^2+2 x_{3}^2+2\left(x_{1}+x_2+x_{3}\right) \newline
\text { subject to } & x_{1}^2+x_2^2+x_{3}^2=1
\end{array}
$$

KKT条件：

1、原始约束：$x_{1}^2+x_2^2+x_{3}^2=1$

2、对偶约束：无

3、互补松弛性约束：无

4、稳定性条件：$(-3+v)x_1 + 1 = 0, (1+v)x_2 + 1 = 0, (2+v)x_3 + 1 = 0$

通过稳定性条件将$x_1, x_2, x_3$全部替换成$v$然后代入原始约束，解出四个解：
$v = -3.15, v = 0.22, v = 1.89, v = 4.04$

代入，最大的是$(v, x_1, x_2, x_3) = (-3.15, 0.16, 0.47, -0.87)$，$f_0^\star(x^\star) = 1.17$

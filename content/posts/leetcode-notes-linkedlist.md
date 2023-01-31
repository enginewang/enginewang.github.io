---
title: "LeetCode算法笔记（链表篇）"
date: 2022-12-10T17:19:49+08:00
draft: false
categories: ["技术"]
tags: ["算法", "LeetCode"]
---


## 翻转链表：寻找相同状态迭代与递归


有些指针变来变去的题目，特别绕，比如翻转链表。

### [LeetCode 206. 反转链表 ☆](https://leetcode.cn/problems/reverse-linked-list/)

可以寻找相同的状态，解决这个状态下的问题，然后一个循环到最后。

相同状态就是：
当前结点，前面一个结点已经倒序排好了，假设是back。后面还未遍历。

![leetcode206-1](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1644504983/lc206-1.png)

先把循环写出来，很好写：
```go
// 为了方便直接让head走到底，head指针代码cur
for head.Next != nil{
  next = head.Next
  head.Next = back
  back = head
  head = next
}
```
然后再考虑最前面的情况：
```go
if head == nil || head.Next == nil {
  return head
}
// 最开始没有back，让第一个是back，head往后移一个
back := head
head = head.Next
// 这边记得要把最开始head的Next置为nil，不然就无限循环了。
back.Next = nil
```

和最后的情况：
```go
head.Next = back
```

### [LeetCode 92. 反转链表 II ☆☆](https://leetcode.cn/problems/reverse-linked-list-ii/)

反转一个区间内的链表

![](https://assets.leetcode.com/uploads/2021/02/19/rev2ex2.jpg)

```
输入：head = [1,2,3,4,5], left = 2, right = 4
输出：[1,4,3,2,5]
```

```go
func reverseBetween(head *ListNode, left, right int) *ListNode {
    // 设置 dummyNode 是这一类问题的一般做法
    dummyNode := &ListNode{Val: -1}
    dummyNode.Next = head
    pre := dummyNode
    for i := 0; i < left-1; i++ {
        pre = pre.Next
    }
    cur := pre.Next
    for i := 0; i < right-left; i++ {
        next := cur.Next
        cur.Next = next.Next
        next.Next = pre.Next
        pre.Next = next
    }
    return dummyNode.Next
}
```

### [LeetCode 25. K 个一组翻转链表 ☆☆☆](https://leetcode.cn/problems/reverse-nodes-in-k-group/)

给定一个链表，每 k 个节点一组进行翻转，返回翻转后的链表

```go
func hasKNode(head *ListNode, k int) bool {
     for ; k > 0; k-- {
          if head != nil{
               head = head.Next
          } else {
               return false
          }
     }
     return true
}

func reverseKGroup(head *ListNode, k int) *ListNode {
     if k == 1{
          return head
     }
     firstTime := true
     var result *ListNode
     var tempTail *ListNode
     for hasKNode(head, k){
          p := 0
          tempHead := head
          back := head
          head = head.Next
          for head.Next != nil {
               p += 1
               if p == k-1 {break}
               next := head.Next
               head.Next = back
               back = head
               head = next
          }
          tempHead.Next = head.Next
          if firstTime{
               result = head
               firstTime = false
          } else {
               tempTail.Next = head
          }
          tempTail = tempHead
          head.Next = back
          head = tempHead.Next
     }
     return result
}
```

## 合并有序链表：简单比较或最小堆

### [LeetCode 21. 合并两个有序链表 ☆](https://leetcode.cn/problems/merge-two-sorted-lists/)

合并两个有序数组很简单，用两个指针从左往右遍历比较大小即可，小的接到结果链表上，最后一个到结尾了把另一个接上去就好了，很简单。

为了不讨论头结点的情况，一个更好的方式是用虚拟头结点DummyHead
代码如下：

```go
func mergeTwoLists(l1 *ListNode, l2 *ListNode) *ListNode {
	if l1 == nil && l2 == nil {
		return nil
	}
	head := &ListNode{Val: -1}
	current := head
	for l1 != nil && l2 != nil {
		if l1.Val < l2.Val {
			current.Next = l1
			current = l1
			l1 = l1.Next
		} else {
			current.Next = l2
			current = l2
			l2 = l2.Next
		}
	}
	if l1 == nil {
		current.Next = l2
	} else {
		current.Next = l1
	}
	return head.Next
}
```

### [LeetCode 23. 合并K个升序链表 ☆☆☆](https://leetcode.cn/problems/middle-of-the-linked-list/)

一旦把两个拓展到K个，就比较困难了，因为要判断K个链表头结点的最小值，一般遍历的话复杂度很高，所以一个比较好的方式是用最小堆来实现，先实现一个堆的数据结构，加入每个链表的头结点，每次选出最小值的，然后从堆中剔除它，再加入该链表的next结点。


## 中点问题、找环问题、重复链表：快慢指针、构造相遇

1. 中点问题

### [LeetCode 876. 链表的中间结点 ☆](https://leetcode.cn/problems/middle-of-the-linked-list/)

很简单，快慢指针，快的每次走两步，慢的每次走一步，快的指针走到最后时，慢的指针恰好在中间的位置。

2. 找环问题

### [LeetCode 141. 环形链表 ☆](https://leetcode.cn/problems/linked-list-cycle/)
### [LeetCode 142. 环形链表 II ☆☆](https://leetcode.cn/problems/linked-list-cycle-ii/)

当然，这类问题有一个更容易理解的解法，就是用哈希表将遇到的结点存起来，但是效率不及快慢指针法。

快慢指针法：

1. 定义两个指针slow、fast都处于开始的位置，每次迭代，fast往前走两步，slow往前走一步。

2. 如果fast遇到null，说明无环，直接返回

3. 如果有环，fast必然会在slow走到第二圈之前追上slow

4. 在追击的位置，另设一个指针从head开始，和slow一起一格一格走，它们两个相遇的位置就是成环的位置


如果有环，fast必然能追上slow，这一点很容易理解。

那么为什么slow走不到第二圈必然就会被追上？
fast可能走了多圈，但是一定能在slow还没开始第二圈的时候追上slow。

![leetcode-141](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1644504984/lc141-1.png)

举个极限的例子，假如说没有a，一开始就是环，此时由于fast速度是slow两倍，slow刚好走完一圈的时候，就被走完两圈的fast追上了。那么加上了a，也就是说slow走到环开始的地方的时候，fast早就进环了，反而能更快地追上a，所以a走不到一圈。

b可以走多圈，比如a很长，b+c比较短，slow走到了环开始的地方，fast就已经走了很多圈了。

假设fast走了f圈：
slow走的长度：a + b
fast走的长度：a + f(b+c) + b
因为fast的速度是slow的两倍，时间一样，fast走的长度一定是slow的两倍，也就是：
a + f(b+c) + b = 2(a + s(b+c) + b)
-> a + -f(b+c) + b = 0
-> a = f(b+c) - b

那么我们发现，如果一个新的指针p从head开始走，之前的slow从之前相遇的地方开始走，它们都一格一格走，必然会相遇，而这个相遇的地方刚好就是开始有环的位置。
此时p走了a = f(b+c) - b的距离，刚好是slow绕环f-1圈然后走一个c，它们刚好在环开始的地方相遇。

该算法的时间复杂度为$O(n)$，空间复杂度为$O(1)$

```go
func detectCycle(head *ListNode) *ListNode {
	if head == nil {
		return nil
	}
	slow, fast := head, head
	for fast.Next != nil && fast.Next.Next != nil {
		fast = fast.Next.Next
		slow = slow.Next
		if slow == fast {
			slow = head
			for slow != fast {
				slow = slow.Next
				fast = fast.Next
			}
			return slow
		}
	}
	return nil
}
```

3. 相交链表

相交链表是找相遇情况

### [LeetCode 160. 相交链表 ☆](https://leetcode.cn/problems/intersection-of-two-linked-lists/)

这是一道很有意思的题目，实际上我们也需要某种方式让两个指针相遇。

假设两个链表长度分别是a和b，后面公共部分的长度是c，当然也可能没有公共部分。

![](https://res.cloudinary.com/dbmkzs2ez/image/upload/v1644504984/lc160-1.png)


首先两个结点pa和pb分别从headA和headB开始往后以同样的速度依次遍历，直到一方走到最后，从另一个链表的头开始走起，如果有公共部分的话，pa在第二圈的首个公共结点处会走a（走了一次完整的a链表）+b-c的路程，pb在第二圈的首个公共结点处会走b（走了一次完整的b链表）+a-c的路程，pa和pb会在首个公共结点相遇。

要是a和b没有公共部分，那么它们会同时走完a+b的路程，同时为null，同样跳出循环。

```go

func getIntersectionNode(headA, headB *ListNode) *ListNode {
	if headA == nil || headB == nil {
		return nil
	}
	pa, pb := headA, headB
	for pa != pb{
		if pa != nil {
			pa = pa.Next
		} else{
			pa = headB
		}
		if pb != nil {
			pb = pb.Next
		} else {
			pb = headA
		}
	}
	return pa
}
```

还有一个巧妙的思路，就是将一条链表的末端连接零一条链的头部，这样的话问题就转换为了找环。


## 出现倒数：尝试先遍历一次

### [LeetCode 19. 删除链表的倒数第 N 个结点 ☆](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/)

出现倒数，先遍历一次，得到长度len，然后第二次遍历的时候找到len-N的结点，把这个结点删除即可，代码很简单

```go
// 删除倒数第N个节点，那么我们当前遍历的指针一定要指向 第N个节点的前一个节点
func removeNthFromEnd(head *ListNode, n int) *ListNode {
	if head == nil {
		return head
	}
	dummyNode := &ListNode{Val: -1, Next: head}
	count := 0
	cur := head
	// 首先要遍历一遍算一下有多长，从而计算倒数第N个是正数第几个
	for cur != nil {
		cur = cur.Next
		count++
	}
	id := count - n
	cur = dummyNode
	for id > 0 {
		cur = cur.Next
		id--
	}
	cur.Next = cur.Next.Next
	return dummyNode.Next
}
```

### [LeetCode 160. 相交链表 ☆](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/)

上面已经讲了一个方法，但是第一次还是很难想到的，另一种思路是，既然重复的部分在最后，尝试先遍历一次。

先分别遍历依次pa和pb，找到各自的长度，让长度长的先往后走到和短的一样长，然后一起开始走，这样如果有交叉就一定能碰到，这种方式的复杂度并没有提升，而且更容易理解。当然只是代码的简洁程度和巧妙性不如前一种找相遇的方式。

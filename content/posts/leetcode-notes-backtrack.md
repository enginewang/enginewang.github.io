---
title: "算法笔记（回溯法）"
date: 2023-02-15T19:11:03+08:00
draft: false
categories: ["技术"]
tags: ["算法", "LeetCode"]
---

回溯法可以解决各种排列组合问题，本质上就是遍历决策树。

宽度是问题的个数，高度是递归的深度

```go
func backtrack(path, choiceList){
  // 终止条件
  if (terminal condition){
    result = append(result, path)
    return
  }
  for _, choice := range choiceList {
    // 做选择
    backtrack(path, choiceList)
    // 回溯，撤销处理结果
  }
}
```

回溯法其实就是DFS的一类用法，本质上就是搜索树的递归遍历，其实就是一种暴力搜索。

回溯法解决的问题包括：
- 组合问题：N个数里面按一定规则找出k个数的集合
- 排列问题：N个数按一定规则全排列，有几种排列方式
- 切割问题：一个字符串按一定规则有几种切割方式
- 子集问题：一个N个数的集合里有多少符合条件的子集
- 棋盘问题：N皇后，解数独等等



## 排列问题

### [LeetCode 46. 全排列 ☆☆](https://leetcode.cn/problems/permutations/)

```
输入：nums = [1,2,3]
输出：[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
```

套回溯法，首先要明确选择集合，最开始肯定是所有的数字都能选，之后每次选择一个就只能选剩下的几个数字了。
go删除列表的特定元素比较麻烦，这里多加一个哈希表来表示这个元素是否可以被选择，需要注意的是回溯时要设回true。

```go
func permute(nums []int) [][]int {
    var path []int
    var result [][]int
    choiceDict := make(map[int] bool)
    for _, r := range nums {
        choiceDict[r] = true
    }
    backtrack(path, nums, choiceDict, &result)
    return result
}

func backtrack(path []int, nums []int, choiceDict map[int] bool, result *[][]int)  {
    if len(path) == len(choiceDict){
        tmp := make([]int, len(path))
        copy(tmp, path)
        *result = append(*result, tmp)
    }
    for _, choice := range nums{
        if choiceDict[choice] {
            path = append(path, choice)
            choiceDict[choice] = false
            backtrack(path, nums, choiceDict, result)
            choiceDict[choice] = true
            path = path[:len(path)-1]
        }
    }
}
```

[LeetCode 46. 全排列II ☆☆](https://leetcode.cn/problems/permutations/)

## 组合问题

给出一个数组的k个数的组合，本质上还是一样的，下面是要注意的点：

- 在结束条件判断里面，是当前路径的长度。
- 组合其实就是判断各个位置的元素是否选择，需要带入一个i作为起始位置，不会再考虑i之前的元素。在回溯里面遍历的时候，由于i这个位置已经考虑了是否放入，所以递归从i+1开始，

### [LeetCode 77. 组合 ☆☆](https://leetcode.cn/problems/combinations/)

```go
var result [][]int

func combine(n int, k int) [][]int {
	backtracking(1, []int{}, n, k)
	return result
}

func backtrack(start int, cur []int, n int, k int) {
	if len(cur) == k {
		tmp := make([]int, len(cur))
		copy(tmp, cur)
		result = append(result, tmp)
	}
	for i := start; i <= n; i++ {
		cur = append(cur, i)
		backtrack(i+1, cur, n, k)
		cur = cur[:len(cur)-1]
	}
}
```



[LeetCode 39. 组合总和 ☆☆](https://leetcode.cn/problems/combination-sum/)

> 给你一个 **无重复元素** 的整数数组 `candidates` 和一个目标整数 `target` ，找出 `candidates` 中可以使数字和为目标数 `target` 的 所有 **不同组合** ，并以列表形式返回。你可以按 **任意顺序** 返回这些组合。candidates 中的 **同一个** 数字可以 **无限制重复被选取** 。如果至少一个数字的被选数量不同，则两种组合是不同的。 

可以被无限制选取，不过最后的结果中不能重复，仍然需要声明一个start，回溯时需要从start开始到最后，前面的元素可以无视，因为可以重复，start本身也要在考虑中。如果不能重复，则递归改成start+1即可。

```go
var result [][]int

func combinationSum(candidates []int, target int) [][]int {
	result = make([][]int, 0)
	backtrack([]int{}, 0, candidates, 0, target)
	return result
}

func backtrack(temp []int, sum int, nums []int, start int, target int) {
	if sum == target {
		tmp := make([]int, len(temp))
		copy(tmp, temp)
		result = append(result, tmp)
		return
	}
	if sum > target {
		return
	}
	// 因为可以被无限次选取，temp表示从start开始到最后的结果
	for i := start; i < len(nums); i++ {
		temp = append(temp, nums[i])
		sum += nums[i]
		backtrack(temp, sum, nums, i, target)
		sum -= nums[i]
		temp = temp[:len(temp)-1]
	}
}
```





[LeetCode 40. 组合总和II ☆☆](https://leetcode.cn/problems/combination-sum-ii)

> 给定一个候选人编号的集合 `candidates` 和一个目标数 `target` ，找出 `candidates` 中所有可以使数字和为 `target` 的组合。
>
> `candidates` 中的每个数字在每个组合中只能使用 **一次** 。
>
> **注意：**解集不能包含重复的组合。 

由于每个数字只能选取一次，递归改成start+1，然而这样做还不够，因为解集不能包含重复组合。需要去重，首先要排序，并且中间如何去重是比较难理解的。

```go
var result [][]int

func combinationSum2(candidates []int, target int) [][]int {
  // 排序，为剪枝做准备
	sort.Ints(candidates)
	result = make([][]int, 0)
	backtrack([]int{}, 0, candidates, 0, target)
	return result
}

func backtrack(temp []int, sum int, nums []int, start int, target int) {
	if sum == target {
		tmp := make([]int, len(temp))
		copy(tmp, temp)
		result = append(result, tmp)
		return
	}
	if sum > target {
		return
	}
	for i := start; i < len(nums); i++ {
		if i > start && nums[i] == nums[i-1] {
			continue
		}
		temp = append(temp, nums[i])
		sum += nums[i]
		backtrack(temp, sum, nums, i+1, target)
		sum -= nums[i]
		temp = temp[:len(temp)-1]
	}
}
```



### [LeetCode 216. 组合总和III ☆☆](https://leetcode.cn/problems/combination-sum-iii/description/)

> 找出所有相加之和为 `n` 的 `k` 个数的组合，且满足下列条件：
>
> - 只使用数字1到9
> - 每个数字 **最多使用一次** 
>
> 返回 *所有可能的有效组合的列表*。该列表不能包含相同的组合两次，组合可以以任何顺序返回。

这边只需要1-9，所以不用nums直接用i表示1-9，不同的是每个数字最多使用一次，所以里面的回溯从i+1开始。

```go
var result [][]int

func combinationSum3(k int, n int) [][]int {
	result = make([][]int, 0)
	backtrack([]int{}, 0, 1, n, k)
	return result
}

func backtrack(temp []int, sum int, start int, target int, count int) {
	if len(temp) == count {
		if sum == target {
			tmp := make([]int, len(temp))
			copy(tmp, temp)
			result = append(result, tmp)
			return
		} else {
			return
		}
	}
	if sum > target {
		return
	}
	// 因为可以被无限次选取，temp表示从start开始到最后的结果
	for i := start; i < 10; i++ {
		temp = append(temp, i)
		sum += i
		backtrack(temp, sum, i+1, target, count)
		sum -= i
		temp = temp[:len(temp)-1]
	}
}
```

### [LeetCode 17. 电话号码的字母组合 ☆☆](https://leetcode.cn/problems/letter-combinations-of-a-phone-number/)

> 给定一个仅包含数字 `2-9` 的字符串，返回所有它能表示的字母组合。答案可以按 **任意顺序** 返回。
>
> 给出数字到字母的映射如下（与电话按键相同）。

![](https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2021/11/09/200px-telephone-keypad2svg.png)

```go
var numberMap = map[int][]string{
	2: {"a", "b", "c"},
	3: {"d", "e", "f"},
	4: {"g", "h", "i"},
	5: {"j", "k", "l"},
	6: {"m", "n", "o"},
	7: {"p", "q", "r", "s"},
	8: {"t", "u", "v"},
	9: {"w", "x", "y", "z"},
}

func letterCombinations(digits string) []string {
	d := []rune(digits)
	var result []string
	if len(d) == 0 {
		return []string{}
	}
	if len(d) == 1 {
		return numberMap[int(d[0])-48]
	}
	for _, str := range letterCombinations(string(d[:len(d)-1])) {
		for _, cur := range numberMap[int(d[len(d)-1])-48] {
			result = append(result, str+cur)
		}
	}
	return result
}
```

### [LeetCode 131. 分割回文串 ☆☆](https://leetcode.cn/problems/palindrome-partitioning/description/)

这道题标的是med，但是实际难度可以认为是hard。

首先是两个问题：如何将其变为组合问题用回溯？如何判断回文子串？

直接切割很显然不太能实现，暴力法肯定超时，思考一个问题，本来最后是切割后的子串组列表，一个切割后的子串组是跟切割位置一一对应的，比如：

s = "aab"，其中切割位置为[1,2]的时候，也就是切割为["a“,"a","b"]，所以我们将切割位置这个数组作为temp[]进行回溯。

为了方便最后的转换，最前面再加一个[0]。

回文子串比较简单，采取简单的双指针即可。

也要设定start index，i从这里开始往后，当然不能切同一个位置，所以从start+1开始遍历，然后看s[start,i]是不是回文子串，是的话就在这里切一刀并回溯。如果i到最后一位了，就说明切割完成了。

这道题细节问题很多，难度不小，值得注意。

```go
var result [][]string
var dict map[string]bool

func partition(s string) [][]string {
	if len(s) == 1 {
		return [][]string{[]string{s}}
	}
	dict = make(map[string]bool)
	result = make([][]string, 0)
	backtrack([]int{0}, 0, s)
	return result
}

func backtrack(temp []int, start int, s string) {
	if start == len(s) {
		var r []string
		for k := 1; k < len(temp); k++ {
			r = append(r, s[temp[k-1]:temp[k]])
		}
		result = append(result, r)
	}
	for i := start + 1; i <= len(s); i++ {
		// 如果是回文子串，就进入递归
		if isReverseSame(s[start:i]) {
			temp = append(temp, i)
			backtrack(temp, i, s)
			temp = temp[:len(temp)-1]
		}
	}
}

func isReverseSame(s string) bool {
	if dict[s] {
		return dict[s]
	}
	for i := 0; i < len(s)/2; i++ {
		if s[i] != s[len(s)-1-i] {
			dict[s] = false
			return false
		}
	}
	dict[s] = true
	return true
}
```

### [LeetCode 93. 复原 IP 地址 ☆☆](https://leetcode.cn/problems/restore-ip-addresses/)

跟上一道题回文子串基本类似，换一个形式，大体不变

有两个注意的小点，一个是ip判断不是仅仅判断数字是否大于255，如果不是0的话，不能以0开头，比如1.01.1.1也是不合法的。
另外就是ip这里必须是四个，也就是我们的切割点数组（这里我加上开头和结尾）的长度就必须是5。所以符合要求的终止条件判断就是一方面start需要到最后一位，也就是所有的切割子串都符合ip要求，另一个条件就是切割数组长度必须是5。总的来说如果第一次写还是有难度的。如果之前写过上道回文子串就容易很多。

```go
var result []string

func restoreIpAddresses(s string) []string {
	result = make([]string, 0)
	backtrack(0, []int{0}, s)
	return result
}

func backtrack(start int, temp []int, s string) {
	if len(temp) > 5 {
		return
	}
	if start == len(s) && len(temp) == 5 {
		validIpList := make([]string, 0)
		for k := 1; k < len(temp); k++ {
			validIpList = append(validIpList, s[temp[k-1]:temp[k]])
		}
		result = append(result, strings.Join(validIpList, "."))
	}

	for i := start + 1; i <= len(s); i++ {
		if isValidIp(s[start:i]) {
			temp = append(temp, i)
			backtrack(i, temp, s)
			temp = temp[:len(temp)-1]
		}
	}
}

func isValidIp(s string) bool {
	ip, err := strconv.Atoi(s)
	if err != nil {
		return false
	}
	if ip > 255 {
		return false
	}
	if len(s) > 1 && s[0] == '0' {
		return false
	}
	return true
}
```

## 子集问题

输入一个数组，输出子集。

如果已知一个子集，增加一个新元素可以生成新的子集，所以迭代也很好做。当然也可以用回溯做。


### [LeetCode 78. 子集 ☆☆](https://leetcode.cn/problems/subsets/)

不能重复取，先排序，然后需要start index，并且回溯要start+1

```go
var result [][]int

func subsets(nums []int) [][]int {
    result = make([][]int, 0)
    sort.Ints(nums)
    backtrack([]int{}, nums, 0)
    return result
}

func backtrack(temp []int, nums []int, start int) {
    tmp := make([]int, len(temp))
    copy(tmp, temp)
    result = append(result, tmp)
    for i := start; i < len(nums); i++ {
        temp = append(temp, nums[i])
        backtrack(temp, nums, i+1)
        temp = temp[:len(temp)-1]
    }
}
```

### [LeetCode 90. 子集 II ☆☆](https://leetcode.cn/problems/subsets-ii/)

可能会有重复的情况，所以先排序，然后对于相同的情况，在遍历的时候，如果当前元素（需要大于start）跟前一个元素相同，就跳过。

为什么需要大于start，如果i==start的话，start之前的已经完成了存储，那么此时i很明显还是要计算的。

举个例子： 1 2 2 3

假设此时start=1，i=2，2跟前一个2重复，需要跳过，否则就会出现多个[... 1 2]
但是start=2，i=2的时候，前面12都已经弄好了，此时的2虽然跟前一个2
重复，还是得计算进去，否则就会漏掉[... 2 2]的情况

```go
var result [][]int

func subsetsWithDup(nums []int) [][]int{
    result = make([][]int, 0)
    sort.Ints(nums)
    backtrack([]int{}, nums, 0)
    return result
}

func backtrack(temp []int, nums []int, start int)  {
    tmp := make([]int, len(temp))
    copy(tmp, temp)
    result = append(result, tmp)
    for i := start; i < len(nums); i++ {
        if i > start && nums[i] == nums[i-1]{
            continue
        }
        temp = append(temp, nums[i])
        backtrack(temp, nums, i+1)
        temp = temp[:len(temp)-1]
    }
}
```

[LeetCode 491. 递增子序列 ☆☆](https://leetcode.cn/problems/non-decreasing-subsequences)

```go
var result [][]int

func findSubsequences(nums []int) [][]int {
   result = make([][]int, 0)
   backtrack([]int{}, 0, nums)
   return result
}

func backtrack(temp []int, start int, nums []int) {
   if len(temp) > 1 {
      tmp := make([]int, len(temp))
      copy(tmp, temp)
      result = append(result, tmp)
   }
   // 建立一个used字典，对同层元素进行去重
   used := make(map[int]bool, len(nums))
   for i := start; i < len(nums); i++ {
      // 每次同一层的时候才去重，比如[1 2 1 1]，对于一个元素开始，遍历后面的元素
      // 如果发现之前某个值有遍历过，那么后面的值直接跳过，用这个used来去重
      // 每一层重新建立一个used
      if used[nums[i]] {
         continue
      }
      if len(temp) == 0 || nums[i] >= temp[len(temp)-1] {
         temp = append(temp, nums[i])
         used[nums[i]] = true
         backtrack(temp, i+1, nums)
         temp = temp[:len(temp)-1]
      }
   }
}
```

### [LeetCode 698. 划分为k个相等的子集 ☆☆](https://leetcode.cn/problems/partition-to-k-equal-sum-subsets/)

给定一个整数数组 nums 和一个正整数 k，找出是否有可能把这个数组分成 k 个非空子集，其总和都相等。

```go
输入： nums = [4, 3, 2, 3, 5, 2, 1], k = 4
输出： True
说明： 有可能将其分成 4 个子集 (5), (1,4), (2,3), (2,3) 等于总和。
```

说实话这道题的难度应该是hard，真的很难，特别容易超时，需要各种优化技巧，而且回溯也没那么简单。

```go
var memo map[int] bool

func canPartitionKSubsets(nums []int, k int) bool {
	if k > len(nums) {
		return false
	}
	sum := 0
	for _, i := range nums {
		sum += i
	}
	if sum%k != 0 {
		return false
	}
	target := sum / k
	used := 0
	memo = make(map[int] bool)
	return backtrack(k, 0, nums, 0, used, target)
}

// k号桶思考是否要把nums[index]元素装进来。used表示这个元素是否已经被装到其他桶了
// 回溯会遍历所有的可能，如果凑不出的话，可能会出现重复遍历，只是桶换位子的情况。
// 需要在装满一个桶的时候存储used数组，下次再遇到的话就剪枝，用位图表示节约存储提高效率
func backtrack(k int, bucket int, nums []int, start int, used int, target int) bool {
	// 所有桶都装满了
	if k == 0 {
		return true
	}
	// 当前桶装满了，递归下一个桶的选择
	if bucket == target {
		res := backtrack(k-1, 0, nums, 0, used, target)
		memo[used] = res
		return res
	}
	if res, ok := memo[used]; ok {
		return res
	}
	// 从start开始往后找能装的元素
	for i := start; i < len(nums); i++ {
		// 跳过已经被装到其他桶的元素
		if (used >> i) & 1 == 1 {
			continue
		}
		// 跳过放进来会超过限制的元素
		if bucket+nums[i] > target {
			continue
		}
		// 装入当前元素
		used |= 1 << i
		bucket += nums[i]
		// 递归下一个
		if backtrack(k, bucket, nums, i+1, used, target) {
			return true
		}
		// 回溯
		used ^= 1 << i
		bucket -= nums[i]
	}
	return false
}
```


### LeetCode 51: N-Queens

终止条件:
```go
// 遍历到了最后一行
if row==n{
  result = append(result, chessboard)
}
```

处理本层结点，从第一列开始搜
```go
for col:=0;col<n;col++{
  if(isValid(row, col, chessboard, n)){
    chessboard[row][col] = 'Q' // 放置皇后
    backtracking(n, row+1, chessboard)
    chessboard[row][col] = '.' // 回溯，撤销
  }
}
```

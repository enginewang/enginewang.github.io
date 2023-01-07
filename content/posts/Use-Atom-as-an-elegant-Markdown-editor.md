---
title: "Atom的Markdown配置与美化"
date: 2019-03-22T16:12:25+08:00
draft: false
categories: ["生活"]
tags: ["Atom", "markdown", "美化"]
---


## Atom介绍

Atom是一个Github出品的一个开源的免费文本编辑器，和VS Code、Sublime Text是对标产品。

Atom和VS Code一样，都是用Eletron构建的，插件也基本通用，可以认为是平替，我之所以用Atom主要还是因为其界面看上去更清爽，虽然性能比VS Code差，但是内存够大，实际体验也没有什么延迟。

<img src="https://res.cloudinary.com/dbmkzs2ez/image/upload/v1537506574/atom_1.png" width=100%>

如果不清楚markdown的语法，可以访问 [Markdown basics](https://www.markdownguide.org/basic-syntax/)进行学习，markdown的语法和配置都非常简单，比$LaTeX$容易太多了。

通过安装支持markdown插件就可以进行markdown的笔记写作，下面是一些我认为比较好的插件

## Markdown Preview Enhanced

Atom有原生对markdown的支持，但是毕竟简陋，Markdown Preview Enhanced可以扩展更多的功能，比如公式、图床、导出等。

<img src="https://res.cloudinary.com/dbmkzs2ez/image/upload/v1544349042/Annotation_2018-12-09_175025.jpg" width="90%">


## Material UI

Material UI几乎是我所有编辑器的UI（包括Atom、VS Code、Jetbrains全家桶等），这套UI非常优雅和美观。

<img src="https://res.cloudinary.com/dbmkzs2ez/image/upload/v1544348243/Annotation_2018-12-09_173501.jpg" width="90%">


## Title-bar-replacer (windows专用)

Title-bar-replacer可以隐藏掉windows上方比较唐突的白色标题栏，使软件更加一体化。

<img src="https://res.cloudinary.com/dbmkzs2ez/image/upload/v1544348538/Annotation_2018-12-09_174204.jpg" width="90%">


## Markdown-table-editor

Markdown语法写表格非常麻烦，markdown-table-editor可以使得我们在用写表格的时候更加方便，可以通过Tab、Enter等键快速排版

<img src="https://res.cloudinary.com/dbmkzs2ez/image/upload/v1544348803/Annotation_2018-12-09_174619.jpg" width="90%">

### 其他的一些操作

## 修改字体

修改软件界面字体，需要手动修改`styles.less`，通过`File`->`stylesheet`来打开它

修改字体的属性：`atom-text-editor`, 我最喜欢的代码字体是`Fira Code`, 需要在本地电脑先安装[Fira Code](https://github.com/tonsky/FiraCode)，然后修改为：

```CSS
atom-text-editor {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  font-family: "Fira Code";
  font-weight: 500;
  line-height: 1.7;
}

atom-text-editor.editor {
  .syntax--storage.syntax--type.syntax--function.syntax--arrow,
  .syntax--keyword.syntax--operator:not(.accessor),
  .syntax--punctuation.syntax--definition {
    font-family: "Fira Code";
  }

  .syntax--string.syntax--quoted,
  .syntax--string.syntax--regexp {
    -webkit-font-feature-settings: "liga" off, "calt" off;
  }
}
```

如果要修改markdown右侧预览窗口的字体，则需要去markdown-preview-enhanced的theme里修改css。具体的路径为：

Windows通常在

`C:\Users\<USER>\.atom\packages\markdown-preview-enhanced\node_modules\@shd101wyy\mume\styles\preview_theme`

macOS通常在

`/Users/<USER>/.atom/packages/markdown-preview-enhanced/node_modules/@shd101wyy/mume/styles/preview_theme`

选择目前使用的markdown预览样式的css文件，通常是github-light。

打开这个css，然后修改诸如字体等属性：

```css
html body {
  font-family: "Fira Code" ...
}
```

最后的样式：

Windows:

<img src="https://res.cloudinary.com/dbmkzs2ez/image/upload/v1549894263/E8F0C761-0FF4-4739-BFFB-62126E855D78_.png.jpg" width=100%>

MacOS:

<img src="https://res.cloudinary.com/dbmkzs2ez/image/upload/v1585187085/aNa4CHec.png" width="100%">

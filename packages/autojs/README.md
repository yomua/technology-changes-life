# 教程

hamibot 包含 Auto.js 实现, 在 [hamibot Github](https://github.com/hamibot/hamibot) 可以看到 autojs 目录.

hamibot 的 JavaScript 基于 [Rhino 引擎](https://p-bakker.github.io/rhino/)

[Hamibot 的 UI](https://docs.hamibot.com/reference/ui) 系统来自于 Android

# Ref

代码例子:

- [hamibot Github](https://github.com/hamibot/hamibot)

- [如何调用 Java](https://p-bakker.github.io/rhino/tutorials/scripting_java/)

- [Github Auto.js 例子 1](https://github.com/wiatingpub/autojs/tree/master/教程)

- [Github Auto.js 例子 2](https://github.com/520-snow/autojs-/tree/master)

- [Github Auto.js 例子 2](https://github.com/xiaorui16888/AutoJsCode/tree/main)

Android 文档:

hamibot 是支持更底层的 Android 操作的, 相关文档参见以下列出来的目录,

如果以下未列出, 则随便点进去一个链接, 参考左边的目录就能看见更多的文档了.

- [Android UI 相关文档](https://docs.hamibot.com/reference/ui#ui)

- [Android Util](https://developer.android.com/reference/android/util/package-summary)

# hamibot 注意事项

由于 hamibot 的 JS 基于 Rhino 引擎, 所以对于常常编写 js 的开发者来说, 有些语法可能在 hamibot 中不支持,

如下列出不支持的 js 语法:

## 不支持可选链 (`?.`) 和 空值运算符 (`??`)

```js
obj?.yomua; // 不支持

obj.yomua ?? "yomua" ??  // 不支持;
```

## 不支持 `for...in`

```js
// 不支持
for (const key in {}) {
}
```

## 不支持解构赋值有默认值

```js
const { name = "yomua" } = obj; // 不支持
const { a, b } = obj; // 支持
```

## 不支持 class

```js
class Yomua {} // 不支持
```

## 同一个函数中, `if` 没有作用域

```js
// 下面的 name 在 hamibot 中会报重复声明错误
function goYomua() {
  if (conditionA) {
    const name = "yomua1";
  }

  if (conditionB) {
    const name = "yomua2";
  }
}
```

## 共享脚本环境导致变量冲突

由于 hamibot 自身支持的 js 语言环境, 脚本运行环境等诸多问题, 有很多坑点,

所以对于每个脚本文件都建议采用自执行函数包裹.

即: 将脚本文件使用自执行函数包裹, 形成一个单独的作用域, 如:

```js
// store/index.js
(function () {
  const store = {};
  module.exports = store;
})();
```

```js
// src/index.js 或 /hamibot.js
const store = {}; // 不会重复声明的错误, 如果 store/index.js 不使用自执行函数, 则会报重复声明错误
```

为什么这么做, 如下原因:

- 使用 hamibot 读取手机 js 文件, 然后在云端 (网页端) 运行时, 脚本运行的环境很怪,

  分辨哪些脚本是一起的, 哪些是独立的, 会造成大量心智负担, 比如:

  一个脚本的 const 会影响另一个脚本, 即使使用 hamibot 提供的 require 也是一样.

注意: 这无法解决一个脚本里面的变量冲突问题

# 教程

hamibot 基于 Auto.js 实现, 在 [hamibot Github](https://github.com/hamibot/hamibot) 可以看到 autojs 目录.

[Hamibot 的 UI](https://docs.hamibot.com/reference/ui) 系统来自于 Android

## Ref

- [hamibot Github](https://github.com/hamibot/hamibot)

- [Github Auto.js 例子 1](https://github.com/wiatingpub/autojs/tree/master/教程)

- [Github Auto.js 例子 2](https://github.com/520-snow/autojs-/tree/master)

- [Github Auto.js 例子 2](https://github.com/xiaorui16888/AutoJsCode/tree/main)


Android

hamibot 是支持更底层的 Android 操作的, 相关文档参见以下列出来的目录, 

如果以下未列出, 则随便点进去一个链接, 参考左边的目录就有更多的文档了.

- [Android UI 相关文档](https://docs.hamibot.com/reference/ui#ui)

- [Android Util](https://developer.android.com/reference/android/util/package-summary)

# hamibot 注意事项

- 不支持可选链 (`?.`) 和 空值运算符 (`??`)

```js
obj?.yomua; // 不支持

obj.yomua ?? "yomua" ??  // 不支持;
```

- 不支持 `for...in`

```js
// 不支持
for (const key in {}) {
}
```

- 不支持解构赋值有默认值

```js
const { name = "yomua" } = obj; // 不支持
const { a, b } = obj; // 支持
```

- 不支持 class

```js
class Yomua {} // 不支持
```

- 同一个函数中, `if` 没有作用域

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

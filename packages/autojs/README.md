# 教程

hamibot 基于 Auto.js 实现, 在 [hamibot Github](https://github.com/hamibot/hamibot) 可以看到 autojs 目录.

[Hamibot 的 UI](https://docs.hamibot.com/reference/ui) 系统来自于 Android

## Ref

- [hamibot Github](https://github.com/hamibot/hamibot)

- [Github Auto.js 例子 1](https://github.com/wiatingpub/autojs/tree/master/教程)

- [Github Auto.js 例子 2](https://github.com/520-snow/autojs-/tree/master)

- [Github Auto.js 例子 2](https://github.com/xiaorui16888/AutoJsCode/tree/main)

- [Android UI 相关文档](https://docs.hamibot.com/reference/ui#ui)

# hamibot 注意事项

- 支持模板字符串

如:

```js
const str = "test " + name; // 支持
```

- 不支持可选链 (`?.`) 和 `??`

```js
obj?.a; // 不支持

obj.a ?? "1" ??  // 不支持;
```

- 不支持 `for...in`

```js
// 不支持
for (const key in {}) {
}
```

- 不支持解构赋值有默认值

```js
const { a = 1, b = 2 } = obj; // 不支持
const { a, b } = obj; // 支持
```

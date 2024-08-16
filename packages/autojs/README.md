# 教程

hamibot 基于 Auto.js 实现, 在 [hamibot Github](https://github.com/hamibot/hamibot) 可以看到 autojs 目录.

[Hamibot 的 UI](https://docs.hamibot.com/reference/ui) 系统来自于 Android

## Ref

- [hamibot Github](https://github.com/hamibot/hamibot)

- [Github Auto.js 例子 1](https://github.com/wiatingpub/autojs/tree/master/教程)

- [Github Auto.js 例子 2](https://github.com/520-snow/autojs-/tree/master)

- [Github Auto.js 例子 2](https://github.com/xiaorui16888/AutoJsCode/tree/main)

# hamibot 注意事项

- 使用模板字符串报错

hamibot 不支持 ` `` ` 语法,

如:

```js
const str = `test ${name}`; // 不支持

const str = "test " + name; // 支持
```

- 不支持可选链 (`?.`)

```js
obj?.a; // 不支持
```

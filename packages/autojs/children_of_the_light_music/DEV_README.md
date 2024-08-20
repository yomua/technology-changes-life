# 描述

仅给此项目开发者看的说明文档

其他参见 autojs/README.md

# 约定

由于 hamibot 自身支持 js 语言环境, 脚本运行环境等诸多问题, 有很多坑点, 所以为了避免踩坑, 所以需要做一些约定.

## 约定全部使用 let, 除非你确定不会冲突, 才使用 constant

使用 hamibot 读取手机 js 文件, 然后在云端 (网页端) 运行时, 脚本运行的环境很怪,

分辨哪些脚本是一起的, 哪些是独立的, 会造成大量心智负担, 所以约定:

- 能使用 let 的地方使用 let, 除非你确定不会冲突, 才使用 constant

- 如果使用 engines 执行脚本文件, 这会创建一个全新的脚本环境, 不和其他环境共享变量.

  但这不是一定的, 所以为了保证正确性, 还是使用 let,

  或者你使用 constant 时, 不会报错, 那就使用它.

## 如何解决脚本和脚本之间的变量冲突

将文件使用自执行函数包裹, 形成一个单独的作用域, 如:

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

注意: 这无法解决一个脚本里面的变量冲突问题

# 解析 .mid 文件

Ref: 此项目解析 [mid 文件规范说明](https://github.com/colxi/midi-parser-js/wiki/MIDI-File-Format-Specifications)

## mid 事件

mid 事件指的是被转为 json 数据的 mid 文件的 track[n].event 字段

详细参见: `asset/mid数据说明.js`

```json
"event": [
  { "deltaTime": 0, "type": 255, "metaType": 88, "data": [3, 2, 24, 8] },
  { "deltaTime": 2, "type": 11, "channel": 0, "data": [7, 100] },
]
```

## 解析流程

1. 确认 mid 中音符和游戏键的映射关系

如:

音符有 C、D、E、F、G、A、B, 也表示为 do、re、mi、fa、sol、la、si, 也表示为数字 1、2、3、4、5、6、7

- 游戏中的低音 do 对应 C3 ~ C6

- 游戏中的高音 do 对应 C7 ~ C10

其他音符以此类推

Cn, Dn...: n 表示音符的音节, C3 低, C4 高一点 以此类推, 但是都代表 C (即: do)

Ref: [midi 音符](https://blog.csdn.net/hans_yu/article/details/113818152)

2. 解析 mid, 得到音符数据

在解析 mid 文件后，你会得到一系列包含音符信息的事件。

每个事件会包含音符编号（data[0]）和音符力度（data[1]）等信息。

3. 过滤并映射 MIDI 音符

根据上一步的键映射关系，筛选出 mid 文件中对应的音符，忽略不在此范围内的音符。

4. 处理 mid 的每个事件 (每个音符数据)

- 得到一个节拍速度: type === 81 的 data, 单位为微秒, 或默认 500ms

  得到一个节拍分为多少个 ticks: timeDivision 字段是多少就是多少个 ticks

  得到每个音符有几个 ticks: deltaTime, deltaTime 是几就是几个 ticks

- 将 deltaTime 转为 delay

  1 个 ticks 的事件毫秒单位计算公式: `每拍毫秒 / timeDivision * deltaTime`

- 将 data[0] 转为对应游戏按键

5. 解析 lrc 歌词文件

如果 mid 文件有对应的 lrc 文件，那么解析 lrc 文件得到歌词数据。

6. 解析处理好的音符数据和歌词数据, 转为此项目需要的 json 文件

得到 json 文件后, 就可以解析此 json, 从而通过模拟按键来播放音乐

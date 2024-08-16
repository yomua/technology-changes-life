# children_of_the_light_music

## 介绍

光遇弹琴脚本，仅供学习使用

## 使用说明

1.  下载源文件并解压缩：[源文件](https://gitee.com/yomua/children_of_the_light_music)

2.  手机根目录创建 children_of_the_light_music 文件夹

3.  将 src 和 asset 直接放入 children_of_the_light_music 文件夹

4.  在 hamibot.com 中创建脚本，参见：[创建脚本](https://docs.hamibot.com/tutorials/tutorial-create-script)

5.  将 hamibot.js 复制到创建的脚本，点击运行

# 解析 midi

## 说明

Ref: [midi 格式](https://github.com/colxi/midi-parser-js/wiki/MIDI-File-Format-Specifications)

在一些 MIDI 文件中，Note Off 事件可能不会用 type 为 8 的事件来表示，

而是使用 type 为 9 的事件，并且 data[1]（音符力度）为 0 来表示。

这种方式比较常见，也是 MIDI 文件的规范之一。

## 解析流程

光遇 16 个按键，

低音 do、re、mi、fa、sol、la、si do，

以及高音的 do、re、mi、fa、sol、la、si do.

1. 确认 midi 中音符和游戏键的映射关系

假设：

- 低音的 do 对应 MIDI 编号 60（中央 C）。

- 低音 do 到高音 do 的范围为 60 - 72（不包括高音的 do）。

  即, 低音: do、re、mi、fa、sol、la、si

2. 解析 midi, 得到音符数据

在解析 MIDI 文件后，你会得到一系列包含音符信息的事件。

每个事件会包含音符编号（data[0]）和音符力度（data[1]）等信息。

3. 过滤并映射 MIDI 音符

根据上一步的键映射关系，筛选出 MIDI 文件中对应的音符，忽略不在此范围内的音符。

如果音符落在 60-66 或 72-78 之间，将它们映射到对应的按键编号。

4. 处理 midi 的每个事件

```js
// 持续时间计算
const timeDivision = 480; // 假设的时间分割，基于 MIDI 文件的 timeDivision
const noteOnEvents = {}; // 用来存储每个音符的 "Note On" 事件的时间戳

parsedMidiEvents.forEach((event, index) => {
  const { deltaTime, type, data } = event;

  // 计算当前事件的实际时间
  const timeInMs = deltaTime * (500 / timeDivision);

  if (type === 9 && data[1] > 0) {
    // "Note On" 事件
    noteOnEvents[data[0]] = timeInMs;
  } else if (type === 8 || (type === 9 && data[1] === 0)) {
    // "Note Off" 事件
    const note = data[0];
    if (noteOnEvents[note] !== undefined) {
      const pressDuration = timeInMs - noteOnEvents[note];
      // 这里可以存储或处理 pressDuration，例如添加到你的 JSON 结构中
      console.log(`Note ${note} 持续时间: ${pressDuration} ms`);

      // 处理完成后删除记录的 "Note On" 时间
      delete noteOnEvents[note];
    }
  }
});
```

```js
const parsedMidiEvents = []; // 假设你已经解析好的 MIDI 事件数组
const keyMapping = {
  60: 1,
  61: 2,
  62: 3,
  63: 4,
  64: 5,
  65: 6,
  66: 7, // 低音

  72: 8,
  73: 9,
  74: 10,
  75: 11,
  76: 12,
  77: 13,
  78: 14, // 高音
};

const result = [];
let currentGroup = { data: [] };

parsedMidiEvents.forEach((event) => {
  const key = keyMapping[event.data[0]];
  if (key) {
    // 根据每个音符的“Note On”和“Note Off”事件之间的时间差来进行计算 (ms)
    const pressDuration = calculatePressDuration(event); // 计算持续时间的函数
    const delay = event.deltaTime * (500 / timeDivision); // 计算延迟时间

    currentGroup.data.push([delay, { key, pressDuration }]);

    if (currentGroup.data.length >= 6) {
      result.push(currentGroup);
      currentGroup = { data: [] };
    }
  }
});

if (currentGroup.data.length > 0) {
  result.push(currentGroup);
}
```

5. 合并歌词数据

```js
const midiData = [
  {
    words: "我要这天再遮不住我眼",

    time: 10, // 单位 s

    data: [
      [500, { key: 1, delay: 10, pressDuration: 10 }, { key: 2 }],
      [1000, { key: 3, pressDuration: 2410 }, { key: 4, pressDuration: 2410 }],
    ],
  },
];

// 将歌词合并到 MIDI 数据中
const mergedData = lyrics.map((lyric) => {
  const correspondingMidi = midiData.find(
    (midi) => Math.abs(midi.time - lyric.time) < 1
  ); // 精确度为1秒
  return {
    words: lyric.words,
    time: lyric.time,
    data: correspondingMidi ? correspondingMidi.data : [],
  };
});

console.log(mergedData);
```

- 解析歌词：将 .lrc 文件中的歌词解析为包含时间戳和文本的对象数组。

- 解析 MIDI：将 MIDI 文件解析为音符事件，并计算每个事件的时间和持续时间。

- 合并歌词和 MIDI 数据：

  - 根据时间戳对歌词和 MIDI 数据进行匹配。可以设置一个允许的时间差，例如 1 秒，以找到最接近的 MIDI 事件。

  - 为每个歌词条目附加对应的 MIDI 操作数据。

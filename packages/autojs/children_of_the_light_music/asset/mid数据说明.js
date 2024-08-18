const a = {
  //0: 1个轨道 2:有多个轨道 3: 0 和 1合并
  formatType: 1,

  // 2 个轨道
  tracks: 2,

  // 每个四分音符（即一个节拍）被分为 480 个 ticks
  timeDivision: 480,

  // 轨道
  track: [
    {
      // 轨道1 的事件
      event: [
        /**
         * type: 8 - Note Off: 用于停止播放指定的音符。
         * -> type:9 data[1]（音符力度）为 0: 也表示停止播放音符
         * type: 9 - Note On: 播放指定音符
         * type: 10 - Polyphonic Key Pressure (Aftertouch): 用于传输每个按键的压力或触摸感应。
         * type: 11 表示控制器变化事件，用于实时控制不同的参数。
         * type: 12 表示音色变化事件，用于改变乐器音色。
         * type: 14 - Channel Pressure (Aftertouch): 用于传输整个通道的压力或触摸感应。
         * type: 15 - Pitch Bend: 用于改变音符的音高。
         * type: 255 Meta Event, 用于提供附加的音乐信息。
         *
         * metaType===3, data: "\u0000": 歌词数据, 这里没有
         * metaType===81, data:909091 - 表示节拍事件，data 则表示每拍的时间(微秒)
         * metaType 88 表示 SMPTE 偏移，用于时间码的设置。
         * metaType 89 表示时间签名事件，具体拍号信息。
         *
         * deltaTime: 表示此事件与前一个事件之间的时间延迟几个 tick
         * => 转成ms: (metaType===81.data / 1000) / timeDivision * deltaTime
         * => metaType===81.data / 1000: 每个节拍的时间, 单位 ms
         * => 每个节拍的时间 / timeDivision = 每隔 tick 的时间(ms)
         *
         * data[0]: 指定的音符
         * data[1]: 按下音符的用力程度
         */

        { deltaTime: 0, type: 255, metaType: 3, data: "\u0000" },
        { deltaTime: 0, type: 255, metaType: 88, data: [4, 2, 24, 8] },
        { deltaTime: 0, type: 255, metaType: 89, data: 64768 },
        { deltaTime: 0, type: 255, metaType: 81, data: 909091 },
        { deltaTime: 0, type: 11, channel: 0, data: [121, 0] },
        { deltaTime: 0, type: 12, channel: 0, data: 0 },
        { deltaTime: 0, type: 255, metaType: 33, data: 0 },
        { deltaTime: 0, type: 9, channel: 0, data: [72, 80] },
        { deltaTime: 1, type: 255, metaType: 47 },
      ],
    },
    {
      // 轨道2 的事件
      event: [
        { deltaTime: 0, type: 255, metaType: 3, data: "\u0000" },
        { deltaTime: 0, type: 255, metaType: 89, data: 64768 },
        { deltaTime: 0, type: 11, channel: 1, data: [121, 0] },
        { deltaTime: 0, type: 12, channel: 1, data: 0 },
        { deltaTime: 0, type: 11, channel: 1, data: [7, 100] },
        { deltaTime: 0, type: 255, metaType: 33, data: 0 },
        { deltaTime: 1, type: 255, metaType: 47 },
      ],
    },
  ],
};

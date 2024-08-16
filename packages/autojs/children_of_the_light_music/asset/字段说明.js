// 每个对象表示一轮操作
// 比如: 第一次同时按下 1, 2 键, 第二次同时按下 3, 4 键, 然后这轮完成

[
  {
    // 这个目前没什么用, 只是来帮助你区分这轮操作播放的是哪句歌词
    words: "我要这天再遮不住我眼",

    // 歌词的起始时间
    // 进度条和显示歌词时需要使用到它
    // 即: 当前歌词, 应该 time 秒时播放
    time: 10, // 单位 s

    // 需要按下几次, 每个子数组表示按下一次
    data: [
      // 按下一次
      // 每个对象表示此次按下, 会同时按下的键 (混音)
      [
        // 延迟多久 ms, 才触发此次按下
        500,
        {
          key: 1, // 按下键 1
          delay: 10, // 此键延迟多久按下  ms
          pressDuration: 10, // 此键按下持续时间  ms
        },
        {
          // 由于键 1 延迟 10ms, 所以会先按下 2, 然后过 10ms 按下 1, 并持续 10ms, 才松开
          key: 2, // 按下键 2
        },
      ],
      [
        1000,
        {
          key: 3,
          pressDuration: 2410,
        },
        {
          key: 4,
          pressDuration: 2410,
        },
      ],
    ],
  },
  {
    words: "bbb",
    time: 20,
    data: [
      [
        2000,
        {
          key: 5,
        },
        {
          key: 6,
        },
      ],
      [
        2000,
        {
          key: 7,
        },
        {
          key: 8,
        },
      ],
    ],
  },
  {
    words: "ccc",
    time: 30,
    data: [
      [
        500,
        {
          key: 9,
        },
        {
          key: 10,
        },
      ],
      [
        500,
        {
          key: 11,
        },
        {
          key: 12,
        },
      ],
    ],
  },
];

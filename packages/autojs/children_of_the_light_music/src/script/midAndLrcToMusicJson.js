/**
 * 读取 asset/ 下的 lrc 和 mid 文件, 并将之解析为 .json 格式, 以对应游戏按键
 * - mid 是必须的, lrc 是可选的
 * - 若没有 lrc, 则只解析 mid
 * - 若有 lrc, 则将 mid 与 lrc 合并, 将携带歌词数据
 */

const { useShareData } = engines.myEngine().execArgv;

let { srcDir, packagesDir, rootDir, assetDir } = useShareData();

let { parseLrc, polyfillForIn } = require(srcDir + "/tools.js");
const MidiParser = require(`${packagesDir}/midi-parset-js/midi-parset-js.js`);

/** 将 lrc 转换为具有 words 和 time 的数据
 * @param {string} lrcContent
 * @returns { {words: string, time: numberS, data[]}[] }
 */
function getLrcToLyricData(lrcContent) {
  if (!lrcContent) {
    console.log("lrc 数据不存在");
    return;
  }

  const formatLrc = parseLrc(lrcContent);
  const result = formatLrc.ms.map((lrc) => {
    return {
      words: lrc.lyric, // 歌词
      time: lrc.time, // 秒
      data: [],
    };
  });

  return result;
}

/** 将 midi 文件转成具有 delay, key 的数据
 * @param {Uint8Array} midiSourceBytes
 * @param { {bpmMS:number } } config
 * @returns { {delay: numberMS, key: numberGameKey}[] }
 */
function getMidiToKeyData(midiSourceBytes, config) {
  if (!midiSourceBytes) {
    console.log("midiSourceBytes 不存在");
    return;
  }

  let { bpmMS } = config || {
    bpmMS: 500,
  };

  /** 游戏键和 midi 音符映射: https://blog.csdn.net/hans_yu/article/details/113818152
   * key: 游戏键; value: 音符编码
   * Cn Dn En Fn Gn An Bn
   * => C 代表 do, 以此类推 -> do re mi fa so la xi 或者 1 2 3 4 5 6 7
   * => n 代表音阶, 比如: C0, C1, C2, 都是 do, 只不过音阶不同
   */
  const midiNoteMapGameKey = {
    // 低音: do ~ si
    1: [36, 48, 60, 72], // 把 C3 ~ C6 的 do 认为是低音
    2: [38, 50, 62, 74],
    3: [40, 52, 64, 76],
    4: [41, 53, 65, 77],
    5: [43, 55, 67, 79],
    6: [45, 57, 69, 81],
    7: [47, 59, 71, 83], // 低音

    // 高音: do ~ si
    8: [84, 96, 108, 120], // C7 ~ C10 do 认为是高音
    9: [86, 98, 110, 122],
    10: [88, 100, 112, 124],
    11: [89, 101, 113, 125],
    12: [91, 103, 115, 127],
    13: [93, 105, 117],
    14: [95, 107, 119], // 高音

    // 70~84
    15: [84, 96, 108, 120], // 最高音 do
  };

  // 所有映射游戏键的 midi 音符
  const allMidiNoteMapGameKey = [];

  polyfillForIn(midiNoteMapGameKey, (key, value) => {
    value.forEach((midiNote) => {
      allMidiNoteMapGameKey.push(midiNote);
    });
  });

  // 解析 midi 文件, 如何解析的规范参见: https://github.com/colxi/midi-parser-js/wiki/MIDI-File-Format-Specifications
  const Base64 = android.util.Base64;
  let base64String = "";
  try {
    base64String = Base64.encodeToString(midiSourceBytes, Base64.DEFAULT);
  } catch (error) {
    console.log("传入的 midi 数据有误或当前环境不支持 Android 语法");
  }

  /** 音符数据
   * 详细参见: asset/mid数据说明.js
   * @returns { {
   *     formatType: 1|2|3,
   *     tracks: number,
   *     timeDivision:number,
   *     track:{
   *       event:{
   *         deltaTime, type, metaType?, channel, data:number|number[]
   *       }[]
   *     }[]
   *   }
   * }
   */
  const midiData = MidiParser.parse(base64String);

  /** 只保留第一个音轨, 以及能对应游戏键的音符数据
   * @returns {
   *   {
   *     "deltaTime": numberTicks, "type": 9, "channel": 0, "data": [69, 0]
   *   }[]
   * }
   */
  const filterMidiData = midiData.track[0].event.filter((item) => {
    // 得到每个拍子的时间
    // metaType === 81: 节拍事件
    if (item.metaType === 81) {
      // item.data: 每个拍子时间, 需要 item.data 微秒
      bpmMS = item.data / 1000; // 转成毫秒
    }

    if (
      Array.isArray(item.data) &&
      allMidiNoteMapGameKey.includes(item.data[0])
    ) {
      return true;
    }

    return false;
  });

  /** 将 midi 数据中的 deltaTime 转成 delay (ms), 以及将 data[0] 音符转成游戏按键
   * @returns { { "delay": numberMS, "key": numberGameKey }[] }
   */
  const changeDeltaDataToDelayAndKey = filterMidiData.map((item) => {
    const { deltaTime, type, channel, data } = item;

    let gameKey = null; // 1 ~ 15

    // timeDivision: 每个拍子(即一个四分音符)被分为多少个 (假如: 480个) ticks
    // deltaTime: 表示几个 ticks
    // 那每个 ticks 是多少毫秒?
    // => bpmMS / timeDivision = 每个 tick 多少毫秒
    const delay = deltaTime * (bpmMS / midiData.timeDivision);

    polyfillForIn(midiNoteMapGameKey, (key, value) => {
      if (value.includes(data[0])) {
        gameKey = +key; // key: number
      }
    });

    return {
      delay: +delay.toFixed(2),
      key: gameKey,
    };
  });

  return changeDeltaDataToDelayAndKey;
}

/** 将 midi 文件转成的按键数据, 以多个项的累计延迟间m 是否小于歌词时间划分为一组, 最后插入到通过 lrc 文件解析的歌词数据中
 * @param {{words:string, time:numberMS, data:[] }[]} lyricData
 * @param {{delay:numberMS, key:number}[]} midiToKeyData
 * @returns { {words:string, time:numberMS, data:[numberDelayMS, {delay:numberMS, key:number}][] }[]  }
 */
function mergeMidiKeyDataAndMusicData(lyricData, midiToKeyData) {
  // 深克隆, 不要影响 lyricData
  const result = lyricData.map((item) => ({
    words: item.words,
    time: item.time,
    data: [],
  }));

  let accumulatedDelay = 0; // 累计延迟时间 ms
  let currentIndex = 0; // lyricData 索引, 是否要往下一句歌词移动

  midiToKeyData.forEach((keyInfo) => {
    // 累计延迟时间
    accumulatedDelay += keyInfo.delay;

    // 直到多个项累计延迟时间 > 歌词时间, 就划分为一组
    // => 移动 currentIndex, 即: 移动到下一句歌词, 准备插入接下来的按键数据
    while (
      currentIndex < result.length && // 不是最后的索引
      accumulatedDelay / 1000 > result[currentIndex].time // time 是秒单位, 所以 accumulatedDelay 需要除以 1000
    ) {
      currentIndex++;
    }

    if (currentIndex < result.length) {
      result[currentIndex].data.push([0, keyInfo]);
    }
  });

  return result;
}

const assetFileList = files.listDir(assetDir);

// 歌词是可选的, 没有歌词也能有按键数据
const assetLrcList = assetFileList.filter((fileName) =>
  fileName.endsWith(".lrc")
);

// 必须有 mid 文件才能自动解析对应的游戏按键数据
const assetMidList = assetFileList.filter((fileName) =>
  fileName.endsWith(".mid")
);

// 通过 mid 文件, lrc 文件, 得到 json 游戏按键数据和歌词数据 (若有)
assetMidList.forEach((midFileName) => {
  const name = midFileName.split(".")[0];

  // mid 文件有没有对应的 lrc 文件
  const isHaveLrc = assetLrcList.includes(`${name}.lrc`);

  if (isHaveLrc) {
    const lyricData = getLrcToLyricData(files.read(`${assetDir}/${name}.lrc`));
    const midiToKeyData = getMidiToKeyData(
      files.readBytes(`${assetDir}/${name}.mid`),
      JSON.parse(files.read(`${rootDir}/config.json`))
    );
    const mergeData = mergeMidiKeyDataAndMusicData(lyricData, midiToKeyData);
    files.write(`${assetDir}/${name}.json`, JSON.stringify(mergeData));

    return;
  }

  // 没有歌词数据, 则只有按键数据
  const midiToKeyDataForNotHaveLrc = getMidiToKeyData(
    files.readBytes(`${assetDir}/${name}.mid`),
    JSON.parse(files.read(`${rootDir}/config.json`))
  );

  let accDelayMS = 0;

  const notHaveLrcMusicData = midiToKeyDataForNotHaveLrc.map((keyData) => {
    // 歌词的开始时间 time: 相当于前面的所有 delay 相加
    // => 因为前面的延迟时间结束, 才会开始播放当前歌词
    // 而为什么当前 delay 刚好是上一个歌词 delay 结束? 
    // => 这是因为在当前 delay 等待过程中, 上一个歌词正在播放, 而它刚好播放结束, 就是当前歌词等待结束, 这是 mid 文件中已经设置过的
    accDelayMS += keyData.delay;

    return {
      words: "",
      time: accDelayMS / 1000, // time 单位是秒
      data: [[0, keyData]],
    };
  });

  files.write(`${assetDir}/${name}.json`, JSON.stringify(notHaveLrcMusicData));
});

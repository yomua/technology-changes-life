/** 这是使用 node 环境的, 版本需要在 16.15.0 及以上
 * 读取 asset/ 下的 lrc 和 mid 文件, 并将之解析为 .json 格式, 以对应游戏按键
 * - mid 是必须的, lrc 是可选的
 * - 若没有 lrc, 则只解析 mid
 * - 若有 lrc, 则将 mid 与 lrc 合并, 将携带歌词数据
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { parseLrc, polyfillForIn } from "../tools.js";
import MidiParser from "midi-parser-js";

const __filename = fileURLToPath(import.meta.url);
// D:*/children_of_the_light_music
const rootDir = path.dirname(path.join(__filename, "../../"));

const srcDir = path.resolve(rootDir, "src");
const packagesDir = path.resolve(rootDir, "packages");
const distDir = path.resolve(rootDir, "dist");
const assetDir = path.resolve(rootDir, "asset");

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

  // 得到所有可以映射游戏键的 midi 音符
  const allMidiNoteMapGameKey = [];
  polyfillForIn(midiNoteMapGameKey, (key, value) => {
    value.forEach((midiNote) => {
      allMidiNoteMapGameKey.push(midiNote);
    });
  });

  // 解析 midi 文件, 如何解析的规范参见: https://github.com/colxi/midi-parser-js/wiki/MIDI-File-Format-Specifications
  let base64String = "";
  try {
    base64String = midiSourceBytes;
  } catch (error) {
    console.log("传入的 midi 数据有误或当前环境不支持 Android 语法");
  }

  /** midi 文件转成音符 JSON 数据
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
  // fs.writeFileSync(`${assetDir}/midiData.json`, JSON.stringify(midiData));

  // 计算 bpmMS
  midiData.track.forEach((track) => {
    const event = track.event.find((event) => event.metaType === 81);
    if (event) {
      bpmMS = event.data / 1000;
    }
  });
  console.log(`bpmMS: ${bpmMS}`);

  // 得到主音轨
  const melodyTrack = findPotentialMelodyTracks(midiData);

  // 得到每个音符的 delay 和 duration, 并删除音符松开事件
  const filterTrackEvent = parseMidiEvents(
    melodyTrack.event,
    midiData.timeDivision,
    bpmMS
  );

  // 过滤掉非音符事件, 以及过滤掉不在游戏键范围内的音符
  const filterNonNoteEvent = filterTrackEvent.filter(
    (item) =>
      Array.isArray(item.data) &&
      item.type === 9 &&
      allMidiNoteMapGameKey.includes(item.data[0])
  );
  fs.writeFileSync(
    `${assetDir}/filterNonNoteEvent.json`,
    JSON.stringify(filterNonNoteEvent)
  );

  /** 将 midi 数据中的 deltaTime 转成 delay (ms), 以及将 data[0] 音符转成游戏按键
   * @returns { { "delay": numberMS, "key": numberGameKey }[] }
   */
  const changeDeltaDataToDelayAndKey = filterNonNoteEvent.map((item) => {
    const { deltaTime, type, channel, data } = item;

    let gameKey = null; // 1 ~ 15

    // timeDivision: 每个拍子(即一个四分音符)被分为多少个 (假如: 480个) ticks
    // deltaTime: 表示几个 ticks
    // 那每个 ticks 是多少毫秒?
    // => bpmMS / timeDivision = 每个 tick 多少毫秒
    // const delay = deltaTime * (bpmMS / midiData.timeDivision);

    polyfillForIn(midiNoteMapGameKey, (key, value) => {
      if (value.includes(data[0])) {
        gameKey = +key; // key: number
      }
    });

    return {
      delay: item.delay,
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
      currentIndex <= result.length - 1 && // 当索引 小于等于 最后一句歌词
      accumulatedDelay / 1000 > result[currentIndex].time // time 是秒单位, 所以 accumulatedDelay 需要除以 1000
    ) {
      currentIndex++;
    }

    if (currentIndex <= result.length - 1) {
      result[currentIndex].data.push([0, keyInfo]);
    }
  });

  return result;
}

/** 如果有多个音轨， 那么找到最有可能是主旋律的音轨
 *
 * @param { {
 *     formatType: 1 | 2 | 3,
 *     tracks: number,
 *     timeDivision:number,
 *     track:{
 *       event:{
 *         deltaTime, type, metaType?, channel, data:number|number[]
 *       }[]
 *     }[]
 *   }
 * } midData
 *
 * @returns {{
 *  event:{
 *    deltaTime, type, metaType?, channel, data:number|number[]
 *  }[]
 * }} tractEvent
 */
function findPotentialMelodyTracks(midData) {
  const data = midData.track
    .map((track, index) => {
      // 得到所有音符音符按下事件, 不包含音符松开事件
      const noteOnEvents = track.event.filter(
        (event) => event.type === 9 && event.data[1] !== 0
      );
      // 所有音调
      const pitches = noteOnEvents.map((event) => event.data[0]);

      // 平均音调
      const averagePitch =
        pitches.reduce((acc, musicNote) => acc + musicNote, 0) / pitches.length;

      return {
        trackIndex: index, // 音轨索引
        noteCount: noteOnEvents.length, // 音符数量
        averagePitch,
        pitchRange: Math.max(...pitches) - Math.min(...pitches),
      };
    })
    // 根据音符数量或音调范围降序
    // 音符越多, 则认为是主旋律;
    // 如果音符相同, 音调范围越大, 则认为是主旋律
    .sort((a, b) => b.noteCount - a.noteCount || b.pitchRange - a.pitchRange);

  return midData.track[data[0].trackIndex];
}

/** 解析音轨事件数据: 计算每个音符的 duration(ms) 和 delay(ms),
 * 由于音符有了 duration, 所以就不需要再保留音符松开事件
 * => type === 8 或 type === 9 && data[1] === 0 即为音符松开事件
 *
 * @param { {
 *    deltaTime: number, type: number, metaType: number,
 *    data: number | [number, number]
 *  }[]
 * } trackEvent 音轨
 * @param { number } timeDivision 每拍的的 ticks 数
 * @param { numberMS } secondsPerBeat 每拍的时间 ms
 * @returns {{
 *    deltaTime: number, type: number, metaType: number,
 *    data: number | [number, number],
 *    delay: numberMS,
 *    duration: numberMS,
 *  }[]
 * }
 */
function parseMidiEvents(trackEvent, timeDivision, secondsPerBeat) {
  const tickDuration = secondsPerBeat / timeDivision;
  let accumulatedDelayTime = 0; // 累计延迟时间
  let noteOnEvents = {};

  return trackEvent.reduce((result, event) => {
    if (event.type === 9 && event.data[1] !== 0) {
      // 音符按下事件
      const delay = event.deltaTime * tickDuration;
      accumulatedDelayTime += delay;
      result.push({
        deltaTime: event.deltaTime,
        type: event.type,
        channel: event.channel,
        data: event.data,
        delay: delay,
        duration: 0, // We'll calculate this later
      });

      // 存储音符按下事件数据
      noteOnEvents[event.data[0]] = {
        event: result[result.length - 1],
        time: accumulatedDelayTime,
      };
    } else if (event.type === 9 && event.data[1] === 0) {
      // 音符松开事件
      const delay = event.deltaTime * tickDuration;
      accumulatedDelayTime += delay;

      // 当音符松开时, 取出刚才此音符的按下事件数据
      const noteOnEvent = noteOnEvents[event.data[0]];
      if (noteOnEvent) {
        // 此音符按下事件的索引(包括), 到此索引(包括)之前, 所有项累计起来的延迟时间
        // 相当于: 所有截至到当前音符松开(包括)的累计延迟时间 - 此音符按下事件时的索引(包括), 到此索引(包括)之前, 所有项累计起来的延迟时间
        // => 就能得出此音符, 从开始按下, 到松开时, 历经了多少时间
        // => 不会计算此音符按下事件时的延迟时间, 因为当延迟时间表示的是, 具体上一个音符事件, 应该延迟多久按下.
        // => 会计算松开时的延迟时间
        const duration = accumulatedDelayTime - noteOnEvent.time;
        noteOnEvent.event.duration = duration;

        // 当一个音符松开时, 将此音符从 active noteOnEvents 中删除
        // 因为接下来可能会有相同的音符再次按下, 以免冲突.
        delete noteOnEvents[event.data[0]];
      }
    } else {
      // 无音符事件(按下, 松开)，只需添加它们并计算延迟即可
      const delay = event.deltaTime * tickDuration;
      accumulatedDelayTime += delay;
      result.push({
        deltaTime: event.deltaTime,
        type: event.type,
        channel: event.channel,
        data: event.data,
        delay: delay,
        duration: 0, // 非音符事件，不需要计算延迟
      });
    }

    return result;
  }, []);
}

const assetFileList = fs.readdirSync(assetDir);

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

  const midFileBase64 = fs.readFileSync(`${assetDir}/${name}.mid`, "base64");
  const configData = JSON.parse(
    fs.readFileSync(`${rootDir}/config.json`, "utf-8")
  );

  if (isHaveLrc) {
    const lyricData = getLrcToLyricData(
      fs.readFileSync(`${assetDir}/${name}.lrc`, "utf-8")
    );
    const midiToKeyData = getMidiToKeyData(midFileBase64, configData);
    fs.writeFileSync(
      `${assetDir}/midiToKeyData.json`,
      JSON.stringify(midiToKeyData)
    );
    const mergeData = mergeMidiKeyDataAndMusicData(lyricData, midiToKeyData);
    fs.writeFileSync(`${assetDir}/${name}.json`, JSON.stringify(mergeData));
    return;
  }

  // 没有歌词数据, 则只有按键数据
  const midiToKeyDataForNotHaveLrc = getMidiToKeyData(
    midFileBase64,
    configData
  );

  // fs.writeFileSync(
  //   `${assetDir}/midiToKeyDataForNotHaveLrc.json`,
  //   JSON.stringify(midiToKeyDataForNotHaveLrc)
  // );

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

  // 写入只有按键数据, 没有歌词数据的音乐 JSO你 文件
  fs.writeFileSync(
    `${assetDir}/${name}.json`,
    JSON.stringify(notHaveLrcMusicData)
  );
});

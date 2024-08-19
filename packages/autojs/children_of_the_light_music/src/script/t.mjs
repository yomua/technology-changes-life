import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
// D:*/children_of_the_light_music
const rootDir = path.dirname(path.join(__filename, "../../"));

const srcDir = path.resolve(rootDir, "src");
const packagesDir = path.resolve(rootDir, "packages");
const distDir = path.resolve(rootDir, "dist");
const assetDir = path.resolve(rootDir, "asset");

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
 *  deltaTime: number, type: number, metaType: number,
 *  data: number | [number, number],
 *  delay: numberMS,
 *  duration: numberMS,
 * }}
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

const midData = fs.readFileSync(path.join(assetDir, "midiData.json"), "utf-8");

const result = parseMidiEvents(
  JSON.parse(midData).track[0].event,
  +JSON.parse(midData).timeDivision,
  909091
);

console.log(JSON.parse(midData).track[0].event.length);
console.log(result.length);

fs.writeFileSync(
  path.join(assetDir, "result.json"),
  JSON.stringify(result, null, 2)
);

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
 * }}
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

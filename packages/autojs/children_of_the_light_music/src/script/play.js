// 按下指定的键

const { keyData: musicData } = engines.myEngine().execArgv;

if (!musicData) {
  toast("不存在按键数据");
  exit();
}

let storage = storages.create("children_of_the_light_music");

let SRC_DIR = "/storage/emulated/0/children_of_the_light_music/src";

let { musicKeyPrefix } = require(SRC_DIR + "/constant.js");

let { getXYForStorage } = require(SRC_DIR + "/tools.js");

function handleExit() {
  threads.shutDownAll();
  exit();
}

/**
 * number: 本轮操作延迟多久执行
 * delay: 在本轮操作中，某个手势延迟多久执行
 * @param {{
 *  words: string
 *  time: string
 *  data: Array<number | {key: number, delay: number, pressDuration: number} []>
 * }} param
 */
function runPress({ data }) {
  if (ui.isUiThread()) {
    toast("runPress 禁止在 UI 线程中执行");
    return;
  }

  if (!data || !data.length) {
    toast("当前数据错误");
    return;
  }

  data.forEach((word) => {
    if (!word.length) {
      toast("当前数据错误");
      return;
    }

    if (word.length > 6) {
      toast("暂不支持更多键的按压");
      return;
    }

    if (typeof word[0] === "number") {
      sleep(word[0]);
      // 延迟操作结束后, 只保留需要按下的键
      word = word.filter((v) => typeof v !== "number");
    }

    const currentPressKey = word.map((obj) => {
      // key : 1,2,3,4 ~ 15
      let { delay, pressDuration, key } = obj;

      const { x, y } = getXYForStorage(storage.get(musicKeyPrefix + key));

      if (!delay) {
        delay = 0;
      }

      if (!pressDuration) {
        pressDuration = 1;
      }

      return [delay, pressDuration, [+x, +y]];
    });

    // 注意：如果存在按压键多了的问题，是因为光遇本身的BUG
    // 即：你手指A按住任意一个键 2s 不松开，再用另一个手指B按住另一个键 1s，松开手指A，手指B按压的那个键将会如同被点击一样，响起。
    gestures.apply(null, currentPressKey);
  });
}

events.on("closePlay", handleExit);

// 开子线程的目的：触发 closePlay 事件时，不必等待 musicData 执行完
threads.start(function () {
  musicData.forEach((words) => {
    runPress(words);
  });
});

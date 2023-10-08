/**
 *  keyData: {
 *    words: string,
 *    time: string,
 *    data: Array< number | {key: number, delay: number, pressDuration: number} [] >
 *  }[]
 */
const { keyData, lrcData } = engines.myEngine().execArgv;

if (!keyData) {
  toast("不存在按键数据");
  exit();
}

let SRC_DIR = "/sdcard/children_of_the_light_music/src";

let {
  parseLrc,
  setViewDrag,
  runScriptWithVariable,
  emitSpecifiedScriptEvent,
} = require(SRC_DIR + "/tools.js");

const musicData = JSON.parse(keyData);

const { total, ms: lrcWords } = parseLrc(lrcData);

const lrcTotalTime = Math.ceil(total);

let timerId = null,
  currentTimer = 0,
  currentUiTimerId = null,
  seekBarWidth = device.width ? device.width * 0.3 : 500;

function handleExit() {
  if (timerId || currentUiTimerId) {
    events.emit("closeTimer");
  }

  emitSpecifiedScriptEvent(SRC_DIR + "/script/play.js", "closePlay");

  threads.shutDownAll();

  exit();
}

const seekBarView = floaty.rawWindow(
  <frame id="frame" bg="#aed0ee" width={seekBarWidth} height={100}>
    <vertical>
      <horizontal>
        <seekbar
          thumbTint="#ffffff"
          id="seekBarId"
          max={lrcTotalTime}
          progress="10"
          color="red"
          width={seekBarWidth / 2}
        />
        <text textColor="#dd7694" id="progressTimeText" />
      </horizontal>
      <text textColor="#dd7694" id="currentLyricText" />
      <button id="closeButton" text="关闭" />
    </vertical>
  </frame>
);

currentUiTimerId = setInterval(() => {}, 1000);

// 对于横屏游戏：高 == x，宽 == y
seekBarView.setPosition(device.height / 2 - seekBarWidth, device.width / 2);

seekBarView.frame.getBackground().setAlpha(100);

setViewDrag(seekBarView, seekBarView.frame);

seekBarView.closeButton.on("click", handleExit);

events.on("closePlayMusic", handleExit);

events.on("closeTimer", function () {
  if (timerId) {
    // 若继续点击 开始弹奏，则计时器无法清除，这样子可以清除
    currentTimer = lrcTotalTime;
    clearInterval(timerId);
  }
  if (currentUiTimerId) {
    clearInterval(currentUiTimerId);
  }
});

seekBarView.seekBarId.setOnSeekBarChangeListener({
  // 滑动
  onProgressChanged: function (seekBar, progress, fromUser) {
    seekBarView.progressTimeText.setText("" + progress);
  },

  // 按下
  onStartTrackingTouch: function (seekBar) {
    emitSpecifiedScriptEvent(SRC_DIR + "/script/play.js", "closePlay");
    events.emit("closeTimer");
  },

  // 松手
  onStopTrackingTouch: function (seekBar) {
    const progressValue = seekBar.getProgress();

    // 找到 json 数据中匹配当前拖动值的歌词索引位置
    const currentSelectedIndex = musicData.findIndex((words, index, self) => {
      currentTimer = words.time;
      // 从头播放
      if (progressValue === 0) {
        seekBar.setProgress(progressValue);
        return true;
      }

      // 拖动到最后一个歌词，但没有拖动到进图条终点
      if (
        index === self.length - 1 &&
        progressValue >= words.time &&
        progressValue < seekBar.getMax()
      ) {
        seekBar.setProgress(words.time);
        return true;
      }

      // 拖动值 > 当前遍历的 words.time，且小于下一个 words，就返回当前的 words
      if (
        self[index + 1] &&
        progressValue >= words.time &&
        progressValue < self[index + 1].time
      ) {
        seekBar.setProgress(words.time);
        return true;
      }

      return false;
    });

    // 受限于设计，无法精准移动到对应时间，所以在拖动到进图条最后时，重设 currentTimer
    if (progressValue >= lrcTotalTime) {
      currentTimer = lrcTotalTime - 1;
    }

    const currentLyricInfo = lrcWords.find((lrc, index, self) => {
      // 拖动值 > 当前遍历的 words.time，且小于下一个 words，就返回当前的 words
      if (
        self[index + 1] &&
        seekBar.getProgress() >= lrc.time &&
        seekBar.getProgress() < self[index + 1].time
      ) {
        return true;
      }

      return false;
    });

    // 显示歌词
    if (currentLyricInfo && currentLyricInfo.lyric) {
      seekBarView.currentLyricText.setText(currentLyricInfo.lyric);
    }

    // 截取匹配的索引之前值，然后遍历剩下的值
    if (currentSelectedIndex !== -1) {
      const newMusicData = musicData.slice(currentSelectedIndex);
      runScriptWithVariable(SRC_DIR + "/script/play.js", {
        keyData: newMusicData,
      });
    }

    // 进度条时间计时
    ui.run(function () {
      timerId = setInterval(() => {
        currentTimer += 1;
        if (currentTimer >= lrcTotalTime) {
          events.emit("closeTimer");
        }

        const lyricInfo = lrcWords.find((lrc, index, self) => {
          // 拖动值 > 当前遍历的 words.time，且小于下一个 words，就返回当前的 words
          if (
            self[index + 1] &&
            seekBar.getProgress() >= lrc.time &&
            seekBar.getProgress() < self[index + 1].time
          ) {
            return true;
          }

          return false;
        });
        seekBarView.seekBarId.setProgress("" + currentTimer);
        seekBarView.progressTimeText.setText("" + currentTimer);
        seekBarView.currentLyricText.setText(
          (lyricInfo && lyricInfo.lyric && lyricInfo.lyric) || ""
        );
      }, 1000);
    });
  },
});

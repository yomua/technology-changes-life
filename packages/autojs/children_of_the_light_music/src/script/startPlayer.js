// 处理歌词显示, 进度条显示, 播放歌曲, 停止播放


/**
 *  keyData: {
 *    words: string,
 *    time: string,
 *    data: Array< number | {key: number, delay: number, pressDuration: number} [] >
 *  }[]
 *
 *  lrcData: .lrc 文件的内容
 */
const { keyData, lrcData } = engines.myEngine().execArgv;

if (!keyData) {
  toast("不存在按键数据");
  exit();
}

let SRC_DIR = "/storage/emulated/0/children_of_the_light_music/src";

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
  currentLyricTime = 0, // 当前播放时间, 即: 当前播放到第几秒 (s 单位)
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
        {/* 时间进度条 */}
        <seekbar
          thumbTint="#ffffff"
          id="seekBarId"
          max={lrcTotalTime}
          progress="10"
          color="red"
          width={seekBarWidth / 2}
        />
        {/* 显示时间信息 */}
        <text textColor="#dd7694" id="progressTimeText" />
      </horizontal>
      {/* 显示歌词信息 */}
      <text textColor="#dd7694" id="currentLyricText" />
      <button id="closeButton" text="关闭" />
    </vertical>
  </frame>
);

// 每秒刷新一次 UI, 让 UI 更新.
currentUiTimerId = setInterval(() => {}, 1000);

// 对于横屏游戏：高 == x，宽 == y
seekBarView.setPosition(device.height / 2 - seekBarWidth, device.width / 2);

seekBarView.frame.getBackground().setAlpha(100);

setViewDrag(seekBarView, seekBarView.frame);

seekBarView.closeButton.on("click", handleExit);

// 关闭音乐, 这里监听的是来自 src/strategy.js
// 当音乐没有播放完毕, 就选择下一首时, 需要关闭上一首, 再播放下一首
events.on("closePlayMusic", handleExit);

// 清除计时器
events.on("closeTimer", function () {
  // 清除播放时间计时器
  if (timerId) {
    // 若继续点击 开始弹奏，则计时器无法清除，这样子可以清除
    currentLyricTime = lrcTotalTime;
    clearInterval(timerId);
  }

  if (currentUiTimerId) {
    clearInterval(currentUiTimerId);
  }
});

seekBarView.seekBarId.setOnSeekBarChangeListener({
  // 拖动时 滑动
  onProgressChanged: function (seekBar, progress, fromUser) {
    // 实时显示拖动的进度时间
    seekBarView.progressTimeText.setText("" + progress);
  },

  // 拖动前, 按下
  onStartTrackingTouch: function (seekBar) {
    // 用来结束上一轮播放
    emitSpecifiedScriptEvent(SRC_DIR + "/script/play.js", "closePlay");
    events.emit("closeTimer");
  },

  // 拖动后, 松手
  onStopTrackingTouch: function (seekBar) {
    // 得到拖动的进度值
    // 换算成时间的单位是 s, 即: 这个值就表示拖动到第几秒
    const progressValue = seekBar.getProgress();

    // 找到拖动值对应歌词的索引
    // 即: 从 歌词 json 数据中,匹配 words.time 和 progressValue 近似的 words 索引
    const currentSelectedIndex = musicData.findIndex((words, index, self) => {
      currentLyricTime = words.time;

      // 从头播放
      if (progressValue === 0) {
        seekBar.setProgress(progressValue);
        return true;
      }

      // 拖动到最后一个歌词，但没有拖动到进图条终点
      // 主动设置进度条时间未最后一个歌词时间
      if (
        index === self.length - 1 &&
        progressValue >= words.time &&
        progressValue < seekBar.getMax()
      ) {
        seekBar.setProgress(words.time);
        return true;
      }

      // 拖动值 > 当前遍历的 words.time，且小于下一个 words，就返回当前的 words
      // 且主动设置进度条时间为当前歌词
      if (
        self[index + 1] && // 当前歌词的下一句歌词
        progressValue >= words.time &&
        progressValue < self[index + 1].time
      ) {
        seekBar.setProgress(words.time);
        return true;
      }

      return false;
    });

    // 拖动到进度条最后
    // 限于设计，无法精准移动到对应时间，所以在拖动到进度条最后时，重设 currentLyricTime
    if (progressValue >= lrcTotalTime) {
      currentLyricTime = lrcTotalTime - 1;
    }

    const currentLyricInfo = lrcWords.find((lrc, index, self) => {
      // 拖动值 > 当前遍历的 words.time，且小于下一个 words，就返回当前的 words
      // 即: 我们得到此次拖动时, 应该播放的歌词数据
      // 如果拖动进度条, 只拖动到一句歌词的一半, 那么我们不会精确地定位到对应的这半句歌词
      // 而是直接使用这句歌词的开始时间作为播放的时间.
      // 为什么这么做? 很难做到精确定位每句歌词时间, 比如: 一句歌词是 "啊~" 持续 3s, 然后此时拖动到 1.5s, 就很难定位到这句歌词的中间,
      // 即使可以, 也会增加大量代码复杂度, 经过取舍, 没必须要这么做, 即使网易云这种音乐播放软件, 都没有去实现它.
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

    // 只保留 索引 (包含) 后的歌词数据
    if (currentSelectedIndex !== -1) {
      const newMusicData = musicData.slice(currentSelectedIndex);
      runScriptWithVariable(SRC_DIR + "/script/play.js", {
        keyData: newMusicData,
      });
    }

    // 进度条时间计时
    ui.run(function () {
      timerId = setInterval(() => {
        currentLyricTime += 1;

        // 播放完毕
        if (currentLyricTime >= lrcTotalTime) {
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

        // 设置当前进度条位置
        seekBarView.seekBarId.setProgress("" + currentLyricTime);

        // 显示进度条播放的时间文本
        seekBarView.progressTimeText.setText("" + currentLyricTime);

        // 设置歌词
        seekBarView.currentLyricText.setText(
          (lyricInfo && lyricInfo.lyric && lyricInfo.lyric) || ""
        );
      }, 1000);
    });
  },
});

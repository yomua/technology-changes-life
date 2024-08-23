/** 此文件: 处理歌词显示, 进度条显示, 播放歌曲, 停止播放 */

(function () {
  /**
   *  musicData: {
   *    words: string,
   *    time: string,
   *    data: Array< number | {key: number, delay: number, pressDuration: number} [] >
   *  }[]
   */
  const { musicData, useShareData } = engines.myEngine().execArgv;

  if (!musicData) {
    toast("不存在音乐数据");
    exit();
  }

  if (!useShareData) {
    toast("不存在共享数据");
    exit();
  }

  const { srcDir } = useShareData();

  const {
    setViewDrag,
    keepThreadAlive,
    getScreenDirection,
    runScriptWithVariable,
    emitSpecifiedScriptEvent,
  } = require(`${srcDir}/tools.js`);

  const musicDataObj = JSON.parse(musicData);

  const total = +musicDataObj[musicDataObj.length - 1].time;

  // 歌词总时间
  const lrcTotalTime = Math.ceil(total);

  let timerId = null,
    // 进度条位置, 即: 表示当前播放时间, 即: 当前播放到第几秒 (s 单位)
    currentLyricTime = 0,
    currentUiTimerId = null,
    seekBarWidth = device.width ? device.width * 0.3 : 500;

  function handleExit() {
    if (timerId || currentUiTimerId) {
      events.emit("closeTimer");
    }

    emitSpecifiedScriptEvent(`${srcDir}/script/play.js`, "closePlay");

    floaty.closeAll();

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

  currentUiTimerId = keepThreadAlive();

  // 设置播放音乐组件位置
  if (getScreenDirection() === "vertical") {
    // 默认情况下, x 和 y 对应手机竖着的时候的宽和高
    seekBarView.setPosition(device.width / 2 - seekBarWidth, device.height / 2);
  } else {
    // 对于横屏游戏：高 = x，宽 = y
    seekBarView.setPosition(device.height / 2 - seekBarWidth, device.width / 2);
  }

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
      events.emit("closeTimer");
    },

    // 拖动后, 松手
    onStopTrackingTouch: function (seekBar) {
      // 得到拖动的进度值
      // 换算成时间的单位是 s, 即: 这个值就表示拖动到第几秒
      const progressValue = seekBar.getProgress();

      // 找到拖动值对应按键数据的索引
      // 即: 从按键 json 数据中,匹配 keyInfo.time 和 progressValue 近似的 keyInfo 索引
      const currentSelectedIndex = musicDataObj.findIndex(
        (keyInfo, index, self) => {
          // 得到找到的按键数据的歌词时间
          // 即使没有找到任何歌词, 就默认等于最后一个按键数据的 time
          currentLyricTime = keyInfo.time;

          // 从头播放, 直接返回第一个按键
          if (progressValue === 0) {
            seekBar.setProgress(0);
            return true;
          }

          // 拖动到最后一个按键数据，但没有拖动到进度条终点
          // 设置进度条时间\为最后一个按键数据的时间, 从这里开始播放
          if (
            index === self.length - 1 && // 是最后一个索引
            progressValue >= keyInfo.time &&
            progressValue < seekBar.getMax()
          ) {
            seekBar.setProgress(keyInfo.time);
            return true;
          }

          // 仍然有下一个按键数据
          if (
            self[index + 1] &&
            progressValue >= keyInfo.time && // 大于当前按键
            progressValue < self[index + 1].time // 小于下一个按键
          ) {
            seekBar.setProgress(keyInfo.time);
            return true;
          }

          return false;
        }
      );

      // 拖动到进度条最后
      if (progressValue >= lrcTotalTime) {
        currentLyricTime = lrcTotalTime - 1;
      }

      const currentLyricInfo = musicDataObj.find((lrc, index, self) => {
        // 拖动进度条并松手时, 应该是哪个歌词数据
        // 拖动值 > 当前遍历的 keyInfo.time，且小于下一个 words，就返回当前的 keyInfo
        // 即: 我们得到此次拖动时, 应该播放的歌词数据
        // 如果拖动进度条, 只拖动到一句歌词的一半, 那么我们不会精确地定位到对应的这半句歌词
        // 而是直接使用这句歌词的开始时间作为播放的时间.
        // 为什么这么做? 很难做到精确定位每句歌词时间, 比如: 一句歌词是 "啊~" 持续 3s, 然后此时拖动到 1.5s, 就很难定位到这句歌词的中间,
        // 即使可以, 也会增加大量代码复杂度, 经过取舍, 没必须要这么做, 即使网易云这种音乐播放软件, 都没有去实现它.
        if (
          self[index + 1] && // 不是最后一个索引
          seekBar.getProgress() >= lrc.time &&
          seekBar.getProgress() < self[index + 1].time
        ) {
          return true;
        }

        return false;
      });

      // 显示歌词
      if (currentLyricInfo && currentLyricInfo.words) {
        seekBarView.currentLyricText.setText(currentLyricInfo.words);
      }

      // 找到的按键数据存在
      if (currentSelectedIndex !== -1) {
        // 只保留索引 (包含) 后的歌词数据
        const newMusicData = musicDataObj.slice(currentSelectedIndex);
        runScriptWithVariable(`${srcDir}/script/play.js`, {
          keyData: newMusicData,
          useShareData,
        });
      }

      // 进度条时间计时 (有误差 1-2s)
      ui.run(function () {
        timerId = setInterval(() => {
          currentLyricTime += 1;
          // 播放完毕
          if (currentLyricTime >= lrcTotalTime) {
            emitSpecifiedScriptEvent(`${srcDir}/script/play.js`, "closePlay");
            threads.shutDownAll();
            events.emit("closeTimer");
          }

          // 找到此时是哪一条歌词数据
          const lyricInfo = musicDataObj.find((lrc, index, self) => {
            // 拖动值 > 当前遍历的 keyInfo.time，且小于下一个 words，就返回当前的 keyInfo
            if (
              self[index + 1] && // 不是最后一个索引
              seekBar.getProgress() >= lrc.time && // 大于当前歌词 time
              seekBar.getProgress() < self[index + 1].time // 小于下一句歌词 time
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
            (lyricInfo && lyricInfo.words) || ""
          );
        }, 1000);
      });
    },
  });
})();

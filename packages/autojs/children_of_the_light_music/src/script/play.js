/** 此文件用来: 按下指定的键 */
(function () {
  const { keyData: musicData, useShareData } = engines.myEngine().execArgv;

  if (!musicData) {
    toast("不存在按键数据");
    exit();
  }

  if (!useShareData) {
    toast("不存在共享数据");
    exit();
  }

  const { srcDir, rootDir, musicKeyPrefix, store } = useShareData();

  const { getXYForStorage } = require(`${srcDir}/tools.js`);

  const config = JSON.parse(files.read(`${rootDir}/config.json`));

  function handleExit() {
    if (sonThread) {
      sonThread.interrupt();
    }
    exit();
  }

  events.on("closePlay", handleExit);

  // 开子线程的目的：触发 closePlay 事件时，不必等待 musicData 执行完
  // => forEach 是同步操作, 会阻塞线程, 当 forEach 没执行完时
  // 如果此时想触发 closePlay, 是不可能的, 会被阻塞.
  const sonThread = threads.start(function () {
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
        toast("没有可以按压的键");
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

          const { x, y } = getXYForStorage(store.get(musicKeyPrefix + key));

          // 设置最小延迟
          if (!delay || delay < config.minDelayMS) {
            // 对于某些游戏, 延迟如果为 0, 则有可能导致无法触发按压, 如: 心动小镇
            // 这里的 20 是我测出来的最小延迟时间, 再小就可能导致无法触发按压
            delay = config.minDelayMS;
          }

          // 没有设置按压时间，则使用默认
          if (!pressDuration) {
            pressDuration = config.defaultPressDurationMS;
          }
          return [delay, pressDuration, [+x, +y]];
        });

        // 注意：如果存在按压键多了的问题，是因为光遇本身的BUG
        // 即：你手指A按住任意一个键 2s 不松开，再用另一个手指B按住另一个键 1s，松开手指A，手指B按压的那个键将会如同被点击一样，响起。
        gestures.apply(null, currentPressKey);
      });
    }

    musicData.forEach((musicInfo) => {
      runPress(musicInfo);
    });
  });
})();

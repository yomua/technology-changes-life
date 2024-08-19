let { srcDir, assetDir, musicKeyPrefix, maxClickScreenCount } = useShareData();

let {
  isFloatyWindowVisible,
  runScriptWithVariable,
  emitSpecifiedScriptEvent,
} = require(`${srcDir}/tools.js`);

// 目前用来存储键的坐标
let storage = storages.create("children_of_the_light_music");

// 显示当前是第几个键
const coordinateText = floaty.rawWindow(
  <frame gravity="center">
    <text textSize="22sp" textColor="#dd7694" id="coordinateModifyTextId" />
  </frame>
);

// 用于坐标修改
const coordinateCanvas = floaty.rawWindow(
  <vertical>
    <canvas id="canvasId" layout_weight="1" />
  </vertical>
);

// 首先隐藏坐标画布
isFloatyWindowVisible(coordinateCanvas, false);
isFloatyWindowVisible(coordinateText, false);

// 设置坐标
// 存储用户按15个键的位置 => { key: musicKeyPrefix + 1~15, value: '100,100' }
function setCoordinate() {
  if (!coordinateCanvas || !coordinateCanvas.canvasId) {
    toast("请检查 coordinateCanvas 是否存在！");
    return;
  }
  isFloatyWindowVisible(coordinateCanvas, true);
  isFloatyWindowVisible(coordinateText, true);
  coordinateText.coordinateModifyTextId.setText("请确认坐标");

  // 初始时, 按键数量为 0
  let clickCount = 0;

  coordinateCanvas.canvasId.on("draw", () => {
    coordinateCanvas.canvasId.setOnTouchListener(function (view, event) {
      switch (event.getAction()) {
        case event.ACTION_DOWN:
          clickCount += 1; // 点击一次, 则当前按键 + 1
          let nextKey = clickCount + 1; // 下一个按键是几
          coordinateText.setSize(-1, -1); // 全屏
          coordinateText.coordinateModifyTextId.setText(
            "当前点击的键为: " + clickCount + ", " + "下一个键为: " + nextKey
          );
          const x = parseInt(event.getX());
          const y = parseInt(event.getY());
          storage.put(musicKeyPrefix + clickCount, x + "," + y);
          if (clickCount === maxClickScreenCount) {
            // 不使用 coordinateCanvas.close()，因为导入 coordinateCanvas 其实就一个实例，关闭后，canvas 就没了，
            // 在重启脚本前就无法使用坐标修改了。
            isFloatyWindowVisible(coordinateCanvas, false);
            isFloatyWindowVisible(coordinateText, false);
          }

          return true;
        // case event.ACTION_MOVE:
        //  break;
        // case event.ACTION_UP:
        //  break;
      }

      return true;
    });
  });
}

const functionStrategy = {
  开始弹奏: () => {
    // 读取 asset/ *.json 文件
    const musicList = files.listDir(assetDir, function (name) {
      return name.endsWith(".json") && files.isFile(assetDir + "/" + name);
    });

    //  [ 1: '错位时空', 2: '孤勇者', ...]
    // 索引从 1 开始
    const musicNameOptions = musicList.map((item, i) => {
      return `${i + 1}: ${item.split(".")[0]}`;
    });

    dialogs.select("请选择歌曲", musicNameOptions, function (selectedIndex) {
      if (selectedIndex === -1) {
        return;
      }

      const musicName = musicNameOptions[selectedIndex].split(": ")[1];

      const startPlayer = `${srcDir}/script/startPlayer.js`;

      // 先结束上一个 startPlayer.js 的执行
      emitSpecifiedScriptEvent(startPlayer, "closePlayMusic");

      // 再执行本次的 startPlayer.js
      runScriptWithVariable(startPlayer, {
        musicData: files.read(`${assetDir}/${musicName}.json`),
        useShareData, // 使用此方法, 会创建全新脚本环境, 不会共享 hamibot.jss 中的变量
      });
    });
  },

  坐标修改: () => {
    confirm(`请确认 ${maxClickScreenCount} 个键坐标`, "", (success) => {
      if (!success) {
        return;
      }

      toast("坐标指定中...");
      // canvas 的 touch 必须在起源线程中执行，所以这里不能使用 execScriptFile
      setCoordinate();
    });
  },

  退出脚本: () => {
    confirm("确认是否退出脚本？", "", (success) => {
      if (!success) {
        return;
      }

      toast("退出成功");
      engines.stopAll();
    });
  },
};

module.exports = {
  useFunctionStrategy: (action) => {
    if (action === null || action === undefined) {
      toast("不存在功能：" + action);

      return () => {}; // 错误处理
    }

    return functionStrategy[action];
  },
};

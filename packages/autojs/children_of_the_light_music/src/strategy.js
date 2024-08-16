let SRC_DIR = "/sdcard/children_of_the_light_music/src";

let ASSET_DIR = "/sdcard/children_of_the_light_music/asset";

let { MUSIC_KEY_PREFIX, CLICK_SCREEN_TIMES } = require(SRC_DIR +
  "/constant.js");

let {
  isFloatyWindowVisible,
  runScriptWithVariable,
  emitSpecifiedScriptEvent,
} = require(SRC_DIR + "/tools.js");

let storage = storages.create("children_of_the_light_music");

// 用于坐标修改
// 显示当前是第几个键
const coordinateModifyTextView = floaty.rawWindow(
  <frame gravity="center">
    <text textSize="22sp" textColor="#dd7694" id="coordinateModifyTextId" />
  </frame>
);

// 用于坐标修改
// 创建一个 canvas, 然后监听 canvas 上的按压事件
const canvasView = floaty.rawWindow(
  <vertical>
    <canvas id="canvasId" layout_weight="1" />
  </vertical>
);

isFloatyWindowVisible(canvasView, false);

isFloatyWindowVisible(coordinateModifyTextView, false);

// 使用 canvas 获取坐标
// 存储用户按15个键的位置 => { key: MUSIC_KEY_PREFIX + 1~15, value: '100,100' }
function getCoordinateWithCanvas() {
  if (!canvasView || !canvasView.canvasId) {
    toast("请检查 canvasView 是否存在！");
    return;
  }
  isFloatyWindowVisible(canvasView, true);
  isFloatyWindowVisible(coordinateModifyTextView, true);
  coordinateModifyTextView.coordinateModifyTextId.setText("请确认坐标");

  let clickNumber = 0;

  const paint = new Paint();
  paint.setStrokeWidth(10);
  paint.setStyle(Paint.Style.FILL);
  paint.setStrokeCap(Paint.Cap.SQUARE);
  paint.setARGB(50, 100, 120, 160);

  handleCanvasDraw = () => {
    canvasView.canvasId.setOnTouchListener(function (view, event) {
      switch (event.getAction()) {
        case event.ACTION_DOWN:
          clickNumber += 1;
          let nextKey = clickNumber + 1;
          coordinateModifyTextView.setSize(-1, -1);
          coordinateModifyTextView.coordinateModifyTextId.setText(
            "当前点击的键为: " + clickNumber + ", " + "下一个键为: " + nextKey
          );
          const x = parseInt(event.getX());
          const y = parseInt(event.getY());
          storage.put(MUSIC_KEY_PREFIX + clickNumber, x + "," + y);
          if (clickNumber === CLICK_SCREEN_TIMES) {
            // 不使用 canvasView.close()，因为导入 canvasView 其实就一个实例，关闭后，canvas 就没了，
            // 在重启脚本前就无法使用坐标修改了。
            isFloatyWindowVisible(canvasView, false);
            isFloatyWindowVisible(coordinateModifyTextView, false);
          }

          return true;
        // case event.ACTION_MOVE:
        //  break;
        // case event.ACTION_UP:
        //  break;
      }

      return true;
    });
  };

  canvasView.canvasId.on("draw", handleCanvasDraw);
}

const functionStrategy = {
  开始弹奏: () => {
    // 读取 asset/ *.json 文件
    const musicList = files.listDir(ASSET_DIR, function (name) {
      return name.endsWith(".json") && files.isFile(ASSET_DIR + "/" + name);
    });

    // musicOptions: [ 1: '错位时空', 2: '孤勇者', ...]
    const musicOptions = musicList.map((item, i) => {
      return i + 1 + ": " + item.split(".")[0];
    });

    dialogs.select("请选择歌曲", musicOptions, function (selectedIndex) {
      if (selectedIndex === -1) {
        return;
      }

      const musicName = musicOptions[selectedIndex].split(": ")[1];

      const startPlayer = SRC_DIR + "/script/startPlayer.js";

      // 先结束上一个 startPlayer.js 的执行
      emitSpecifiedScriptEvent(startPlayer, "closePlayMusic");

      // 再执行本次的 startPlayer.js
      runScriptWithVariable(startPlayer, {
        keyData: files.read(ASSET_DIR + "/" + musicName + ".json"),
        lrcData: files.read(ASSET_DIR + "/" + musicName + ".lrc"),
      });
    });
  },

  坐标修改: () => {
    confirm("请确认 " + CLICK_SCREEN_TIMES + " 个键坐标", "", (success) => {
      if (success) {
        toast("坐标指定中...");
        // canvas 的 touch 必须在起源线程中执行，所以这里不能使用 execScriptFile
        getCoordinateWithCanvas();
      }
    });
  },

  退出脚本: () => {
    confirm("确认是否退出脚本？", "", (success) => {
      if (success) {
        toast("退出成功");
        engines.stopAll();
      }
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

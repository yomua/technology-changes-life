/**
 * @param {string} value : e.g. '500,500'
 * @returns {{x:string, y:string}}
 */
function getXYForStorage(value) {
  if (!value || typeof value !== "string" || !/^\d+,\d+$/.test(value)) {
    toast("请确认坐标的正确性");
    return {
      x: 0,
      y: 0,
    };
  }
  const splitValue = value.split(",");
  if (!splitValue[0] || !splitValue[1]) {
    toast("坐标获取错误，请再试一次");
    return;
  }
  return {
    x: splitValue[0],
    y: splitValue[1],
  };
}

/**
 *
 * @param { floatyWindow } view
 * @param { boolean } visible
 */
function isFloatyWindowVisible(view, visible) {
  if (!view) {
    toast("不存在的 View");
    return;
  }
  if (!visible) {
    view.setTouchable(false);
    view.setSize(0, 0);
    return;
  }
  view.setTouchable(true);
  view.setSize(-1, -1);
}

/**
 * config.keyData 中的类型 number 指：延迟 n 秒才执行本轮操作；delay 指：本轮中的此按键延迟多久按。
 * @param {string} dir
 * @param {{[key: string]: any}} config
 * @returns { ScriptEngine }
 */
function runScriptWithVariable(dir, config) {
  if (!config) {
    config = {};
  }

  if (!dir) {
    toast("请传入一个文件路径");
    return;
  }
  if (!files.isFile(dir)) {
    toast(dir + " 不存在");
    return;
  }

  return engines.execScriptFile(dir, {
    arguments: config,
  });
}

/**
 *
 * @param { FloatyRawWindow | FloatyWindow } view 外层视图
 * @param { Widget } controlComponent view 里面的某个控件
 * @param { () => void? } onClick
 */
function setViewDrag(view, controlComponent, onClick) {
  if (!view || !controlComponent) {
    toast("请检查 View 或 Control 是否存在");
    return;
  }

  if (!onClick) {
    onClick = () => {};
  }

  // 按下时手指在屏幕的相对坐标
  let x = 0,
    y = 0;
  // 按下时手指在悬浮窗的相对坐标
  let viewX, viewY;

  controlComponent.setOnTouchListener(function (_, event) {
    switch (event.getAction()) {
      case event.ACTION_DOWN:
        // 当前触摸点离屏幕左上角的 x/y 轴距离
        x = event.getRawX();
        y = event.getRawY();
        // 当前触摸点到当前触摸组件左上角的 x/y 轴距离
        viewX = view.getX();
        viewY = view.getY();
        return true;
      case event.ACTION_MOVE:
        // 移动手指时调整悬浮窗位置
        view.setPosition(
          // 视图初始坐标 + (手指当前坐标 - 手指初始坐标 => 手指移动的距离)
          viewX + (event.getRawX() - x),
          viewY + (event.getRawY() - y)
        );

        return true;
      case event.ACTION_UP:
        // 手指弹起时如果偏移很小则判断为点击
        if (
          Math.abs(event.getRawY() - y) < 5 &&
          Math.abs(event.getRawX() - x) < 5
        ) {
          onClick(event);
        }
        return true;
    }
    return true;
  });
}

/**
 *
 * @param { string } dir
 * @param { string } eventName
 * @param { { [key:string]: any } } config
 */
function emitSpecifiedScriptEvent(dir, eventName, config) {
  if (!files.isFile(dir)) {
    toast(dir + " 不存在");
    return;
  }

  if (!eventName) {
    toast(eventName + " 不存在");
    return;
  }

  if (!config) {
    config = {};
  }

  if (!engines || !engines.all() || !engines.all().length) {
    return;
  }

  engines.all().forEach((scriptExecution) => {
    if (!scriptExecution) {
      return;
    }
    if (String(scriptExecution.source) === dir) {
      scriptExecution.emit(eventName, config);
    }
  });
}

function parseLrc(lrc) {
  const oLRC = {
    ti: "", //歌曲名
    ar: "", //演唱者
    al: "", //专辑名
    by: "", //歌词制作人
    offset: 0, //时间补偿值，单位毫秒，用于调整歌词整体位置
    total: 0, // 总时间
    ms: [], //歌词数组{t:时间,c:歌词}
  };
  if (!lrc || lrc.length === 0) {
    toast("lrc 不存在");
    return;
  }
  let lrcs = lrc.split("\n"); //用回车拆分成数组
  for (let i in lrcs) {
    //遍历歌词数组
    lrcs[i] = lrcs[i].replace(/(^\s*)|(\s*$)/g, ""); //去除前后空格
    let t = lrcs[i].substring(lrcs[i].indexOf("[") + 1, lrcs[i].indexOf("]")); //取[]间的内容
    let s = t.split(":"); //分离:前后文字
    // 不是数字
    if (isNaN(parseInt(s[0]))) {
      for (let i in oLRC) {
        if (i != "ms" && i == s[0].toLowerCase()) {
          oLRC[i] = s[1];
        }
      }
    } else {
      // 是数字
      let arr = lrcs[i].match(/\[(\d+:.+?)\]/g); //提取时间字段，可能有多个
      let start = 0;
      for (let k in arr) {
        start += arr[k].length; //计算歌词位置
      }
      let content = lrcs[i].substring(start); //获取歌词内容
      for (let k in arr) {
        let t = arr[k].substring(1, arr[k].length - 1); //取[]间的内容
        let s = t.split(":"); //分离:前后文字
        oLRC.ms.push({
          //对象{t:时间,c:歌词}加入ms数组
          time: (parseFloat(s[0]) * 60 + parseFloat(s[1])).toFixed(3),
          lyric: content,
        });
      }
    }
  }
  //按时间顺序排序
  oLRC.ms.sort(function (a, b) {
    return a.time - b.time;
  });
  oLRC.total = +oLRC.ms[oLRC.ms.length - 1].time;
  return oLRC;
}

module.exports = {
  parseLrc: parseLrc,
  setViewDrag: setViewDrag,
  getXYForStorage: getXYForStorage,
  runScriptWithVariable: runScriptWithVariable,
  isFloatyWindowVisible: isFloatyWindowVisible,
  emitSpecifiedScriptEvent: emitSpecifiedScriptEvent,
};

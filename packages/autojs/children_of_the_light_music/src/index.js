/**
 *   Copyright (c) 2022 yomua. All rights reserved.
 */

const {
  srcDir,
} = require("/storage/emulated/0/children_of_the_light_music/src/constant.js");

const INDEX_ROOT_OPTIONS = ["1.开始弹奏", "2.坐标修改", "3.退出脚本"];

const { useFunctionStrategy } = require(`${srcDir}/strategy.js`);

const { setViewDrag } = require(`${srcDir}/tools.js`);

// 是否开启了无障碍
auto();

// 创建 UI
const scriptIconView = floaty.rawWindow(
  <img
    id="scriptIconId"
    w="40"
    h="40"
    tint="#dd7694"
    src="https://webinput.nie.netease.com/img/sky/logo4.png"
  />
);

scriptIconView.setPosition(0, device.width ? device.width / 2 : 500);

setInterval(() => {}, 1000);

setViewDrag(scriptIconView, scriptIconView.scriptIconId, function () {
  dialogs.select("请选择功能", INDEX_ROOT_OPTIONS, (selectedIndex) => {
    if (selectedIndex === -1) {
      return;
    }

    switch (INDEX_ROOT_OPTIONS[selectedIndex].split(".")[1]) {
      case "开始弹奏":
        useFunctionStrategy("开始弹奏")();
        break;
      case "坐标修改":
        useFunctionStrategy("坐标修改")();
        break;
      case "退出脚本":
        useFunctionStrategy("退出脚本")();
        break;
    }
  });
});

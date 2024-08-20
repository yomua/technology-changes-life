/**
 *   Copyright (c) 2022 yomua. All rights reserved.
 */
(function () {
  // 是否开启了无障碍
  auto();

  const { srcDir } = useShareData();

  const { useFunctionStrategy } = require(`${srcDir}/strategy.js`);

  const { setViewDrag, runScriptWithVariable } = require(`${srcDir}/tools.js`);

  runScriptWithVariable(`${srcDir}/script/midAndLrcToMusicJson.js`, {
    useShareData,
  });

  // 拥有的功能
  const functionOptions = ["1.开始弹奏", "2.坐标修改", "3.退出脚本"];

  // 创建 logo
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

  // 设置一个空的定时来保持线程的运行状态
  setInterval(() => {}, 1000);

  setViewDrag(scriptIconView, scriptIconView.scriptIconId, function () {
    dialogs.select("请选择功能", functionOptions, (selectedIndex) => {
      if (selectedIndex === -1) {
        return;
      }

      switch (functionOptions[selectedIndex].split(".")[1]) {
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
})();

/**
 *   Copyright (c) 2022 yomua. All rights reserved.
 */

(function () {
  // 是否开启了无障碍
  auto();

  const { srcDir, store, storeKey } = useShareData();

  const { useFunctionStrategy } = require(`${srcDir}/strategy.js`);

  const {
    setViewDrag,
    isFloatyWindowVisible,
    runScriptWithVariable,
    keepThreadAlive,
  } = require(`${srcDir}/tools.js`);

  keepThreadAlive();

  alert("解析文件中, 请稍后操作...");
  // 读取 asset/*.mid 文件, 转为可识别, 播放的 JSON 文件.
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

  const indexLayout = floaty.rawWindow(
    <vertical id="mask" padding="50" gravity="center">
      <scroll>
        <vertical
          id="container"
          bg="#ffffff"
          padding="16"
          gravity="center"
          borderWidth="5"
          borderColor="gray"
        >
          <text id="title" color="#000000" textStyle="bold" textSize="20sp">
            请选择功能
          </text>

          <vertical>
            <text id="indexStart" textSize="16sp" marginTop="20">
              1. 开始弹奏
            </text>
            <text id="indexCoordinate" textSize="16sp" marginTop="20">
              2. 坐标修改
            </text>
            <text id="indexExit" textSize="16sp" marginTop="20">
              3. 退出脚本
            </text>
          </vertical>

          <vertical marginTop="20">
            <horizontal marginTop="15">
              <Switch checked id="enabledKey15" />
              <text>启用 15 键</text>
            </horizontal>
            <horizontal marginTop="15">
              <Switch id="enabledKey22" />
              <text>启用 22 键</text>
            </horizontal>
            <horizontal marginTop="15">
              <Switch id="enabledKey22AndBlackKey" />
              <text>启用 22 键 + 15 黑键</text>
            </horizontal>
          </vertical>

          <vertical marginTop="20">
            <button id="closeWindow">关闭窗口</button>
          </vertical>
        </vertical>
      </scroll>
    </vertical>
  );
  isFloatyWindowVisible(indexLayout, false);
  // 默认启用 15 游戏键映射
  store.put(storeKey.maxClickScreenCount, 15);
  store.put(storeKey.enabledKeyValue, "enabledKey15");

  // 功能监听
  indexLayout.indexStart.on("click", function () {
    isFloatyWindowVisible(indexLayout, false);
    useFunctionStrategy("开始弹奏")(indexLayout);
  });

  indexLayout.indexCoordinate.on("click", function () {
    isFloatyWindowVisible(indexLayout, false);
    useFunctionStrategy("坐标修改")(indexLayout);
  });

  indexLayout.indexExit.on("click", function () {
    useFunctionStrategy("退出脚本")(indexLayout);
  });

  // switch 监听
  indexLayout.enabledKey15.on("click", function (event) {
    // 最大按键数量
    store.put(storeKey.maxClickScreenCount, event.checked ? 15 : 0);
    store.put(storeKey.enabledKeyValue, "enabledKey15");
    indexLayout.enabledKey22.checked = false;
    indexLayout.enabledKey22AndBlackKey.checked = false;
    alert("重新解析文件中, 请稍后操作...");
    runScriptWithVariable(`${srcDir}/script/midAndLrcToMusicJson.js`, {
      useShareData,
    });
  });

  indexLayout.enabledKey22.on("click", function (event) {
    store.put(storeKey.maxClickScreenCount, event.checked ? 22 : 0);
    store.put(storeKey.enabledKeyValue, "enabledKey22");
    indexLayout.enabledKey15.checked = false;
    indexLayout.enabledKey22AndBlackKey.checked = false;
    alert("重新解析文件中, 请稍后操作...");
    runScriptWithVariable(`${srcDir}/script/midAndLrcToMusicJson.js`, {
      useShareData,
    });
  });

  indexLayout.enabledKey22AndBlackKey.on("click", function (event) {
    store.put(storeKey.maxClickScreenCount, event.checked ? 22 + 15 : 0);
    store.put(storeKey.enabledKeyValue, "enabledKey22AndBlackKey");
    indexLayout.enabledKey15.checked = false;
    indexLayout.enabledKey22.checked = false;
    alert("重新解析文件中, 请稍后操作...");
    runScriptWithVariable(`${srcDir}/script/midAndLrcToMusicJson.js`, {
      useShareData,
    });
  });

  // 关闭窗口
  indexLayout.closeWindow.on("click", function () {
    isFloatyWindowVisible(indexLayout, false);
  });

  setViewDrag(scriptIconView, scriptIconView.scriptIconId, function () {
    isFloatyWindowVisible(indexLayout, true);

    // dialogs.select("请选择功能", functionOptions, (selectedIndex) => {
    //   if (selectedIndex === -1) {
    //     return;
    //   }

    //   switch (functionOptions[selectedIndex].split(".")[1]) {
    //     case "开始弹奏":
    //       useFunctionStrategy("开始弹奏")();
    //       break;
    //     case "坐标修改":
    //       useFunctionStrategy("坐标修改")();
    //       break;
    //     case "退出脚本":
    //       useFunctionStrategy("退出脚本")();
    //       break;
    //   }
    // });
  });
})();

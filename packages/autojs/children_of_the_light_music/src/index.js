/**
 *   Copyright © 2022 yomua. All rights reserved.
 */

(function () {
  // 是否开启了无障碍
  auto();

  const { srcDir, store, storeKey, keyMode, keyModeNum } = useShareData();

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

  const logo = floaty.rawWindow(
    <img
      id="logoId"
      w="40"
      h="40"
      tint="#dd7694"
      src="https://webinput.nie.netease.com/img/sky/logo4.png"
    />
  );

  logo.setPosition(0, device.width ? device.width / 2 : 500);

  // 可拖拽 logo, 点击时打开功能选择
  setViewDrag(logo, logo.logoId, function () {
    isFloatyWindowVisible(functionLayout, true);
  });

  // 功能视图
  const functionLayout = floaty.rawWindow(
    <vertical padding="50" gravity="center">
      <scroll>
        <vertical
          bg="#ffffff"
          padding="16"
          gravity="center"
          borderWidth="5"
          borderColor="gray"
        >
          <text color="#000000" textStyle="bold" textSize="20sp">
            请选择功能
          </text>

          <vertical>
            <text id="start" textSize="16sp" marginTop="20">
              1. 开始弹奏
            </text>
            <text id="coordinate" textSize="16sp" marginTop="20">
              2. 坐标修改
            </text>
            <text id="exit" textSize="16sp" marginTop="20">
              3. 退出脚本
            </text>
          </vertical>

          <vertical marginTop="20">
            <horizontal marginTop="15">
              <Switch checked id={keyMode.key15} />
              <text>启用 {keyModeNum.key15} 键</text>
            </horizontal>

            <horizontal marginTop="15">
              <Switch id={keyMode.key22} />
              <text>启用 {keyModeNum.key22} 键</text>
            </horizontal>

            <horizontal marginTop="15">
              <Switch id={keyMode.key22AndBlackKey} />
              <text>
                启用 {keyModeNum.key22} 键 + {keyModeNum.key15} 黑键
              </text>
            </horizontal>
          </vertical>

          <vertical marginTop="20">
            <button id="closeWindow">关闭窗口</button>
          </vertical>
        </vertical>
      </scroll>
    </vertical>
  );

  isFloatyWindowVisible(functionLayout, false);

  // 默认启用 key15 游戏键映射
  store.put(storeKey.maxKeyNum, keyModeNum.key15);
  store.put(storeKey.selectedKeyMode, keyMode.key15);

  // 功能按钮监听
  functionLayout.start.on("click", function () {
    isFloatyWindowVisible(functionLayout, false);
    useFunctionStrategy("开始弹奏")(functionLayout);
  });

  functionLayout.coordinate.on("click", function () {
    isFloatyWindowVisible(functionLayout, false);
    useFunctionStrategy("坐标修改")(functionLayout);
  });

  functionLayout.exit.on("click", function () {
    useFunctionStrategy("退出脚本")(functionLayout);
  });

  // Switch 监听
  functionLayout[keyMode.key15].on("click", function (event) {
    // 设置最大按键数
    store.put(storeKey.maxKeyNum, event.checked ? keyModeNum.key15 : 0);
    // 设置选则的 keyMode
    store.put(storeKey.selectedKeyMode, keyMode.key15);
    // 3 个 Switch 状态互斥
    functionLayout[keyMode.key22].checked = false;
    functionLayout[keyMode.key22AndBlackKey].checked = false;
    alert("重新解析文件中, 请稍后操作...");
    runScriptWithVariable(`${srcDir}/script/midAndLrcToMusicJson.js`, {
      useShareData,
    });
  });

  functionLayout[keyMode.key22].on("click", function (event) {
    store.put(storeKey.maxKeyNum, event.checked ? keyModeNum.key22 : 0);
    store.put(storeKey.selectedKeyMode, keyMode.key22);
    functionLayout[keyMode.key15].checked = false;
    functionLayout[keyMode.key22AndBlackKey].checked = false;
    alert("重新解析文件中, 请稍后操作...");
    runScriptWithVariable(`${srcDir}/script/midAndLrcToMusicJson.js`, {
      useShareData,
    });
  });

  functionLayout[keyMode.key22AndBlackKey].on("click", function (event) {
    store.put(
      storeKey.maxKeyNum,
      event.checked ? keyModeNum.key22AndBlackKey : 0
    );
    store.put(storeKey.selectedKeyMode, keyMode.key22AndBlackKey);
    functionLayout[keyMode.key15].checked = false;
    functionLayout[keyMode.key22].checked = false;
    alert("重新解析文件中, 请稍后操作...");
    runScriptWithVariable(`${srcDir}/script/midAndLrcToMusicJson.js`, {
      useShareData,
    });
  });

  // 关闭窗口
  functionLayout.closeWindow.on("click", function () {
    isFloatyWindowVisible(functionLayout, false);
  });
})();

/**
 *   Copyright © 2022 yomua. All rights reserved.
 */

// 在此文件的变量会被共享

const { srcDir } = useShareData();
// 使用 var 进行全局变量声明
// useShareData 中, 我们将先使用 store, 然后这行再修改 store;
// 不使用 var, 将会导致报错: 变量无法再声明之前使用.
var store = require(`${srcDir}/store/index.js`);

function useShareData() {
  const rootDir = files.cwd()
    ? `${files.cwd().replace("/Hamibot", "")}/children_of_the_light_music`
    : "/storage/emulated/0/children_of_the_light_music";

  return {
    keyPrefix: "musicKey", // 按键前缀
    store, // 全局 store; 将数据存储到本地, 直到 hamibot 软件被卸载或主动删除数据
    storeKey: {
      selectedKeyMode: "selectedKeyMode", // key15 | key22 | key22AndBlackKey
      maxKeyNum: "maxKeyNum", // 15 | 22 | 22 + 15  最大按键数量根据选择的 selectedKeyMode 而定
      // 还有个动态 key, 即: keyPrefix + 按键数字(1 ~ store.get('maxKeyNum') => keyModeNum)
    },
    // 每个键模式对应的游戏按键数量
    keyModeNum: {
      key15: 15,
      key22: 22,
      key22AndBlackKey: 22 + 15, // 22: key22, 15: 黑键数量(在 22 键中)
    },
    keyMode: {
      key15: "key15",
      key22: "key22",
      key22AndBlackKey: "key22AndBlackKey",
    },
    rootDir,
    srcDir: `${rootDir}/src`,
    assetDir: `${rootDir}/asset`,
    packagesDir: `${rootDir}/packages`,
  };
}

const dir = `${srcDir}/index.js`;

if (files.exists(dir)) {
  eval(files.read(dir));
} else {
  toast("目录 " + dir + " 不存在");
}

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
  const rootDir = `${files.getSdcardPath()}/children_of_the_light_music`;

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

// 重写 require, 使得 hamibot 环境中, 支持相对路径
function cRequire(path) {
  console.log("__  path", path);
  console.log("__  files", files.cwd());
  // 获取当前线程的堆栈信息
  const stackTrace = java.lang.Thread.currentThread().getStackTrace();

  // 遍历堆栈信息，查找包含脚本路径的堆栈元素
  for (let i = 0; i < stackTrace.length; i++) {
    let element = stackTrace[i];
    let fileName = element.getFileName();

    // 过滤出你关心的文件路径
    if (fileName && fileName.endsWith(".js")) {
      // 可能需要进一步处理路径以得到完整路径
      let callerFilePath = fileName;
      console.log("Caller File Path: " + callerFilePath);
      break;
    }
  }

  // 将相对路径转换为绝对路径
}

const dir = `${srcDir}/index.js`;

if (files.exists(dir)) {
  eval(files.read(dir));
} else {
  toast("目录 " + dir + " 不存在");
}

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
    musicKeyPrefix: "musicKey", // 按键前缀
    store, // 全局 store; 将数据存储到本地, 直到 hamibot 软件被卸载或主动删除数据
    rootDir,
    srcDir: `${rootDir}/src`,
    assetDir: `${rootDir}/asset`,
    packagesDir: `${rootDir}/packages`,
    storeKey: {
      enabledKeyValue: "enabledKeyValue",
      maxClickScreenCount: "maxClickScreenCount",
    },
  };
}

const dir = `${srcDir}/index.js`;

if (files.exists(dir)) {
  eval(files.read(dir));
} else {
  toast("目录 " + dir + " 不存在");
}

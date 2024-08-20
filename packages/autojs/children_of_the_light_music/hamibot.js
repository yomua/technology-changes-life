// 在此文件的变量会被共享

var store = require(`${useShareData().srcDir}/store/index.js`);

function useShareData() {
  const rootDir = files.cwd()
    ? `${files.cwd().replace("/Hamibot", "")}/children_of_the_light_music`
    : "/storage/emulated/0/children_of_the_light_music";

  return {
    musicKeyPrefix: "musicKey", // 按键前缀
    maxClickScreenCount: 15, // 最大按键数量
    rootDir,
    srcDir: `${rootDir}/src`,
    assetDir: `${rootDir}/asset`,
    packagesDir: `${rootDir}/packages`,
    store,
  };
}

console.log(useShareData().store.getAllValue());

if (files.exists(dir)) {
  eval(files.read(dir));
} else {
  toast("目录 " + dir + " 不存在");
}

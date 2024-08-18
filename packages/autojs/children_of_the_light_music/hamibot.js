// 在此文件的变量会被共享

function useShareData() {
  const rootDir = files.cwd()
    ? `${files.cwd().replace("/Hamibot", "")}/children_of_the_light_music`
    : "/storage/emulated/0/children_of_the_light_music";

  return {
    musicKeyPrefix: "musicKey",
    maxClickScreenCount: 15,
    rootDir,
    srcDir: `${rootDir}/src`,
    assetDir: `${rootDir}/asset`,
    packagesDir: `${rootDir}/packages`,
  };
}

const dir = `${useShareData().srcDir}/index.js`;

if (files.exists(dir)) {
  eval(files.read(dir));
} else {
  toast("目录 " + dir + " 不存在");
}

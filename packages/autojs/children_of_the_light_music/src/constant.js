const rootDir = files.cwd()
  ? files.cwd().replace("/Hamibot", "")
  : "/storage/emulated/0";

module.exports = {
  musicKeyPrefix: "musicKey",
  clickScreenCount: 15,
  srcDir: `${rootDir}/src`,
  rootDir,
};

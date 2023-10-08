const dir = "/sdcard/children_of_the_light_music/src/index.js";

if (files.exists(dir)) {
  eval(files.read(dir));
} else {
  toast("目录 " + dir + " 不存在");
}

import fs from "fs";

import { MidiParser } from "../../packages/aa.mjs";

fs.readFile("D:\\code\\technology-changes-life\\packages\\autojs\\children_of_the_light_music\\asset\\错位时空.mid", "base64", function (err, data) {
  
  var midiArray = MidiParser.parse(data);

  // 写入到指定文件
  fs.writeFileSync("./temp.json", JSON.stringify(midiArray));
});

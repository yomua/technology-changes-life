import fs, { copyFile } from "fs";
import path from "path";

import { rootDir } from "./constants.mjs";
import { compressCode, copyDirectory, handleFile } from "./tools.mjs";

// 递归处理目录和文件
function processDirectory(sourcePath, targetPath) {
  // 读取目录中的所有文件和子目录
  const entries = fs.readdirSync(sourcePath, { withFileTypes: true });

  entries.forEach((entry) => {
    const rootPath = path.join(sourcePath, entry.name);
    const destPath = path.join(targetPath, entry.name);
    // 如果是目录，递归处理
    if (entry.isDirectory()) {
      // 创建目标目录（如果不存在）
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      processDirectory(rootPath, destPath);
    } else if (entry.isFile()) {
      // 如果是文件，读取文件内容，处理并写入到目标目录
      const content = fs.readFileSync(rootPath, "utf8");
      const processedContent = compressCode(content);
      fs.writeFileSync(destPath, processedContent, "utf8");
    }
  });
}

// 创建 dist/src 目录并开始处理
if (!fs.existsSync(`${rootDir}/dist/src`)) {
  fs.mkdirSync(`${rootDir}/dist/src`, { recursive: true });
}
processDirectory(`${rootDir}/src`, `${rootDir}/dist/src`);

// 创建 dist/packages 目录并开始处理
if (!fs.existsSync(`${rootDir}/dist/packages`)) {
  fs.mkdirSync(`${rootDir}/dist/packages`, { recursive: true });
}
processDirectory(`${rootDir}/packages`, `${rootDir}/dist/packages`);

// 复制 dist/asset 目录
if (!fs.existsSync(`${rootDir}/dist/asset`)) {
  fs.mkdirSync(`${rootDir}/dist/asset`, { recursive: true });
}
copyDirectory(`${rootDir}/asset`, `${rootDir}/dist/asset`);

// 复制 config.json
// fs.copyFileSync(`${rootDir}/config.json`, `${rootDir}/dist/config.json`);
handleFile(`${rootDir}/dist/config.json`, (content) => {
  return compressCode(content);
});

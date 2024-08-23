import fs from "fs";
import path from "path";

// 递归复制目录和文件
export function copyDirectory(sourcePath, targetPath) {
  // 读取目录中的所有文件和子目录
  const entries = fs.readdirSync(sourcePath, { withFileTypes: true });

  entries.forEach((entry) => {
    const sPath = path.join(sourcePath, entry.name);
    const tPath = path.join(targetPath, entry.name);

    if (entry.isDirectory()) {
      // 如果是目录，递归复制
      createDirIfNotExists(tPath);
      copyDirectory(sPath, tPath);
    } else if (entry.isFile()) {
      // 如果是文件，复制文件
      fs.copyFileSync(sPath, tPath);
    }
  });
}

// 压缩代码
export function compressCode(content) {
  // 定义行末和下一行开头之间的间隔
  const LINE_BREAK = "\n\n";

  const commentRegex = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/gm;

  // 删除注释代码和空格代码，但保留行末空格
  return content
    .replace(commentRegex, (match) => {
      // 如果是单行注释，则返回一个空行间隙（即在行末加上两个换行符）
      if (match.startsWith("//")) {
        return LINE_BREAK;
      }
      // 如果是多行注释，则保留与其同样长度的空白字符，并返回一个空行间隙
      else {
        return (
          match
            .split("")
            .map((char) => {
              return /\s/.test(char) ? char : " ";
            })
            .join("") + LINE_BREAK
        );
      }
    })
    .replace(/(\r\n|\n|\r)/gm, "");
}

// 处理指定文件, 并把处理好的内容重写写入
export function handleFile(filePath, callback) {
  const content = fs.readFileSync(filePath, "utf8");
  const handleContent = callback(content, filePath);
  fs.writeFileSync(filePath, handleContent, "utf8");
}

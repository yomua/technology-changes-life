# children_of_the_light_music

## 介绍

光遇弹琴脚本，仅供学习使用

## 使用说明

1.  下载源文件: [源文件](https://gitee.com/yomua/technology-changes-life/tree/master/packages/autojs/children_of_the_light_music)

2.  手机根目录创建 children_of_the_light_music 文件夹

3.  将刚才下载好的源文件拷贝到 children_of_the_light_music 文件夹

    目录应该为:

    ```bash
      children_of_the_light_music
        ├── config.json
        └── hamibot.js
        └── DEV_README.md
        └── README.md
        └── asset
        └── packages
        └── src
    ```

4.  在 hamibot.com 中创建脚本，参见：[创建脚本](https://docs.hamibot.com/guide/tutorial-create-script)

    如果打不开网址, 则参见 [指南](https://docs.hamibot.com/guide/install-hamibot) - 创建脚本

5.  将 `children_of_the_light_music/hamibot.js` 复制到创建的脚本，点击运行

## 如何添加新的音乐

- 在手机目录 `children_of_the_light_music/asset` 目录添加你下载 `.mid` 文件即可

  `.mid` 文件是必需的, 你需要什么音乐, 则就必须要有此音乐的 `.mid` 文件

- **如果**需要显示歌词, 则在 `children_of_the_light_music/asset` 添加和 `.mid` 文件对应的 `.lrc` 文件

  注意: `.lrc` 文件不是必须的, 只有你需要显示歌词时, 才需要有

文件目录大概如下:

```bash
  children_of_the_light_music
    ├── asset
      ├── 错位时空.mid
      └── 错位时空.lrc
```

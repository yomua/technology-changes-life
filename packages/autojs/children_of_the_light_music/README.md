# children_of_the_light_music

## 介绍

游戏弹琴脚本，仅供学习使用

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

以下是你可能会在意的问题:

- 目前 `.mid` 文件转换为游戏按键数据时, 还没有支持同时多键一起按的转换.

- 目前不支持黑键, 

- `.mid` 文件至少需要一定程度能支持能被转为 15 键的音符,

  如果转换出来的歌曲, 播放出来很怪, 那就是不满足, 有 4 种解决方法:

  1. 寻找到更多同样歌曲的 `.mid` 文件, 尝试每个都转换, 直到找到播放出来没什么大问题的.

     推荐网站: [MIDI 下载](https://www.midishow.com/)

  2. 根据音乐, 自己书写 midi, 不要存在黑键, 以及能适配游戏 15 个按键的.

  3. 自己编写按键的 JSON 文件

     你可以通过参考歌曲的简谱来编写

  4. 联系作者修改源代码, 以支持更多的 `.mid` 文件, 或自己修改源码.

文件目录大概如下:

```bash
  children_of_the_light_music
    ├── asset
      ├── 错位时空.mid
      └── 错位时空.lrc
```

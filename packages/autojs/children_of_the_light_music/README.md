# 介绍

游戏弹琴脚本，仅供学习使用

# 使用说明

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

# 如何添加新的音乐

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

# 常见问题:

- 如何确定坐标修改时, 坐标对应上了游戏键?

  打开手机设置 - 开发者 - 指针位置选项, 启用它, 然后重新设置坐标时, 就能看清楚是否设置正确的位置.

  在弹奏任意一个音乐, 查看指针位置是否正确按到了键.

- 为什么我手指明明对上了按键, 坐标仍然有偏移? 尝试以下解决方法

  1. 设置坐标, 手按下去时, 停留 1s 左右, 再松开.

  2. 如果坐标偏移, 查看偏移的方向, 然后设置坐标修改的时候, 朝反方向移动一点, 这样负负得正即可.

- 为什么有时候进度条在播放, 却没有弹奏, 但是有时候又有?

  这种其情况有以下 3 种可能:

  1. 你手机发热, 卡住了, 因为这是脚本, 会调用手机底层接口, 等手机冷却会儿或重上游戏, 重启脚本试试.

  2. 解析 MIDI 出现了错误, 重启脚本, 重新解析.

  3. 打开 Android - 开发者 - 指针位置选项, 然后再重新弹奏歌曲, 这时候观察指针位置是否被按压

     打开指针位置选项, 是因为打开了这个选项之后, 会将触摸优先级提高, 根本上还是手机卡了问题.

- 目前 `.mid` 文件转换为游戏按键数据时, 还没有支持同时多键一起按的转换.

- `.mid` 文件至少需要一定程度能支持能被转为 15/22/37 键的音符,

  如果转换出来的歌曲, 播放出来很怪, 那就是不满足, 有 4 种解决方法:

  1. 尝试启用 22 键 + 15 黑键开关

  2. 寻找到更多同样歌曲的 `.mid` 文件, 尝试每个都转换, 直到找到播放出来没什么大问题的.

     推荐网站: [MIDI 下载](https://www.midishow.com/)

  3. 根据音乐, 自己书写 midi

  4. 自己编写按键的 JSON 文件, 然后放入 `asset` 文件夹中, 文件名会被映射为歌曲名.

     按键字段描述参见: `doc/json数据格式说明.md`

     你可以通过参考歌曲的简谱来编写

  5. 联系作者修改源代码, 以支持更多的 `.mid` 文件, 或自己修改源码.

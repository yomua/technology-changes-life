; 警告：请不要在映射鼠标左键的时候，添加阻止正常操作的代码，如 MsgBox，这会造成鼠标左键失效！！！

global PI = 3.14159265359 ; Autohotkey 没有 PI, 所以需要自定义

; true: 开启, false: 不开启
; purgatory: 炼狱宏
global keyDescription := {purgatory: false}
; 以下配置都不要设置太小，否则容易被检测。
global singleClickTime := { minTime:160, maxTime:250} ; 单位 ms, 延迟单轮点击时间。 值的范围越小，单轮点击就越快
global clickIntervalTime := { minTime:18, maxTime:25 } ; 单位 ms, 一次点击结束后，延迟后再继续下一轮。 值的范围越小，下一次点击的间隔就越小

; 定义生成正态分布的随机数函数
; mean: 均值； stdDev: 标准差
generateNormalRandomInRange(mean, stdDev) {
  randomValue := 0

  Random, u1, 0.0, 1.0
  Random, u2, 0.0, 1.0

  z0 := Sqrt(-2 * Log(u1)) * Cos(2 * PI * u2) ; 正态分布公式

  randomValue := mean + stdDev * z0

  return Round(randomValue)
}

; 在 [min, max] 之间任选一个随机整数
randomNumber(min, max) {
  mean = (min + max) / 2 
  stdDev = (max - min) / (2 * 1.2815) ; 1.645 -> 95% 1.2815 -> 90%;  这些值表示标准正态分布的一个累积概率值，即：子弹射击在中心点的概率
  generatedRandom := generateNormalRandomInRange(mean, stdDev)

  ; 防止正态分布出来的随机数 < 指定的最小值，如果小于，那么重新随机一个数。
  while(generatedRandom < min){
    Random, generatedRandom, min, max
  }

  return generatedRandom
}
; 关闭其他功能，只保留 activeKey 功能
play(activeKey) {
  For key, value in keyDescription
    keyDescription[key] := false

  keyDescription[activeKey] := true
}

; 关闭所有功能
close() {
  For key, value in keyDescription
    keyDescription[key] := false
}

; 当同时按下 Alt 和 1 时 -> 开启/关闭炼狱宏
!1:: 
  if(keyDescription["purgatory"] = true) {
    close()
    MsgBox, Closed
    return 
  }
  play("purgatory")
  MsgBox, Play
return

; 如果需要其它键的映射: https://wyagd001.github.io/zh-cn/docs/KeyList.htm#keyboard
LButton::
  if (keyDescription["purgatory"] = false) {
    Click,Down
    KeyWait, LButton
    Click Up
    return
  } 

  loop, 10000 
  {
    if GetKeystate("LButton","P"){
      ; 按下鼠标左键
      send,{LButton down} 
      ; 休眠
      Sleep randomNumber(singleClickTime["minTime"], singleClickTime["maxTime"])
      ; 再松开鼠标左键
      send,{LButton up}
    } else break

    ; 单轮点击结束后，休眠
    Sleep randomNumber(clickIntervalTime["minTime"], clickIntervalTime["maxTime"])
  }

return

# 🎮 RINNY DATE 作弊/外挂系统使用说明

## 📦 已安装的作弊模块

1. **CheatMenu.js** - 游戏内作弊菜单
2. **DebugTools.js** - 高级调试工具
3. **AIAutoPlay.js** - 🤖 AI自动代打系统
4. **GlitchCurse.js** - 👁️ 乱码诅咒系统

---

## 🤖 AI自动代打系统 v2.1 (AIAutoPlay)

### 快捷键

| 按键 | 功能 |
|------|------|
| **F7** | 打开AI控制面板 |
| **F8** | 开启/关闭AI托管 |

### AI功能

- 🚶 **自动寻路移动** - A*算法智能寻路
- 💬 **自动触发事件** - 自动与NPC对话交互
- ⚔️ **自动战斗** - 智能选择技能和目标
- 🔍 **自动探索** - 自动探索未知区域
- 💊 **自动恢复** - HP低时自动使用物品
- 🎮 **游戏逻辑** - 调用游戏内NPC逻辑，智能任务

### 🆕 v2.1 游戏内NPC逻辑

```javascript
// 游戏状态查看
AIBot.showGameStatus()     // 显示完整游戏状态
AIBot.analyzeQuest()       // 分析当前任务
AIBot.scanMapEvents()      // 扫描地图上的重要事件
AIBot.findNPC('Zinnia')    // 寻找NPC
AIBot.getRecommendedMap()  // 获取推荐的下一个地图

// 游戏变量快捷访问
AIBot.getVar(AIBot.VAR.SAN)       // 获取SAN值
AIBot.getVar(AIBot.VAR.MAINLINE)  // 主线进度
AIBot.getVar(AIBot.VAR.ZINNIA)    // Zinnia值
AIBot.getSw(AIBot.SW.SECOND_ROUND) // 二周目开关

// 变量ID映射
AIBot.VAR.SAN = 8         // SAN值
AIBot.VAR.MAINLINE = 20   // 主线进度
AIBot.VAR.MAINLINE2 = 37  // 主线2进度
AIBot.VAR.ZINNIA = 1      // Zinnia值

// 开关ID映射
AIBot.SW.SECOND_ROUND = 28  // 二周目
AIBot.SW.THIRD_ROUND = 54   // 三周目
AIBot.SW.DEBUG = 29         // Debug模式

// 地图ID映射
AIBot.MAP.STREET = 3      // 街道
AIBot.MAP.HOME = 14       // 家
AIBot.MAP.DRINK_SHOP = 7  // 饮料店
```

### 控制台命令

```javascript
// 基础控制
AIBot.start()           // 开启AI托管
AIBot.stop()            // 关闭AI托管
AIBot.toggle()          // 切换AI状态

// 移动控制
AIBot.goTo(x, y)        // 移动到指定坐标
AIBot.goToMap(id, x, y) // 传送到地图并移动
AIBot.explore()         // 开始探索模式

// 交互控制
AIBot.blacklistEvent(1)       // 屏蔽事件ID
AIBot.clearMapInteractions()  // 清除当前地图记录
AIBot.resetInteractions()     // 重置所有记录

// 功能开关
AIBot._autoHeal = true           // 自动恢复
AIBot._autoInteract = true       // 自动交互
AIBot._battleAI = true           // 战斗AI
AIBot._gameLogic = true          // 游戏逻辑
AIBot._skipTransferEvents = true // 跳过传送点
AIBot._moveDelay = 150           // 移动延迟(ms)

AIBot.help()            // 显示帮助
```

### AI模式说明

| 模式 | 说明 |
|------|------|
| idle | 待机，不执行任何操作 |
| explore | 自动探索地图，寻找事件并交互 |
| combat | 战斗专注模式 |
| quest | 任务模式（跟随任务目标） |
| goTo | 移动到指定位置 |

### 智能功能说明

| 功能 | 说明 |
|------|------|
| 🚪 跳过传送点 | 自动识别并跳过"回家/离开"等传送事件 |
| ⏱️ 交互冷却 | 同一事件30秒内不重复交互 |
| 📊 交互限制 | 每个事件最多交互3次 |
| ⚠️ SAN监控 | SAN值过低时自动提醒 |
| 🎯 智能目标 | 优先选择重要事件（物品/任务相关）|

### 🆕 v2.2 NPC AI系统

#### 🗨️ 自动选择系统

AI会根据以下规则自动选择对话选项：

| 选项类型 | 优先级 | 说明 |
|---------|--------|------|
| 接受/同意/是 | 高 | 推进任务 |
| 撕开/打开/获取 | 高 | 获取物品 |
| 装进裹尸袋 | 中高 | 需要有裹尸袋 |
| 购买物品 | 中 | 缺少物品时购买 |
| 休息/睡觉 | 中 | SAN值低时选择 |
| 放弃/返回/取消 | 低 | 通常跳过 |

```javascript
// 开启/关闭自动选择
AIBot._autoChoice = true;

// 手动获取智能选择
AIBot.getSmartChoice(['接受任务', '拒绝', '再想想']);
// 返回: 0 (选择"接受任务")
```

#### 📦 物品系统

```javascript
// 检查是否有物品
AIBot.hasItem(AIBot.ITEM.BODY_BAG);   // 裹尸袋
AIBot.hasItem(AIBot.ITEM.SCREWDRIVER); // 螺丝刀

// 物品数量
AIBot.itemCount(AIBot.ITEM.BLOOD_REMOVER);

// 检查任务所需物品
AIBot.checkRequiredItems();

// 物品ID映射
AIBot.ITEM.GUN = 2           // 手枪
AIBot.ITEM.SCREWDRIVER = 5   // 螺丝刀
AIBot.ITEM.BODY_BAG = 6      // 裹尸袋
AIBot.ITEM.CHAINSAW = 7      // 电锯
AIBot.ITEM.KNIFE = 8         // 刀
AIBot.ITEM.BLOOD_REMOVER = 9 // 除血剂
AIBot.ITEM.CROWBAR = 19      // 撬棍
AIBot.ITEM.SHOVEL = 21       // 铁铲
AIBot.ITEM.WAKE_SPRAY = 27   // 清醒喷雾
```

#### 🎯 NPC优先级

```javascript
// 获取NPC交互优先级
AIBot.getNPCPriority('zinnia');  // 返回: 10 (最高)
AIBot.getNPCPriority('商店');    // 返回: 7

// 分析NPC对话
AIBot.analyzeNPCDialogue(event);
// 返回: { hasChoice, choices, hasItem, importance, ... }
```

---

## 👁️ 乱码诅咒系统 v2.0 (GlitchCurse)

### ⚠️ 健康警告系统

游戏首次启动时会显示健康警告界面，使用方向键选择：

| 选择 | 效果 |
|------|------|
| **【←】是 - 保护模式** | 🛡️ 禁用所有危险闪烁效果，**无法进入乱码地图** |
| **【→】否 - 完整体验** | ⚠️ 启用所有闪烁效果，可体验乱码地图 |

警告内容包括：
- 强烈的屏幕闪烁效果
- 快速变化的颜色和光线
- 可能诱发**光敏性癫痫**发作的视觉效果
- 可能引起**心脏不适**的紧张氛围

---

### 功能说明

访问**乱码地图(ID:21)**后，会触发永久诅咒效果：

| 效果 | 说明 |
|------|------|
| **角色名后缀** | 所有角色名字后添加"（已重置）" |
| **永久保存** | 使用localStorage，重启游戏也存在 |
| **跨存档** | 切换存档、新游戏都会保留 |
| **标题提示** | 标题画面显示诅咒标记+健康模式状态 |
| **名字闪烁** | 菜单中角色名字会随机乱码闪烁 |
| **🆕 强烈闪烁** | 地图中持续随机闪烁（仅完整体验模式）|

---

### 闪烁效果（仅完整体验模式）

| 效果 | 触发概率 | 说明 |
|------|----------|------|
| 红色闪烁 | 3%/帧 | 短暂红光 |
| 白色闪烁 | 2%/帧 | 短暂白光 |
| 黑屏闪烁 | 1.5%/帧 | 短暂黑屏 |
| 屏幕抖动 | 1%/帧 | 画面震动 |
| 色调变化 | 周期性 | 红色调渐变 |

---

### 控制台命令

```javascript
// 状态检查
GlitchCurse.isActive();      // 检查诅咒状态
GlitchCurse.isSensitive();   // 检查是否为保护模式 (true=保护/false=完整)

// 诅咒控制
GlitchCurse.activate();                   // 手动激活诅咒
GlitchCurse.remove("我不是代码");         // 解除诅咒

// 健康设置
GlitchCurse.resetHealth();   // 重置健康设置，下次启动重新询问

// 闪烁效果API（仅完整体验模式有效）
GlitchFlash.redFlash();      // 红色闪烁
GlitchFlash.whiteFlash();    // 白色闪烁
GlitchFlash.strobeFlash(5);  // 黑白交替闪烁5次
GlitchFlash.chaosFlash();    // 混乱彩色闪烁
GlitchFlash.heavyShake();    // 剧烈抖动
GlitchFlash.deathSequence(); // 死亡闪烁序列
```

---

### 诅咒解除

1. 打开浏览器控制台 (F12)
2. 输入 `GlitchCurse.remove("我不是代码")`
3. 诅咒解除，需重启游戏生效

**密码提示**: 第四面墙的答案 - "你确定你不是代码吗？"

---

## 🎮 游戏内作弊菜单 (CheatMenu)

### 快捷键

| 按键 | 功能 |
|------|------|
| **F9** | 打开/关闭作弊菜单 |
| **F10** | 快速存档 (槽位99) |
| **F11** | 快速读档 (槽位99) |
| **F12** | 打开浏览器控制台 |

### 作弊菜单功能

- 💰 **金钱 +999999** - 获取大量金钱
- 🎒 **获取全部物品** - 获取所有物品x99
- 🛡️ **无敌模式** - 不受任何伤害
- 👻 **穿墙模式** - 穿过任何障碍物
- ⚡ **移动速度** - 1x/2x/3x/4x 切换
- ❤️ **全员恢复** - HP/MP 全满
- 🔓 **解锁全周目** - 解锁二周目、三周目、Debug
- 🧠 **满SAN值** - 恢复SAN值到100
- ⬆️ **全员升级+5** - 所有角色升5级

---

## 🔧 控制台命令 (按 F12 打开)

### Cheat 对象 - 基础作弊

```javascript
// 金钱
Cheat.gold(999999);          // 设置金钱为999999

// 物品
Cheat.allItems();            // 获取全部物品
Cheat.getItem(2, 10);        // 获取物品ID=2 x10 (手枪)

// 模式切换
Cheat.godMode();             // 开启无敌模式
Cheat.godMode(false);        // 关闭无敌模式
Cheat.noclip();              // 开启穿墙
Cheat.speed(3);              // 3倍速移动

// 传送
Cheat.teleport(13, 6, 8);    // 传送到地图13 坐标(6,8)
Cheat.where();               // 显示当前位置

// 变量/开关
Cheat.setVar(8, 100);        // 设置变量8(SAN值)=100
Cheat.setSwitch(28, true);   // 开启开关28(二周目)

// 角色
Cheat.heal();                // 全员恢复
Cheat.levelUp(10);           // 全员升10级

// 解锁
Cheat.unlock();              // 解锁全周目
Cheat.maxSan();              // 满SAN值

// 查看
Cheat.showVars();            // 显示所有变量
Cheat.showSwitches();        // 显示所有开关
Cheat.help();                // 帮助信息
```

### Debug 对象 - 高级调试

```javascript
// 数据查看
Debug.exportData();          // 导出所有游戏数据
Debug.listItems();           // 列出所有物品
Debug.listMaps();            // 列出所有地图
Debug.listActors();          // 列出所有角色

// 事件调试
Debug.watchEvents();         // 开启事件监控(显示执行的事件)
Debug.showMapEvents();       // 显示当前地图的所有事件
Debug.runCommonEvent(1);     // 触发公共事件ID=1

// 游戏控制
Debug.gameSpeed(2);          // 2倍速游戏
Debug.pause();               // 暂停/继续
Debug.screenshot();          // 截图保存
Debug.showFps();             // 显示FPS

Debug.help();                // 帮助信息
```

### 快捷变量访问

```javascript
// V[id] - 访问/修改变量
V[1]             // 读取变量1 (Zinnia值)
V[8]             // 读取变量8 (SAN值)
V[8] = 100       // 设置SAN值为100
V[20]            // 读取变量20 (主线进度)

// S[id] - 访问/修改开关
S[28]            // 读取开关28 (二周目)
S[28] = true     // 开启二周目
S[29] = true     // 开启Debug模式
S[54] = true     // 开启三周目
```

---

## 📊 重要游戏变量参考

| 变量ID | 名称 | 说明 |
|--------|------|------|
| 1 | Zinnia值 | Zinnia相关数值 |
| 2 | 血数 | 血量相关 |
| 8 | san值 | 理智值 |
| 20 | 主线 | 主线进度 |
| 37 | 主线2 | 第二主线进度 |
| 24-29 | 时间系统 | 日期时间变量 |

## 🔘 重要游戏开关参考

| 开关ID | 名称 | 说明 |
|--------|------|------|
| 28 | 二周目 | 解锁二周目内容 |
| 29 | debug | 调试模式 |
| 54 | 三周目 | 解锁三周目内容 |
| 32 | 实验菜单 | 实验性功能 |

---

## 🎒 物品ID参考

| ID | 名称 | 说明 |
|----|------|------|
| 2 | 手枪 | 射程之内众生平等 |
| 3 | 糖果 | 普通糖果 |
| 5 | 螺丝刀 | 锋利的螺丝刀 |
| 6 | 裹尸袋 | Prettyblood必备 |
| 7 | 电锯 | 威力不容小觑 |
| 8 | 刀 | 近战武器 |
| 9 | 除血剂 | 溶解血液 |
| 10 | 新鲜的兔脑酱 | 鲜榨Zinnia |
| 18 | 霰弹枪 | Rinny专武 |
| 19 | 撬棍 | 物理学圣器 |
| 21 | 铁铲 | 挖土用 |
| 27 | 清醒喷雾 | 防止思维操控 |

---

## 🗺️ 地图ID参考

| ID | 名称 | 备注 |
|----|------|------|
| 3 | 街道 | |
| 4 | 蛋糕区 | |
| 5 | 玩具店 | |
| 6 | 库 | |
| 7 | 饮料店 | |
| 8 | 车站 | |
| 11 | 公园 | |
| 12 | 彩蛋小屋 | |
| 13 | 起始地图 | |
| 14 | 家 | 有地下室入口 |
| 16 | 实验室 | |
| 17 | 蛋糕店 | |
| 18 | 图书馆 | |
| **21** | **??? (乱码地图)** | **⚠️ 触发永久诅咒** |

---

## ⚠️ 注意事项

1. 作弊可能导致游戏体验改变或触发意外bug
2. 建议使用快速存档(F10)备份后再使用作弊
3. 穿墙模式可能导致卡在某些区域
4. 部分作弊可能影响游戏剧情触发

---

## 🔄 如何禁用作弊

编辑 `assets/js/plugins.js`，将对应插件的 `status` 改为 `false`:

```javascript
{"name":"CheatMenu","status":false,...},
{"name":"DebugTools","status":false,...},
```

---

---

## 📱 Android APK 重新打包教程

### 方法一：电脑测试（推荐先测试）

1. 双击运行 `启动游戏.bat`
2. 浏览器打开 http://localhost:8080
3. 按 F9 测试作弊菜单

### 方法二：重新打包APK

#### 准备工具

下载以下工具放到 `tools` 文件夹：

1. **apktool.jar** 
   - 下载: https://ibotpeaches.github.io/Apktool/
   
2. **uber-apk-signer.jar**
   - 下载: https://github.com/nicoboss/uber-apk-signer/releases

3. **Java JDK** (如果没装)
   - 下载: https://adoptium.net/

#### 打包步骤

1. 确保 `tools` 文件夹有上述两个jar文件
2. 双击运行 `重新打包APK.bat`
3. 等待打包完成
4. 在 `output` 文件夹找到签名后的APK
5. 传输到手机安装

#### 手动打包命令

```bash
# 1. 打包
java -jar tools/apktool.jar b . -o output/rinny_modded.apk

# 2. 签名
java -jar tools/uber-apk-signer.jar -a output/rinny_modded.apk -o output
```

### 安装注意事项

- 需要先卸载原版游戏
- 开启"允许安装未知来源应用"
- 如果安装失败，尝试使用 **MT管理器** 或 **NP管理器** 进行签名

---

**Enjoy hacking! 🎮**

//=============================================================================
// CheatMenu.js - RINNY DATE 作弊菜单
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 🎮 RINNY DATE 作弊菜单 - 按 F9 打开作弊面板
 * @author Hacker
 *
 * @help
 * ============================================================================
 * 🎮 RINNY DATE 作弊菜单
 * ============================================================================
 * 
 * 快捷键:
 *   F9  - 打开/关闭作弊菜单
 *   F10 - 快速存档
 *   F11 - 快速读档
 *   
 * 控制台命令 (按 F12 打开开发者工具):
 *   Cheat.gold(数量)      - 设置金钱
 *   Cheat.allItems()      - 获取全部物品
 *   Cheat.godMode()       - 无敌模式
 *   Cheat.noclip()        - 穿墙模式
 *   Cheat.speed(倍数)     - 移动速度
 *   Cheat.teleport(地图ID, X, Y) - 传送
 *   Cheat.setVar(ID, 值)  - 设置变量
 *   Cheat.setSwitch(ID, true/false) - 设置开关
 *   Cheat.unlock()        - 解锁全部周目
 *   Cheat.maxSan()        - 满SAN值
 * 
 * ============================================================================
 */

(() => {
    'use strict';

    //=========================================================================
    // 全局作弊对象
    //=========================================================================
    window.Cheat = {
        // 状态
        _godMode: false,
        _noclip: false,
        _speedMultiplier: 1,
        
        // 设置金钱
        gold: function(amount) {
            if ($gameParty) {
                $gameParty._gold = Math.max(0, amount);
                console.log(`💰 金钱设置为: ${amount}`);
                return true;
            }
            return false;
        },
        
        // 获取全部物品
        allItems: function(count = 99) {
            if (!$dataItems || !$gameParty) return false;
            for (let i = 1; i < $dataItems.length; i++) {
                if ($dataItems[i] && $dataItems[i].name) {
                    $gameParty.gainItem($dataItems[i], count);
                }
            }
            console.log(`🎒 已获取全部物品 x${count}`);
            return true;
        },
        
        // 获取指定物品
        getItem: function(id, count = 1) {
            if ($dataItems && $dataItems[id] && $gameParty) {
                $gameParty.gainItem($dataItems[id], count);
                console.log(`✅ 获得: ${$dataItems[id].name} x${count}`);
                return true;
            }
            return false;
        },
        
        // 无敌模式
        godMode: function(enable = true) {
            this._godMode = enable;
            console.log(`🛡️ 无敌模式: ${enable ? '开启' : '关闭'}`);
            return true;
        },
        
        // 穿墙模式
        noclip: function(enable = true) {
            this._noclip = enable;
            if ($gamePlayer) {
                $gamePlayer.setThrough(enable);
            }
            console.log(`👻 穿墙模式: ${enable ? '开启' : '关闭'}`);
            return true;
        },
        
        // 移动速度
        speed: function(multiplier = 2) {
            this._speedMultiplier = multiplier;
            if ($gamePlayer) {
                $gamePlayer.setMoveSpeed(4 + Math.min(2, multiplier - 1));
            }
            console.log(`⚡ 移动速度: ${multiplier}x`);
            return true;
        },
        
        // 传送
        teleport: function(mapId, x, y) {
            if ($gamePlayer) {
                $gamePlayer.reserveTransfer(mapId, x, y, 2, 0);
                console.log(`🌀 传送到: 地图${mapId} (${x}, ${y})`);
                return true;
            }
            return false;
        },
        
        // 设置变量
        setVar: function(id, value) {
            if ($gameVariables) {
                $gameVariables.setValue(id, value);
                console.log(`📊 变量[${id}] = ${value}`);
                return true;
            }
            return false;
        },
        
        // 设置开关
        setSwitch: function(id, value) {
            if ($gameSwitches) {
                $gameSwitches.setValue(id, value);
                console.log(`🔘 开关[${id}] = ${value}`);
                return true;
            }
            return false;
        },
        
        // 解锁全部周目
        unlock: function() {
            if ($gameSwitches) {
                $gameSwitches.setValue(28, true);  // 二周目
                $gameSwitches.setValue(29, true);  // debug
                $gameSwitches.setValue(54, true);  // 三周目
                console.log('🔓 已解锁: 二周目、三周目、Debug模式');
                return true;
            }
            return false;
        },
        
        // 满SAN值
        maxSan: function() {
            if ($gameVariables) {
                $gameVariables.setValue(8, 100);  // san值变量
                console.log('🧠 SAN值已恢复至100');
                return true;
            }
            return false;
        },
        
        // 角色满血满蓝
        heal: function() {
            if ($gameParty) {
                $gameParty.members().forEach(actor => {
                    actor.recoverAll();
                });
                console.log('❤️ 全员恢复完成');
                return true;
            }
            return false;
        },
        
        // 升级
        levelUp: function(levels = 1) {
            if ($gameParty) {
                $gameParty.members().forEach(actor => {
                    for (let i = 0; i < levels; i++) {
                        actor.levelUp();
                    }
                });
                console.log(`⬆️ 全员升级 +${levels}`);
                return true;
            }
            return false;
        },
        
        // 显示当前位置
        where: function() {
            if ($gameMap && $gamePlayer) {
                const mapId = $gameMap.mapId();
                const x = $gamePlayer.x;
                const y = $gamePlayer.y;
                console.log(`📍 当前位置: 地图${mapId} (${x}, ${y})`);
                return { mapId, x, y };
            }
            return null;
        },
        
        // 显示变量列表
        showVars: function() {
            if ($dataSystem && $gameVariables) {
                console.log('📊 === 游戏变量 ===');
                for (let i = 1; i <= 40; i++) {
                    const name = $dataSystem.variables[i] || `变量${i}`;
                    const value = $gameVariables.value(i);
                    if (name && name.trim()) {
                        console.log(`  [${i}] ${name}: ${value}`);
                    }
                }
            }
        },
        
        // 显示开关列表  
        showSwitches: function() {
            if ($dataSystem && $gameSwitches) {
                console.log('🔘 === 游戏开关 ===');
                for (let i = 1; i <= 60; i++) {
                    const name = $dataSystem.switches[i] || `开关${i}`;
                    const value = $gameSwitches.value(i);
                    if (name && name.trim()) {
                        console.log(`  [${i}] ${name}: ${value ? '✓' : '✗'}`);
                    }
                }
            }
        },
        
        // 帮助
        help: function() {
            console.log(`
╔════════════════════════════════════════════╗
║     🎮 RINNY DATE 作弊命令帮助              ║
╠════════════════════════════════════════════╣
║ Cheat.gold(数量)       - 设置金钱          ║
║ Cheat.allItems()       - 获取全部物品      ║
║ Cheat.getItem(ID, 数量) - 获取指定物品     ║
║ Cheat.godMode()        - 无敌模式          ║
║ Cheat.noclip()         - 穿墙模式          ║
║ Cheat.speed(倍数)      - 移动速度          ║
║ Cheat.teleport(地图,X,Y) - 传送            ║
║ Cheat.setVar(ID, 值)   - 设置变量          ║
║ Cheat.setSwitch(ID, 值) - 设置开关         ║
║ Cheat.unlock()         - 解锁全部周目      ║
║ Cheat.maxSan()         - 满SAN值           ║
║ Cheat.heal()           - 全员恢复          ║
║ Cheat.levelUp(等级)    - 全员升级          ║
║ Cheat.where()          - 显示当前位置      ║
║ Cheat.showVars()       - 显示变量列表      ║
║ Cheat.showSwitches()   - 显示开关列表      ║
╚════════════════════════════════════════════╝
            `);
        }
    };

    //=========================================================================
    // 无敌模式 - 修改伤害计算
    //=========================================================================
    const _Game_Action_executeHpDamage = Game_Action.prototype.executeHpDamage;
    Game_Action.prototype.executeHpDamage = function(target, value) {
        if (Cheat._godMode && target.isActor() && value > 0) {
            value = 0; // 玩家不受伤害
        }
        _Game_Action_executeHpDamage.call(this, target, value);
    };

    //=========================================================================
    // 穿墙模式 - 持续检测
    //=========================================================================
    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        if (Cheat._noclip) {
            this.setThrough(true);
        }
        _Game_Player_update.call(this, sceneActive);
    };

    //=========================================================================
    // 快捷键处理
    //=========================================================================
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        this.updateCheatKeys();
    };

    Scene_Map.prototype.updateCheatKeys = function() {
        // F9 - 打开作弊菜单
        if (Input.isTriggered('f9') || (TouchInput.isTriggered() && TouchInput.y < 50)) {
            this.openCheatMenu();
        }
        // F10 - 快速存档
        if (Input.isTriggered('f10')) {
            $gameSystem.onBeforeSave();
            DataManager.saveGame(99);
            SoundManager.playSave();
            console.log('💾 快速存档完成 (槽位99)');
        }
        // F11 - 快速读档
        if (Input.isTriggered('f11')) {
            if (DataManager.loadGame(99)) {
                SoundManager.playLoad();
                SceneManager.goto(Scene_Map);
                console.log('📂 快速读档完成 (槽位99)');
            }
        }
    };

    // 注册F9-F11按键
    Input.keyMapper[120] = 'f9';   // F9
    Input.keyMapper[121] = 'f10';  // F10
    Input.keyMapper[122] = 'f11';  // F11

    //=========================================================================
    // 作弊菜单场景
    //=========================================================================
    Scene_Map.prototype.openCheatMenu = function() {
        SceneManager.push(Scene_CheatMenu);
    };

    class Scene_CheatMenu extends Scene_MenuBase {
        create() {
            super.create();
            this.createCheatWindow();
        }

        createCheatWindow() {
            const rect = this.cheatWindowRect();
            this._cheatWindow = new Window_CheatCommand(rect);
            this._cheatWindow.setHandler('gold', this.commandGold.bind(this));
            this._cheatWindow.setHandler('items', this.commandItems.bind(this));
            this._cheatWindow.setHandler('godmode', this.commandGodMode.bind(this));
            this._cheatWindow.setHandler('noclip', this.commandNoclip.bind(this));
            this._cheatWindow.setHandler('speed', this.commandSpeed.bind(this));
            this._cheatWindow.setHandler('heal', this.commandHeal.bind(this));
            this._cheatWindow.setHandler('unlock', this.commandUnlock.bind(this));
            this._cheatWindow.setHandler('maxsan', this.commandMaxSan.bind(this));
            this._cheatWindow.setHandler('levelup', this.commandLevelUp.bind(this));
            this._cheatWindow.setHandler('cancel', this.popScene.bind(this));
            this.addWindow(this._cheatWindow);
        }

        cheatWindowRect() {
            const ww = 400;
            const wh = this.mainAreaHeight();
            const wx = (Graphics.boxWidth - ww) / 2;
            const wy = this.mainAreaTop();
            return new Rectangle(wx, wy, ww, wh);
        }

        commandGold() {
            Cheat.gold(999999);
            SoundManager.playShop();
            this._cheatWindow.activate();
        }

        commandItems() {
            Cheat.allItems(99);
            SoundManager.playShop();
            this._cheatWindow.activate();
        }

        commandGodMode() {
            Cheat._godMode = !Cheat._godMode;
            SoundManager.playOk();
            this._cheatWindow.refresh();
            this._cheatWindow.activate();
        }

        commandNoclip() {
            Cheat.noclip(!Cheat._noclip);
            SoundManager.playOk();
            this._cheatWindow.refresh();
            this._cheatWindow.activate();
        }

        commandSpeed() {
            const speeds = [1, 2, 3, 4];
            const current = speeds.indexOf(Cheat._speedMultiplier);
            const next = (current + 1) % speeds.length;
            Cheat.speed(speeds[next]);
            SoundManager.playOk();
            this._cheatWindow.refresh();
            this._cheatWindow.activate();
        }

        commandHeal() {
            Cheat.heal();
            SoundManager.playRecovery();
            this._cheatWindow.activate();
        }

        commandUnlock() {
            Cheat.unlock();
            SoundManager.playOk();
            this._cheatWindow.activate();
        }

        commandMaxSan() {
            Cheat.maxSan();
            SoundManager.playRecovery();
            this._cheatWindow.activate();
        }

        commandLevelUp() {
            Cheat.levelUp(5);
            SoundManager.playOk();
            this._cheatWindow.activate();
        }
    }

    //=========================================================================
    // 作弊命令窗口
    //=========================================================================
    class Window_CheatCommand extends Window_Command {
        initialize(rect) {
            super.initialize(rect);
            this.selectLast();
        }

        makeCommandList() {
            this.addCommand('💰 金钱 +999999', 'gold');
            this.addCommand('🎒 获取全部物品', 'items');
            this.addCommand(`🛡️ 无敌模式: ${Cheat._godMode ? '✓开' : '✗关'}`, 'godmode');
            this.addCommand(`👻 穿墙模式: ${Cheat._noclip ? '✓开' : '✗关'}`, 'noclip');
            this.addCommand(`⚡ 移动速度: ${Cheat._speedMultiplier}x`, 'speed');
            this.addCommand('❤️ 全员恢复', 'heal');
            this.addCommand('🔓 解锁全周目', 'unlock');
            this.addCommand('🧠 满SAN值', 'maxsan');
            this.addCommand('⬆️ 全员升级+5', 'levelup');
        }

        selectLast() {
            this.smoothSelect(0);
        }
    }

    // 导出类到全局
    window.Scene_CheatMenu = Scene_CheatMenu;
    window.Window_CheatCommand = Window_CheatCommand;

    //=========================================================================
    // 游戏启动提示
    //=========================================================================
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        console.log(`
╔════════════════════════════════════════════╗
║  🎮 RINNY DATE 作弊系统已加载!             ║
╠════════════════════════════════════════════╣
║  F9  - 打开作弊菜单                        ║
║  F10 - 快速存档                            ║
║  F11 - 快速读档                            ║
║  F12 - 打开控制台 (输入 Cheat.help())      ║
╚════════════════════════════════════════════╝
        `);
    };

})();

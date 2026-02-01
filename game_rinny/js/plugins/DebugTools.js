//=============================================================================
// DebugTools.js - RINNY DATE 高级调试工具
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 🔧 RINNY DATE 高级调试工具 - 游戏逆向辅助
 * @author Hacker
 *
 * @help
 * ============================================================================
 * 🔧 高级调试工具
 * ============================================================================
 * 
 * 本插件提供高级游戏调试和逆向功能。
 * 在控制台(F12)中使用 Debug 对象访问。
 * 
 * ============================================================================
 */

(() => {
    'use strict';

    //=========================================================================
    // 全局调试对象
    //=========================================================================
    window.Debug = {
        
        // 导出所有游戏数据
        exportData: function() {
            const data = {
                items: $dataItems,
                actors: $dataActors,
                maps: $dataMapInfos,
                system: $dataSystem,
                currentMap: $gameMap ? $gameMap.mapId() : null,
                party: $gameParty ? {
                    gold: $gameParty.gold(),
                    items: $gameParty.allItems(),
                    members: $gameParty.members().map(m => ({
                        name: m.name(),
                        level: m.level,
                        hp: m.hp,
                        mp: m.mp
                    }))
                } : null,
                variables: $gameVariables ? $gameVariables._data : null,
                switches: $gameSwitches ? $gameSwitches._data : null
            };
            console.log('📦 游戏数据导出:');
            console.log(JSON.stringify(data, null, 2));
            return data;
        },
        
        // 列出所有物品
        listItems: function() {
            console.log('📋 === 物品列表 ===');
            if ($dataItems) {
                $dataItems.forEach((item, i) => {
                    if (item && item.name) {
                        console.log(`[${i}] ${item.name} - ${item.description}`);
                    }
                });
            }
        },
        
        // 列出所有地图
        listMaps: function() {
            console.log('🗺️ === 地图列表 ===');
            if ($dataMapInfos) {
                $dataMapInfos.forEach((map, i) => {
                    if (map && map.name) {
                        console.log(`[${i}] ${map.name}`);
                    }
                });
            }
        },
        
        // 列出所有角色
        listActors: function() {
            console.log('👤 === 角色列表 ===');
            if ($dataActors) {
                $dataActors.forEach((actor, i) => {
                    if (actor && actor.name) {
                        console.log(`[${i}] ${actor.name} - ${actor.profile}`);
                    }
                });
            }
        },
        
        // 事件监控
        watchEvents: function(enable = true) {
            if (enable) {
                const _Game_Interpreter_executeCommand = Game_Interpreter.prototype.executeCommand;
                Game_Interpreter.prototype.executeCommand = function() {
                    if (this._list && this._index < this._list.length) {
                        const cmd = this._list[this._index];
                        console.log(`🎬 事件命令: [${cmd.code}]`, cmd.parameters);
                    }
                    return _Game_Interpreter_executeCommand.call(this);
                };
                console.log('👁️ 事件监控已开启');
            }
        },
        
        // 显示当前地图事件
        showMapEvents: function() {
            if ($gameMap) {
                console.log('🎭 === 当前地图事件 ===');
                $gameMap.events().forEach(event => {
                    if (event) {
                        console.log(`[${event.eventId()}] ${event.event().name} at (${event.x}, ${event.y})`);
                    }
                });
            }
        },
        
        // 触发指定公共事件
        runCommonEvent: function(eventId) {
            if ($gameTemp) {
                $gameTemp.reserveCommonEvent(eventId);
                console.log(`▶️ 触发公共事件: ${eventId}`);
            }
        },
        
        // 跳转到指定事件页面
        jumpToEventPage: function(eventId, pageIndex) {
            if ($gameMap) {
                const event = $gameMap.event(eventId);
                if (event) {
                    event._pageIndex = pageIndex;
                    event.refresh();
                    console.log(`📄 跳转到事件${eventId}的页面${pageIndex}`);
                }
            }
        },
        
        // 解锁所有存档槽位
        unlockAllSaves: function() {
            for (let i = 1; i <= 20; i++) {
                DataManager.makeSavefileInfo();
            }
            console.log('💾 已解锁所有存档槽位');
        },
        
        // 截图
        screenshot: function() {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = `rinny_screenshot_${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
                console.log('📷 截图已保存');
            }
        },
        
        // 修改游戏速度
        gameSpeed: function(multiplier = 1) {
            if (SceneManager._deltaTime) {
                SceneManager._deltaTime = 1 / (60 * multiplier);
            }
            console.log(`⏱️ 游戏速度: ${multiplier}x`);
        },
        
        // 暂停/继续游戏
        pause: function() {
            if (SceneManager._stopped) {
                SceneManager._stopped = false;
                console.log('▶️ 游戏继续');
            } else {
                SceneManager._stopped = true;
                console.log('⏸️ 游戏暂停');
            }
        },
        
        // 显示FPS
        showFps: function(show = true) {
            if (Graphics._fpsCounter) {
                Graphics._fpsCounter.style.display = show ? 'block' : 'none';
            }
            console.log(`📊 FPS显示: ${show ? '开' : '关'}`);
        },
        
        // 帮助
        help: function() {
            console.log(`
╔══════════════════════════════════════════════╗
║     🔧 RINNY DATE 调试工具帮助                ║
╠══════════════════════════════════════════════╣
║ Debug.exportData()      - 导出所有游戏数据   ║
║ Debug.listItems()       - 列出所有物品       ║
║ Debug.listMaps()        - 列出所有地图       ║
║ Debug.listActors()      - 列出所有角色       ║
║ Debug.watchEvents()     - 开启事件监控       ║
║ Debug.showMapEvents()   - 显示当前地图事件   ║
║ Debug.runCommonEvent(id) - 触发公共事件      ║
║ Debug.screenshot()      - 截图               ║
║ Debug.gameSpeed(倍数)   - 修改游戏速度       ║
║ Debug.pause()           - 暂停/继续游戏      ║
║ Debug.showFps()         - 显示FPS            ║
╚══════════════════════════════════════════════╝
            `);
        }
    };

    //=========================================================================
    // 游戏变量/开关快捷访问
    //=========================================================================
    Object.defineProperty(window, 'V', {
        get: function() {
            return new Proxy({}, {
                get: function(target, prop) {
                    return $gameVariables ? $gameVariables.value(parseInt(prop)) : 0;
                },
                set: function(target, prop, value) {
                    if ($gameVariables) {
                        $gameVariables.setValue(parseInt(prop), value);
                    }
                    return true;
                }
            });
        }
    });

    Object.defineProperty(window, 'S', {
        get: function() {
            return new Proxy({}, {
                get: function(target, prop) {
                    return $gameSwitches ? $gameSwitches.value(parseInt(prop)) : false;
                },
                set: function(target, prop, value) {
                    if ($gameSwitches) {
                        $gameSwitches.setValue(parseInt(prop), !!value);
                    }
                    return true;
                }
            });
        }
    });

    //=========================================================================
    // 启动提示
    //=========================================================================
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        console.log(`
╔══════════════════════════════════════════════╗
║  🔧 调试工具已加载!                           ║
╠══════════════════════════════════════════════╣
║  快捷访问变量: V[1], V[8] 等                 ║
║  快捷访问开关: S[28], S[29] 等               ║
║  输入 Debug.help() 查看帮助                  ║
╚══════════════════════════════════════════════╝
        `);
    };

})();

/*:
 * @target MZ
 * @plugindesc 远景图动态调整插件 - 允许实时调整远景图的大小、位置和显示属性
 * @author Your Name
 * @url 
 * 
 * @param Default Scale X
 * @desc 默认的远景图X轴缩放 (1.0 = 100%)
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 5.0
 * @default 1.0
 *
 * @param Default Scale Y
 * @desc 默认的远景图Y轴缩放 (1.0 = 100%)
 * @type number
 * @decimals 2
 * @min 0.1
 * @max 5.0
 * @default 1.0
 *
 * @param Default Offset X
 * @desc 默认的远景图X轴偏移
 * @type number
 * @default 0
 *
 * @param Default Offset Y
 * @desc 默认的远景图Y轴偏移
 * @type number
 * @default 0
 *
 * @help
 * 插件命令：
 *   SetParallaxScale mapId scaleX scaleY - 设置指定地图的远景图缩放
 *   SetParallaxOffset mapId offsetX offsetY - 设置指定地图的远景图偏移
 *   SetParallaxOpacity mapId opacity - 设置指定地图的远景图透明度 (0-255)
 *   SetParallaxBlendMode mapId mode - 设置混合模式 (0:正常, 1:叠加, 2:正片叠底等)
 *   ResetParallax mapId - 重置指定地图的远景图设置
 *   
 * 脚本调用：
 *   $gameSystem.setParallaxScale(mapId, scaleX, scaleY)
 *   $gameSystem.setParallaxOffset(mapId, offsetX, offsetY)
 *   $gameSystem.setParallaxOpacity(mapId, opacity)
 *   $gameSystem.setParallaxBlendMode(mapId, mode)
 *   $gameSystem.resetParallax(mapId)
 */

(function() {
    'use strict';

    const pluginName = "ParallaxController";
    const parameters = PluginManager.parameters(pluginName);

    // 默认参数
    const defaultScaleX = parseFloat(parameters['Default Scale X'] || 1.0);
    const defaultScaleY = parseFloat(parameters['Default Scale Y'] || 1.0);
    const defaultOffsetX = parseInt(parameters['Default Offset X'] || 0);
    const defaultOffsetY = parseInt(parameters['Default Offset Y'] || 0);

    // 存储远景图设置
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._parallaxSettings = {};
    };

    // 获取或创建地图设置
    Game_System.prototype.getParallaxSettings = function(mapId) {
        if (!this._parallaxSettings[mapId]) {
            this._parallaxSettings[mapId] = {
                scaleX: defaultScaleX,
                scaleY: defaultScaleY,
                offsetX: defaultOffsetX,
                offsetY: defaultOffsetY,
                opacity: 255,
                blendMode: 0
            };
        }
        return this._parallaxSettings[mapId];
    };

    // 设置缩放
    Game_System.prototype.setParallaxScale = function(mapId, scaleX, scaleY) {
        const settings = this.getParallaxSettings(mapId);
        settings.scaleX = scaleX;
        settings.scaleY = scaleY;
        this.refreshParallaxIfNeeded(mapId);
    };

    // 设置偏移
    Game_System.prototype.setParallaxOffset = function(mapId, offsetX, offsetY) {
        const settings = this.getParallaxSettings(mapId);
        settings.offsetX = offsetX;
        settings.offsetY = offsetY;
        this.refreshParallaxIfNeeded(mapId);
    };

    // 设置透明度
    Game_System.prototype.setParallaxOpacity = function(mapId, opacity) {
        const settings = this.getParallaxSettings(mapId);
        settings.opacity = opacity;
        this.refreshParallaxIfNeeded(mapId);
    };

    // 设置混合模式
    Game_System.prototype.setParallaxBlendMode = function(mapId, blendMode) {
        const settings = this.getParallaxSettings(mapId);
        settings.blendMode = blendMode;
        this.refreshParallaxIfNeeded(mapId);
    };

    // 重置设置
    Game_System.prototype.resetParallax = function(mapId) {
        if (this._parallaxSettings[mapId]) {
            delete this._parallaxSettings[mapId];
        }
        this.refreshParallaxIfNeeded(mapId);
    };

    // 如果需要刷新远景图
    Game_System.prototype.refreshParallaxIfNeeded = function(mapId) {
        if ($gameMap && $gameMap.mapId() === mapId && SceneManager._scene instanceof Scene_Map) {
            const spriteset = SceneManager._scene._spriteset;
            if (spriteset && spriteset._parallax) {
                spriteset.updateParallax();
            }
        }
    };

    // 修改远景图精灵以应用设置
    const _Spriteset_Map_createParallax = Spriteset_Map.prototype.createParallax;
    Spriteset_Map.prototype.createParallax = function() {
        _Spriteset_Map_createParallax.call(this);
        this.updateParallax();
    };

    Spriteset_Map.prototype.updateParallax = function() {
        if (this._parallax) {
            const mapId = $gameMap.mapId();
            const settings = $gameSystem.getParallaxSettings(mapId);
            
            // 应用缩放
            this._parallax.scale.x = settings.scaleX;
            this._parallax.scale.y = settings.scaleY;
            
            // 应用偏移
            this._parallax.origin.x = settings.offsetX;
            this._parallax.origin.y = settings.offsetY;
            
            // 应用透明度
            this._parallax.opacity = settings.opacity;
            
            // 应用混合模式
            this._parallax.blendMode = settings.blendMode;
            
            // 更新位置以确保正确显示
            this._parallax.x = $gameMap.parallaxOx() + settings.offsetX;
            this._parallax.y = $gameMap.parallaxOy() + settings.offsetY;
        }
    };

    // 插件命令处理
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        
        if (command === "SetParallaxScale") {
            const mapId = parseInt(args[0]);
            const scaleX = parseFloat(args[1]);
            const scaleY = parseFloat(args[2]);
            $gameSystem.setParallaxScale(mapId, scaleX, scaleY);
        }
        else if (command === "SetParallaxOffset") {
            const mapId = parseInt(args[0]);
            const offsetX = parseInt(args[1]);
            const offsetY = parseInt(args[2]);
            $gameSystem.setParallaxOffset(mapId, offsetX, offsetY);
        }
        else if (command === "SetParallaxOpacity") {
            const mapId = parseInt(args[0]);
            const opacity = parseInt(args[1]);
            $gameSystem.setParallaxOpacity(mapId, opacity);
        }
        else if (command === "SetParallaxBlendMode") {
            const mapId = parseInt(args[0]);
            const mode = parseInt(args[1]);
            $gameSystem.setParallaxBlendMode(mapId, mode);
        }
        else if (command === "ResetParallax") {
            const mapId = parseInt(args[0]);
            $gameSystem.resetParallax(mapId);
        }
    };

})();
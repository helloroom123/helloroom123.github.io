//=============================================================================
// VIPArcher_SkipTitle.js - 修复版 v2
//=============================================================================
 
/*:
 * @plugindesc 彻底跳过默认标题，包括事件里的返回标题和结束游戏时的返回
 * @author VIPArcher (Fixed v2)
 *
 * @param Test Only
 * @desc 设置为 true 时仅当测试时跳过，设置为 false 时彻底跳过
 * @default true
 * @type boolean
 *
 * @help 这个插件没有需要操作的指令，不需要帮助。
 */
 
(function() {
    var parameters = PluginManager.parameters('VIPArcher_SkipTitle');
    var testOnly = parameters['Test Only'] !== 'false';
    
    if (!testOnly || Utils.isOptionValid('test')) {
        
        // 完全重写 Scene_Title
        Scene_Title.prototype.create = function() {
            Scene_Base.prototype.create.call(this);
            this.createBackground();
            this.createForeground();
            this.createWindowLayer();
            // 创建一个虚拟的命令窗口以避免 isClosing 错误
            this._commandWindow = {
                isClosing: function() { return false; },
                isClosed: function() { return true; },
                isOpen: function() { return false; },
                isOpening: function() { return false; },
                close: function() {},
                open: function() {},
                activate: function() {},
                deactivate: function() {}
            };
        };
        
        Scene_Title.prototype.createBackground = function() {
            this._backSprite1 = new Sprite();
            this._backSprite2 = new Sprite();
            this.addChild(this._backSprite1);
            this.addChild(this._backSprite2);
        };
        
        Scene_Title.prototype.createForeground = function() {
            this._gameTitleSprite = new Sprite();
            this.addChild(this._gameTitleSprite);
        };
        
        Scene_Title.prototype.start = function() {
            Scene_Base.prototype.start.call(this);
            SceneManager.clearStack();
            DataManager.setupNewGame();
            SceneManager.goto(Scene_Map);
        };
        
        Scene_Title.prototype.update = function() {
            Scene_Base.prototype.update.call(this);
        };
        
        Scene_Title.prototype.isBusy = function() {
            return false;
        };
        
        Scene_Title.prototype.terminate = function() {
            Scene_Base.prototype.terminate.call(this);
        };
    }
})();

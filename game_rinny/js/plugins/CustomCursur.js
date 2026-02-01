/*:
 * @target MZ
 * @plugindesc 自定义光标外观 - 确保生效版
 * @author 你的名字
 * 
 * @param cursorColor
 * @text 光标颜色
 * @desc 光标颜色（十六进制，如 #FF0000）
 * @type string
 * @default #FF0000
 * 
 * @param cursorOpacity
 * @text 光标透明度
 * @desc 透明度（0-1）
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 0.5
 */

(function() {
    'use strict';
    
    // 插件名称必须与文件名一致
    const pluginName = 'CustomCursor';
    
    // 确保插件管理器已加载
    if (!PluginManager.parameters(pluginName)) {
        console.error('插件参数未加载:', pluginName);
        return;
    }
    
    const parameters = PluginManager.parameters(pluginName);
    console.log('CustomCursor插件已加载，参数:', parameters);
    
    const cursorColor = String(parameters['cursorColor'] || '#FF0000');
    const cursorOpacity = Number(parameters['cursorOpacity'] || 0.5);
    
    console.log('光标设置 - 颜色:', cursorColor, '透明度:', cursorOpacity);

    // 保存原始方法
    const _Window_Selectable_updateCursor = Window_Selectable.prototype.updateCursor;
    
    // 重写方法
    Window_Selectable.prototype.updateCursor = function() {
        // 先调用原始方法
        if (_Window_Selectable_updateCursor) {
            _Window_Selectable_updateCursor.apply(this, arguments);
        }
        
        // 修改光标外观
        if (this._windowCursorSprite) {
            try {
                // 转换为颜色值
                const colorValue = parseInt(cursorColor.replace('#', ''), 16);
                this._windowCursorSprite.color.setColor(colorValue);
                this._windowCursorSprite.alpha = cursorOpacity;
                
                // 添加调试信息
                console.log('光标已修改 - 颜色:', colorValue.toString(16), '透明度:', cursorOpacity);
            } catch (error) {
                console.warn('修改光标时出错:', error);
            }
        } else {
            console.log('未找到光标精灵，当前索引:', this.index());
        }
    };

    // 添加加载完成提示
    console.log('CustomCursor插件初始化完成');

})();
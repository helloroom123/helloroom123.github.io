/*:
 * @plugindesc v1.0 自定义选择框插件 - 支持背景/光标/选项布局修改
 * @author YourName
 *
 * @param 背景透明度
 * @desc 选择框背景透明度（0-255）
 * @default 192
 *
 * @param 光标图标
 * @desc 光标使用的图块ID（需提前在数据库图块中设置）
 * @default 3
 *
 * @param 选项间距
 * @desc 选项之间的垂直间距（像素）
 * @default 40
 *
 * @help
 * ===== 使用说明 =====
 * 1. 在数据库【图块】中设置光标图标
 * 2. 通过插件参数调整样式
 * 3. 插件自动覆盖所有选择框显示
 */

(() => {
    const pluginName = "CustomChoiceBox";
    const params = PluginManager.parameters(pluginName);
    
    // 参数解析
    const bgAlpha = Number(params['背景透明度'] || 192);
    const cursorSpriteId = Number(params['光标图标'] || 3);
    const itemSpacing = Number(params['选项间距'] || 40);

    // 覆盖原选择框绘制方法
    const _Window_ChoiceList_createList = Window_ChoiceList.prototype.createList;
    Window_ChoiceList.prototype.createList = function() {
        _Window_ChoiceList_createList.call(this);
        this._list.forEach((item, index) => {
            // 修改选项位置
            this._list[index].y = this.baseRowHeight() * index + itemSpacing * index;
        });
    };

    // 自定义背景渲染
    const _Window_ChoiceList_drawBackground = Window_ChoiceList.prototype.drawBackground;
    Window_ChoiceList.prototype.drawBackground = function() {
        const rect = this.contents.baseRect;
        this.contents.fillRect(rect.x, rect.y, rect.width, rect.height, this.bgColor(), bgAlpha);
    };

    // 替换光标显示（修复语法错误）
    const _Window_ChoiceList_drawCursor = Window_ChoiceList.prototype.drawCursor;
    Window_ChoiceList.prototype.drawCursor = function(index) {
        const cursor = this._list[index]; // 修正：移除非法符号 @ref
        const bitmap = ImageManager.loadSystem('Icon' + cursorSpriteId);
        this.contents.blt(bitmap, cursor.x, cursor.y, bitmap.width, bitmap.height, cursor.x, cursor.y);
    };
})();

function Scene_ClickEnter() {
    this.initialize.apply(this, arguments);
}

Scene_ClickEnter.prototype = Object.create(Scene_Base.prototype);
Scene_ClickEnter.prototype.constructor = Scene_ClickEnter;

Scene_ClickEnter.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
};

Scene_ClickEnter.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this._splashSprite = new Sprite();
    this._splashSprite.bitmap = ImageManager.loadPicture("splash");
    this.addChild(this._splashSprite);
    this._hintText = new Sprite(new Bitmap(Graphics.width, Graphics.height));
    this._hintText.bitmap.drawText("点击屏幕继续", 0, Graphics.height - 100, Graphics.width, 48, "center");
    this.addChild(this._hintText);
    this._clicked = false;
};

Scene_ClickEnter.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
    if (TouchInput.isTriggered() || Input.isTriggered('ok')) {
        this.proceedToTitle();
    }
};

Scene_ClickEnter.prototype.proceedToTitle = function() {
    if (!this._clicked) {
        this._clicked = true;
        SoundManager.playCursor();
        this.startFadeOut(this.fadeSpeed(), function() {
            SceneManager.goto(Scene_Title);
        });
    }
};

var _Scene_Boot_start = Scene_Boot.prototype.start;
Scene_Boot.prototype.start = function() {
    _Scene_Boot_start.call(this);
    if (!DataManager.isBattleTest() && !DataManager.isEventTest()) {
        SceneManager.goto(Scene_ClickEnter);
    }
};
/*
 * Aurora Live2D Controller
 * Integrates PixiJS Live2D Engine with Waifu-Tips UI
 */

class AuroraLive2D {
    constructor() {
        this.apiPath = 'assets/waifu-tips/';
        this.tips = {};
        this.init();
    }

    async init() {
        // Wait for Core AND Plugin to be loaded
        let attempts = 0;
        // Extended waiting time for slower networks
        while ((typeof Live2DCubismCore === 'undefined' || typeof PIXI === 'undefined' || typeof PIXI.live2d === 'undefined') && attempts < 50) {
            await new Promise(r => setTimeout(r, 200)); // Check every 200ms
            attempts++;
        }

        if (typeof Live2DCubismCore === 'undefined') {
            console.error('Live2DCubismCore not loaded after 10s.');
            this.showMessage('Live2D 核心组件加载超时 (Core Timeout)', 5000);
        } else if (typeof PIXI.live2d === 'undefined') {
            console.error('PIXI.live2d plugin not loaded.');
            this.showMessage('Live2D 渲染插件加载失败', 5000);
        } else {
            console.log('Live2D Dependencies Ready. Initializing...');
        }

        // 1. Inject HTML Structure
        this.injectUI();

        // 2. Initialize PixiJS Widget (The Engine)
        // We use the existing Live2DWidget class but bind it to our canvas
        if (typeof Live2DWidget !== 'undefined') {
            this.widget = new Live2DWidget({
                canvasId: 'live2d', // Matches waifu.css
                containerId: 'waifu-container',
                // Teto Model Path (English Renamed)
                modelPath: 'assets/live2d/teto/teto.model3.json',
                width: 350,  // Increased Width
                height: 450  // Increased Height
            });
        }

        // 3. Load Tips
        await this.loadTips();

        // 4. Bind Interactions
        this.bindEvents();
        this.welcome();
    }

    injectUI() {
        const div = document.createElement('div');
        div.className = 'waifu';
        div.id = 'waifu-container';
        div.style.bottom = '0';
        div.style.left = '0';
        
        div.innerHTML = `
            <div class="waifu-tips"></div>
            <canvas id="live2d" class="live2d"></canvas>
            <div class="waifu-tool">
                <span class="fui-home"></span>
                <span class="fui-chat"></span>
                <span class="fui-eye"></span>
                <span class="fui-user"></span>
                <span class="fui-photo"></span>
                <span class="fui-info-circle"></span>
                <span class="fui-cross"></span>
            </div>
            <div class="waifu-toggle">
                <div class="waifu-toggle-title">表情</div>
                <div class="waifu-toggle-grid">
                    <span data-exp="Love">爱心眼</span>
                    <span data-exp="StarEye">星星眼</span>
                    <span data-exp="Dizzy">蚊香眼</span>
                    <span data-exp="Cry">哭哭眼</span>
                    <span data-exp="DarkEye">黑化眼</span>
                    <span data-exp="SquintEye">眯眯眼</span>
                    <span data-exp="Sweat">流汗</span>
                    <span data-exp="Blush">脸红</span>
                    <span data-exp="DarkFace">黑脸</span>
                </div>
                <div class="waifu-toggle-title">动作/物品</div>
                <div class="waifu-toggle-grid">
                    <span data-exp="Mic">麦克风</span>
                    <span data-exp="Baguette">法棍</span>
                    <span data-exp="Headphone">耳机</span>
                    <span data-exp="Chibi">Q版</span>
                    <span data-exp="AltOutfit">换装</span>
                </div>
                <div class="waifu-toggle-title">系统</div>
                <div class="waifu-toggle-grid">
                    <span data-exp="reset" style="width: 100%;">重置状态</span>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        
        // Remove old widget container if exists
        const old = document.getElementById('live2d-widget');
        if(old) old.remove();
    }

    async loadTips() {
        try {
            const res = await fetch(this.apiPath + 'waifu-tips.json');
            this.tips = await res.json();
        } catch (e) {
            console.error('Failed to load tips:', e);
        }
    }

    bindEvents() {
        // Tool Buttons
        document.querySelector('.fui-home').onclick = () => window.location.href = 'index.html';
        document.querySelector('.fui-info-circle').onclick = () => window.open('https://github.com/guansss/pixi-live2d-display');
        document.querySelector('.fui-cross').onclick = () => {
            sessionStorage.setItem('waifu-hidden', Date.now());
            document.querySelector('.waifu').style.display = 'none';
        };
        document.querySelector('.fui-photo').onclick = () => {
            this.showMessage(this.getRandom(this.tips.waifu.screenshot_message), 4000);
            // Snapshot logic could go here
        };
        document.querySelector('.fui-chat').onclick = () => this.showHitokoto();

        // Expression Toggle Menu
        document.querySelector('.fui-eye').onclick = () => {
            const toggle = document.querySelector('.waifu-toggle');
            toggle.classList.toggle('waifu-toggle-active');
        };

        // Expression Buttons Interaction
        document.querySelectorAll('.waifu-toggle span').forEach(btn => {
            btn.onclick = () => {
                const exp = btn.getAttribute('data-exp');
                const toggle = document.querySelector('.waifu-toggle');
                
                if (exp === 'reset') {
                     // Try to reset by calling an empty expression or idle
                     // Often setting a neutral expression works, or just waiting for next motion
                     if (this.widget && this.widget.model) {
                         // Resetting can be tricky, we'll try to set IDLE or just log
                         this.widget.model.internalModel.motionManager.stopAllMotions();
                         this.showMessage("表情已重置", 3000);
                     }
                } else {
                    if (this.widget && this.widget.model) {
                        this.widget.model.expression(exp);
                        this.showMessage(`切换表情：${btn.innerText}`, 3000);
                    }
                }
                // Optionally close menu
                // toggle.classList.remove('waifu-toggle-active');
            };
        });
        
        // Reset Button (User Icon)
        document.querySelector('.fui-user').onclick = () => {
             // Load random model or just reset expression
             this.showMessage("暂无其他角色，敬请期待！", 4000);
        };

        // Model Interaction (Hit Area)
        // Since Pixi handles the canvas, we need to hook into the widget's model events
        // We'll poll for the model to be ready
        const checkModel = setInterval(() => {
            if (this.widget && this.widget.model) {
                clearInterval(checkModel);
                this.bindModelEvents(this.widget.model);
            }
        }, 1000);

        // Mouse Over Events (from waifu-tips.json)
        window.addEventListener('mousemove', (e) => {
            if (!this.tips.mouseover) return;
            // Debounce or simple check?
            // For simplicity, we just check if the target matches a selector
            // Note: This can be expensive if not optimized, but standard waifu-tips does this.
            // We'll simplify: only check on mouseover of specific elements
        });

        // Optimization: Attach listeners to the selectors instead of global mousemove
        if (this.tips.mouseover) {
            this.tips.mouseover.forEach(item => {
                const els = document.querySelectorAll(item.selector);
                els.forEach(el => {
                    el.addEventListener('mouseenter', () => {
                        this.showMessage(this.getRandom(item.text), 4000);
                    });
                });
            });
        }
    }

    bindModelEvents(model) {
        model.on('hit', (hitAreas) => {
            if (hitAreas.includes('body')) {
                this.showMessage(this.getRandom(this.tips.click[0].text), 4000);
                // Use a random expression for body tap since we don't have many motions
                const exps = ['Blush', 'Sweat', 'Cry'];
                const randomExp = exps[Math.floor(Math.random() * exps.length)];
                model.expression(randomExp);
            }
            if (hitAreas.includes('head')) {
                this.showMessage("摸头会长不高的！", 4000);
                model.expression('Love');
            }
        });
    }

    welcome() {
        // Force show for debug if needed, or check session logic
        if (sessionStorage.getItem('waifu-hidden')) {
            sessionStorage.removeItem('waifu-hidden'); // Auto-restore for now since user complained
            // document.querySelector('.waifu').style.display = 'none';
            // return;
        }
        const text = `欢迎来到 Aurora Project!`;
        this.showMessage(text, 5000);
    }

    showMessage(text, timeout) {
        if (!text) return;
        const tips = document.querySelector('.waifu-tips');
        tips.innerHTML = text;
        tips.classList.add('waifu-tips-active');
        
        if (this.hideTimer) clearTimeout(this.timeout);
        this.hideTimer = setTimeout(() => {
            tips.classList.remove('waifu-tips-active');
        }, timeout);
    }

    async showHitokoto() {
        try {
            const res = await fetch('https://v1.hitokoto.cn');
            const data = await res.json();
            this.showMessage(data.hitokoto, 6000);
        } catch (e) {
            this.showMessage("喵~", 4000);
        }
    }

    getRandom(arr) {
        return Array.isArray(arr) ? arr[Math.floor(Math.random() * arr.length)] : arr;
    }
}

// Init
window.addEventListener('load', () => new AuroraLive2D());

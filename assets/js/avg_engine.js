// Simple AVG Engine for Aurora Project
export class VisualNovel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.script = [];
        this.currentIndex = 0;
        this.isTyping = false;
        
        this.initUI();
    }

    initUI() {
        this.container.innerHTML = `
            <div class="avg-bg" id="avg-bg"></div>
            <div class="avg-char" id="avg-char"></div>
            <div class="avg-textbox">
                <div class="avg-name" id="avg-name"></div>
                <div class="avg-text" id="avg-text"></div>
                <div class="avg-next">▼</div>
            </div>
            <div class="avg-choices" id="avg-choices" style="display:none;"></div>
        `;
        
        // Styles
        const style = document.createElement('style');
        style.textContent = `
            .avg-container { position: relative; width: 100%; height: 600px; background: #000; overflow: hidden; color: #fff; font-family: 'Noto Serif SC', serif; }
            .avg-bg { position: absolute; width: 100%; height: 100%; background-size: cover; background-position: center; transition: opacity 0.5s; }
            .avg-char { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); height: 80%; transition: all 0.3s; }
            .avg-char img { height: 100%; object-fit: contain; }
            .avg-textbox { position: absolute; bottom: 20px; left: 5%; width: 90%; height: 150px; background: rgba(0,0,0,0.8); border: 2px solid var(--accent-color, #00A86B); padding: 20px; box-sizing: border-box; border-radius: 10px; cursor: pointer; }
            .avg-name { font-size: 1.2rem; font-weight: bold; color: var(--accent-color, #00A86B); margin-bottom: 10px; }
            .avg-text { font-size: 1rem; line-height: 1.6; }
            .avg-next { position: absolute; bottom: 10px; right: 20px; animation: bounce 1s infinite; }
            .avg-choices { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; gap: 15px; width: 300px; }
            .avg-choice-btn { padding: 15px; background: rgba(0,0,0,0.9); border: 1px solid #fff; color: #fff; text-align: center; cursor: pointer; transition: 0.2s; }
            .avg-choice-btn:hover { background: var(--accent-color, #00A86B); border-color: var(--accent-color, #00A86B); color: #000; }
            @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
        `;
        document.head.appendChild(style);

        this.bg = this.container.querySelector('#avg-bg');
        this.char = this.container.querySelector('#avg-char');
        this.nameBox = this.container.querySelector('#avg-name');
        this.textBox = this.container.querySelector('#avg-text');
        this.choicesBox = this.container.querySelector('#avg-choices');
        this.textboxContainer = this.container.querySelector('.avg-textbox');

        this.textboxContainer.onclick = () => this.next();
    }

    loadScript(script) {
        this.script = script;
        this.currentIndex = 0;
        this.runStep();
    }

    runStep() {
        if (this.currentIndex >= this.script.length) return;
        const step = this.script[this.currentIndex];

        // Background
        if (step.bg) this.bg.style.backgroundImage = `url('${step.bg}')`;
        
        // Character
        if (step.charImg) {
            this.char.innerHTML = `<img src="${step.charImg}">`;
            this.char.style.opacity = 1;
        } else if (step.hideChar) {
            this.char.style.opacity = 0;
        }

        // Name & Text
        this.nameBox.innerText = step.name || '';
        if (step.text) {
            this.typeText(step.text);
        }

        // Choices
        if (step.choices) {
            this.textboxContainer.style.pointerEvents = 'none'; // Disable click next
            this.choicesBox.innerHTML = '';
            this.choicesBox.style.display = 'flex';
            step.choices.forEach(choice => {
                const btn = document.createElement('div');
                btn.className = 'avg-choice-btn';
                btn.innerText = choice.text;
                btn.onclick = () => {
                    this.choicesBox.style.display = 'none';
                    this.textboxContainer.style.pointerEvents = 'auto';
                    if (choice.jump) {
                        this.currentIndex = choice.jump;
                    } else {
                        this.currentIndex++;
                    }
                    this.runStep();
                };
                this.choicesBox.appendChild(btn);
            });
        }
    }

    typeText(text) {
        this.isTyping = true;
        this.textBox.innerHTML = '';
        let i = 0;
        const interval = setInterval(() => {
            this.textBox.innerHTML += text.charAt(i);
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                this.isTyping = false;
            }
        }, 30); // Typing speed
        
        // Fast skip
        this.textboxContainer.onclick = () => {
            if (this.isTyping) {
                clearInterval(interval);
                this.textBox.innerHTML = text;
                this.isTyping = false;
            } else {
                if (!this.script[this.currentIndex].choices) {
                    this.currentIndex++;
                    this.runStep();
                }
            }
        };
    }

    next() {
        // Handled in typeText's onclick
    }
}

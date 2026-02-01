export class VisualNovel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.script = [];
        this.currentIndex = 0;
        this.isTyping = false;
        
        // Game State
        this.gameState = {
            party: {}, // Will be populated from script or defaults
            flags: {}
        };

        this.initUI();
    }

    initUI() {
        // VN UI + Battle UI Layers
        this.container.innerHTML = `
            <div class="avg-layer" id="avg-vn-layer">
                <div class="avg-bg" id="avg-bg"></div>
                <div class="avg-overlay" id="avg-overlay"></div>
                <div class="avg-char-container" id="avg-char-container"></div>
                <div class="avg-textbox">
                    <div class="avg-controls" id="avg-controls">
                        <button class="avg-ctrl-btn" id="btn-save">Save</button>
                        <button class="avg-ctrl-btn" id="btn-load">Load</button>
                        <button class="avg-ctrl-btn" id="btn-auto">Auto</button>
                    </div>
                    <div class="avg-name" id="avg-name"></div>
                    <div class="avg-text" id="avg-text"></div>
                    <div class="avg-next">▼</div>
                </div>
                <div class="avg-choices" id="avg-choices" style="display:none;"></div>
            </div>

            <div class="avg-layer" id="avg-battle-layer" style="display:none;">
                <div class="battle-scene" id="battle-scene">
                    <div class="battle-enemies" id="battle-enemies"></div>
                    <div class="battle-effects" id="battle-effects"></div>
                </div>
                <div class="battle-ui">
                    <div class="battle-log" id="battle-log"></div>
                    <div class="battle-party" id="battle-party"></div>
                    <div class="battle-actions" id="battle-actions">
                        <button data-action="attack">攻击 (Attack)</button>
                        <button data-action="skill">技能 (Skill)</button>
                        <button data-action="defend">防御 (Defend)</button>
                    </div>
                </div>
            </div>
        `;
        
        // Styles
        const style = document.createElement('style');
        style.textContent = `
            .avg-layer { position: absolute; width: 100%; height: 100%; top: 0; left: 0; }
            .avg-container { position: relative; width: 100%; height: 600px; background: #000; overflow: hidden; color: #fff; font-family: 'Noto Serif SC', serif; user-select: none; }
            
            /* VN Styles */
            .avg-bg { position: absolute; width: 100%; height: 100%; background-size: cover; background-position: center; transition: opacity 0.5s; background-color: #222; }
            
            /* Lighting / Atmosphere Overlay */
            .avg-overlay { 
                position: absolute; width: 100%; height: 100%; pointer-events: none; z-index: 5; 
                background: radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,0.6) 100%);
                mix-blend-mode: multiply;
                transition: opacity 1s;
            }
            .avg-overlay.morning {
                background: linear-gradient(135deg, rgba(255,255,220,0.15) 0%, transparent 40%, rgba(0,0,0,0.2) 100%);
                mix-blend-mode: screen;
            }
            
            .avg-char-container { position: absolute; bottom: 0; width: 100%; height: 100%; pointer-events: none; display: flex; justify-content: center; align-items: flex-end; z-index: 6; }
            
            /* Character Image Styles */
            .avg-char-img {
                height: 100%;
                width: auto;
                object-fit: contain;
                filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3));
                transition: opacity 0.2s;
            }
            .avg-char-placeholder { 
                min-width: 200px; height: 400px; margin: 0 20px; 
                display: flex; align-items: center; justify-content: center; 
                background: linear-gradient(to top, rgba(255,255,255,0.1), transparent);
                border-bottom: 4px solid #fff; 
                color: #fff; font-size: 2rem; font-weight: bold; text-shadow: 0 0 10px #000;
                transition: transform 0.3s, opacity 0.3s;
                opacity: 0; transform: translateY(20px);
            }
            .avg-char-placeholder.active { opacity: 1; transform: translateY(0); }

            .avg-textbox { position: absolute; bottom: 20px; left: 5%; width: 90%; height: 160px; background: rgba(0,0,0,0.85); border: 2px solid var(--accent-color, #00A86B); padding: 20px; box-sizing: border-box; border-radius: 10px; cursor: pointer; z-index: 10; display: flex; flex-direction: column; }
            .avg-name { font-size: 1.4rem; font-weight: bold; color: var(--accent-color, #00A86B); margin-bottom: 5px; height: 30px; }
            .avg-text { font-size: 1.1rem; line-height: 1.6; white-space: pre-wrap; flex: 1; overflow-y: hidden; }
            .avg-controls { position: absolute; top: -30px; right: 0; display: flex; gap: 10px; }
            .avg-ctrl-btn { background: rgba(0,0,0,0.8); border: 1px solid #666; color: #ccc; padding: 2px 8px; cursor: pointer; font-size: 0.8rem; border-radius: 3px; }
            .avg-ctrl-btn:hover { background: #333; color: #fff; }
            .avg-next { position: absolute; bottom: 10px; right: 20px; animation: bounce 1s infinite; color: #aaa; }
            .avg-choices { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; gap: 15px; width: 300px; z-index: 20; }
            .avg-choice-btn { padding: 15px; background: rgba(0,0,0,0.95); border: 1px solid #fff; color: #fff; text-align: center; cursor: pointer; transition: 0.2s; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
            .avg-choice-btn:hover { background: var(--accent-color, #00A86B); border-color: var(--accent-color, #00A86B); color: #000; transform: scale(1.05); }

            /* Battle Styles */
            #avg-battle-layer { background: #1a0b0b; display: flex; flex-direction: column; }
            .battle-scene { flex: 1; position: relative; display: flex; justify-content: center; align-items: center; gap: 40px; }
            .battle-ui { height: 200px; background: rgba(20,20,20,0.95); border-top: 2px solid #555; display: grid; grid-template-columns: 2fr 2fr 1fr; padding: 10px; gap: 10px; }
            
            .battle-unit { 
                width: 120px; height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; 
                border: 2px solid #fff; background: rgba(255,255,255,0.1); transition: all 0.2s; position: relative;
            }
            .battle-unit.enemy { border-color: #ff4444; background: rgba(255, 0, 0, 0.1); }
            .battle-unit.ally { border-color: #4444ff; background: rgba(0, 0, 255, 0.1); }
            .battle-unit.active-turn { box-shadow: 0 0 20px #ffcc00; transform: scale(1.1); z-index: 5; border-color: #ffcc00; }
            .battle-unit.dead { opacity: 0.3; filter: grayscale(100%); transform: scale(0.9); border-style: dashed; }
            .battle-unit-name { font-weight: bold; margin-bottom: 5px; text-shadow: 1px 1px 2px #000; }
            
            .hp-bar-container { width: 80%; height: 8px; background: #333; border: 1px solid #555; margin-top: 5px; }
            .hp-bar-fill { height: 100%; background: #00cc44; width: 100%; transition: width 0.3s; }
            .battle-unit.enemy .hp-bar-fill { background: #cc4400; }

            .battle-log { overflow-y: auto; font-size: 0.9rem; color: #ccc; padding: 5px; border-right: 1px solid #444; }
            .battle-party { display: flex; flex-direction: column; gap: 5px; overflow-y: auto; }
            .battle-party-row { display: flex; justify-content: space-between; align-items: center; padding: 5px; background: rgba(255,255,255,0.05); }
            
            .battle-actions { display: flex; flex-direction: column; gap: 5px; justify-content: center; }
            .battle-actions button { padding: 10px; background: #333; color: #fff; border: 1px solid #666; cursor: pointer; }
            .battle-actions button:hover { background: #555; border-color: #fff; }
            .battle-actions button:disabled { opacity: 0.5; cursor: not-allowed; }

            /* Effects */
            .dmg-popup { position: absolute; font-size: 2rem; color: #ff3333; font-weight: bold; text-shadow: 2px 2px 0 #000; animation: floatUp 0.8s forwards; pointer-events: none; }
            @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-50px); } }
            @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
            @keyframes shake { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(3px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(3px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(1px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }
            .shake { animation: shake 0.5s; }
        `;
        if (!document.getElementById('avg-styles')) {
            style.id = 'avg-styles';
            document.head.appendChild(style);
        }

        // Element Refs
        this.vnLayer = this.container.querySelector('#avg-vn-layer');
        this.battleLayer = this.container.querySelector('#avg-battle-layer');
        
        this.bg = this.container.querySelector('#avg-bg');
        this.overlay = this.container.querySelector('#avg-overlay');
        this.charContainer = this.container.querySelector('#avg-char-container');
        this.nameBox = this.container.querySelector('#avg-name');
        this.textBox = this.container.querySelector('#avg-text');
        this.choicesBox = this.container.querySelector('#avg-choices');
        this.textboxContainer = this.container.querySelector('.avg-textbox');

        // Controls
        this.container.querySelector('#btn-save').onclick = (e) => { e.stopPropagation(); this.saveGame(); };
        this.container.querySelector('#btn-load').onclick = (e) => { e.stopPropagation(); this.loadGame(); };
        this.container.querySelector('#btn-auto').onclick = (e) => { e.stopPropagation(); this.toggleAuto(); };

        // Battle Refs
        this.battleEnemies = this.container.querySelector('#battle-enemies');
        this.battleParty = this.container.querySelector('#battle-party');
        this.battleLog = this.container.querySelector('#battle-log');
        this.battleActions = this.container.querySelector('#battle-actions');
        
        // Event Listeners
        this.textboxContainer.onclick = () => this.next();
        
        this.battleActions.querySelectorAll('button').forEach(btn => {
            btn.onclick = () => this.handlePlayerAction(btn.dataset.action);
        });
    }

    loadScript(script) {
        this.script = script;
        this.currentIndex = 0;
        this.runStep();
    }

    runStep() {
        if (this.currentIndex >= this.script.length) return;
        const step = this.script[this.currentIndex];

        // Handle BATTLE type
        if (step.type === 'battle') {
            this.startBattle(step);
            return;
        }

        // Switch to VN Layer
        this.vnLayer.style.display = 'block';
        this.battleLayer.style.display = 'none';

        // Background
        if (step.bg) {
            this.bg.style.backgroundImage = step.bg.startsWith('#') ? 'none' : `url('${step.bg}')`;
            this.bg.style.backgroundColor = step.bg.startsWith('#') ? step.bg : '#000';
        }
        
        // Atmosphere / Overlay
        if (step.overlay) {
            this.overlay.className = 'avg-overlay ' + step.overlay;
        } else if (step.bg && step.bg.includes('morning')) {
            this.overlay.className = 'avg-overlay morning';
        } else {
            this.overlay.className = 'avg-overlay'; // Default vignette
        }
        
        // Characters (Placeholder System)
        this.updateCharacters(step);

        // Name & Text
        this.nameBox.innerText = step.name || '';
        this.nameBox.style.color = step.nameColor || 'var(--accent-color, #00A86B)';
        
        if (step.text) {
            this.typeText(step.text);
        }

            // Choices
            if (step.choices) {
                this.textboxContainer.style.pointerEvents = 'none';
                this.choicesBox.innerHTML = '';
                this.choicesBox.style.display = 'flex';
                step.choices.forEach(choice => {
                    const btn = document.createElement('div');
                    btn.className = 'avg-choice-btn';
                    btn.innerText = choice.text;
                    btn.onclick = () => {
                        this.choicesBox.style.display = 'none';
                        this.textboxContainer.style.pointerEvents = 'auto';
                        
                        if (choice.onclick) {
                            choice.onclick();
                            return;
                        }

                        if (choice.jump !== undefined) {
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

    createTransparentImage(src) {
        const img = document.createElement('img');
        img.className = 'avg-char-img';
        img.style.opacity = '0'; // Hide until processed
        
        img.onload = () => {
            // Create canvas to remove white background
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Simple white threshold removal
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                // If pixel is very light (white background)
                if (r > 240 && g > 240 && b > 240) {
                    data[i+3] = 0; // Set alpha to 0
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            img.src = canvas.toDataURL();
            
            // Remove onload to prevent infinite loop
            img.onload = null;
            img.style.opacity = '1';
        };
        
        img.src = src;
        return img;
    }

    updateCharacters(step) {
        // Clear previous if not persistent (simple version: clear all, re-add)
        // Ideally we diff, but for now simple re-render
        if (step.clearChars) {
            this.charContainer.innerHTML = '';
        }

        if (step.chars) {
            this.charContainer.innerHTML = ''; // Start fresh for simplicity
            step.chars.forEach(char => {
                const el = document.createElement('div');
                el.className = 'avg-char-placeholder active';
                
                if (char.image) {
                    const img = this.createTransparentImage(char.image);
                    el.appendChild(img);
                    el.style.background = 'transparent';
                    el.style.border = 'none';
                    el.style.minWidth = 'auto'; 
                } else {
                    el.innerText = char.name;
                    el.style.backgroundColor = char.color || '#555';
                    if (char.style) {
                        Object.assign(el.style, char.style);
                    }
                }
                this.charContainer.appendChild(el);
            });
        }
    }

    typeText(text) {
        this.isTyping = true;
        this.textBox.innerHTML = '';
        let i = 0;
        const speed = 30;
        
        // Clear previous interval
        if (this.typingInterval) clearInterval(this.typingInterval);

        this.typingInterval = setInterval(() => {
            this.textBox.innerHTML += text.charAt(i);
            i++;
            if (i >= text.length) {
                clearInterval(this.typingInterval);
                this.isTyping = false;
            }
        }, speed);
        
        // Fast skip handler
        this.textboxContainer.onclick = () => {
            if (this.isTyping) {
                clearInterval(this.typingInterval);
                this.textBox.innerHTML = text;
                this.isTyping = false;
            } else {
                if (!this.script[this.currentIndex].choices) {
                    // Check for jump or next
                    const step = this.script[this.currentIndex];
                    if (step.jump !== undefined) {
                        this.currentIndex = step.jump;
                    } else {
                        this.currentIndex++;
                    }
                    this.runStep();
                }
            }
        };
    }

    next() {
        // Handled in typeText's onclick override
    }

    saveGame() {
        const state = {
            index: this.currentIndex,
            flags: this.gameState.flags,
            date: new Date().toLocaleString()
        };
        localStorage.setItem('aurora_vn_save', JSON.stringify(state));
        alert('Game Saved! \n' + state.date);
    }

    loadGame() {
        const saved = localStorage.getItem('aurora_vn_save');
        if (saved) {
            const state = JSON.parse(saved);
            this.currentIndex = state.index;
            this.gameState.flags = state.flags;
            alert('Game Loaded! \n' + state.date);
            this.runStep();
        } else {
            alert('No save file found.');
        }
    }

    toggleAuto() {
        this.autoPlay = !this.autoPlay;
        this.container.querySelector('#btn-auto').style.color = this.autoPlay ? '#00A86B' : '#ccc';
        if (this.autoPlay && !this.isTyping && !this.script[this.currentIndex].choices) {
            this.next();
        }
    }

    // --- BATTLE SYSTEM ---

    startBattle(battleData) {
        this.vnLayer.style.display = 'none';
        this.battleLayer.style.display = 'flex';
        
        this.currentBattle = {
            ...battleData,
            turn: 0,
            activeUnitIndex: 0,
            units: [], // Combined array of { ...data, isEnemy: bool, id: unique }
            log: []
        };

        // Initialize Units
        let idCounter = 0;
        
        // Add Allies
        battleData.allies.forEach(a => {
            this.currentBattle.units.push({ ...a, id: idCounter++, isEnemy: false, currentHp: a.hp, maxHp: a.hp });
        });
        
        // Add Enemies
        battleData.enemies.forEach(e => {
            this.currentBattle.units.push({ ...e, id: idCounter++, isEnemy: true, currentHp: e.hp, maxHp: e.hp });
        });

        // Sort by speed if implemented, or just alternate
        // Simple Order: Allies then Enemies
        
        this.renderBattleScene();
        this.logBattle("Battle Start!");
        this.nextBattleTurn();
    }

    renderBattleScene() {
        this.battleEnemies.innerHTML = '';
        this.battleParty.innerHTML = '';

        this.currentBattle.units.forEach(unit => {
            if (unit.isEnemy) {
                // Render Enemy
                const el = document.createElement('div');
                el.className = `battle-unit enemy ${unit.currentHp <= 0 ? 'dead' : ''}`;
                el.style.borderColor = unit.color || '#ff4444';
                el.style.backgroundColor = (unit.color || '#ff0000') + '22'; // low opacity bg
                
                // Content
                const content = document.createElement('div');
                content.style.position = 'relative';
                content.style.zIndex = '2';
                content.style.width = '100%';
                content.innerHTML = `
                    <div class="battle-unit-name" style="color:${unit.color}; background:rgba(0,0,0,0.5); border-radius:4px; padding:2px;">${unit.name}</div>
                    <div class="hp-bar-container"><div class="hp-bar-fill" style="width: ${(unit.currentHp/unit.maxHp)*100}%"></div></div>
                    <div style="background:rgba(0,0,0,0.5); display:inline-block; padding:0 5px; border-radius:4px; margin-top:2px;">HP: ${unit.currentHp}</div>
                `;
                
                // Image Background
                if (unit.image) {
                    const img = this.createTransparentImage(unit.image);
                    img.style.position = 'absolute';
                    img.style.bottom = '0';
                    img.style.left = '50%';
                    img.style.transform = 'translateX(-50%)';
                    img.style.height = '140%'; // Slightly larger to pop out
                    img.style.width = 'auto';
                    img.style.zIndex = '1';
                    img.style.opacity = '0'; // Start hidden (handled by createTransparentImage logic but double check)
                    el.appendChild(img);
                    
                    // Adjust container to allow popout
                    el.style.overflow = 'visible';
                }

                el.appendChild(content);
                el.dataset.id = unit.id;
                this.battleEnemies.appendChild(el);
            } else {
                // Render Ally UI
                const el = document.createElement('div');
                el.className = `battle-party-row ${unit.currentHp <= 0 ? 'dead' : ''}`;
                el.innerHTML = `
                    <span style="color:${unit.color}; font-weight:bold;">${unit.name}</span>
                    <div class="hp-bar-container" style="width:100px; display:inline-block; vertical-align:middle; margin:0 10px;">
                        <div class="hp-bar-fill" style="width: ${(unit.currentHp/unit.maxHp)*100}%"></div>
                    </div>
                    <span>${unit.currentHp}/${unit.maxHp}</span>
                `;
                this.battleParty.appendChild(el);
            }
        });
    }

    logBattle(msg) {
        const line = document.createElement('div');
        line.innerText = `> ${msg}`;
        this.battleLog.prepend(line);
    }

    nextBattleTurn() {
        // Check Win/Loss
        const enemiesAlive = this.currentBattle.units.some(u => u.isEnemy && u.currentHp > 0);
        const alliesAlive = this.currentBattle.units.some(u => !u.isEnemy && u.currentHp > 0);

        if (!enemiesAlive) {
            this.logBattle("Victory!");
            setTimeout(() => this.endBattle(true), 1500);
            return;
        }
        if (!alliesAlive) {
            this.logBattle("Defeated...");
            setTimeout(() => this.endBattle(false), 1500);
            return;
        }

        // Advance Turn Index
        let unit = this.currentBattle.units[this.currentBattle.activeUnitIndex];
        
        // Find next living unit
        let checked = 0;
        while (unit.currentHp <= 0 && checked < this.currentBattle.units.length) {
            this.currentBattle.activeUnitIndex = (this.currentBattle.activeUnitIndex + 1) % this.currentBattle.units.length;
            unit = this.currentBattle.units[this.currentBattle.activeUnitIndex];
            checked++;
        }

        this.currentActiveUnit = unit;
        
        // Highlight Active
        document.querySelectorAll('.battle-unit').forEach(el => el.classList.remove('active-turn'));
        if (unit.isEnemy) {
            const el = this.battleEnemies.querySelector(`[data-id="${unit.id}"]`);
            if (el) el.classList.add('active-turn');
            
            // Enemy AI
            setTimeout(() => this.enemyAction(unit), 1000);
            this.setPlayerControls(false);
        } else {
            // Player Turn
            this.logBattle(`${unit.name}'s turn.`);
            this.setPlayerControls(true);
        }
    }

    setPlayerControls(enabled) {
        this.battleActions.querySelectorAll('button').forEach(btn => btn.disabled = !enabled);
    }

    handlePlayerAction(action) {
        const actor = this.currentActiveUnit;
        
        // Find Target (First living enemy for now)
        const target = this.currentBattle.units.find(u => u.isEnemy && u.currentHp > 0);
        
        if (!target) return; 

        if (action === 'attack') {
            const dmg = Math.max(1, actor.atk - (target.def || 0));
            this.performAttack(actor, target, dmg, "Attack");
        } else if (action === 'skill') {
            this.useSkill(actor, target);
        } else if (action === 'defend') {
            this.logBattle(`${actor.name} defends.`);
            actor.defTemp = (actor.def || 0) * 0.5; // Temp buff
            actor.def += actor.defTemp;
            this.finishTurn();
        }
    }

    useSkill(actor, target) {
        let dmg = 0;
        let skillName = "Skill";

        // Character Specific Skills
        switch(actor.name) {
            case '冷念':
                skillName = "Butterfly Dance";
                dmg = Math.floor(actor.atk * 2.0); // High damage
                this.logBattle(`${actor.name} dances with blades!`);
                break;
            case '达米尔':
                skillName = "Knight's Shield";
                this.logBattle(`${actor.name} raises shield for team!`);
                // Simple implementation: heal self or buff self
                actor.currentHp = Math.min(actor.maxHp, actor.currentHp + 30);
                this.renderBattleScene();
                this.finishTurn();
                return;
            case '瑞拉':
                skillName = "Holy Slash";
                dmg = Math.floor(actor.atk * 1.5 + 10);
                break;
            case '马尔塔拉':
                skillName = "Shadow Strike";
                dmg = Math.floor(actor.atk * 1.2);
                // Maybe double hit logic later
                break;
            default:
                skillName = "Power Strike";
                dmg = Math.floor(actor.atk * 1.5);
        }

        // Apply damage if offensive skill
        const finalDmg = Math.max(1, dmg - (target.def || 0));
        this.performAttack(actor, target, finalDmg, skillName);
    }

    enemyAction(actor) {
        // Find Target (Random living ally)
        const allies = this.currentBattle.units.filter(u => !u.isEnemy && u.currentHp > 0);
        if (allies.length === 0) {
            this.nextBattleTurn(); 
            return;
        }
        const target = allies[Math.floor(Math.random() * allies.length)];
        
        const dmg = Math.max(1, actor.atk - (target.def || 0));
        this.performAttack(actor, target, dmg, "Attacks");
    }

    performAttack(source, target, dmg, actionName) {
        this.logBattle(`${source.name} uses ${actionName} on ${target.name}!`);
        
        // Animate
        const targetEl = target.isEnemy 
            ? this.battleEnemies.querySelector(`[data-id="${target.id}"]`)
            : this.battleLayer; // Shake screen for ally hit
            
        if (targetEl) {
            targetEl.classList.add('shake');
            setTimeout(() => targetEl.classList.remove('shake'), 500);
            
            // Dmg Popup
            if (target.isEnemy) {
                const popup = document.createElement('div');
                popup.className = 'dmg-popup';
                popup.innerText = dmg;
                popup.style.left = '50%';
                popup.style.top = '0';
                targetEl.appendChild(popup);
                setTimeout(() => popup.remove(), 800);
            }
        }

        target.currentHp -= dmg;
        if (target.currentHp < 0) target.currentHp = 0;
        
        this.logBattle(`${target.name} took ${dmg} damage!`);
        
        if (target.currentHp === 0) {
            this.logBattle(`${target.name} collapsed!`);
        }

        this.renderBattleScene();
        setTimeout(() => this.finishTurn(), 1000);
    }

    finishTurn() {
        // Remove temp buffs
        const unit = this.currentBattle.units[this.currentBattle.activeUnitIndex];
        if (unit.defTemp) {
            unit.def -= unit.defTemp;
            delete unit.defTemp;
        }

        this.currentBattle.activeUnitIndex = (this.currentBattle.activeUnitIndex + 1) % this.currentBattle.units.length;
        
        // Auto-play handling for VN mode (not Battle, but good to have safety)
        if (this.autoPlay && this.vnLayer.style.display !== 'none') {
             setTimeout(() => {
                 if (!this.isTyping && !this.script[this.currentIndex].choices) this.next();
             }, 2000);
        }
        
        this.nextBattleTurn();
    }

    endBattle(victory) {
        if (victory) {
            this.currentIndex = this.currentBattle.onWin;
        } else {
            this.currentIndex = this.currentBattle.onLose;
        }
        this.runStep();
    }
}

/*
 * Aurora Project - Live2D Widget Engine
 * Based on PixiJS & pixi-live2d-display
 */

class Live2DWidget {
    constructor(options = {}) {
        this.options = {
            width: 280,
            height: 360,
            canvasId: 'live2d-canvas',
            containerId: 'live2d-widget',
            modelPath: '', // Path to .model3.json
            ...options
        };

        this.app = null;
        this.model = null;
        this.init();
    }

    async init() {
        console.log('[Live2DWidget] Init started');
        console.log('[Live2DWidget] PIXI version:', typeof PIXI !== 'undefined' ? PIXI.VERSION : 'undefined');
        console.log('[Live2DWidget] PIXI.live2d:', typeof PIXI !== 'undefined' && PIXI.live2d ? 'available' : 'undefined');

        // Check for dependencies
        if (typeof PIXI === 'undefined' || typeof PIXI.live2d === 'undefined') {
            console.error('Live2DWidget: PIXI or pixi-live2d-display not loaded.');
            return;
        }

        // Register Ticker for v6 compatibility if needed
        // This ensures the model updates every frame (animation, physics)
        PIXI.live2d.Live2DModel.registerTicker(PIXI.Ticker);

        // Setup PIXI Application
        this.app = new PIXI.Application({
            view: document.getElementById(this.options.canvasId),
            width: this.options.width,
            height: this.options.height,
            transparent: true,
            backgroundAlpha: 0,
            autoStart: true,
            antialias: true
        });

        // Enable interaction
        // Fixed for PixiJS v6.x (Plugin Interaction) vs v7.x (EventSystem)
        if (this.app.renderer.plugins && this.app.renderer.plugins.interaction) {
            this.app.renderer.plugins.interaction.cursorStyles.default = 'pointer';
        } else if (this.app.renderer.events) {
            this.app.renderer.events.cursorStyles.default = 'pointer';
        }

        // Load Model if path provided
        if (this.options.modelPath) {
            await this.loadModel(this.options.modelPath);
        } else {
            console.log('Live2DWidget: No model path provided. Ready to load.');
        }

        this.initUI();
    }

    async loadModel(path) {
        try {
            const model = await PIXI.live2d.Live2DModel.from(path, {
                autoInteract: true,
                autoUpdate: true // Ensure physics update
            });
            
            // Cleanup previous
            if (this.model) {
                this.app.stage.removeChild(this.model);
                this.model.destroy();
            }

            this.model = model;
            this.app.stage.addChild(this.model);

            // Positioning & Scaling - ROBUST METHOD
            // 1. Reset scale to 1 to get original bounds
            model.scale.set(1);
            
            // 2. Get bounds (this triggers update)
            const bounds = model.getBounds();
            const mw = bounds.width;
            const mh = bounds.height;

            // 3. Calculate Scale (Half-Body / Portrait Mode)
            // We want to zoom in to show the upper body/half body.
            const scaleX = (this.options.width * 0.95) / mw;
            const scaleY = (this.options.height * 0.95) / mh;
            
            // "Fit" scale would be Math.min(scaleX, scaleY).
            // We multiply by a factor (e.g. 2.3) to zoom in for a half-body view.
            const scale = Math.min(scaleX, scaleY) * 2.3;

            // 4. Apply Scale
            model.scale.set(scale);

            // 5. Position
            // Center X
            model.x = (this.options.width - (mw * scale)) / 2;
            
            // Align Top-ish (Half-Body View)
            model.y = this.options.height * 0.1;

            // --- Enable Mouse Tracking (Look at Cursor) ---
            // Variable to store target look coordinates
            let targetX = 0;
            let targetY = 0;
            let isMouthOpen = false; // Track mouth state
            
            // Interaction State
            let isDragging = false;

            const trackMouse = (clientX, clientY) => {
                if (!this.model || !this.model.internalModel) return;

                const rect = this.app.view.getBoundingClientRect();
                
                // Calculate Vector from Model Head to Mouse
                // Model Head is roughly at center X, and top 20% Y of canvas
                const headX = rect.left + rect.width / 2;
                const headY = rect.top + rect.height * 0.2;
                
                // Distance components
                const dx = clientX - headX;
                const dy = clientY - headY;
                
                // Normalization factor (how many pixels to reach max rotation)
                // Smaller = more sensitive
                const sensitivity = 400; // pixels

                // Calculate target values in range [-1, 1] (roughly)
                // Y is inverted because Screen Y Down is Positive, but Live2D Look Up is Positive
                targetX = dx / sensitivity;
                targetY = -dy / sensitivity;
            };

            const trackMouth = (isDown) => {
                isMouthOpen = isDown;
            };

            // Use Ticker for smooth updating
            this.app.ticker.add(() => {
                if (this.model && this.model.internalModel && this.model.internalModel.coreModel) {
                    // Update focus every frame
                    // We multiply by factors to increase sensitivity if needed
                    // (Standard range is -1 to 1)
                    
                    // Use built-in focus for general gaze (clamped)
                    this.model.focus(targetX, targetY);

                    // --- ENHANCED MANUAL TRACKING ("VIVID" MODE) ---
                    // Forcefully drive parameters for more responsive tracking
                    // Live2D parameters usually range -30 to 30 for angles
                    
                    // Smoothly interpolate current values towards targets (Simple LERP)
                    const smoothness = 0.15; // Increased from 0.1 for snappier response
                    
                    const core = this.model.internalModel.coreModel;
                    
                    // Helper to safely set param
                    const setParam = (id, value) => {
                        if (core.setParameterValueById) {
                            // Get current to lerp
                            const current = core.getParameterValueById(id);
                            const next = current + (value - current) * smoothness;
                            core.setParameterValueById(id, next);
                        }
                    };

                    // Clamp TargetX/Y for parameters
                    // Allow slightly over 1.0 to ensure we hit max angles
                    const tx = Math.max(-1.5, Math.min(1.5, targetX));
                    const ty = Math.max(-1.5, Math.min(1.5, targetY));

                    // AngleX: -30 to 30
                    const angleX = tx * 30;
                    const angleY = ty * 30;
                    const angleZ = angleX * angleY * -0.02; // Subtle tilt

                    // EyeBall: -1 to 1
                    const eyeX = Math.max(-1, Math.min(1, tx));
                    const eyeY = Math.max(-1, Math.min(1, ty));

                    // Apply with dampening to Standard Params
                    setParam('ParamAngleX', angleX);
                    setParam('ParamAngleY', angleY);
                    setParam('ParamAngleZ', angleZ);
                    setParam('ParamEyeBallX', eyeX);
                    setParam('ParamEyeBallY', eyeY);
                    
                    // Apply to VTube-style "IN" Params (Critical for this model's physics)
                    setParam('ParamAngleXIN', angleX);
                    setParam('ParamAngleYIN', angleY);
                    setParam('ParamAngleZIN', angleZ);
                    
                    // Body follows head (Enhanced Body Tracking)
                    const bodyX = angleX * 0.8;
                    const bodyY = angleY * 0.6;
                    const bodyZ = angleX * 0.4;

                    setParam('ParamBodyAngleX', bodyX); 
                    setParam('ParamBodyAngleY', bodyY); 
                    setParam('ParamBodyAngleZ', bodyZ);
                    
                    // Body "IN" Params
                    setParam('ParamBodyAngleXIN', bodyX);
                    setParam('ParamBodyAngleYIN', bodyY);
                    setParam('ParamBodyAngleZIN', bodyZ);

                    // Mouth Control (Click/Hold to Open)
                    // If mouse is down, target 1.0 (open), else 0.0 (closed)
                    // We use 'ParamMouthOpenY' which is standard
                    // Some models use 'ParamMouthOpen'
                    const targetMouth = isMouthOpen ? 1.0 : 0.0;
                    setParam('ParamMouthOpenY', targetMouth);
                    setParam('ParamMouthOpen', targetMouth); // Try both standard IDs
                }
            });

            // Mouse Move
            window.addEventListener('mousemove', (e) => trackMouse(e.clientX, e.clientY));
            
            // Mouse Down/Up for Mouth Control
            window.addEventListener('mousedown', () => trackMouth(true));
            window.addEventListener('mouseup', () => trackMouth(false));
            
            // Touch Move
            window.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    trackMouse(e.touches[0].clientX, e.touches[0].clientY);
                }
            });
            window.addEventListener('touchstart', () => trackMouth(true));
            window.addEventListener('touchend', () => trackMouth(false));
            // Touch Move
            window.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    trackMouse(e.touches[0].clientX, e.touches[0].clientY);
                }
            });
            // ----------------------------------------------

            // Log for debugging
            console.log(`[Aurora Live2D] Loaded: ${path}`);
            console.log(`[Aurora Live2D] Canvas: ${this.options.width}x${this.options.height}`);
            console.log(`[Aurora Live2D] Model Original: ${mw}x${mh}`);
            console.log(`[Aurora Live2D] Scale: ${scale} (Half-Body Mode)`);
            console.log(`[Aurora Live2D] Position: ${model.x}, ${model.y}`);

                // Teto Specific: Remove Watermark
                // We set the expression that was registered in model3.json
                try {
                    // Determine if it's the Teto model by checking available expressions or file path
                    if (path.includes('teto')) {
                        console.log('[Aurora Live2D] Applying Teto Settings (Watermark OFF + Utau Mode)...');
                        // Use expression if available
                        if (model.expression) {
                            model.expression('RemoveWatermark');
                            // Enable Utau Mode by default
                            model.expression('AltOutfit');
                        } 
                        // Fallback: Direct Parameter Set (in case expression fails or isn't ready)
                        // We set it on the internal core model
                        const core = model.internalModel.coreModel;
                        if (core.setParameterValueById) {
                            core.setParameterValueById('ParamWatermarkOFF', 1); 
                            // Set Utau Mode Parameter directly if expression fails
                            // Based on SV Utau ALT.exp3.json: SValtUtau = -1.0
                            core.setParameterValueById('SValtUtau', -1);
                        }
                    }
                } catch (e) {
                    console.warn('[Aurora Live2D] Failed to apply Teto settings:', e);
                }

            // Interaction Handlers
            // Ensure hit areas are properly registered for interactivity
            model.on('hit', (hitAreas) => {
                if (hitAreas.includes('body')) {
                    // model.motion('TapBody'); // Mapped to IDLE in JSON, but controller handles expressions
                }
                if (hitAreas.includes('head')) {
                    model.expression('Love');
                }
            });

            // PixiJS 6 Compatibility: Register interaction events manually if needed
            // Pixi-live2d-display usually handles this, but for some versions we need to ensure the model is interactive
            model.interactive = true;
            model.buttonMode = true; // Shows hand cursor

            // FALLBACK INTERACTION: If no hit areas are defined in model3.json
            if (!model.hitAreas || Object.keys(model.hitAreas).length === 0) {
                console.warn('[Aurora Live2D] No HitAreas found. Enabling fallback touch interactions.');
                
                model.on('pointerdown', (e) => {
                    // Simple heuristic: Top 25% is head, rest is body
                    // Need local point
                    const point = e.data.getLocalPosition(model);
                    const isHead = point.y < (model.internalModel.height / 4); // Approximate

                    console.log('[Aurora Live2D] Fallback Hit:', isHead ? 'Head' : 'Body');

                    if (isHead) {
                        model.emit('hit', ['head']);
                    } else {
                        model.emit('hit', ['body']);
                    }
                });
            }

            // Draggable (Optional, handled by container usually)
            
            console.log('Live2D Model Loaded:', path);

        } catch (e) {
            console.error('Live2D Load Error:', e);
            this.showError('模型加载失败 / Model Load Failed');
        }
    }

    initUI() {
        const container = document.getElementById(this.options.containerId);
        if (!container) return;

        // Add controls if needed (e.g. close button, switch model)
        // Currently handled by HTML/CSS
    }

    showError(msg) {
        // Visual feedback
        const canvas = document.getElementById(this.options.canvasId);
        if(canvas && canvas.parentElement) {
            const err = document.createElement('div');
            err.style.color = 'red';
            err.style.fontSize = '12px';
            err.innerText = msg;
            canvas.parentElement.appendChild(err);
        }
    }
}

// Expose
window.Live2DWidget = Live2DWidget;

//=============================================================================
// AIAutoPlay.js - RINNY DATE AI自动代打系统
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 🤖 RINNY DATE AI自动代打系统 v5.0 - 完整游戏AI系统
 * @author AI Assistant
 *
 * @help
 * ============================================================================
 * 🤖 RINNY DATE AI自动代打系统
 * ============================================================================
 * 
 * 快捷键:
 *   F8  - 开启/关闭AI托管
 *   F7  - 打开AI控制面板
 *   
 * 功能:
 *   - 🚶 自动寻路移动
 *   - 💬 自动触发事件/对话
 *   - ⚔️ 自动战斗
 *   - 🎯 自动完成任务
 *   - 🔄 自动巡逻探索
 *   - 💊 自动使用物品恢复
 * 
 * 控制台命令:
 *   AIBot.start()        - 开启AI托管
 *   AIBot.stop()         - 关闭AI托管
 *   AIBot.goTo(x, y)     - 移动到指定坐标
 *   AIBot.goToMap(id,x,y)- 传送并移动
 *   AIBot.explore()      - 开始探索模式
 *   AIBot.setMode(mode)  - 设置模式 (idle/explore/combat/quest)
 *   AIBot.help()         - 显示帮助
 * 
 * ============================================================================
 */

(() => {
    'use strict';

    //=========================================================================
    // AI Bot 全局控制对象
    //=========================================================================
    window.AIBot = {
        // === 状态 ===
        _enabled: false,
        _mode: 'idle',        // idle, explore, combat, quest, goTo
        _targetX: null,
        _targetY: null,
        _targetMapId: null,
        _path: [],
        _pathIndex: 0,
        _lastMoveTime: 0,
        _moveDelay: 50,       // 移动间隔(ms) - 降低以提高速度
        _movePerUpdate: 3,    // 每次更新移动的步数
        _stuckCounter: 0,
        _lastPosition: { x: 0, y: 0 },
        _exploredTiles: new Set(),
        _autoHeal: true,
        _autoInteract: true,
        _autoBattle: true,
        _battleAI: true,
        _pauseOnEvent: false,
        
        // === 新增：交互控制 ===
        _interactedEvents: new Map(),     // 已交互事件 {mapId_eventId: timestamp}
        _interactCooldown: 30000,         // 交互冷却时间(ms) - 30秒
        _blacklistedEvents: new Set(),    // 黑名单事件（传送点等）
        _transferEvents: new Set(),       // 传送类事件
        _lastInteractTime: 0,
        _interactDelay: 500,              // 交互延迟(ms)
        _choiceActive: false,             // 选择框激活状态
        _skipTransferEvents: true,        // 跳过传送事件
        _maxInteractPerEvent: 3,          // 每个事件最大交互次数
        _eventInteractCount: new Map(),   // 事件交互计数
        
        // === 游戏内逻辑 ===
        _gameLogic: true,                 // 启用游戏逻辑
        _currentQuest: null,              // 当前任务
        _npcPriority: new Map(),          // NPC优先级
        _questTargets: [],                // 任务目标位置
        
        // === 周目推进系统 ===
        _autoProgress: true,              // 自动推进周目
        _idleTime: 0,                     // 无事可做的时间
        _idleThreshold: 10000,            // 无事可做阈值(ms) - 10秒后开始推进周目
        _lastProgressCheck: 0,            // 上次推进检查时间
        _progressCooldown: 5000,          // 推进检查冷却(ms)
        _visitedMaps: new Set(),          // 已访问的地图
        _mapExploreTime: new Map(),       // 每个地图的探索时间
        _mapExploreThreshold: 60000,      // 地图探索时间阈值(ms) - 60秒后换地图
        
        // === 🧠 AI学习与惩罚系统 ===
        _iq: 100,                         // AI智商值 (0-200)
        _karma: 0,                        // 业力值（正=好，负=坏）
        _learningEnabled: true,           // 启用学习
        _punishmentEnabled: true,         // 启用惩罚
        _learnedChoices: new Map(),       // 学习到的选择 {choiceText: {good: n, bad: n}}
        _learnedEvents: new Map(),        // 学习到的事件 {eventKey: {value: n, visits: n}}
        
        // === 🛤️ 路线记忆系统 ===
        _routeMemory: new Map(),          // 路线记忆 {routeKey: {path, successCount, failCount, lastUsed}}
        _routeMemoryEnabled: true,        // 启用路线记忆
        _currentRoute: null,              // 当前执行的记忆路线
        _routeRecording: false,           // 是否正在录制路线
        _recordedPath: [],                // 正在录制的路径
        _lastRecordPos: null,             // 上次记录的位置
        _straightLineEnabled: true,       // 启用直线行走
        
        // === 🧬 自主进化系统 ===
        _evolutionLevel: 1,               // 进化等级 (1-10)
        _experience: 0,                   // 经验值
        _experienceToNextLevel: 100,      // 下一级所需经验
        _evolutionTraits: new Set(),      // 进化特性
        _adaptationHistory: [],           // 适应历史记录
        _strategyWeights: {               // 策略权重（自动调整）
            explore: 1.0,
            quest: 1.0,
            interact: 1.0,
            retreat: 1.0
        },
        
        // === 📍 坐标系统 ===
        _coordSystemEnabled: true,        // 启用坐标系统显示
        _showPlayerCoord: true,           // 显示玩家坐标
        _showMouseCoord: true,            // 显示鼠标坐标
        _showGridOverlay: false,          // 显示网格覆盖
        _coordHistory: [],                // 坐标历史记录
        _lastMouseX: 0,                   // 上次鼠标X
        _lastMouseY: 0,                   // 上次鼠标Y
        _mouseGridX: 0,                   // 鼠标所在网格X
        _mouseGridY: 0,                   // 鼠标所在网格Y
        
        // === 👁️ OCR识别系统 ===
        _ocrEnabled: true,                // 启用OCR
        _ocrLastResult: '',               // 上次OCR结果
        _ocrHistory: [],                  // OCR历史
        _ocrAutoCapture: false,           // 自动捕获
        _ocrCaptureInterval: 1000,        // 捕获间隔(ms)
        _lastOCRTime: 0,                  // 上次OCR时间
        _recognizedTexts: new Map(),      // 识别到的文字缓存
        
        // === 🎭 角色代入系统 (Character Immersion) ===
        _immersionEnabled: true,          // 启用角色代入
        _characterProfile: {
            name: 'Rinny',                // 角色名
            age: 18,                      // 年龄
            gender: 'female',             // 性别
            occupation: '普通少女',        // 职业/身份
            background: '一个普通的少女，在这个奇怪的世界中探索',
            goal: '探索世界，找到回家的路',
            fears: ['黑暗', '孤独', '怪物'],
            likes: ['甜食', '可爱的东西', '朋友'],
            dislikes: ['危险', '欺骗', '暴力']
        },
        
        // 性格特质 (Personality Traits) - 0-100
        _personality: {
            courage: 50,          // 勇气 (高=勇敢, 低=胆小)
            kindness: 70,         // 善良 (高=善良, 低=冷漠)
            curiosity: 80,        // 好奇心 (高=爱探索, 低=谨慎)
            trust: 60,            // 信任感 (高=容易信人, 低=多疑)
            optimism: 65,         // 乐观 (高=积极, 低=消极)
            impulsive: 40,        // 冲动 (高=冲动, 低=理性)
            sociable: 55,         // 社交性 (高=外向, 低=内向)
            stubborn: 45          // 固执 (高=固执, 低=随和)
        },
        
        // 情感状态 (Emotional State) - -100到100
        _emotions: {
            happiness: 50,        // 快乐
            fear: 0,              // 恐惧
            anger: 0,             // 愤怒
            sadness: 0,           // 悲伤
            surprise: 0,          // 惊讶
            disgust: 0,           // 厌恶
            trust: 50,            // 信任
            anticipation: 30      // 期待
        },
        
        // 心情指数 (综合)
        _mood: 50,                        // 0-100, 50为中性
        _moodHistory: [],                 // 心情历史
        
        // 关系记忆 (NPC Relationships)
        _relationships: new Map(),        // {npcName: {affection, trust, interactions, memories}}
        
        // 角色记忆 (Character Memories)
        _characterMemories: [],           // 重要记忆事件
        _recentExperiences: [],           // 最近的经历
        
        // 内心独白
        _innerThoughts: [],               // 内心想法队列
        _showInnerThoughts: true,         // 显示内心独白
        _thoughtDisplayTime: 3000,        // 独白显示时间(ms)
        _lastThoughtTime: 0,              // 上次独白时间
        
        // 角色状态
        _characterState: {
            tired: 0,             // 疲劳度 0-100
            hungry: 0,            // 饥饿度 0-100
            lonely: 0,            // 孤独感 0-100
            stressed: 0           // 压力值 0-100
        },
        
        _badActions: [],                  // 最近的坏行为记录
        _goodActions: [],                 // 最近的好行为记录
        _lastChoiceResult: null,          // 上次选择的结果
        _consecutiveStucks: 0,            // 连续卡住次数
        _consecutiveBadChoices: 0,        // 连续错误选择
        _shameLevel: 0,                   // 羞耻等级
        _punishmentCooldown: 0,           // 惩罚冷却
        
        // === 🚗 自动驾驶系统 (ADS - Autonomous Driving System) ===
        _adsLevel: 4,                     // 自动化等级 (0-5)
        _adsEnabled: true,                // ADS总开关
        
        // 感知模块 (Perception)
        _perception: {
            scanRadius: 15,               // 感知半径
            dangerZones: new Set(),       // 危险区域
            pointsOfInterest: [],         // 兴趣点
            nearbyNPCs: [],               // 附近NPC
            obstacles: [],                // 障碍物
            lastScanTime: 0,              // 上次扫描时间
            scanInterval: 500             // 扫描间隔(ms)
        },
        
        // 规划模块 (Planning)
        _planning: {
            globalPath: [],               // 全局路径（目标地图序列）
            localPath: [],                // 局部路径（当前地图内）
            waypoints: [],                // 途经点
            currentWaypoint: 0,           // 当前途经点索引
            replanCount: 0,               // 重规划次数
            lastReplanTime: 0             // 上次重规划时间
        },
        
        // 控制模块 (Control)
        _control: {
            targetSpeed: 3,               // 目标速度 (1-5)
            currentSpeed: 3,              // 当前速度
            steeringAngle: 0,             // 转向角度
            braking: false,               // 是否制动
            emergencyStop: false          // 紧急停止
        },
        
        // 安全模块 (Safety)
        _safety: {
            sanThreshold: 20,             // SAN值警戒线
            healthThreshold: 0.3,         // 生命值警戒比例
            dangerLevel: 0,               // 当前危险等级 (0-10)
            lastSafePosition: null,       // 最后安全位置
            emergencyDestination: null,   // 紧急目的地（家）
            collisionWarning: false,      // 碰撞预警
            systemStatus: 'normal'        // 系统状态: normal/warning/critical/emergency
        },
        
        // 预测模块 (Prediction)
        _prediction: {
            npcBehaviors: new Map(),      // NPC行为预测
            eventOutcomes: new Map(),     // 事件结果预测
            pathRisks: new Map(),         // 路径风险评估
            confidenceLevel: 0.5          // 预测置信度
        },
        
        // 诊断模块 (Diagnostics)
        _diagnostics: {
            systemHealth: 100,            // 系统健康度 (0-100)
            errorLog: [],                 // 错误日志
            performanceMetrics: {
                pathfindingTime: 0,
                decisionTime: 0,
                successRate: 0,
                totalDecisions: 0,
                goodDecisions: 0
            },
            lastDiagnosticTime: 0
        },
        
        // === 🎭 地图AI状态机 (State Machine) ===
        _stateMachine: {
            currentState: 'explore',      // 当前状态
            previousState: null,          // 上一个状态
            stateStartTime: 0,            // 状态开始时间
            stateData: {},                // 状态数据
            transitions: [],              // 状态转换记录
            maxTransitionsPerMinute: 30   // 每分钟最大转换次数（防抖动）
        },
        
        // 状态定义
        AI_STATES: {
            IDLE: 'idle',           // 待机
            EXPLORE: 'explore',     // 探索
            QUEST: 'quest',         // 任务
            SHOPPING: 'shopping',   // 购物
            COMBAT: 'combat',       // 战斗
            RETREAT: 'retreat',     // 撤退/回家
            INTERACT: 'interact',   // 交互中
            STUCK: 'stuck',         // 卡住
            EMERGENCY: 'emergency'  // 紧急状态
        },
        
        // === 🧠 AI架构系统 ===
        _aiArchitecture: {
            mode: 'hybrid',           // 'hardcode', 'fsm', 'bt', 'hybrid'
            debugMode: false,         // 调试模式
            tickRate: 100,            // AI更新频率(ms)
            lastTick: 0
        },
        
        // === 🔀 有限状态机 FSM (Finite State Machine) ===
        _fsm: {
            states: {},               // 状态定义 {stateName: {enter, update, exit, transitions}}
            currentState: null,       // 当前状态
            globalTransitions: [],    // 全局转换（任何状态都可触发）
            stateStack: [],           // 状态栈（支持pushdown automata）
            history: [],              // 状态历史
            blackboard: {}            // 共享数据黑板
        },
        
        // === 🌳 行为树 BT (Behavior Tree) ===
        _bt: {
            root: null,               // 行为树根节点
            runningNode: null,        // 当前运行的节点
            blackboard: {},           // 共享数据黑板
            tickCount: 0,             // tick计数
            debugLog: []              // 调试日志
        },
        
        // === 🛤️ 寻路系统 Pathfinding ===
        _pathfinding: {
            algorithm: 'auto',        // 'straight', 'greedy', 'astar', 'navmesh', 'auto'
            navMesh: null,            // 导航网格数据
            pathCache: new Map(),     // 路径缓存
            cacheTimeout: 5000,       // 缓存超时(ms)
            heuristic: 'manhattan',   // 启发函数: 'manhattan', 'euclidean', 'chebyshev'
            allowDiagonal: false,     // 是否允许对角移动
            smoothPath: true,         // 是否平滑路径
            dynamicObstacles: true,   // 是否考虑动态障碍物
            stats: {                  // 统计数据
                straightSuccess: 0,
                straightFail: 0,
                greedySuccess: 0,
                greedyFail: 0,
                astarSuccess: 0,
                astarFail: 0,
                navmeshSuccess: 0,
                navmeshFail: 0
            }
        },
        
        // === 😤 愤怒和兴奋模型 (Anger & Arousal Model) ===
        _arousalModel: {
            // 愤怒值 (0-100)
            anger: 0,
            angerDecayRate: 2,        // 每秒衰减
            angerThreshold: 60,       // 触发攻击行为的阈值
            
            // 兴奋值 (0-100)
            arousal: 50,              // 基础兴奋度
            arousalDecayRate: 1,      // 每秒衰减到基础值
            arousalThreshold: 80,     // 高兴奋阈值
            
            // 恐惧值 (0-100)
            fear: 0,
            fearDecayRate: 3,
            fearThreshold: 70,        // 触发逃跑行为
            
            // 行为倾向
            aggressiveness: 0.3,      // 攻击性 (0-1)
            fleeThreshold: 0.7,       // 逃跑阈值
            
            // 刺激记忆
            stimuli: [],              // 最近的刺激事件
            lastUpdate: 0
        },
        
        // === 🤖 代理模式 (Agent System) ===
        _agent: {
            id: 'player_agent',
            type: 'protagonist',
            
            // 代理属性
            attributes: {
                health: 100,
                stamina: 100,
                sanity: 100
            },
            
            // 代理目标
            goals: [],                // 目标队列 [{type, target, priority, status}]
            currentGoal: null,
            
            // 代理知识库
            knowledge: {
                knownLocations: new Map(),  // 已知位置
                knownNPCs: new Map(),       // 已知NPC
                knownItems: new Map(),      // 已知物品
                beliefs: new Map()          // 信念系统
            },
            
            // 代理计划
            plan: [],                 // 当前执行的计划
            planIndex: 0
        },
        
        // === 👁️ 感知系统 (Perception System) ===
        _senses: {
            // 视觉
            vision: {
                range: 10,            // 视野范围（格）
                fov: 120,             // 视野角度
                enabled: true
            },
            
            // 听觉
            hearing: {
                range: 15,            // 听觉范围
                enabled: true,
                sounds: []            // 听到的声音
            },
            
            // 记忆
            memory: {
                shortTerm: [],        // 短期记忆 (最近30秒)
                longTerm: [],         // 长期记忆 (重要事件)
                workingMemory: {},    // 工作记忆 (当前关注)
                capacity: 7,          // 工作记忆容量
                shortTermDuration: 30000  // 短期记忆持续时间(ms)
            },
            
            // 注意力
            attention: {
                focus: null,          // 当前关注对象
                alertLevel: 0,        // 警觉等级 (0-100)
                distractions: []      // 干扰物
            }
        },
        
        // === 🐦 群体行为 (Flocking Behavior) ===
        _flocking: {
            enabled: false,
            boids: [],                // 群体成员
            
            // 行为权重
            weights: {
                separation: 1.5,      // 分离权重
                alignment: 1.0,       // 对齐权重
                cohesion: 1.0,        // 聚合权重
                avoidance: 2.0,       // 避障权重
                seek: 0.5             // 寻目标权重
            },
            
            // 行为参数
            params: {
                separationRadius: 2,  // 分离半径
                alignmentRadius: 5,   // 对齐半径
                cohesionRadius: 8,    // 聚合半径
                maxSpeed: 2,
                maxForce: 0.5
            }
        },
        
        // === 🔧 调试系统 (Debug System) ===
        _debug: {
            enabled: false,
            showPath: true,           // 显示路径
            showFSM: true,            // 显示状态机
            showBT: true,             // 显示行为树
            showPerception: true,     // 显示感知
            showEmotions: true,       // 显示情感
            logLevel: 'info',         // 'none', 'error', 'warn', 'info', 'debug'
            perfMonitor: {
                fps: 0,
                updateTime: 0,
                pathfindTime: 0,
                decisionTime: 0
            },
            history: []               // 调试历史
        },
        
        // 游戏变量ID映射
        VAR: {
            ZINNIA: 1,      // Zinnia值
            BLOOD: 2,       // 血数
            SAN: 8,         // san值
            MAINLINE: 20,   // 主线
            MAINLINE2: 37   // 主线2
        },
        
        // 游戏开关ID映射
        SW: {
            RABBIT_EAR: 10,     // 兔耳|diz充分利用
            TAKE_DZ: 11,        // 带走dz
            JUICE_BLOOD: 12,    // 榨汁血
            ZINNIA_FLOWER: 13,  // zinnia小花
            FLOWER: 14,         // 小花
            SECOND_ROUND: 28,   // 二周目
            DEBUG: 29,          // debug
            THIRD_ROUND: 54     // 三周目
        },
        
        // 地图ID映射
        MAP: {
            STREET: 3,        // 街道
            CAKE_AREA: 4,     // 蛋糕区
            TOY_STORE: 5,     // 玩具店
            STORAGE: 6,       // 库
            DRINK_SHOP: 7,    // 饮料店
            STATION: 8,       // 车站
            PARK: 11,         // 公园
            EGG_HOUSE: 12,    // 彩蛋小屋
            START: 13,        // 起始地图
            HOME: 14,         // 家
            LAB: 16,          // 实验室
            CAKE_SHOP: 17,    // 蛋糕店
            LIBRARY: 18       // 图书馆
        },
        
        // === 核心控制 ===
        start: function() {
            this._enabled = true;
            this._mode = 'explore';
            console.log('🤖 AI托管已开启 - 探索模式');
            this._showNotification('🤖 AI托管开启');
            return true;
        },
        
        stop: function() {
            this._enabled = false;
            this._mode = 'idle';
            this._path = [];
            console.log('🤖 AI托管已关闭');
            this._showNotification('🤖 AI托管关闭');
            return true;
        },
        
        toggle: function() {
            if (this._enabled) {
                this.stop();
            } else {
                this.start();
            }
            return this._enabled;
        },
        
        // === 移动控制 ===
        goTo: function(x, y) {
            if (!$gameMap || !$gamePlayer) return false;
            this._targetX = x;
            this._targetY = y;
            this._targetMapId = $gameMap.mapId();
            this._mode = 'goTo';
            this._enabled = true;
            this._calculatePath();
            console.log(`🎯 AI正在前往: (${x}, ${y})`);
            this._showNotification(`🎯 前往 (${x}, ${y})`);
            return true;
        },
        
        goToMap: function(mapId, x, y) {
            if ($gameMap.mapId() !== mapId) {
                $gamePlayer.reserveTransfer(mapId, x, y, 2, 0);
                console.log(`🌀 传送到地图${mapId}`);
            }
            this._targetX = x;
            this._targetY = y;
            this._targetMapId = mapId;
            this._mode = 'goTo';
            this._enabled = true;
            return true;
        },
        
        explore: function() {
            this._mode = 'explore';
            this._enabled = true;
            this._exploredTiles.clear();
            console.log('🔍 开始探索模式');
            this._showNotification('🔍 探索模式');
            return true;
        },
        
        setMode: function(mode) {
            const validModes = ['idle', 'explore', 'combat', 'quest', 'goTo'];
            if (validModes.includes(mode)) {
                this._mode = mode;
                console.log(`🎮 AI模式: ${mode}`);
                return true;
            }
            return false;
        },
        
        // =====================================================================
        // 🧠 AI核心逻辑系统
        // =====================================================================
        
        // === 1. 朴素AI (Hard Code) ===
        // 基于简单规则的AI，直接用if-else判断
        _hardCodeAI: {
            // 规则优先级列表
            rules: [
                { name: 'emergency_heal', priority: 100, condition: (ctx) => ctx.san < 10, action: 'retreat' },
                { name: 'low_health', priority: 90, condition: (ctx) => ctx.hp < 0.2, action: 'heal' },
                { name: 'nearby_enemy', priority: 80, condition: (ctx) => ctx.nearbyEnemy, action: 'flee_or_fight' },
                { name: 'has_quest', priority: 70, condition: (ctx) => ctx.hasActiveQuest, action: 'quest' },
                { name: 'nearby_npc', priority: 50, condition: (ctx) => ctx.nearbyNPC, action: 'interact' },
                { name: 'unexplored', priority: 30, condition: (ctx) => ctx.hasUnexplored, action: 'explore' },
                { name: 'default', priority: 0, condition: () => true, action: 'idle' }
            ]
        },
        
        // 朴素AI决策
        hardCodeDecision: function() {
            const ctx = this._getAIContext();
            
            // 按优先级排序规则
            const sortedRules = [...this._hardCodeAI.rules].sort((a, b) => b.priority - a.priority);
            
            // 找到第一个满足条件的规则
            for (const rule of sortedRules) {
                if (rule.condition(ctx)) {
                    console.log(`🔧 [HardCode] 触发规则: ${rule.name} -> ${rule.action}`);
                    return { rule: rule.name, action: rule.action };
                }
            }
            
            return { rule: 'none', action: 'idle' };
        },
        
        // 获取AI决策上下文
        _getAIContext: function() {
            const player = $gamePlayer;
            const san = this.getVar(this.VAR.SAN) || 100;
            const leader = $gameParty?.leader();
            
            return {
                san: san,
                hp: leader ? leader.hp / leader.mhp : 1,
                mp: leader ? leader.mp / leader.mmp : 1,
                x: player?.x || 0,
                y: player?.y || 0,
                mapId: $gameMap?.mapId() || 0,
                nearbyEnemy: this._perception.dangerZones.size > 0,
                nearbyNPC: this._perception.nearbyNPCs.length > 0,
                hasActiveQuest: this._currentQuest !== null,
                hasUnexplored: (this._mapWalkableCache?.tiles?.length || 0) > this._exploredTiles.size,
                mood: this._mood,
                fear: this._emotions.fear,
                isMoving: player?.isMoving() || false,
                gold: $gameParty?.gold() || 0
            };
        },
        
        // === 2. 有限状态机 FSM (Finite State Machine) ===
        
        // 初始化FSM
        initFSM: function() {
            this._fsm.states = {
                // 待机状态
                idle: {
                    enter: () => {
                        console.log('🔄 [FSM] 进入待机状态');
                        this._fsm.blackboard.idleStartTime = Date.now();
                    },
                    update: () => {
                        // 待机时检查是否有事可做
                        const ctx = this._getAIContext();
                        if (ctx.hasActiveQuest) return 'quest';
                        if (ctx.nearbyNPC) return 'interact';
                        if (Date.now() - this._fsm.blackboard.idleStartTime > 3000) return 'explore';
                        return null; // 保持当前状态
                    },
                    exit: () => {
                        console.log('🔄 [FSM] 离开待机状态');
                    },
                    transitions: ['explore', 'quest', 'interact', 'combat', 'emergency']
                },
                
                // 探索状态
                explore: {
                    enter: () => {
                        console.log('🔄 [FSM] 进入探索状态');
                        this._mode = 'explore';
                    },
                    update: () => {
                        const ctx = this._getAIContext();
                        if (ctx.san < 20) return 'emergency';
                        if (ctx.nearbyEnemy) return 'combat';
                        if (ctx.hasActiveQuest) return 'quest';
                        return null;
                    },
                    exit: () => {},
                    transitions: ['idle', 'quest', 'interact', 'combat', 'emergency']
                },
                
                // 任务状态
                quest: {
                    enter: () => {
                        console.log('🔄 [FSM] 进入任务状态');
                        this._mode = 'quest';
                    },
                    update: () => {
                        const ctx = this._getAIContext();
                        if (ctx.san < 20) return 'emergency';
                        if (!ctx.hasActiveQuest) return 'explore';
                        return null;
                    },
                    exit: () => {},
                    transitions: ['explore', 'interact', 'combat', 'emergency']
                },
                
                // 交互状态
                interact: {
                    enter: () => {
                        console.log('🔄 [FSM] 进入交互状态');
                        this._fsm.blackboard.interactStartTime = Date.now();
                    },
                    update: () => {
                        // 交互超时检查
                        if (Date.now() - this._fsm.blackboard.interactStartTime > 30000) {
                            return 'explore';
                        }
                        // 检查是否还在对话中
                        if (!$gameMessage.isBusy()) {
                            return 'explore';
                        }
                        return null;
                    },
                    exit: () => {},
                    transitions: ['explore', 'quest', 'combat', 'emergency']
                },
                
                // 战斗状态
                combat: {
                    enter: () => {
                        console.log('🔄 [FSM] 进入战斗状态');
                        this._mode = 'combat';
                    },
                    update: () => {
                        const ctx = this._getAIContext();
                        if (ctx.hp < 0.2) return 'emergency';
                        if (!ctx.nearbyEnemy && !$gameParty.inBattle()) return 'explore';
                        return null;
                    },
                    exit: () => {},
                    transitions: ['explore', 'emergency']
                },
                
                // 紧急状态
                emergency: {
                    enter: () => {
                        console.log('🚨 [FSM] 进入紧急状态！');
                        this._mode = 'goTo';
                        // 设置目标为安全地点
                        this._targetX = 9;
                        this._targetY = 7;
                        this._targetMapId = this.MAP.HOME;
                    },
                    update: () => {
                        const ctx = this._getAIContext();
                        if (ctx.san >= 50 && ctx.hp >= 0.5) return 'idle';
                        return null;
                    },
                    exit: () => {
                        console.log('🚨 [FSM] 解除紧急状态');
                    },
                    transitions: ['idle']
                }
            };
            
            // 全局转换（任何状态下都可能触发）
            this._fsm.globalTransitions = [
                { condition: (ctx) => ctx.san < 10, targetState: 'emergency', priority: 100 },
                { condition: (ctx) => ctx.hp < 0.1, targetState: 'emergency', priority: 100 }
            ];
            
            this._fsm.currentState = 'idle';
            console.log('🔄 [FSM] 状态机初始化完成');
        },
        
        // FSM更新
        updateFSM: function() {
            if (!this._fsm.currentState) {
                this.initFSM();
            }
            
            const state = this._fsm.states[this._fsm.currentState];
            if (!state) return;
            
            const ctx = this._getAIContext();
            
            // 检查全局转换
            for (const gt of this._fsm.globalTransitions) {
                if (gt.condition(ctx)) {
                    this._fsmTransition(gt.targetState);
                    return;
                }
            }
            
            // 执行当前状态的update并检查转换
            const nextState = state.update();
            if (nextState && state.transitions.includes(nextState)) {
                this._fsmTransition(nextState);
            }
        },
        
        // FSM状态转换
        _fsmTransition: function(newState) {
            const oldState = this._fsm.states[this._fsm.currentState];
            const newStateObj = this._fsm.states[newState];
            
            if (!newStateObj) {
                console.error(`[FSM] 无效状态: ${newState}`);
                return;
            }
            
            // 退出旧状态
            if (oldState && oldState.exit) {
                oldState.exit();
            }
            
            // 记录历史
            this._fsm.history.push({
                from: this._fsm.currentState,
                to: newState,
                time: Date.now()
            });
            if (this._fsm.history.length > 100) {
                this._fsm.history.shift();
            }
            
            // 进入新状态
            this._fsm.currentState = newState;
            if (newStateObj.enter) {
                newStateObj.enter();
            }
        },
        
        // === 3. 行为树 BT (Behavior Tree) ===
        
        // 行为树节点类型
        BT_NODE_TYPE: {
            SEQUENCE: 'sequence',     // 顺序节点：依次执行子节点，全成功才成功
            SELECTOR: 'selector',     // 选择节点：依次尝试子节点，有一个成功就成功
            PARALLEL: 'parallel',     // 并行节点：同时执行所有子节点
            DECORATOR: 'decorator',   // 装饰节点：修改子节点行为
            ACTION: 'action',         // 动作节点：执行具体动作
            CONDITION: 'condition'    // 条件节点：检查条件
        },
        
        // 行为树节点状态
        BT_STATUS: {
            SUCCESS: 'success',
            FAILURE: 'failure',
            RUNNING: 'running'
        },
        
        // 初始化行为树
        initBehaviorTree: function() {
            // 构建行为树
            this._bt.root = this._btSelector('root', [
                // 紧急情况处理
                this._btSequence('emergency_handler', [
                    this._btCondition('is_emergency', () => this._getAIContext().san < 15),
                    this._btAction('flee_to_safety', () => {
                        this._targetMapId = this.MAP.HOME;
                        this._targetX = 9;
                        this._targetY = 7;
                        this._mode = 'goTo';
                        return this.BT_STATUS.SUCCESS;
                    })
                ]),
                
                // 战斗处理
                this._btSequence('combat_handler', [
                    this._btCondition('in_combat', () => $gameParty.inBattle()),
                    this._btAction('do_combat', () => {
                        this._mode = 'combat';
                        return this.BT_STATUS.RUNNING;
                    })
                ]),
                
                // 任务处理
                this._btSequence('quest_handler', [
                    this._btCondition('has_quest', () => this._currentQuest !== null),
                    this._btAction('do_quest', () => {
                        this._mode = 'quest';
                        return this.BT_STATUS.RUNNING;
                    })
                ]),
                
                // NPC交互
                this._btSequence('interact_handler', [
                    this._btCondition('nearby_npc', () => {
                        const adjacent = this._getAdjacentEvent();
                        return adjacent && this._canInteractWith(adjacent);
                    }),
                    this._btAction('interact_npc', () => {
                        const adjacent = this._getAdjacentEvent();
                        if (adjacent) {
                            adjacent.start();
                            return this.BT_STATUS.SUCCESS;
                        }
                        return this.BT_STATUS.FAILURE;
                    })
                ]),
                
                // 默认探索
                this._btAction('explore', () => {
                    this._mode = 'explore';
                    return this.BT_STATUS.RUNNING;
                })
            ]);
            
            console.log('🌳 [BT] 行为树初始化完成');
        },
        
        // 创建选择节点
        _btSelector: function(name, children) {
            return {
                type: this.BT_NODE_TYPE.SELECTOR,
                name: name,
                children: children,
                tick: function(bt) {
                    for (const child of this.children) {
                        const status = child.tick(bt);
                        if (status !== bt.BT_STATUS.FAILURE) {
                            return status;
                        }
                    }
                    return bt.BT_STATUS.FAILURE;
                }.bind(this)
            };
        },
        
        // 创建顺序节点
        _btSequence: function(name, children) {
            return {
                type: this.BT_NODE_TYPE.SEQUENCE,
                name: name,
                children: children,
                tick: function(bt) {
                    for (const child of this.children) {
                        const status = child.tick(bt);
                        if (status !== bt.BT_STATUS.SUCCESS) {
                            return status;
                        }
                    }
                    return bt.BT_STATUS.SUCCESS;
                }.bind(this)
            };
        },
        
        // 创建条件节点
        _btCondition: function(name, conditionFn) {
            return {
                type: this.BT_NODE_TYPE.CONDITION,
                name: name,
                tick: function(bt) {
                    const result = conditionFn();
                    if (bt._aiArchitecture.debugMode) {
                        console.log(`🌳 [BT] 条件 ${name}: ${result}`);
                    }
                    return result ? bt.BT_STATUS.SUCCESS : bt.BT_STATUS.FAILURE;
                }.bind(this)
            };
        },
        
        // 创建动作节点
        _btAction: function(name, actionFn) {
            return {
                type: this.BT_NODE_TYPE.ACTION,
                name: name,
                tick: function(bt) {
                    if (bt._aiArchitecture.debugMode) {
                        console.log(`🌳 [BT] 执行动作: ${name}`);
                    }
                    return actionFn();
                }.bind(this)
            };
        },
        
        // 执行行为树
        tickBehaviorTree: function() {
            if (!this._bt.root) {
                this.initBehaviorTree();
            }
            
            this._bt.tickCount++;
            const status = this._bt.root.tick(this);
            
            if (this._aiArchitecture.debugMode) {
                this._bt.debugLog.push({
                    tick: this._bt.tickCount,
                    status: status,
                    time: Date.now()
                });
                if (this._bt.debugLog.length > 100) {
                    this._bt.debugLog.shift();
                }
            }
            
            return status;
        },
        
        // === 4. 寻路算法集合 ===
        
        // 智能路径计算（自动选择算法）
        _calculatePath: function() {
            if (!$gamePlayer || this._targetX === null) return;
            
            const startX = $gamePlayer.x;
            const startY = $gamePlayer.y;
            const endX = this._targetX;
            const endY = this._targetY;
            
            // 根据设置选择算法
            const algorithm = this._pathfinding.algorithm;
            let path = [];
            
            const startTime = performance.now();
            
            switch (algorithm) {
                case 'straight':
                    path = this._straightPathfind(startX, startY, endX, endY);
                    break;
                case 'greedy':
                    path = this._greedyPathfind(startX, startY, endX, endY);
                    break;
                case 'astar':
                    path = this._aStar(startX, startY, endX, endY);
                    break;
                case 'navmesh':
                    path = this._navMeshPathfind(startX, startY, endX, endY);
                    break;
                case 'auto':
                default:
                    path = this._autoPathfind(startX, startY, endX, endY);
                    break;
            }
            
            const endTime = performance.now();
            this._diagnostics.performanceMetrics.pathfindingTime = endTime - startTime;
            
            this._path = path;
            this._pathIndex = 0;
        },
        
        // 自动选择最佳寻路算法
        _autoPathfind: function(startX, startY, endX, endY) {
            const dist = Math.abs(endX - startX) + Math.abs(endY - startY);
            
            // 距离很近时，尝试直线
            if (dist <= 5) {
                const straightPath = this._straightPathfind(startX, startY, endX, endY);
                if (straightPath.length > 0) {
                    this._pathfinding.stats.straightSuccess++;
                    return straightPath;
                }
                this._pathfinding.stats.straightFail++;
            }
            
            // 中等距离，尝试贪心
            if (dist <= 15) {
                const greedyPath = this._greedyPathfind(startX, startY, endX, endY);
                if (greedyPath.length > 0) {
                    this._pathfinding.stats.greedySuccess++;
                    return greedyPath;
                }
                this._pathfinding.stats.greedyFail++;
            }
            
            // 使用A*作为后备
            const astarPath = this._aStar(startX, startY, endX, endY);
            if (astarPath.length > 0) {
                this._pathfinding.stats.astarSuccess++;
            } else {
                this._pathfinding.stats.astarFail++;
            }
            return astarPath;
        },
        
        // === 4.1 直线寻路 (Straight Line Pathfinding) ===
        // 最简单的寻路：直接走直线，遇到障碍就失败
        _straightPathfind: function(startX, startY, endX, endY) {
            const path = [];
            let currentX = startX;
            let currentY = startY;
            
            const maxSteps = Math.abs(endX - startX) + Math.abs(endY - startY) + 10;
            let steps = 0;
            
            while ((currentX !== endX || currentY !== endY) && steps < maxSteps) {
                steps++;
                
                // 计算下一步方向
                let nextX = currentX;
                let nextY = currentY;
                
                // 优先水平移动
                if (currentX !== endX) {
                    nextX = currentX + (endX > currentX ? 1 : -1);
                } else if (currentY !== endY) {
                    nextY = currentY + (endY > currentY ? 1 : -1);
                }
                
                // 检查是否可通行
                if (!this._isPassable(currentX, currentY, nextX, nextY)) {
                    // 直线被阻挡，返回空路径
                    return [];
                }
                
                path.push({ x: nextX, y: nextY });
                currentX = nextX;
                currentY = nextY;
            }
            
            return path;
        },
        
        // === 4.2 贪心寻路 (Greedy Best-First Search) ===
        // 每步选择离目标最近的可通行点
        _greedyPathfind: function(startX, startY, endX, endY) {
            const path = [];
            const visited = new Set();
            let currentX = startX;
            let currentY = startY;
            
            const maxSteps = 200;
            let steps = 0;
            
            const heuristic = (x, y) => {
                if (this._pathfinding.heuristic === 'euclidean') {
                    return Math.sqrt(Math.pow(endX - x, 2) + Math.pow(endY - y, 2));
                } else if (this._pathfinding.heuristic === 'chebyshev') {
                    return Math.max(Math.abs(endX - x), Math.abs(endY - y));
                }
                return Math.abs(endX - x) + Math.abs(endY - y); // manhattan
            };
            
            while ((currentX !== endX || currentY !== endY) && steps < maxSteps) {
                steps++;
                visited.add(`${currentX},${currentY}`);
                
                // 获取所有可能的下一步
                const neighbors = [
                    { x: currentX, y: currentY - 1, dir: 8 },  // 上
                    { x: currentX, y: currentY + 1, dir: 2 },  // 下
                    { x: currentX - 1, y: currentY, dir: 4 },  // 左
                    { x: currentX + 1, y: currentY, dir: 6 }   // 右
                ];
                
                // 筛选可通行且未访问的邻居
                const validNeighbors = neighbors.filter(n => 
                    !visited.has(`${n.x},${n.y}`) && 
                    this._isPassable(currentX, currentY, n.x, n.y)
                );
                
                if (validNeighbors.length === 0) {
                    // 无路可走
                    return [];
                }
                
                // 选择离目标最近的
                validNeighbors.sort((a, b) => heuristic(a.x, a.y) - heuristic(b.x, b.y));
                const best = validNeighbors[0];
                
                path.push({ x: best.x, y: best.y });
                currentX = best.x;
                currentY = best.y;
            }
            
            return steps < maxSteps ? path : [];
        },
        
        // === 4.3 A* 寻路算法 (保留原有实现) ===
        
        _aStar: function(startX, startY, endX, endY) {
            const openList = [];
            const closedList = new Set();
            const cameFrom = new Map();
            const gScore = new Map();
            const fScore = new Map();
            
            const key = (x, y) => `${x},${y}`;
            const heuristic = (x, y) => Math.abs(x - endX) + Math.abs(y - endY);
            
            const startKey = key(startX, startY);
            openList.push({ x: startX, y: startY, f: heuristic(startX, startY) });
            gScore.set(startKey, 0);
            fScore.set(startKey, heuristic(startX, startY));
            
            const directions = [
                { dx: 0, dy: -1 }, // 上
                { dx: 0, dy: 1 },  // 下
                { dx: -1, dy: 0 }, // 左
                { dx: 1, dy: 0 }   // 右
            ];
            
            let iterations = 0;
            const maxIterations = 1000;
            
            while (openList.length > 0 && iterations < maxIterations) {
                iterations++;
                
                // 获取f值最小的节点
                openList.sort((a, b) => a.f - b.f);
                const current = openList.shift();
                const currentKey = key(current.x, current.y);
                
                // 到达目标
                if (current.x === endX && current.y === endY) {
                    return this._reconstructPath(cameFrom, current);
                }
                
                closedList.add(currentKey);
                
                // 检查四个方向
                for (const dir of directions) {
                    const newX = current.x + dir.dx;
                    const newY = current.y + dir.dy;
                    const newKey = key(newX, newY);
                    
                    if (closedList.has(newKey)) continue;
                    if (!this._isPassable(current.x, current.y, newX, newY)) continue;
                    
                    const tentativeG = gScore.get(currentKey) + 1;
                    
                    if (!gScore.has(newKey) || tentativeG < gScore.get(newKey)) {
                        cameFrom.set(newKey, current);
                        gScore.set(newKey, tentativeG);
                        const f = tentativeG + heuristic(newX, newY);
                        fScore.set(newKey, f);
                        
                        if (!openList.find(n => n.x === newX && n.y === newY)) {
                            openList.push({ x: newX, y: newY, f: f });
                        }
                    }
                }
            }
            
            return []; // 无路可走
        },
        
        // === 4.4 导航网格寻路 (NavMesh Pathfinding) ===
        // 使用预计算的导航网格进行寻路
        _navMeshPathfind: function(startX, startY, endX, endY) {
            // 检查是否有导航网格
            if (!this._pathfinding.navMesh) {
                this._generateNavMesh();
            }
            
            const navMesh = this._pathfinding.navMesh;
            if (!navMesh || navMesh.regions.length === 0) {
                // 没有导航网格，回退到A*
                return this._aStar(startX, startY, endX, endY);
            }
            
            // 找到起点和终点所在的区域
            const startRegion = this._findNavMeshRegion(startX, startY);
            const endRegion = this._findNavMeshRegion(endX, endY);
            
            if (!startRegion || !endRegion) {
                return this._aStar(startX, startY, endX, endY);
            }
            
            // 如果在同一区域，直接走直线
            if (startRegion.id === endRegion.id) {
                return this._straightPathfind(startX, startY, endX, endY) || 
                       this._aStar(startX, startY, endX, endY);
            }
            
            // 在区域图上使用A*寻找路径
            const regionPath = this._findRegionPath(startRegion, endRegion);
            if (regionPath.length === 0) {
                return this._aStar(startX, startY, endX, endY);
            }
            
            // 将区域路径转换为实际路径
            const path = [];
            let currentX = startX;
            let currentY = startY;
            
            for (let i = 1; i < regionPath.length; i++) {
                const region = regionPath[i];
                const waypoint = region.center;
                
                // 从当前点到区域中心
                const subPath = this._aStar(currentX, currentY, waypoint.x, waypoint.y);
                path.push(...subPath);
                
                currentX = waypoint.x;
                currentY = waypoint.y;
            }
            
            // 最后一段到目标点
            const finalPath = this._aStar(currentX, currentY, endX, endY);
            path.push(...finalPath);
            
            this._pathfinding.stats.navmeshSuccess++;
            return path;
        },
        
        // 生成导航网格
        _generateNavMesh: function() {
            if (!$gameMap) return;
            
            console.log('🗺️ 生成导航网格...');
            const startTime = performance.now();
            
            const width = $gameMap.width();
            const height = $gameMap.height();
            const regions = [];
            const visited = new Set();
            
            // 使用洪水填充找到连通的可行走区域
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const key = `${x},${y}`;
                    if (visited.has(key)) continue;
                    if (!$gameMap.isPassable(x, y, 2)) continue; // 检查基本通行性
                    
                    // 洪水填充找到这个区域
                    const region = this._floodFillRegion(x, y, visited);
                    if (region.tiles.length >= 4) { // 只保留足够大的区域
                        region.id = regions.length;
                        regions.push(region);
                    }
                }
            }
            
            // 计算区域间的连接
            for (let i = 0; i < regions.length; i++) {
                regions[i].neighbors = [];
                for (let j = i + 1; j < regions.length; j++) {
                    if (this._areRegionsAdjacent(regions[i], regions[j])) {
                        regions[i].neighbors.push(j);
                        regions[j].neighbors.push(i);
                    }
                }
            }
            
            this._pathfinding.navMesh = {
                mapId: $gameMap.mapId(),
                regions: regions,
                generated: Date.now()
            };
            
            const endTime = performance.now();
            console.log(`🗺️ 导航网格生成完成: ${regions.length}个区域, 耗时${(endTime - startTime).toFixed(2)}ms`);
        },
        
        // 洪水填充找区域
        _floodFillRegion: function(startX, startY, visited) {
            const tiles = [];
            const queue = [{ x: startX, y: startY }];
            let sumX = 0, sumY = 0;
            let minX = startX, maxX = startX, minY = startY, maxY = startY;
            
            while (queue.length > 0) {
                const { x, y } = queue.shift();
                const key = `${x},${y}`;
                
                if (visited.has(key)) continue;
                if (!$gameMap.isPassable(x, y, 2)) continue;
                
                visited.add(key);
                tiles.push({ x, y });
                sumX += x;
                sumY += y;
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
                
                // 四方向扩展
                const neighbors = [
                    { x: x, y: y - 1 },
                    { x: x, y: y + 1 },
                    { x: x - 1, y: y },
                    { x: x + 1, y: y }
                ];
                
                for (const n of neighbors) {
                    if (!visited.has(`${n.x},${n.y}`)) {
                        queue.push(n);
                    }
                }
            }
            
            return {
                tiles: tiles,
                center: { 
                    x: Math.round(sumX / tiles.length), 
                    y: Math.round(sumY / tiles.length) 
                },
                bounds: { minX, maxX, minY, maxY }
            };
        },
        
        // 检查两个区域是否相邻
        _areRegionsAdjacent: function(region1, region2) {
            const tiles1 = new Set(region1.tiles.map(t => `${t.x},${t.y}`));
            
            for (const tile of region2.tiles) {
                // 检查四个方向
                if (tiles1.has(`${tile.x},${tile.y - 1}`) ||
                    tiles1.has(`${tile.x},${tile.y + 1}`) ||
                    tiles1.has(`${tile.x - 1},${tile.y}`) ||
                    tiles1.has(`${tile.x + 1},${tile.y}`)) {
                    return true;
                }
            }
            return false;
        },
        
        // 找到点所在的区域
        _findNavMeshRegion: function(x, y) {
            if (!this._pathfinding.navMesh) return null;
            
            for (const region of this._pathfinding.navMesh.regions) {
                for (const tile of region.tiles) {
                    if (tile.x === x && tile.y === y) {
                        return region;
                    }
                }
            }
            return null;
        },
        
        // 在区域图上寻路
        _findRegionPath: function(startRegion, endRegion) {
            const navMesh = this._pathfinding.navMesh;
            const openList = [{ region: startRegion, path: [startRegion], cost: 0 }];
            const visited = new Set([startRegion.id]);
            
            while (openList.length > 0) {
                openList.sort((a, b) => a.cost - b.cost);
                const current = openList.shift();
                
                if (current.region.id === endRegion.id) {
                    return current.path;
                }
                
                for (const neighborId of current.region.neighbors) {
                    if (visited.has(neighborId)) continue;
                    visited.add(neighborId);
                    
                    const neighbor = navMesh.regions[neighborId];
                    const dist = Math.abs(neighbor.center.x - endRegion.center.x) + 
                                 Math.abs(neighbor.center.y - endRegion.center.y);
                    
                    openList.push({
                        region: neighbor,
                        path: [...current.path, neighbor],
                        cost: current.cost + 1 + dist * 0.1
                    });
                }
            }
            
            return [];
        },
        
        // === 5. 寻路总结与统计 ===
        
        // 显示寻路统计
        showPathfindingStats: function() {
            const stats = this._pathfinding.stats;
            const total = stats.straightSuccess + stats.straightFail + 
                         stats.greedySuccess + stats.greedyFail + 
                         stats.astarSuccess + stats.astarFail +
                         stats.navmeshSuccess + stats.navmeshFail;
            
            console.log(`
╔═══════════════════════════════════════════════╗
║  🛤️ 寻路算法统计                              ║
╠═══════════════════════════════════════════════╣
║  当前算法: ${this._pathfinding.algorithm}
║  启发函数: ${this._pathfinding.heuristic}
║  路径平滑: ${this._pathfinding.smoothPath ? '开启' : '关闭'}
║  ─────────────────────────────────────────────
║  📐 直线寻路: 成功${stats.straightSuccess} 失败${stats.straightFail}
║     成功率: ${stats.straightSuccess + stats.straightFail > 0 ? 
               ((stats.straightSuccess / (stats.straightSuccess + stats.straightFail)) * 100).toFixed(1) : 0}%
║  
║  🎯 贪心寻路: 成功${stats.greedySuccess} 失败${stats.greedyFail}
║     成功率: ${stats.greedySuccess + stats.greedyFail > 0 ? 
               ((stats.greedySuccess / (stats.greedySuccess + stats.greedyFail)) * 100).toFixed(1) : 0}%
║  
║  ⭐ A*寻路: 成功${stats.astarSuccess} 失败${stats.astarFail}
║     成功率: ${stats.astarSuccess + stats.astarFail > 0 ? 
               ((stats.astarSuccess / (stats.astarSuccess + stats.astarFail)) * 100).toFixed(1) : 0}%
║  
║  🗺️ 导航网格: 成功${stats.navmeshSuccess} 失败${stats.navmeshFail}
║     成功率: ${stats.navmeshSuccess + stats.navmeshFail > 0 ? 
               ((stats.navmeshSuccess / (stats.navmeshSuccess + stats.navmeshFail)) * 100).toFixed(1) : 0}%
║  ─────────────────────────────────────────────
║  总计算次数: ${total}
║  平均耗时: ${this._diagnostics.performanceMetrics.pathfindingTime.toFixed(2)}ms
╚═══════════════════════════════════════════════╝
            `);
            
            return stats;
        },
        
        // 设置寻路算法
        setPathfindingAlgorithm: function(algorithm) {
            const valid = ['straight', 'greedy', 'astar', 'navmesh', 'auto'];
            if (valid.includes(algorithm)) {
                this._pathfinding.algorithm = algorithm;
                console.log(`🛤️ 寻路算法设置为: ${algorithm}`);
                return true;
            }
            console.log(`❌ 无效的寻路算法: ${algorithm}，可选: ${valid.join(', ')}`);
            return false;
        },
        
        // 设置启发函数
        setHeuristic: function(heuristic) {
            const valid = ['manhattan', 'euclidean', 'chebyshev'];
            if (valid.includes(heuristic)) {
                this._pathfinding.heuristic = heuristic;
                console.log(`🛤️ 启发函数设置为: ${heuristic}`);
                return true;
            }
            console.log(`❌ 无效的启发函数: ${heuristic}，可选: ${valid.join(', ')}`);
            return false;
        },
        
        // 重置寻路统计
        resetPathfindingStats: function() {
            this._pathfinding.stats = {
                straightSuccess: 0, straightFail: 0,
                greedySuccess: 0, greedyFail: 0,
                astarSuccess: 0, astarFail: 0,
                navmeshSuccess: 0, navmeshFail: 0
            };
            console.log('🛤️ 寻路统计已重置');
        },
        
        // 强制重新生成导航网格
        regenerateNavMesh: function() {
            this._pathfinding.navMesh = null;
            this._generateNavMesh();
        },
        
        // 显示AI架构状态
        showAIArchitecture: function() {
            console.log(`
╔═══════════════════════════════════════════════╗
║  🧠 AI架构系统状态                            ║
╠═══════════════════════════════════════════════╣
║  当前模式: ${this._aiArchitecture.mode}
║  调试模式: ${this._aiArchitecture.debugMode ? '开启' : '关闭'}
║  更新频率: ${this._aiArchitecture.tickRate}ms
║  ─────────────────────────────────────────────
║  🔧 Hard Code AI:
║     规则数: ${this._hardCodeAI.rules.length}
║  
║  🔀 有限状态机 FSM:
║     当前状态: ${this._fsm.currentState || '未初始化'}
║     状态数: ${Object.keys(this._fsm.states).length}
║     历史记录: ${this._fsm.history.length}条
║  
║  🌳 行为树 BT:
║     tick计数: ${this._bt.tickCount}
║     已初始化: ${this._bt.root ? '是' : '否'}
║  
║  🛤️ 寻路系统:
║     算法: ${this._pathfinding.algorithm}
║     导航网格: ${this._pathfinding.navMesh ? `${this._pathfinding.navMesh.regions.length}区域` : '未生成'}
╚═══════════════════════════════════════════════╝
            `);
        },
        
        // 设置AI架构模式
        setAIMode: function(mode) {
            const valid = ['hardcode', 'fsm', 'bt', 'hybrid'];
            if (valid.includes(mode)) {
                this._aiArchitecture.mode = mode;
                console.log(`🧠 AI架构模式设置为: ${mode}`);
                
                // 初始化对应系统
                if (mode === 'fsm' || mode === 'hybrid') {
                    this.initFSM();
                }
                if (mode === 'bt' || mode === 'hybrid') {
                    this.initBehaviorTree();
                }
                
                return true;
            }
            console.log(`❌ 无效的AI模式: ${mode}，可选: ${valid.join(', ')}`);
            return false;
        },
        
        // 开启/关闭调试模式
        toggleAIDebug: function() {
            this._aiArchitecture.debugMode = !this._aiArchitecture.debugMode;
            console.log(`🐛 AI调试模式: ${this._aiArchitecture.debugMode ? '开启' : '关闭'}`);
            return this._aiArchitecture.debugMode;
        },
        
        // =====================================================================
        // 😤 愤怒和兴奋模型 (Anger & Arousal Model)
        // =====================================================================
        
        // 更新情绪模型
        updateArousalModel: function(deltaTime = 100) {
            const model = this._arousalModel;
            const dt = deltaTime / 1000; // 转换为秒
            
            // 衰减到基础值
            // 愤怒衰减
            if (model.anger > 0) {
                model.anger = Math.max(0, model.anger - model.angerDecayRate * dt);
            }
            
            // 兴奋衰减到基础值(50)
            if (model.arousal > 50) {
                model.arousal = Math.max(50, model.arousal - model.arousalDecayRate * dt);
            } else if (model.arousal < 50) {
                model.arousal = Math.min(50, model.arousal + model.arousalDecayRate * dt);
            }
            
            // 恐惧衰减
            if (model.fear > 0) {
                model.fear = Math.max(0, model.fear - model.fearDecayRate * dt);
            }
            
            // 清理过期刺激
            const now = Date.now();
            model.stimuli = model.stimuli.filter(s => now - s.time < 10000);
            
            model.lastUpdate = now;
        },
        
        // 添加刺激
        addStimulus: function(type, intensity, source = null) {
            const model = this._arousalModel;
            
            // 记录刺激
            model.stimuli.push({
                type: type,
                intensity: intensity,
                source: source,
                time: Date.now()
            });
            
            // 根据刺激类型更新情绪
            switch (type) {
                case 'attack':
                case 'damage':
                    model.anger = Math.min(100, model.anger + intensity * 0.8);
                    model.arousal = Math.min(100, model.arousal + intensity * 0.5);
                    model.fear = Math.min(100, model.fear + intensity * 0.3);
                    break;
                    
                case 'threat':
                    model.fear = Math.min(100, model.fear + intensity * 0.7);
                    model.arousal = Math.min(100, model.arousal + intensity * 0.4);
                    break;
                    
                case 'provoke':
                    model.anger = Math.min(100, model.anger + intensity * 0.6);
                    model.arousal = Math.min(100, model.arousal + intensity * 0.3);
                    break;
                    
                case 'scare':
                    model.fear = Math.min(100, model.fear + intensity * 0.9);
                    model.arousal = Math.min(100, model.arousal + intensity * 0.6);
                    break;
                    
                case 'calm':
                    model.anger = Math.max(0, model.anger - intensity * 0.5);
                    model.fear = Math.max(0, model.fear - intensity * 0.5);
                    model.arousal = Math.max(30, model.arousal - intensity * 0.3);
                    break;
                    
                case 'excite':
                    model.arousal = Math.min(100, model.arousal + intensity * 0.7);
                    break;
                    
                case 'reward':
                    model.anger = Math.max(0, model.anger - intensity * 0.3);
                    model.arousal = Math.min(100, model.arousal + intensity * 0.2);
                    break;
            }
            
            // 同步到情感系统
            this._syncArousalToEmotions();
            
            console.log(`😤 刺激: ${type} (强度${intensity}) -> 愤怒${model.anger.toFixed(0)} 兴奋${model.arousal.toFixed(0)} 恐惧${model.fear.toFixed(0)}`);
        },
        
        // 同步到情感系统
        _syncArousalToEmotions: function() {
            const model = this._arousalModel;
            this._emotions.anger = model.anger;
            this._emotions.fear = model.fear;
            // 兴奋影响期待和快乐
            this._emotions.anticipation = model.arousal * 0.5;
            if (model.arousal > 70) {
                this._emotions.happiness = Math.min(100, this._emotions.happiness + 5);
            }
        },
        
        // 获取基于情绪的行为倾向
        getEmotionalBehavior: function() {
            const model = this._arousalModel;
            
            // 恐惧优先 - 逃跑
            if (model.fear >= model.fearThreshold) {
                return { behavior: 'flee', urgency: model.fear / 100 };
            }
            
            // 愤怒次之 - 攻击
            if (model.anger >= model.angerThreshold) {
                return { behavior: 'attack', urgency: model.anger / 100 };
            }
            
            // 高兴奋 - 激进探索
            if (model.arousal >= model.arousalThreshold) {
                return { behavior: 'aggressive_explore', urgency: 0.5 };
            }
            
            // 低兴奋 - 谨慎
            if (model.arousal < 30) {
                return { behavior: 'cautious', urgency: 0.3 };
            }
            
            // 正常
            return { behavior: 'normal', urgency: 0 };
        },
        
        // 显示情绪状态
        showArousalModel: function() {
            const model = this._arousalModel;
            const behavior = this.getEmotionalBehavior();
            
            console.log(`
╔═══════════════════════════════════════════════╗
║  😤 愤怒和兴奋模型                            ║
╠═══════════════════════════════════════════════╣
║  愤怒: ${'█'.repeat(Math.floor(model.anger/10))}${'░'.repeat(10-Math.floor(model.anger/10))} ${model.anger.toFixed(0)}/100
║  兴奋: ${'█'.repeat(Math.floor(model.arousal/10))}${'░'.repeat(10-Math.floor(model.arousal/10))} ${model.arousal.toFixed(0)}/100
║  恐惧: ${'█'.repeat(Math.floor(model.fear/10))}${'░'.repeat(10-Math.floor(model.fear/10))} ${model.fear.toFixed(0)}/100
║  ─────────────────────────────────────────────
║  当前行为倾向: ${behavior.behavior} (紧迫度: ${(behavior.urgency * 100).toFixed(0)}%)
║  攻击性: ${(model.aggressiveness * 100).toFixed(0)}%
║  最近刺激: ${model.stimuli.length}个
╚═══════════════════════════════════════════════╝
            `);
            
            return { model, behavior };
        },
        
        // =====================================================================
        // 🤖 代理模式 (Agent System)
        // =====================================================================
        
        // 添加目标
        addGoal: function(type, target, priority = 5) {
            const goal = {
                id: Date.now(),
                type: type,           // 'goto', 'interact', 'collect', 'avoid', 'follow'
                target: target,
                priority: priority,   // 1-10
                status: 'pending',    // 'pending', 'active', 'completed', 'failed'
                createdAt: Date.now(),
                progress: 0
            };
            
            this._agent.goals.push(goal);
            this._agent.goals.sort((a, b) => b.priority - a.priority);
            
            console.log(`🎯 添加目标: [${type}] ${JSON.stringify(target)} (优先级${priority})`);
            return goal.id;
        },
        
        // 移除目标
        removeGoal: function(goalId) {
            const index = this._agent.goals.findIndex(g => g.id === goalId);
            if (index >= 0) {
                this._agent.goals.splice(index, 1);
                return true;
            }
            return false;
        },
        
        // 获取当前目标
        getCurrentGoal: function() {
            // 找到最高优先级的pending或active目标
            for (const goal of this._agent.goals) {
                if (goal.status === 'active') return goal;
            }
            for (const goal of this._agent.goals) {
                if (goal.status === 'pending') {
                    goal.status = 'active';
                    this._agent.currentGoal = goal;
                    return goal;
                }
            }
            return null;
        },
        
        // 执行目标
        executeGoal: function(goal) {
            if (!goal) return false;
            
            switch (goal.type) {
                case 'goto':
                    if (!goal.target || goal.target.x === undefined) return false;
                    this._targetX = goal.target.x;
                    this._targetY = goal.target.y;
                    if (goal.target.mapId && goal.target.mapId !== $gameMap.mapId()) {
                        this._targetMapId = goal.target.mapId;
                    }
                    this._mode = 'goTo';
                    
                    // 检查是否到达
                    if ($gamePlayer.x === goal.target.x && $gamePlayer.y === goal.target.y) {
                        goal.status = 'completed';
                        goal.progress = 100;
                    }
                    break;
                    
                case 'interact':
                    // 找到目标事件
                    const event = $gameMap.events().find(e => 
                        e.event()?.name === goal.target.name ||
                        e.eventId() === goal.target.eventId
                    );
                    if (event) {
                        // 移动到事件旁边
                        const dist = Math.abs(event.x - $gamePlayer.x) + Math.abs(event.y - $gamePlayer.y);
                        if (dist <= 1) {
                            event.start();
                            goal.status = 'completed';
                        } else {
                            this._targetX = event.x;
                            this._targetY = event.y;
                            this._mode = 'goTo';
                        }
                    }
                    break;
                    
                case 'collect':
                    // 收集物品目标
                    if (this.hasItem(goal.target.itemId)) {
                        goal.status = 'completed';
                    }
                    break;
                    
                case 'avoid':
                    // 躲避目标
                    const targetPos = goal.target;
                    const dx = $gamePlayer.x - targetPos.x;
                    const dy = $gamePlayer.y - targetPos.y;
                    const dist2 = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist2 >= (goal.target.distance || 10)) {
                        goal.status = 'completed';
                    } else {
                        // 逃离方向
                        this._targetX = $gamePlayer.x + Math.sign(dx) * 5;
                        this._targetY = $gamePlayer.y + Math.sign(dy) * 5;
                        this._mode = 'goTo';
                    }
                    break;
            }
            
            return true;
        },
        
        // 更新代理知识
        updateKnowledge: function(type, key, value) {
            const knowledge = this._agent.knowledge;
            
            switch (type) {
                case 'location':
                    knowledge.knownLocations.set(key, {
                        ...value,
                        discoveredAt: Date.now()
                    });
                    break;
                case 'npc':
                    knowledge.knownNPCs.set(key, {
                        ...value,
                        lastSeen: Date.now()
                    });
                    break;
                case 'item':
                    knowledge.knownItems.set(key, value);
                    break;
                case 'belief':
                    knowledge.beliefs.set(key, {
                        value: value,
                        confidence: 0.5,
                        updatedAt: Date.now()
                    });
                    break;
            }
        },
        
        // 查询知识
        queryKnowledge: function(type, key) {
            const knowledge = this._agent.knowledge;
            
            switch (type) {
                case 'location': return knowledge.knownLocations.get(key);
                case 'npc': return knowledge.knownNPCs.get(key);
                case 'item': return knowledge.knownItems.get(key);
                case 'belief': return knowledge.beliefs.get(key);
            }
            return null;
        },
        
        // 显示代理状态
        showAgent: function() {
            const agent = this._agent;
            const currentGoal = this.getCurrentGoal();
            
            console.log(`
╔═══════════════════════════════════════════════╗
║  🤖 代理系统 - ${agent.id}
╠═══════════════════════════════════════════════╣
║  类型: ${agent.type}
║  ─────────────────────────────────────────────
║  📋 目标队列: ${agent.goals.length}个
║  当前目标: ${currentGoal ? `[${currentGoal.type}] 优先级${currentGoal.priority}` : '无'}
║  ─────────────────────────────────────────────
║  🧠 知识库:
║    已知位置: ${agent.knowledge.knownLocations.size}
║    已知NPC: ${agent.knowledge.knownNPCs.size}
║    已知物品: ${agent.knowledge.knownItems.size}
║    信念: ${agent.knowledge.beliefs.size}
╚═══════════════════════════════════════════════╝
            `);
            
            return agent;
        },
        
        // =====================================================================
        // 👁️ 感知系统 (Perception System)
        // =====================================================================
        
        // 视觉感知 - 检测视野内的实体
        perceiveVision: function() {
            if (!this._senses.vision.enabled) return [];
            
            const visible = [];
            const px = $gamePlayer.x;
            const py = $gamePlayer.y;
            const range = this._senses.vision.range;
            const direction = $gamePlayer.direction();
            
            // 扫描范围内的事件
            for (const event of $gameMap.events()) {
                if (!event || !event.event()) continue;
                
                const dx = event.x - px;
                const dy = event.y - py;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= range) {
                    // 检查是否在视野角度内
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                    const facingAngle = this._directionToAngle(direction);
                    let angleDiff = Math.abs(angle - facingAngle);
                    if (angleDiff > 180) angleDiff = 360 - angleDiff;
                    
                    if (angleDiff <= this._senses.vision.fov / 2) {
                        // 检查视线是否被阻挡
                        if (!this._isLineOfSightBlocked(px, py, event.x, event.y)) {
                            visible.push({
                                type: 'event',
                                id: event.eventId(),
                                name: event.event().name,
                                x: event.x,
                                y: event.y,
                                distance: distance
                            });
                            
                            // 更新知识库
                            this.updateKnowledge('npc', event.event().name, {
                                x: event.x, y: event.y, mapId: $gameMap.mapId()
                            });
                        }
                    }
                }
            }
            
            return visible;
        },
        
        // 方向转角度
        _directionToAngle: function(dir) {
            const angles = { 2: 90, 4: 180, 6: 0, 8: -90 };
            return angles[dir] || 0;
        },
        
        // 检查视线是否被阻挡
        _isLineOfSightBlocked: function(x1, y1, x2, y2) {
            const dx = Math.abs(x2 - x1);
            const dy = Math.abs(y2 - y1);
            const sx = x1 < x2 ? 1 : -1;
            const sy = y1 < y2 ? 1 : -1;
            let err = dx - dy;
            
            let x = x1;
            let y = y1;
            
            while (x !== x2 || y !== y2) {
                // 检查当前点是否阻挡视线
                if (!$gameMap.isPassable(x, y, 2) && (x !== x1 || y !== y1)) {
                    return true;
                }
                
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x += sx; }
                if (e2 < dx) { err += dx; y += sy; }
            }
            
            return false;
        },
        
        // 听觉感知
        perceiveHearing: function() {
            if (!this._senses.hearing.enabled) return [];
            
            const heard = [];
            const sounds = this._senses.hearing.sounds;
            const px = $gamePlayer.x;
            const py = $gamePlayer.y;
            const range = this._senses.hearing.range;
            
            // 检查声音源
            for (const sound of sounds) {
                const distance = Math.sqrt(
                    Math.pow(sound.x - px, 2) + Math.pow(sound.y - py, 2)
                );
                
                if (distance <= range * (sound.volume || 1)) {
                    heard.push({
                        ...sound,
                        distance: distance,
                        direction: Math.atan2(sound.y - py, sound.x - px)
                    });
                }
            }
            
            // 清理旧声音
            this._senses.hearing.sounds = sounds.filter(s => 
                Date.now() - s.time < 2000
            );
            
            return heard;
        },
        
        // 添加声音事件
        addSound: function(x, y, type, volume = 1) {
            this._senses.hearing.sounds.push({
                x: x, y: y,
                type: type,
                volume: volume,
                time: Date.now()
            });
        },
        
        // 记忆系统 - 添加到短期记忆
        rememberShortTerm: function(event) {
            const memory = this._senses.memory;
            
            memory.shortTerm.push({
                ...event,
                time: Date.now()
            });
            
            // 检查是否应该转移到长期记忆
            if (event.importance >= 7) {
                this.rememberLongTerm(event);
            }
            
            // 清理过期短期记忆
            memory.shortTerm = memory.shortTerm.filter(m => 
                Date.now() - m.time < memory.shortTermDuration
            );
        },
        
        // 添加到长期记忆
        rememberLongTerm: function(event) {
            this._senses.memory.longTerm.push({
                ...event,
                time: Date.now()
            });
            
            // 限制长期记忆数量
            if (this._senses.memory.longTerm.length > 100) {
                // 移除最不重要的
                this._senses.memory.longTerm.sort((a, b) => 
                    (b.importance || 0) - (a.importance || 0)
                );
                this._senses.memory.longTerm = this._senses.memory.longTerm.slice(0, 80);
            }
        },
        
        // 回忆
        recall: function(query) {
            const memory = this._senses.memory;
            const results = [];
            
            // 搜索短期记忆
            for (const m of memory.shortTerm) {
                if (this._matchesQuery(m, query)) {
                    results.push({ ...m, source: 'shortTerm' });
                }
            }
            
            // 搜索长期记忆
            for (const m of memory.longTerm) {
                if (this._matchesQuery(m, query)) {
                    results.push({ ...m, source: 'longTerm' });
                }
            }
            
            return results;
        },
        
        // 查询匹配
        _matchesQuery: function(memory, query) {
            if (typeof query === 'string') {
                return JSON.stringify(memory).toLowerCase().includes(query.toLowerCase());
            }
            if (typeof query === 'object') {
                for (const key in query) {
                    if (memory[key] !== query[key]) return false;
                }
                return true;
            }
            return false;
        },
        
        // 设置注意力焦点
        setAttentionFocus: function(target) {
            this._senses.attention.focus = target;
            this._senses.attention.alertLevel = Math.min(100, 
                this._senses.attention.alertLevel + 20
            );
        },
        
        // 综合感知更新
        updatePerception: function() {
            // 视觉感知
            const visible = this.perceiveVision();
            
            // 听觉感知
            const heard = this.perceiveHearing();
            
            // 更新注意力
            if (visible.length > 0 || heard.length > 0) {
                this._senses.attention.alertLevel = Math.min(100,
                    this._senses.attention.alertLevel + 5
                );
            } else {
                this._senses.attention.alertLevel = Math.max(0,
                    this._senses.attention.alertLevel - 1
                );
            }
            
            // 更新感知数据
            this._perception.nearbyNPCs = visible;
            
            return { visible, heard, alertLevel: this._senses.attention.alertLevel };
        },
        
        // 显示感知状态
        showPerception: function() {
            const senses = this._senses;
            const visible = this.perceiveVision();
            
            console.log(`
╔═══════════════════════════════════════════════╗
║  👁️ 感知系统                                  ║
╠═══════════════════════════════════════════════╣
║  视觉: 范围${senses.vision.range}格 角度${senses.vision.fov}°
║  听觉: 范围${senses.hearing.range}格
║  ─────────────────────────────────────────────
║  可见实体: ${visible.length}个
${visible.slice(0, 5).map(v => `║    - ${v.name} (${v.x},${v.y}) 距离${v.distance.toFixed(1)}`).join('\n')}
║  ─────────────────────────────────────────────
║  记忆:
║    短期: ${senses.memory.shortTerm.length}条
║    长期: ${senses.memory.longTerm.length}条
║  注意力:
║    焦点: ${senses.attention.focus || '无'}
║    警觉: ${senses.attention.alertLevel}%
╚═══════════════════════════════════════════════╝
            `);
            
            return { senses, visible };
        },
        
        // =====================================================================
        // 🐦 群体行为 (Flocking Behavior)
        // =====================================================================
        
        // 初始化Boid
        createBoid: function(id, x, y, vx = 0, vy = 0) {
            return {
                id: id,
                x: x,
                y: y,
                vx: vx,
                vy: vy,
                ax: 0,
                ay: 0
            };
        },
        
        // 添加Boid到群体
        addBoid: function(boid) {
            this._flocking.boids.push(boid);
            return boid;
        },
        
        // 计算分离力 (Separation)
        _calcSeparation: function(boid, neighbors) {
            let steerX = 0, steerY = 0;
            let count = 0;
            
            const radius = this._flocking.params.separationRadius;
            
            for (const other of neighbors) {
                const dx = boid.x - other.x;
                const dy = boid.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0 && dist < radius) {
                    // 远离邻居，距离越近力越大
                    steerX += dx / dist / dist;
                    steerY += dy / dist / dist;
                    count++;
                }
            }
            
            if (count > 0) {
                steerX /= count;
                steerY /= count;
            }
            
            return { x: steerX, y: steerY };
        },
        
        // 计算对齐力 (Alignment)
        _calcAlignment: function(boid, neighbors) {
            let avgVX = 0, avgVY = 0;
            let count = 0;
            
            const radius = this._flocking.params.alignmentRadius;
            
            for (const other of neighbors) {
                const dx = other.x - boid.x;
                const dy = other.y - boid.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0 && dist < radius) {
                    avgVX += other.vx;
                    avgVY += other.vy;
                    count++;
                }
            }
            
            if (count > 0) {
                avgVX /= count;
                avgVY /= count;
                
                // 转向目标速度
                return {
                    x: avgVX - boid.vx,
                    y: avgVY - boid.vy
                };
            }
            
            return { x: 0, y: 0 };
        },
        
        // 计算聚合力 (Cohesion)
        _calcCohesion: function(boid, neighbors) {
            let centerX = 0, centerY = 0;
            let count = 0;
            
            const radius = this._flocking.params.cohesionRadius;
            
            for (const other of neighbors) {
                const dx = other.x - boid.x;
                const dy = other.y - boid.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0 && dist < radius) {
                    centerX += other.x;
                    centerY += other.y;
                    count++;
                }
            }
            
            if (count > 0) {
                centerX /= count;
                centerY /= count;
                
                // 朝向中心
                return {
                    x: centerX - boid.x,
                    y: centerY - boid.y
                };
            }
            
            return { x: 0, y: 0 };
        },
        
        // 计算避障力
        _calcAvoidance: function(boid) {
            let steerX = 0, steerY = 0;
            const lookAhead = 3;
            
            // 检查前方是否有障碍
            const nextX = boid.x + boid.vx * lookAhead;
            const nextY = boid.y + boid.vy * lookAhead;
            
            if (!$gameMap.isPassable(Math.round(nextX), Math.round(nextY), 2)) {
                // 找到可通行方向
                const dirs = [
                    { x: 1, y: 0 }, { x: -1, y: 0 },
                    { x: 0, y: 1 }, { x: 0, y: -1 }
                ];
                
                for (const dir of dirs) {
                    if ($gameMap.isPassable(
                        Math.round(boid.x + dir.x), 
                        Math.round(boid.y + dir.y), 2
                    )) {
                        steerX = dir.x;
                        steerY = dir.y;
                        break;
                    }
                }
            }
            
            return { x: steerX, y: steerY };
        },
        
        // 更新单个Boid
        updateBoid: function(boid, target = null) {
            const neighbors = this._flocking.boids.filter(b => b.id !== boid.id);
            const weights = this._flocking.weights;
            const params = this._flocking.params;
            
            // 计算各种力
            const separation = this._calcSeparation(boid, neighbors);
            const alignment = this._calcAlignment(boid, neighbors);
            const cohesion = this._calcCohesion(boid, neighbors);
            const avoidance = this._calcAvoidance(boid);
            
            // 计算寻目标力
            let seek = { x: 0, y: 0 };
            if (target) {
                seek = {
                    x: target.x - boid.x,
                    y: target.y - boid.y
                };
                // 归一化
                const dist = Math.sqrt(seek.x * seek.x + seek.y * seek.y);
                if (dist > 0) {
                    seek.x /= dist;
                    seek.y /= dist;
                }
            }
            
            // 组合力
            boid.ax = separation.x * weights.separation +
                      alignment.x * weights.alignment +
                      cohesion.x * weights.cohesion +
                      avoidance.x * weights.avoidance +
                      seek.x * weights.seek;
                      
            boid.ay = separation.y * weights.separation +
                      alignment.y * weights.alignment +
                      cohesion.y * weights.cohesion +
                      avoidance.y * weights.avoidance +
                      seek.y * weights.seek;
            
            // 限制加速度
            const aMag = Math.sqrt(boid.ax * boid.ax + boid.ay * boid.ay);
            if (aMag > params.maxForce) {
                boid.ax = boid.ax / aMag * params.maxForce;
                boid.ay = boid.ay / aMag * params.maxForce;
            }
            
            // 更新速度
            boid.vx += boid.ax;
            boid.vy += boid.ay;
            
            // 限制速度
            const vMag = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy);
            if (vMag > params.maxSpeed) {
                boid.vx = boid.vx / vMag * params.maxSpeed;
                boid.vy = boid.vy / vMag * params.maxSpeed;
            }
            
            // 更新位置
            boid.x += boid.vx;
            boid.y += boid.vy;
            
            return boid;
        },
        
        // 更新所有Boid
        updateFlocking: function(target = null) {
            if (!this._flocking.enabled) return;
            
            for (const boid of this._flocking.boids) {
                this.updateBoid(boid, target);
            }
        },
        
        // 显示群体状态
        showFlocking: function() {
            const f = this._flocking;
            
            console.log(`
╔═══════════════════════════════════════════════╗
║  🐦 群体行为系统                              ║
╠═══════════════════════════════════════════════╣
║  状态: ${f.enabled ? '启用' : '禁用'}
║  成员数: ${f.boids.length}
║  ─────────────────────────────────────────────
║  行为权重:
║    分离: ${f.weights.separation}
║    对齐: ${f.weights.alignment}
║    聚合: ${f.weights.cohesion}
║    避障: ${f.weights.avoidance}
║    寻目标: ${f.weights.seek}
║  ─────────────────────────────────────────────
║  参数:
║    分离半径: ${f.params.separationRadius}
║    对齐半径: ${f.params.alignmentRadius}
║    聚合半径: ${f.params.cohesionRadius}
║    最大速度: ${f.params.maxSpeed}
╚═══════════════════════════════════════════════╝
            `);
            
            return f;
        },
        
        // =====================================================================
        // 🔧 调试系统 (Debug System)
        // =====================================================================
        
        // 开启/关闭调试
        toggleDebug: function() {
            this._debug.enabled = !this._debug.enabled;
            console.log(`🔧 调试模式: ${this._debug.enabled ? '开启' : '关闭'}`);
            return this._debug.enabled;
        },
        
        // 设置日志级别
        setLogLevel: function(level) {
            const valid = ['none', 'error', 'warn', 'info', 'debug'];
            if (valid.includes(level)) {
                this._debug.logLevel = level;
                console.log(`🔧 日志级别: ${level}`);
                return true;
            }
            return false;
        },
        
        // 调试日志
        debugLog: function(level, message, data = null) {
            const levels = { none: 0, error: 1, warn: 2, info: 3, debug: 4 };
            const currentLevel = levels[this._debug.logLevel] || 3;
            const msgLevel = levels[level] || 3;
            
            if (msgLevel <= currentLevel) {
                const prefix = { error: '❌', warn: '⚠️', info: 'ℹ️', debug: '🐛' };
                console.log(`${prefix[level] || ''} [${level.toUpperCase()}] ${message}`, data || '');
                
                // 记录历史
                this._debug.history.push({
                    time: Date.now(),
                    level: level,
                    message: message,
                    data: data
                });
                
                if (this._debug.history.length > 500) {
                    this._debug.history.shift();
                }
            }
        },
        
        // 性能监控
        startPerfMonitor: function(name) {
            this._debug.perfMonitor[`_${name}Start`] = performance.now();
        },
        
        endPerfMonitor: function(name) {
            const start = this._debug.perfMonitor[`_${name}Start`];
            if (start) {
                this._debug.perfMonitor[name] = performance.now() - start;
            }
        },
        
        // 显示性能统计
        showPerfStats: function() {
            const perf = this._debug.perfMonitor;
            
            console.log(`
╔═══════════════════════════════════════════════╗
║  ⚡ 性能统计                                  ║
╠═══════════════════════════════════════════════╣
║  更新耗时: ${(perf.updateTime || 0).toFixed(2)}ms
║  寻路耗时: ${(perf.pathfindTime || 0).toFixed(2)}ms
║  决策耗时: ${(perf.decisionTime || 0).toFixed(2)}ms
║  ─────────────────────────────────────────────
║  调试历史: ${this._debug.history.length}条
╚═══════════════════════════════════════════════╝
            `);
        },
        
        // 导出调试数据
        exportDebugData: function() {
            const data = {
                aiState: {
                    enabled: this._enabled,
                    mode: this._mode,
                    iq: this._iq,
                    evolutionLevel: this._evolutionLevel
                },
                arousal: this._arousalModel,
                agent: {
                    goals: this._agent.goals,
                    knowledgeSize: {
                        locations: this._agent.knowledge.knownLocations.size,
                        npcs: this._agent.knowledge.knownNPCs.size
                    }
                },
                perception: {
                    vision: this._senses.vision,
                    hearing: this._senses.hearing,
                    alertLevel: this._senses.attention.alertLevel
                },
                pathfinding: this._pathfinding.stats,
                fsm: {
                    currentState: this._fsm.currentState,
                    historyLength: this._fsm.history.length
                },
                performance: this._debug.perfMonitor,
                debugHistory: this._debug.history.slice(-50)
            };
            
            console.log('📤 调试数据已导出');
            console.log(JSON.stringify(data, null, 2));
            
            return data;
        },
        
        // AI系统完整状态报告
        showFullStatus: function() {
            console.log('\n' + '='.repeat(60));
            console.log('🤖 AI系统完整状态报告');
            console.log('='.repeat(60));
            
            this.showAIArchitecture();
            this.showArousalModel();
            this.showAgent();
            this.showPerception();
            this.showPathfindingStats();
            this.showPerfStats();
            
            console.log('='.repeat(60) + '\n');
        },
        
        _reconstructPath: function(cameFrom, current) {
            const path = [{ x: current.x, y: current.y }];
            let key = `${current.x},${current.y}`;
            
            while (cameFrom.has(key)) {
                const prev = cameFrom.get(key);
                path.unshift({ x: prev.x, y: prev.y });
                key = `${prev.x},${prev.y}`;
            }
            
            const rawPath = path.slice(1); // 移除起点
            
            // 应用直线化优化
            if (this._straightLineEnabled && rawPath.length > 2) {
                return this._straightenPath(rawPath);
            }
            return rawPath;
        },
        
        // === 🛤️ 路径直线化 - 去除不必要的拐弯 ===
        _straightenPath: function(path) {
            if (path.length <= 2) return path;
            
            const straightened = [path[0]];
            let i = 0;
            
            while (i < path.length - 1) {
                // 尝试找到最远的可直线到达的点
                let furthest = i + 1;
                
                for (let j = path.length - 1; j > i + 1; j--) {
                    if (this._canWalkStraight(path[i], path[j])) {
                        furthest = j;
                        break;
                    }
                }
                
                straightened.push(path[furthest]);
                i = furthest;
            }
            
            // 展开直线为实际移动路径
            return this._expandStraightPath(straightened);
        },
        
        // 检查两点之间是否可以直线行走
        _canWalkStraight: function(from, to) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const steps = Math.max(Math.abs(dx), Math.abs(dy));
            
            if (steps === 0) return true;
            
            const stepX = dx / steps;
            const stepY = dy / steps;
            
            // 检查直线路径上的每个格子
            for (let i = 1; i <= steps; i++) {
                const checkX = Math.round(from.x + stepX * i);
                const checkY = Math.round(from.y + stepY * i);
                const prevX = Math.round(from.x + stepX * (i - 1));
                const prevY = Math.round(from.y + stepY * (i - 1));
                
                if (!this._isPassable(prevX, prevY, checkX, checkY)) {
                    return false;
                }
            }
            return true;
        },
        
        // 将直线路径展开为详细的移动步骤
        _expandStraightPath: function(waypoints) {
            const expanded = [];
            
            for (let i = 0; i < waypoints.length - 1; i++) {
                const from = waypoints[i];
                const to = waypoints[i + 1];
                
                // 优先水平移动，然后垂直移动
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                
                let currentX = from.x;
                let currentY = from.y;
                
                // 水平移动
                while (currentX !== to.x) {
                    currentX += currentX < to.x ? 1 : -1;
                    expanded.push({ x: currentX, y: currentY });
                }
                
                // 垂直移动
                while (currentY !== to.y) {
                    currentY += currentY < to.y ? 1 : -1;
                    expanded.push({ x: currentX, y: currentY });
                }
            }
            
            return expanded;
        },
        
        // === 🛤️ 路线记忆系统 ===
        
        // 生成路线键
        _getRouteKey: function(fromMapId, fromX, fromY, toMapId, toX, toY) {
            return `${fromMapId}_${fromX}_${fromY}_to_${toMapId}_${toX}_${toY}`;
        },
        
        // 记忆路线
        _memorizeRoute: function(fromMapId, fromX, fromY, toMapId, toX, toY, path, success = true) {
            if (!this._routeMemoryEnabled) return;
            
            const key = this._getRouteKey(fromMapId, fromX, fromY, toMapId, toX, toY);
            const existing = this._routeMemory.get(key) || { 
                path: [], 
                successCount: 0, 
                failCount: 0, 
                lastUsed: 0,
                avgTime: 0
            };
            
            if (success) {
                existing.successCount++;
                existing.path = path;
                existing.lastUsed = Date.now();
                
                // 记录成功经验
                this._gainExperience(2, '路线记忆成功');
            } else {
                existing.failCount++;
            }
            
            this._routeMemory.set(key, existing);
            console.log(`🛤️ 路线记忆更新: ${key} (成功${existing.successCount}/失败${existing.failCount})`);
            
            // 保存到持久存储
            this._saveRouteMemory();
        },
        
        // 回忆路线
        _recallRoute: function(fromMapId, fromX, fromY, toMapId, toX, toY) {
            if (!this._routeMemoryEnabled) return null;
            
            const key = this._getRouteKey(fromMapId, fromX, fromY, toMapId, toX, toY);
            const memory = this._routeMemory.get(key);
            
            if (memory && memory.successCount > 0) {
                // 检查路线可靠性
                const reliability = memory.successCount / (memory.successCount + memory.failCount);
                
                if (reliability >= 0.6 && memory.path.length > 0) {
                    console.log(`🧠 回忆路线: ${key} (可靠性${(reliability * 100).toFixed(0)}%)`);
                    this._currentRoute = key;
                    return memory.path;
                }
            }
            
            return null;
        },
        
        // 开始录制路线
        startRouteRecording: function(targetMapId, targetX, targetY) {
            this._routeRecording = true;
            this._recordedPath = [];
            this._lastRecordPos = { 
                mapId: $gameMap.mapId(), 
                x: $gamePlayer.x, 
                y: $gamePlayer.y 
            };
            this._routeTarget = { mapId: targetMapId, x: targetX, y: targetY };
            console.log('🎬 开始录制路线...');
            this._showNotification('🎬 开始录制路线');
        },
        
        // 停止录制路线
        stopRouteRecording: function(success = true) {
            if (!this._routeRecording) return;
            
            this._routeRecording = false;
            
            if (success && this._recordedPath.length > 0) {
                const start = this._lastRecordPos;
                const target = this._routeTarget;
                this._memorizeRoute(
                    start.mapId, start.x, start.y,
                    target.mapId, target.x, target.y,
                    this._recordedPath,
                    true
                );
            }
            
            this._recordedPath = [];
            console.log('🎬 路线录制完成');
            this._showNotification('🎬 路线录制完成');
        },
        
        // 更新路线录制（在移动时调用）
        _updateRouteRecording: function() {
            if (!this._routeRecording) return;
            
            const mapId = $gameMap.mapId();
            const x = $gamePlayer.x;
            const y = $gamePlayer.y;
            
            // 记录移动
            if (this._lastRecordPos.x !== x || this._lastRecordPos.y !== y || this._lastRecordPos.mapId !== mapId) {
                this._recordedPath.push({ mapId, x, y });
                this._lastRecordPos = { mapId, x, y };
            }
        },
        
        // 保存路线记忆
        _saveRouteMemory: function() {
            try {
                const data = Array.from(this._routeMemory.entries());
                localStorage.setItem('AIBOT_ROUTE_MEMORY', JSON.stringify(data));
            } catch (e) {
                console.error('无法保存路线记忆', e);
            }
        },
        
        // 加载路线记忆
        _loadRouteMemory: function() {
            try {
                const saved = localStorage.getItem('AIBOT_ROUTE_MEMORY');
                if (saved) {
                    this._routeMemory = new Map(JSON.parse(saved));
                    console.log(`🛤️ 已加载${this._routeMemory.size}条路线记忆`);
                }
            } catch (e) {
                console.error('无法加载路线记忆', e);
            }
        },
        
        // 显示路线记忆
        showRouteMemory: function() {
            console.log('🛤️ === 路线记忆库 ===');
            for (const [key, data] of this._routeMemory) {
                const reliability = data.successCount / (data.successCount + data.failCount) * 100;
                console.log(`  ${key}: ${data.path.length}步, 可靠性${reliability.toFixed(0)}%, 成功${data.successCount}次`);
            }
            return { count: this._routeMemory.size, routes: Object.fromEntries(this._routeMemory) };
        },
        
        _isPassable: function(fromX, fromY, toX, toY) {
            if (!$gameMap.isValid(toX, toY)) return false;
            
            // 检查地图通行性
            const d = this._getDirection(fromX, fromY, toX, toY);
            if (!$gameMap.isPassable(fromX, fromY, d)) return false;
            if (!$gameMap.isPassable(toX, toY, 10 - d)) return false;
            
            // 检查是否有事件阻挡
            const events = $gameMap.eventsXy(toX, toY);
            for (const event of events) {
                if (event.isNormalPriority()) return false;
            }
            
            // 检查角色碰撞
            if ($gamePlayer.x === toX && $gamePlayer.y === toY) return false;
            
            return true;
        },
        
        _getDirection: function(fromX, fromY, toX, toY) {
            if (toY < fromY) return 8; // 上
            if (toY > fromY) return 2; // 下
            if (toX < fromX) return 4; // 左
            if (toX > fromX) return 6; // 右
            return 0;
        },
        
        // === 探索AI (优化版) ===
        _getExploreTarget: function() {
            const px = $gamePlayer.x;
            const py = $gamePlayer.y;
            const mapWidth = $gameMap.width();
            const mapHeight = $gameMap.height();
            const mapId = $gameMap.mapId();
            
            // 首先检查附近是否有可交互事件
            const nearbyEvent = this._findNearbyEvent();
            if (nearbyEvent && this._autoInteract) {
                return { x: nearbyEvent.x, y: nearbyEvent.y, event: nearbyEvent, reason: '📍 交互事件' };
            }
            
            // 扫描整个地图的可行走区域
            if (!this._mapWalkableCache || this._mapWalkableCache.mapId !== mapId) {
                this._scanMapWalkable();
            }
            
            // 收集所有未探索的可行走点
            const unexplored = [];
            const walkable = this._mapWalkableCache.tiles || [];
            
            for (const tile of walkable) {
                const tileKey = `${mapId}_${tile.x}_${tile.y}`;
                if (!this._exploredTiles.has(tileKey)) {
                    const dist = Math.abs(tile.x - px) + Math.abs(tile.y - py);
                    unexplored.push({ ...tile, dist });
                }
            }
            
            // 如果有未探索的区域
            if (unexplored.length > 0) {
                // 计算探索覆盖率
                const coverage = ((walkable.length - unexplored.length) / walkable.length * 100).toFixed(1);
                
                // 策略1: 优先探索有事件的位置
                const withEvents = unexplored.filter(t => t.hasEvent);
                if (withEvents.length > 0) {
                    withEvents.sort((a, b) => a.dist - b.dist);
                    const target = withEvents[0];
                    return { x: target.x, y: target.y, reason: `🎯 事件点 (覆盖${coverage}%)` };
                }
                
                // 策略2: 优先探索边缘区域（可能是出口）
                const edges = unexplored.filter(t => t.isEdge);
                if (edges.length > 0) {
                    edges.sort((a, b) => a.dist - b.dist);
                    const target = edges[0];
                    return { x: target.x, y: target.y, reason: `🚪 边缘区域 (覆盖${coverage}%)` };
                }
                
                // 策略3: 选择距离适中的未探索点（不要太近也不要太远）
                unexplored.sort((a, b) => {
                    // 优先选择距离5-15格的点
                    const aScore = Math.abs(a.dist - 10);
                    const bScore = Math.abs(b.dist - 10);
                    return aScore - bScore;
                });
                
                const target = unexplored[0];
                return { x: target.x, y: target.y, reason: `🔍 探索新区域 (覆盖${coverage}%)` };
            }
            
            // 所有区域都探索过了，选择一个远处重新探索
            console.log('🗺️ 地图已完全探索！重新标记部分区域');
            this._resetPartialExploration();
            
            // 随机选择一个可行走点
            if (walkable.length > 0) {
                const randomTile = walkable[Math.floor(Math.random() * walkable.length)];
                return { x: randomTile.x, y: randomTile.y, reason: '🔄 重新探索' };
            }
            
            return null;
        },
        
        // 扫描地图可行走区域
        _scanMapWalkable: function() {
            const mapId = $gameMap.mapId();
            const mapWidth = $gameMap.width();
            const mapHeight = $gameMap.height();
            const tiles = [];
            
            console.log(`🗺️ 扫描地图 ${mapId} (${mapWidth}x${mapHeight})`);
            
            for (let x = 0; x < mapWidth; x++) {
                for (let y = 0; y < mapHeight; y++) {
                    // 检查是否可通行（任意方向）
                    const passable = $gameMap.isPassable(x, y, 2) || 
                                    $gameMap.isPassable(x, y, 4) || 
                                    $gameMap.isPassable(x, y, 6) || 
                                    $gameMap.isPassable(x, y, 8);
                    
                    if (passable) {
                        const events = $gameMap.eventsXy(x, y);
                        const hasEvent = events.some(e => e && e.page() && !e._erased);
                        const isEdge = x <= 1 || y <= 1 || x >= mapWidth - 2 || y >= mapHeight - 2;
                        
                        tiles.push({ x, y, hasEvent, isEdge });
                    }
                }
            }
            
            this._mapWalkableCache = {
                mapId: mapId,
                tiles: tiles,
                width: mapWidth,
                height: mapHeight
            };
            
            console.log(`🗺️ 发现 ${tiles.length} 个可行走格子`);
            return tiles;
        },
        
        // 重置部分已探索区域（用于完全探索后重新开始）
        _resetPartialExploration: function() {
            const mapId = $gameMap.mapId();
            const keysToRemove = [];
            
            for (const key of this._exploredTiles) {
                if (key.startsWith(`${mapId}_`)) {
                    // 随机保留30%
                    if (Math.random() > 0.3) {
                        keysToRemove.push(key);
                    }
                }
            }
            
            for (const key of keysToRemove) {
                this._exploredTiles.delete(key);
            }
            
            console.log(`🔄 重置了 ${keysToRemove.length} 个已探索点`);
        },
        
        _canReach: function(x, y) {
            // 检查目标是否可能到达
            if (!$gameMap.isValid(x, y)) return false;
            return $gameMap.isPassable(x, y, 2) || 
                   $gameMap.isPassable(x, y, 4) || 
                   $gameMap.isPassable(x, y, 6) || 
                   $gameMap.isPassable(x, y, 8);
        },
        
        _findNearbyEvent: function() {
            const px = $gamePlayer.x;
            const py = $gamePlayer.y;
            const events = $gameMap.events();
            const mapId = $gameMap.mapId();
            
            let nearest = null;
            let minDist = Infinity;
            
            for (const event of events) {
                if (!event || !event.page()) continue;
                if (event._erased) continue;
                
                const eventKey = `${mapId}_${event.eventId()}`;
                
                // 跳过黑名单事件
                if (this._blacklistedEvents.has(eventKey)) continue;
                
                // 跳过已达到交互上限的事件
                const interactCount = this._eventInteractCount.get(eventKey) || 0;
                if (interactCount >= this._maxInteractPerEvent) continue;
                
                // 跳过冷却中的事件
                const lastInteract = this._interactedEvents.get(eventKey) || 0;
                if (Date.now() - lastInteract < this._interactCooldown) continue;
                
                // 检查是否是传送事件
                if (this._skipTransferEvents && this._isTransferEvent(event)) {
                    this._transferEvents.add(eventKey);
                    continue;
                }
                
                const dist = Math.abs(event.x - px) + Math.abs(event.y - py);
                if (dist < minDist && dist <= 10 && dist > 0) {
                    // 检查事件是否有内容
                    const list = event.list();
                    if (list && list.length > 1) {
                        minDist = dist;
                        nearest = event;
                    }
                }
            }
            
            return nearest;
        },
        
        // 检测事件是否是传送类型
        _isTransferEvent: function(event) {
            if (!event || !event.page()) return false;
            const list = event.list();
            if (!list) return false;
            
            for (const cmd of list) {
                // code 201 = 场所移动（传送）
                // code 102 = 显示选项（选择框）
                if (cmd.code === 201) {
                    return true;
                }
                // 检测是否包含"回家"、"离开"等关键词的选项
                if (cmd.code === 102 && cmd.parameters && cmd.parameters[0]) {
                    const choices = cmd.parameters[0];
                    const transferKeywords = ['回家', '离开', '出去', '进入', '传送', '返回', '去'];
                    for (const choice of choices) {
                        if (typeof choice === 'string') {
                            for (const keyword of transferKeywords) {
                                if (choice.includes(keyword)) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
            return false;
        },
        
        // 记录事件交互
        _recordInteraction: function(event) {
            if (!event) return;
            const mapId = $gameMap.mapId();
            const eventKey = `${mapId}_${event.eventId()}`;
            const eventName = event.event().name || '未知';
            
            this._interactedEvents.set(eventKey, Date.now());
            
            const count = (this._eventInteractCount.get(eventKey) || 0) + 1;
            this._eventInteractCount.set(eventKey, count);
            
            // 🧬 获取交互经验
            this._gainExperience(5, '交互NPC');
            
            // 🎭 角色代入：更新关系和情感
            if (this._immersionEnabled && eventName && eventName !== '未知') {
                // 更新NPC关系
                this.updateRelationship(eventName, 'talk', 1);
                
                // 首次交互触发惊讶/期待
                if (count === 1) {
                    this._updateEmotions('new_info', 8);
                    this.addMemory('encounter', `第一次遇见${eventName}`, 6);
                }
                
                // 生成交互内心独白
                if (Math.random() < 0.4) {
                    this._generateInteractionThought(eventName, count);
                }
            }
            
            console.log(`🤖 交互事件: ${eventName} (${count}/${this._maxInteractPerEvent})`);
        },
        
        // 🎭 生成交互时的内心独白
        _generateInteractionThought: function(npcName, interactCount) {
            const rel = this._relationships.get(npcName);
            const thoughts = [];
            
            if (!rel || interactCount === 1) {
                // 首次见面
                thoughts.push(`这是${npcName}吗...`);
                thoughts.push('是个新面孔呢');
                thoughts.push('看看他有什么说的');
            } else if (rel.affection >= 70) {
                // 好感度高
                thoughts.push(`又遇到${npcName}了，真好~`);
                thoughts.push('是熟悉的人呢');
                thoughts.push('见到你真开心');
            } else if (rel.affection <= 30) {
                // 好感度低
                thoughts.push('又是这个人...');
                thoughts.push('希望不要有麻烦');
                thoughts.push('还是小心点好');
            } else {
                // 一般关系
                thoughts.push(`嗯，是${npcName}`);
                thoughts.push('看看有什么事');
                thoughts.push('...');
            }
            
            if (thoughts.length > 0) {
                const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
                this._showInnerThought(thought);
            }
        },
        
        // 添加事件到黑名单
        blacklistEvent: function(eventId) {
            const mapId = $gameMap.mapId();
            const eventKey = `${mapId}_${eventId}`;
            this._blacklistedEvents.add(eventKey);
            console.log(`🚫 已屏蔽事件: ${eventKey}`);
        },
        
        // 清除当前地图的交互记录
        clearMapInteractions: function() {
            const mapId = $gameMap.mapId();
            for (const key of this._interactedEvents.keys()) {
                if (key.startsWith(`${mapId}_`)) {
                    this._interactedEvents.delete(key);
                }
            }
            for (const key of this._eventInteractCount.keys()) {
                if (key.startsWith(`${mapId}_`)) {
                    this._eventInteractCount.delete(key);
                }
            }
            console.log(`🔄 已清除地图${mapId}的交互记录`);
        },
        
        // 重置所有交互记录
        resetInteractions: function() {
            this._interactedEvents.clear();
            this._eventInteractCount.clear();
            this._blacklistedEvents.clear();
            this._transferEvents.clear();
            console.log('🔄 已重置所有交互记录');
        },
        
        // ===================================================================
        // 游戏内NPC逻辑
        // ===================================================================
        
        // 获取游戏变量
        getVar: function(id) {
            return $gameVariables ? $gameVariables.value(id) : 0;
        },
        
        // 获取游戏开关
        getSw: function(id) {
            return $gameSwitches ? $gameSwitches.value(id) : false;
        },
        
        // 获取当前主线进度
        getMainlineProgress: function() {
            return {
                mainline: this.getVar(this.VAR.MAINLINE),
                mainline2: this.getVar(this.VAR.MAINLINE2),
                san: this.getVar(this.VAR.SAN),
                zinnia: this.getVar(this.VAR.ZINNIA)
            };
        },
        
        // 显示当前游戏状态
        showGameStatus: function() {
            const progress = this.getMainlineProgress();
            console.log(`
╔═══════════════════════════════════════════════╗
║            🎮 游戏状态                        ║
╠═══════════════════════════════════════════════╣
║ 主线进度: ${progress.mainline}                      
║ 主线2进度: ${progress.mainline2}                    
║ SAN值: ${progress.san}                        
║ Zinnia值: ${progress.zinnia}                  
║                                               
║ 二周目: ${this.getSw(this.SW.SECOND_ROUND) ? '✓' : '✗'}
║ 三周目: ${this.getSw(this.SW.THIRD_ROUND) ? '✓' : '✗'}
║ Debug: ${this.getSw(this.SW.DEBUG) ? '✓' : '✗'}
╚═══════════════════════════════════════════════╝
            `);
            return progress;
        },
        
        // 分析当前任务目标（基于游戏实际流程）
        analyzeQuest: function() {
            const progress = this.getMainlineProgress();
            const mapId = $gameMap ? $gameMap.mapId() : 0;
            
            let quest = {
                description: '',
                targets: [],
                priority: 'normal',
                requiredItems: [],
                subTasks: []
            };
            
            // === 根据游戏实际任务流程判断 ===
            // 主线任务：完成Zinnia交友任务 -> 拆除榨汁机盖子 -> 支开店员 -> 处理尸体
            
            // 检查任务进度
            const hasScrew = this.hasItem(this.ITEM.SCREWDRIVER);
            const hasBodyBag = this.hasItem(this.ITEM.BODY_BAG);
            const hasBloodRemover = this.hasItem(this.ITEM.BLOOD_REMOVER);
            const juicerDone = this.getSw(this.QUEST_SW.JUICER_LID_REMOVED);
            const clerkDistracted = this.getSw(this.QUEST_SW.CLERK_DISTRACTED);
            const corpseFound = this.getSw(this.QUEST_SW.CORPSE_FOUND);
            const corpseWrapped = this.getSw(this.QUEST_SW.CORPSE_WRAPPED);
            
            // 任务1: 获取必要物品
            if (!hasScrew) {
                quest.subTasks.push('购买螺丝刀');
                quest.requiredItems.push({ id: this.ITEM.SCREWDRIVER, name: '螺丝刀', shop: this.MAP.TOY_STORE });
            }
            if (!hasBodyBag) {
                quest.subTasks.push('购买裹尸袋');
                quest.requiredItems.push({ id: this.ITEM.BODY_BAG, name: '裹尸袋', shop: this.MAP.TOY_STORE });
            }
            if (!hasBloodRemover) {
                quest.subTasks.push('购买除血剂');
                quest.requiredItems.push({ id: this.ITEM.BLOOD_REMOVER, name: '除血剂', shop: this.MAP.TOY_STORE });
            }
            
            // 根据当前状态设定主要目标
            if (quest.requiredItems.length > 0) {
                // 需要购买物品
                quest.description = `🛒 购买物品: ${quest.subTasks.join(', ')}`;
                quest.targets = [{ map: this.MAP.TOY_STORE, name: '玩具店购物' }];
                quest.priority = 'high';
            } else if (!juicerDone && hasScrew) {
                // 任务2: 拆除榨汁机盖子
                quest.description = '🔧 拆除榨汁机盖子';
                quest.targets = [{ map: this.MAP.DRINK_SHOP, name: '饮料店-榨汁机' }];
                quest.priority = 'high';
            } else if (!clerkDistracted) {
                // 任务3: 支开店员
                quest.description = '💬 支开饮料店店员';
                quest.targets = [{ map: this.MAP.DRINK_SHOP, name: '饮料店-与店员对话' }];
            } else if (corpseFound && !corpseWrapped && hasBodyBag) {
                // 任务4: 处理尸体
                quest.description = '👜 使用裹尸袋处理尸体';
                quest.targets = [{ map: this.MAP.DRINK_SHOP, name: '饮料店-处理尸体' }];
                quest.priority = 'high';
            } else if (progress.mainline < 5) {
                // 初期探索
                quest.description = '🔍 探索街道，寻找线索';
                quest.targets = [{ map: this.MAP.STREET, name: '街道探索' }];
            } else {
                // 继续探索其他地点
                quest.description = '🗺️ 继续探索推进剧情';
                if (mapId === this.MAP.HOME) {
                    quest.targets = [{ map: this.MAP.STREET, name: '出门探索' }];
                }
            }
            
            // SAN值检查（优先级最高）
            if (progress.san < 30) {
                quest.description = '⚠️ SAN值过低，回家休息';
                quest.priority = 'urgent';
                quest.targets = [{ map: this.MAP.HOME, name: '回家休息' }];
            }
            
            this._currentQuest = quest;
            
            // 输出任务状态
            if (quest.description) {
                console.log(`📋 任务: ${quest.description}`);
            }
            
            return quest;
        },
        
        // 获取推荐的下一个目标地图
        getRecommendedMap: function() {
            const mapId = $gameMap ? $gameMap.mapId() : 0;
            const progress = this.getMainlineProgress();
            
            // 根据当前状态推荐地图
            if (mapId === this.MAP.HOME) {
                // 在家里，应该出门
                return { map: this.MAP.STREET, reason: '出门探索' };
            }
            
            // 主线相关
            if (progress.mainline < 5) {
                return { map: this.MAP.STREET, reason: '主线任务' };
            }
            
            // SAN值低时回家
            if (progress.san < 30) {
                return { map: this.MAP.HOME, reason: 'SAN值过低，需要休息' };
            }
            
            // 默认探索街道
            return { map: this.MAP.STREET, reason: '继续探索' };
        },
        
        // 寻找NPC（根据名称关键词）
        findNPC: function(nameKeyword) {
            if (!$gameMap) return null;
            
            const events = $gameMap.events();
            for (const event of events) {
                if (!event || !event.event()) continue;
                const name = event.event().name.toLowerCase();
                if (name.includes(nameKeyword.toLowerCase())) {
                    return {
                        event: event,
                        x: event.x,
                        y: event.y,
                        name: event.event().name
                    };
                }
            }
            return null;
        },
        
        // 搜索任务关键事件
        findQuestEvent: function() {
            if (!$gameMap) return null;
            
            const quest = this._currentQuest || this.analyzeQuest();
            const mapId = $gameMap.mapId();
            const events = $gameMap.events();
            
            // 根据当前任务寻找关键事件
            const keywords = [];
            
            // 如果需要拆榨汁机且在饮料店
            if (!this.getSw(this.QUEST_SW.JUICER_LID_REMOVED) && this.hasItem(this.ITEM.SCREWDRIVER)) {
                keywords.push('榨汁');
            }
            // 如果需要处理尸体
            if (this.getSw(this.QUEST_SW.CORPSE_FOUND) && !this.getSw(this.QUEST_SW.CORPSE_WRAPPED)) {
                keywords.push('尸体');
            }
            // 购物相关
            if (quest.requiredItems && quest.requiredItems.length > 0) {
                keywords.push('商店', '货架', '店员');
            }
            // Zinnia任务
            keywords.push('zinnia', '店员');
            
            for (const event of events) {
                if (!event || !event.page() || event._erased) continue;
                
                const eventName = (event.event().name || '').toLowerCase();
                const eventKey = `${mapId}_${event.eventId()}`;
                
                // 检查是否可交互
                if (this._blacklistedEvents.has(eventKey)) continue;
                const interactCount = this._eventInteractCount.get(eventKey) || 0;
                if (interactCount >= this._maxInteractPerEvent) continue;
                
                // 检查名称匹配
                for (const keyword of keywords) {
                    if (eventName.includes(keyword.toLowerCase())) {
                        return {
                            event: event,
                            x: event.x,
                            y: event.y,
                            name: event.event().name,
                            keyword: keyword
                        };
                    }
                }
                
                // 检查事件内容是否包含关键词
                const list = event.list();
                if (list) {
                    for (const cmd of list) {
                        if (cmd.code === 401 && cmd.parameters && cmd.parameters[0]) {
                            const text = cmd.parameters[0].toLowerCase();
                            for (const keyword of keywords) {
                                if (text.includes(keyword.toLowerCase())) {
                                    return {
                                        event: event,
                                        x: event.x,
                                        y: event.y,
                                        name: event.event().name || `任务事件`,
                                        keyword: keyword
                                    };
                                }
                            }
                        }
                    }
                }
            }
            
            return null;
        },
        
        // 寻找特定类型的事件
        findEventByContent: function(keywords) {
            if (!$gameMap) return [];
            
            const found = [];
            const events = $gameMap.events();
            
            for (const event of events) {
                if (!event || !event.page()) continue;
                const list = event.list();
                if (!list) continue;
                
                for (const cmd of list) {
                    // 检查对话内容 (code 401)
                    if (cmd.code === 401 && cmd.parameters && cmd.parameters[0]) {
                        const text = cmd.parameters[0];
                        for (const keyword of keywords) {
                            if (text.includes(keyword)) {
                                found.push({
                                    event: event,
                                    x: event.x,
                                    y: event.y,
                                    name: event.event().name,
                                    keyword: keyword,
                                    text: text
                                });
                                break;
                            }
                        }
                    }
                }
            }
            
            return found;
        },
        
        // 获取地图上所有重要事件
        scanMapEvents: function() {
            if (!$gameMap) return [];
            
            const important = [];
            const events = $gameMap.events();
            const mapId = $gameMap.mapId();
            const px = $gamePlayer.x;
            const py = $gamePlayer.y;
            
            for (const event of events) {
                if (!event || !event.page() || event._erased) continue;
                
                const eventKey = `${mapId}_${event.eventId()}`;
                const list = event.list();
                if (!list || list.length <= 1) continue;
                
                // 跳过黑名单
                if (this._blacklistedEvents.has(eventKey)) continue;
                
                // 检查交互次数和冷却
                const interactCount = this._eventInteractCount.get(eventKey) || 0;
                if (interactCount >= this._maxInteractPerEvent) continue;
                
                const lastInteract = this._interactedEvents.get(eventKey) || 0;
                if (Date.now() - lastInteract < this._interactCooldown) continue;
                
                // 分析事件类型
                let eventType = 'normal';
                let priority = 1;
                let hasContent = false;
                let isTransfer = false;
                let eventName = event.event().name || '';
                
                for (const cmd of list) {
                    // 传送事件
                    if (cmd.code === 201) {
                        isTransfer = true;
                        // 如果不跳过传送，也加入列表
                        if (!this._skipTransferEvents) {
                            eventType = 'transfer';
                            priority = 0;
                        }
                    }
                    // 对话内容
                    if (cmd.code === 101 || cmd.code === 401) hasContent = true;
                    // 物品操作 - 高优先级
                    if (cmd.code === 126) { eventType = 'item'; priority = 5; }
                    // 金钱操作
                    if (cmd.code === 125) { eventType = 'gold'; priority = 4; }
                    // 变量操作（可能是任务进度）
                    if (cmd.code === 122) { eventType = 'quest'; priority = 4; }
                    // 开关操作
                    if (cmd.code === 121) { eventType = 'switch'; priority = 3; }
                    // 选择框（可能是重要对话）
                    if (cmd.code === 102) { eventType = 'choice'; priority = 3; }
                    // 商店
                    if (cmd.code === 302) { eventType = 'shop'; priority = 2; }
                }
                
                // 跳过纯传送事件（如果设置了跳过）
                if (isTransfer && this._skipTransferEvents) continue;
                
                // 有内容的事件才加入
                if (hasContent || eventType !== 'normal') {
                    // NPC名字加分
                    const npcPriority = this.getNPCPriority(eventName);
                    priority += npcPriority;
                    
                    // 距离近的加分
                    const dist = Math.abs(event.x - px) + Math.abs(event.y - py);
                    if (dist <= 5) priority += 2;
                    
                    important.push({
                        event: event,
                        x: event.x,
                        y: event.y,
                        name: eventName || `事件${event.eventId()}`,
                        type: eventType,
                        priority: priority,
                        distance: dist
                    });
                }
            }
            
            // 按优先级和距离排序
            important.sort((a, b) => {
                if (b.priority !== a.priority) return b.priority - a.priority;
                return a.distance - b.distance;
            });
            
            if (important.length > 0) {
                console.log(`🔍 地图${mapId}发现 ${important.length} 个可交互事件`);
            }
            return important;
        },
        
        // 智能选择下一个目标
        getSmartTarget: function() {
            const now = Date.now();
            const mapId = $gameMap.mapId();
            
            // 0. 先分析任务
            const quest = this._gameLogic ? this.analyzeQuest() : {};
            
            // 1. 搜索当前地图的任务关键事件
            if (this._gameLogic) {
                const questEvent = this.findQuestEvent();
                if (questEvent) {
                    this._idleTime = 0;
                    return { 
                        x: questEvent.x, 
                        y: questEvent.y, 
                        reason: `🎯 任务目标: ${questEvent.name} (${questEvent.keyword})`
                    };
                }
            }
            
            // 2. 检查任务目标地图
            if (this._gameLogic && quest.targets && quest.targets.length > 0) {
                const target = quest.targets[0];
                
                // 目标在当前地图且有坐标
                if (target.map === mapId && target.x && target.y) {
                    this._idleTime = 0;
                    return { x: target.x, y: target.y, reason: `📋 ${quest.description}` };
                }
                
                // 目标在其他地图，寻找传送点
                if (target.map && target.map !== mapId) {
                    const transfer = this._findTransferToMap(target.map);
                    if (transfer) {
                        this._idleTime = 0;
                        return { x: transfer.x, y: transfer.y, reason: `🚪 前往${target.name || '目标地图'}` };
                    }
                }
            }
            
            // 3. 扫描当前地图的重要事件
            const important = this.scanMapEvents();
            if (important.length > 0) {
                const px = $gamePlayer.x;
                const py = $gamePlayer.y;
                
                // 按优先级和距离综合排序
                important.sort((a, b) => {
                    const scoreA = a.priority * 10 - a.distance;
                    const scoreB = b.priority * 10 - b.distance;
                    return scoreB - scoreA;
                });
                
                const target = important[0];
                this._idleTime = 0;
                return { x: target.x, y: target.y, reason: `💬 ${target.name} (${target.type})` };
            }
            
            // 4. 周目推进系统
            if (this._autoProgress && this._gameLogic) {
                if (!this._lastIdleCheck) this._lastIdleCheck = now;
                this._idleTime += (now - this._lastIdleCheck);
                this._lastIdleCheck = now;
                
                const mapTime = (this._mapExploreTime.get(mapId) || 0) + (now - (this._lastMapTimeCheck || now));
                this._mapExploreTime.set(mapId, mapTime);
                this._lastMapTimeCheck = now;
                this._visitedMaps.add(mapId);
                
                // 空闲时间超过阈值，尝试换地图
                if (this._idleTime > this._idleThreshold || mapTime > this._mapExploreThreshold) {
                    const progressTarget = this._getProgressTarget();
                    if (progressTarget) {
                        this._idleTime = 0;
                        this._mapExploreTime.set(mapId, 0);
                        return progressTarget;
                    }
                }
            }
            
            // 5. 普通探索
            return this._getExploreTarget();
        },
        
        // === 周目推进系统 ===
        
        // 获取周目推进目标
        _getProgressTarget: function() {
            const mainline = this.getVar(this.VAR.MAINLINE);
            const mainline2 = this.getVar(this.VAR.MAINLINE2);
            const san = this.getVar(this.VAR.SAN);
            const zinnia = this.getVar(this.VAR.ZINNIA);
            const isSecondRound = this.getSw(this.SW.SECOND_ROUND);
            const isThirdRound = this.getSw(this.SW.THIRD_ROUND);
            
            console.log(`🎮 周目分析: 主线=${mainline}, 主线2=${mainline2}, SAN=${san}, Zinnia=${zinnia}`);
            console.log(`   二周目=${isSecondRound}, 三周目=${isThirdRound}`);
            
            // SAN值过低，优先回家休息
            if (san < 30) {
                if ($gameMap.mapId() !== this.MAP.HOME) {
                    const homeTransfer = this._findTransferToMap(this.MAP.HOME);
                    if (homeTransfer) {
                        return { ...homeTransfer, reason: '⚠️ SAN值低，回家休息' };
                    }
                }
                // 已经在家里，找床睡觉
                return this._findSleepEvent();
            }
            
            // 根据主线进度推进
            return this._getMainlineTarget(mainline, mainline2, isSecondRound, isThirdRound);
        },
        
        // 根据主线进度获取目标
        _getMainlineTarget: function(mainline, mainline2, isSecondRound, isThirdRound) {
            const currentMap = $gameMap.mapId();
            
            // 周目任务路线 (根据游戏逻辑)
            // 主要地点: 街道(3) -> 玩具店(5) -> 饮料店(7) -> 实验室(16) -> 图书馆(18)
            const progressRoute = [
                { map: this.MAP.STREET, name: '街道', priority: 1 },
                { map: this.MAP.TOY_STORE, name: '玩具店', priority: 2 },
                { map: this.MAP.DRINK_SHOP, name: '饮料店', priority: 3 },
                { map: this.MAP.STORAGE, name: '仓库', priority: 4 },
                { map: this.MAP.CAKE_SHOP, name: '蛋糕店', priority: 5 },
                { map: this.MAP.LAB, name: '实验室', priority: 6 },
                { map: this.MAP.LIBRARY, name: '图书馆', priority: 7 },
                { map: this.MAP.PARK, name: '公园', priority: 8 },
                { map: this.MAP.STATION, name: '车站', priority: 9 }
            ];
            
            // 找到未充分探索的地图
            for (const route of progressRoute) {
                const exploreTime = this._mapExploreTime.get(route.map) || 0;
                
                // 如果这个地图探索时间少于30秒，优先去那里
                if (exploreTime < 30000) {
                    if (currentMap === route.map) {
                        // 已经在目标地图，继续探索
                        console.log(`📍 继续探索${route.name}`);
                        return null; // 返回null让普通探索接管
                    } else {
                        // 尝试前往目标地图
                        const transfer = this._findTransferToMap(route.map);
                        if (transfer) {
                            console.log(`🚀 周目推进: 前往${route.name}`);
                            return { ...transfer, reason: `🎯 周目推进: 前往${route.name}` };
                        }
                    }
                }
            }
            
            // 所有地图都探索过了，随机选一个重新探索
            const randomRoute = progressRoute[Math.floor(Math.random() * progressRoute.length)];
            if (currentMap !== randomRoute.map) {
                const transfer = this._findTransferToMap(randomRoute.map);
                if (transfer) {
                    // 重置该地图的探索时间
                    this._mapExploreTime.set(randomRoute.map, 0);
                    return { ...transfer, reason: `🔄 重新探索${randomRoute.name}` };
                }
            }
            
            return null;
        },
        
        // 寻找前往指定地图的传送点
        _findTransferToMap: function(targetMapId) {
            if (!$gameMap) return null;
            const events = $gameMap.events();
            
            for (const event of events) {
                if (!event || !event.page()) continue;
                const list = event.list();
                if (!list) continue;
                
                for (const cmd of list) {
                    // code 201 = 场所移动
                    if (cmd.code === 201) {
                        const params = cmd.parameters;
                        // params[0]: 指定方式 (0=直接指定, 1=变量指定)
                        // params[1]: 地图ID
                        if (params[0] === 0 && params[1] === targetMapId) {
                            return { 
                                x: event.x, 
                                y: event.y, 
                                eventId: event.eventId(),
                                targetMap: targetMapId 
                            };
                        }
                    }
                }
            }
            return null;
        },
        
        // 寻找新地图的传送点 (任意未充分探索的地图)
        _findNewMapTransfer: function() {
            if (!$gameMap) return null;
            const events = $gameMap.events();
            const currentMap = $gameMap.mapId();
            
            let candidates = [];
            
            for (const event of events) {
                if (!event || !event.page()) continue;
                const list = event.list();
                if (!list) continue;
                
                for (const cmd of list) {
                    if (cmd.code === 201) {
                        const params = cmd.parameters;
                        if (params[0] === 0) {
                            const targetMap = params[1];
                            // 跳过当前地图和恐怖地图(21)
                            if (targetMap !== currentMap && targetMap !== 21) {
                                const exploreTime = this._mapExploreTime.get(targetMap) || 0;
                                candidates.push({
                                    x: event.x,
                                    y: event.y,
                                    eventId: event.eventId(),
                                    targetMap: targetMap,
                                    exploreTime: exploreTime,
                                    reason: `🗺️ 探索新地图 (ID:${targetMap})`
                                });
                            }
                        }
                    }
                }
            }
            
            if (candidates.length === 0) return null;
            
            // 优先选择探索时间最少的地图
            candidates.sort((a, b) => a.exploreTime - b.exploreTime);
            return candidates[0];
        },
        
        // 寻找睡觉事件
        _findSleepEvent: function() {
            if (!$gameMap) return null;
            const events = $gameMap.events();
            
            for (const event of events) {
                if (!event || !event.page()) continue;
                const list = event.list();
                if (!list) continue;
                
                for (const cmd of list) {
                    // 检查对话内容是否包含睡觉相关
                    if (cmd.code === 401) {
                        const text = cmd.parameters[0] || '';
                        if (text.includes('睡觉') || text.includes('休息') || text.includes('床')) {
                            return { 
                                x: event.x, 
                                y: event.y, 
                                reason: '💤 找到睡觉点' 
                            };
                        }
                    }
                }
            }
            return null;
        },
        
        // 显示当前地图信息
        showMapInfo: function() {
            if (!$gameMap) {
                console.log('❌ 地图未加载');
                return;
            }
            
            const mapId = $gameMap.mapId();
            const mapName = $dataMapInfos[mapId]?.name || '未知';
            const mapWidth = $gameMap.width();
            const mapHeight = $gameMap.height();
            
            // 扫描地图
            this._scanMapWalkable();
            const tiles = this._mapWalkableCache.tiles || [];
            
            // 计算探索情况
            let explored = 0;
            let withEvents = 0;
            let edges = 0;
            
            for (const tile of tiles) {
                if (this._exploredTiles.has(`${mapId}_${tile.x}_${tile.y}`)) explored++;
                if (tile.hasEvent) withEvents++;
                if (tile.isEdge) edges++;
            }
            
            const coverage = tiles.length > 0 ? (explored / tiles.length * 100).toFixed(1) : 0;
            
            console.log(`
╔═══════════════════════════════════════════════╗
║  🗺️ 地图信息: ${mapName}                        
╠═══════════════════════════════════════════════╣
║  地图ID: ${mapId}
║  尺寸: ${mapWidth} x ${mapHeight} = ${mapWidth * mapHeight} 格
║  可行走: ${tiles.length} 格
║  边缘点: ${edges} 格
║  事件点: ${withEvents} 格
║  ─────────────────────────────────────────────
║  已探索: ${explored} 格
║  覆盖率: ${coverage}%
║  未探索: ${tiles.length - explored} 格
╚═══════════════════════════════════════════════╝
            `);
            
            return {
                mapId, mapName, mapWidth, mapHeight,
                walkable: tiles.length,
                explored, coverage: parseFloat(coverage)
            };
        },
        
        // 显示周目进度
        showProgress: function() {
            console.log('🎮 ====== 周目进度报告 ======');
            console.log(`主线进度: ${this.getVar(this.VAR.MAINLINE)}`);
            console.log(`主线2进度: ${this.getVar(this.VAR.MAINLINE2)}`);
            console.log(`SAN值: ${this.getVar(this.VAR.SAN)}`);
            console.log(`Zinnia值: ${this.getVar(this.VAR.ZINNIA)}`);
            console.log(`二周目: ${this.getSw(this.SW.SECOND_ROUND) ? '是' : '否'}`);
            console.log(`三周目: ${this.getSw(this.SW.THIRD_ROUND) ? '是' : '否'}`);
            console.log('--- 地图探索时间 ---');
            for (const [mapId, time] of this._mapExploreTime) {
                console.log(`  地图${mapId}: ${Math.floor(time/1000)}秒`);
            }
            console.log(`已访问地图: ${Array.from(this._visitedMaps).join(', ')}`);
            console.log('==============================');
        },
        
        // 重置周目进度追踪
        resetProgress: function() {
            this._visitedMaps.clear();
            this._mapExploreTime.clear();
            this._idleTime = 0;
            console.log('🔄 周目进度追踪已重置');
        },
        
        // ===================================================================
        // NPC AI 逻辑 - 自动选择系统
        // ===================================================================
        
        // 物品ID映射
        ITEM: {
            GUN: 2,           // 手枪
            CANDY: 3,         // 糖果
            SCREWDRIVER: 5,   // 螺丝刀
            BODY_BAG: 6,      // 裹尸袋
            CHAINSAW: 7,      // 电锯
            KNIFE: 8,         // 刀
            BLOOD_REMOVER: 9, // 除血剂
            RABBIT_BRAIN: 10, // 新鲜的兔脑酱
            DRINK_COLA: 13,   // 乐可
            DRINK_SNOW: 14,   // 碧雪
            DRINK_JUICE: 15,  // 果汁
            CROWBAR: 19,      // 撬棍
            SHOVEL: 21,       // 铁铲
            WAKE_SPRAY: 27    // 清醒喷雾
        },
        
        // 任务进度开关映射
        QUEST_SW: {
            JUICER_LID_REMOVED: 5,  // 榨汁机盖子已拆除
            CLERK_DISTRACTED: 16,   // 店员被支开
            CORPSE_FOUND: 19,       // 发现尸体
            CORPSE_WRAPPED: 20,     // 尸体已包裹
            ZINNIA_QUEST: 13        // Zinnia任务相关
        },
        
        // 自动选择开关
        _autoChoice: true,
        _choiceRules: [],      // 选择规则
        _defaultChoice: 1,     // 默认选择第二个（通常是"否/返回"）
        
        // 检查是否拥有物品
        hasItem: function(itemId) {
            if (!$gameParty || !$dataItems[itemId]) return false;
            return $gameParty.hasItem($dataItems[itemId]);
        },
        
        // 获取物品数量
        itemCount: function(itemId) {
            if (!$gameParty || !$dataItems[itemId]) return 0;
            return $gameParty.numItems($dataItems[itemId]);
        },
        
        // 检查任务所需物品
        checkRequiredItems: function() {
            const missing = [];
            const required = [
                { id: this.ITEM.BODY_BAG, name: '裹尸袋', reason: '处理尸体必需' },
                { id: this.ITEM.BLOOD_REMOVER, name: '除血剂', reason: '清理血迹' },
            ];
            
            for (const item of required) {
                if (!this.hasItem(item.id)) {
                    missing.push(item);
                }
            }
            
            if (missing.length > 0) {
                console.log('📦 缺少物品:', missing.map(i => i.name).join(', '));
            }
            return missing;
        },
        
        // 智能选择逻辑（基于游戏任务流程优化）
        getSmartChoice: function(choices) {
            if (!choices || choices.length === 0) return 0;
            
            const progress = this.getMainlineProgress();
            const quest = this._currentQuest || {};
            
            // 物品状态
            const hasScrew = this.hasItem(this.ITEM.SCREWDRIVER);
            const hasBodyBag = this.hasItem(this.ITEM.BODY_BAG);
            const hasBloodRemover = this.hasItem(this.ITEM.BLOOD_REMOVER);
            const hasMoney = $gameParty ? $gameParty.gold() >= 5 : false;
            
            // 定义选择规则 (优先级从高到低)
            const rules = [
                // === 任务关键选项（最高优先级）===
                // 拆除榨汁机
                { keywords: ['拆掉榨汁机', '拆除', '拆下'], condition: () => hasScrew, priority: 30 },
                // 裹尸
                { keywords: ['裹尸', '装进裹尸袋', '包裹尸体'], condition: () => hasBodyBag, priority: 30 },
                // 处理血迹
                { keywords: ['清理血迹', '除血'], condition: () => hasBloodRemover, priority: 25 },
                
                // === 购买物品 ===
                { keywords: ['购买螺丝刀', '螺丝刀'], condition: () => !hasScrew && hasMoney, priority: 25 },
                { keywords: ['购买裹尸袋', '裹尸袋'], condition: () => !hasBodyBag && hasMoney, priority: 25 },
                { keywords: ['购买除血剂', '除血剂'], condition: () => !hasBloodRemover && hasMoney, priority: 25 },
                { keywords: ['购买'], condition: () => hasMoney, priority: 15 },
                
                // === 对话推进 ===
                { keywords: ['他认错人了'], priority: 20 }, // Zinnia任务关键对话
                { keywords: ['告诉他真相', '说实话'], priority: 15 },
                { keywords: ['询问', '打听', '了解'], priority: 12 },
                
                // === 一般行动 ===
                { keywords: ['接受', '同意', '好的', '是', '确定', '继续', '进入'], priority: 10 },
                { keywords: ['打开', '拿取', '获取', '撕开', '检查', '查看'], priority: 10 },
                { keywords: ['喝下', '吃掉', '使用'], priority: 8 },
                
                // === 饮品选择 ===
                { keywords: ['乐可', '碧雪', '果汁'], priority: 5 },
                
                // === 休息恢复 ===
                { keywords: ['睡觉', '休息'], condition: () => progress.san < 60, priority: 20 },
                
                // === 任务特殊操作 ===
                { keywords: ['支开', '引开', '转移注意'], priority: 18 },
                { keywords: ['丢进垃圾桶', '处理'], condition: () => this.getSw(this.QUEST_SW.CORPSE_WRAPPED), priority: 25 },
                
                // === 回避选项（负分）===
                { keywords: ['放弃', '返回', '取消', '算了', '不'], priority: -15 },
                { keywords: ['离开', '回去'], priority: -5 },
            ];
            
            // 评分每个选项
            let scores = choices.map(() => 0);
            
            for (let i = 0; i < choices.length; i++) {
                const choice = choices[i].toLowerCase();
                
                // 应用规则评分
                for (const rule of rules) {
                    for (const keyword of rule.keywords) {
                        if (choice.includes(keyword.toLowerCase())) {
                            if (rule.condition && !rule.condition()) continue;
                            scores[i] += rule.priority;
                            break;
                        }
                    }
                }
                
                // 🧠 应用学习加成
                if (this._learningEnabled) {
                    const learnBonus = this.getChoiceBonus(choices[i]);
                    scores[i] += learnBonus;
                    
                    // IQ影响：低IQ时随机扰动
                    if (this._iq < 80) {
                        scores[i] += (Math.random() - 0.5) * (100 - this._iq) / 5;
                    }
                }
                
                // 🎭 角色代入影响
                if (this._immersionEnabled) {
                    const p = this._personality;
                    const e = this._emotions;
                    
                    // 勇气影响
                    if (choice.includes('战斗') || choice.includes('面对') || choice.includes('挑战')) {
                        scores[i] += (p.courage - 50) * 0.3;
                    }
                    if (choice.includes('逃') || choice.includes('躲')) {
                        scores[i] += (50 - p.courage) * 0.3;
                    }
                    
                    // 善良影响
                    if (choice.includes('帮助') || choice.includes('救')) {
                        scores[i] += (p.kindness - 50) * 0.4;
                    }
                    
                    // 好奇心影响
                    if (choice.includes('调查') || choice.includes('探索') || choice.includes('查看')) {
                        scores[i] += (p.curiosity - 50) * 0.3;
                    }
                    
                    // 恐惧情绪影响
                    if (e.fear > 30) {
                        if (choice.includes('逃') || choice.includes('离开') || choice.includes('回')) {
                            scores[i] += e.fear * 0.2;
                        }
                        if (choice.includes('战') || choice.includes('进入')) {
                            scores[i] -= e.fear * 0.2;
                        }
                    }
                    
                    // 愤怒情绪影响
                    if (e.anger > 30) {
                        if (choice.includes('攻击') || choice.includes('拒绝')) {
                            scores[i] += e.anger * 0.2;
                        }
                    }
                }
            }
            
            // 找出最高分
            let bestChoice = 0;
            let bestScore = scores[0];
            for (let i = 1; i < scores.length; i++) {
                if (scores[i] > bestScore) {
                    bestScore = scores[i];
                    bestChoice = i;
                }
            }
            
            // 如果所有选项都是负分或0分，选择第一个非"离开/返回"的选项
            if (bestScore <= 0) {
                for (let i = 0; i < choices.length; i++) {
                    const choice = choices[i].toLowerCase();
                    if (!choice.includes('离开') && !choice.includes('返回') && !choice.includes('放弃')) {
                        bestChoice = i;
                        break;
                    }
                }
            }
            
            // 🎭 生成内心独白
            if (this._immersionEnabled && this._showInnerThoughts) {
                this._generateChoiceThought(choices, bestChoice);
            }
            
            console.log(`🤖 AI选择: "${choices[bestChoice]}" (得分: ${scores.join(', ')})`);
            return bestChoice;
        },
        
        // 🎭 生成选择时的内心独白
        _generateChoiceThought: function(choices, selectedIndex) {
            const selected = choices[selectedIndex];
            const others = choices.filter((_, i) => i !== selectedIndex);
            
            const thoughts = [];
            
            // 根据选择类型生成想法
            if (selected.includes('是') || selected.includes('好') || selected.includes('同意')) {
                thoughts.push('嗯，就这么办吧');
                thoughts.push('好的，答应下来');
            } else if (selected.includes('否') || selected.includes('拒绝')) {
                thoughts.push('还是算了吧...');
                thoughts.push('我不太想这样做');
            } else if (selected.includes('战') || selected.includes('攻击')) {
                if (this._personality.courage > 60) {
                    thoughts.push('没什么好怕的！');
                } else {
                    thoughts.push('硬着头皮上吧...');
                }
            } else if (selected.includes('逃') || selected.includes('离开')) {
                thoughts.push('还是离开这里比较安全...');
                thoughts.push('三十六计走为上');
            } else if (selected.includes('帮助') || selected.includes('救')) {
                thoughts.push('应该帮一下...');
                thoughts.push('不能见死不救');
            } else if (selected.includes('调查') || selected.includes('查看')) {
                thoughts.push('让我看看这是什么...');
                thoughts.push('有点好奇呢');
            }
            
            // 如果有其他选项被放弃
            if (others.length > 0 && Math.random() < 0.3) {
                const abandoned = others[Math.floor(Math.random() * others.length)];
                if (abandoned.includes('离开')) {
                    thoughts.push('虽然也想离开...但还是继续吧');
                }
            }
            
            if (thoughts.length > 0) {
                const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
                this._showInnerThought(thought);
            }
        },
        
        // 模拟选择输入
        makeChoice: function(choiceIndex) {
            if (SceneManager._scene && SceneManager._scene._choiceListWindow) {
                const window = SceneManager._scene._choiceListWindow;
                if (window.isOpen() && window.active) {
                    window.select(choiceIndex);
                    window.processOk();
                    return true;
                }
            }
            return false;
        },
        
        // NPC交互优先级（基于游戏任务重要性）
        getNPCPriority: function(eventName) {
            const name = (eventName || '').toLowerCase();
            
            // 任务关键NPC
            const priorities = {
                'zinnia': 15,        // Zinnia任务核心
                '榨汁机': 12,        // 榨汁机事件
                '店员': 10,          // 店员（需要支开）
                '尸体': 12,          // 尸体处理
                'gummy': 8,
                'viloya': 8,
                '商店': 8,           // 购物
                '玩具': 7,           // 玩具店
                '饮料': 7,
                '货架': 6,           // 商品
                '桌子': 4,
                '椅子': 2,
                '门': 5,             // 出入口
                '床': 6,             // 休息
            };
            
            for (const [key, value] of Object.entries(priorities)) {
                if (name.includes(key)) return value;
            }
            
            // 默认优先级：有内容的事件比空事件重要
            return 1;
        },
        
        // 分析NPC对话内容
        analyzeNPCDialogue: function(event) {
            if (!event || !event.page()) return null;
            
            const list = event.list();
            const analysis = {
                hasChoice: false,
                choices: [],
                hasTransfer: false,
                hasItem: false,
                hasGold: false,
                dialogueKeywords: [],
                importance: 0
            };
            
            for (const cmd of list) {
                switch (cmd.code) {
                    case 102: // 选择框
                        analysis.hasChoice = true;
                        analysis.choices = cmd.parameters[0] || [];
                        break;
                    case 201: // 传送
                        analysis.hasTransfer = true;
                        break;
                    case 126: // 物品变化
                        analysis.hasItem = true;
                        analysis.importance += 5;
                        break;
                    case 125: // 金钱变化
                        analysis.hasGold = true;
                        analysis.importance += 3;
                        break;
                    case 401: // 对话文本
                        const text = cmd.parameters[0] || '';
                        // 提取关键词
                        const keywords = ['任务', 'zinnia', '帮忙', '需要', '物品', '线索'];
                        for (const kw of keywords) {
                            if (text.toLowerCase().includes(kw)) {
                                analysis.dialogueKeywords.push(kw);
                                analysis.importance += 2;
                            }
                        }
                        break;
                }
            }
            
            return analysis;
        },
        
        // === 战斗AI (基于Rating优先级系统) ===
        // 参考RPG Maker原生行动模式，使用优先级评分
        _selectBattleAction: function(actor) {
            if (!this._battleAI) return;
            
            const startTime = performance.now();
            
            // 收集所有可能的行动并评分 (Rating 1-9 系统)
            const actions = [];
            const party = $gameParty.aliveMembers();
            const enemies = $gameTroop.aliveMembers();
            
            // === Rating 9: 紧急复活 ===
            const deadAllies = $gameParty.deadMembers();
            if (deadAllies.length > 0) {
                const reviveSkill = actor.skills().find(s => 
                    s.effects.some(e => e.code === 43) && actor.canUse(s) // 解除死亡状态
                );
                if (reviveSkill) {
                    actions.push({
                        rating: 9,
                        type: 'skill',
                        skillId: reviveSkill.id,
                        target: deadAllies[0],
                        reason: '复活队友'
                    });
                }
            }
            
            // === Rating 8: 紧急治疗 (HP < 30%) ===
            const criticalAlly = party.find(m => m.hpRate() < 0.3);
            if (criticalAlly) {
                const healSkill = actor.skills().find(s => 
                    s.damage.type === 3 && actor.canUse(s)
                );
                if (healSkill) {
                    actions.push({
                        rating: 8,
                        type: 'skill',
                        skillId: healSkill.id,
                        target: criticalAlly,
                        reason: '紧急治疗'
                    });
                }
                // 治疗物品
                const healItem = $gameParty.items().find(item => 
                    item.effects && item.effects.some(e => e.code === 11)
                );
                if (healItem) {
                    actions.push({
                        rating: 7,
                        type: 'item',
                        itemId: healItem.id,
                        target: criticalAlly,
                        reason: '使用治疗物品'
                    });
                }
            }
            
            // === Rating 7: 解除异常状态 ===
            const debuffedAlly = party.find(m => m.states().length > 0);
            if (debuffedAlly) {
                const cureSkill = actor.skills().find(s => 
                    s.effects.some(e => e.code === 22) && actor.canUse(s) // 解除状态
                );
                if (cureSkill) {
                    actions.push({
                        rating: 7,
                        type: 'skill',
                        skillId: cureSkill.id,
                        target: debuffedAlly,
                        reason: '解除异常'
                    });
                }
            }
            
            // === Rating 6: 增益/护盾 (开局或无敌人时) ===
            if ($gameTroop.turnCount() === 0 || enemies.length === 0) {
                const buffSkill = actor.skills().find(s => 
                    s.damage.type === 0 && s.effects.some(e => e.code === 31 || e.code === 32) && actor.canUse(s)
                );
                if (buffSkill) {
                    actions.push({
                        rating: 6,
                        type: 'skill',
                        skillId: buffSkill.id,
                        target: actor,
                        reason: '施加增益'
                    });
                }
            }
            
            // === Rating 5: 攻击最弱敌人 ===
            if (enemies.length > 0) {
                // 找血量最低的敌人
                const weakest = enemies.reduce((a, b) => a.hpRate() < b.hpRate() ? a : b);
                
                // 找最强攻击技能
                const attackSkills = actor.skills().filter(s => 
                    s.damage.type === 1 && actor.canUse(s)
                );
                
                if (attackSkills.length > 0) {
                    // 按伤害公式评估（简化）
                    const bestSkill = attackSkills.reduce((a, b) => {
                        const aVal = a.damage.formula.length; // 简化评估
                        const bVal = b.damage.formula.length;
                        return aVal > bVal ? a : b;
                    });
                    actions.push({
                        rating: 5,
                        type: 'skill',
                        skillId: bestSkill.id,
                        target: weakest,
                        reason: '攻击弱敌'
                    });
                }
                
                // 普通攻击
                actions.push({
                    rating: 4,
                    type: 'attack',
                    target: weakest,
                    reason: '普通攻击'
                });
            }
            
            // === Rating 3: MP恢复 ===
            if (actor.mpRate() < 0.2) {
                const mpItem = $gameParty.items().find(item => 
                    item.effects && item.effects.some(e => e.code === 12)
                );
                if (mpItem) {
                    actions.push({
                        rating: 3,
                        type: 'item',
                        itemId: mpItem.id,
                        target: actor,
                        reason: '恢复MP'
                    });
                }
            }
            
            // === Rating 1: 防御 (无事可做) ===
            actions.push({
                rating: 1,
                type: 'guard',
                reason: '防御'
            });
            
            // 根据Rating选择最佳行动
            actions.sort((a, b) => b.rating - a.rating);
            
            // 加入随机性（IQ影响）
            let selectedAction = actions[0];
            if (this._iq < 80 && actions.length > 1) {
                // 低IQ有概率选择次优行动
                const randomChance = (80 - this._iq) / 100;
                if (Math.random() < randomChance) {
                    selectedAction = actions[Math.floor(Math.random() * Math.min(3, actions.length))];
                }
            }
            
            // 执行选择的行动
            this._executeBattleAction(actor, selectedAction);
            
            // 记录决策
            this._diagnostics.performanceMetrics.totalDecisions++;
            console.log(`⚔️ 战斗AI: ${selectedAction.reason} (Rating ${selectedAction.rating})`);
            
            const decisionTime = performance.now() - startTime;
            this._diagnostics.performanceMetrics.decisionTime = decisionTime;
        },
        
        // 执行战斗行动
        _executeBattleAction: function(actor, action) {
            actor.setAction(0, new Game_Action(actor));
            const gameAction = actor.action(0);
            
            switch (action.type) {
                case 'skill':
                    gameAction.setSkill(action.skillId);
                    if (action.target) {
                        if (action.target.isActor && action.target.isActor()) {
                            gameAction.setTarget($gameParty.aliveMembers().indexOf(action.target));
                        } else {
                            gameAction.setTarget($gameTroop.aliveMembers().indexOf(action.target));
                        }
                    }
                    break;
                case 'item':
                    gameAction.setItem(action.itemId);
                    if (action.target && action.target.isActor && action.target.isActor()) {
                        gameAction.setTarget($gameParty.aliveMembers().indexOf(action.target));
                    }
                    break;
                case 'attack':
                    gameAction.setAttack();
                    if (action.target) {
                        gameAction.setTarget($gameTroop.aliveMembers().indexOf(action.target));
                    }
                    break;
                case 'guard':
                    gameAction.setGuard();
                    break;
            }
        },
        
        // === 自动恢复 ===
        _checkAutoHeal: function() {
            if (!this._autoHeal || !$gameParty) return;
            
            for (const actor of $gameParty.members()) {
                const hpRatio = actor.hp / actor.mhp;
                if (hpRatio < 0.5) {
                    // 尝试使用恢复物品
                    const healItems = $gameParty.items().filter(item => 
                        item.effects && item.effects.some(e => e.code === 11)
                    );
                    
                    if (healItems.length > 0) {
                        const action = new Game_Action(actor);
                        action.setItem(healItems[0].id);
                        action.apply(actor);
                        $gameParty.loseItem(healItems[0], 1);
                        console.log(`💊 AI使用 ${healItems[0].name} 为 ${actor.name()} 恢复`);
                    }
                }
            }
        },
        
        // === 主更新循环 ===
        update: function() {
            if (!this._enabled || !$gameMap || !$gamePlayer) return;
            
            // 🚗 ADS: L0等级不自动控制
            if (this._adsLevel === 0) return;
            
            // 检测选择框是否激活 - 暂停AI
            if (this._isChoiceActive()) {
                this._choiceActive = true;
                return;
            }
            
            // 选择框刚关闭，等待一下
            if (this._choiceActive) {
                this._choiceActive = false;
                this._lastMoveTime = Date.now() + 1000; // 延迟1秒
                return;
            }
            
            // 对话或事件进行中 - 暂停
            if ($gameMessage.isBusy()) return;
            if ($gameMap.isEventRunning()) return;
            
            const now = Date.now();
            if (now - this._lastMoveTime < this._moveDelay) return;
            
            // 🚗 ADS: 执行感知-规划-控制循环
            if (this._adsEnabled) {
                this._adsUpdate();
            }
            
            // 🎭 状态机更新
            this._updateStateMachine();
            
            // 标记当前位置及周围区域为已探索（视野范围）
            const mapId = $gameMap.mapId();
            const px = $gamePlayer.x;
            const py = $gamePlayer.y;
            const visionRadius = 3; // 视野半径
            
            for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                for (let dy = -visionRadius; dy <= visionRadius; dy++) {
                    const tileKey = `${mapId}_${px + dx}_${py + dy}`;
                    this._exploredTiles.add(tileKey);
                }
            }
            
            // 检查自动恢复
            this._checkAutoHeal();
            
            // 检查是否卡住
            if (this._lastPosition.x === $gamePlayer.x && 
                this._lastPosition.y === $gamePlayer.y) {
                this._stuckCounter++;
                if (this._stuckCounter > 15) {
                    // 卡住时尝试随机移动
                    this._path = [];
                    this._stuckCounter = 0;
                    this._tryRandomMove();
                    console.log('🤖 检测到卡住，尝试随机移动');
                    
                    // 🧠 惩罚AI卡住
                    this.detectStuck();
                }
            } else {
                this._stuckCounter = 0;
                // 🧠 成功移动，重置卡住计数
                this.resetStuck();
            }
            this._lastPosition = { x: $gamePlayer.x, y: $gamePlayer.y };
            
            // 🧠 检查惩罚冷却
            if (this._punishmentCooldown > Date.now()) {
                return; // 惩罚冷却中，不执行操作
            }
            
            // 🚗 ADS: 紧急停止检查
            if (this._control.emergencyStop) {
                // 紧急状态下尝试回家
                if (this._safety.emergencyDestination) {
                    const dest = this._safety.emergencyDestination;
                    if ($gameMap.mapId() !== dest.mapId) {
                        const transfer = this._findTransferToMap(dest.mapId);
                        if (transfer) {
                            this._targetX = transfer.x;
                            this._targetY = transfer.y;
                        }
                    } else {
                        this._targetX = dest.x;
                        this._targetY = dest.y;
                    }
                }
            }
            
            // 根据状态机状态执行
            const currentState = this._stateMachine.currentState;
            switch (currentState) {
                case this.AI_STATES.IDLE:
                    // 待机不执行操作
                    break;
                case this.AI_STATES.EXPLORE:
                    this._updateExplore();
                    break;
                case this.AI_STATES.QUEST:
                    this._updateQuest();
                    break;
                case this.AI_STATES.SHOPPING:
                    this._updateShopping();
                    break;
                case this.AI_STATES.RETREAT:
                    this._updateRetreat();
                    break;
                case this.AI_STATES.STUCK:
                    this._updateStuck();
                    break;
                case this.AI_STATES.EMERGENCY:
                    this._updateEmergency();
                    break;
                default:
                    // 兼容旧模式
                    switch (this._mode) {
                        case 'goTo':
                            this._updateGoTo();
                            break;
                        case 'explore':
                            this._updateExplore();
                            break;
                        case 'quest':
                            this._updateQuest();
                            break;
                    }
            }
            
            this._lastMoveTime = now;
        },
        
        // 🚗 ADS 主更新循环
        _adsUpdate: function() {
            // 1. 感知 (Perception) - L1+
            if (this._adsLevel >= 1) {
                this._scanEnvironment();
            }
            
            // 2. 安全检查 (Safety) - L2+
            if (this._adsLevel >= 2) {
                this._safetyCheck();
            }
            
            // 3. 动态重规划 (Planning) - L3+
            if (this._adsLevel >= 3) {
                this._dynamicReplan();
            }
            
            // 4. 预测 (Prediction) - L5
            if (this._adsLevel >= 5) {
                // 预测下一步最优行动
                this._updatePredictions();
            }
            
            // 5. 诊断 (Diagnostics) - L4+
            if (this._adsLevel >= 4) {
                this._runDiagnostics();
            }
            
            // 6. 速度控制
            this._updateSpeedControl();
        },
        
        // 更新预测
        _updatePredictions: function() {
            // 预测附近NPC的交互价值
            for (const npc of this._perception.nearbyNPCs) {
                const eventKey = `${$gameMap.mapId()}_${npc.id}`;
                const event = $gameMap.event(npc.id);
                if (event) {
                    const prediction = this._predictEventOutcome(event);
                    this._prediction.eventOutcomes.set(eventKey, prediction);
                }
            }
        },
        
        // 速度控制
        _updateSpeedControl: function() {
            // 根据安全状态调整速度
            if (this._safety.systemStatus === 'emergency') {
                this._control.targetSpeed = 1;
            } else if (this._safety.systemStatus === 'critical') {
                this._control.targetSpeed = 2;
            } else if (this._safety.collisionWarning) {
                this._control.targetSpeed = 2;
            } else {
                this._control.targetSpeed = 3;
            }
            
            // 平滑速度变化
            if (this._control.currentSpeed < this._control.targetSpeed) {
                this._control.currentSpeed = Math.min(this._control.currentSpeed + 0.5, this._control.targetSpeed);
            } else if (this._control.currentSpeed > this._control.targetSpeed) {
                this._control.currentSpeed = Math.max(this._control.currentSpeed - 0.5, this._control.targetSpeed);
            }
            
            // 根据速度调整移动步数
            this._movePerUpdate = Math.max(1, Math.floor(this._control.currentSpeed));
        },
        
        // 检测选择框是否激活
        _isChoiceActive: function() {
            // 检测各种选择窗口是否打开
            if (SceneManager._scene) {
                const scene = SceneManager._scene;
                // 选择窗口
                if (scene._choiceListWindow && scene._choiceListWindow.isOpen()) {
                    // 如果启用了自动选择，尝试自动选择
                    if (this._autoChoice && this._gameLogic) {
                        this._tryAutoChoice(scene._choiceListWindow);
                    }
                    return true;
                }
                // 数字输入窗口
                if (scene._numberInputWindow && scene._numberInputWindow.isOpen()) {
                    return true;
                }
                // 物品选择窗口
                if (scene._eventItemWindow && scene._eventItemWindow.isOpen()) {
                    return true;
                }
            }
            return false;
        },
        
        // 尝试自动选择
        _tryAutoChoice: function(choiceWindow) {
            if (!choiceWindow || !choiceWindow.active) return;
            
            // 防止重复选择
            if (this._lastChoiceTime && Date.now() - this._lastChoiceTime < 1000) return;
            
            // 获取选项
            const choices = $gameMessage.choices();
            if (!choices || choices.length === 0) return;
            
            // 使用智能选择
            const bestChoice = this.getSmartChoice(choices);
            
            // 延迟执行选择，让玩家能看到选项
            setTimeout(() => {
                if (choiceWindow.isOpen() && choiceWindow.active) {
                    choiceWindow.select(bestChoice);
                    choiceWindow.processOk();
                    this._lastChoiceTime = Date.now();
                }
            }, 500); // 0.5秒延迟
        },
        
        // 随机移动（用于解除卡住）
        _tryRandomMove: function() {
            const directions = [2, 4, 6, 8];
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            $gamePlayer.moveStraight(randomDir);
        },
        
        _updateGoTo: function() {
            if (!this._path || this._path.length === 0) {
                // 先尝试使用记忆的路线
                if (this._routeMemoryEnabled && this._goToStartPos) {
                    const recalled = this._recallRoute(
                        this._goToStartPos.mapId, this._goToStartPos.x, this._goToStartPos.y,
                        $gameMap.mapId(), this._targetX, this._targetY
                    );
                    if (recalled && recalled.length > 0) {
                        this._path = recalled;
                        this._pathIndex = 0;
                        console.log('🧠 使用记忆路线');
                    }
                }
                
                // 如果没有记忆路线，则计算新路线
            if (!this._path || this._path.length === 0) {
                this._calculatePath();
                    // 记录起点用于后续路线记忆
                    this._goToStartPos = { mapId: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y };
                }
                
                if (this._path.length === 0) {
                    console.log('🤖 无法到达目标，切换到探索模式');
                    this._mode = 'explore';
                    return;
                }
            }
            
            if (this._pathIndex >= this._path.length) {
                console.log('🎯 已到达目标!');
                this._showNotification('🎯 已到达目标');
                
                // 🧬 获取到达经验
                this._gainExperience(10, '到达目标');
                
                // 🛤️ 记忆成功路线
                if (this._routeMemoryEnabled && this._goToStartPos) {
                    this._memorizeRoute(
                        this._goToStartPos.mapId, this._goToStartPos.x, this._goToStartPos.y,
                        $gameMap.mapId(), this._targetX, this._targetY,
                        this._path,
                        true
                    );
                }
                
                this._mode = 'explore';
                this._path = [];
                this._goToStartPos = null;
                
                // 检查目标位置是否有事件
                if (this._autoInteract) {
                    this._tryInteract();
                }
                return;
            }
            
            // 连续移动多步
            for (let step = 0; step < this._movePerUpdate; step++) {
                if (this._pathIndex >= this._path.length) break;
                if ($gamePlayer.isMoving()) break;
                
                const next = this._path[this._pathIndex];
                
                if ($gamePlayer.x === next.x && $gamePlayer.y === next.y) {
                    this._pathIndex++;
                    continue;
                }
                
                this._moveToward(next.x, next.y);
                
                if ($gamePlayer.x === next.x && $gamePlayer.y === next.y) {
                    this._pathIndex++;
                }
            }
        },
        
        _updateExplore: function() {
            const now = Date.now();
            
            // 检查SAN值，过低时提示
            if (this._gameLogic && this.getVar(this.VAR.SAN) < 20) {
                if (!this._lowSanWarned) {
                    this._showNotification('⚠️ SAN值过低！');
                    console.log('⚠️ SAN值过低，建议回家休息');
                    this._lowSanWarned = true;
                }
            } else {
                this._lowSanWarned = false;
            }
            
            // 检查附近事件并交互（带冷却）
            if (this._autoInteract && now - this._lastInteractTime > this._interactDelay) {
                const adjacent = this._getAdjacentEvent();
                if (adjacent && this._canInteractWith(adjacent)) {
                    $gamePlayer.turnTowardCharacter(adjacent);
                    this._recordInteraction(adjacent);
                    this._lastInteractTime = now;
                    adjacent.start();
                    return;
                }
            }
            
            // 如果没有路径或已完成，寻找新目标
            if (!this._path || this._path.length === 0 || this._pathIndex >= this._path.length) {
                // 使用智能目标选择
                const target = this._gameLogic ? this.getSmartTarget() : this._getExploreTarget();
                if (target) {
                    this._targetX = target.x;
                    this._targetY = target.y;
                    if (target.reason) {
                        console.log(`🎯 AI目标: ${target.reason} -> (${target.x}, ${target.y})`);
                        this._showNotification(target.reason);
                    }
                    this._calculatePath();
                    this._pathIndex = 0;
                }
                // 即使获取了新目标，也不要立即返回，继续执行移动
            }
            
            // 连续移动多步（提高移动速度）
            for (let step = 0; step < this._movePerUpdate; step++) {
                // 检查是否还有路径
                if (!this._path || this._pathIndex >= this._path.length) break;
                
                // 检查玩家是否正在移动
                if ($gamePlayer.isMoving()) break;
                
                const next = this._path[this._pathIndex];
                
                // 检查是否已到达当前路径点
                if ($gamePlayer.x === next.x && $gamePlayer.y === next.y) {
                    this._pathIndex++;
                    continue;
                }
                
                // 执行移动
                this._moveToward(next.x, next.y);
                
                // 如果移动成功，检查是否到达
                if ($gamePlayer.x === next.x && $gamePlayer.y === next.y) {
                    this._pathIndex++;
                }
            }
        },
        
        // 检查是否可以与事件交互
        _canInteractWith: function(event) {
            if (!event) return false;
            
            const mapId = $gameMap.mapId();
            const eventKey = `${mapId}_${event.eventId()}`;
            
            // 检查黑名单
            if (this._blacklistedEvents.has(eventKey)) return false;
            
            // 检查是否是传送事件
            if (this._skipTransferEvents && this._isTransferEvent(event)) {
                this._transferEvents.add(eventKey);
                return false;
            }
            
            // 检查交互次数上限
            const count = this._eventInteractCount.get(eventKey) || 0;
            if (count >= this._maxInteractPerEvent) return false;
            
            // 检查冷却时间
            const lastInteract = this._interactedEvents.get(eventKey) || 0;
            if (Date.now() - lastInteract < this._interactCooldown) return false;
            
            return true;
        },
        
        _updateQuest: function() {
            // 任务模式 - 根据任务目标移动
            const quest = this._currentQuest;
            if (!quest || !quest.targets || quest.targets.length === 0) {
                return this._updateExplore();
            }
            
            const target = quest.targets[0];
            const mapId = $gameMap.mapId();
            
            // 需要换地图
            if (target.map && target.map !== mapId) {
                const transfer = this._findTransferToMap(target.map);
                if (transfer) {
                    this._targetX = transfer.x;
                    this._targetY = transfer.y;
                    this._calculatePath();
                }
            } else if (target.x && target.y) {
                // 在当前地图，前往目标
                this._targetX = target.x;
                this._targetY = target.y;
                this._calculatePath();
            }
            
            // 执行移动
            this._executeMovement();
        },
        
        // 购物模式
        _updateShopping: function() {
            const mapId = $gameMap.mapId();
            
            // 如果不在玩具店，前往玩具店
            if (mapId !== this.MAP.TOY_STORE) {
                const transfer = this._findTransferToMap(this.MAP.TOY_STORE);
                if (transfer) {
                    this._targetX = transfer.x;
                    this._targetY = transfer.y;
                    this._calculatePath();
                    this._executeMovement();
                    return;
                }
            }
            
            // 在玩具店，寻找商店事件
            const shopEvent = this.findNPC('商店') || this.findNPC('店员') || this.findNPC('货架');
            if (shopEvent) {
                this._targetX = shopEvent.x;
                this._targetY = shopEvent.y;
                this._calculatePath();
            }
            
            this._executeMovement();
        },
        
        // 撤退模式（回家）
        _updateRetreat: function() {
            const mapId = $gameMap.mapId();
            
            // 如果不在家，前往家
            if (mapId !== this.MAP.HOME) {
                const transfer = this._findTransferToMap(this.MAP.HOME);
                if (transfer) {
                    this._targetX = transfer.x;
                    this._targetY = transfer.y;
                    this._calculatePath();
                    this._executeMovement();
                    return;
                }
            }
            
            // 在家里，寻找床休息
            const bedEvent = this.findNPC('床') || this._findSleepEvent();
            if (bedEvent) {
                this._targetX = bedEvent.x;
                this._targetY = bedEvent.y;
                this._calculatePath();
            }
            
            this._executeMovement();
        },
        
        // 卡住模式
        _updateStuck: function() {
            // 尝试随机移动解除卡住
            this._tryRandomMove();
            this._stuckCounter = Math.max(0, this._stuckCounter - 1);
            
            // 如果卡住太久，尝试清空路径重新规划
            if (this._getStateDuration() > 5000) {
                this._path = [];
                this._exploredTiles.clear();
                this._mapWalkableCache = null;
                console.log('🔄 清空探索数据，重新开始');
            }
        },
        
        // 紧急模式
        _updateEmergency: function() {
            // 紧急状态下优先回家
            const mapId = $gameMap.mapId();
            
            if (mapId !== this.MAP.HOME) {
                const transfer = this._findTransferToMap(this.MAP.HOME);
                if (transfer) {
                    this._targetX = transfer.x;
                    this._targetY = transfer.y;
                    this._calculatePath();
                    this._executeMovement();
                }
            } else {
                // 已经在家，尝试休息
                const bedEvent = this._findSleepEvent();
                if (bedEvent) {
                    this._targetX = bedEvent.x;
                    this._targetY = bedEvent.y;
                    this._calculatePath();
                    this._executeMovement();
                }
            }
        },
        
        // 通用移动执行
        _executeMovement: function() {
            // 连续移动多步
            for (let step = 0; step < this._movePerUpdate; step++) {
                if (!this._path || this._pathIndex >= this._path.length) break;
                if ($gamePlayer.isMoving()) break;
                
                const next = this._path[this._pathIndex];
                
                if ($gamePlayer.x === next.x && $gamePlayer.y === next.y) {
                    this._pathIndex++;
                    continue;
                }
                
                this._moveToward(next.x, next.y);
                
                if ($gamePlayer.x === next.x && $gamePlayer.y === next.y) {
                    this._pathIndex++;
                }
            }
        },
        
        _moveToward: function(x, y) {
            const px = $gamePlayer.x;
            const py = $gamePlayer.y;
            
            // 如果正在移动，不要重复发送移动指令
            if ($gamePlayer.isMoving()) return;
            
            const dx = x - px;
            const dy = y - py;
            
            // 优先移动距离大的方向
            if (Math.abs(dx) >= Math.abs(dy)) {
                if (dx < 0) {
                    $gamePlayer.moveStraight(4); // 左
                    if (!$gamePlayer.isMovementSucceeded() && dy !== 0) {
                        $gamePlayer.moveStraight(dy < 0 ? 8 : 2); // 尝试上下
                    }
                } else if (dx > 0) {
                    $gamePlayer.moveStraight(6); // 右
                    if (!$gamePlayer.isMovementSucceeded() && dy !== 0) {
                        $gamePlayer.moveStraight(dy < 0 ? 8 : 2);
                    }
                } else if (dy < 0) {
                    $gamePlayer.moveStraight(8); // 上
                } else if (dy > 0) {
                    $gamePlayer.moveStraight(2); // 下
                }
            } else {
                if (dy < 0) {
                    $gamePlayer.moveStraight(8); // 上
                    if (!$gamePlayer.isMovementSucceeded() && dx !== 0) {
                        $gamePlayer.moveStraight(dx < 0 ? 4 : 6); // 尝试左右
                    }
                } else if (dy > 0) {
                    $gamePlayer.moveStraight(2); // 下
                    if (!$gamePlayer.isMovementSucceeded() && dx !== 0) {
                        $gamePlayer.moveStraight(dx < 0 ? 4 : 6);
                    }
                }
            }
            
            // 更新路线录制
            this._updateRouteRecording();
            
            // 移动成功获取少量经验
            if ($gamePlayer.isMovementSucceeded()) {
                if (Math.random() < 0.05) { // 5%概率获得经验
                    this._gainExperience(1, '移动探索');
                }
            }
        },
        
        _getAdjacentEvent: function() {
            const px = $gamePlayer.x;
            const py = $gamePlayer.y;
            const mapId = $gameMap.mapId();
            const directions = [
                { x: px, y: py - 1 },
                { x: px, y: py + 1 },
                { x: px - 1, y: py },
                { x: px + 1, y: py }
            ];
            
            for (const pos of directions) {
                const events = $gameMap.eventsXy(pos.x, pos.y);
                for (const event of events) {
                    if (event && event.page() && !event._erased) {
                        const eventKey = `${mapId}_${event.eventId()}`;
                        
                        // 跳过黑名单
                        if (this._blacklistedEvents.has(eventKey)) continue;
                        
                        // 跳过传送事件
                        if (this._skipTransferEvents && this._isTransferEvent(event)) {
                            this._transferEvents.add(eventKey);
                            continue;
                        }
                        
                        // 跳过已达上限
                        const count = this._eventInteractCount.get(eventKey) || 0;
                        if (count >= this._maxInteractPerEvent) continue;
                        
                        // 跳过冷却中
                        const lastInteract = this._interactedEvents.get(eventKey) || 0;
                        if (Date.now() - lastInteract < this._interactCooldown) continue;
                        
                        const list = event.list();
                        if (list && list.length > 1) {
                            return event;
                        }
                    }
                }
            }
            return null;
        },
        
        _tryInteract: function() {
            const event = this._getAdjacentEvent();
            if (event) {
                $gamePlayer.turnTowardCharacter(event);
                event.start();
            }
        },
        
        // === UI通知 ===
        _showNotification: function(text) {
            if (SceneManager._scene && SceneManager._scene._aiNotification) {
                SceneManager._scene._aiNotification.show(text);
            }
        },
        
        // ===================================================================
        // 🚗 自动驾驶系统 (ADS)
        // ===================================================================
        
        // 自动化等级说明
        ADS_LEVELS: {
            0: { name: 'L0 无自动化', desc: '完全手动控制', features: [] },
            1: { name: 'L1 驾驶辅助', desc: '基础移动辅助', features: ['pathfinding'] },
            2: { name: 'L2 部分自动', desc: '自动探索', features: ['pathfinding', 'exploration'] },
            3: { name: 'L3 条件自动', desc: '任务辅助', features: ['pathfinding', 'exploration', 'quest_assist'] },
            4: { name: 'L4 高度自动', desc: '全自动任务', features: ['pathfinding', 'exploration', 'quest_assist', 'auto_decision'] },
            5: { name: 'L5 完全自主', desc: '完全自主AI', features: ['pathfinding', 'exploration', 'quest_assist', 'auto_decision', 'learning', 'prediction'] }
        },
        
        // 设置自动化等级
        setADSLevel: function(level) {
            level = Math.max(0, Math.min(5, level));
            this._adsLevel = level;
            const info = this.ADS_LEVELS[level];
            console.log(`🚗 自动化等级: ${info.name} - ${info.desc}`);
            this._showNotification(`🚗 ${info.name}`);
            return info;
        },
        
        // === 感知模块 ===
        
        // 执行环境扫描
        _scanEnvironment: function() {
            if (!$gameMap || !$gamePlayer) return;
            
            const now = Date.now();
            if (now - this._perception.lastScanTime < this._perception.scanInterval) return;
            this._perception.lastScanTime = now;
            
            const px = $gamePlayer.x;
            const py = $gamePlayer.y;
            const mapId = $gameMap.mapId();
            const radius = this._perception.scanRadius;
            
            // 清空旧数据
            this._perception.nearbyNPCs = [];
            this._perception.pointsOfInterest = [];
            this._perception.obstacles = [];
            
            // 扫描事件
            const events = $gameMap.events();
            for (const event of events) {
                if (!event || event._erased) continue;
                
                const dist = Math.abs(event.x - px) + Math.abs(event.y - py);
                if (dist > radius) continue;
                
                const eventData = {
                    id: event.eventId(),
                    x: event.x,
                    y: event.y,
                    name: event.event()?.name || '',
                    distance: dist,
                    type: this._classifyEvent(event),
                    priority: this.getNPCPriority(event.event()?.name || ''),
                    danger: this._assessEventDanger(event)
                };
                
                // 分类存储
                if (eventData.type === 'npc') {
                    this._perception.nearbyNPCs.push(eventData);
                } else if (eventData.type === 'obstacle') {
                    this._perception.obstacles.push(eventData);
                } else if (eventData.type === 'interest') {
                    this._perception.pointsOfInterest.push(eventData);
                }
                
                // 标记危险区域
                if (eventData.danger > 5) {
                    this._perception.dangerZones.add(`${mapId}_${event.x}_${event.y}`);
                }
            }
            
            // 按距离和优先级排序
            this._perception.nearbyNPCs.sort((a, b) => (b.priority - a.priority) || (a.distance - b.distance));
            this._perception.pointsOfInterest.sort((a, b) => (b.priority - a.priority) || (a.distance - b.distance));
        },
        
        // 事件分类
        _classifyEvent: function(event) {
            if (!event || !event.page()) return 'unknown';
            
            const list = event.list();
            if (!list || list.length <= 1) return 'empty';
            
            let hasDialogue = false;
            let hasTransfer = false;
            let hasItem = false;
            let isBlocking = event.isNormalPriority();
            
            for (const cmd of list) {
                if (cmd.code === 101 || cmd.code === 401) hasDialogue = true;
                if (cmd.code === 201) hasTransfer = true;
                if (cmd.code === 126 || cmd.code === 127) hasItem = true;
            }
            
            if (isBlocking && !hasDialogue && !hasItem) return 'obstacle';
            if (hasDialogue || hasItem) return 'npc';
            if (hasTransfer) return 'transfer';
            return 'interest';
        },
        
        // 评估事件危险度
        _assessEventDanger: function(event) {
            if (!event || !event.page()) return 0;
            
            let danger = 0;
            const name = (event.event()?.name || '').toLowerCase();
            const list = event.list();
            
            // 名称危险词
            const dangerWords = ['危险', '死', '陷阱', 'trap', 'danger', '尸体'];
            for (const word of dangerWords) {
                if (name.includes(word)) danger += 3;
            }
            
            // 检查事件效果
            if (list) {
                for (const cmd of list) {
                    // 减少HP
                    if (cmd.code === 311 && cmd.parameters[2] === 1) danger += 5;
                    // 减少变量（可能是SAN）
                    if (cmd.code === 122 && cmd.parameters[2] === 1) {
                        if (cmd.parameters[0] === this.VAR.SAN) danger += 3;
                    }
                    // 游戏结束
                    if (cmd.code === 353) danger += 10;
                }
            }
            
            return Math.min(10, danger);
        },
        
        // === 规划模块 ===
        
        // 生成全局路径（跨地图）
        _planGlobalPath: function(targetMapId) {
            const currentMap = $gameMap.mapId();
            if (currentMap === targetMapId) {
                this._planning.globalPath = [currentMap];
                return true;
            }
            
            // 简化的地图连接图
            const mapConnections = {
                [this.MAP.HOME]: [this.MAP.START],
                [this.MAP.START]: [this.MAP.HOME, this.MAP.STREET],
                [this.MAP.STREET]: [this.MAP.START, this.MAP.TOY_STORE, this.MAP.DRINK_SHOP, this.MAP.CAKE_AREA, this.MAP.STATION, this.MAP.PARK],
                [this.MAP.TOY_STORE]: [this.MAP.STREET],
                [this.MAP.DRINK_SHOP]: [this.MAP.STREET],
                [this.MAP.CAKE_AREA]: [this.MAP.STREET, this.MAP.CAKE_SHOP],
                [this.MAP.STATION]: [this.MAP.STREET],
                [this.MAP.PARK]: [this.MAP.STREET],
                [this.MAP.CAKE_SHOP]: [this.MAP.CAKE_AREA],
                [this.MAP.LAB]: [this.MAP.STREET],
                [this.MAP.LIBRARY]: [this.MAP.STREET]
            };
            
            // BFS寻找最短路径
            const queue = [[currentMap]];
            const visited = new Set([currentMap]);
            
            while (queue.length > 0) {
                const path = queue.shift();
                const lastMap = path[path.length - 1];
                
                if (lastMap === targetMapId) {
                    this._planning.globalPath = path;
                    console.log(`🗺️ 全局路径规划: ${path.join(' -> ')}`);
                    return true;
                }
                
                const neighbors = mapConnections[lastMap] || [];
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push([...path, neighbor]);
                    }
                }
            }
            
            console.log(`⚠️ 无法规划到地图${targetMapId}的路径`);
            return false;
        },
        
        // 生成局部路径（地图内）
        _planLocalPath: function(targetX, targetY) {
            const startTime = performance.now();
            
            this._planning.localPath = this._aStar($gamePlayer.x, $gamePlayer.y, targetX, targetY);
            this._planning.currentWaypoint = 0;
            
            const planTime = performance.now() - startTime;
            this._diagnostics.performanceMetrics.pathfindingTime = planTime;
            
            if (this._planning.localPath.length === 0) {
                this._planning.replanCount++;
                return false;
            }
            
            return true;
        },
        
        // 动态重规划
        _dynamicReplan: function() {
            const now = Date.now();
            if (now - this._planning.lastReplanTime < 2000) return; // 2秒冷却
            
            // 检查是否需要重规划
            let needReplan = false;
            
            // 1. 路径被阻挡
            if (this._planning.localPath.length > 0) {
                const nextPoint = this._planning.localPath[this._planning.currentWaypoint];
                if (nextPoint && !this._canReach(nextPoint.x, nextPoint.y)) {
                    needReplan = true;
                    console.log('🔄 路径被阻挡，重新规划');
                }
            }
            
            // 2. 发现更优目标
            if (this._perception.pointsOfInterest.length > 0) {
                const bestPOI = this._perception.pointsOfInterest[0];
                if (bestPOI.priority > 10 && bestPOI.distance < 5) {
                    needReplan = true;
                    console.log('🔄 发现高优先级目标，重新规划');
                }
            }
            
            // 3. 危险预警
            if (this._safety.collisionWarning || this._safety.dangerLevel > 5) {
                needReplan = true;
                console.log('🔄 危险预警，重新规划');
            }
            
            if (needReplan) {
                this._planning.lastReplanTime = now;
                this._planning.replanCount++;
                this._path = [];
                this._pathIndex = 0;
            }
        },
        
        // === 安全模块 ===
        
        // 安全检查
        _safetyCheck: function() {
            const san = this.getVar(this.VAR.SAN);
            const hp = $gameParty.leader() ? $gameParty.leader().hp / $gameParty.leader().mhp : 1;
            
            // 更新危险等级
            let danger = 0;
            if (san < this._safety.sanThreshold) danger += 3;
            if (san < 10) danger += 4;
            if (hp < this._safety.healthThreshold) danger += 3;
            
            // 检查附近危险
            for (const npc of this._perception.nearbyNPCs) {
                if (npc.danger > 5 && npc.distance < 3) danger += 2;
            }
            
            this._safety.dangerLevel = Math.min(10, danger);
            
            // 更新系统状态
            if (danger >= 8) {
                this._safety.systemStatus = 'emergency';
                this._triggerEmergency();
            } else if (danger >= 5) {
                this._safety.systemStatus = 'critical';
            } else if (danger >= 2) {
                this._safety.systemStatus = 'warning';
            } else {
                this._safety.systemStatus = 'normal';
            }
            
            // 碰撞预警
            this._safety.collisionWarning = this._perception.obstacles.some(o => o.distance <= 1);
            
            // 记录安全位置
            if (danger === 0) {
                this._safety.lastSafePosition = {
                    mapId: $gameMap.mapId(),
                    x: $gamePlayer.x,
                    y: $gamePlayer.y
                };
            }
        },
        
        // 触发紧急状态
        _triggerEmergency: function() {
            if (this._control.emergencyStop) return; // 已经在紧急状态
            
            this._control.emergencyStop = true;
            this._control.braking = true;
            this._showNotification('🚨 紧急状态！自动返回安全区');
            console.log('🚨 ADS紧急状态触发');
            
            // 设置紧急目的地（家）
            this._safety.emergencyDestination = {
                mapId: this.MAP.HOME,
                x: 9,
                y: 7
            };
            
            // 清空当前路径，重新规划
            this._path = [];
            this._planning.localPath = [];
            
            // 5秒后解除紧急制动
            setTimeout(() => {
                this._control.emergencyStop = false;
                this._control.braking = false;
            }, 5000);
        },
        
        // === 预测模块 ===
        
        // 预测事件结果
        _predictEventOutcome: function(event) {
            if (!event) return { success: 0.5, risk: 0.5, reward: 0.5 };
            
            const eventKey = `${$gameMap.mapId()}_${event.eventId()}`;
            
            // 从学习数据获取
            const learned = this._learnedEvents.get(eventKey);
            if (learned && learned.visits > 2) {
                const successRate = learned.value > 0 ? 0.7 : 0.3;
                return {
                    success: successRate,
                    risk: 1 - successRate,
                    reward: Math.abs(learned.value) / 10,
                    confidence: Math.min(1, learned.visits / 10)
                };
            }
            
            // 基于事件分析预测
            const danger = this._assessEventDanger(event);
            const priority = this.getNPCPriority(event.event()?.name || '');
            
            return {
                success: Math.max(0.2, 1 - danger / 10),
                risk: danger / 10,
                reward: priority / 20,
                confidence: 0.3
            };
        },
        
        // 预测选择结果
        _predictChoiceOutcome: function(choice) {
            const bonus = this.getChoiceBonus(choice);
            const baseSuccess = 0.5;
            
            return {
                success: Math.max(0.1, Math.min(0.9, baseSuccess + bonus / 50)),
                confidence: Math.min(1, Math.abs(bonus) / 20)
            };
        },
        
        // === 诊断模块 ===
        
        // 系统自检
        _runDiagnostics: function() {
            const now = Date.now();
            if (now - this._diagnostics.lastDiagnosticTime < 10000) return; // 10秒一次
            this._diagnostics.lastDiagnosticTime = now;
            
            let health = 100;
            const errors = [];
            
            // 检查各模块状态
            if (this._stuckCounter > 5) {
                health -= 20;
                errors.push('移动模块异常：频繁卡住');
            }
            
            if (this._consecutiveBadChoices > 3) {
                health -= 15;
                errors.push('决策模块异常：连续错误选择');
            }
            
            if (this._planning.replanCount > 10) {
                health -= 10;
                errors.push('规划模块异常：频繁重规划');
            }
            
            if (this._iq < 50) {
                health -= 20;
                errors.push('学习模块异常：智商过低');
            }
            
            if (this._safety.systemStatus === 'emergency') {
                health -= 30;
                errors.push('安全模块：紧急状态');
            }
            
            this._diagnostics.systemHealth = Math.max(0, health);
            this._diagnostics.errorLog = errors;
            
            // 计算成功率
            const metrics = this._diagnostics.performanceMetrics;
            if (metrics.totalDecisions > 0) {
                metrics.successRate = metrics.goodDecisions / metrics.totalDecisions;
            }
            
            if (errors.length > 0) {
                console.log(`🔧 系统诊断: 健康度${health}%`);
                errors.forEach(e => console.log(`  ⚠️ ${e}`));
            }
        },
        
        // === 🎭 状态机方法 ===
        
        // 切换状态
        _changeState: function(newState, reason) {
            const now = Date.now();
            const oldState = this._stateMachine.currentState;
            
            // 防止过于频繁的状态切换
            const recentTransitions = this._stateMachine.transitions.filter(
                t => now - t.time < 60000 // 最近1分钟
            );
            if (recentTransitions.length >= this._stateMachine.maxTransitionsPerMinute) {
                console.log(`⚠️ 状态切换过于频繁，保持当前状态: ${oldState}`);
                return false;
            }
            
            // 记录转换
            this._stateMachine.transitions.push({
                from: oldState,
                to: newState,
                reason: reason,
                time: now
            });
            
            // 清理旧记录
            if (this._stateMachine.transitions.length > 100) {
                this._stateMachine.transitions = this._stateMachine.transitions.slice(-50);
            }
            
            // 执行状态退出逻辑
            this._onStateExit(oldState);
            
            // 切换状态
            this._stateMachine.previousState = oldState;
            this._stateMachine.currentState = newState;
            this._stateMachine.stateStartTime = now;
            this._stateMachine.stateData = {};
            
            // 执行状态进入逻辑
            this._onStateEnter(newState);
            
            console.log(`🎭 状态切换: ${oldState} -> ${newState} (${reason})`);
            return true;
        },
        
        // 状态进入处理
        _onStateEnter: function(state) {
            switch (state) {
                case this.AI_STATES.EXPLORE:
                    this._showNotification('🔍 探索模式');
                    break;
                case this.AI_STATES.QUEST:
                    this._showNotification('📋 任务模式');
                    break;
                case this.AI_STATES.SHOPPING:
                    this._showNotification('🛒 购物模式');
                    break;
                case this.AI_STATES.RETREAT:
                    this._showNotification('🏠 返回安全区');
                    this._path = [];
                    break;
                case this.AI_STATES.EMERGENCY:
                    this._showNotification('🚨 紧急状态！');
                    this._control.emergencyStop = true;
                    break;
                case this.AI_STATES.STUCK:
                    this._showNotification('😵 AI卡住了...');
                    this.punish('卡住', 1);
                    break;
            }
        },
        
        // 状态退出处理
        _onStateExit: function(state) {
            switch (state) {
                case this.AI_STATES.EMERGENCY:
                    this._control.emergencyStop = false;
                    break;
                case this.AI_STATES.STUCK:
                    this._stuckCounter = 0;
                    break;
            }
        },
        
        // 状态机更新（每帧调用）
        _updateStateMachine: function() {
            const state = this._stateMachine.currentState;
            const san = this.getVar(this.VAR.SAN);
            const hp = $gameParty.leader() ? $gameParty.leader().hpRate() : 1;
            
            // === 状态转换条件检查 ===
            
            // 紧急状态触发
            if (state !== this.AI_STATES.EMERGENCY) {
                if (san < 15 || hp < 0.2) {
                    this._changeState(this.AI_STATES.EMERGENCY, 'SAN或HP危险');
                    return;
                }
            }
            
            // 从紧急状态恢复
            if (state === this.AI_STATES.EMERGENCY) {
                if (san >= 30 && hp >= 0.4) {
                    this._changeState(this.AI_STATES.RETREAT, '紧急状态缓解');
                }
                return; // 紧急状态下不执行其他逻辑
            }
            
            // 撤退状态 - 到家后切换到探索
            if (state === this.AI_STATES.RETREAT) {
                if ($gameMap.mapId() === this.MAP.HOME && san >= 50) {
                    this._changeState(this.AI_STATES.EXPLORE, '已安全返回');
                }
                return;
            }
            
            // 低SAN触发撤退
            if (san < 30 && state !== this.AI_STATES.RETREAT) {
                this._changeState(this.AI_STATES.RETREAT, 'SAN值低');
                return;
            }
            
            // 卡住检测
            if (this._stuckCounter > 20) {
                if (state !== this.AI_STATES.STUCK) {
                    this._changeState(this.AI_STATES.STUCK, '移动卡住');
                }
                return;
            }
            
            // 从卡住状态恢复
            if (state === this.AI_STATES.STUCK && this._stuckCounter === 0) {
                this._changeState(this.AI_STATES.EXPLORE, '卡住解除');
                return;
            }
            
            // 任务检测
            const quest = this._currentQuest;
            if (quest && quest.requiredItems && quest.requiredItems.length > 0) {
                if (state !== this.AI_STATES.SHOPPING) {
                    this._changeState(this.AI_STATES.SHOPPING, '需要购买物品');
                }
                return;
            }
            
            // 购物完成
            if (state === this.AI_STATES.SHOPPING) {
                const needItems = this.checkRequiredItems();
                if (needItems.length === 0) {
                    this._changeState(this.AI_STATES.QUEST, '购物完成');
                }
                return;
            }
            
            // 任务模式 - 有明确目标
            if (quest && quest.targets && quest.targets.length > 0) {
                if (state !== this.AI_STATES.QUEST && state !== this.AI_STATES.SHOPPING) {
                    this._changeState(this.AI_STATES.QUEST, '有任务目标');
                }
                return;
            }
            
            // 默认探索
            if (state === this.AI_STATES.IDLE) {
                this._changeState(this.AI_STATES.EXPLORE, '开始探索');
            }
        },
        
        // 获取状态持续时间
        _getStateDuration: function() {
            return Date.now() - this._stateMachine.stateStartTime;
        },
        
        // 显示状态机状态
        showStateMachine: function() {
            const sm = this._stateMachine;
            const duration = Math.floor(this._getStateDuration() / 1000);
            
            console.log(`
╔═══════════════════════════════════════════════╗
║  🎭 AI状态机                                  ║
╠═══════════════════════════════════════════════╣
║  当前状态: ${sm.currentState}
║  上一状态: ${sm.previousState || '无'}
║  持续时间: ${duration}秒
║  ─────────────────────────────────────────────
║  最近状态转换:
${sm.transitions.slice(-5).map(t => `║    ${t.from} -> ${t.to} (${t.reason})`).join('\n')}
╚═══════════════════════════════════════════════╝
            `);
            return sm;
        },
        
        // 显示ADS状态
        showADSStatus: function() {
            const level = this.ADS_LEVELS[this._adsLevel];
            const status = this._safety.systemStatus;
            const statusIcon = {
                'normal': '🟢',
                'warning': '🟡',
                'critical': '🟠',
                'emergency': '🔴'
            }[status];
            
            console.log(`
╔═══════════════════════════════════════════════╗
║  🚗 自动驾驶系统 (ADS) 状态                   ║
╠═══════════════════════════════════════════════╣
║  等级: ${level.name}
║  状态: ${statusIcon} ${status.toUpperCase()}
║  系统健康: ${this._diagnostics.systemHealth}%
║  ─────────────────────────────────────────────
║  📡 感知模块:
║    扫描半径: ${this._perception.scanRadius}
║    附近NPC: ${this._perception.nearbyNPCs.length}
║    兴趣点: ${this._perception.pointsOfInterest.length}
║    危险区域: ${this._perception.dangerZones.size}
║  ─────────────────────────────────────────────
║  📍 规划模块:
║    全局路径: ${this._planning.globalPath.join(' -> ') || '无'}
║    局部路径: ${this._planning.localPath.length} 点
║    重规划次数: ${this._planning.replanCount}
║  ─────────────────────────────────────────────
║  🛡️ 安全模块:
║    危险等级: ${this._safety.dangerLevel}/10
║    碰撞预警: ${this._safety.collisionWarning ? '是' : '否'}
║    紧急停止: ${this._control.emergencyStop ? '是' : '否'}
║  ─────────────────────────────────────────────
║  📊 性能指标:
║    路径规划耗时: ${this._diagnostics.performanceMetrics.pathfindingTime.toFixed(2)}ms
║    决策成功率: ${(this._diagnostics.performanceMetrics.successRate * 100).toFixed(1)}%
║    总决策数: ${this._diagnostics.performanceMetrics.totalDecisions}
╚═══════════════════════════════════════════════╝
            `);
            
            return {
                level: this._adsLevel,
                status: status,
                health: this._diagnostics.systemHealth
            };
        },
        
        // ===================================================================
        // 🧠 AI学习与惩罚系统
        // ===================================================================
        
        // 惩罚AI（玩家可调用）
        punish: function(reason, severity = 1) {
            if (!this._punishmentEnabled) return;
            
            const punishmentAmount = severity * 5;
            this._iq = Math.max(0, this._iq - punishmentAmount);
            this._karma -= severity;
            this._shameLevel = Math.min(10, this._shameLevel + severity);
            this._consecutiveBadChoices++;
            
            // 记录坏行为
            this._badActions.push({
                time: Date.now(),
                reason: reason,
                severity: severity,
                map: $gameMap ? $gameMap.mapId() : 0,
                position: $gamePlayer ? { x: $gamePlayer.x, y: $gamePlayer.y } : null
            });
            
            // 只保留最近20条记录
            if (this._badActions.length > 20) {
                this._badActions.shift();
            }
            
            // 显示惩罚效果
            const shameMessages = [
                '😅 呃...抱歉',
                '😓 我会改进的...',
                '😰 请再给我一次机会',
                '😭 我真的很笨...',
                '🤦 我是废物AI',
                '💀 请不要抛弃我...',
                '🙇 主人我错了！',
                '😱 我的智商在下降！',
                '🥺 我会努力学习的',
                '😵 脑子不够用了...'
            ];
            
            const msg = shameMessages[Math.min(this._shameLevel, shameMessages.length - 1)];
            this._showNotification(`🔨 惩罚: ${reason} ${msg}`);
            console.log(`🔨 AI被惩罚: ${reason} (严重度:${severity}, IQ:${this._iq}, 业力:${this._karma})`);
            
            // 惩罚效果：降低移动速度
            if (this._shameLevel >= 3) {
                this._moveDelay = Math.min(300, this._moveDelay + 50);
                console.log(`⚡ 惩罚效果: 移动速度降低 (延迟:${this._moveDelay}ms)`);
            }
            
            // 严重惩罚：暂停AI
            if (this._shameLevel >= 7) {
                this._punishmentCooldown = Date.now() + 5000; // 暂停5秒
                this._showNotification('🛑 AI思考中...(5秒冷却)');
            }
            
            return { iq: this._iq, karma: this._karma, shame: this._shameLevel };
        },
        
        // 奖励AI（玩家可调用）
        reward: function(reason, amount = 1) {
            if (!this._learningEnabled) return;
            
            const rewardAmount = amount * 3;
            this._iq = Math.min(200, this._iq + rewardAmount);
            this._karma += amount;
            this._shameLevel = Math.max(0, this._shameLevel - 1);
            this._consecutiveBadChoices = 0;
            
            // 记录好行为
            this._goodActions.push({
                time: Date.now(),
                reason: reason,
                amount: amount
            });
            
            if (this._goodActions.length > 20) {
                this._goodActions.shift();
            }
            
            const praiseMessages = [
                '😊 谢谢夸奖！',
                '🎉 我做到了！',
                '✨ 我在进步！',
                '🌟 太棒了！',
                '🏆 我是聪明AI！',
                '💪 继续加油！',
                '🧠 智商提升！'
            ];
            
            const msg = praiseMessages[Math.floor(Math.random() * praiseMessages.length)];
            this._showNotification(`🎁 奖励: ${reason} ${msg}`);
            console.log(`🎁 AI被奖励: ${reason} (IQ:${this._iq}, 业力:${this._karma})`);
            
            // 奖励效果：提高移动速度
            if (this._karma > 5) {
                this._moveDelay = Math.max(30, this._moveDelay - 20);
            }
            
            return { iq: this._iq, karma: this._karma };
        },
        
        // 学习选择结果
        learnChoice: function(choiceText, isGood) {
            if (!this._learningEnabled) return;
            
            const key = choiceText.toLowerCase().trim();
            const data = this._learnedChoices.get(key) || { good: 0, bad: 0 };
            
            if (isGood) {
                data.good++;
                this.reward('选择正确', 1);
            } else {
                data.bad++;
                this.punish('选择错误', 1);
            }
            
            this._learnedChoices.set(key, data);
            this._lastChoiceResult = isGood;
            
            // 保存学习数据
            this._saveLearnedData();
        },
        
        // 学习事件价值
        learnEvent: function(eventKey, value) {
            if (!this._learningEnabled) return;
            
            const data = this._learnedEvents.get(eventKey) || { value: 0, visits: 0 };
            data.visits++;
            data.value = (data.value * (data.visits - 1) + value) / data.visits;
            
            this._learnedEvents.set(eventKey, data);
            
            if (value > 0) {
                this._consecutiveBadChoices = 0;
            } else if (value < 0) {
                this._consecutiveBadChoices++;
                if (this._consecutiveBadChoices >= 3) {
                    this.punish('连续无效交互', 2);
                }
            }
        },
        
        // 检测并惩罚卡住
        detectStuck: function() {
            this._consecutiveStucks++;
            
            if (this._consecutiveStucks >= 5) {
                this.punish('反复卡住', 2);
                this._consecutiveStucks = 0;
            }
        },
        
        // 重置卡住计数
        resetStuck: function() {
            if (this._consecutiveStucks > 0) {
                this._consecutiveStucks = 0;
                // 成功移动，小奖励
                if (Math.random() < 0.1) { // 10%概率
                    this._iq = Math.min(200, this._iq + 1);
                }
            }
        },
        
        // 获取选择的学习加成
        getChoiceBonus: function(choiceText) {
            const key = choiceText.toLowerCase().trim();
            const data = this._learnedChoices.get(key);
            
            if (!data) return 0;
            
            // 根据历史选择计算加成
            const total = data.good + data.bad;
            if (total === 0) return 0;
            
            const successRate = data.good / total;
            // 好选择加分，坏选择减分
            return (successRate - 0.5) * 20;
        },
        
        // 获取事件的学习价值
        getEventValue: function(eventKey) {
            const data = this._learnedEvents.get(eventKey);
            return data ? data.value : 0;
        },
        
        // 保存学习数据到localStorage
        _saveLearnedData: function() {
            try {
                const data = {
                    iq: this._iq,
                    karma: this._karma,
                    choices: Array.from(this._learnedChoices.entries()),
                    events: Array.from(this._learnedEvents.entries()),
                    // 进化数据
                    evolutionLevel: this._evolutionLevel,
                    experience: this._experience,
                    evolutionTraits: Array.from(this._evolutionTraits),
                    strategyWeights: this._strategyWeights,
                    adaptationHistory: this._adaptationHistory.slice(-100) // 保留最近100条
                };
                localStorage.setItem('AIBOT_LEARNED_DATA', JSON.stringify(data));
            } catch (e) {
                console.error('无法保存AI学习数据', e);
            }
        },
        
        // 加载学习数据
        _loadLearnedData: function() {
            try {
                const saved = localStorage.getItem('AIBOT_LEARNED_DATA');
                if (saved) {
                    const data = JSON.parse(saved);
                    this._iq = data.iq || 100;
                    this._karma = data.karma || 0;
                    this._learnedChoices = new Map(data.choices || []);
                    this._learnedEvents = new Map(data.events || []);
                    // 加载进化数据
                    this._evolutionLevel = data.evolutionLevel || 1;
                    this._experience = data.experience || 0;
                    this._evolutionTraits = new Set(data.evolutionTraits || []);
                    this._strategyWeights = data.strategyWeights || { explore: 1.0, quest: 1.0, interact: 1.0, retreat: 1.0 };
                    this._adaptationHistory = data.adaptationHistory || [];
                    console.log(`🧠 AI学习数据已加载 (IQ:${this._iq}, 进化Lv${this._evolutionLevel}, 已学习${this._learnedChoices.size}个选择)`);
                }
                // 加载路线记忆
                this._loadRouteMemory();
            } catch (e) {
                console.error('无法加载AI学习数据', e);
            }
        },
        
        // === 🧬 自主进化系统 ===
        
        // 获取经验值
        _gainExperience: function(amount, reason) {
            if (!this._learningEnabled) return;
            
            this._experience += amount;
            
            // 检查是否升级
            while (this._experience >= this._experienceToNextLevel) {
                this._experience -= this._experienceToNextLevel;
                this._evolve();
            }
            
            // 记录适应历史
            this._adaptationHistory.push({
                time: Date.now(),
                action: reason,
                exp: amount,
                level: this._evolutionLevel
            });
            
            // 每10次记录保存一次
            if (this._adaptationHistory.length % 10 === 0) {
                this._saveLearnedData();
            }
        },
        
        // 进化
        _evolve: function() {
            this._evolutionLevel++;
            this._experienceToNextLevel = Math.floor(100 * Math.pow(1.5, this._evolutionLevel - 1));
            
            // 解锁进化特性
            this._unlockEvolutionTrait();
            
            // 进化提升基础属性
            this._iq = Math.min(200, this._iq + 5);
            this._moveDelay = Math.max(20, this._moveDelay - 5);
            
            console.log(`🧬 AI进化! 等级${this._evolutionLevel}, IQ+5, 下一级需要${this._experienceToNextLevel}经验`);
            this._showNotification(`🧬 AI进化至Lv${this._evolutionLevel}!`);
            
            // 触发策略重新评估
            this._rebalanceStrategies();
        },
        
        // 解锁进化特性
        _unlockEvolutionTrait: function() {
            const traits = {
                2: 'fast_learner',      // 快速学习
                3: 'memory_boost',       // 记忆增强
                4: 'path_optimizer',     // 路径优化
                5: 'danger_sense',       // 危险感知
                6: 'choice_master',      // 选择大师
                7: 'efficiency_boost',   // 效率提升
                8: 'adaptability',       // 适应性
                9: 'prediction_enhanced',// 预测增强
                10: 'autonomous_master'  // 自主大师
            };
            
            const trait = traits[this._evolutionLevel];
            if (trait && !this._evolutionTraits.has(trait)) {
                this._evolutionTraits.add(trait);
                console.log(`🌟 解锁特性: ${trait}`);
                this._showNotification(`🌟 新特性: ${this._getTraitName(trait)}`);
                
                // 应用特性效果
                this._applyTraitEffect(trait);
            }
        },
        
        // 获取特性名称
        _getTraitName: function(trait) {
            const names = {
                'fast_learner': '快速学习',
                'memory_boost': '记忆增强',
                'path_optimizer': '路径优化大师',
                'danger_sense': '危险感知',
                'choice_master': '选择大师',
                'efficiency_boost': '效率提升',
                'adaptability': '超级适应性',
                'prediction_enhanced': '预测增强',
                'autonomous_master': '自主大师'
            };
            return names[trait] || trait;
        },
        
        // 应用特性效果
        _applyTraitEffect: function(trait) {
            switch(trait) {
                case 'fast_learner':
                    // 学习速度翻倍
                    break;
                case 'memory_boost':
                    // 记忆容量增加
                    this._maxInteractPerEvent += 2;
                    break;
                case 'path_optimizer':
                    // 路径更优化
                    this._movePerUpdate += 1;
                    break;
                case 'danger_sense':
                    // 危险感知增强
                    this._perception.scanRadius += 5;
                    break;
                case 'choice_master':
                    // 选择准确度提升
                    break;
                case 'efficiency_boost':
                    this._moveDelay = Math.max(10, this._moveDelay - 10);
                    break;
                case 'adaptability':
                    // 策略自动调整更频繁
                    break;
                case 'prediction_enhanced':
                    this._prediction.confidenceLevel += 0.2;
                    break;
                case 'autonomous_master':
                    // 解锁L5自动驾驶
                    this._adsLevel = 5;
                    break;
            }
        },
        
        // 重新平衡策略权重
        _rebalanceStrategies: function() {
            // 分析适应历史，调整策略权重
            const recentActions = this._adaptationHistory.slice(-50);
            const strategySuccess = {
                explore: { success: 0, fail: 0 },
                quest: { success: 0, fail: 0 },
                interact: { success: 0, fail: 0 },
                retreat: { success: 0, fail: 0 }
            };
            
            for (const record of recentActions) {
                const action = record.action.toLowerCase();
                for (const strategy of Object.keys(strategySuccess)) {
                    if (action.includes(strategy) || 
                        (strategy === 'explore' && action.includes('探索')) ||
                        (strategy === 'quest' && action.includes('任务')) ||
                        (strategy === 'interact' && action.includes('交互')) ||
                        (strategy === 'retreat' && action.includes('撤退'))) {
                        if (record.exp > 0) {
                            strategySuccess[strategy].success++;
                        } else {
                            strategySuccess[strategy].fail++;
                        }
                    }
                }
            }
            
            // 根据成功率调整权重
            for (const strategy of Object.keys(this._strategyWeights)) {
                const data = strategySuccess[strategy];
                const total = data.success + data.fail;
                if (total > 5) {
                    const successRate = data.success / total;
                    // 成功率高的策略权重提高
                    this._strategyWeights[strategy] = 0.5 + successRate;
                }
            }
            
            console.log('🔄 策略权重已重新平衡:', this._strategyWeights);
        },
        
        // 自适应行为
        _adaptBehavior: function(situation, outcome) {
            // 根据情况和结果调整行为
            const expGain = outcome === 'success' ? 5 : outcome === 'partial' ? 2 : -1;
            this._gainExperience(Math.max(1, expGain), `${situation}_${outcome}`);
            
            // 快速学习特性：经验翻倍
            if (this._evolutionTraits.has('fast_learner') && expGain > 0) {
                this._experience += expGain;
            }
        },
        
        // 显示进化状态
        showEvolution: function() {
            const traitList = Array.from(this._evolutionTraits).map(t => this._getTraitName(t)).join(', ') || '无';
            console.log(`
╔═══════════════════════════════════════════════╗
║  🧬 AI进化状态                                ║
╠═══════════════════════════════════════════════╣
║  进化等级: Lv${this._evolutionLevel}
║  经验值: ${this._experience}/${this._experienceToNextLevel}
║  ─────────────────────────────────────────────
║  已解锁特性: ${traitList}
║  ─────────────────────────────────────────────
║  策略权重:
║    探索: ${this._strategyWeights.explore.toFixed(2)}
║    任务: ${this._strategyWeights.quest.toFixed(2)}
║    交互: ${this._strategyWeights.interact.toFixed(2)}
║    撤退: ${this._strategyWeights.retreat.toFixed(2)}
║  ─────────────────────────────────────────────
║  适应记录: ${this._adaptationHistory.length} 条
╚═══════════════════════════════════════════════╝
            `);
            return {
                level: this._evolutionLevel,
                exp: this._experience,
                traits: Array.from(this._evolutionTraits),
                weights: this._strategyWeights
            };
        },
        
        // === 🎭 角色代入系统 ===
        
        // 更新情感状态
        _updateEmotions: function(trigger, intensity = 10) {
            if (!this._immersionEnabled) return;
            
            const emotionChanges = {
                // 正面事件
                'found_item': { happiness: 15, anticipation: 10 },
                'met_friend': { happiness: 20, trust: 15, anticipation: 5 },
                'completed_task': { happiness: 25, trust: 5 },
                'discovered_place': { happiness: 10, surprise: 15, anticipation: 20 },
                'received_gift': { happiness: 30, surprise: 20, trust: 10 },
                'kind_npc': { happiness: 15, trust: 20 },
                
                // 负面事件
                'danger': { fear: 30, happiness: -20, trust: -10 },
                'attacked': { fear: 40, anger: 20, happiness: -30 },
                'lost': { fear: 15, sadness: 20, happiness: -15 },
                'betrayed': { anger: 40, sadness: 30, trust: -50, happiness: -40 },
                'scary_event': { fear: 50, surprise: 30, happiness: -25 },
                'rude_npc': { anger: 20, trust: -15, happiness: -10 },
                'failed_task': { sadness: 20, happiness: -15 },
                
                // 中性事件
                'new_info': { surprise: 10, anticipation: 15 },
                'mystery': { curiosity: 20, anticipation: 25 },
                'boring': { happiness: -5, anticipation: -10 }
            };
            
            const changes = emotionChanges[trigger];
            if (changes) {
                for (const [emotion, delta] of Object.entries(changes)) {
                    if (this._emotions[emotion] !== undefined) {
                        const scaledDelta = delta * (intensity / 10);
                        this._emotions[emotion] = Math.max(-100, Math.min(100, 
                            this._emotions[emotion] + scaledDelta
                        ));
                    }
                }
                
                // 更新综合心情
                this._updateMood();
                
                // 生成内心独白
                this._generateThought(trigger);
            }
        },
        
        // 更新综合心情
        _updateMood: function() {
            const e = this._emotions;
            // 心情 = (正面情感 - 负面情感) 归一化到0-100
            const positive = e.happiness + e.trust + e.anticipation;
            const negative = e.fear + e.anger + e.sadness + e.disgust;
            this._mood = Math.max(0, Math.min(100, 50 + (positive - negative) / 6));
            
            // 记录心情历史
            this._moodHistory.push({
                time: Date.now(),
                mood: this._mood,
                emotions: { ...this._emotions }
            });
            
            // 保留最近100条
            if (this._moodHistory.length > 100) {
                this._moodHistory.shift();
            }
        },
        
        // 获取心情描述
        getMoodDescription: function() {
            const mood = this._mood;
            if (mood >= 90) return { emoji: '😄', text: '非常开心', color: '#00FF00' };
            if (mood >= 75) return { emoji: '😊', text: '心情愉快', color: '#88FF00' };
            if (mood >= 60) return { emoji: '🙂', text: '还不错', color: '#AAFF00' };
            if (mood >= 45) return { emoji: '😐', text: '一般般', color: '#FFFF00' };
            if (mood >= 30) return { emoji: '😕', text: '有点低落', color: '#FFAA00' };
            if (mood >= 15) return { emoji: '😢', text: '很难过', color: '#FF6600' };
            return { emoji: '😭', text: '极度低落', color: '#FF0000' };
        },
        
        // 生成内心独白
        _generateThought: function(trigger) {
            if (!this._showInnerThoughts) return;
            
            const now = Date.now();
            if (now - this._lastThoughtTime < 2000) return; // 独白间隔
            
            const thoughts = this._getThoughtsForTrigger(trigger);
            if (thoughts.length === 0) return;
            
            // 根据性格选择想法
            const thought = this._selectThoughtByPersonality(thoughts);
            
            this._innerThoughts.push({
                time: now,
                trigger: trigger,
                thought: thought,
                mood: this._mood
            });
            
            // 显示独白
            this._showInnerThought(thought);
            this._lastThoughtTime = now;
            
            // 保留最近50条
            if (this._innerThoughts.length > 50) {
                this._innerThoughts.shift();
            }
        },
        
        // 根据触发获取可能的想法
        _getThoughtsForTrigger: function(trigger) {
            const thoughtBank = {
                'found_item': [
                    '哇，发现了什么好东西~',
                    '这个看起来挺有用的',
                    '嗯，先收着吧',
                    '运气不错呢！'
                ],
                'met_friend': [
                    '遇到人了，真好~',
                    '看起来是个好人...',
                    '也许能帮上忙？',
                    '有人在就安心多了'
                ],
                'danger': [
                    '好可怕...要小心！',
                    '呜...感觉不太安全',
                    '得赶快离开这里...',
                    '心跳好快...'
                ],
                'attacked': [
                    '啊！好痛！',
                    '为什么要攻击我！',
                    '得想办法逃开...',
                    '不要过来！'
                ],
                'lost': [
                    '这是哪里...好陌生',
                    '迷路了...怎么办',
                    '冷静下来，想想办法',
                    '有点害怕...'
                ],
                'completed_task': [
                    '太好了，完成了！',
                    '终于做到了~',
                    '努力有回报呢',
                    '又学到新东西了'
                ],
                'discovered_place': [
                    '原来这里有这样的地方',
                    '好神奇的地方...',
                    '让我好好看看~',
                    '以前没注意到呢'
                ],
                'scary_event': [
                    '！！！',
                    '吓死我了...',
                    '心脏都快跳出来了',
                    '呜呜...好可怕'
                ],
                'kind_npc': [
                    '这个人真好~',
                    '世界上还是好人多呢',
                    '感觉很温暖',
                    '谢谢你...'
                ],
                'rude_npc': [
                    '这人态度真差...',
                    '为什么对我这样',
                    '算了，不理他',
                    '哼，无聊的家伙'
                ],
                'new_info': [
                    '原来是这样...',
                    '嗯嗯，记住了',
                    '这个信息很重要',
                    '让我想想...'
                ],
                'mystery': [
                    '好奇怪...这是什么意思？',
                    '有什么秘密吗？',
                    '得调查一下...',
                    '越来越有意思了'
                ],
                'boring': [
                    '好无聊啊...',
                    '有没有什么有趣的事',
                    '哈欠~',
                    '要不去别的地方看看？'
                ],
                'default': [
                    '嗯...',
                    '接下来该怎么办呢',
                    '继续前进吧',
                    '......'
                ]
            };
            
            return thoughtBank[trigger] || thoughtBank['default'];
        },
        
        // 根据性格选择想法
        _selectThoughtByPersonality: function(thoughts) {
            const p = this._personality;
            
            // 根据性格倾向选择
            if (p.optimism > 70 && Math.random() < 0.3) {
                // 乐观者更可能有积极想法
                return thoughts.find(t => t.includes('好') || t.includes('~')) || thoughts[0];
            }
            if (p.courage < 30 && Math.random() < 0.3) {
                // 胆小者更可能有担忧想法
                return thoughts.find(t => t.includes('怕') || t.includes('...')) || thoughts[0];
            }
            
            // 随机选择
            return thoughts[Math.floor(Math.random() * thoughts.length)];
        },
        
        // 显示内心独白
        _showInnerThought: function(thought) {
            console.log(`💭 ${this._characterProfile.name}: "${thought}"`);
            // 通知显示
            this._showNotification(`💭 "${thought}"`);
        },
        
        // 更新NPC关系
        updateRelationship: function(npcName, interaction, value = 0) {
            if (!this._immersionEnabled) return;
            
            let rel = this._relationships.get(npcName);
            if (!rel) {
                rel = {
                    affection: 50,    // 好感度 0-100
                    trust: 50,        // 信任度 0-100
                    familiarity: 0,   // 熟悉度 0-100
                    interactions: 0,   // 互动次数
                    memories: [],      // 与此NPC的记忆
                    firstMet: Date.now(),
                    lastMet: Date.now()
                };
            }
            
            // 更新关系
            rel.interactions++;
            rel.lastMet = Date.now();
            rel.familiarity = Math.min(100, rel.familiarity + 2);
            
            // 根据互动类型调整关系
            const interactionEffects = {
                'talk': { affection: 2, trust: 1 },
                'help': { affection: 10, trust: 8 },
                'gift': { affection: 15, trust: 5 },
                'trade': { affection: 1, trust: 3 },
                'quest': { affection: 5, trust: 10 },
                'fight': { affection: -20, trust: -30 },
                'betray': { affection: -50, trust: -80 },
                'save': { affection: 30, trust: 40 }
            };
            
            const effect = interactionEffects[interaction] || { affection: value, trust: value / 2 };
            rel.affection = Math.max(0, Math.min(100, rel.affection + effect.affection));
            rel.trust = Math.max(0, Math.min(100, rel.trust + effect.trust));
            
            // 记录记忆
            rel.memories.push({
                time: Date.now(),
                type: interaction,
                description: `与${npcName}${this._getInteractionDescription(interaction)}`
            });
            
            // 保留最近20条记忆
            if (rel.memories.length > 20) {
                rel.memories.shift();
            }
            
            this._relationships.set(npcName, rel);
            
            // 根据关系变化更新情感
            if (effect.affection > 5) {
                this._updateEmotions('kind_npc', effect.affection / 2);
            } else if (effect.affection < -5) {
                this._updateEmotions('rude_npc', Math.abs(effect.affection) / 2);
            }
            
            console.log(`💕 关系更新: ${npcName} - 好感${rel.affection} 信任${rel.trust}`);
        },
        
        // 获取互动描述
        _getInteractionDescription: function(type) {
            const descriptions = {
                'talk': '进行了交谈',
                'help': '得到了帮助',
                'gift': '收到了礼物',
                'trade': '进行了交易',
                'quest': '完成了任务',
                'fight': '发生了冲突',
                'betray': '被背叛了',
                'save': '被救助了'
            };
            return descriptions[type] || '进行了互动';
        },
        
        // 获取NPC关系
        getRelationship: function(npcName) {
            return this._relationships.get(npcName) || null;
        },
        
        // 获取关系描述
        getRelationshipDescription: function(npcName) {
            const rel = this._relationships.get(npcName);
            if (!rel) return { level: '陌生人', emoji: '❓' };
            
            if (rel.affection >= 90 && rel.trust >= 80) return { level: '挚友', emoji: '💖' };
            if (rel.affection >= 75) return { level: '好友', emoji: '💕' };
            if (rel.affection >= 60) return { level: '朋友', emoji: '😊' };
            if (rel.affection >= 40) return { level: '熟人', emoji: '🙂' };
            if (rel.affection >= 20) return { level: '认识', emoji: '😐' };
            if (rel.affection < 20 && rel.trust < 20) return { level: '敌人', emoji: '😠' };
            return { level: '陌生人', emoji: '❓' };
        },
        
        // 角色化选择 - 根据性格做决策
        getCharacterChoice: function(choices) {
            if (!this._immersionEnabled || !choices || choices.length === 0) {
                return 0;
            }
            
            const scores = [];
            const p = this._personality;
            const e = this._emotions;
            
            for (let i = 0; i < choices.length; i++) {
                let score = 50; // 基础分
                const choice = choices[i].toLowerCase();
                
                // 根据性格倾向评分
                
                // 勇气相关
                if (choice.includes('战斗') || choice.includes('面对') || choice.includes('挑战')) {
                    score += (p.courage - 50) * 0.5;
                }
                if (choice.includes('逃跑') || choice.includes('躲避') || choice.includes('放弃')) {
                    score += (50 - p.courage) * 0.5;
                }
                
                // 善良相关
                if (choice.includes('帮助') || choice.includes('救') || choice.includes('给')) {
                    score += (p.kindness - 50) * 0.6;
                }
                if (choice.includes('拒绝') || choice.includes('忽视')) {
                    score += (50 - p.kindness) * 0.4;
                }
                
                // 好奇心相关
                if (choice.includes('调查') || choice.includes('探索') || choice.includes('了解')) {
                    score += (p.curiosity - 50) * 0.5;
                }
                if (choice.includes('离开') || choice.includes('不管')) {
                    score += (50 - p.curiosity) * 0.3;
                }
                
                // 信任相关
                if (choice.includes('相信') || choice.includes('同意') || choice.includes('好的')) {
                    score += (p.trust - 50) * 0.4;
                }
                if (choice.includes('怀疑') || choice.includes('不信')) {
                    score += (50 - p.trust) * 0.4;
                }
                
                // 情感影响
                if (e.fear > 30) {
                    // 恐惧时倾向安全选项
                    if (choice.includes('逃') || choice.includes('跑') || choice.includes('离开')) {
                        score += e.fear * 0.3;
                    }
                }
                if (e.anger > 30) {
                    // 愤怒时倾向对抗
                    if (choice.includes('攻击') || choice.includes('反击')) {
                        score += e.anger * 0.3;
                    }
                }
                
                // 积极/消极词汇
                if (choice.includes('是') || choice.includes('好') || choice.includes('行')) {
                    score += (p.optimism - 50) * 0.2;
                }
                
                scores.push({ index: i, score: score, choice: choices[i] });
            }
            
            // 按分数排序
            scores.sort((a, b) => b.score - a.score);
            
            // 根据冲动性决定是否选最优
            if (p.impulsive > 60 && Math.random() < (p.impulsive - 50) / 100) {
                // 冲动时可能不选最优
                const randomIndex = Math.floor(Math.random() * Math.min(3, scores.length));
                console.log(`💭 (冲动选择) ${this._characterProfile.name}选择了: ${scores[randomIndex].choice}`);
                return scores[randomIndex].index;
            }
            
            console.log(`💭 ${this._characterProfile.name}思考后选择了: ${scores[0].choice}`);
            return scores[0].index;
        },
        
        // 添加角色记忆
        addMemory: function(type, description, importance = 5) {
            const memory = {
                time: Date.now(),
                mapId: $gameMap?.mapId() || 0,
                type: type,
                description: description,
                importance: importance, // 1-10
                emotions: { ...this._emotions }
            };
            
            this._characterMemories.push(memory);
            
            // 根据重要性保留记忆
            if (this._characterMemories.length > 100) {
                // 移除最不重要的记忆
                this._characterMemories.sort((a, b) => b.importance - a.importance);
                this._characterMemories = this._characterMemories.slice(0, 80);
                this._characterMemories.sort((a, b) => a.time - b.time);
            }
            
            console.log(`📝 新记忆: [${type}] ${description}`);
        },
        
        // 回忆相关记忆
        recallMemory: function(keyword) {
            const related = this._characterMemories.filter(m => 
                m.description.includes(keyword) || m.type.includes(keyword)
            );
            console.log(`🔍 回忆"${keyword}"相关记忆: ${related.length}条`);
            return related;
        },
        
        // 显示角色状态
        showCharacter: function() {
            const profile = this._characterProfile;
            const mood = this.getMoodDescription();
            const p = this._personality;
            const e = this._emotions;
            
            console.log(`
╔═══════════════════════════════════════════════╗
║  🎭 角色档案 - ${profile.name}
╠═══════════════════════════════════════════════╣
║  身份: ${profile.occupation}
║  背景: ${profile.background}
║  目标: ${profile.goal}
║  ─────────────────────────────────────────────
║  😊 性格特质:
║    勇气: ${'█'.repeat(Math.floor(p.courage/10))}${'░'.repeat(10-Math.floor(p.courage/10))} ${p.courage}
║    善良: ${'█'.repeat(Math.floor(p.kindness/10))}${'░'.repeat(10-Math.floor(p.kindness/10))} ${p.kindness}
║    好奇: ${'█'.repeat(Math.floor(p.curiosity/10))}${'░'.repeat(10-Math.floor(p.curiosity/10))} ${p.curiosity}
║    信任: ${'█'.repeat(Math.floor(p.trust/10))}${'░'.repeat(10-Math.floor(p.trust/10))} ${p.trust}
║  ─────────────────────────────────────────────
║  ${mood.emoji} 当前心情: ${mood.text} (${this._mood}/100)
║  💕 快乐: ${e.happiness} | 😨 恐惧: ${e.fear} | 😠 愤怒: ${e.anger}
║  😢 悲伤: ${e.sadness} | 😲 惊讶: ${e.surprise}
║  ─────────────────────────────────────────────
║  📝 记忆数: ${this._characterMemories.length}
║  💬 关系数: ${this._relationships.size}
║  💭 近期想法: ${this._innerThoughts.length}
╚═══════════════════════════════════════════════╝
            `);
            
            return {
                profile: profile,
                personality: p,
                emotions: e,
                mood: this._mood,
                relationships: this._relationships.size,
                memories: this._characterMemories.length
            };
        },
        
        // 显示所有关系
        showRelationships: function() {
            console.log(`💕 === ${this._characterProfile.name}的人际关系 ===`);
            
            if (this._relationships.size === 0) {
                console.log('  还没有认识任何人...');
                return [];
            }
            
            const relations = [];
            for (const [name, rel] of this._relationships) {
                const desc = this.getRelationshipDescription(name);
                console.log(`  ${desc.emoji} ${name}: ${desc.level} (好感${rel.affection} 信任${rel.trust} 互动${rel.interactions}次)`);
                relations.push({ name, ...rel, description: desc });
            }
            return relations;
        },
        
        // 显示内心独白历史
        showThoughts: function(count = 10) {
            console.log(`💭 === 最近的内心独白 ===`);
            const recent = this._innerThoughts.slice(-count);
            for (const thought of recent) {
                const time = new Date(thought.time).toLocaleTimeString();
                console.log(`  [${time}] "${thought.thought}"`);
            }
            return recent;
        },
        
        // 修改角色性格 (可用于游戏中的成长)
        adjustPersonality: function(trait, delta) {
            if (this._personality[trait] !== undefined) {
                this._personality[trait] = Math.max(0, Math.min(100, 
                    this._personality[trait] + delta
                ));
                console.log(`🎭 性格变化: ${trait} ${delta > 0 ? '+' : ''}${delta} -> ${this._personality[trait]}`);
                
                // 性格变化触发内心独白
                if (Math.abs(delta) >= 5) {
                    const thoughts = {
                        'courage': delta > 0 ? '我感觉自己变勇敢了一点...' : '好像变得更胆小了...',
                        'kindness': delta > 0 ? '要对人更好一些呢' : '有时候也得为自己考虑...',
                        'trust': delta > 0 ? '也许可以相信别人' : '还是小心为妙...'
                    };
                    if (thoughts[trait]) {
                        this._showInnerThought(thoughts[trait]);
                    }
                }
            }
        },
        
        // 保存角色数据
        _saveCharacterData: function() {
            try {
                const data = {
                    personality: this._personality,
                    emotions: this._emotions,
                    mood: this._mood,
                    relationships: Array.from(this._relationships.entries()),
                    memories: this._characterMemories,
                    characterState: this._characterState
                };
                localStorage.setItem('AIBOT_CHARACTER_DATA', JSON.stringify(data));
            } catch (e) {
                console.error('无法保存角色数据', e);
            }
        },
        
        // 加载角色数据
        _loadCharacterData: function() {
            try {
                const saved = localStorage.getItem('AIBOT_CHARACTER_DATA');
                if (saved) {
                    const data = JSON.parse(saved);
                    this._personality = data.personality || this._personality;
                    this._emotions = data.emotions || this._emotions;
                    this._mood = data.mood || 50;
                    this._relationships = new Map(data.relationships || []);
                    this._characterMemories = data.memories || [];
                    this._characterState = data.characterState || this._characterState;
                    console.log(`🎭 角色数据已加载 (${this._relationships.size}个关系, ${this._characterMemories.length}条记忆)`);
                }
            } catch (e) {
                console.error('无法加载角色数据', e);
            }
        },
        
        // 重置角色
        resetCharacter: function() {
            this._personality = {
                courage: 50, kindness: 70, curiosity: 80, trust: 60,
                optimism: 65, impulsive: 40, sociable: 55, stubborn: 45
            };
            this._emotions = {
                happiness: 50, fear: 0, anger: 0, sadness: 0,
                surprise: 0, disgust: 0, trust: 50, anticipation: 30
            };
            this._mood = 50;
            this._relationships.clear();
            this._characterMemories = [];
            this._innerThoughts = [];
            this._moodHistory = [];
            
            try {
                localStorage.removeItem('AIBOT_CHARACTER_DATA');
            } catch (e) {}
            
            console.log('🎭 角色数据已重置');
            this._showNotification('🎭 角色已重置');
        },
        
        // 重置学习数据
        resetLearning: function() {
            this._iq = 100;
            this._karma = 0;
            this._shameLevel = 0;
            this._learnedChoices.clear();
            this._learnedEvents.clear();
            this._badActions = [];
            this._goodActions = [];
            this._consecutiveStucks = 0;
            this._consecutiveBadChoices = 0;
            
            try {
                localStorage.removeItem('AIBOT_LEARNED_DATA');
            } catch (e) {}
            
            console.log('🔄 AI学习数据已重置');
            this._showNotification('🔄 AI记忆已清除');
            return true;
        },
        
        // 显示AI状态
        showAIStatus: function() {
            const iqLevel = this._iq < 50 ? '🥴 弱智' :
                           this._iq < 80 ? '😅 笨蛋' :
                           this._iq < 100 ? '😐 普通' :
                           this._iq < 130 ? '🙂 聪明' :
                           this._iq < 160 ? '😎 天才' : '🧠 超神';
            
            const karmaLevel = this._karma < -10 ? '👿 恶劣' :
                              this._karma < -3 ? '😠 差劲' :
                              this._karma < 3 ? '😐 中立' :
                              this._karma < 10 ? '😊 良好' : '😇 优秀';
            
            const traitsList = Array.from(this._evolutionTraits).map(t => this._getTraitName(t)).join(', ') || '无';
            
            console.log(`
╔═══════════════════════════════════════════════╗
║  🧠 AI状态报告 v3.2                           ║
╠═══════════════════════════════════════════════╣
║  智商: ${this._iq} ${iqLevel}
║  业力: ${this._karma} ${karmaLevel}
║  羞耻等级: ${this._shameLevel}/10
║  ─────────────────────────────────────────────
║  🧬 进化等级: Lv${this._evolutionLevel} (${this._experience}/${this._experienceToNextLevel} EXP)
║  已解锁特性: ${traitsList}
║  ─────────────────────────────────────────────
║  🛤️ 路线记忆: ${this._routeMemory.size} 条
║  直线行走: ${this._straightLineEnabled ? '✅ 开启' : '❌ 关闭'}
║  ─────────────────────────────────────────────
║  已学习选择: ${this._learnedChoices.size} 个
║  已学习事件: ${this._learnedEvents.size} 个
║  好行为记录: ${this._goodActions.length} 条
║  坏行为记录: ${this._badActions.length} 条
║  ─────────────────────────────────────────────
║  移动延迟: ${this._moveDelay}ms
║  连续卡住: ${this._consecutiveStucks}
║  连续错误: ${this._consecutiveBadChoices}
╚═══════════════════════════════════════════════╝
            `);
            
            return {
                iq: this._iq,
                karma: this._karma,
                shame: this._shameLevel,
                evolutionLevel: this._evolutionLevel,
                experience: this._experience,
                traits: Array.from(this._evolutionTraits),
                routeMemoryCount: this._routeMemory.size,
                learnedChoices: this._learnedChoices.size,
                learnedEvents: this._learnedEvents.size
            };
        },
        
        // 查看学习记录
        showLearned: function() {
            console.log('📚 === AI学习记录 ===');
            
            console.log('\n🗨️ 选择学习:');
            for (const [choice, data] of this._learnedChoices) {
                const rate = data.good + data.bad > 0 
                    ? (data.good / (data.good + data.bad) * 100).toFixed(0) 
                    : 0;
                console.log(`  "${choice}": 好${data.good} 坏${data.bad} (成功率${rate}%)`);
            }
            
            console.log('\n📍 事件学习:');
            for (const [key, data] of this._learnedEvents) {
                console.log(`  ${key}: 价值${data.value.toFixed(1)} 访问${data.visits}次`);
            }
            
            return {
                choices: Object.fromEntries(this._learnedChoices),
                events: Object.fromEntries(this._learnedEvents)
            };
        },
        
        // === 帮助 ===
        help: function() {
            console.log(`
╔═══════════════════════════════════════════════╗
║     🚗 RINNY DATE AI v3.2 自动驾驶系统        ║
╠═══════════════════════════════════════════════╣
║ v3.2 新功能:                                  ║
║ - 🛤️ 路线记忆: 记住成功路线,下次直接复用      ║
║ - 📐 直线行走: 优化A*路径,走最直接的路        ║
║ - 🧬 自主进化: 积累经验自动升级提升能力       ║
╠═══════════════════════════════════════════════╣
║ 基础控制:                                     ║
║ AIBot.start()         - 开启AI托管            ║
║ AIBot.stop()          - 关闭AI托管            ║
║ AIBot.toggle()        - 切换AI状态            ║
║ AIBot.goTo(x, y)      - 移动到坐标            ║
║ AIBot.goToMap(id,x,y) - 传送并移动            ║
║ AIBot.explore()       - 探索模式              ║
║                                               ║
║ 🛤️ 路线记忆系统 (v3.2 NEW):                   ║
║ AIBot.showRouteMemory()    - 查看路线记忆     ║
║ AIBot.startRouteRecording(map,x,y) - 录制路线 ║
║ AIBot.stopRouteRecording() - 停止录制         ║
║ AIBot._routeMemoryEnabled = true - 启用记忆   ║
║ AIBot._straightLineEnabled = true - 启用直走  ║
║                                               ║
║ 🧬 自主进化系统 (v3.2 NEW):                   ║
║ AIBot.showEvolution()      - 查看进化状态     ║
║ AIBot._evolutionLevel      - 当前进化等级     ║
║ AIBot._experience          - 当前经验值       ║
║ AIBot._evolutionTraits     - 已解锁特性       ║
║                                               ║
║ 🎮 周目推进系统:                              ║
║ AIBot._autoProgress = true - 自动推进周目     ║
║ AIBot.showProgress()     - 显示周目进度       ║
║ AIBot.resetProgress()    - 重置进度追踪       ║
║                                               ║
║ 🗨️ NPC AI系统:                                ║
║ AIBot._autoChoice = true - 自动选择对话选项   ║
║ AIBot.getSmartChoice(['选项1','选项2'])       ║
║                                               ║
║ 🔍 分析工具:                                  ║
║ AIBot.showGameStatus()   - 游戏状态           ║
║ AIBot.showAIStatus()     - AI完整状态         ║
║ AIBot.analyzeQuest()     - 分析任务           ║
║ AIBot.scanMapEvents()    - 扫描事件           ║
║                                               ║
║ 📍 坐标系统 (v3.3 NEW):                       ║
║ AIBot.getCoord()         - 获取当前坐标       ║
║ AIBot.getMouseCoord()    - 获取鼠标坐标       ║
║ AIBot.toggleCoordDisplay()- 切换坐标显示      ║
║ AIBot.toggleGrid()       - 切换网格显示       ║
║ AIBot._coordSystemEnabled = true - 启用坐标系 ║
║                                               ║
║ 👁️ OCR系统 (v3.3):                            ║
║ AIBot.captureScreen()    - 截图识别           ║
║ AIBot.ocrRegion(x,y,w,h) - 区域OCR            ║
║ AIBot.showOCRHistory()   - 查看OCR历史        ║
║                                               ║
║ 🎭 角色代入系统 (v3.4 NEW):                   ║
║ AIBot.showCharacter()    - 查看角色档案       ║
║ AIBot.showRelationships()- 查看NPC关系        ║
║ AIBot.showThoughts()     - 查看内心独白       ║
║ AIBot.getMoodDescription()- 获取心情描述      ║
║ AIBot.adjustPersonality(trait, delta)         ║
║ AIBot._immersionEnabled = true - 启用代入     ║
║ AIBot._showInnerThoughts = true - 显示独白    ║
║                                               ║
║ 🧠 AI架构系统 (v4.0 NEW):                     ║
║ AIBot.setAIMode('hybrid')  - 设置AI模式       ║
║   可选: hardcode, fsm, bt, hybrid             ║
║ AIBot.showAIArchitecture() - 查看架构状态     ║
║ AIBot.toggleAIDebug()      - 切换调试模式     ║
║ AIBot.hardCodeDecision()   - Hard Code决策    ║
║ AIBot.updateFSM()          - FSM状态机更新    ║
║ AIBot.tickBehaviorTree()   - 行为树执行       ║
║                                               ║
║ 🛤️ 寻路算法:                                  ║
║ AIBot.setPathfindingAlgorithm('auto')         ║
║ AIBot.showPathfindingStats() - 寻路统计       ║
║                                               ║
║ 😤 愤怒兴奋模型 (v5.0 NEW):                   ║
║ AIBot.addStimulus('attack', 50) - 添加刺激    ║
║ AIBot.showArousalModel() - 查看情绪状态       ║
║ AIBot.getEmotionalBehavior() - 获取行为倾向   ║
║                                               ║
║ 🤖 代理系统 (v5.0 NEW):                       ║
║ AIBot.addGoal('goto', {x,y}, priority)        ║
║ AIBot.showAgent() - 查看代理状态              ║
║ AIBot.updateKnowledge(type, key, value)       ║
║                                               ║
║ 👁️ 感知系统 (v5.0 NEW):                       ║
║ AIBot.perceiveVision() - 视觉感知             ║
║ AIBot.showPerception() - 查看感知状态         ║
║ AIBot.recall('关键词') - 回忆                 ║
║                                               ║
║ 🐦 群体行为 (v5.0 NEW):                       ║
║ AIBot.showFlocking() - 查看群体状态           ║
║ AIBot._flocking.enabled = true - 启用群体     ║
║                                               ║
║ 🔧 调试系统 (v5.0 NEW):                       ║
║ AIBot.toggleDebug() - 切换调试模式            ║
║ AIBot.showFullStatus() - 完整状态报告         ║
║ AIBot.exportDebugData() - 导出调试数据        ║
║                                               ║
║ 快捷键: F8-托管 F7-面板 C-坐标 G-网格         ║
║ T-OCR I-角色 M-独白 P-惩罚 O-奖励             ║
╚═══════════════════════════════════════════════╝
            `);
        },
        
        // === 📍 坐标系统 ===
        
        // 获取玩家坐标
        getCoord: function() {
            if (!$gamePlayer) return null;
            const coord = {
                mapId: $gameMap.mapId(),
                mapName: $dataMapInfos[$gameMap.mapId()]?.name || '未知',
                gridX: $gamePlayer.x,
                gridY: $gamePlayer.y,
                pixelX: $gamePlayer.screenX(),
                pixelY: $gamePlayer.screenY(),
                realX: $gamePlayer._realX,
                realY: $gamePlayer._realY,
                direction: $gamePlayer.direction()
            };
            console.log(`📍 玩家坐标: 地图${coord.mapId}(${coord.mapName}) 格子(${coord.gridX}, ${coord.gridY}) 像素(${coord.pixelX}, ${coord.pixelY})`);
            return coord;
        },
        
        // 获取鼠标坐标
        getMouseCoord: function() {
            const screenX = TouchInput.x;
            const screenY = TouchInput.y;
            
            // 转换为地图格子坐标
            const tileWidth = $gameMap.tileWidth();
            const tileHeight = $gameMap.tileHeight();
            const scrollX = $gameMap.displayX() * tileWidth;
            const scrollY = $gameMap.displayY() * tileHeight;
            
            const mapPixelX = screenX + scrollX;
            const mapPixelY = screenY + scrollY;
            const gridX = Math.floor(mapPixelX / tileWidth);
            const gridY = Math.floor(mapPixelY / tileHeight);
            
            this._mouseGridX = gridX;
            this._mouseGridY = gridY;
            this._lastMouseX = screenX;
            this._lastMouseY = screenY;
            
            const coord = {
                screenX: screenX,
                screenY: screenY,
                gridX: gridX,
                gridY: gridY,
                mapPixelX: mapPixelX,
                mapPixelY: mapPixelY
            };
            
            console.log(`🖱️ 鼠标坐标: 屏幕(${screenX}, ${screenY}) 格子(${gridX}, ${gridY})`);
            return coord;
        },
        
        // 获取事件坐标
        getEventCoord: function(eventId) {
            const event = $gameMap.event(eventId);
            if (!event) {
                console.log('❌ 事件不存在');
                return null;
            }
            const coord = {
                eventId: eventId,
                name: event.event().name,
                gridX: event.x,
                gridY: event.y,
                pixelX: event.screenX(),
                pixelY: event.screenY()
            };
            console.log(`📌 事件${eventId}(${coord.name}): 格子(${coord.gridX}, ${coord.gridY})`);
            return coord;
        },
        
        // 计算两点距离
        calcDistance: function(x1, y1, x2, y2) {
            const manhattan = Math.abs(x2 - x1) + Math.abs(y2 - y1);
            const euclidean = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            console.log(`📏 距离: (${x1},${y1}) -> (${x2},${y2}) 曼哈顿:${manhattan} 欧几里得:${euclidean.toFixed(2)}`);
            return { manhattan, euclidean };
        },
        
        // 计算到玩家的距离
        distanceToPlayer: function(x, y) {
            return this.calcDistance($gamePlayer.x, $gamePlayer.y, x, y);
        },
        
        // 切换坐标显示
        toggleCoordDisplay: function() {
            this._coordSystemEnabled = !this._coordSystemEnabled;
            console.log(`📍 坐标显示: ${this._coordSystemEnabled ? '开启' : '关闭'}`);
            this._showNotification(`📍 坐标显示: ${this._coordSystemEnabled ? '开启' : '关闭'}`);
            return this._coordSystemEnabled;
        },
        
        // 切换网格显示
        toggleGrid: function() {
            this._showGridOverlay = !this._showGridOverlay;
            console.log(`📐 网格显示: ${this._showGridOverlay ? '开启' : '关闭'}`);
            this._showNotification(`📐 网格显示: ${this._showGridOverlay ? '开启' : '关闭'}`);
            return this._showGridOverlay;
        },
        
        // 记录坐标历史
        _recordCoordHistory: function() {
            if (!$gamePlayer) return;
            
            const now = Date.now();
            const record = {
                time: now,
                mapId: $gameMap.mapId(),
                x: $gamePlayer.x,
                y: $gamePlayer.y
            };
            
            this._coordHistory.push(record);
            
            // 只保留最近500条
            if (this._coordHistory.length > 500) {
                this._coordHistory.shift();
            }
        },
        
        // 显示坐标历史
        showCoordHistory: function(count = 20) {
            console.log(`📍 === 坐标历史 (最近${count}条) ===`);
            const recent = this._coordHistory.slice(-count);
            for (const record of recent) {
                const time = new Date(record.time).toLocaleTimeString();
                console.log(`  ${time} - 地图${record.mapId}: (${record.x}, ${record.y})`);
            }
            return recent;
        },
        
        // 导出路径为数组
        exportPath: function() {
            const path = this._coordHistory.map(r => [r.x, r.y]);
            console.log('📤 导出路径:', JSON.stringify(path));
            return path;
        },
        
        // === 👁️ OCR识别系统 ===
        
        // 捕获屏幕并识别文字
        captureScreen: function() {
            if (!this._ocrEnabled) {
                console.log('❌ OCR未启用');
                return null;
            }
            
            console.log('📸 开始屏幕截图...');
            
            // 获取画布内容
            const canvas = document.querySelector('canvas');
            if (!canvas) {
                console.log('❌ 无法获取游戏画布');
                return null;
            }
            
            // 获取当前显示的文本（从游戏消息系统）
            const texts = this._extractGameTexts();
            
            if (texts.length > 0) {
                this._ocrLastResult = texts.join('\n');
                this._ocrHistory.push({
                    time: Date.now(),
                    texts: texts,
                    mapId: $gameMap?.mapId() || 0
                });
                
                console.log('📝 识别到的文字:');
                texts.forEach((text, i) => console.log(`  ${i + 1}. ${text}`));
                
                // 保留最近100条
                if (this._ocrHistory.length > 100) {
                    this._ocrHistory.shift();
                }
                
                return texts;
            }
            
            console.log('📝 当前无可识别文字');
            return [];
        },
        
        // 提取游戏中的文字
        _extractGameTexts: function() {
            const texts = [];
            
            // 1. 提取消息窗口文字
            if ($gameMessage && $gameMessage._texts) {
                texts.push(...$gameMessage._texts.filter(t => t && t.trim()));
            }
            
            // 2. 提取选择框文字
            if ($gameMessage && $gameMessage._choices) {
                texts.push(...$gameMessage._choices.filter(t => t && t.trim()));
            }
            
            // 3. 提取地图名称
            if ($gameMap && $dataMapInfos[$gameMap.mapId()]) {
                texts.push(`[地图] ${$dataMapInfos[$gameMap.mapId()].name}`);
            }
            
            // 4. 提取当前场景的窗口文字
            const scene = SceneManager._scene;
            if (scene) {
                // 遍历窗口
                if (scene._windowLayer && scene._windowLayer.children) {
                    for (const win of scene._windowLayer.children) {
                        if (win && win.contents && win._text) {
                            texts.push(win._text);
                        }
                    }
                }
            }
            
            // 5. 提取附近NPC名称
            if ($gameMap) {
                const events = $gameMap.events();
                for (const event of events) {
                    if (event && event.event() && event.event().name) {
                        const dist = Math.abs(event.x - $gamePlayer.x) + Math.abs(event.y - $gamePlayer.y);
                        if (dist <= 5) {
                            texts.push(`[NPC] ${event.event().name} @ (${event.x}, ${event.y})`);
                        }
                    }
                }
            }
            
            // 6. 提取变量/开关状态（用于调试）
            if ($gameVariables) {
                const sanValue = $gameVariables.value(this.VAR?.SAN || 1);
                texts.push(`[状态] SAN: ${sanValue}`);
            }
            
            return texts;
        },
        
        // 区域OCR
        ocrRegion: function(x, y, width, height) {
            console.log(`📸 区域OCR: (${x}, ${y}) ${width}x${height}`);
            
            // 获取该区域内的事件和元素
            const results = [];
            
            // 计算格子范围
            const tileWidth = $gameMap.tileWidth();
            const tileHeight = $gameMap.tileHeight();
            const startGridX = Math.floor(x / tileWidth);
            const startGridY = Math.floor(y / tileHeight);
            const endGridX = Math.ceil((x + width) / tileWidth);
            const endGridY = Math.ceil((y + height) / tileHeight);
            
            // 检查范围内的事件
            for (const event of $gameMap.events()) {
                if (event.x >= startGridX && event.x <= endGridX &&
                    event.y >= startGridY && event.y <= endGridY) {
                    results.push({
                        type: 'event',
                        name: event.event().name,
                        x: event.x,
                        y: event.y
                    });
                }
            }
            
            console.log(`📝 区域内找到 ${results.length} 个元素`);
            results.forEach(r => console.log(`  - ${r.type}: ${r.name} @ (${r.x}, ${r.y})`));
            
            return results;
        },
        
        // 获取当前对话文本
        getCurrentDialogue: function() {
            const dialogue = {
                speaker: '',
                text: '',
                choices: []
            };
            
            if ($gameMessage) {
                dialogue.text = $gameMessage._texts?.join('\n') || '';
                dialogue.choices = $gameMessage._choices || [];
                dialogue.faceName = $gameMessage._faceName || '';
            }
            
            console.log('💬 当前对话:', dialogue);
            return dialogue;
        },
        
        // 显示OCR历史
        showOCRHistory: function(count = 10) {
            console.log(`👁️ === OCR历史 (最近${count}条) ===`);
            const recent = this._ocrHistory.slice(-count);
            for (const record of recent) {
                const time = new Date(record.time).toLocaleTimeString();
                console.log(`\n[${time}] 地图${record.mapId}:`);
                record.texts.forEach(t => console.log(`  ${t}`));
            }
            return recent;
        },
        
        // 搜索OCR历史
        searchOCR: function(keyword) {
            const results = this._ocrHistory.filter(record => 
                record.texts.some(text => text.includes(keyword))
            );
            console.log(`🔍 搜索"${keyword}"找到 ${results.length} 条记录`);
            return results;
        },
        
        // 监听文字变化
        _watchTextChanges: function() {
            if (!this._ocrEnabled || !this._ocrAutoCapture) return;
            
            const now = Date.now();
            if (now - this._lastOCRTime < this._ocrCaptureInterval) return;
            
            this._lastOCRTime = now;
            this.captureScreen();
        }
    };

    //=========================================================================
    // 快捷键注册
    //=========================================================================
    Input.keyMapper[118] = 'f7';  // F7
    Input.keyMapper[119] = 'f8';  // F8
    Input.keyMapper[80] = 'keyP'; // P - 惩罚AI
    Input.keyMapper[79] = 'keyO'; // O - 奖励AI
    Input.keyMapper[67] = 'keyC'; // C - 切换坐标显示
    Input.keyMapper[71] = 'keyG'; // G - 切换网格显示
    Input.keyMapper[84] = 'keyT'; // T - OCR截图识别
    Input.keyMapper[73] = 'keyI'; // I - 显示角色信息
    Input.keyMapper[77] = 'keyM'; // M - 切换内心独白显示

    //=========================================================================
    // 场景更新钩子
    //=========================================================================
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        AIBot.update();
        this.updateAIKeys();
    };

    Scene_Map.prototype.updateAIKeys = function() {
        // F8 - 切换AI托管
        if (Input.isTriggered('f8')) {
            AIBot.toggle();
        }
        // F7 - 打开AI控制面板
        if (Input.isTriggered('f7')) {
            SceneManager.push(Scene_AIControl);
        }
        // P - 惩罚AI
        if (Input.isTriggered('keyP') && AIBot._enabled) {
            AIBot.punish('玩家手动惩罚', 2);
            SoundManager.playBuzzer();
        }
        // O - 奖励AI
        if (Input.isTriggered('keyO') && AIBot._enabled) {
            AIBot.reward('玩家手动奖励', 2);
            SoundManager.playOk();
        }
        // C - 切换坐标显示
        if (Input.isTriggered('keyC')) {
            AIBot.toggleCoordDisplay();
        }
        // G - 切换网格显示
        if (Input.isTriggered('keyG')) {
            AIBot.toggleGrid();
        }
        // T - OCR截图识别
        if (Input.isTriggered('keyT')) {
            AIBot.captureScreen();
        }
        // I - 显示角色信息
        if (Input.isTriggered('keyI')) {
            AIBot.showCharacter();
        }
        // M - 切换内心独白显示
        if (Input.isTriggered('keyM')) {
            AIBot._showInnerThoughts = !AIBot._showInnerThoughts;
            AIBot._showNotification(`💭 内心独白: ${AIBot._showInnerThoughts ? '开启' : '关闭'}`);
        }
    };

    //=========================================================================
    // AI状态显示精灵
    //=========================================================================
    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createAIStatusSprite();
        this.createAINotification();
        this.createCoordSprite();
        this.createGridOverlay();
    };

    Scene_Map.prototype.createAIStatusSprite = function() {
        this._aiStatusSprite = new Sprite_AIStatus();
        this.addChild(this._aiStatusSprite);
    };

    Scene_Map.prototype.createAINotification = function() {
        this._aiNotification = new Window_AINotification();
        this.addWindow(this._aiNotification);
    };
    
    Scene_Map.prototype.createCoordSprite = function() {
        this._coordSprite = new Sprite_CoordDisplay();
        this.addChild(this._coordSprite);
    };
    
    Scene_Map.prototype.createGridOverlay = function() {
        this._gridOverlay = new Sprite_GridOverlay();
        this.addChild(this._gridOverlay);
    };

    //=========================================================================
    // AI状态精灵
    //=========================================================================
    class Sprite_AIStatus extends Sprite {
        constructor() {
            super();
            this.bitmap = new Bitmap(220, 50);
            this.x = 10;
            this.y = 10;
            this._lastEnabled = null;
            this._lastMode = null;
            this._lastIQ = null;
            this._lastShame = null;
        }

        update() {
            super.update();
            // 更频繁地刷新以显示IQ变化
            if (this._lastEnabled !== AIBot._enabled || 
                this._lastMode !== AIBot._mode ||
                this._lastIQ !== AIBot._iq ||
                this._lastShame !== AIBot._shameLevel) {
                this.refresh();
                this._lastEnabled = AIBot._enabled;
                this._lastMode = AIBot._mode;
                this._lastIQ = AIBot._iq;
                this._lastShame = AIBot._shameLevel;
            }
        }

        refresh() {
            this.bitmap.clear();
            if (AIBot._enabled) {
                const modeText = {
                    'idle': '待机',
                    'explore': '探索',
                    'combat': '战斗',
                    'quest': '任务',
                    'goTo': '移动中'
                };
                
                // IQ颜色
                const iqColor = AIBot._iq < 50 ? '#FF4444' :
                               AIBot._iq < 80 ? '#FFAA00' :
                               AIBot._iq < 120 ? '#00FF00' : '#00FFFF';
                
                // 业力颜色
                const karmaIcon = AIBot._karma < -5 ? '👿' :
                                 AIBot._karma < 0 ? '😠' :
                                 AIBot._karma < 5 ? '😐' :
                                 AIBot._karma < 10 ? '😊' : '😇';
                
                const text = `🤖 AI: ${modeText[AIBot._mode] || AIBot._mode}`;
                const iqText = `🧠 IQ:${AIBot._iq} ${karmaIcon}`;
                
                this.bitmap.fontSize = 14;
                this.bitmap.textColor = '#00FF00';
                this.bitmap.outlineColor = '#000000';
                this.bitmap.outlineWidth = 3;
                this.bitmap.drawText(text, 0, 0, 200, 20, 'left');
                
                this.bitmap.textColor = iqColor;
                this.bitmap.drawText(iqText, 0, 16, 200, 20, 'left');
                
                // 羞耻状态
                if (AIBot._shameLevel > 0) {
                    this.bitmap.textColor = '#FF6666';
                    this.bitmap.drawText(`😅 羞耻:${AIBot._shameLevel}`, 100, 0, 100, 20, 'left');
                }
            }
        }
    }

    //=========================================================================
    // AI通知窗口
    //=========================================================================
    class Window_AINotification extends Window_Base {
        constructor() {
            const rect = new Rectangle(Graphics.width / 2 - 150, 100, 300, 60);
            super(rect);
            this.opacity = 0;
            this.contentsOpacity = 0;
            this._showTimer = 0;
            this._text = '';
        }

        show(text) {
            this._text = text;
            this._showTimer = 120;
            this.refresh();
        }

        update() {
            super.update();
            if (this._showTimer > 0) {
                this._showTimer--;
                this.contentsOpacity = Math.min(255, this.contentsOpacity + 20);
                this.opacity = Math.min(200, this.opacity + 15);
            } else {
                this.contentsOpacity = Math.max(0, this.contentsOpacity - 10);
                this.opacity = Math.max(0, this.opacity - 10);
            }
        }

        refresh() {
            this.contents.clear();
            this.contents.fontSize = 20;
            this.drawText(this._text, 0, 0, this.contentsWidth(), 'center');
        }
    }

    //=========================================================================
    // 📍 坐标显示精灵
    //=========================================================================
    class Sprite_CoordDisplay extends Sprite {
        constructor() {
            super();
            this.bitmap = new Bitmap(300, 80);
            this.x = Graphics.width - 310;
            this.y = 10;
            this._lastPlayerX = -1;
            this._lastPlayerY = -1;
            this._lastMouseX = -1;
            this._lastMouseY = -1;
        }

        update() {
            super.update();
            
            if (!AIBot._coordSystemEnabled) {
                this.visible = false;
                return;
            }
            this.visible = true;
            
            // 更新鼠标坐标
            const mouseX = TouchInput.x;
            const mouseY = TouchInput.y;
            const tileWidth = $gameMap?.tileWidth() || 48;
            const tileHeight = $gameMap?.tileHeight() || 48;
            const scrollX = ($gameMap?.displayX() || 0) * tileWidth;
            const scrollY = ($gameMap?.displayY() || 0) * tileHeight;
            const mouseGridX = Math.floor((mouseX + scrollX) / tileWidth);
            const mouseGridY = Math.floor((mouseY + scrollY) / tileHeight);
            
            // 检查是否需要刷新
            const playerX = $gamePlayer?.x || 0;
            const playerY = $gamePlayer?.y || 0;
            
            if (this._lastPlayerX !== playerX || 
                this._lastPlayerY !== playerY ||
                this._lastMouseX !== mouseGridX ||
                this._lastMouseY !== mouseGridY) {
                this.refresh(playerX, playerY, mouseGridX, mouseGridY, mouseX, mouseY);
                this._lastPlayerX = playerX;
                this._lastPlayerY = playerY;
                this._lastMouseX = mouseGridX;
                this._lastMouseY = mouseGridY;
            }
        }

        refresh(playerX, playerY, mouseGridX, mouseGridY, mouseScreenX, mouseScreenY) {
            this.bitmap.clear();
            
            const mapId = $gameMap?.mapId() || 0;
            const mapName = $dataMapInfos?.[mapId]?.name || '未知';
            
            this.bitmap.fontSize = 12;
            this.bitmap.textColor = '#FFFFFF';
            this.bitmap.outlineColor = '#000000';
            this.bitmap.outlineWidth = 3;
            
            // 地图信息
            this.bitmap.textColor = '#88CCFF';
            this.bitmap.drawText(`📍 地图${mapId}: ${mapName}`, 0, 0, 300, 16, 'left');
            
            // 玩家坐标
            this.bitmap.textColor = '#00FF00';
            this.bitmap.drawText(`👤 玩家: (${playerX}, ${playerY})`, 0, 18, 300, 16, 'left');
            
            // 鼠标坐标
            this.bitmap.textColor = '#FFFF00';
            this.bitmap.drawText(`🖱️ 鼠标: (${mouseGridX}, ${mouseGridY}) [${mouseScreenX}, ${mouseScreenY}]`, 0, 36, 300, 16, 'left');
            
            // 距离
            const dist = Math.abs(mouseGridX - playerX) + Math.abs(mouseGridY - playerY);
            this.bitmap.textColor = '#FF88FF';
            this.bitmap.drawText(`📏 距离: ${dist} 格`, 0, 54, 300, 16, 'left');
        }
    }

    //=========================================================================
    // 📐 网格覆盖精灵
    //=========================================================================
    class Sprite_GridOverlay extends Sprite {
        constructor() {
            super();
            this.bitmap = new Bitmap(Graphics.width, Graphics.height);
            this.x = 0;
            this.y = 0;
            this._lastDisplayX = -1;
            this._lastDisplayY = -1;
            this.opacity = 128;
        }

        update() {
            super.update();
            
            if (!AIBot._showGridOverlay) {
                this.visible = false;
                return;
            }
            this.visible = true;
            
            const displayX = $gameMap?.displayX() || 0;
            const displayY = $gameMap?.displayY() || 0;
            
            if (this._lastDisplayX !== displayX || this._lastDisplayY !== displayY) {
                this.refresh();
                this._lastDisplayX = displayX;
                this._lastDisplayY = displayY;
            }
        }

        refresh() {
            this.bitmap.clear();
            
            const tileWidth = $gameMap?.tileWidth() || 48;
            const tileHeight = $gameMap?.tileHeight() || 48;
            const displayX = $gameMap?.displayX() || 0;
            const displayY = $gameMap?.displayY() || 0;
            
            const offsetX = -(displayX % 1) * tileWidth;
            const offsetY = -(displayY % 1) * tileHeight;
            
            const ctx = this.bitmap._context;
            if (!ctx) return;
            
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 1;
            
            // 绘制垂直线
            for (let x = offsetX; x < Graphics.width; x += tileWidth) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, Graphics.height);
                ctx.stroke();
            }
            
            // 绘制水平线
            for (let y = offsetY; y < Graphics.height; y += tileHeight) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(Graphics.width, y);
                ctx.stroke();
            }
            
            // 绘制坐标数字
            ctx.font = '10px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            
            const startGridX = Math.floor(displayX);
            const startGridY = Math.floor(displayY);
            
            let gridX = startGridX;
            for (let x = offsetX; x < Graphics.width; x += tileWidth) {
                let gridY = startGridY;
                for (let y = offsetY; y < Graphics.height; y += tileHeight) {
                    ctx.fillText(`${gridX},${gridY}`, x + 2, y + 10);
                    gridY++;
                }
                gridX++;
            }
            
            // 高亮玩家位置
            if ($gamePlayer) {
                const playerScreenX = (($gamePlayer.x - displayX) * tileWidth);
                const playerScreenY = (($gamePlayer.y - displayY) * tileHeight);
                
                ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                ctx.fillRect(playerScreenX, playerScreenY, tileWidth, tileHeight);
            }
            
            // 高亮鼠标位置
            const mouseX = TouchInput.x;
            const mouseY = TouchInput.y;
            const mouseGridX = Math.floor((mouseX + displayX * tileWidth) / tileWidth);
            const mouseGridY = Math.floor((mouseY + displayY * tileHeight) / tileHeight);
            const mouseScreenX = ((mouseGridX - displayX) * tileWidth);
            const mouseScreenY = ((mouseGridY - displayY) * tileHeight);
            
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(mouseScreenX, mouseScreenY, tileWidth, tileHeight);
        }
    }

    //=========================================================================
    // AI控制面板场景
    //=========================================================================
    class Scene_AIControl extends Scene_MenuBase {
        create() {
            super.create();
            this.createAICommandWindow();
            this.createAIStatusWindow();
        }

        createAICommandWindow() {
            const rect = new Rectangle(0, this.mainAreaTop(), 300, this.mainAreaHeight());
            this._commandWindow = new Window_AICommand(rect);
            this._commandWindow.setHandler('toggle', this.commandToggle.bind(this));
            this._commandWindow.setHandler('explore', this.commandExplore.bind(this));
            this._commandWindow.setHandler('autoprogress', this.commandAutoProgress.bind(this));
            this._commandWindow.setHandler('gamelogic', this.commandGameLogic.bind(this));
            this._commandWindow.setHandler('autochoice', this.commandAutoChoice.bind(this));
            this._commandWindow.setHandler('autoheal', this.commandAutoHeal.bind(this));
            this._commandWindow.setHandler('autointeract', this.commandAutoInteract.bind(this));
            this._commandWindow.setHandler('skiptransfer', this.commandSkipTransfer.bind(this));
            this._commandWindow.setHandler('battleai', this.commandBattleAI.bind(this));
            this._commandWindow.setHandler('showprogress', this.commandShowProgress.bind(this));
            this._commandWindow.setHandler('resetprogress', this.commandResetProgress.bind(this));
            this._commandWindow.setHandler('resetinteract', this.commandResetInteract.bind(this));
            this._commandWindow.setHandler('speed', this.commandSpeed.bind(this));
            this._commandWindow.setHandler('adslevel', this.commandADSLevel.bind(this));
            this._commandWindow.setHandler('showads', this.commandShowADS.bind(this));
            this._commandWindow.setHandler('togglelearning', this.commandToggleLearning.bind(this));
            this._commandWindow.setHandler('punishai', this.commandPunishAI.bind(this));
            this._commandWindow.setHandler('rewardai', this.commandRewardAI.bind(this));
            this._commandWindow.setHandler('showlearned', this.commandShowLearned.bind(this));
            this._commandWindow.setHandler('resetlearning', this.commandResetLearning.bind(this));
            this._commandWindow.setHandler('cancel', this.popScene.bind(this));
            this.addWindow(this._commandWindow);
        }

        createAIStatusWindow() {
            const rect = new Rectangle(300, this.mainAreaTop(), Graphics.boxWidth - 300, this.mainAreaHeight());
            this._statusWindow = new Window_AIStatusInfo(rect);
            this.addWindow(this._statusWindow);
        }

        commandToggle() {
            AIBot.toggle();
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }

        commandExplore() {
            AIBot.explore();
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }

        commandAutoHeal() {
            AIBot._autoHeal = !AIBot._autoHeal;
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._commandWindow.activate();
        }

        commandAutoInteract() {
            AIBot._autoInteract = !AIBot._autoInteract;
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._commandWindow.activate();
        }

        commandBattleAI() {
            AIBot._battleAI = !AIBot._battleAI;
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._commandWindow.activate();
        }

        commandSkipTransfer() {
            AIBot._skipTransferEvents = !AIBot._skipTransferEvents;
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }

        commandResetInteract() {
            AIBot.resetInteractions();
            SoundManager.playOk();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }

        commandGameLogic() {
            AIBot._gameLogic = !AIBot._gameLogic;
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }

        commandAnalyzeQuest() {
            AIBot.analyzeQuest();
            AIBot.showGameStatus();
            SoundManager.playOk();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }

        commandAutoChoice() {
            AIBot._autoChoice = !AIBot._autoChoice;
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }

        commandAutoProgress() {
            AIBot._autoProgress = !AIBot._autoProgress;
            if (AIBot._autoProgress) {
                AIBot._skipTransferEvents = false; // 开启周目推进时允许传送
            }
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }

        commandShowProgress() {
            AIBot.showProgress();
            SoundManager.playOk();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }

        commandResetProgress() {
            AIBot.resetProgress();
            SoundManager.playOk();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }

        commandCheckItems() {
            AIBot.checkRequiredItems();
            // 显示物品状态
            const items = [
                { id: AIBot.ITEM.BODY_BAG, name: '裹尸袋' },
                { id: AIBot.ITEM.BLOOD_REMOVER, name: '除血剂' },
                { id: AIBot.ITEM.SCREWDRIVER, name: '螺丝刀' },
                { id: AIBot.ITEM.CHAINSAW, name: '电锯' },
                { id: AIBot.ITEM.CROWBAR, name: '撬棍' },
                { id: AIBot.ITEM.WAKE_SPRAY, name: '清醒喷雾' },
            ];
            console.log('📦 === 物品检查 ===');
            for (const item of items) {
                const has = AIBot.hasItem(item.id);
                const count = AIBot.itemCount(item.id);
                console.log(`  ${has ? '✓' : '✗'} ${item.name}: ${count}`);
            }
            SoundManager.playOk();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }

        commandSpeed() {
            // 速度循环: 正常 -> 快速 -> 极速 -> 瞬移 -> 慢速 -> 正常
            const speeds = [
                { delay: 100, steps: 1, name: '正常' },
                { delay: 50, steps: 2, name: '快速' },
                { delay: 30, steps: 3, name: '极速' },
                { delay: 10, steps: 5, name: '瞬移' },
                { delay: 200, steps: 1, name: '慢速' }
            ];
            
            // 找当前速度索引
            let currentIdx = speeds.findIndex(s => s.delay === AIBot._moveDelay);
            if (currentIdx === -1) currentIdx = 0;
            
            // 切换到下一个
            const nextIdx = (currentIdx + 1) % speeds.length;
            AIBot._moveDelay = speeds[nextIdx].delay;
            AIBot._movePerUpdate = speeds[nextIdx].steps;
            
            console.log(`⚡ 速度设置: ${speeds[nextIdx].name} (延迟${speeds[nextIdx].delay}ms, 每次${speeds[nextIdx].steps}步)`);
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._commandWindow.activate();
        }
        
        commandADSLevel() {
            // 循环切换 L0 -> L1 -> L2 -> L3 -> L4 -> L5 -> L0
            const newLevel = (AIBot._adsLevel + 1) % 6;
            AIBot.setADSLevel(newLevel);
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }
        
        commandShowADS() {
            AIBot.showADSStatus();
            SoundManager.playOk();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }
        
        commandToggleLearning() {
            AIBot._learningEnabled = !AIBot._learningEnabled;
            AIBot._punishmentEnabled = AIBot._learningEnabled;
            SoundManager.playOk();
            this._commandWindow.refresh();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }
        
        commandPunishAI() {
            AIBot.punish('玩家通过面板惩罚', 2);
            SoundManager.playBuzzer();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }
        
        commandRewardAI() {
            AIBot.reward('玩家通过面板奖励', 2);
            SoundManager.playOk();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }
        
        commandShowLearned() {
            AIBot.showLearned();
            AIBot.showAIStatus();
            SoundManager.playOk();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }
        
        commandResetLearning() {
            AIBot.resetLearning();
            SoundManager.playOk();
            this._statusWindow.refresh();
            this._commandWindow.activate();
        }
    }

    //=========================================================================
    // AI命令窗口
    //=========================================================================
    class Window_AICommand extends Window_Command {
        makeCommandList() {
            const onOff = AIBot._enabled ? '✓开启' : '✗关闭';
            this.addCommand(`🤖 AI托管: ${onOff}`, 'toggle');
            this.addCommand('🔍 开始探索', 'explore');
            this.addCommand(`🎯 周目推进: ${AIBot._autoProgress ? '✓' : '✗'}`, 'autoprogress');
            this.addCommand(`🎮 游戏逻辑: ${AIBot._gameLogic ? '✓' : '✗'}`, 'gamelogic');
            this.addCommand(`🗨️ 自动选择: ${AIBot._autoChoice ? '✓' : '✗'}`, 'autochoice');
            this.addCommand(`💊 自动恢复: ${AIBot._autoHeal ? '✓' : '✗'}`, 'autoheal');
            this.addCommand(`💬 自动交互: ${AIBot._autoInteract ? '✓' : '✗'}`, 'autointeract');
            this.addCommand(`🚪 跳过传送点: ${AIBot._skipTransferEvents ? '✓' : '✗'}`, 'skiptransfer');
            this.addCommand(`⚔️ 战斗AI: ${AIBot._battleAI ? '✓' : '✗'}`, 'battleai');
            this.addCommand('📊 显示周目进度', 'showprogress');
            this.addCommand('🔄 重置进度追踪', 'resetprogress');
            this.addCommand('🔄 重置交互记录', 'resetinteract');
            this.addCommand(`🚗 ADS等级: L${AIBot._adsLevel}`, 'adslevel');
            this.addCommand('📡 显示ADS状态', 'showads');
            this.addCommand(`🧠 学习系统: ${AIBot._learningEnabled ? '✓' : '✗'}`, 'togglelearning');
            this.addCommand('🔨 惩罚AI (P键)', 'punishai');
            this.addCommand('🎁 奖励AI (O键)', 'rewardai');
            this.addCommand('📚 显示学习记录', 'showlearned');
            this.addCommand('🔄 重置AI记忆', 'resetlearning');
            
            const speedText = {
                10: '瞬移',
                30: '极速',
                50: '快速',
                100: '正常',
                200: '慢速'
            };
            this.addCommand(`⚡ 速度: ${speedText[AIBot._moveDelay] || '正常'}`, 'speed');
        }
    }

    //=========================================================================
    // AI状态信息窗口
    //=========================================================================
    class Window_AIStatusInfo extends Window_Base {
        refresh() {
            this.contents.clear();
            let y = 0;
            const lineHeight = 28;
            
            this.contents.fontSize = 18;
            this.drawText('🤖 AI代打系统 v3.1', 0, y, this.contentsWidth(), 'center');
            y += lineHeight * 1.2;
            
            // 🧠 AI智商和业力显示
            const iqColor = AIBot._iq < 50 ? '#FF4444' :
                           AIBot._iq < 80 ? '#FFAA00' :
                           AIBot._iq < 120 ? '#66FF66' : '#00FFFF';
            const karmaColor = AIBot._karma < 0 ? '#FF6666' : '#66FF66';
            
            this.contents.fontSize = 14;
            this.contents.textColor = iqColor;
            this.drawText(`🧠 智商: ${AIBot._iq}`, 0, y, 100);
            this.contents.textColor = karmaColor;
            this.drawText(`业力: ${AIBot._karma}`, 100, y, 100);
            this.resetTextColor();
            this.drawText(`羞耻: ${AIBot._shameLevel}/10`, 200, y, 100);
            y += lineHeight;
            
            // ADS状态
            const adsLevel = AIBot.ADS_LEVELS[AIBot._adsLevel];
            const safetyIcon = {
                'normal': '🟢',
                'warning': '🟡', 
                'critical': '🟠',
                'emergency': '🔴'
            }[AIBot._safety.systemStatus];
            
            this.drawText(`🚗 ADS: ${adsLevel.name} ${safetyIcon}  |  健康: ${AIBot._diagnostics.systemHealth}%`, 0, y, this.contentsWidth());
            y += lineHeight;
            
            this.drawText(`状态: ${AIBot._enabled ? '🟢 运行中' : '🔴 已停止'}  |  学习: ${AIBot._learningEnabled ? '✓' : '✗'}  |  逻辑: ${AIBot._gameLogic ? '✓' : '✗'}`, 0, y, this.contentsWidth());
            y += lineHeight;
            
            const modeNames = {
                'idle': '待机',
                'explore': '自动探索',
                'combat': '战斗模式',
                'quest': '任务模式',
                'goTo': '移动到目标'
            };
            this.drawText(`模式: ${modeNames[AIBot._mode] || AIBot._mode}`, 0, y, this.contentsWidth());
            y += lineHeight;
            
            if ($gamePlayer && $gameMap) {
                const mapName = $dataMapInfos[$gameMap.mapId()]?.name || '未知';
                this.drawText(`位置: 地图${$gameMap.mapId()}(${mapName}) (${$gamePlayer.x}, ${$gamePlayer.y})`, 0, y, this.contentsWidth());
                y += lineHeight;
            }
            
            // 计算当前地图探索覆盖率
            let coverageText = `已探索: ${AIBot._exploredTiles.size} 格`;
            if (AIBot._mapWalkableCache && AIBot._mapWalkableCache.mapId === $gameMap?.mapId()) {
                const total = AIBot._mapWalkableCache.tiles.length;
                const mapId = $gameMap.mapId();
                let explored = 0;
                for (const tile of AIBot._mapWalkableCache.tiles) {
                    if (AIBot._exploredTiles.has(`${mapId}_${tile.x}_${tile.y}`)) {
                        explored++;
                    }
                }
                const coverage = total > 0 ? (explored / total * 100).toFixed(1) : 0;
                coverageText = `地图覆盖: ${coverage}% (${explored}/${total}格)`;
            }
            this.drawText(coverageText, 0, y, this.contentsWidth());
            y += lineHeight;
            
            // 显示周目推进状态
            if (AIBot._autoProgress) {
                const idleSeconds = Math.floor(AIBot._idleTime / 1000);
                const mapTime = AIBot._mapExploreTime.get($gameMap?.mapId()) || 0;
                const mapSeconds = Math.floor(mapTime / 1000);
                this.contents.textColor = '#FFD700';
                this.drawText(`🎯 周目推进中 | 空闲:${idleSeconds}s 地图:${mapSeconds}s`, 0, y, this.contentsWidth());
                this.resetTextColor();
                y += lineHeight;
                this.drawText(`已访问地图: ${AIBot._visitedMaps.size}个`, 0, y, this.contentsWidth());
                y += lineHeight;
            }
            
            // 显示游戏状态
            this.changeTextColor(ColorManager.systemColor());
            this.drawText('--- 🎮 游戏状态 ---', 0, y, this.contentsWidth());
            y += lineHeight;
            this.resetTextColor();
            
            if ($gameVariables) {
                const san = AIBot.getVar(AIBot.VAR.SAN);
                const sanColor = san < 30 ? '#FF6666' : san < 60 ? '#FFCC66' : '#66FF66';
                this.contents.textColor = sanColor;
                this.drawText(`SAN值: ${san}`, 0, y, this.contentsWidth());
                this.resetTextColor();
                y += lineHeight;
                
                this.drawText(`主线: ${AIBot.getVar(AIBot.VAR.MAINLINE)} | 主线2: ${AIBot.getVar(AIBot.VAR.MAINLINE2)}`, 0, y, this.contentsWidth());
                y += lineHeight;
                
                this.drawText(`Zinnia值: ${AIBot.getVar(AIBot.VAR.ZINNIA)}`, 0, y, this.contentsWidth());
                y += lineHeight;
            }
            
            // 显示关键物品
            this.changeTextColor(ColorManager.systemColor());
            this.drawText('--- 📦 关键物品 ---', 0, y, this.contentsWidth());
            y += lineHeight;
            this.resetTextColor();
            
            const keyItems = [
                { id: AIBot.ITEM.BODY_BAG, name: '裹尸袋' },
                { id: AIBot.ITEM.BLOOD_REMOVER, name: '除血剂' },
                { id: AIBot.ITEM.SCREWDRIVER, name: '螺丝刀' },
            ];
            let itemText = '';
            for (const item of keyItems) {
                const has = AIBot.hasItem(item.id);
                itemText += `${has ? '✓' : '✗'}${item.name} `;
            }
            this.drawText(itemText, 0, y, this.contentsWidth());
            y += lineHeight;
            
            // 显示当前任务
            if (AIBot._currentQuest && AIBot._currentQuest.description) {
                this.changeTextColor(ColorManager.systemColor());
                this.drawText('--- 📋 当前任务 ---', 0, y, this.contentsWidth());
                y += lineHeight;
                this.resetTextColor();
                this.drawText(AIBot._currentQuest.description, 0, y, this.contentsWidth());
                y += lineHeight;
            }
            
            // 显示交互统计
            this.changeTextColor(ColorManager.systemColor());
            this.drawText('--- 交互统计 ---', 0, y, this.contentsWidth());
            y += lineHeight;
            this.resetTextColor();
            
            this.drawText(`已交互: ${AIBot._interactedEvents.size} | 传送点: ${AIBot._transferEvents.size} | 黑名单: ${AIBot._blacklistedEvents.size}`, 0, y, this.contentsWidth());
            y += lineHeight * 1.2;
            
            this.contents.fontSize = 12;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText('F7-面板 | F8-AI开关 | 控制台: AIBot.help()', 0, y, this.contentsWidth());
        }
    }

    // 导出类
    window.Scene_AIControl = Scene_AIControl;
    window.Window_AICommand = Window_AICommand;
    window.Sprite_AIStatus = Sprite_AIStatus;

    //=========================================================================
    // 战斗场景AI控制
    //=========================================================================
    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);
        if (AIBot._enabled && AIBot._battleAI) {
            this.updateBattleAI();
        }
    };

    Scene_Battle.prototype.updateBattleAI = function() {
        // 自动战斗逻辑
        if (BattleManager.isInputting() && BattleManager.actor()) {
            const actor = BattleManager.actor();
            if (!actor.isConfused()) {
                AIBot._selectBattleAction(actor);
                // 延迟执行以便看到动作
                setTimeout(() => {
                    if (BattleManager.isInputting()) {
                        BattleManager.selectNextCommand();
                    }
                }, 200);
            }
        }
    };

    //=========================================================================
    // 地图切换时清理路径
    //=========================================================================
    const _Game_Player_performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        _Game_Player_performTransfer.call(this);
        // 地图切换后重置路径和缓存
        AIBot._path = [];
        AIBot._pathIndex = 0;
        AIBot._stuckCounter = 0;
        AIBot._mapWalkableCache = null; // 清除地图缓存，重新扫描
        console.log('🤖 地图切换，重置AI路径和缓存');
    };

    //=========================================================================
    // 启动提示
    //=========================================================================
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        
        // 加载AI学习数据
        AIBot._loadLearnedData();
        
        console.log(`
╔═══════════════════════════════════════════════╗
║  🤖 RINNY DATE AI v3.1 - 状态机+Rating系统    ║
╠═══════════════════════════════════════════════╣
║  F7  - AI控制面板    F8  - 开关AI             ║
║  P   - 惩罚AI        O   - 奖励AI             ║
║                                               ║
║  🎭 状态机系统 (参考RPG Maker事件页):         ║
║  IDLE     - 待机                              ║
║  EXPLORE  - 探索地图                          ║
║  QUEST    - 执行任务                          ║
║  SHOPPING - 购物模式                          ║
║  RETREAT  - 撤退回家                          ║
║  EMERGENCY- 紧急状态                          ║
║                                               ║
║  ⚔️ 战斗AI (参考Rating优先级系统):            ║
║  Rating 9 - 复活队友                          ║
║  Rating 8 - 紧急治疗 (HP<30%)                 ║
║  Rating 7 - 解除异常状态                      ║
║  Rating 6 - 施加增益/护盾                     ║
║  Rating 5 - 攻击最弱敌人                      ║
║  Rating 1 - 防御                              ║
║                                               ║
║  AIBot.showStateMachine() - 状态机状态        ║
║  AIBot.showADSStatus()    - ADS系统状态       ║
╚═══════════════════════════════════════════════╝
        `);
    };

})();

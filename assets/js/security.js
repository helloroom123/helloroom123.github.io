(function(_0x1a2b){
    // 基础配置混淆
    const _0x4c3d = {
        'msg1': '\x57\x41\x52\x4e\x49\x4e\x47', // WARNING
        'msg2': '\x44\x65\x74\x65\x63\x74\x65\x64', // Detected
        'kill': '\x61\x62\x6f\x75\x74\x3a\x62\x6c\x61\x6e\x6b' // about:blank
    };

    // 1. 禁用所有右键和快捷键
    function disableInput() {
        document['\x61\x64\x64\x45\x76\x65\x6e\x74\x4c\x69\x73\x74\x65\x6e\x65\x72']('contextmenu', e => e.preventDefault());
        document['\x61\x64\x64\x45\x76\x65\x6e\x74\x4c\x69\x73\x74\x65\x6e\x65\x72']('keydown', e => {
            // F12, Ctrl+Shift+I/J/C, Ctrl+U
            if(e.keyCode == 123 || (e.ctrlKey && e.shiftKey && [73, 74, 67].includes(e.keyCode)) || (e.ctrlKey && e.keyCode == 85)) {
                e.preventDefault();
                return false;
            }
        });
    }

    // 2. 高级 Console 封锁 (Trap Console)
    function trapConsole() {
        const _log = console.log;
        const _warn = console.warn;
        const _error = console.error;
        const _clear = console.clear;
        
        // 覆盖原生方法，使其失效或产生误导
        console.log = console.warn = console.error = console.info = function() {
            // 可以在这里插入虚假日志
        };
        console.clear = function() {}; // 禁止用户清屏
    }

    // 3. 调试器检测与内存炸弹 (Debugger Bomb)
    function antiDebug() {
        // 方式 A: 时间差检测
        setInterval(function() {
            const start = performance.now();
            // 这里的 debugger 会卡住开启控制台的人
            (function(){}).constructor('debugger')(); 
            const end = performance.now();
            
            // 如果执行时间超过 50ms，说明遇到了断点
            if (end - start > 50) {
                punish();
            }
        }, 2000);

        // 方式 B: 宽高检测 (当控制台作为独立窗口打开时无效，但在嵌入模式有效)
        window.addEventListener('resize', function() {
            if ((window.outerWidth - window.innerWidth) > 160 || (window.outerHeight - window.innerHeight) > 160) {
                // 怀疑打开了控制台
            }
        });
    }

    // 4. 惩罚机制 (Punishment)
    function punish() {
        try {
            // 清空页面
            document.body.innerHTML = '';
            // 写入死循环警告
            document.write('<h1 style="color:red;font-size:50px;text-align:center;margin-top:20%">SYSTEM HALTED</h1>');
            // 强制跳转或卡死
            window.location.href = _0x4c3d.kill;
        } catch(e) {}
    }

    // 5. 源码保护与防油猴 (Source Integrity & Anti-Tampermonkey)
    function integrityCheck() {
        // A. 常见的用户脚本管理器变量
        const gmVars = [
            'GM', 'GM_info', 'GM_xmlhttpRequest', 'unsafeWindow', 
            'Tampermonkey', 'Violentmonkey', 'Greasemonkey'
        ];

        // 检查这些变量是否存在
        for (const v of gmVars) {
            if (window[v] !== undefined) {
                // 发现脚本管理器环境
                punish();
                return;
            }
        }

        // B. 蜜罐陷阱：尝试定义这些变量，如果报错或被修改，说明有插件在干预
        try {
            for (const v of gmVars) {
                if (!window[v]) {
                    Object.defineProperty(window, v, {
                        get: function() {
                            punish(); // 只要有人试图读取 GM 变量，直接自毁
                            return null;
                        },
                        set: function() {
                            punish(); // 只要有人试图写入（插件初始化），直接自毁
                        },
                        configurable: false
                    });
                }
            }
        } catch(e) {}

        // C. 原生方法完整性检查
        // 油猴脚本经常通过 Hook 原生方法来实现功能
        function isNative(fn) {
            return fn.toString().indexOf('native code') !== -1;
        }

        if (!isNative(window.addEventListener) || 
            !isNative(document.createElement) || 
            !isNative(document.appendChild)) {
            // 核心 DOM 方法被篡改
            punish();
        }

        // D. 监控脚本注入 (Script Injection Monitor)
        // 许多脚本通过插入 script 标签运行
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    // 如果发现了新的 script 标签，且没有 src (内联脚本) 或者 src 是未知的
                    if (node.tagName === 'SCRIPT') {
                        // 允许我们自己的脚本（如果有特定 id 或 class 可以加白名单）
                        // 这里采取激进策略：页面加载完成后，禁止任何新脚本注入
                        if (document.readyState === 'complete') {
                            node.remove(); // 移除注入的脚本
                            // punish(); // 可选：直接惩罚
                        }
                    }
                });
            });
        });
        
        // 监控 head 和 body
        if (document.documentElement) {
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }
    }

    // 初始化
    disableInput();
    trapConsole();
    antiDebug();
    integrityCheck();
    
    // 混淆后的自调用，防止 toString 查看
    (function(){
        try {
            var _0x = Function('return (function() {}.constructor("return this")( ));');
            var _r = _0x();
            // _r['\x63\x6f\x6e\x73\x6f\x6c\x65']['\x6c\x6f\x67'] = function(){};
        } catch(e) {}
    })();

})();

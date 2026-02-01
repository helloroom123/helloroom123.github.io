// App Logic
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadUserInfo();
    loadNews();
    checkPWA();
});

// Tab Switching
function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.dataset.tab;
            switchTab(target);
        });
    });
}

function switchTab(tabId) {
    // Update Nav
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');

    // Update Pages
    document.querySelectorAll('.tab-page').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Update Header
    const titles = {
        'home': 'Aurora Center',
        'games': '游戏库 / Games',
        'community': '社区 / Community',
        'system': '系统状态 / System'
    };
    document.getElementById('page-title').innerText = titles[tabId] || 'Aurora Center';
}

// User Info
function loadUserInfo() {
    const userStr = localStorage.getItem('aurora_user_info');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('user-name').innerText = user.username || 'User';
        const pointsEl = document.getElementById('system-points');
        if(pointsEl) pointsEl.innerText = user.points || 0;
    }
}

function logout() {
    localStorage.removeItem('aurora_user_token');
    localStorage.removeItem('aurora_user_info');
    window.location.href = '../index.html';
}

// News Loader
async function loadNews() {
    const container = document.getElementById('news-feed');
    if(!container) return;

    try {
        // Use the main site's API logic (mocked here or fetched via proxy)
        // For now, static mock since we are in a sub-folder and might have CORS or path issues
        // Ideally: fetch('/api/news')
        
        // Simulating data
        const news = [
            { date: '2026.01.25', title: 'Aurora Center 移动端适配完成', tag: 'UPDATE' },
            { date: '2026.01.20', title: 'Rinny Date 积分系统上线', tag: 'GAME' },
            { date: '2026.01.18', title: '企鹅技术支持服务开启', tag: 'SERVICE' }
        ];

        container.innerHTML = '';
        news.forEach(item => {
            const div = document.createElement('div');
            div.className = 'news-item';
            div.innerHTML = `
                <div style="font-size:0.8rem; color:#666;">${item.date} <span style="color:var(--accent); font-weight:bold; margin-left:5px;">${item.tag}</span></div>
                <div style="font-weight:500; margin-top:5px;">${item.title}</div>
            `;
            container.appendChild(div);
        });

    } catch (e) {
        container.innerHTML = '<div class="news-item">无法加载新闻</div>';
    }
}

// PWA Logic
function checkPWA() {
    let deferredPrompt;
    const installBanner = document.getElementById('install-prompt');
    const installBtn = document.getElementById('btn-install');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBanner.style.display = 'flex';
    });

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBanner.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });
}

// Expose globally
window.switchTab = switchTab;
window.logout = logout;

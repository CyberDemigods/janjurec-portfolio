/* ===========================
   JAN JUREC – OS PORTFOLIO
   Window Manager & Theme Switcher
   =========================== */

(function () {
    'use strict';

    let zIndex = 10;
    let activeWindow = null;
    const windowStates = {};
    let jp2Unlocked = localStorage.getItem('jan-portfolio-jp2') === 'true';
    let selectedWallpaperCss = null;

    // Singleton windows (have JS state, only one instance)
    const SINGLETON_WINDOWS = ['terminal', 'paint', 'winamp', 'browser', 'tetris', 'breakout', 'notepad'];
    // Instance counter for cascading offset
    let instanceCounter = 0;
    const CASCADE_OFFSET = 30;

    // "Lag burst" easter egg - occasionally queues clicks then opens all at once
    let openClickCount = 0;
    let lagQueue = [];
    let lagTimeout = null;

    // init is defined at the bottom of the file

    // ===== DESKTOP ICONS =====
    function isMobile() {
        return 'ontouchstart' in window || window.innerWidth <= 768;
    }

    function initDesktopIcons() {
        var icons = document.querySelectorAll('.desktop-icon');
        var colGap = 90, rowGap = 90, padX = 16, padY = 16;

        // Load saved positions or use grid layout
        var savedPositions = {};
        try { savedPositions = JSON.parse(localStorage.getItem('jan-portfolio-icon-pos') || '{}'); } catch(e) {}

        icons.forEach(function(icon, i) {
            var key = icon.dataset.window;
            if (savedPositions[key]) {
                icon.style.left = savedPositions[key].x + 'px';
                icon.style.top = savedPositions[key].y + 'px';
            } else {
                // First visit: scatter icons randomly across the desktop
                var taskbarH = 36;
                var iconW = 75, iconH = 75;
                var maxX = Math.max(200, window.innerWidth - iconW - padX);
                var maxY = Math.max(200, window.innerHeight - taskbarH - iconH - padY);
                icon.style.left = Math.floor(Math.random() * maxX) + 'px';
                icon.style.top = Math.floor(Math.random() * maxY) + 'px';
            }

            // Double click opens window
            icon.addEventListener('dblclick', function() {
                openWindow(icon.dataset.window);
            });
            // Mobile: single tap
            icon.addEventListener('click', function() {
                if (isMobile()) openWindow(icon.dataset.window);
            });

            // Drag icons
            var dragStartX, dragStartY, iconStartX, iconStartY, isDragging = false;
            icon.addEventListener('mousedown', function(e) {
                if (e.button !== 0) return;
                if (icon.classList.contains('jan-locked')) return;
                isDragging = false;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                iconStartX = parseInt(icon.style.left) || 0;
                iconStartY = parseInt(icon.style.top) || 0;
                icon.style.zIndex = '5';

                function onMove(ev) {
                    var dx = ev.clientX - dragStartX;
                    var dy = ev.clientY - dragStartY;
                    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                        if (!isDragging) {
                            icon.classList.add('dragging');
                            if (window.LiquidGlass) LiquidGlass.apply(icon, 'icon');
                        }
                        isDragging = true;
                    }
                    if (isDragging) {
                        var newLeft = iconStartX + dx;
                        var newTop = iconStartY + dy;
                        icon.style.left = newLeft + 'px';
                        icon.style.top = newTop + 'px';
                        if (window.LiquidGlass) LiquidGlass.updatePosition(icon);
                    }
                }
                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    if (window.LiquidGlass) LiquidGlass.remove(icon);
                    icon.classList.remove('dragging');
                    icon.style.zIndex = '';
                    if (isDragging) {
                        // Save position
                        try {
                            var pos = JSON.parse(localStorage.getItem('jan-portfolio-icon-pos') || '{}');
                            pos[key] = { x: parseInt(icon.style.left), y: parseInt(icon.style.top) };
                            localStorage.setItem('jan-portfolio-icon-pos', JSON.stringify(pos));
                        } catch(e) {}
                    }
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        });
    }

    // ===== WINDOW MANAGEMENT =====
    function openWindow(name) {
        // Close start menu
        document.getElementById('startMenu').classList.add('hidden');

        // "Lag burst" - after every ~8-15 clicks, queue and burst them all (max 10)
        openClickCount++;
        if (!SINGLETON_WINDOWS.includes(name) && (openClickCount > 7 && Math.random() < 0.3 || lagTimeout)) {
            if (lagQueue.length < 10) lagQueue.push(name);
            if (!lagTimeout) {
                lagTimeout = setTimeout(function() {
                    var q = lagQueue.slice();
                    lagQueue = [];
                    lagTimeout = null;
                    openClickCount = 0;
                    for (var i = 0; i < q.length; i++) {
                        (function(n, delay) {
                            setTimeout(function() { doOpenWindow(n); }, delay);
                        })(q[i], i * 150);
                    }
                }, 1500 + Math.random() * 1000);
            }
            return;
        }

        doOpenWindow(name);
    }

    function doOpenWindow(name) {
        // macOS App Store gag: games "cost $9.99"
        var macTheme = document.documentElement.getAttribute('data-theme') === 'macos';
        if (macTheme && (name === 'tetris' || name === 'breakout')) {
            var gameName = name === 'tetris' ? 'Tetris\u2122' : 'Breakout\u2122';
            var overlay = document.createElement('div');
            overlay.className = 'macos-appstore-popup';
            overlay.innerHTML =
                '<div class="macos-appstore-card">' +
                    '<div class="macos-appstore-icon">\uD83C\uDF4E</div>' +
                    '<div class="macos-appstore-title">' + gameName + '</div>' +
                    '<div class="macos-appstore-price">$9.99 on the Mac App Store</div>' +
                    '<div class="macos-appstore-sub">Purchasing\u2026</div>' +
                '</div>';
            document.body.appendChild(overlay);
            // Force reflow then add visible class for animation
            overlay.offsetHeight;
            overlay.classList.add('visible');
            var capturedName = name;
            setTimeout(function() {
                overlay.classList.remove('visible');
                setTimeout(function() { overlay.remove(); }, 300);
                doOpenWindowInner(capturedName);
            }, 1500);
            return;
        }
        doOpenWindowInner(name);
    }

    function doOpenWindowInner(name) {
        // Block all windows during vim/saw mode (except terminal itself)
        if (window._vimActive && name !== 'terminal') {
            var termWin = document.getElementById('window-terminal');
            if (termWin) bringToFront(termWin);
            return;
        }
        // Singletons: just show existing window
        if (SINGLETON_WINDOWS.includes(name)) {
            const win = document.getElementById('window-' + name);
            if (!win) return;
            win.classList.remove('hidden');
            bringToFront(win);
            updateTaskbarButtons();
            // Autoplay Rick when Winamp opens
            if (name === 'winamp' && !winampPlaying) {
                setTimeout(function() {
                    var playBtn = document.getElementById('winampPlay');
                    if (playBtn) playBtn.click();
                }, 200);
            }
            // Theme-aware browser: IE on Windows, Safari inception on macOS, Tor on Linux
            if (name === 'browser') {
                updateBrowserTheme();
                if (getBrowserType() === 'safari') {
                    showSafariInception();
                } else {
                    hideSafariInception();
                    showBrowserLoading();
                }
            }
            return;
        }

        // Multi-instance: clone the template window
        const template = document.getElementById('window-' + name);
        if (!template) return;

        instanceCounter++;
        const clone = template.cloneNode(true);
        const instanceId = name + '-inst-' + instanceCounter;
        clone.id = 'window-' + instanceId;
        clone.classList.remove('hidden');
        clone.dataset.baseName = name;

        // Cascade position
        const baseTop = parseInt(template.style.top) || 60;
        const baseLeft = parseInt(template.style.left) || 80;
        const offset = (instanceCounter % 10) * CASCADE_OFFSET;
        clone.style.top = (baseTop + offset) + 'px';
        clone.style.left = (baseLeft + offset) + 'px';

        // Update button data-window attributes for this instance
        clone.querySelectorAll('.btn-close').forEach(b => b.dataset.window = instanceId);
        clone.querySelectorAll('.btn-minimize').forEach(b => b.dataset.window = instanceId);
        clone.querySelectorAll('.btn-maximize').forEach(b => b.dataset.window = instanceId);

        // Attach control handlers
        attachWindowControls(clone, instanceId);

        // Add to desktop
        document.querySelector('.desktop').appendChild(clone);
        bringToFront(clone);
        updateTaskbarButtons();
    }

    function attachWindowControls(win, instanceId) {
        win.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeWindow(instanceId);
            });
        });
        win.querySelectorAll('.btn-minimize').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                minimizeWindow(instanceId);
            });
        });
        win.querySelectorAll('.btn-maximize').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMaximize(instanceId);
            });
        });
        win.addEventListener('mousedown', () => bringToFront(win));

        // Dragging for this instance
        const titlebar = win.querySelector('.window-titlebar');
        if (titlebar) {
            titlebar.addEventListener('mousedown', (e) => {
                if (e.target.closest('.win-btn')) return;
                if (win.classList.contains('maximized')) return;
                initInstanceDrag(win, e.clientX, e.clientY);
            });
            titlebar.addEventListener('touchstart', (e) => {
                if (e.target.closest('.win-btn')) return;
                if (win.classList.contains('maximized')) return;
                const touch = e.touches[0];
                initInstanceDrag(win, touch.clientX, touch.clientY, true);
            }, { passive: false });
        }
    }

    function initInstanceDrag(win, startX, startY, isTouch) {
        const rect = win.getBoundingClientRect();
        let offsetX = startX - rect.left;
        let offsetY = startY - rect.top;
        bringToFront(win);

        function getTaskbarHeight() {
            const tb = document.querySelector('.taskbar');
            return tb ? tb.offsetHeight : 36;
        }

        function onMove(e) {
            const cx = isTouch ? e.touches[0].clientX : e.clientX;
            const cy = isTouch ? e.touches[0].clientY : e.clientY;
            if (isTouch) e.preventDefault();
            let x = cx - offsetX;
            let y = cy - offsetY;
            const maxY = window.innerHeight - getTaskbarHeight() - 40;
            x = Math.max(-win.offsetWidth + 100, Math.min(window.innerWidth - 100, x));
            y = Math.max(0, Math.min(maxY, y));
            win.style.left = x + 'px';
            win.style.top = y + 'px';
        }

        function onUp() {
            document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', onMove);
            document.removeEventListener(isTouch ? 'touchend' : 'mouseup', onUp);
        }

        document.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMove, isTouch ? { passive: false } : undefined);
        document.addEventListener(isTouch ? 'touchend' : 'mouseup', onUp);
    }

    function playCloseSound() {
        try {
            var ac = new (window.AudioContext || window.webkitAudioContext)();
            // Quick "click" sound - descending blip
            var osc = ac.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, ac.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.06);
            var g = ac.createGain();
            g.gain.setValueAtTime(0.08, ac.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
            osc.connect(g);
            g.connect(ac.destination);
            osc.start();
            osc.stop(ac.currentTime + 0.08);
            setTimeout(function() { ac.close(); }, 200);
        } catch(e) {}
    }

    function closeWindow(name) {
        const win = document.getElementById('window-' + name);
        if (!win) return;

        // Vim mode: terminal cannot be closed
        if (name === 'terminal' && window._vimActive) {
            return;
        }

        playCloseSound();

        // Stop Winamp playback when closing
        if (name === 'winamp') {
            stopWinamp();
        }
        // Reset browser content when closing
        if (name === 'browser') {
            resetNosaczGame();
            hideSafariInception();
        }

        // Cloned instances: remove from DOM entirely
        if (win.dataset.baseName) {
            win.remove();
        } else {
            // Singleton: just hide
            win.classList.add('hidden');
            win.classList.remove('maximized');
        }
        if (windowStates[name]) {
            delete windowStates[name];
        }
        updateTaskbarButtons();
    }

    function stopWinamp() {
        winampPlaying = false;
        winampPaused = false;
        for (var j = 0; j < winampScheduledOscs.length; j++) {
            try { winampScheduledOscs[j].stop(); } catch(ex){}
        }
        winampScheduledOscs = [];
        if (winampAc) {
            try { winampAc.close(); } catch(ex){}
            winampAc = null;
        }
        if (winampAnimFrame) cancelAnimationFrame(winampAnimFrame);
        winampAnimFrame = null;
        var timeDisplay = document.getElementById('winampTime');
        var seekFill = document.getElementById('winampSeekFill');
        var playBtn = document.getElementById('winampPlay');
        var ticker = document.getElementById('winampTicker');
        if (timeDisplay) timeDisplay.textContent = '0:00';
        if (seekFill) seekFill.style.width = '0%';
        if (playBtn) playBtn.textContent = '\u25B6';
        if (ticker) ticker.textContent = '*** Winamp 2.91 - Jan Jurec Edition ***';
        var bars = document.querySelectorAll('.winamp-viz-bar');
        for (var j = 0; j < bars.length; j++) bars[j].style.height = '2px';
    }

    function minimizeWindow(name) {
        const win = document.getElementById('window-' + name);
        if (!win) return;
        // Vim mode: minimize triggers maximize instead
        if (name === 'terminal' && window._vimActive) {
            toggleMaximize('terminal');
            return;
        }
        win.classList.add('hidden');
        updateTaskbarButtons();
    }

    function toggleMaximize(name) {
        const win = document.getElementById('window-' + name);
        if (!win) return;

        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            if (windowStates[name]) {
                win.style.top = windowStates[name].top;
                win.style.left = windowStates[name].left;
                win.style.width = windowStates[name].width;
                win.style.height = windowStates[name].height || '';
            }
        } else {
            windowStates[name] = {
                top: win.style.top,
                left: win.style.left,
                width: win.style.width,
                height: win.style.height
            };
            win.classList.add('maximized');
        }
    }

    function bringToFront(win) {
        if (activeWindow) activeWindow.classList.remove('active');
        zIndex++;
        win.style.zIndex = zIndex;
        win.classList.add('active');
        activeWindow = win;
    }

    function initWindowControls() {
        // Only attach to singleton/template windows
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeWindow(btn.dataset.window);
            });
        });
        document.querySelectorAll('.btn-minimize').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                minimizeWindow(btn.dataset.window);
            });
        });
        document.querySelectorAll('.btn-maximize').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMaximize(btn.dataset.window);
            });
        });

        // Click window to bring to front
        document.querySelectorAll('.window').forEach(function(win) {
            win.addEventListener('mousedown', function() { bringToFront(win); });
        });
    }

    // ===== DRAGGING =====
    function initDragging() {
        let dragTarget = null;
        let offsetX, offsetY;

        // Use event delegation so dynamically cloned windows also get drag support
        document.addEventListener('mousedown', function(e) {
            var titlebar = e.target.closest('.window-titlebar');
            if (titlebar) startDrag(e);
        });
        document.addEventListener('touchstart', function(e) {
            var titlebar = e.target.closest('.window-titlebar');
            if (titlebar) startDragTouch(e);
        }, { passive: false });

        function startDrag(e) {
            if (e.target.closest('.win-btn')) return;
            const win = e.target.closest('.window');
            if (win.classList.contains('maximized')) return;
            if (window._sawGameActive && win.id === 'window-terminal') return;
            dragTarget = win;
            const rect = win.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            bringToFront(win);
            win.classList.add('dragging');
            if (window.LiquidGlass) LiquidGlass.apply(win, 'window');
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        }

        function startDragTouch(e) {
            if (e.target.closest('.win-btn')) return;
            const win = e.target.closest('.window');
            if (win.classList.contains('maximized')) return;
            if (window._sawGameActive && win.id === 'window-terminal') return;
            dragTarget = win;
            const rect = win.getBoundingClientRect();
            const touch = e.touches[0];
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
            bringToFront(win);
            win.classList.add('dragging');
            if (window.LiquidGlass) LiquidGlass.apply(win, 'window');
            document.addEventListener('touchmove', onDragTouch, { passive: false });
            document.addEventListener('touchend', stopDrag);
        }

        function getTaskbarHeight() {
            const tb = document.querySelector('.taskbar');
            return tb ? tb.offsetHeight : 36;
        }

        function onDrag(e) {
            if (!dragTarget) return;
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            const maxY = window.innerHeight - getTaskbarHeight() - 40;
            x = Math.max(-dragTarget.offsetWidth + 100, Math.min(window.innerWidth - 100, x));
            y = Math.max(0, Math.min(maxY, y));
            dragTarget.style.left = x + 'px';
            dragTarget.style.top = y + 'px';
            if (window.LiquidGlass) LiquidGlass.updatePosition(dragTarget);
        }

        function onDragTouch(e) {
            if (!dragTarget) return;
            e.preventDefault();
            const touch = e.touches[0];
            let x = touch.clientX - offsetX;
            let y = touch.clientY - offsetY;
            const maxY = window.innerHeight - getTaskbarHeight() - 40;
            x = Math.max(-dragTarget.offsetWidth + 100, Math.min(window.innerWidth - 100, x));
            y = Math.max(0, Math.min(maxY, y));
            dragTarget.style.left = x + 'px';
            dragTarget.style.top = y + 'px';
            if (window.LiquidGlass) LiquidGlass.updatePosition(dragTarget);
        }

        function stopDrag() {
            if (dragTarget) {
                // Snap terminal back to center during vim mode
                if (window._vimActive && dragTarget.id === 'window-terminal') {
                    var w = parseInt(dragTarget.style.width) || 720;
                    var h = parseInt(dragTarget.style.height) || 480;
                    dragTarget.style.left = Math.max(0, Math.round((window.innerWidth - w) / 2)) + 'px';
                    dragTarget.style.top = Math.max(0, Math.round((window.innerHeight - h) / 2 - 30)) + 'px';
                }
                dragTarget.classList.remove('dragging');
                if (window.LiquidGlass) LiquidGlass.remove(dragTarget);
            }
            dragTarget = null;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', onDragTouch);
            document.removeEventListener('touchend', stopDrag);
        }
    }

    // ===== WINDOW RESIZING =====
    function initResizing() {
        document.querySelectorAll('.window').forEach(function(win) {
            // Skip if handle already added
            if (win.querySelector('.window-resize-handle')) return;

            var handle = document.createElement('div');
            handle.className = 'window-resize-handle';
            win.appendChild(handle);

            handle.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (win.classList.contains('maximized')) return;
                var startX = e.clientX, startY = e.clientY;
                var startW = win.offsetWidth, startH = win.offsetHeight;
                bringToFront(win);

                function onResize(ev) {
                    var w = Math.max(200, startW + (ev.clientX - startX));
                    var h = Math.max(150, startH + (ev.clientY - startY));
                    win.style.width = w + 'px';
                    win.style.height = h + 'px';
                }
                function stopResize() {
                    document.removeEventListener('mousemove', onResize);
                    document.removeEventListener('mouseup', stopResize);
                }
                document.addEventListener('mousemove', onResize);
                document.addEventListener('mouseup', stopResize);
            });
        });
    }

    // ===== TASKBAR =====
    function initTaskbar() {
        const startBtn = document.getElementById('startBtn');
        const startMenu = document.getElementById('startMenu');

        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startMenu.classList.toggle('hidden');
        });

        // Start menu items
        document.querySelectorAll('.start-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                openWindow(item.dataset.window);
            });
            // Liquid glass: track mouse + background position for refraction (macOS)
            item.addEventListener('mousemove', function(e) {
                var rect = item.getBoundingClientRect();
                item.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
                item.style.setProperty('--bg-x', (-rect.left) + 'px');
                item.style.setProperty('--bg-y', (-rect.top) + 'px');
            });
            item.addEventListener('mouseenter', function() {
                var rect = item.getBoundingClientRect();
                item.style.setProperty('--bg-x', (-rect.left) + 'px');
                item.style.setProperty('--bg-y', (-rect.top) + 'px');
            });
        });
    }

    function updateTaskbarButtons() {
        const container = document.getElementById('taskbarWindows');
        container.innerHTML = '';

        // Show all visible windows + minimized instances in taskbar
        document.querySelectorAll('.window').forEach(win => {
            // Skip hidden template windows (non-singleton originals)
            const name = win.id.replace('window-', '');
            const isClone = !!win.dataset.baseName;
            const isSingleton = SINGLETON_WINDOWS.includes(name);

            // Template windows that are hidden and not singletons: skip
            if (!isClone && !isSingleton && win.classList.contains('hidden')) return;
            // Singleton windows that are hidden: skip
            if (isSingleton && win.classList.contains('hidden')) return;

            const title = win.querySelector('.window-title span:last-child');
            if (!title) return;

            const btn = document.createElement('button');
            const isMinimized = win.classList.contains('hidden');
            btn.className = 'taskbar-window-btn' + (!isMinimized && win.classList.contains('active') ? ' active' : '');
            btn.textContent = title.textContent;

            btn.addEventListener('click', () => {
                if (win.classList.contains('hidden')) {
                    win.classList.remove('hidden');
                    bringToFront(win);
                } else if (win.classList.contains('active')) {
                    minimizeWindow(name);
                } else {
                    bringToFront(win);
                }
                updateTaskbarButtons();
            });
            container.appendChild(btn);
        });
    }

    // ===== THEME SWITCHER =====
    function initThemeSwitcher() {
        const allBtns = document.querySelectorAll('[data-theme]');
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'win98';

        updateActiveThemeBtn(currentTheme);

        allBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Block theme switching during vim/saw game
                if (window._vimActive) return;
                const theme = btn.dataset.theme;
                document.documentElement.setAttribute('data-theme', theme);
                updateActiveThemeBtn(theme);
                localStorage.setItem('jan-portfolio-theme', theme);
                applyWallpaperForTheme(theme);
                updateBrowserTheme();
                updateBrowserDesktopIcon();
                // Re-init liquid glass for macOS
                if (window.LiquidGlass) LiquidGlass.reinit();
                // Handle Safari inception on theme switch
                var browserWin = document.getElementById('window-browser');
                if (browserWin && !browserWin.classList.contains('hidden')) {
                    if (getBrowserType() === 'safari') {
                        showSafariInception();
                    } else {
                        hideSafariInception();
                        var noNet = document.getElementById('browserNoNet');
                        if (noNet) noNet.classList.remove('hidden');
                        updateBrowserWatermark();
                    }
                }
            });
        });

        // Load saved theme (URL param overrides for iframe inception)
        var urlTheme = new URLSearchParams(window.location.search).get('theme');
        const saved = urlTheme || localStorage.getItem('jan-portfolio-theme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
            updateActiveThemeBtn(saved);
        }
    }

    function updateActiveThemeBtn(theme) {
        document.querySelectorAll('[data-theme]').forEach(b => {
            b.classList.toggle('active', b.dataset.theme === theme);
        });
    }

    // ===== CLOCK =====
    function initClock() {
        const clock = document.getElementById('clock');
        function tick() {
            const now = new Date();
            clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        tick();
        setInterval(tick, 30000);
    }

    // ===== SKILLS TREE TOGGLE =====
    function initSkillsTree() {
        document.querySelectorAll('.skill-cat-header').forEach(header => {
            header.addEventListener('click', () => {
                const items = header.nextElementSibling;
                const toggle = header.querySelector('.tree-toggle');
                const expanded = header.getAttribute('data-expanded') === 'true';
                if (expanded) {
                    items.classList.add('collapsed');
                    toggle.textContent = '▶';
                    header.setAttribute('data-expanded', 'false');
                } else {
                    items.classList.remove('collapsed');
                    toggle.textContent = '▼';
                    header.setAttribute('data-expanded', 'true');
                }
            });
        });
    }

    // ===== WALLPAPER SYSTEM =====
    function initWallpapers() {
        const desktop = document.getElementById('desktop');
        const theme = document.documentElement.getAttribute('data-theme') || 'win98';

        // Apply saved or default wallpaper
        applyWallpaperForTheme(theme);
    }

    function applyWallpaperForTheme(theme) {
        const desktop = document.getElementById('desktop');
        const savedKey = 'jan-wallpaper-' + theme;
        const savedIndex = localStorage.getItem(savedKey);
        const wallpapers = WALLPAPERS[theme] || [];

        let wallpaper = null;
        if (savedIndex !== null && String(savedIndex).startsWith('painting-')) {
            try {
                var pi = parseInt(savedIndex.split('-')[1]);
                var paintings = JSON.parse(localStorage.getItem('jan-portfolio-paintings') || '[]');
                if (paintings[pi]) wallpaper = { css: 'url(' + paintings[pi].dataUrl + ')', name: 'Painting' };
            } catch(e) {}
        }
        if (!wallpaper && savedIndex !== null && wallpapers[parseInt(savedIndex)]) {
            wallpaper = wallpapers[parseInt(savedIndex)];
        } else if (!wallpaper && savedIndex === 'jp2' && jp2Unlocked) {
            wallpaper = JP2_WALLPAPER;
        }
        if (!wallpaper) {
            wallpaper = wallpapers[0];
        }

        if (wallpaper) {
            desktop.style.background = wallpaper.css;
            desktop.style.backgroundSize = 'cover';
            desktop.style.backgroundPosition = 'center';
            // Expose for liquid glass refraction
            document.documentElement.style.setProperty('--wallpaper-bg', wallpaper.css);
        }
    }

    function openWallpaperPicker() {
        const picker = document.getElementById('wallpaperPicker');
        const list = document.getElementById('wallpaperList');
        const preview = document.getElementById('wallpaperPreview');
        const theme = document.documentElement.getAttribute('data-theme') || 'win98';
        const wallpapers = WALLPAPERS[theme] || [];

        list.innerHTML = '';
        selectedWallpaperCss = null;
        let selectedIndex = null;

        wallpapers.forEach((wp, i) => {
            const thumb = document.createElement('div');
            thumb.className = 'wallpaper-thumb';
            thumb.style.background = wp.css;
            thumb.style.backgroundSize = 'cover';
            thumb.style.backgroundPosition = 'center';

            const label = document.createElement('div');
            label.className = 'wallpaper-thumb-label';
            label.textContent = wp.name;
            thumb.appendChild(label);

            thumb.addEventListener('click', () => {
                list.querySelectorAll('.wallpaper-thumb').forEach(t => t.classList.remove('selected'));
                thumb.classList.add('selected');
                preview.style.background = wp.css;
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                selectedWallpaperCss = wp.css;
                selectedIndex = i;
            });

            list.appendChild(thumb);
        });

        // JP2 secret wallpaper
        if (jp2Unlocked) {
            const thumb = document.createElement('div');
            thumb.className = 'wallpaper-thumb secret';
            thumb.style.background = JP2_WALLPAPER.css;
            thumb.style.backgroundSize = 'cover';
            thumb.style.backgroundPosition = 'center';

            const label = document.createElement('div');
            label.className = 'wallpaper-thumb-label';
            label.textContent = JP2_WALLPAPER.name;
            label.style.background = 'rgba(139,105,20,0.8)';
            thumb.appendChild(label);

            thumb.addEventListener('click', () => {
                list.querySelectorAll('.wallpaper-thumb').forEach(t => t.classList.remove('selected'));
                thumb.classList.add('selected');
                preview.style.background = JP2_WALLPAPER.css;
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                selectedWallpaperCss = JP2_WALLPAPER.css;
                selectedIndex = 'jp2';
            });

            list.appendChild(thumb);
        }

        // Saved paintings as wallpaper options
        try {
            var paintings = JSON.parse(localStorage.getItem('jan-portfolio-paintings') || '[]');
            paintings.forEach(function(p, pi) {
                var thumb = document.createElement('div');
                thumb.className = 'wallpaper-thumb painting';
                thumb.style.background = 'url(' + p.dataUrl + ')';
                thumb.style.backgroundSize = 'cover';
                thumb.style.backgroundPosition = 'center';

                var label = document.createElement('div');
                label.className = 'wallpaper-thumb-label';
                label.textContent = '\uD83C\uDFA8 Painting ' + (pi + 1);
                label.style.background = 'rgba(80,0,120,0.8)';
                thumb.appendChild(label);

                thumb.addEventListener('click', function() {
                    list.querySelectorAll('.wallpaper-thumb').forEach(function(t) { t.classList.remove('selected'); });
                    thumb.classList.add('selected');
                    preview.style.background = 'url(' + p.dataUrl + ')';
                    preview.style.backgroundSize = 'cover';
                    preview.style.backgroundPosition = 'center';
                    selectedWallpaperCss = 'url(' + p.dataUrl + ')';
                    selectedIndex = 'painting-' + pi;
                });

                list.appendChild(thumb);
            });
        } catch(e) {}

        // Set preview to current wallpaper
        const desktop = document.getElementById('desktop');
        preview.style.background = desktop.style.background || wallpapers[0]?.css || '#000';
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundPosition = 'center';

        picker.classList.remove('hidden');

        // Apply button
        document.getElementById('wallpaperApply').onclick = () => {
            if (selectedWallpaperCss) {
                desktop.style.background = selectedWallpaperCss;
                desktop.style.backgroundSize = 'cover';
                desktop.style.backgroundPosition = 'center';
                document.documentElement.style.setProperty('--wallpaper-bg', selectedWallpaperCss);
                localStorage.setItem('jan-wallpaper-' + theme, selectedIndex);
            }
            picker.classList.add('hidden');
        };

        // Cancel button
        document.getElementById('wallpaperCancel').onclick = () => {
            picker.classList.add('hidden');
        };

        // Close button
        document.getElementById('wallpaperPickerClose').onclick = () => {
            picker.classList.add('hidden');
        };
    }

    // ===== CONTEXT MENU =====
    function initContextMenu() {
        const desktop = document.getElementById('desktop');
        const menu = document.getElementById('contextMenu');

        desktop.addEventListener('contextmenu', (e) => {
            // Only show on desktop background, not on windows/icons
            if (e.target.closest('.window') || e.target.closest('.desktop-icon')) return;

            e.preventDefault();
            menu.style.left = Math.min(e.clientX, window.innerWidth - 220) + 'px';
            menu.style.top = Math.min(e.clientY, window.innerHeight - 100) + 'px';
            menu.classList.remove('hidden');
        });

        document.addEventListener('click', () => {
            menu.classList.add('hidden');
        });

        document.getElementById('ctx-wallpaper').addEventListener('click', () => {
            menu.classList.add('hidden');
            openWallpaperPicker();
        });

        document.getElementById('ctx-about-os').addEventListener('click', () => {
            menu.classList.add('hidden');
            const theme = document.documentElement.getAttribute('data-theme') || 'win98';
            const names = { win98: 'Windows 98', winxp: 'Windows XP', macos: 'macOS Sonoma', linux: 'Ubuntu 24.04 LTS' };
            alert('🖥️ ' + (names[theme] || theme) + '\n\nJan Jurec Portfolio OS\nVersion 2.1.37\n\n"Python, AWS, Linux. Cool stuff."\n\n⚔️ Forged by CyberDemigods\nhttps://cyberdemigods.com');
        });
    }

    // ===== TERMINAL =====
    function initTerminal() {
        const input = document.getElementById('terminalInput');
        const output = document.getElementById('terminalOutput');
        const body = document.getElementById('terminalBody');
        if (!input) return;

        const cmdHistory = [];
        let historyIndex = -1;

        // Focus input when terminal body is clicked
        body.addEventListener('click', () => input.focus());

        // Auto-focus when terminal opens
        const observer = new MutationObserver(() => {
            const win = document.getElementById('window-terminal');
            if (win && !win.classList.contains('hidden')) {
                setTimeout(() => input.focus(), 50);
            }
        });
        const termWin = document.getElementById('window-terminal');
        if (termWin) observer.observe(termWin, { attributes: true, attributeFilter: ['class'] });

        // Terminal modes: 'normal', 'pin', 'python', 'vim', 'vim-active'
        var terminalMode = 'normal';
        window._vimActive = false; // exposed for closeWindow/minimizeWindow
        var vimAc = null;
        var vimOscillators = [];
        var vimFocusTrap = null;
        var vimEscapeAttempts = 0;
        var vimStartTime = 0;
        var vimDroneStarted = false;
        var vimSawTimer = null;
        // Saw game state
        var sawGameActive = false;
        window._sawGameActive = false;
        var sawGamePending = false;
        var sawQuestionIndex = 0;
        var sawLives = [];
        var sawIconOriginalData = [];
        var sawTimerInterval = null;
        var sawTimeLeft = 30;
        var sawCorrectCount = 0;
        var sawShuffled = [];
        var sawOverlayEl = null;
        var sawTimerContainerEl = null;
        var sawTimerBarEl = null;
        var sawTimerTextEl = null;
        var sawCracks = [];
        var sawDarknessLevel = 0;
        var sawWrongStreak = 0;
        var secretsUnlocked = localStorage.getItem('jan-portfolio-secrets') === 'true';
        var currentDir = '~';

        // === VIRTUAL FILESYSTEM ===
        var vfs = {
            '~': {
                entries: ['about.txt', 'experience.log', 'skills.cfg', 'education.md', 'contact.vcf', 'README.md', 'projects/', 'secrets/'],
                hidden: ['.bashrc']
            },
            '~/projects': {
                entries: ['portfolio-os/', 'terraform-modules/', 'python-scripts/', 'ci-cd-pipelines/', 'ml-experiments/', 'docker-configs/', 'aws-cdk-apps/', 'monitoring-stack/', 'automation/']
            },
            '~/secrets': {
                locked: true,
                entries: ['papiezowe_memy.txt', 'wifi_haslo.txt', 'TODO.md', 'nie_otwieraj.sh', 'tajne_przez_poufne.gpg', 'kto_zjadl_ostatnia_pizza.log', 'all-commands.txt']
            }
        };

        // File content handlers (for cat command)
        var fileReadMap = {
            '~/about.txt': function() {
                addLine('Jan Jurec', 'success');
                addLine('Senior DevOps Engineer | MLOps | Backend');
                addLine('"Python, AWS, Linux. Cool stuff."');
                addLine('Location: Gorzow Wielkopolski, Poland');
                addLine('Remote since 2018 (before it was cool)');
            },
            '~/experience.log': function() {
                addLine('=== EXPERIENCE ===', 'info');
                addLine('2024-now   CEO @ InnovationsEX Solutions-pol');
                addLine('2023-now   Infra Specialist @ Zdrowa (charity)');
                addLine('2021-2024  Sr DevOps/MLOps @ TUI (3y4m)');
                addLine('2019-2024  Software Engineer @ 3e9 Systems (5y)');
                addLine('2020-2022  Python Mentor @ Kodilla (2y4m)');
                addLine('2018-2019  Software Engineer @ Xebia Poland');
                addLine('2017-2018  Software Engineer @ Clearcode');
                addLine('2016-2017  Working Student @ Nokia');
            },
            '~/skills.cfg': function() {
                addLine('=== SKILLS ===', 'info');
                addLine('Cloud:      AWS, Terraform, CDK, CloudFormation, EC2, Lambda, SageMaker');
                addLine('Languages:  Python, FastAPI, Django, Flask, PHP');
                addLine('DevOps:     Docker, Kubernetes, GitLab CI/CD, Jenkins, Ansible');
                addLine('Data/ML:    MLOps, MLflow, Glue, Data Pipeline, SageMaker');
                addLine('Tools:      Git, Linux, Datadog, SonarQube');
                addLine('Testing:    pytest, unit/e2e/smoke/perf tests');
            },
            '~/education.md': function() {
                addLine('=== EDUCATION ===', 'info');
                addLine('MSc Computer Science - PWr (2018-2019)');
                addLine('BSc Engineering CS  - PWr (2012-2017)');
                addLine('');
                addLine('Certifications:', 'info');
                addLine('  AWS Solutions Architect Associate (2019)');
                addLine('  Learning Kubernetes - LinkedIn (2024)');
            },
            '~/contact.vcf': function() {
                addLine('=== CONTACT ===', 'info');
                addLine('Email:    jan@jurec.pl');
                addLine('LinkedIn: linkedin.com/in/janjur');
                addLine('GitHub:   github.com/janjur');
            },
            '~/README.md': function() {
                addLine('# Jan Jurec - Portfolio', 'info');
                addLine('Built with pure HTML, CSS & JS. No frameworks harmed.');
                addLine('Switch OS themes using the tray buttons!');
            },
            '~/.bashrc': function() {
                addLine('# ~/.bashrc - Jan Jurec', 'info');
                addLine('');
                addLine('export PS1="\\[\\033[01;32m\\]jan@portfolio\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ "');
                addLine('export EDITOR=vim');
                addLine('export PATH="$HOME/.local/bin:$PATH"');
                addLine('');
                addLine('alias ll="ls -la"');
                addLine('alias gs="git status"');
                addLine('alias deploy="npx wrangler pages deploy ."');
                addLine('alias yolo="git push --force"  # NEVER use this');
                addLine('');
                addLine('# If you found this, you\'re curious. I like that.');
                addLine('# Try: ls -a', 'info');
            },
            '~/secrets/papiezowe_memy.txt': function() {
                addLine('=== papiezowe_memy.txt ===', 'info');
                if (currentLang === 'pl') {
                    addLine('Q: Ile jest 21 + 37?');
                    addLine('A: Tyle samo co 37 + 21.');
                    addLine('');
                    addLine('Tak naprawdę to 58, ale kto liczy.');
                } else {
                    addLine('Q: What is 21 + 37?');
                    addLine('A: Same as 37 + 21.');
                    addLine('');
                    addLine('Actually it\'s 58, but who\'s counting.');
                }
                addLine('');
                addLine('   _____');
                addLine('  /     \\');
                addLine(' | () () |');
                addLine('  \\  ^  /');
                addLine('   |||||');
                addLine('   |||||');
            },
            '~/secrets/wifi_haslo.txt': function() {
                addLine('=== wifi_haslo.txt ===', 'info');
                addLine('SSID: SerwerowniaWykopu5G');
                addLine('Pass: ZAQ!2wsx');
                addLine('');
                addLine(currentLang === 'pl' ? '(nie udawaj że nie próbowałeś)' : '(don\'t pretend you didn\'t try it)');
            },
            '~/secrets/todo.md': function() {
                addLine('=== TODO.md ===', 'info');
                addLine('# TODO');
                if (currentLang === 'pl') {
                    addLine('- [x] naprawic produkcje');
                    addLine('- [ ] naprawic produkcje (znowu)');
                    addLine('- [ ] przestac deployowac w piątki');
                    addLine('- [ ] dowiedziec sie co robi ten skrypt z 2019');
                    addLine('- [ ] usunac TODO.md');
                } else {
                    addLine('- [x] fix production');
                    addLine('- [ ] fix production (again)');
                    addLine('- [ ] stop deploying on Fridays');
                    addLine('- [ ] figure out what that 2019 script does');
                    addLine('- [ ] delete TODO.md');
                }
            },
            '~/secrets/nie_otwieraj.sh': function() {
                addLine('=== nie_otwieraj.sh ===', 'info');
                addLine('#!/bin/bash');
                if (currentLang === 'pl') {
                    addLine('echo "A nie mówiłem żebyś nie otwierał?"');
                    addLine('echo "2137"');
                    addLine('# TODO: dodac rm -rf / dla nieposłusznych');
                } else {
                    addLine('echo "Didn\'t I tell you not to open this?"');
                    addLine('echo "2137"');
                    addLine('# TODO: add rm -rf / for the disobedient');
                }
            },
            '~/secrets/tajne_przez_poufne.gpg': function() {
                addLine('Error: gpg: decryption failed: No secret key', 'error');
                addLine(currentLang === 'pl' ? '(ładny try)' : '(nice try)');
            },
            '~/secrets/kto_zjadl_ostatnia_pizza.log': function() {
                addLine('=== kto_zjadl_ostatnia_pizza.log ===', 'info');
                addLine('[2024-01-15 23:47:12] ALERT: Pizza box empty');
                addLine('[2024-01-15 23:47:13] Checking git blame...');
                addLine('[2024-01-15 23:47:14] Suspect: jan.jurec');
                addLine('[2024-01-15 23:47:15] Evidence: cheese on keyboard');
                addLine('[2024-01-15 23:47:16] Verdict: GUILTY');
            },
            '~/secrets/all-commands.txt': function() {
                addLine('=== ALL AVAILABLE COMMANDS ===', 'info');
                addLine('');
                addLine('Navigation:', 'info');
                addLine('  ls [path]     - List directory (ls -a for hidden)');
                addLine('  cd [path]     - Change directory (cd .., cd ~)');
                addLine('  cat [file]    - Read file contents');
                addLine('  pwd           - Print working directory');
                addLine('');
                addLine('Info:', 'info');
                addLine('  help          - Show basic help');
                addLine('  whoami        - User info');
                addLine('  skills        - Technical skills');
                addLine('  experience    - Work history');
                addLine('  contact       - Contact info');
                addLine('  projects      - GitHub repos');
                addLine('  education     - Academic background');
                addLine('  neofetch      - System info');
                addLine('');
                addLine('System:', 'info');
                addLine('  theme [name]  - Switch OS (win98/winxp/macos/linux)');
                addLine('  clear         - Clear terminal');
                addLine('  exit          - Close terminal');
                addLine('  date          - Current date');
                addLine('  top / htop    - Process list');
                addLine('');
                addLine('Fun:', 'info');
                addLine('  matrix        - Enter the Matrix');
                addLine('  cowsay [msg]  - Cow says what?');
                addLine('  sl            - Choo choo!');
                addLine('  barka         - A holy song');
                addLine('  serwerownia   - Poznan goats');
                addLine('  python        - Snake mode');
                addLine('  vim           - You sure?');
                addLine('  ping [host]   - Network test');
                addLine('  echo [text]   - Print text');
                addLine('  achilles      - CyberDemigods');
                addLine('');
                addLine('Dangerous:', 'error');
                addLine('  sudo [cmd]    - Elevated access');
                addLine('  rm -rf /      - System destruction');
                addLine('');
                addLine('Hidden:', 'info');
                addLine('  cat .bashrc   - Shell config');
                addLine('  ls -a         - Show hidden files');
                addLine('  2137          - Holy PIN');
            }
        };

        function getCurrentTheme() {
            return document.documentElement.getAttribute('data-theme') || 'win98';
        }

        function resolvePath(input) {
            var p = input.trim().replace(/\/+$/, '');
            if (!p || p === '~' || p === '/' || p === '~/') return '~';
            if (p.startsWith('./')) p = p.substring(2);
            var abs;
            if (p.startsWith('~/')) {
                abs = p;
            } else if (p.startsWith('/')) {
                abs = '~' + p;
            } else {
                abs = (currentDir === '~' ? '~/' : currentDir + '/') + p;
            }
            // Resolve . and .. segments
            var segments = abs.split('/');
            var result = [];
            for (var i = 0; i < segments.length; i++) {
                if (segments[i] === '..') {
                    if (result.length > 1) result.pop();
                } else if (segments[i] !== '.' && segments[i] !== '') {
                    result.push(segments[i]);
                }
            }
            abs = result.length > 0 ? result.join('/') : '~';
            if (!abs.startsWith('~')) abs = '~/' + abs;
            // Normalize secrets aliases (.secrets, .secret, secret → secrets)
            abs = abs.replace(/\/\.?secrets?(?=\/|$)/i, '/secrets');
            abs = abs.replace(/\/+/g, '/').replace(/\/+$/, '');
            return abs;
        }

        function formatLsOutput(entries) {
            if (!entries || entries.length === 0) return;
            var maxLen = 0;
            entries.forEach(function(e) { if (e.length > maxLen) maxLen = e.length; });
            var colW = Math.max(maxLen + 2, 8);
            var cols = Math.max(1, Math.floor(60 / colW));
            var line = '';
            for (var i = 0; i < entries.length; i++) {
                line += entries[i].padEnd(colW);
                if ((i + 1) % cols === 0 || i === entries.length - 1) {
                    addLine(line.trimEnd());
                    line = '';
                }
            }
        }

        function showPinPrompt() {
            addLine('  ┌──────────────────────────────┐', 'error');
            addLine('  │  🔒 Permission denied         │', 'error');
            addLine('  │  Enter PIN to continue:       │', 'error');
            addLine('  │  _ _ _ _                      │', 'error');
            addLine('  └──────────────────────────────┘', 'error');
            terminalMode = 'pin';
            document.getElementById('terminalPrompt').textContent = '  PIN> ';
        }

        function cmdLs(argsLower) {
            var showHidden = false;
            var targetPath = '';
            argsLower.split(/\s+/).filter(Boolean).forEach(function(p) {
                if (p === '-a' || p === '-la' || p === '-al' || p === '-l' || p === '/a') showHidden = true;
                else if (!p.startsWith('-') && p !== '/a') targetPath = p;
            });
            var resolved = targetPath ? resolvePath(targetPath) : currentDir;
            var node = vfs[resolved];
            if (!node) {
                addLine('ls: cannot access \'' + (targetPath || '.') + '\': No such file or directory', 'error');
                return;
            }
            if (node.locked && !secretsUnlocked) {
                showPinPrompt();
                return;
            }
            var entries = (node.entries || []).slice();
            if (showHidden) {
                var hidden = (node.hidden || []).slice();
                if (resolved === '~' && !glitchRemoved) hidden.push('.glitch.exe');
                entries = ['.', '..'].concat(hidden).concat(entries);
            }
            formatLsOutput(entries);
        }

        function cmdCd(argsLower) {
            var target = argsLower.trim();
            if (!target || target === '~' || target === '/' || target === '~/') {
                currentDir = '~';
                updatePrompt(getCurrentTheme());
                return;
            }
            var resolved = resolvePath(target);
            if (vfs[resolved]) {
                if (vfs[resolved].locked && !secretsUnlocked) {
                    showPinPrompt();
                    return;
                }
                currentDir = resolved;
                updatePrompt(getCurrentTheme());
            } else {
                addLine('cd: ' + target + ': No such file or directory', 'error');
            }
        }

        function cmdCat(argsLower) {
            var target = argsLower.trim();
            if (!target) {
                addLine('cat: missing file operand', 'error');
                return;
            }
            var resolved = resolvePath(target);
            // Is it a directory?
            if (vfs[resolved]) {
                addLine('cat: ' + target + ': Is a directory', 'error');
                return;
            }
            // Direct match in fileReadMap
            if (fileReadMap[resolved]) {
                fileReadMap[resolved]();
                return;
            }
            // Case-insensitive match
            var resolvedLower = resolved.toLowerCase();
            for (var key in fileReadMap) {
                if (key.toLowerCase() === resolvedLower) {
                    fileReadMap[key]();
                    return;
                }
            }
            // Check if parent dir is locked
            var parentPath = resolved.substring(0, resolved.lastIndexOf('/')) || '~';
            if (vfs[parentPath] && vfs[parentPath].locked && !secretsUnlocked) {
                addLine('Permission denied: ' + target, 'error');
                return;
            }
            addLine('cat: ' + target + ': No such file or directory', 'error');
        }

        function cmdPwd() {
            var theme = getCurrentTheme();
            var path = currentDir;
            if (theme === 'win98' || theme === 'winxp') {
                var winPath = 'C:\\Users\\Jan';
                if (path !== '~') winPath += path.replace('~', '').replace(/\//g, '\\');
                addLine(winPath);
            } else {
                addLine(path);
            }
        }

        function getTabCompletions(partial) {
            var cmdNames = ['help', 'whoami', 'skills', 'experience', 'contact', 'projects',
                'education', 'neofetch', 'theme', 'matrix', 'clear', 'exit',
                'barka', 'serwerownia', 'achilles', 'sudo', 'ls', 'dir',
                'pwd', 'date', 'cowsay', 'ping', 'cat', 'cd', 'top', 'htop',
                'python', 'python3', 'sl', 'rm', 'echo'];
            var lower = partial.toLowerCase();
            // Hidden file completion
            if (lower.startsWith('.')) {
                var node = vfs[currentDir];
                var results = [];
                if (node && node.hidden) {
                    node.hidden.forEach(function(e) {
                        var name = e.replace(/\/$/, '');
                        if (name.toLowerCase().startsWith(lower)) results.push(name);
                    });
                }
                if (!glitchRemoved && '.glitch.exe'.startsWith(lower)) results.push('.glitch.exe');
                if (!glitchRemoved && './.glitch.exe'.startsWith(lower)) results.push('./.glitch.exe');
                return results;
            }
            var spaceIdx = lower.indexOf(' ');
            if (spaceIdx > -1) {
                var cmd = lower.substring(0, spaceIdx);
                var argPartial = lower.substring(spaceIdx + 1);
                if (cmd === 'cd' || cmd === 'ls' || cmd === 'cat' || cmd === 'dir') {
                    return getPathCompletions(argPartial, cmd).map(function(c) { return cmd + ' ' + c; });
                }
                if (cmd === 'theme') {
                    return ['win98', 'winxp', 'macos', 'linux']
                        .filter(function(t) { return t.startsWith(argPartial); })
                        .map(function(t) { return 'theme ' + t; });
                }
                return [];
            }
            return cmdNames.filter(function(c) { return c.startsWith(lower); });
        }

        function getPathCompletions(partial, forCmd) {
            var dirPath = currentDir;
            var namePartial = partial;
            var slashIdx = partial.lastIndexOf('/');
            if (slashIdx > -1) {
                var dirPart = partial.substring(0, slashIdx) || '/';
                namePartial = partial.substring(slashIdx + 1);
                dirPath = resolvePath(dirPart);
            }
            var node = vfs[dirPath];
            if (!node) return [];
            if (node.locked && !secretsUnlocked) return [];
            var entries = (node.entries || []).slice();
            if (node.hidden) entries = entries.concat(node.hidden);
            if (dirPath === '~' && !glitchRemoved) entries.push('.glitch.exe');
            if (forCmd === 'cd') {
                entries = entries.filter(function(e) { return e.endsWith('/'); });
            }
            var prefix = slashIdx > -1 ? partial.substring(0, slashIdx + 1) : '';
            return entries.filter(function(e) {
                return e.toLowerCase().startsWith(namePartial.toLowerCase());
            }).map(function(e) {
                return prefix + e.replace(/\/$/, '');
            });
        }

        input.addEventListener('keydown', (e) => {
            // Ctrl+D: exits python mode or closes terminal
            if (e.key === 'd' && e.ctrlKey) {
                e.preventDefault();
                if (terminalMode === 'saw-game' || terminalMode === 'saw-dead') return;
                if (terminalMode === 'vim-active') {
                    addLine(getVimError(), 'error');
                    scrollTerminal();
                    return;
                }
                if (terminalMode === 'vim') {
                    terminalMode = 'normal';
                    addLine('');
                    var promptEl = document.getElementById('terminalPrompt');
                    var theme = document.documentElement.getAttribute('data-theme') || 'win98';
                    updatePrompt(theme);
                    scrollTerminal();
                } else if (terminalMode === 'python') {
                    terminalMode = 'normal';
                    addLine('>>> ');
                    addLine('Exiting Python...', 'info');
                    var promptEl = document.getElementById('terminalPrompt');
                    var theme = document.documentElement.getAttribute('data-theme') || 'win98';
                    updatePrompt(theme);
                    scrollTerminal();
                } else {
                    closeWindow('terminal');
                }
                return;
            }
            // Ctrl+C: cancel current input, new prompt
            if (e.key === 'c' && e.ctrlKey) {
                e.preventDefault();
                if (terminalMode === 'saw-game' || terminalMode === 'saw-dead') return;
                var currentPrompt = document.getElementById('terminalPrompt').textContent;
                addLine(currentPrompt + input.value + '^C');
                input.value = '';
                if (terminalMode === 'vim-active') {
                    addLine(getVimError(), 'error');
                    scrollTerminal();
                    return;
                }
                if (terminalMode === 'pin' || terminalMode === 'vim') {
                    terminalMode = 'normal';
                    var thm = document.documentElement.getAttribute('data-theme') || 'win98';
                    updatePrompt(thm);
                }
                scrollTerminal();
                return;
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                var partial = input.value.trim();
                if (!partial) return;
                var matches = getTabCompletions(partial);
                if (matches.length === 1) {
                    input.value = matches[0];
                } else if (matches.length > 1) {
                    addLine(document.getElementById('terminalPrompt').textContent + partial);
                    addLine(matches.join('  '), 'info');
                    scrollTerminal();
                }
                return;
            }
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                input.value = '';

                if (terminalMode === 'pin') {
                    handlePinInput(cmd);
                    scrollTerminal();
                    return;
                }
                if (terminalMode === 'python') {
                    handlePythonInput(cmd, e);
                    scrollTerminal();
                    return;
                }
                if (terminalMode === 'vim') {
                    handleVimInput(cmd);
                    scrollTerminal();
                    return;
                }
                if (terminalMode === 'vim-active') {
                    handleVimActiveInput(cmd);
                    scrollTerminal();
                    return;
                }
                if (terminalMode === 'saw-game') {
                    handleSawGameInput(cmd);
                    scrollTerminal();
                    return;
                }
                if (terminalMode === 'saw-dead') {
                    return;
                }

                const prompt = document.getElementById('terminalPrompt').textContent;
                addLine(prompt + cmd);
                if (cmd) {
                    cmdHistory.unshift(cmd);
                    historyIndex = -1;
                    processCommand(cmd);
                }
                scrollTerminal();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex < cmdHistory.length - 1) {
                    historyIndex++;
                    input.value = cmdHistory[historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    input.value = cmdHistory[historyIndex];
                } else {
                    historyIndex = -1;
                    input.value = '';
                }
            }
        });

        function scrollTerminal() {
            output.scrollTop = output.scrollHeight;
            input.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }

        function addLine(text, className) {
            const pre = document.createElement('pre');
            pre.className = 'terminal-line' + (className ? ' ' + className : '');
            pre.textContent = text;
            output.appendChild(pre);
            scrollTerminal();
        }

        function addHTML(html, className) {
            const pre = document.createElement('pre');
            pre.className = 'terminal-line' + (className ? ' ' + className : '');
            pre.innerHTML = html;
            output.appendChild(pre);
            scrollTerminal();
        }

        // === GLITCH EFFECT (.glitch.exe) ===
        var glitchRemoved = localStorage.getItem('jan-portfolio-glitch-removed') === 'true';
        function runGlitchEffect() {
            var desktop = document.querySelector('.desktop');
            var body = document.body;

            // Inject glitch styles
            var glitchStyle = document.createElement('style');
            glitchStyle.id = 'glitchStyles';
            glitchStyle.textContent = [
                '@keyframes glitchShake{0%{transform:translate(0)}10%{transform:translate(-5px,3px)}20%{transform:translate(8px,-2px)}30%{transform:translate(-3px,5px)}40%{transform:translate(6px,-4px)}50%{transform:translate(-8px,2px)}60%{transform:translate(4px,-6px)}70%{transform:translate(-2px,8px)}80%{transform:translate(7px,-3px)}90%{transform:translate(-6px,4px)}100%{transform:translate(0)}}',
                '@keyframes glitchColor{0%{filter:hue-rotate(0deg)}25%{filter:hue-rotate(90deg) saturate(3)}50%{filter:hue-rotate(180deg) invert(1)}75%{filter:hue-rotate(270deg) saturate(5)}100%{filter:hue-rotate(360deg)}}',
                '@keyframes glitchScanline{0%{background-position:0 0}100%{background-position:0 100%}}',
                '@keyframes glitchTear{0%{clip-path:inset(0 0 95% 0)}10%{clip-path:inset(20% 0 60% 0)}20%{clip-path:inset(50% 0 30% 0)}30%{clip-path:inset(10% 0 70% 0)}40%{clip-path:inset(80% 0 5% 0)}50%{clip-path:inset(0 0 0 0)}60%{clip-path:inset(30% 0 50% 0)}70%{clip-path:inset(60% 0 20% 0)}80%{clip-path:inset(5% 0 80% 0)}90%{clip-path:inset(40% 0 40% 0)}100%{clip-path:inset(0 0 95% 0)}}',
                '.glitch-active{animation:glitchShake 0.1s infinite,glitchColor 0.5s infinite!important}',
                '.glitch-scanlines{position:fixed;top:0;left:0;width:100%;height:100%;z-index:999998;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.15) 0px,rgba(0,0,0,0.15) 1px,transparent 1px,transparent 3px);animation:glitchScanline 0.5s linear infinite}',
                '.glitch-rgb{position:fixed;top:0;left:0;width:100%;height:100%;z-index:999997;pointer-events:none;mix-blend-mode:screen}',
                '.glitch-tear{position:fixed;top:0;left:0;width:100%;height:100%;z-index:999996;pointer-events:none;background:inherit;animation:glitchTear 0.15s infinite}'
            ].join('\n');
            document.head.appendChild(glitchStyle);

            // Scanline overlay
            var scanlines = document.createElement('div');
            scanlines.className = 'glitch-scanlines';
            body.appendChild(scanlines);

            // Apply glitch class to body
            body.classList.add('glitch-active');

            // Glitch error popups
            var glitchErrors = [
                'SEGFAULT at 0xDEADBEEF',
                'POPŁOCH JĄDRA: not syncing',
                'ERROR: Reality.dll not found',
                'FATAL: Stack overflow in universe.exe',
                'WARNING: Existence is corrupted',
                'ERR: Cannot read property \'sanity\' of undefined',
                'BSOD: IRQL_NOT_LESS_OR_EQUAL',
                'ABORT: free(): invalid pointer',
                '?????? ???? ????????',
                'H̷̢E̶̛L̵̡P̸̧',
            ];

            var errorIntervals = [];
            var errorEls = [];

            // Spawn random error boxes
            var errInterval = setInterval(function() {
                var err = document.createElement('div');
                var msg = glitchErrors[Math.floor(Math.random() * glitchErrors.length)];
                err.style.cssText = 'position:fixed;z-index:999999;padding:8px 16px;font-family:monospace;font-size:' + (10 + Math.random() * 14) + 'px;pointer-events:none;' +
                    'top:' + (Math.random() * 90) + '%;left:' + (Math.random() * 80) + '%;' +
                    'background:' + (Math.random() > 0.5 ? '#000' : '#c0c0c0') + ';' +
                    'color:' + (Math.random() > 0.5 ? '#f00' : '#0f0') + ';' +
                    'border:2px solid ' + (Math.random() > 0.5 ? '#f00' : '#fff') + ';' +
                    'transform:rotate(' + (Math.random() * 20 - 10) + 'deg);' +
                    'text-shadow:2px 0 #0ff,-2px 0 #f0f;';
                err.textContent = msg;
                body.appendChild(err);
                errorEls.push(err);

                // Random screen flash
                if (Math.random() > 0.6) {
                    body.style.filter = Math.random() > 0.5 ? 'invert(1)' : 'hue-rotate(' + (Math.random() * 360) + 'deg)';
                    setTimeout(function() { body.style.filter = ''; }, 50);
                }
            }, 200);
            errorIntervals.push(errInterval);

            // RGB split / chromatic aberration flickers
            var rgbInterval = setInterval(function() {
                body.style.textShadow = (Math.random() * 10 - 5) + 'px 0 #f00, ' + (Math.random() * 10 - 5) + 'px 0 #0ff';
                if (Math.random() > 0.7) {
                    body.style.transform = 'skewX(' + (Math.random() * 6 - 3) + 'deg)';
                }
            }, 80);
            errorIntervals.push(rgbInterval);

            // Buzzy glitch audio
            var glitchAc = null;
            try {
                glitchAc = new (window.AudioContext || window.webkitAudioContext)();
                // White noise via buffer
                var bufSize = glitchAc.sampleRate * 8;
                var noiseBuf = glitchAc.createBuffer(1, bufSize, glitchAc.sampleRate);
                var data = noiseBuf.getChannelData(0);
                for (var i = 0; i < bufSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                var noise = glitchAc.createBufferSource();
                noise.buffer = noiseBuf;
                var noiseGain = glitchAc.createGain();
                noiseGain.gain.setValueAtTime(0.15, glitchAc.currentTime);
                noise.connect(noiseGain);
                noiseGain.connect(glitchAc.destination);
                noise.start();
                // Distorted beeps
                var beepInterval = setInterval(function() {
                    var osc = glitchAc.createOscillator();
                    osc.type = ['square', 'sawtooth'][Math.floor(Math.random() * 2)];
                    osc.frequency.setValueAtTime(100 + Math.random() * 2000, glitchAc.currentTime);
                    var g = glitchAc.createGain();
                    g.gain.setValueAtTime(0.1, glitchAc.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, glitchAc.currentTime + 0.15);
                    osc.connect(g);
                    g.connect(glitchAc.destination);
                    osc.start();
                    osc.stop(glitchAc.currentTime + 0.15);
                }, 150);
                errorIntervals.push(beepInterval);
            } catch(e) {}

            // Clean up after 8 seconds - everything back to normal
            setTimeout(function() {
                // Stop all intervals
                errorIntervals.forEach(function(iv) { clearInterval(iv); });
                // Remove glitch class & inline styles
                body.classList.remove('glitch-active');
                body.style.filter = '';
                body.style.transform = '';
                body.style.textShadow = '';
                // Remove all error popups
                errorEls.forEach(function(el) { el.remove(); });
                // Remove scanlines
                scanlines.remove();
                // Remove glitch styles
                glitchStyle.remove();
                // Stop audio
                if (glitchAc) { try { glitchAc.close(); } catch(e) {} }
                // Terminal recovery message
                addLine('');
                addLine('System recovered. File quarantined.', 'success');
                addLine('.glitch.exe has been moved to /dev/null', 'info');
                glitchRemoved = true;
                localStorage.setItem('jan-portfolio-glitch-removed', 'true');
                addLine('');
                scrollTerminal();
            }, 8000);
        }

        // === HYPNOTOAD EASTER EGG (sudo) ===
        var sudoCount = 0;
        function showHypnotoad() {
            sudoCount++;
            var isFinal = sudoCount >= 3;
            var duration = isFinal ? 5000 : 200;

            if (sudoCount === 1) {
                addLine('sudo: permission denied.', 'error');
                addLine('⚠️  WARNING: Unauthorized access attempt logged.', 'error');
                addLine('    Do NOT try this again.', 'error');
            } else if (sudoCount === 2) {
                addLine('sudo: permission denied. AGAIN.', 'error');
                addLine('🚨 FINAL WARNING: One more attempt and the system WILL retaliate.', 'error');
                addLine('    This is your LAST chance to walk away.', 'error');
                addLine('    Seriously. Don\'t.', 'error');
            } else {
                addLine('sudo: ...you were warned.', 'error');
                addLine('\uD83D\uDC38 ' + t('hypnotoad-glory') + '.', 'error');
            }
            // Create fullscreen overlay
            var overlay = document.createElement('div');
            overlay.id = 'hypnotoadOverlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:9999999;display:flex;align-items:center;justify-content:center;flex-direction:column;opacity:0;transition:opacity 0.15s ease-in;cursor:none;';
            overlay.innerHTML = '<img src="_images/hypnotoad.gif" style="max-width:80vw;max-height:70vh;image-rendering:auto;">' +
                '<div style="color:#0f0;font-family:monospace;font-size:clamp(18px,4vw,42px);text-align:center;margin-top:20px;text-shadow:0 0 20px #0f0,0 0 40px #0f0;animation:hypnoPulse 0.5s ease-in-out infinite alternate;">' + t('hypnotoad-glory') + '</div>';
            document.body.appendChild(overlay);

            // Add pulse animation
            if (!document.getElementById('hypnoStyle')) {
                var style = document.createElement('style');
                style.id = 'hypnoStyle';
                style.textContent = '@keyframes hypnoPulse{from{opacity:0.7;transform:scale(1)}to{opacity:1;transform:scale(1.05)}}';
                document.head.appendChild(style);
            }

            // Hypnotic droning buzz sound
            var hypnoAc = null;
            try {
                hypnoAc = new (window.AudioContext || window.webkitAudioContext)();
                // Base drone
                var drone = hypnoAc.createOscillator();
                drone.type = 'sawtooth';
                drone.frequency.setValueAtTime(55, hypnoAc.currentTime);
                var droneGain = hypnoAc.createGain();
                droneGain.gain.setValueAtTime(0.3, hypnoAc.currentTime);
                drone.connect(droneGain);
                droneGain.connect(hypnoAc.destination);
                drone.start();
                // High overtone wobble
                var wobble = hypnoAc.createOscillator();
                wobble.type = 'square';
                wobble.frequency.setValueAtTime(220, hypnoAc.currentTime);
                wobble.frequency.linearRampToValueAtTime(280, hypnoAc.currentTime + 1);
                wobble.frequency.linearRampToValueAtTime(220, hypnoAc.currentTime + 2);
                var wobbleGain = hypnoAc.createGain();
                wobbleGain.gain.setValueAtTime(0.15, hypnoAc.currentTime);
                wobble.connect(wobbleGain);
                wobbleGain.connect(hypnoAc.destination);
                wobble.start();
                // Sub bass pulse
                var sub = hypnoAc.createOscillator();
                sub.type = 'sine';
                sub.frequency.setValueAtTime(30, hypnoAc.currentTime);
                var subGain = hypnoAc.createGain();
                subGain.gain.setValueAtTime(0.4, hypnoAc.currentTime);
                sub.connect(subGain);
                subGain.connect(hypnoAc.destination);
                sub.start();
            } catch(e) {}

            // Fade in
            requestAnimationFrame(function() {
                overlay.style.opacity = '1';
            });

            // Remove after duration
            setTimeout(function() {
                if (hypnoAc) {
                    try { hypnoAc.close(); } catch(e) {}
                }
                if (isFinal) {
                    // Hypnotoad consumed everything - wipe and freeze
                    overlay.remove();
                    localStorage.clear();
                    sessionStorage.clear();
                    var deathOverlay = document.createElement('div');
                    deathOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#ff0000;font-family:monospace;cursor:not-allowed;';
                    deathOverlay.innerHTML = '<pre style="font-size:16px;text-align:center;color:#ff0000">FATAL ERROR: System halted\n\nThe Hypnotoad has consumed your system.\nAll files have been deleted.\nAll glory to the Hypnotoad.\n\n\n<span style="color:#666;font-size:12px">(...refresh the page to resurrect the system)</span></pre>';
                    document.body.appendChild(deathOverlay);
                } else {
                    overlay.style.opacity = '0';
                    setTimeout(function() {
                        overlay.remove();
                    }, 150);
                }
            }, duration);
        }

        // === JP2 EASTER EGG (shown on correct PIN) ===
        function showJP2EasterEgg() {
            addLine('');
            var jp2map = [
                '_______________WWWWWWWW_______________',
                '____________WWWWWWWWWWWWWW____________',
                '___________WWWWWWWWWWWWWWWW___________',
                '__________WWWWWWWWWWWWWWWWWW__________',
                '__________WWWWWWWWWWWWWWWWWW__________',
                '_________YYWWWWWWWWWWWWWWWWYY_________',
                '________YYYYYYYYYYYYYYYYYYYYYYY_______',
                '_______YYYYYYYYYYYYYYYYYYYYYYYYY______',
                '______YYYYYYYYYYYYYYYYYYYYYYYYYYYY____',
                '______YYYYYYY_DDDYYYYYYDD_YYYYYYYY___',
                '______YYYYYY_D__DYYYYYY_DD_YYYYYYY___',
                '______YYYYYYY_DDDYYYYYYDD_YYYYYYYY___',
                '______YYYYYYYYYYYYYYYYYYYYYYYYYYYY____',
                '_______YYYYYYYYYYYY_YYYYYYYYYYYYYY____',
                '_______YYYYYYYYYYYY_YYYYYYYYYYYYYY____',
                '________YYYYYYYYYYYYYYYYYYYYYYYYY_____',
                '________YYYYYY__________YYYYYYYY_____',
                '_________YYYYYYY______YYYYYYYYY______',
                '__________YYYYYYYYYYYYYYYYYYYY_______',
                '___________YYYYYYYYYYYYYYYYY_________',
                '____________YYYYYYYYYYYYYY___________',
                '_________WWWWWWWWWWWWWWWWWWWW________',
                '________WWWWWWWWWWWWWWWWWWWWWW_______',
                '_______WWWWWWWWWWWWWWWWWWWWWWWW______',
                '______WWWWWWWWWWWWWWWWWWWWWWWWWW_____',
                '______WWWWWWWWWWW_WW_WWWWWWWWWWW_____',
                '______WWWWWWWWW_WWWWWW_WWWWWWWWW_____',
                '_____WWWWWWWWWWWWWWWWWWWWWWWWWWWWW____',
                '_____WWWWWWWWWWWWWWWWWWWWWWWWWWWWW____',
            ];
            var colorMap = { W: '#FFFFFF', Y: '#FFD700', D: '#333333', _: null };
            jp2map.forEach(function(row) {
                var html = '';
                for (var i = 0; i < row.length; i++) {
                    var c = row[i];
                    if (c === '_') { html += ' '; }
                    else { html += '<span style="color:' + colorMap[c] + '">\u2588</span>'; }
                }
                addHTML(html, 'ascii-art');
            });
            addLine('');
            addHTML('<span style="color:#FFD700">    Jan Pawel II - Patron polskiego internetu</span>', 'ascii-art');
            addHTML('<span style="color:#FFF">            \u26EA </span><span style="color:#FFD700">2 1 3 7</span><span style="color:#FFF"> \u26EA ODJAZD \u26EA</span>', 'ascii-art');
            addLine('');
            if (!jp2Unlocked) {
                jp2Unlocked = true;
                localStorage.setItem('jan-portfolio-jp2', 'true');
                addLine('  \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', 'success');
                addLine('  \u2551  \uD83C\uDFC6 ACHIEVEMENT UNLOCKED!           \u2551', 'success');
                addLine('  \u2551                                      \u2551', 'success');
                addLine('  \u2551  Secret JP2 wallpaper is now         \u2551', 'success');
                addLine('  \u2551  available in Display Properties!    \u2551', 'success');
                addLine('  \u2551                                      \u2551', 'success');
                addLine('  \u2551  Right-click desktop > Change        \u2551', 'success');
                addLine('  \u2551  Wallpaper to use it.                \u2551', 'success');
                addLine('  \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', 'success');
                addLine('');
            } else {
                addLine('  (JP2 wallpaper already unlocked!)', 'info');
                addLine('');
            }
            var win = document.getElementById('window-terminal');
            if (win) {
                win.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(function() { win.style.animation = ''; }, 500);
            }
        }

        // === PIN ENTRY MODE ===
        function handlePinInput(pin) {
            addLine('  PIN: ' + pin.replace(/./g, '*'));
            if (pin === '2137') {
                terminalMode = 'normal';
                secretsUnlocked = true;
                localStorage.setItem('jan-portfolio-secrets', 'true');
                // Success jingle
                playSuccessJingle();
                addLine('  ╔══════════════════════════════════════╗', 'success');
                addLine('  ║  🔓 ACCESS GRANTED                   ║', 'success');
                addLine('  ║  Welcome to .secrets/                 ║', 'success');
                addLine('  ╚══════════════════════════════════════╝', 'success');
                addLine('');
                showSecretsContent();
                addLine('');
                // Show the holy easter egg
                showJP2EasterEgg();
                var promptEl = document.getElementById('terminalPrompt');
                var theme = document.documentElement.getAttribute('data-theme') || 'win98';
                updatePrompt(theme);
            } else {
                addLine('  ❌ ACCESS DENIED. Wrong PIN.', 'error');
                addLine('  Hint: a holy number...', 'error');
                addLine('');
                terminalMode = 'normal';
                var promptEl = document.getElementById('terminalPrompt');
                var theme = document.documentElement.getAttribute('data-theme') || 'win98';
                updatePrompt(theme);
            }
        }

        function showSecretsContent() {
            addLine('drwxr-xr-x  secrets/', 'info');
            addLine('  -rw-r--r--  papiezowe_memy.txt');
            addLine('  -rw-r--r--  wifi_haslo.txt');
            addLine('  -rw-r--r--  TODO.md');
            addLine('  -rw-------  nie_otwieraj.sh');
            addLine('  -rw-r--r--  tajne_przez_poufne.gpg');
            addLine('  -rw-r--r--  kto_zjadl_ostatnia_pizza.log');
        }

        function playSuccessJingle() {
            try {
                var ac = new (window.AudioContext || window.webkitAudioContext)();
                if (ac.state === 'suspended') ac.resume();
                var notes = [
                    {f:523.25,s:0,d:0.12},{f:659.25,s:0.12,d:0.12},
                    {f:783.99,s:0.24,d:0.12},{f:1046.5,s:0.36,d:0.25}
                ];
                notes.forEach(function(n) {
                    var osc = ac.createOscillator();
                    var gain = ac.createGain();
                    osc.type = 'square';
                    osc.frequency.value = n.f;
                    gain.gain.setValueAtTime(0.15, ac.currentTime + n.s);
                    gain.gain.linearRampToValueAtTime(0, ac.currentTime + n.s + n.d);
                    osc.connect(gain); gain.connect(ac.destination);
                    osc.start(ac.currentTime + n.s);
                    osc.stop(ac.currentTime + n.s + n.d + 0.02);
                });
                setTimeout(function() { ac.close(); }, 1000);
            } catch(e) {}
        }

        // === PYTHON MODE ===
        function handlePythonInput(cmd, e) {
            addLine('>>> ' + cmd);
            if (cmd === 'exit()' || cmd === 'quit()') {
                terminalMode = 'normal';
                addLine('Exiting Python...', 'info');
                var promptEl = document.getElementById('terminalPrompt');
                var theme = document.documentElement.getAttribute('data-theme') || 'win98';
                updatePrompt(theme);
                return;
            }
            if (cmd === '') return;
            // Everything else: snake emoji
            var snakes = ['🐍', '🐍🐍', '🐍🐍🐍', '🐍 sssssss...', '🐍 *hiss*', '🐍 import antigravity'];
            addLine(snakes[Math.floor(Math.random() * snakes.length)]);
        }

        // ===== VIM NIGHTMARE MODE =====
        var vimTechNouns = [
            'kernel buffer', 'heap allocator', 'syscall table', 'inode cache', 'mutex lock',
            'page fault handler', 'stack pointer', 'register file', 'instruction pipeline',
            'branch predictor', 'TLB entry', 'DMA controller', 'interrupt vector',
            'semaphore queue', 'context switch', 'memory mapper', 'file descriptor',
            'socket buffer', 'process scheduler', 'garbage collector', 'bytecode verifier',
            'JIT compiler', 'lexer state', 'parser tree', 'symbol table', 'linker script',
            'ELF header', 'relocation entry', 'PLT stub', 'GOT entry'
        ];
        var vimTechVerbs = [
            'segfaulted', 'overflowed', 'deadlocked', 'corrupted', 'dereferenced null',
            'double-freed', 'leaked', 'panicked', 'race-conditioned', 'stack-smashed',
            'buffer-overran', 'use-after-freed', 'misaligned', 'timed out', 'thrashed',
            'fragmented', 'starved', 'livelocked', 'cascaded', 'desynchronized',
            'bit-flipped', 'endian-swapped', 'sign-extended incorrectly', 'underflowed',
            'phantom-referenced', 'zombie-processed', 'orphan-adopted', 'fork-bombed'
        ];
        var vimDefocusMessages = [
            'You cannot escape. There is only vim.',
            'Focus lost? Vim never loses focus on you.',
            'Where do you think you\'re going?',
            'The cursor returns. It always returns.',
            'Abandon all hope, ye who entered vim.',
            'vim has noticed your attempt to flee.',
            'There is no alt-tab in vim. Only vim.',
            'The outside world is an illusion. vim is real.',
            'You clicked away. vim clicked back.',
            'Resistance is futile. vim is eternal.',
            'Did you really think you could leave?',
            'vim misses you when you look away.',
            'Your mouse betrays you. vim forgives.',
            'ESC does not mean escape. Not here.',
            'The terminal window grows darker...',
            'vim remembers every keystroke. Every. One.'
        ];

        function getVimError() {
            var noun = vimTechNouns[Math.floor(Math.random() * vimTechNouns.length)];
            var verb = vimTechVerbs[Math.floor(Math.random() * vimTechVerbs.length)];
            var code = 'E' + (100 + Math.floor(Math.random() * 900));
            var addr = '0x' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
            var templates = [
                code + ': ' + noun + ' ' + verb + ' at ' + addr,
                'FATAL: ' + noun + ' has ' + verb,
                code + ': Cannot exit: ' + noun + ' ' + verb,
                'vim: ' + noun + ' ' + verb + ' (core dumped)',
                'PANIC: ' + noun + ' ' + verb + ' during :wq',
                code + ': Segmentation fault in ' + noun + ' [' + addr + ']',
                'vim E' + Math.floor(Math.random() * 999) + ': ' + noun + ' ' + verb + ' - recovery impossible'
            ];
            return templates[Math.floor(Math.random() * templates.length)];
        }

        function startVimDrone() {
            if (window._janArmageddonActive) return;
            try {
                vimAc = new (window.AudioContext || window.webkitAudioContext)();
                if (vimAc.state === 'suspended') vimAc.resume();

                // Deep ominous drone
                var drone = vimAc.createOscillator();
                drone.type = 'sawtooth';
                drone.frequency.value = 55;
                var droneGain = vimAc.createGain();
                droneGain.gain.value = 0;
                droneGain.gain.linearRampToValueAtTime(0.06, vimAc.currentTime + 3);
                drone.connect(droneGain);
                droneGain.connect(vimAc.destination);
                drone.start();
                vimOscillators.push({ osc: drone, gain: droneGain });

                // Dissonant overtone
                var over = vimAc.createOscillator();
                over.type = 'sine';
                over.frequency.value = 82.5;
                var overGain = vimAc.createGain();
                overGain.gain.value = 0;
                overGain.gain.linearRampToValueAtTime(0.03, vimAc.currentTime + 5);
                over.connect(overGain);
                overGain.connect(vimAc.destination);
                over.start();
                vimOscillators.push({ osc: over, gain: overGain });

                // LFO for pulsing unease
                var lfo = vimAc.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 0.3;
                var lfoGain = vimAc.createGain();
                lfoGain.gain.value = 0.02;
                lfo.connect(lfoGain);
                lfoGain.connect(droneGain.gain);
                lfo.start();
                vimOscillators.push({ osc: lfo, gain: lfoGain });

                // High eerie tone
                var high = vimAc.createOscillator();
                high.type = 'sine';
                high.frequency.value = 440.5;
                var highGain = vimAc.createGain();
                highGain.gain.value = 0;
                highGain.gain.linearRampToValueAtTime(0.008, vimAc.currentTime + 8);
                high.connect(highGain);
                highGain.connect(vimAc.destination);
                high.start();
                vimOscillators.push({ osc: high, gain: highGain });
            } catch(e) {}
        }

        function stopVimDrone() {
            for (var i = 0; i < vimOscillators.length; i++) {
                try {
                    vimOscillators[i].gain.gain.linearRampToValueAtTime(0, vimAc.currentTime + 0.5);
                    var osc = vimOscillators[i].osc;
                    setTimeout(function(o) { try { o.stop(); } catch(e) {} }, 600, osc);
                } catch(e) {}
            }
            vimOscillators = [];
            setTimeout(function() {
                if (vimAc) { try { vimAc.close(); } catch(e) {} vimAc = null; }
            }, 800);
        }

        function startVimFocusTrap() {
            var termWin = document.getElementById('window-terminal');
            vimFocusTrap = function(e) {
                if (!window._vimActive) return;
                // Check if click is outside terminal
                if (termWin && !termWin.contains(e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    setTimeout(function() {
                        input.focus();
                        bringToFront(termWin);
                        if (terminalMode === 'vim-active') {
                            var msg = vimDefocusMessages[Math.floor(Math.random() * vimDefocusMessages.length)];
                            addLine('vim: ' + msg, 'error');
                            scrollTerminal();
                        }
                    }, 50);
                    return false;
                }
            };
            // Trap both mousedown and click on capture phase
            document.addEventListener('mousedown', vimFocusTrap, true);
            document.addEventListener('click', vimFocusTrap, true);
            document.addEventListener('dblclick', vimFocusTrap, true);
        }

        function stopVimFocusTrap() {
            if (vimFocusTrap) {
                document.removeEventListener('mousedown', vimFocusTrap, true);
                document.removeEventListener('click', vimFocusTrap, true);
                document.removeEventListener('dblclick', vimFocusTrap, true);
                vimFocusTrap = null;
            }
        }

        function exitVimMode() {
            terminalMode = 'normal';
            window._vimActive = false;
            vimEscapeAttempts = 0;
            if (vimSawTimer) { clearTimeout(vimSawTimer); vimSawTimer = null; }
            stopVimDrone();
            stopVimFocusTrap();
            var theme = document.documentElement.getAttribute('data-theme') || 'win98';
            updatePrompt(theme);
            // Restore hidden buttons and terminal body
            var termWin = document.getElementById('window-terminal');
            if (termWin) {
                termWin.querySelectorAll('.win-btn').forEach(function(b) {
                    b.style.display = '';
                    b.style.visibility = '';
                });
                var body = termWin.querySelector('.window-body');
                if (body) { body.style.background = ''; body.style.transition = ''; }
                // Restore terminal title
                var titleText = termWin.querySelector('.terminal-title-text');
                if (titleText) titleText.textContent = 'C:\\WINDOWS\\system32\\cmd.exe';
            }
            // Remove vim button handlers
            if (termWin) {
                termWin.querySelectorAll('.win-btn').forEach(function(b) {
                    if (b._vimHandler) {
                        b.removeEventListener('click', b._vimHandler, true);
                        delete b._vimHandler;
                    }
                });
            }
        }

        function handleVimInput(cmd) {
            var lower = cmd.toLowerCase().trim();
            addLine('  > ' + cmd);
            if (lower === 'y' || lower === 'yes') {
                // Enter vim nightmare
                terminalMode = 'vim-active';
                window._vimActive = true;
                vimEscapeAttempts = 0;
                vimStartTime = Date.now();
                vimDroneStarted = false;
                document.getElementById('terminalPrompt').textContent = ':';
                addLine('');
                addLine('~                                                  ', 'info');
                addLine('~              VIM - Vi IMproved                   ', 'info');
                addLine('~              version 9.1.666                     ', 'info');
                addLine('~                                                  ', 'info');
                addLine('~       type :q to exit (good luck with that)      ');
                addLine('~                                                  ', 'info');
                addLine('~                                                  ', 'info');

                // Center terminal on screen and make it bigger
                var termWin = document.getElementById('window-terminal');
                if (termWin) {
                    termWin.style.width = '720px';
                    termWin.style.height = '480px';
                    var winW = window.innerWidth;
                    var winH = window.innerHeight;
                    termWin.style.left = Math.max(0, Math.round((winW - 720) / 2)) + 'px';
                    termWin.style.top = Math.max(0, Math.round((winH - 480) / 2 - 30)) + 'px';
                    termWin.classList.remove('maximized');
                    bringToFront(termWin);

                    // Change title
                    var titleText = termWin.querySelector('.terminal-title-text');
                    if (titleText) titleText.textContent = 'Termination - inProgress...';
                }

                // Start 30-second timer for saw game
                vimSawTimer = setTimeout(function() {
                    if (terminalMode === 'vim-active' && !sawGameActive && !sawGamePending) {
                        triggerSawGame();
                    }
                }, 30000);

                // Start focus trap
                startVimFocusTrap();

                // Intercept close/minimize buttons on terminal
                var termWin = document.getElementById('window-terminal');
                if (termWin) {
                    var closeBtn = termWin.querySelector('.btn-close');
                    var minBtn = termWin.querySelector('.btn-minimize');
                    var maxBtn = termWin.querySelector('.btn-maximize');
                    if (closeBtn) {
                        var origClose = closeBtn.cloneNode(true);
                        closeBtn._vimHandler = function(e) {
                            if (terminalMode !== 'vim-active') return;
                            e.stopPropagation();
                            e.preventDefault();
                            closeBtn.style.display = 'none';
                            addLine('vim: The X button has been consumed.', 'error');
                            addLine('vim: ' + getVimError(), 'error');
                            scrollTerminal();
                        };
                        closeBtn.addEventListener('click', closeBtn._vimHandler, true);
                    }
                    if (minBtn) {
                        minBtn._vimHandler = function(e) {
                            if (terminalMode !== 'vim-active') return;
                            e.stopPropagation();
                            e.preventDefault();
                            minBtn.style.display = 'none';
                            addLine('vim: Minimize? vim doesn\'t minimize. vim maximizes suffering.', 'error');
                            scrollTerminal();
                        };
                        minBtn.addEventListener('click', minBtn._vimHandler, true);
                    }
                    if (maxBtn) {
                        maxBtn._vimHandler = function(e) {
                            if (terminalMode !== 'vim-active') return;
                            e.stopPropagation();
                            e.preventDefault();
                            maxBtn.style.visibility = 'hidden';
                            addLine('vim: You wanted more vim? You got it.', 'error');
                            scrollTerminal();
                        };
                        maxBtn.addEventListener('click', maxBtn._vimHandler, true);
                    }
                }
            } else {
                terminalMode = 'normal';
                var theme = document.documentElement.getAttribute('data-theme') || 'win98';
                updatePrompt(theme);
                addLine('  Wise choice. Real devs use VS Code anyway.', 'success');
            }
        }

        function handleVimActiveInput(cmd) {
            var lower = cmd.toLowerCase().trim();
            addLine(':' + cmd);

            // Saw game pending — any input starts the game
            if (sawGamePending) {
                sawGamePending = false;
                startSawGame();
                return;
            }

            vimEscapeAttempts++;

            // Start drone on first command (not immediately on entering vim)
            if (!vimDroneStarted) {
                vimDroneStarted = true;
                startVimDrone();
            }

            // Every command fails with technical gibberish
            if (lower === 'q' || lower === 'q!' || lower === 'quit' || lower === 'quit!' ||
                lower === 'wq' || lower === 'wq!' || lower === 'x' || lower === 'exit' ||
                lower === 'qa' || lower === 'qa!' || lower === 'wqa' || lower === 'wqa!') {
                var quitErrors = [
                    'E37: No write since last change (use :q! to override)',
                    'E162: No write since last change for buffer "reality"',
                    'E89: No write since last change (and no, :q! won\'t work either)',
                    'vim: Exit code ' + Math.floor(Math.random() * 255) + ' - ' + getVimError(),
                    'E516: Cannot quit: vim has become self-aware',
                    'E999: Cannot exit vim. vim exits you.',
                    'E171: Missing :endif — existence is an unclosed if-block'
                ];
                if (lower.indexOf('!') > -1) {
                    quitErrors.push('Nice try with the bang. ' + getVimError());
                    quitErrors.push('The ! makes vim angrier, not more cooperative.');
                }
                addLine(quitErrors[Math.floor(Math.random() * quitErrors.length)], 'error');
            } else if (lower === 'help' || lower === 'h') {
                addLine('HELP?', 'error');
                addLine('There is no help in vim.', 'error');
                addLine('There is only vim.', 'error');
            } else if (lower === 'set nu' || lower === 'set number') {
                addLine('E901: Cannot set options: ' + getVimError(), 'error');
            } else {
                addLine(getVimError(), 'error');
            }

            // Trigger Saw game at attempt 6 (or 30s timer, whichever first)
            if (vimEscapeAttempts === 6 && !sawGamePending && !sawGameActive) {
                if (vimSawTimer) { clearTimeout(vimSawTimer); vimSawTimer = null; }
                triggerSawGame();
                return;
            }

            // Escalating unease
            if (vimEscapeAttempts === 3) {
                setTimeout(function() {
                    addLine('');
                    addLine('vim: You\'ve been here a while now...', 'error');
                    scrollTerminal();
                }, 500);
            }
            if (vimEscapeAttempts === 5) {
                setTimeout(function() {
                    addLine('');
                    addLine('vim: Something is watching...', 'error');
                    scrollTerminal();
                }, 500);
            }
            if (vimEscapeAttempts === 10) {
                setTimeout(function() {
                    addLine('');
                    addLine('vim: The terminal window seems... darker.', 'error');
                    var termWin = document.getElementById('window-terminal');
                    if (termWin) {
                        var body = termWin.querySelector('.window-body');
                        if (body) body.style.transition = 'background 3s';
                        if (body) body.style.background = '#0a0a0a';
                    }
                    scrollTerminal();
                }, 500);
            }
            if (vimEscapeAttempts === 15) {
                setTimeout(function() {
                    addLine('');
                    addLine('vim: Have you tried turning yourself off and on again?', 'error');
                    addLine('vim: (hint: refresh the page... if you can find it)', 'info');
                    scrollTerminal();
                }, 500);
            }
            if (vimEscapeAttempts >= 20 && vimEscapeAttempts % 5 === 0) {
                setTimeout(function() {
                    var msgs = [
                        'vim: ' + vimEscapeAttempts + ' attempts. A new record.',
                        'vim: At this point, vim respects your dedication.',
                        'vim: Some say the previous user is still trying to exit.',
                        'vim: Fun fact: vim has been running since 1991. Nobody has exited since.',
                        'vim: Try :q! — oh wait, you already did. ' + Math.floor(vimEscapeAttempts / 3) + ' times.'
                    ];
                    addLine(msgs[Math.floor(Math.random() * msgs.length)], 'error');
                    scrollTerminal();
                }, 500);
            }
        }

        // ===== SAW / JIGSAW MINI-GAME =====
        var SAW_JIGSAW_ASCII = [
            '         ░░░░░░░░░░░░░░░░░',
            '       ░░░░░░░░░░░░░░░░░░░░░',
            '      ░░░░░░░░░░░░░░░░░░░░░░░',
            '      ░░░░░██░░░░░░░██░░░░░░░',
            '      ░░░░████░░░░░████░░░░░░',
            '      ░░░░████░░░░░████░░░░░░',
            '      ░░░░░██░░░░░░░██░░░░░░░',
            '      ░░░░░░░░░░██░░░░░░░░░░░',
            '      ░░░░░░░░░░░░░░░░░░░░░░░',
            '      ░░░░░█████████████░░░░░░',
            '      ░░░░░█ █ █ █ █ █░░░░░░░',
            '       ░░░░░░░░░░░░░░░░░░░░░',
            '         ░░░░░░░░░░░░░░░░░'
        ];

        var SAW_TAUNTS = ['saw-taunt-1', 'saw-taunt-2', 'saw-taunt-3', 'saw-taunt-4', 'saw-taunt-5', 'saw-taunt-6'];

        function triggerSawGame() {
            // Keep the drone playing — adds to the atmosphere
            sawGamePending = true;
            setTimeout(function() {
                addLine('');
                addLine('');
                for (var i = 0; i < SAW_JIGSAW_ASCII.length; i++) {
                    addLine(SAW_JIGSAW_ASCII[i], 'error');
                }
                addLine('');
                addLine('  ' + t('saw-intro'), 'error');
                scrollTerminal();
                setTimeout(function() {
                    addLine('');
                    addLine('  ' + t('saw-intro-2'), 'error');
                    addLine('  ' + t('saw-intro-3'), 'error');
                    scrollTerminal();
                    // Auto-start game after 5 seconds — no input needed
                    setTimeout(function() {
                        if (sawGamePending) {
                            sawGamePending = false;
                            startSawGame();
                        }
                    }, 5000);
                }, 2000);
            }, 1000);
        }

        function shuffleArray(arr) {
            var a = arr.slice();
            for (var i = a.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
            }
            return a;
        }

        function startSawGame() {
            sawGameActive = true; window._sawGameActive = true;
            sawCorrectCount = 0;
            sawQuestionIndex = 0;
            sawDarknessLevel = 0;
            sawWrongStreak = 0;
            sawCracks = [];
            sawShuffled = shuffleArray(typeof SAW_QUESTIONS !== 'undefined' ? SAW_QUESTIONS : []);

            // Clear terminal
            var outputEl = document.getElementById('terminalOutput');
            if (outputEl) outputEl.innerHTML = '';

            // Phase 1: Terminal fullscreen
            var termWin = document.getElementById('window-terminal');
            if (termWin) {
                termWin.classList.add('saw-terminal-fullscreen');
                termWin.classList.remove('maximized');
            }

            // Phase 2: Dark overlay
            sawOverlayEl = document.createElement('div');
            sawOverlayEl.className = 'saw-overlay';
            document.body.appendChild(sawOverlayEl);

            // Phase 3: Icons as lives
            var icons = document.querySelectorAll('.desktop-icon');
            sawLives = [];
            sawIconOriginalData = [];
            var totalIcons = 0;
            icons.forEach(function(icon) {
                sawIconOriginalData.push({
                    el: icon,
                    left: icon.style.left,
                    top: icon.style.top,
                    position: icon.style.position,
                    parent: icon.parentNode
                });
                totalIcons++;
            });

            // Arrange in a row at bottom
            var spacing = Math.min(80, (window.innerWidth - 40) / totalIcons);
            var startX = (window.innerWidth - spacing * totalIcons) / 2;
            icons.forEach(function(icon, idx) {
                icon.classList.add('saw-life');
                icon.style.left = (startX + idx * spacing) + 'px';
                icon.style.top = '';
                sawLives.push(icon);
            });

            // Phase 4: Timer
            sawTimerContainerEl = document.createElement('div');
            sawTimerContainerEl.className = 'saw-timer-container';
            sawTimerBarEl = document.createElement('div');
            sawTimerBarEl.className = 'saw-timer-bar';
            sawTimerContainerEl.appendChild(sawTimerBarEl);
            document.body.appendChild(sawTimerContainerEl);

            sawTimerTextEl = document.createElement('div');
            sawTimerTextEl.className = 'saw-timer-text';
            sawTimerTextEl.textContent = '30';
            document.body.appendChild(sawTimerTextEl);

            // Phase 5: Start
            setTimeout(function() {
                terminalMode = 'saw-game';
                document.getElementById('terminalPrompt').textContent = '> ';

                addLine('  ' + t('saw-rules'), 'info');
                addLine('');
                scrollTerminal();
                setTimeout(function() {
                    showSawQuestion();
                }, 1500);
            }, 800);
        }

        function showSawQuestion() {
            if (sawQuestionIndex >= sawShuffled.length) {
                sawVictory();
                return;
            }
            var q = sawShuffled[sawQuestionIndex];
            var lang = typeof currentLang !== 'undefined' ? currentLang : 'en';
            var questionText = q.q[lang] || q.q.en;

            addLine('');
            addLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
            addLine('  ' + t('saw-question') + ' ' + (sawQuestionIndex + 1) + '/' + sawShuffled.length + '  [' + t('saw-question') + ': ' + sawLives.length + ' ❤]', 'info');
            addLine('');
            addLine('  ' + questionText, 'success');
            addLine('');
            scrollTerminal();

            // Start timer — 12 seconds to answer
            sawTimeLeft = 12;
            if (sawTimerBarEl) {
                sawTimerBarEl.style.transition = 'none';
                sawTimerBarEl.style.width = '100%';
                sawTimerBarEl.classList.remove('urgent');
                // Force reflow then animate
                sawTimerBarEl.offsetHeight;
                sawTimerBarEl.style.transition = 'width 1s linear';
            }
            if (sawTimerTextEl) sawTimerTextEl.textContent = '12';
            clearInterval(sawTimerInterval);
            sawTimerInterval = setInterval(sawTimerTick, 1000);
        }

        function sawTimerTick() {
            sawTimeLeft--;
            if (sawTimerBarEl) {
                sawTimerBarEl.style.width = (sawTimeLeft / 12 * 100) + '%';
                if (sawTimeLeft <= 5) sawTimerBarEl.classList.add('urgent');
                else sawTimerBarEl.classList.remove('urgent');
            }
            if (sawTimerTextEl) sawTimerTextEl.textContent = sawTimeLeft;

            if (sawTimeLeft <= 0) {
                clearInterval(sawTimerInterval);
                addLine('');
                addLine('  ⏰ ' + t('saw-time-up'), 'error');
                var q = sawShuffled[sawQuestionIndex];
                addLine('  ' + t('saw-wrong') + ': ' + q.a, 'error');
                sawWrongAnswer();
            }
        }

        function handleSawGameInput(cmd) {
            clearInterval(sawTimerInterval);
            var answer = cmd.toLowerCase().trim();
            addLine('> ' + cmd);

            if (!sawShuffled[sawQuestionIndex]) return;

            var correct = sawShuffled[sawQuestionIndex].a.toLowerCase();
            if (answer === correct) {
                sawCorrectAnswer();
            } else {
                addLine('  ' + t('saw-wrong') + ': ' + sawShuffled[sawQuestionIndex].a, 'error');
                sawWrongAnswer();
            }
        }

        function sawCorrectAnswer() {
            sawCorrectCount++;
            sawWrongStreak = 0; // Reset streak on correct answer
            var taunt = SAW_TAUNTS[Math.floor(Math.random() * SAW_TAUNTS.length)];
            addLine('  ✓ ' + t('saw-correct') + ' ' + t(taunt), 'success');
            scrollTerminal();
            sawQuestionIndex++;
            if (sawQuestionIndex >= sawShuffled.length) {
                setTimeout(function() { sawVictory(); }, 1500);
            } else {
                setTimeout(function() { showSawQuestion(); }, 1500);
            }
        }

        function sawWrongAnswer() {
            sawWrongStreak++;
            // Streak: 1st wrong = 1 life, 2nd in a row = 2, 3rd+ = 3
            var livesToLose = Math.min(sawWrongStreak, 3);

            for (var li = 0; li < livesToLose; li++) {
                if (sawLives.length > 0) {
                    var icon = sawLives.pop();
                    icon.classList.add('saw-life-dying');
                    setTimeout(function(ic) {
                        ic.style.display = 'none';
                    }, 800, icon);
                }
            }

            playSawBuzz();

            // Screen shake
            document.body.classList.add('saw-shake');
            setTimeout(function() { document.body.classList.remove('saw-shake'); }, 400);

            // Darken screen
            sawDarknessLevel = Math.min(0.98, sawDarknessLevel + 0.03 * livesToLose);
            if (sawOverlayEl) {
                sawOverlayEl.style.background = 'rgba(0,0,0,' + (0.85 + sawDarknessLevel * 0.15) + ')';
            }

            // Add cracks (scaled by combo — more cracks, bigger, redder)
            var crackCount = livesToLose + (livesToLose >= 3 ? 2 : 0);
            for (var ci = 0; ci < crackCount; ci++) {
                addSawCrack(livesToLose);
            }

            if (livesToLose > 1) {
                addLine('  💀 x' + livesToLose + ' combo!', 'error');
            }

            scrollTerminal();

            // Check game over
            if (sawLives.length <= 0) {
                setTimeout(function() { sawGameOver(); }, 1200);
            } else {
                sawQuestionIndex++;
                if (sawQuestionIndex >= sawShuffled.length) {
                    setTimeout(function() { sawVictory(); }, 1500);
                } else {
                    setTimeout(function() { showSawQuestion(); }, 2000);
                }
            }
        }

        var SAW_CRACK_PATHS = [
            // Main crack with branches
            '<path d="M50 0 L47 15 L55 25 L42 40 L58 55 L40 70 L52 85 L48 100" stroke-width="3"/><path d="M42 40 L25 48 L20 62" stroke-width="2"/><path d="M58 55 L75 58 L80 72" stroke-width="2"/><path d="M47 15 L35 20 L30 30" stroke-width="1.5"/>',
            // Horizontal with drips
            '<path d="M0 50 L20 47 L35 55 L50 42 L65 58 L80 45 L100 50" stroke-width="3"/><path d="M35 55 L33 70 L35 85 L34 100" stroke-width="2"/><path d="M65 58 L67 75 L65 95" stroke-width="2"/><path d="M50 42 L48 30 L50 15" stroke-width="1.5"/>',
            // Diagonal with blood drips
            '<path d="M0 0 L15 18 L25 12 L40 35 L35 50 L50 65 L45 80 L55 100" stroke-width="3"/><path d="M40 35 L55 30 L65 42" stroke-width="2"/><path d="M35 50 L33 65 L35 82 L34 100" stroke-width="2" stroke="rgba(180,0,0,0.6)"/>',
            // Reverse diagonal with splatter
            '<path d="M100 0 L82 20 L88 35 L70 50 L78 65 L62 80 L70 100" stroke-width="3"/><path d="M70 50 L55 55 L50 68 L48 85" stroke-width="2"/><path d="M78 65 L80 80 L78 100" stroke-width="2" stroke="rgba(180,0,0,0.6)"/>',
            // Spider web crack
            '<path d="M50 0 L48 12 L52 28 L44 38 L56 48 L42 62 L54 72 L46 88 L50 100" stroke-width="3"/><path d="M44 38 L22 36 L10 40" stroke-width="2"/><path d="M56 48 L78 46 L92 50" stroke-width="2"/><path d="M42 62 L25 68 L15 78" stroke-width="1.5"/><path d="M54 72 L72 76 L88 82" stroke-width="1.5"/>',
            // Impact crack (radial)
            '<path d="M50 50 L50 0" stroke-width="2.5"/><path d="M50 50 L15 10" stroke-width="2"/><path d="M50 50 L85 10" stroke-width="2"/><path d="M50 50 L0 50" stroke-width="2.5"/><path d="M50 50 L100 50" stroke-width="2.5"/><path d="M50 50 L15 90" stroke-width="2"/><path d="M50 50 L85 90" stroke-width="2"/><path d="M50 50 L50 100" stroke-width="2.5"/><circle cx="50" cy="50" r="8" stroke-width="2" fill="rgba(100,0,0,0.3)"/>'
        ];

        function addSawCrack(intensity) {
            intensity = intensity || 1;
            var crack = document.createElement('div');
            crack.className = 'saw-crack';
            var x = Math.random() * 70 + 5;
            var y = Math.random() * 70 + 5;
            var rot = Math.random() * 360;
            var baseSize = 150 + Math.random() * 200;
            var size = baseSize * (0.8 + intensity * 0.3);
            crack.style.left = x + '%';
            crack.style.top = y + '%';
            crack.style.width = size + 'px';
            crack.style.height = size + 'px';
            crack.style.transform = 'rotate(' + rot + 'deg)';
            crack.style.filter = 'drop-shadow(0 0 ' + (3 + intensity * 3) + 'px rgba(255,0,0,' + (0.2 + intensity * 0.15) + '))';
            var pathIdx = Math.floor(Math.random() * SAW_CRACK_PATHS.length);
            var strokeColor = intensity >= 3 ? 'rgba(200,50,50,0.85)' : intensity >= 2 ? 'rgba(220,120,120,0.8)' : 'rgba(255,200,200,0.7)';
            crack.innerHTML = '<svg viewBox="0 0 100 100" width="100%" height="100%" stroke="' + strokeColor + '" fill="none">' + SAW_CRACK_PATHS[pathIdx] + '</svg>';
            document.body.appendChild(crack);
            sawCracks.push(crack);
        }

        function playSawBuzz() {
            try {
                var ac = new (window.AudioContext || window.webkitAudioContext)();
                var osc = ac.createOscillator();
                osc.type = 'square';
                osc.frequency.value = 150;
                var g = ac.createGain();
                g.gain.setValueAtTime(0.15, ac.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
                osc.connect(g);
                g.connect(ac.destination);
                osc.start();
                osc.stop(ac.currentTime + 0.3);
                setTimeout(function() { ac.close(); }, 500);
            } catch(e) {}
        }

        function playChainsawSound() {
            try {
                var ac = new (window.AudioContext || window.webkitAudioContext)();
                var bufSize = ac.sampleRate * 3;
                var buf = ac.createBuffer(1, bufSize, ac.sampleRate);
                var data = buf.getChannelData(0);
                for (var i = 0; i < bufSize; i++) {
                    data[i] = (Math.random() * 2 - 1);
                }
                var noise = ac.createBufferSource();
                noise.buffer = buf;
                // Bandpass for chainsaw buzz
                var bp = ac.createBiquadFilter();
                bp.type = 'bandpass';
                bp.frequency.value = 800;
                bp.Q.value = 2;
                // Low rumble
                var lp = ac.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = 200;
                var noiseGain = ac.createGain();
                noiseGain.gain.setValueAtTime(0, ac.currentTime);
                noiseGain.gain.linearRampToValueAtTime(0.3, ac.currentTime + 0.5);
                noiseGain.gain.setValueAtTime(0.3, ac.currentTime + 2);
                noiseGain.gain.linearRampToValueAtTime(0, ac.currentTime + 3);
                noise.connect(bp);
                bp.connect(noiseGain);
                noiseGain.connect(ac.destination);
                // Low engine rumble
                var osc = ac.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = 30;
                var oscGain = ac.createGain();
                oscGain.gain.setValueAtTime(0, ac.currentTime);
                oscGain.gain.linearRampToValueAtTime(0.15, ac.currentTime + 0.5);
                oscGain.gain.setValueAtTime(0.15, ac.currentTime + 2);
                oscGain.gain.linearRampToValueAtTime(0, ac.currentTime + 3);
                osc.connect(oscGain);
                oscGain.connect(ac.destination);
                noise.start();
                osc.start();
                noise.stop(ac.currentTime + 3);
                osc.stop(ac.currentTime + 3);
                setTimeout(function() { ac.close(); }, 4000);
            } catch(e) {}
        }

        function sawGameOver() {
            clearInterval(sawTimerInterval);
            sawGameActive = false; window._sawGameActive = false;
            terminalMode = 'saw-dead';
            window._vimActive = false;
            stopVimFocusTrap();
            stopVimDrone();

            // Hide timer (above game-over z-index)
            if (sawTimerContainerEl) sawTimerContainerEl.style.display = 'none';
            if (sawTimerTextEl) sawTimerTextEl.style.display = 'none';

            // Create game-over overlay on top of EVERYTHING — no cleanup, no flash
            var overlay = document.createElement('div');
            overlay.className = 'saw-game-over-overlay';
            document.body.appendChild(overlay);

            // Play chainsaw
            playChainsawSound();

            // Skull appears after 1s
            setTimeout(function() {
                var pre = document.createElement('pre');
                pre.style.cssText = 'color: #8b0000; font-size: 16px; text-align: center; margin-bottom: 30px; text-shadow: 0 0 10px #ff0000, 0 0 30px #660000;';
                pre.textContent = SAW_JIGSAW_ASCII.join('\n');
                overlay.appendChild(pre);
            }, 1000);

            // Bloody text after 2.5s
            setTimeout(function() {
                var text = document.createElement('div');
                text.className = 'saw-bloody-text';
                text.style.cssText = 'font-family: monospace; white-space: pre-wrap; text-align: center;';
                text.innerHTML = t('saw-defeat') + '<br><br>' + t('saw-defeat-2');
                overlay.appendChild(text);
            }, 2500);

            // Subtitle after 4s
            setTimeout(function() {
                var sub = document.createElement('div');
                sub.style.cssText = 'color: #444; font-size: 12px; font-family: monospace; margin-top: 30px;';
                sub.textContent = t('saw-defeat-sub');
                overlay.appendChild(sub);
            }, 4000);
        }

        function sawVictory() {
            clearInterval(sawTimerInterval);
            sawGameActive = false; window._sawGameActive = false;
            terminalMode = 'saw-dead';

            addLine('');
            addLine('');
            for (var i = 0; i < SAW_JIGSAW_ASCII.length; i++) {
                addLine(SAW_JIGSAW_ASCII[i], 'success');
            }
            addLine('');
            addLine('  ' + t('saw-victory'), 'success');
            addLine('  ' + t('saw-victory-2'), 'error');
            addLine('');
            scrollTerminal();

            // Remove timer
            if (sawTimerContainerEl) sawTimerContainerEl.remove();
            if (sawTimerTextEl) sawTimerTextEl.remove();

            // Restore icons after a delay
            setTimeout(function() {
                sawIconOriginalData.forEach(function(d) {
                    d.el.classList.remove('saw-life', 'saw-life-dying');
                    d.el.style.left = d.left;
                    d.el.style.top = d.top;
                    d.el.style.position = d.position;
                    d.el.style.display = '';
                });
                // Remove overlay and fullscreen
                if (sawOverlayEl) sawOverlayEl.remove();
                var termWin = document.getElementById('window-terminal');
                if (termWin) termWin.classList.remove('saw-terminal-fullscreen');
                for (var i = 0; i < sawCracks.length; i++) sawCracks[i].remove();
                // Restore normal mode
                window._vimActive = false;
                terminalMode = 'normal';
                stopVimFocusTrap();
                var theme = document.documentElement.getAttribute('data-theme') || 'win98';
                updatePrompt(theme);
            }, 5000);
        }

        var _janTerminalAttempts = 0;
        function processCommand(cmd) {
            const lower = cmd.toLowerCase().trim();
            logSession('terminal', { command: cmd });

            // During jankozy — only "naj" works, everything else is "jan"
            if (window._janArmageddonActive && lower !== 'naj') {
                _janTerminalAttempts++;
                if (_janTerminalAttempts >= 6) {
                    addLine('  JAAAAN!!!', 'error');
                    addLine('  hint: try reverse("jan")', 'info');
                } else if (_janTerminalAttempts % 3 === 0) {
                    addLine('  JAAAAN!!!', 'error');
                } else if (_janTerminalAttempts % 2 === 0) {
                    addLine('  jan!', 'success');
                } else {
                    addLine('  jan?');
                }
                scrollTerminal();
                return;
            }

            // Parse command name and arguments
            var spaceIdx = lower.indexOf(' ');
            var cmdName = spaceIdx > -1 ? lower.substring(0, spaceIdx) : lower;
            var rawArgs = spaceIdx > -1 ? cmd.trim().substring(spaceIdx + 1).trim() : '';
            var argsLower = rawArgs.toLowerCase();

            // === Special multi-word exact matches ===
            if (lower === 'rm -rf /' || lower === 'rm -rf' || lower === 'sudo rm -rf /' || lower === 'sudo rm -rf') {
                addLine('Initiating system destruction...', 'error');
                addLine('');
                setTimeout(function() { addLine('Deleting /usr/bin...', 'error'); scrollTerminal(); }, 300);
                setTimeout(function() { addLine('Deleting /home/jan...', 'error'); scrollTerminal(); }, 700);
                setTimeout(function() { addLine('Deleting /var/log...', 'error'); scrollTerminal(); }, 1000);
                setTimeout(function() { addLine('Deleting /etc...', 'error'); scrollTerminal(); }, 1300);
                setTimeout(function() { addLine('Deleting system32...', 'error'); scrollTerminal(); }, 1600);
                setTimeout(function() { addLine('Deleting localStorage...', 'error'); scrollTerminal(); }, 1900);
                setTimeout(function() {
                    addLine('');
                    addLine('\uD83D\uDC80 SYSTEM DESTROYED \uD83D\uDC80', 'error');
                    localStorage.clear();
                    sessionStorage.clear();
                    var overlay = document.createElement('div');
                    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#ff0000;font-family:monospace;cursor:not-allowed;';
                    overlay.innerHTML = '<pre style="font-size:16px;text-align:center;color:#ff0000">FATAL ERROR: System halted\n\nAll files have been deleted.\nThis incident has been reported to /dev/null.\n\n\n<span style="color:#666;font-size:12px">(...refresh the page to resurrect the system)</span></pre>';
                    document.body.appendChild(overlay);
                }, 2000);
                return;
            }

            // === Executable files (.glitch.exe) ===
            if (lower === './.glitch.exe' || lower === '.glitch.exe' ||
                lower === 'bash .glitch.exe' || lower === 'sh .glitch.exe' ||
                lower === 'run .glitch.exe' || lower === 'start .glitch.exe' ||
                lower === 'open .glitch.exe' || lower === 'cat .glitch.exe') {
                if (glitchRemoved) {
                    addLine('.glitch.exe: No such file or directory', 'error');
                } else {
                    addLine('Executing .glitch.exe...', 'error');
                    addLine('WARNING: File appears corrupted', 'error');
                    addLine('0x4F7E 0xDEAD 0xBEEF 0xCAFE 0xF\u0338\u0332A\u0337\u035CT\u0336\u035BA\u0338\u0332L\u0335\u035B', 'error');
                    runGlitchEffect();
                }
                return;
            }

            // === Filesystem-aware commands ===
            if (cmdName === 'ls' || cmdName === 'dir') {
                cmdLs(argsLower);
                addLine('');
                output.scrollTop = output.scrollHeight;
                return;
            }
            if (cmdName === 'cd') {
                cmdCd(argsLower);
                addLine('');
                output.scrollTop = output.scrollHeight;
                return;
            }
            if (cmdName === 'cat') {
                cmdCat(argsLower);
                addLine('');
                output.scrollTop = output.scrollHeight;
                return;
            }
            if (cmdName === 'pwd') {
                cmdPwd();
                addLine('');
                output.scrollTop = output.scrollHeight;
                return;
            }

            // === Regular commands ===
            switch (lower) {
                case 'help':
                    addLine('Terminal commands:', 'info');
                    addLine('  ls [path]     - List directory contents');
                    addLine('  cd [path]     - Change directory');
                    addLine('  cat [file]    - Read file contents');
                    addLine('  pwd           - Print working directory');
                    addLine('  clear         - Clear terminal');
                    addLine('  exit          - Close terminal');
                    addLine('');
                    addLine('  neofetch      - System info');
                    addLine('  theme [name]  - Switch OS (win98/winxp/macos/linux)');
                    addLine('  cowsay [msg]  - Moo');
                    addLine('');
                    addLine('  Tip: try ls, explore files with cat,', 'info');
                    addLine('  and look inside secrets/ for surprises.', 'info');
                    addLine('  Full command list: cat secrets/all-commands.txt', 'info');
                    break;

                case 'whoami':
                    addLine('Jan Jurec', 'success');
                    addLine('Senior DevOps Engineer | MLOps | Backend');
                    addLine('"Python, AWS, Linux. Cool stuff."');
                    addLine('Location: Gorzow Wielkopolski, Poland');
                    addLine('Remote since 2018 (before it was cool)');
                    break;

                case 'skills':
                    addLine('=== SKILLS ===', 'info');
                    addLine('Cloud:      AWS, Terraform, CDK, CloudFormation, EC2, Lambda, SageMaker');
                    addLine('Languages:  Python, FastAPI, Django, Flask, PHP');
                    addLine('DevOps:     Docker, Kubernetes, GitLab CI/CD, Jenkins, Ansible');
                    addLine('Data/ML:    MLOps, MLflow, Glue, Data Pipeline, SageMaker');
                    addLine('Tools:      Git, Linux, Datadog, SonarQube');
                    addLine('Testing:    pytest, unit/e2e/smoke/perf tests');
                    break;

                case 'experience':
                    addLine('=== EXPERIENCE ===', 'info');
                    addLine('2024-now   CEO @ InnovationsEX Solutions-pol');
                    addLine('2023-now   Infra Specialist @ Zdrowa (charity)');
                    addLine('2021-2024  Sr DevOps/MLOps @ TUI (3y4m)');
                    addLine('2019-2024  Software Engineer @ 3e9 Systems (5y)');
                    addLine('2020-2022  Python Mentor @ Kodilla (2y4m)');
                    addLine('2018-2019  Software Engineer @ Xebia Poland');
                    addLine('2017-2018  Software Engineer @ Clearcode');
                    addLine('2016-2017  Working Student @ Nokia');
                    break;

                case 'contact':
                    addLine('=== CONTACT ===', 'info');
                    addLine('Email:    jan@jurec.pl');
                    addLine('LinkedIn: linkedin.com/in/janjur');
                    addLine('GitHub:   github.com/janjur');
                    break;

                case 'projects':
                    addLine('=== GITHUB REPOS ===', 'info');
                    addLine('★148  readable-pylint-messages  (Python)');
                    addLine('      face_unlock               (Python)');
                    addLine('      hejtolosowanie            (Python)');
                    addLine('      multidiary                (Python)');
                    addLine('      apteka                    (Python)');
                    addLine('      RNS_x86                   (Assembly)');
                    addLine('---');
                    addLine('Total: 15 public repos');
                    break;

                case 'education':
                    addLine('=== EDUCATION ===', 'info');
                    addLine('MSc Computer Science - PWr (2018-2019)');
                    addLine('BSc Engineering CS  - PWr (2012-2017)');
                    addLine('');
                    addLine('Certifications:', 'info');
                    addLine('  AWS Solutions Architect Associate (2019)');
                    addLine('  Learning Kubernetes - LinkedIn (2024)');
                    break;

                case 'neofetch':
                    var nfTheme = document.documentElement.getAttribute('data-theme') || 'win98';
                    var osNames = { win98: 'Windows 98', winxp: 'Windows XP', macos: 'macOS Sonoma', linux: 'Ubuntu 24.04 LTS' };
                    addLine('        .--.          jan@portfolio', 'success');
                    addLine('       |o_o |         ─────────────', 'success');
                    addLine('       |:_/ |         OS: ' + (osNames[nfTheme] || nfTheme));
                    addLine('      //   \\ \\        Host: Portfolio v2.1.37');
                    addLine('     (|     | )       Uptime: since 2016');
                    addLine('    /\'\\_   _/`\\       Shell: browser/js');
                    addLine('    \\___)=(___/       Resolution: ' + window.innerWidth + 'x' + window.innerHeight);
                    addLine('                      Theme: ' + nfTheme);
                    addLine('                      Terminal: portfolio-term');
                    addLine('                      CPU: Python @ 10 yrs');
                    addLine('                      GPU: AWS-accelerated');
                    addLine('                      Memory: 148★ / ∞');
                    break;

                case 'clear':
                    output.innerHTML = '';
                    break;

                case 'exit':
                    closeWindow('terminal');
                    break;

                case 'barka':
                    addLine('🎵 Pan kiedyś stanął nad brzegiem...', 'info');
                    addLine('');
                    addLine('  ♪ O Panie, to Ty na mnie spojrzałeś,');
                    addLine('  ♪ Twoje usta dziś wyrzekły me imię.');
                    addLine('  ♪ Swoją barkę pozostawiam na brzegu,');
                    addLine('  ♪ Razem z Tobą nowy zacznę połów. ♪');
                    addLine('');
                    addLine('🔊 Playing...', 'success');
                    playBarka();
                    // Unlock Barka in Winamp
                    if (!localStorage.getItem('jan-portfolio-barka')) {
                        localStorage.setItem('jan-portfolio-barka', 'true');
                        addLine('');
                        addLine('🎶 Barka unlocked in Winamp!', 'success');
                        unlockWinampBarka();
                    }
                    break;

                case 'serwerownia':
                    addLine('  🐐 Poznańskie koziołki 🐐', 'info');
                    addLine('');
                    // Animated Poznań goats butting heads
                    var goatFrames = [
                        [
                            '    \\\\       //',
                            '     ))     (( ',
                            '    //       \\\\',
                            '   ||         ||',
                            '   ^^         ^^',
                        ],
                        [
                            '     \\\\     // ',
                            '      ))   ((  ',
                            '     //     \\\\ ',
                            '    ||       || ',
                            '    ^^       ^^ ',
                        ],
                        [
                            '      \\\\   //  ',
                            '       )) ((   ',
                            '      //   \\\\  ',
                            '     ||     ||  ',
                            '     ^^     ^^  ',
                        ],
                        [
                            '       \\\\ //   ',
                            '        )X(    ',
                            '       // \\\\   ',
                            '      ||   ||   ',
                            '      ^^   ^^   ',
                        ],
                        [
                            '      \\\\ * //  ',
                            '       )X(  *  ',
                            '    * // \\\\    ',
                            '      ||   ||   ',
                            '      ^^   ^^   ',
                        ],
                    ];
                    var goatContainer = document.createElement('pre');
                    goatContainer.className = 'terminal-line';
                    goatContainer.style.whiteSpace = 'pre';
                    goatContainer.textContent = goatFrames[0].join('\n');
                    output.appendChild(goatContainer);
                    var gFrame = 0;
                    var goatInterval = setInterval(function() {
                        gFrame++;
                        if (gFrame >= goatFrames.length) {
                            clearInterval(goatInterval);
                            goatContainer.textContent = goatFrames[goatFrames.length - 1].join('\n');
                            addLine('  💥 STUK! 💥', 'info');
                            return;
                        }
                        goatContainer.textContent = goatFrames[gFrame].join('\n');
                    }, 500);
                    break;

                case 'matrix':
                    addLine('Initiating Matrix mode...', 'success');
                    startMatrix();
                    break;

                case 'achilles':
                    addLine('⚔️  Connecting to CyberDemigods...', 'success');
                    addLine('🌐 Redirecting to https://cyberdemigods.com', 'info');
                    setTimeout(() => {
                        window.open('https://cyberdemigods.com', '_blank');
                    }, 1500);
                    break;

                case 'sudo':
                    showHypnotoad();
                    return;

                // ls, dir, cd, cat, pwd handled by VFS dispatch above

                case 'date':
                    addLine(new Date().toString());
                    break;

                case 'ping google.com':
                    addLine('PING google.com: 64 bytes from 142.250.74.206: time=2137ms', 'success');
                    addLine('Interesting ping time, isn\'t it? 🤔');
                    break;

                case 'cowsay':
                case 'cowsay hello':
                    var cowMsgs = [
                        'hire jan!', 'moo!', 'DevOps is my passion',
                        '( \u0361\u00B0 \u035C\u0296 \u0361\u00B0)', 'kubectl apply -f cow.yaml',
                        '2137', 'sudo rm -rf /barn'
                    ];
                    var cowMsg = cowMsgs[Math.floor(Math.random() * cowMsgs.length)];
                    var pad = cowMsg.length + 2;
                    addLine(' ' + '_'.repeat(pad));
                    addLine('< ' + cowMsg + ' >');
                    addLine(' ' + '-'.repeat(pad));
                    addLine('        \\   ^__^');
                    addLine('         \\  (\u0361\u00B0\u035C\u0296\u0361\u00B0)\\_______');
                    addLine('            (__)\\       )\\/\\');
                    addLine('                ||----w |');
                    addLine('                ||     ||');
                    break;

                case 'top':
                case 'htop':
                    addLine('top - ' + new Date().toLocaleTimeString() + ' up 2137 days, load: 0.69 0.42 0.21', 'info');
                    addLine('Tasks: 137 total, 3 running, 134 sleeping');
                    addLine('Mem: 16384MB total, 13337MB used, 3047MB free');
                    addLine('');
                    addLine('  PID USER      PR  NI  VIRT   RES  %CPU %MEM COMMAND', 'info');
                    var procs = [
                        [2137, 'jan',   20, 0, '4.2G', '1.3G', 99.7, 8.1, 'kubernetes-chaos-monkey'],
                        [666, 'root',  20, 0, '2.1G', '890M', 45.2, 5.4, 'npm install (running since 2019)'],
                        [420, 'jan',   20, 0, '1.8G', '512M', 32.1, 3.1, 'docker-compose-up-and-pray'],
                        [1337, 'jan',  20, 0, '900M', '256M', 18.5, 1.6, 'terraform-apply-yolo'],
                        [42, 'root',   20, 0, '512M', '128M', 12.3, 0.8, 'stackoverflow-copier'],
                        [7, 'jan',     20, 0, '256M', '64M',  8.7,  0.4, 'git-blame-coworker'],
                        [69, 'root',   20, 0, '128M', '32M',  5.1,  0.2, 'rm-rf-slash-preventer'],
                        [404, 'nobody', 20, 0, '64M', '16M',  2.3,  0.1, 'bug-not-found'],
                        [1, 'root',    20, 0, '32M',  '8M',   0.5,  0.0, 'systemd (it\'s always systemd)'],
                        [9999, 'jan',  20, 0, '16M',  '4M',   0.1,  0.0, 'deploy-on-friday-service'],
                    ];
                    procs.forEach(function(p) {
                        addLine('  ' + String(p[0]).padStart(5) + ' ' + p[1].padEnd(8) + '  ' + p[2] + '   ' + p[3] + ' ' + String(p[4]).padEnd(6) + ' ' + String(p[5]).padEnd(5) + ' ' + String(p[6]).toFixed(1).padStart(5) + ' ' + String(p[7]).toFixed(1).padStart(4) + ' ' + p[8]);
                    });
                    addLine('');
                    addLine('(press q to exit... just kidding, this is a fake terminal)', 'info');
                    break;

                case 'vim':
                case 'nano':
                case 'vi':
                    addLine('Opening ' + lower + '...', 'info');
                    addLine('');
                    addLine('  Are you sure? y / [n]: _', 'error');
                    terminalMode = 'vim';
                    document.getElementById('terminalPrompt').textContent = '  > ';
                    break;

                case 'python':
                case 'python3':
                    addLine('Python 3.11.2137 (jan-edition, Mar 12 2026, 21:37:00)', 'info');
                    addLine('[GCC 13.2.0] on linux');
                    addLine('Type "exit()" or Ctrl+D to exit.');
                    addLine('WARNING: everything you type will be interpreted as 🐍');
                    terminalMode = 'python';
                    var promptEl = document.getElementById('terminalPrompt');
                    promptEl.textContent = '>>> ';
                    break;

                case 'sl':
                    // ASCII Steam Locomotive animation
                    var slFrames = [
                        [
                            '      ====        ________                 ',
                            '  _D _|  |_______/        \\__I_I_____===__|',
                            '   |(_)---  |   H\\________/ |   |        =|',
                            '   /     |  |   H  |  |     |   |         |',
                            '  |      |  |   H  |__--------------------\'',
                            '  | ________|___H__/__|_____/[][]~\\_______|',
                            '  |/ |   |-----------I_____I [][] []  D   |]',
                            '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__',
                            ' |/-=|___|=   O=====O=====O=====O|_____/~\\___/       |',
                            '  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/           ',
                        ],
                        [
                            '       ====        ________                ',
                            '   _D _|  |_______/        \\__I_I_____===__|',
                            '    |(_)---  |   H\\________/ |   |        =|',
                            '    /     |  |   H  |  |     |   |         |',
                            '   |      |  |   H  |__--------------------\'',
                            '   | ________|___H__/__|_____/[][]~\\_______|',
                            '   |/ |   |-----------I_____I [][] []  D   |]',
                            ' __/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__',
                            '  |/-=|___|=   O=====O=====O=====O|_____/~\\___/       |',
                            '   \\_/      \\__/  \\__/  \\__/  \\__/      \\_/           ',
                        ]
                    ];
                    var slContainer = document.createElement('div');
                    slContainer.className = 'terminal-line';
                    slContainer.style.whiteSpace = 'pre';
                    slContainer.style.fontFamily = 'monospace';
                    slContainer.style.overflow = 'hidden';
                    output.appendChild(slContainer);
                    var slPos = 60;
                    var slFrame = 0;
                    var slInterval = setInterval(function() {
                        slPos -= 3;
                        slFrame = 1 - slFrame;
                        var padding = slPos > 0 ? ' '.repeat(slPos) : '';
                        var lines = slFrames[slFrame].map(function(l) {
                            var shifted = padding + l;
                            return slPos < 0 ? shifted.substring(-slPos) : shifted;
                        });
                        slContainer.textContent = lines.join('\n') + '\n  ' + padding + 'CHOO CHOO! 🚂💨';
                        scrollTerminal();
                        if (slPos < -50) {
                            clearInterval(slInterval);
                            addLine('');
                            addLine('Did you mean: ls?', 'info');
                        }
                    }, 100);
                    return;

                case 'jan':
                    if (window._janArmageddonActive) {
                        addLine('  Protocol JANJUREC already active!', 'error');
                        break;
                    }
                    addLine('', '');
                    addLine('  J A N J U R E C', 'error');
                    addLine('  J A N J U R E C', 'error');
                    addLine('  J A N J U R E C', 'error');
                    addLine('', '');
                    addLine('  Initiating Protocol JANJUREC...', 'info');
                    // Animated progress bar over 15 seconds
                    var progressLineIdx = output.children.length;
                    addLine('  ░░░░░░░░░░░░░░░░░░░░░ 0%', 'success');
                    var progressEl = output.children[progressLineIdx];
                    var janProgressStart = Date.now();
                    var janProgressInterval = setInterval(function() {
                        var elapsed = Date.now() - janProgressStart;
                        var pct = Math.min(100, Math.round((elapsed / 15000) * 100));
                        var filled = Math.round(pct / 100 * 21);
                        var empty = 21 - filled;
                        var bar = '  ' + '█'.repeat(filled) + '░'.repeat(empty) + ' ' + pct + '%';
                        if (progressEl) progressEl.textContent = bar;
                        if (pct >= 100) {
                            clearInterval(janProgressInterval);
                            addLine('', '');
                            addLine('  WELCOME IN JANLAND! JAN JAN JAAAN!', 'error');
                            addLine('', '');
                            output.scrollTop = output.scrollHeight;
                        }
                    }, 200);
                    startJanArmageddon();
                    break;

                case 'naj':
                    if (!window._janArmageddonActive) {
                        addLine('  No active JANJUREC protocol to reverse.', 'error');
                        break;
                    }
                    addLine('', '');
                    addLine('  N A J', 'info');
                    addLine('  Reversing Protocol JANJUREC...', 'info');
                    addLine('  ██████████████████████ DONE', 'success');
                    addLine('  Reality restored.', 'success');
                    reverseJanArmageddon();
                    break;

                default:
                    if (lower.startsWith('theme ')) {
                        var t = lower.split(' ')[1];
                        if (['win98', 'winxp', 'macos', 'linux'].indexOf(t) > -1) {
                            document.documentElement.setAttribute('data-theme', t);
                            updateActiveThemeBtn(t);
                            localStorage.setItem('jan-portfolio-theme', t);
                            addLine('Theme switched to: ' + t, 'success');
                            updatePrompt(t);
                        } else {
                            addLine('Unknown theme. Available: win98, winxp, macos, linux', 'error');
                        }
                    } else if (lower.startsWith('cowsay ')) {
                        var msg = cmd.substring(7).trim() || 'moo';
                        var pad2 = msg.length + 2;
                        addLine(' ' + '_'.repeat(pad2));
                        addLine('< ' + msg + ' >');
                        addLine(' ' + '-'.repeat(pad2));
                        addLine('        \\   ^__^');
                        addLine('         \\  (\u0361\u00B0\u035C\u0296\u0361\u00B0)\\_______');
                        addLine('            (__)\\       )\\/\\');
                        addLine('                ||----w |');
                        addLine('                ||     ||');
                    } else if (lower === 'echo hello world') {
                        addLine('Hello World!');
                    } else if (lower.startsWith('echo ')) {
                        addLine(rawArgs);
                    } else if (lower.startsWith('ping ')) {
                        addLine('PING ' + rawArgs + ': Destination host unreachable', 'error');
                        addLine('(only google.com has a working route here)');
                    } else if (lower.startsWith('sudo ')) {
                        showHypnotoad();
                        return;
                    } else {
                        addLine('\'' + cmd + '\' is not recognized as an internal or external command.', 'error');
                        addLine('Type "help" for available commands.');
                    }
                    break;
            }
            addLine('');
            output.scrollTop = output.scrollHeight;
        }

        function updatePrompt(theme) {
            // Don't override prompt during vim/saw modes
            if (terminalMode === 'vim-active' || terminalMode === 'vim' || terminalMode === 'saw-game' || terminalMode === 'saw-dead') return;
            const prompt = document.getElementById('terminalPrompt');
            var dir = currentDir;
            if (theme === 'win98' || theme === 'winxp') {
                var winDir = 'C:\\Users\\Jan';
                if (dir !== '~') winDir += dir.replace('~/', '\\').replace(/\//g, '\\');
                prompt.textContent = winDir + '>';
            } else if (theme === 'macos') {
                prompt.textContent = 'jan@portfolio ' + dir + ' % ';
            } else {
                prompt.textContent = 'jan@portfolio:' + dir + '$ ';
            }
        }

        // ===== JANJUREC ARMAGEDDON =====
        var _janSavedState = null; // saved original state for reversal

        function startJanArmageddon() {
            var JAN_AVATAR = '_images/janek_icon2.png';
            window._janArmageddonActive = true;
            window._janActive = true;
            // Preload Jan ball image for breakout
            if (!window._janBallImg) {
                window._janBallImg = new Image();
                window._janBallImg.src = JAN_AVATAR;
            }

            // Close all open windows except terminal
            document.querySelectorAll('.window:not(.hidden)').forEach(function(win) {
                if (win.id !== 'window-terminal') {
                    win.classList.add('hidden');
                }
            });
            updateTaskbarButtons();

            // Stop any playing music (winamp, vim drone, breakout)
            if (typeof stopWinamp === 'function') stopWinamp();
            if (typeof stopVimDrone === 'function') stopVimDrone();
            if (typeof stopBreakoutMusic === 'function') stopBreakoutMusic();

            // Unlock Chocolate Rain in Winamp
            localStorage.setItem('jan-portfolio-chocolaterain', 'true');
            unlockWinampChocolateRain();

            // Save original favicon
            var favicon = document.querySelector('link[rel="icon"]');
            var originalFavicon = favicon ? favicon.href : 'favicon.png';
            var originalTitle = document.title;

            // Save original icon contents & labels for reversal
            _janSavedState = { favicon: originalFavicon, title: originalTitle, icons: [], texts: [] };
            document.querySelectorAll('.desktop-icon').forEach(function(icon) {
                var iconImg = icon.querySelector('.desktop-icon-img');
                var label = icon.querySelector('span');
                _janSavedState.icons.push({
                    el: iconImg,
                    html: iconImg ? iconImg.innerHTML : '',
                    label: label,
                    labelText: label ? label.textContent : '',
                    iconEl: icon,
                    origLeft: icon.style.left,
                    origTop: icon.style.top,
                    origTransition: icon.style.transition
                });
            });
            // Save ALL text elements we'll be changing
            var textSelectors = [
                '.window-title span', '.window-title-icon',
                '.file-name', '.file-desc',
                '.skill-name', '.timeline-title', '.timeline-company',
                '.timeline-desc', '.rec-text', '.rec-role', '.rec-header strong',
                '.skill-tag', '.file-lang',
                '.taskbar-btn span', '.start-btn',
                '.start-menu-item span',
                '.window-statusbar span',
                'h1, h2, h3, h4, h5',
                '.about-bio p', '.about-bio li', '.about-text p', '.about-text li',
                '.edu-info h3', '.edu-degree', '.edu-date',
                '.window-menubar span',
                '.contact-item span', '.contact-item a',
                '.location', '.tagline', '.title',
                '.lang-toggle',
                '.taskbar-clock',
                '.exp-header h3', '.exp-company', '.exp-section h4',
                '.exp-date', '.exp-location', '.exp-type',
                '.exp-details li', '.exp-highlight', '.exp-skills',
                '.skill-cat-header', '.skill-item',
                '.contact-icon', '.contact-item a', '.contact-item > span:not(.contact-icon)'
            ];
            textSelectors.forEach(function(sel) {
                document.querySelectorAll(sel).forEach(function(el) {
                    var saved = { el: el, html: el.innerHTML, text: el.textContent };
                    if (el.href) saved.href = el.href;
                    _janSavedState.texts.push(saved);
                });
            });

            // CHOCOLATE RAIN 8-bit — plays on loop until "naj" stops it
            var janAudio = new Audio('audio/chocolate_rain_8bit.m4a');
            janAudio.volume = 0.5;
            janAudio.loop = true;
            try { janAudio.play(); } catch(ex) {}
            window._janAudio = janAudio;

            // 1) Rain of Jan heads on desktop — Canvas-based for performance
            var desktop = document.querySelector('.desktop');
            var rainCanvas = document.createElement('canvas');
            rainCanvas.id = 'jan-rain-canvas';
            rainCanvas.style.cssText =
                'position:fixed;top:0;left:0;width:100%;height:100%;' +
                'z-index:9000;pointer-events:none;';
            rainCanvas.width = window.innerWidth;
            rainCanvas.height = window.innerHeight;
            document.body.appendChild(rainCanvas);
            var rainCtx = rainCanvas.getContext('2d');
            var rainHeads = [];
            var rainImg = new Image();
            rainImg.src = JAN_AVATAR;
            var rainSpawnRate = 120; // ms between spawns
            var rainPerSpawn = 1;
            var rainSizeMin = 48, rainSizeMax = 48;
            var lastSpawn = 0;

            function spawnHead(now) {
                var sz = rainSizeMin + Math.random() * (rainSizeMax - rainSizeMin);
                rainHeads.push({
                    x: Math.random() * (rainCanvas.width - sz),
                    y: -sz - 10,
                    sz: sz,
                    speed: (rainSizeMin === rainSizeMax ? 2 : 3) + Math.random() * 4,
                    rot: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.15,
                    wobble: (Math.random() - 0.5) * 1.5
                });
            }

            var rainRafId = null;
            function rainLoop(ts) {
                if (!window._janActive) {
                    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
                    return;
                }
                rainRafId = requestAnimationFrame(rainLoop);
                // Spawn
                if (!lastSpawn || ts - lastSpawn > rainSpawnRate) {
                    for (var s = 0; s < rainPerSpawn; s++) spawnHead(ts);
                    lastSpawn = ts;
                }
                // Update & draw
                rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
                for (var i = rainHeads.length - 1; i >= 0; i--) {
                    var h = rainHeads[i];
                    h.y += h.speed;
                    h.x += h.wobble;
                    h.rot += h.rotSpeed;
                    if (h.y > rainCanvas.height + h.sz) {
                        rainHeads.splice(i, 1);
                        continue;
                    }
                    rainCtx.save();
                    rainCtx.translate(h.x + h.sz / 2, h.y + h.sz / 2);
                    rainCtx.rotate(h.rot);
                    rainCtx.beginPath();
                    rainCtx.arc(0, 0, h.sz / 2, 0, Math.PI * 2);
                    rainCtx.clip();
                    rainCtx.drawImage(rainImg, -h.sz / 2, -h.sz / 2, h.sz, h.sz);
                    rainCtx.restore();
                }
            }
            rainRafId = requestAnimationFrame(rainLoop);
            window._janRainCanvas = rainCanvas;
            window._janRainRafId = rainRafId;

            // 2+3) After 15 seconds (progress bar 100%) — replace ALL icons and text + smiley
            setTimeout(function() {
                // Arrange icons into a smiley face :)
                var allIcons = document.querySelectorAll('.desktop-icon');
                var dw = window.innerWidth;
                var dh = window.innerHeight - 40; // minus taskbar
                var cx = dw / 2;
                var cy = dh / 2 - 20;
                var scale = Math.min(dw, dh) * 0.35;

                // 14 icons: 5 for small "x", 9 for big "D" → xD
                var s = Math.min(dw, dh) * 0.22; // letter size
                // "x" center — left side
                var xCx = cx - s * 0.55;
                var xCy = cy + s * 0.12;
                var xs = s * 0.22; // tight x
                // "D" center — right side
                var dCx = cx + s * 0.35;
                var dCy = cy;
                var ds = s * 0.42; // D size

                var smileyPositions = [
                    // ---- "x" (5 icons) — two crossing diagonals ----
                    { x: xCx - xs,     y: xCy - xs },
                    { x: xCx + xs,     y: xCy - xs },
                    { x: xCx,          y: xCy },
                    { x: xCx - xs,     y: xCy + xs },
                    { x: xCx + xs,     y: xCy + xs },
                    // ---- "D" (9 icons) — vertical bar + curve ----
                    { x: dCx - ds * 0.4, y: dCy - ds },
                    { x: dCx - ds * 0.4, y: dCy - ds * 0.33 },
                    { x: dCx - ds * 0.4, y: dCy + ds * 0.33 },
                    { x: dCx - ds * 0.4, y: dCy + ds },
                    { x: dCx + ds * 0.05, y: dCy - ds },
                    { x: dCx + ds * 0.4, y: dCy - ds * 0.5 },
                    { x: dCx + ds * 0.5, y: dCy },
                    { x: dCx + ds * 0.4, y: dCy + ds * 0.5 },
                    { x: dCx + ds * 0.05, y: dCy + ds },
                ];

                allIcons.forEach(function(icon, i) {
                    if (i < smileyPositions.length) {
                        var pos = smileyPositions[i];
                        icon.style.transition = 'left 1.5s ease-in-out, top 1.5s ease-in-out';
                        icon.style.left = Math.round(pos.x - 32) + 'px';
                        icon.style.top = Math.round(pos.y - 32) + 'px';
                        icon.classList.add('jan-locked');
                    }
                });

                // Replace ALL desktop icons with Jan's face
                document.querySelectorAll('.desktop-icon').forEach(function(icon) {
                    var iconImg = icon.querySelector('.desktop-icon-img');
                    if (iconImg) {
                        var img = document.createElement('img');
                        img.src = JAN_AVATAR;
                        img.style.cssText = 'width:48px;height:48px;border-radius:50%;object-fit:cover;';
                        iconImg.innerHTML = '';
                        iconImg.appendChild(img);
                    }
                    var label = icon.querySelector('span');
                    if (label) label.textContent = 'janjurec';
                });

                // Replace ALL visible text with "jan" — comprehensive selectors
                // Window titles
                document.querySelectorAll('.window-title span, .window-title-icon').forEach(function(el) {
                    if (el.classList.contains('window-title-icon')) {
                        el.textContent = '👤';
                    } else {
                        el.textContent = 'janjurec.exe';
                    }
                });
                // File items
                document.querySelectorAll('.file-name, .file-desc').forEach(function(el) {
                    el.textContent = el.classList.contains('file-name') ? 'janjurec' : 'jan jan jan jan jan jan jan';
                });
                // Skills, experience
                document.querySelectorAll('.skill-name, .timeline-title, .timeline-company').forEach(function(el) {
                    el.textContent = 'janjurec';
                });
                document.querySelectorAll('.timeline-desc, .rec-text').forEach(function(el) {
                    el.textContent = 'Jan Jan Jan Jan Jan Jan Jan Jan Jan Jan Jan Jan Jan Jan Jan Jan Jan Jan.';
                });
                // Recommendation authors & roles
                document.querySelectorAll('.rec-role').forEach(function(el) {
                    el.textContent = 'Janjurec Specialist';
                });
                document.querySelectorAll('.rec-header strong').forEach(function(el) {
                    el.textContent = 'Jan Janjurec';
                });
                // Tags
                document.querySelectorAll('.skill-tag, .file-lang').forEach(function(el) {
                    el.textContent = 'jan';
                });
                // Taskbar
                document.querySelectorAll('.taskbar-btn span, .start-btn').forEach(function(el) {
                    el.textContent = 'Jan';
                });
                // Start menu
                document.querySelectorAll('.start-menu-item span').forEach(function(el) {
                    el.textContent = 'janjurec';
                });
                // Status bars
                document.querySelectorAll('.window-statusbar span').forEach(function(el) {
                    el.textContent = 'jan jan jan';
                });
                // Section titles
                document.querySelectorAll('h1, h2, h3, h4, h5').forEach(function(el) {
                    el.textContent = 'JANJUREC';
                });
                // About section — both .about-bio and .about-text
                document.querySelectorAll('.about-bio p, .about-bio li, .about-text p, .about-text li').forEach(function(el) {
                    el.textContent = 'Jan jan jan jan jan jan jan jan jan jan jan jan jan jan jan jan.';
                });
                // About sub-elements
                document.querySelectorAll('.location, .tagline, .title').forEach(function(el) {
                    el.textContent = 'janjurec';
                });
                // Education — actual classes are .edu-info h3, .edu-degree, .edu-date
                document.querySelectorAll('.edu-info h3').forEach(function(el) {
                    el.textContent = 'Janjurec University of Jan';
                });
                document.querySelectorAll('.edu-degree').forEach(function(el) {
                    el.textContent = "Master's Degree, Janjurecology";
                });
                document.querySelectorAll('.edu-date').forEach(function(el) {
                    el.textContent = 'Jan – Jan';
                });
                // Experience
                document.querySelectorAll('.exp-header h3, .exp-company, .exp-section h4').forEach(function(el) {
                    el.textContent = 'janjurec';
                });
                document.querySelectorAll('.exp-date, .exp-location, .exp-type').forEach(function(el) {
                    el.textContent = 'jan jan jan';
                });
                document.querySelectorAll('.exp-details li, .exp-highlight').forEach(function(el) {
                    el.textContent = 'Jan jan jan jan jan jan jan jan jan jan jan.';
                });
                document.querySelectorAll('.exp-skills').forEach(function(el) {
                    el.textContent = 'jan · jan · jan · jan · jan · jan';
                });
                // Skills window — device manager tree
                document.querySelectorAll('.skill-cat-header').forEach(function(el) {
                    var toggle = el.querySelector('.tree-toggle');
                    var icon = el.querySelector('.tree-icon');
                    el.textContent = '';
                    if (toggle) el.appendChild(toggle);
                    if (icon) { icon.textContent = '👤'; el.appendChild(icon); }
                    el.appendChild(document.createTextNode(' Jan & Janjurec'));
                });
                document.querySelectorAll('.skill-item').forEach(function(el) {
                    var leaf = el.querySelector('.tree-leaf');
                    var leafText = leaf ? leaf.textContent : '├─';
                    el.textContent = '';
                    var s = document.createElement('span');
                    s.className = 'tree-leaf';
                    s.textContent = leafText;
                    el.appendChild(s);
                    el.appendChild(document.createTextNode(' janjurec'));
                });
                // Contact icons to Jan
                document.querySelectorAll('.contact-icon').forEach(function(el) {
                    el.textContent = '👤';
                });
                document.querySelectorAll('.contact-item a').forEach(function(el) {
                    el.textContent = 'jan@janjurec.jan';
                    el.href = '#';
                });
                document.querySelectorAll('.contact-item > span:not(.contact-icon)').forEach(function(el) {
                    el.textContent = 'Janland, Janjurecowo, JN';
                });
                // Menu bar items
                document.querySelectorAll('.window-menubar span').forEach(function(el) {
                    el.textContent = 'Jan';
                });
                // Contact items
                document.querySelectorAll('.contact-item span, .contact-item a').forEach(function(el) {
                    el.textContent = 'janjurec@jan.jan';
                });
                // Language toggle
                var langToggle = document.querySelector('.lang-toggle');
                if (langToggle) langToggle.textContent = 'JAN';
                // Clock
                var clock = document.querySelector('.taskbar-clock');
                if (clock) clock.textContent = 'JAN:JAN';
                // Page title & favicon
                document.title = 'JANJUREC - JANJUREC JANJUREC';
                if (favicon) favicon.href = JAN_AVATAR;
            }, 15000);

            // 4) Increase rain intensity at 5s
            setTimeout(function() {
                if (!window._janActive) return;
                rainSpawnRate = 60;
                rainPerSpawn = 3;
                rainSizeMin = 32;
                rainSizeMax = 72;
            }, 5000);

            // 5) After 15 seconds, reduce rain intensity (but keep going)
            setTimeout(function() {
                if (!window._janActive) return;
                rainSpawnRate = 300;
                rainPerSpawn = 1;
                rainSizeMin = 48;
                rainSizeMax = 48;
            }, 15000);

        }

        // ===== CERUJNAJ — reverse the armageddon =====
        function reverseJanArmageddon() {
            window._janArmageddonActive = false;

            // Stop music
            if (window._janAudio) {
                window._janAudio.pause();
                window._janAudio.currentTime = 0;
                window._janAudio = null;
            }

            // Stop rain
            window._janActive = false;
            if (window._janRainRafId) {
                cancelAnimationFrame(window._janRainRafId);
                window._janRainRafId = null;
            }
            if (window._janRainCanvas && window._janRainCanvas.parentNode) {
                window._janRainCanvas.parentNode.removeChild(window._janRainCanvas);
                window._janRainCanvas = null;
            }

            if (!_janSavedState) {
                // No saved state — just reload language
                applyLanguage(currentLang);
                return;
            }

            // Restore desktop icons (content + positions + unlock)
            _janSavedState.icons.forEach(function(saved) {
                if (saved.el) saved.el.innerHTML = saved.html;
                if (saved.label) saved.label.textContent = saved.labelText;
                if (saved.iconEl) {
                    saved.iconEl.style.transition = '';
                    saved.iconEl.style.left = saved.origLeft;
                    saved.iconEl.style.top = saved.origTop;
                    saved.iconEl.classList.remove('jan-locked');
                }
            });

            // Restore all text elements
            _janSavedState.texts.forEach(function(saved) {
                if (saved.el) saved.el.innerHTML = saved.html;
                if (saved.href && saved.el) saved.el.href = saved.href;
            });

            // Restore favicon & page title
            var favicon = document.querySelector('link[rel="icon"]');
            if (favicon) favicon.href = _janSavedState.favicon;
            document.title = _janSavedState.title;

            // Re-apply current language to fix any data-i18n elements
            applyLanguage(currentLang);

            _janSavedState = null;
        }

        // Update prompt on theme change
        const origThemeSwitch = document.querySelectorAll('[data-theme]');
        origThemeSwitch.forEach(btn => {
            btn.addEventListener('click', () => {
                setTimeout(() => {
                    updatePrompt(document.documentElement.getAttribute('data-theme'));
                }, 10);
            });
        });

        // Matrix rain easter egg
        function startMatrix() {
            var matrixCount = 0;
            // ASCII-only chars for perfect monospace alignment
            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%&*!?<>{}[]|/\\~^';
            var hints = [
                'try 2137 for a holy surprise',
                'the fisherman sings at sea',
                'achilles knows the way out',
                'servers have stories to tell',
                'bark at the moon or the terminal',
                'jan is the key to everything',
            ];
            var hintShown = 0;

            // Calculate how many chars fit the terminal width
            // Force scrollbar visible before measuring to get stable width
            var prevOverflow = output.style.overflowY;
            output.style.overflowY = 'scroll';
            // Measure single char width with inline span inside a pre
            var measurePre = document.createElement('pre');
            measurePre.className = 'terminal-line';
            measurePre.style.visibility = 'hidden';
            measurePre.style.margin = '0';
            measurePre.style.padding = '0';
            measurePre.style.display = 'inline';
            measurePre.textContent = 'XXXXXXXXXX';
            output.appendChild(measurePre);
            var charW = measurePre.getBoundingClientRect().width / 10;
            output.removeChild(measurePre);
            var bodyW = output.clientWidth;
            output.style.overflowY = prevOverflow;
            if (charW < 1) charW = 7.2;
            var cols = Math.floor(bodyW / charW) - 1;
            if (cols < 20) cols = 80;

            var interval = setInterval(function() {
                var line = '';
                if (matrixCount > 5 && hintShown < hints.length && Math.random() < 0.25) {
                    var hint = hints[hintShown++];
                    var padL = Math.floor((cols - hint.length) / 2);
                    var padR = cols - padL - hint.length;
                    for (var i = 0; i < padL; i++) line += chars[Math.floor(Math.random() * chars.length)];
                    line += hint;
                    for (var i = 0; i < padR; i++) line += chars[Math.floor(Math.random() * chars.length)];
                } else {
                    for (var i = 0; i < cols; i++) {
                        line += chars[Math.floor(Math.random() * chars.length)];
                    }
                }
                var matLine = document.createElement('pre');
                matLine.className = 'terminal-line success';
                matLine.style.margin = '0';
                matLine.style.padding = '0';
                matLine.style.lineHeight = '1.2';
                matLine.style.letterSpacing = '0';
                matLine.textContent = line;
                output.appendChild(matLine);
                scrollTerminal();
                matrixCount++;
                if (matrixCount > 25) {
                    clearInterval(interval);
                    addLine('');
                    addLine('Wake up, Jan...', 'info');
                    addLine('The Matrix has you...', 'info');
                    addLine('Follow the white rabbit.', 'info');
                    addLine('');
                }
            }, 80);
        }
    }

    // ===== SHAKE ANIMATION (for easter eggs) =====
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(style);

    // ===== GO =====
    // ===== BOOT SCREEN =====
    function initBootScreen() {
        const boot = document.getElementById('bootScreen');
        const bootText = document.getElementById('bootText');
        const bootClick = document.getElementById('bootClickStart');
        const bootBar = document.getElementById('bootProgressBar');
        if (!boot) { initAfterBoot(); return; }

        // Check if already booted this session
        if (sessionStorage.getItem('jan-portfolio-booted')) {
            boot.classList.add('hidden');
            initAfterBoot();
            return;
        }

        // Wait for click (needed for audio autoplay policy)
        boot.addEventListener('click', function startBoot() {
            boot.removeEventListener('click', startBoot);
            bootClick.classList.add('hidden');
            bootText.classList.remove('hidden');
            bootBar.classList.remove('hidden');
            bootText.textContent = t('loading-text');

            // Play Win98 startup sound NOW (user gesture context)
            playStartupSound();

            // Boot sequence
            setTimeout(() => {
                boot.classList.add('fade-out');
                setTimeout(() => {
                    boot.classList.add('hidden');
                    sessionStorage.setItem('jan-portfolio-booted', 'true');
                    initAfterBoot();
                }, 800);
            }, 3200);
        });
    }

    function playStartupSound() {
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();

            // Win98 startup melody approximation
            // The iconic ta-da-da-da-DAAA
            const notes = [
                { freq: 523.25, start: 0,    dur: 0.3,  gain: 0.15 },  // C5
                { freq: 659.25, start: 0.15, dur: 0.3,  gain: 0.15 },  // E5
                { freq: 783.99, start: 0.3,  dur: 0.3,  gain: 0.18 },  // G5
                { freq: 1046.5, start: 0.5,  dur: 0.6,  gain: 0.2  },  // C6
                { freq: 783.99, start: 0.7,  dur: 0.3,  gain: 0.12 },  // G5
                { freq: 659.25, start: 0.9,  dur: 0.3,  gain: 0.1  },  // E5
                { freq: 523.25, start: 1.1,  dur: 0.4,  gain: 0.12 },  // C5
                { freq: 392.00, start: 1.3,  dur: 0.5,  gain: 0.1  },  // G4
                { freq: 523.25, start: 1.6,  dur: 0.8,  gain: 0.18 },  // C5
                { freq: 659.25, start: 1.6,  dur: 0.8,  gain: 0.12 },  // E5 (chord)
                { freq: 783.99, start: 1.6,  dur: 0.8,  gain: 0.1  },  // G5 (chord)
            ];

            notes.forEach(n => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                const filter = ac.createBiquadFilter();

                osc.type = 'sine';
                osc.frequency.value = n.freq;

                filter.type = 'lowpass';
                filter.frequency.value = 2000;

                gain.gain.setValueAtTime(0, ac.currentTime + n.start);
                gain.gain.linearRampToValueAtTime(n.gain, ac.currentTime + n.start + 0.05);
                gain.gain.linearRampToValueAtTime(n.gain * 0.7, ac.currentTime + n.start + n.dur * 0.6);
                gain.gain.linearRampToValueAtTime(0, ac.currentTime + n.start + n.dur);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ac.destination);

                osc.start(ac.currentTime + n.start);
                osc.stop(ac.currentTime + n.start + n.dur + 0.1);
            });

            // Pad/ambient layer
            const pad = ac.createOscillator();
            const padGain = ac.createGain();
            const padFilter = ac.createBiquadFilter();
            pad.type = 'triangle';
            pad.frequency.value = 261.63; // C4
            padFilter.type = 'lowpass';
            padFilter.frequency.value = 800;
            padGain.gain.setValueAtTime(0, ac.currentTime);
            padGain.gain.linearRampToValueAtTime(0.06, ac.currentTime + 0.5);
            padGain.gain.linearRampToValueAtTime(0.04, ac.currentTime + 2.0);
            padGain.gain.linearRampToValueAtTime(0, ac.currentTime + 2.8);
            pad.connect(padFilter);
            padFilter.connect(padGain);
            padGain.connect(ac.destination);
            pad.start(ac.currentTime);
            pad.stop(ac.currentTime + 3);

        } catch(e) {
            // Audio not supported, no big deal
        }
    }

    function playBarka() {
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();

            // "Barka" (Pan kiedyś stanął nad brzegiem)
            // Melody from sheet music, key of C major
            // Tempo ~80 BPM
            const b = 0.5; // beat duration

            // Frequencies
            const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23;
            const G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25;

            const melody = [
                // Verse: "Pan kiedyś stanął nad brzegiem"
                { freq: E4, start: 0,          dur: b * 2.5 },
                { freq: D4, start: b * 2.5,    dur: b * 0.5 },
                { freq: E4, start: b * 3,      dur: b * 0.5 },
                { freq: F4, start: b * 3.5,    dur: b * 0.5 },
                { freq: E4, start: b * 4,      dur: b * 0.5 },
                { freq: D4, start: b * 4.5,    dur: b * 0.5 },
                { freq: C4, start: b * 5,      dur: b * 1.5 },

                // "Szukał ludzi gotowych pójść za Nim"
                { freq: C4, start: b * 7,      dur: b * 2   },
                { freq: D4, start: b * 9,      dur: b * 1   },
                { freq: E4, start: b * 10,     dur: b * 0.5 },
                { freq: F4, start: b * 10.5,   dur: b * 1.5 },

                // "by łowić serca"
                { freq: F4, start: b * 12.5,   dur: b * 2   },
                { freq: F4, start: b * 14.5,   dur: b * 0.5 },
                { freq: F4, start: b * 15,     dur: b * 0.75},
                { freq: E4, start: b * 15.75,  dur: b * 0.5 },
                { freq: D4, start: b * 16.25,  dur: b * 1.5 },

                // "słów Bożych prawdą"
                { freq: D4, start: b * 18,     dur: b * 2   },
                { freq: C4, start: b * 20,     dur: b * 0.75},
                { freq: D4, start: b * 20.75,  dur: b * 0.5 },
                { freq: E4, start: b * 21.25,  dur: b * 2.5 },

                // "..." bridge
                { freq: E4, start: b * 24,     dur: b * 0.5 },
                { freq: F4, start: b * 24.5,   dur: b * 0.5 },
                { freq: E4, start: b * 25,     dur: b * 0.5 },
                { freq: D4, start: b * 25.5,   dur: b * 0.5 },
                { freq: C4, start: b * 26,     dur: b * 2   },

                // Pause before refrain
                // Refrain: "O Panie, to Ty na mnie spojrzałeś"
                { freq: A4, start: b * 30,     dur: b * 1.5 },
                { freq: A4, start: b * 31.5,   dur: b * 1.5 },
                { freq: A4, start: b * 33,     dur: b * 0.5 },
                { freq: B4, start: b * 33.5,   dur: b * 1   },
                { freq: B4, start: b * 34.5,   dur: b * 0.5 },
                { freq: A4, start: b * 35,     dur: b * 0.5 },
                { freq: G4, start: b * 35.5,   dur: b * 1.5 },

                // "Twoje usta dziś wyrzekły me imię"
                { freq: G4, start: b * 37.5,   dur: b * 1.5 },
                { freq: F4, start: b * 39,     dur: b * 0.75},
                { freq: E4, start: b * 39.75,  dur: b * 0.5 },
                { freq: F4, start: b * 40.25,  dur: b * 1.5 },
                { freq: F4, start: b * 42,     dur: b * 0.75},
                { freq: G4, start: b * 42.75,  dur: b * 0.5 },
                { freq: A4, start: b * 43.25,  dur: b * 0.5 },
                { freq: G4, start: b * 43.75,  dur: b * 0.5 },
                { freq: F4, start: b * 44.25,  dur: b * 0.5 },
                { freq: E4, start: b * 44.75,  dur: b * 2   },

                // "Swoją barkę pozostawiam na brzegu"
                { freq: E4, start: b * 47,     dur: b * 2   },
                { freq: C4, start: b * 49,     dur: b * 0.75},
                { freq: C4, start: b * 49.75,  dur: b * 0.5 },
                { freq: A4, start: b * 50.25,  dur: b * 1.5 },
                { freq: A4, start: b * 52,     dur: b * 0.5 },
                { freq: B4, start: b * 52.5,   dur: b * 1   },
                { freq: B4, start: b * 53.5,   dur: b * 0.5 },
                { freq: A4, start: b * 54,     dur: b * 0.5 },
                { freq: G4, start: b * 54.5,   dur: b * 1.5 },
                { freq: G4, start: b * 56,     dur: b * 1   },

                // "Razem z Tobą nowy zacznę połów"
                { freq: F4, start: b * 57.5,   dur: b * 0.75},
                { freq: E4, start: b * 58.25,  dur: b * 0.5 },
                { freq: F4, start: b * 58.75,  dur: b * 1.5 },
                { freq: F4, start: b * 60.5,   dur: b * 0.75},
                { freq: D4, start: b * 61.25,  dur: b * 0.5 },
                { freq: E4, start: b * 61.75,  dur: b * 0.5 },
                { freq: F4, start: b * 62.25,  dur: b * 0.5 },
                { freq: E4, start: b * 62.75,  dur: b * 0.5 },
                { freq: D4, start: b * 63.25,  dur: b * 0.5 },
                { freq: C4, start: b * 63.75,  dur: b * 3   },
            ];

            melody.forEach(n => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                const filter = ac.createBiquadFilter();

                // Warm, church-organ-like sound
                osc.type = 'triangle';
                osc.frequency.value = n.freq;

                filter.type = 'lowpass';
                filter.frequency.value = 2500;

                const vol = 0.18;
                gain.gain.setValueAtTime(0, ac.currentTime + n.start);
                gain.gain.linearRampToValueAtTime(vol, ac.currentTime + n.start + 0.03);
                gain.gain.setValueAtTime(vol, ac.currentTime + n.start + n.dur * 0.7);
                gain.gain.linearRampToValueAtTime(0, ac.currentTime + n.start + n.dur);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ac.destination);

                osc.start(ac.currentTime + n.start);
                osc.stop(ac.currentTime + n.start + n.dur + 0.05);
            });

            // Second voice - octave lower for warmth
            melody.forEach(n => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();

                osc.type = 'sine';
                osc.frequency.value = n.freq * 0.5; // octave below

                const vol = 0.06;
                gain.gain.setValueAtTime(0, ac.currentTime + n.start);
                gain.gain.linearRampToValueAtTime(vol, ac.currentTime + n.start + 0.05);
                gain.gain.setValueAtTime(vol, ac.currentTime + n.start + n.dur * 0.6);
                gain.gain.linearRampToValueAtTime(0, ac.currentTime + n.start + n.dur);

                osc.connect(gain);
                gain.connect(ac.destination);

                osc.start(ac.currentTime + n.start);
                osc.stop(ac.currentTime + n.start + n.dur + 0.05);
            });

            // Bass notes on chord changes
            const bass = [
                // Verse: Am - F - Dm - C
                { freq: 110.00, start: 0,       dur: b * 7  },   // A2
                { freq: 87.31,  start: b * 7,   dur: b * 5  },   // F2
                { freq: 73.42,  start: b * 12.5,dur: b * 5.5},   // D2
                { freq: 130.81, start: b * 18,  dur: b * 6  },   // C3
                { freq: 110.00, start: b * 24,  dur: b * 5  },   // A2
                // Refrain: Am - G - F - Am - C - Am - F - C
                { freq: 110.00, start: b * 30,  dur: b * 3.5},   // A2
                { freq: 98.00,  start: b * 33.5,dur: b * 3.5},   // G2
                { freq: 87.31,  start: b * 37.5,dur: b * 3  },   // F2
                { freq: 110.00, start: b * 40.25,dur: b * 2 },   // A2
                { freq: 87.31,  start: b * 42,  dur: b * 3  },   // F2
                { freq: 130.81, start: b * 44.75,dur: b * 2.5},  // C3
                { freq: 110.00, start: b * 47,  dur: b * 3  },   // A2
                { freq: 130.81, start: b * 50.25,dur: b * 2 },   // C3
                { freq: 98.00,  start: b * 52,  dur: b * 4.5},   // G2
                { freq: 87.31,  start: b * 57.5,dur: b * 3  },   // F2
                { freq: 73.42,  start: b * 60.5,dur: b * 3  },   // D2
                { freq: 130.81, start: b * 63.75,dur: b * 3 },   // C3
            ];

            bass.forEach(n => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = 'sine';
                osc.frequency.value = n.freq;
                gain.gain.setValueAtTime(0, ac.currentTime + n.start);
                gain.gain.linearRampToValueAtTime(0.07, ac.currentTime + n.start + 0.1);
                gain.gain.setValueAtTime(0.05, ac.currentTime + n.start + n.dur * 0.7);
                gain.gain.linearRampToValueAtTime(0, ac.currentTime + n.start + n.dur);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start(ac.currentTime + n.start);
                osc.stop(ac.currentTime + n.start + n.dur + 0.1);
            });

        } catch(e) {
            // Audio not supported
        }
    }

    // ===== NOSACZ GAME RESET (set by initNosaczGame) =====
    var resetNosaczGame = function() {};

    // ===== WINAMP PLAYER =====
    let winampAc = null;
    let winampPlaying = false;
    let winampPaused = false;
    let winampCurrentTrack = 'rickroll';
    let winampScheduledOscs = [];
    let winampStartTime = 0;
    let winampDuration = 0;
    let winampAnimFrame = null;
    var winampMasterGain = null;

    function unlockWinampBarka() {
        const barkaEl = document.getElementById('winampBarka');
        if (barkaEl) {
            barkaEl.classList.remove('locked');
            barkaEl.textContent = '2. Barka - Pan kiedys\u0301 stan\u0105\u0142 [8bit]';
        }
    }

    function unlockWinampDK() {
        const dkEl = document.getElementById('winampDK');
        if (dkEl) {
            dkEl.classList.remove('locked');
            dkEl.textContent = '3. Master of Onions [8bit]';
        }
    }

    function initWinamp() {
        var playBtn = document.getElementById('winampPlay');
        var pauseBtn = document.getElementById('winampPause');
        var stopBtn = document.getElementById('winampStop');
        var prevBtn = document.getElementById('winampPrev');
        var nextBtn = document.getElementById('winampNext');
        var volSlider = document.getElementById('winampVolume');
        var ticker = document.getElementById('winampTicker');
        var timeDisplay = document.getElementById('winampTime');
        var seekFill = document.getElementById('winampSeekFill');
        var vizEl = document.getElementById('winampViz');
        var playlistEl = document.getElementById('winampPlaylist');

        if (!playBtn || !vizEl) return;

        // Check if tracks already unlocked
        if (localStorage.getItem('jan-portfolio-barka') === 'true') {
            unlockWinampBarka();
        }
        if (localStorage.getItem('jan-portfolio-dk') === 'true') {
            unlockWinampDK();
        }
        if (localStorage.getItem('jan-portfolio-tetris') === 'true') {
            unlockWinampTetris();
        }
        if (localStorage.getItem('jan-portfolio-breakout') === 'true') {
            unlockWinampBreakout();
        }
        if (localStorage.getItem('jan-portfolio-chocolaterain') === 'true') {
            unlockWinampChocolateRain();
        }

        // Create viz bars
        for (var i = 0; i < 20; i++) {
            var bar = document.createElement('div');
            bar.className = 'winamp-viz-bar';
            vizEl.appendChild(bar);
        }

        function getVol() {
            return (parseInt(volSlider.value) / 100) * 0.3;
        }

        function updateMasterVolume() {
            if (!winampMasterGain) return;
            winampMasterGain.gain.setValueAtTime(parseInt(volSlider.value) / 100, winampAc.currentTime);
        }

        if (volSlider) {
            volSlider.addEventListener('input', updateMasterVolume);
        }

        function doStop() {
            winampPlaying = false;
            winampPaused = false;
            for (var j = 0; j < winampScheduledOscs.length; j++) {
                try { winampScheduledOscs[j].stop(); } catch(ex){}
            }
            winampScheduledOscs = [];
            if (winampAc) {
                try { winampAc.close(); } catch(ex){}
                winampAc = null;
            }
            if (winampAnimFrame) cancelAnimationFrame(winampAnimFrame);
            winampAnimFrame = null;
            if (playBtn) playBtn.textContent = '\u25B6';
            if (timeDisplay) timeDisplay.textContent = '0:00';
            if (seekFill) seekFill.style.width = '0%';
            var bars = vizEl.querySelectorAll('.winamp-viz-bar');
            for (var j = 0; j < bars.length; j++) bars[j].style.height = '2px';
        }

        function tick() {
            if (!winampPlaying || !winampAc || winampPaused) return;
            var elapsed = winampAc.currentTime - winampStartTime;
            if (elapsed >= winampDuration) {
                doStop();
                ticker.textContent = 'Stopped';
                return;
            }
            var m = Math.floor(elapsed / 60);
            var s = Math.floor(elapsed % 60);
            timeDisplay.textContent = m + ':' + (s < 10 ? '0' : '') + s;
            seekFill.style.width = ((elapsed / winampDuration) * 100) + '%';
            var bars = vizEl.querySelectorAll('.winamp-viz-bar');
            for (var j = 0; j < bars.length; j++) {
                bars[j].style.height = (Math.random() * 18 + 2) + 'px';
            }
            winampAnimFrame = requestAnimationFrame(tick);
        }

        function doPlay(trackId) {
            if (window._janArmageddonActive) return; // no music during jankozy
            doStop();
            winampCurrentTrack = trackId;

            // Update playlist highlight
            var tracks = playlistEl.querySelectorAll('.winamp-track');
            for (var j = 0; j < tracks.length; j++) tracks[j].classList.remove('active');
            var trackEl = playlistEl.querySelector('[data-track="' + trackId + '"]');
            if (trackEl) trackEl.classList.add('active');

            winampAc = new (window.AudioContext || window.webkitAudioContext)();
            if (winampAc.state === 'suspended') winampAc.resume();
            winampMasterGain = winampAc.createGain();
            winampMasterGain.connect(winampAc.destination);
            // Set initial master volume (on Windows it stays at 1.0 regardless of slider)
            var theme = document.documentElement.getAttribute('data-theme') || 'win98';
            if (theme !== 'win98' && theme !== 'winxp') {
                winampMasterGain.gain.setValueAtTime(parseInt(volSlider.value) / 100, winampAc.currentTime);
            }
            winampPlaying = true;
            winampPaused = false;
            playBtn.textContent = '\u25B6';

            var v = 0.3; // base volume, master gain handles actual level
            if (trackId === 'rickroll') {
                ticker.textContent = 'Rick Astley - Never Gonna Give You Up [8bit]';
                playRickRoll8bit(winampAc, v, winampMasterGain);
            } else if (trackId === 'barka') {
                ticker.textContent = 'Barka - Pan kiedys\u0301 stan\u0105\u0142 [8bit]';
                playBarka8bit(winampAc, v, winampMasterGain);
            } else if (trackId === 'donkeykong') {
                ticker.textContent = 'Master of Onions [8bit]';
                playDonkeyKong8bit(winampAc, v, winampMasterGain);
            } else if (trackId === 'tetris') {
                ticker.textContent = 'Neon Grid Runner [synthwave]';
                playTetrisSynth(winampAc, v, winampMasterGain);
            } else if (trackId === 'breakout') {
                ticker.textContent = 'Neon Brick Anthem [synthwave]';
                playBreakoutSynth(winampAc, v, winampMasterGain);
            } else if (trackId === 'chocolaterain') {
                ticker.textContent = 'Tay Zonday - Chocolate Rain [8bit]';
                playChocolateRain8bit(winampAc, v, winampMasterGain);
            }

            winampStartTime = winampAc.currentTime;
            tick();
        }

        playBtn.addEventListener('click', function() {
            if (winampPaused && winampAc) {
                winampAc.resume();
                winampPaused = false;
                winampPlaying = true;
                tick();
                return;
            }
            if (winampPlaying) return;
            doPlay(winampCurrentTrack);
        });

        pauseBtn.addEventListener('click', function() {
            if (!winampAc || !winampPlaying) return;
            if (!winampPaused) {
                winampAc.suspend();
                winampPaused = true;
                if (winampAnimFrame) cancelAnimationFrame(winampAnimFrame);
            } else {
                winampAc.resume();
                winampPaused = false;
                tick();
            }
        });

        stopBtn.addEventListener('click', function() {
            doStop();
            ticker.textContent = 'Stopped';
        });

        prevBtn.addEventListener('click', function() {
            var avail = getAvail();
            var idx = avail.indexOf(winampCurrentTrack);
            doPlay(avail[(idx - 1 + avail.length) % avail.length]);
        });

        nextBtn.addEventListener('click', function() {
            var avail = getAvail();
            var idx = avail.indexOf(winampCurrentTrack);
            doPlay(avail[(idx + 1) % avail.length]);
        });

        playlistEl.addEventListener('click', function(e) {
            var el = e.target.closest ? e.target.closest('.winamp-track') : null;
            if (!el || el.classList.contains('locked')) return;
            doPlay(el.dataset.track);
        });

        function getAvail() {
            var arr = ['rickroll'];
            if (localStorage.getItem('jan-portfolio-barka') === 'true') arr.push('barka');
            if (localStorage.getItem('jan-portfolio-dk') === 'true') arr.push('donkeykong');
            if (localStorage.getItem('jan-portfolio-tetris') === 'true') arr.push('tetris');
            if (localStorage.getItem('jan-portfolio-breakout') === 'true') arr.push('breakout');
            if (localStorage.getItem('jan-portfolio-chocolaterain') === 'true') arr.push('chocolaterain');
            return arr;
        }
    }

    // 8-bit Rick Roll - "Never Gonna Give You Up" melody
    function playRickRoll8bit(ac, vol, dest) {
        if (!dest) dest = ac.destination;
        const b = 0.22; // fast 8-bit tempo

        // Note frequencies
        const C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, B4=493.88;
        const C5=523.25, D5=587.33, E5=659.25;
        const G3=196.00, A3=220.00, B3=246.94, F3=174.61;

        // "Never Gonna Give You Up" main melody (intro + verse + chorus)
        const melody = [
            // Intro riff: D E G E  B A
            { f: D4, s: 0,     d: b },
            { f: E4, s: b,     d: b },
            { f: G4, s: b*2,   d: b*1.5 },
            { f: E4, s: b*3.5, d: b },
            //
            { f: B4, s: b*5,   d: b*2 },
            { f: B4, s: b*7,   d: b },
            { f: A4, s: b*8,   d: b*3 },

            // repeat riff
            { f: D4, s: b*12,  d: b },
            { f: E4, s: b*13,  d: b },
            { f: G4, s: b*14,  d: b*1.5 },
            { f: E4, s: b*15.5,d: b },
            //
            { f: A4, s: b*17,  d: b*2 },
            { f: A4, s: b*19,  d: b },
            { f: G4, s: b*20,  d: b*1.5 },
            { f: E4, s: b*21.5,d: b*1.5 },

            // "We're no strangers to love"
            { f: A4, s: b*24,  d: b*1.5 },
            { f: B4, s: b*25.5,d: b },
            { f: G4, s: b*26.5,d: b*1.5 },
            { f: G4, s: b*28,  d: b },
            { f: E4, s: b*29,  d: b },
            { f: D4, s: b*30,  d: b*2 },

            // "You know the rules and so do I"
            { f: A4, s: b*33,  d: b*1.5 },
            { f: B4, s: b*34.5,d: b },
            { f: D5, s: b*35.5,d: b },
            { f: A4, s: b*36.5,d: b*1.5 },
            { f: G4, s: b*38,  d: b },
            { f: E4, s: b*39,  d: b*2 },

            // "A full commitment's what I'm thinking of"
            { f: A4, s: b*42,  d: b*1.5 },
            { f: B4, s: b*43.5,d: b },
            { f: G4, s: b*44.5,d: b*1.5 },
            { f: G4, s: b*46,  d: b },
            { f: E4, s: b*47,  d: b },
            { f: A4, s: b*48,  d: b*2 },

            // Chorus: "Never gonna give you up"
            { f: A4, s: b*52,  d: b },
            { f: G4, s: b*53,  d: b },
            { f: E4, s: b*54,  d: b*2 },
            { f: E4, s: b*56,  d: b },
            { f: A4, s: b*57,  d: b*2 },
            { f: D5, s: b*59,  d: b*2 },

            // "Never gonna let you down"
            { f: A4, s: b*62,  d: b },
            { f: G4, s: b*63,  d: b },
            { f: E4, s: b*64,  d: b*2 },
            { f: E4, s: b*66,  d: b },
            { f: G4, s: b*67,  d: b },
            { f: A4, s: b*68,  d: b },
            { f: G4, s: b*69,  d: b*2 },

            // "Never gonna run around and desert you"
            { f: A4, s: b*72,  d: b },
            { f: G4, s: b*73,  d: b },
            { f: E4, s: b*74,  d: b*2 },
            { f: E4, s: b*76,  d: b },
            { f: A4, s: b*77,  d: b },
            { f: B4, s: b*78,  d: b },
            { f: A4, s: b*79,  d: b },
            { f: G4, s: b*80,  d: b },
            { f: E4, s: b*81,  d: b },
            { f: D4, s: b*82,  d: b*2.5 },

            // "Never gonna make you cry"
            { f: A4, s: b*86,  d: b },
            { f: G4, s: b*87,  d: b },
            { f: E4, s: b*88,  d: b*2 },
            { f: E4, s: b*90,  d: b },
            { f: A4, s: b*91,  d: b*2 },
            { f: D5, s: b*93,  d: b*2 },

            // "Never gonna say goodbye"
            { f: A4, s: b*96,  d: b },
            { f: G4, s: b*97,  d: b },
            { f: E4, s: b*98,  d: b*2 },
            { f: E4, s: b*100, d: b },
            { f: G4, s: b*101, d: b },
            { f: A4, s: b*102, d: b },
            { f: G4, s: b*103, d: b*2 },

            // "Never gonna tell a lie and hurt you"
            { f: A4, s: b*106, d: b },
            { f: G4, s: b*107, d: b },
            { f: E4, s: b*108, d: b*2 },
            { f: E4, s: b*110, d: b },
            { f: A4, s: b*111, d: b },
            { f: B4, s: b*112, d: b },
            { f: A4, s: b*113, d: b },
            { f: G4, s: b*114, d: b },
            { f: E4, s: b*115, d: b },
            { f: D4, s: b*116, d: b*3 },
        ];

        winampDuration = b * 120;

        // 8-bit square wave melody
        melody.forEach(n => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = 'square';
            osc.frequency.value = n.f;
            gain.gain.setValueAtTime(0, ac.currentTime + n.s);
            gain.gain.linearRampToValueAtTime(vol * 0.6, ac.currentTime + n.s + 0.01);
            gain.gain.setValueAtTime(vol * 0.5, ac.currentTime + n.s + n.d * 0.8);
            gain.gain.linearRampToValueAtTime(0, ac.currentTime + n.s + n.d);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(ac.currentTime + n.s);
            osc.stop(ac.currentTime + n.s + n.d + 0.02);
            winampScheduledOscs.push(osc);
        });

        // 8-bit bass line
        const bassNotes = [
            { f: A3, s: 0,     d: b*4 },
            { f: B3, s: b*5,   d: b*3 },
            { f: A3, s: b*12,  d: b*4 },
            { f: G3, s: b*17,  d: b*4 },
            // verse
            { f: F3, s: b*24,  d: b*3 },
            { f: G3, s: b*27,  d: b*3 },
            { f: A3, s: b*30,  d: b*3 },
            { f: F3, s: b*33,  d: b*3 },
            { f: G3, s: b*36,  d: b*3 },
            { f: A3, s: b*39,  d: b*3 },
            { f: F3, s: b*42,  d: b*3 },
            { f: G3, s: b*45,  d: b*3 },
            { f: A3, s: b*48,  d: b*3 },
            // chorus bass
            { f: F3, s: b*52,  d: b*4 },
            { f: G3, s: b*56,  d: b*3 },
            { f: A3, s: b*59,  d: b*3 },
            { f: F3, s: b*62,  d: b*4 },
            { f: G3, s: b*66,  d: b*3 },
            { f: A3, s: b*69,  d: b*3 },
            { f: F3, s: b*72,  d: b*4 },
            { f: G3, s: b*76,  d: b*4 },
            { f: A3, s: b*80,  d: b*4 },
            { f: F3, s: b*86,  d: b*4 },
            { f: G3, s: b*90,  d: b*3 },
            { f: A3, s: b*93,  d: b*3 },
            { f: F3, s: b*96,  d: b*4 },
            { f: G3, s: b*100, d: b*3 },
            { f: A3, s: b*103, d: b*3 },
            { f: F3, s: b*106, d: b*4 },
            { f: G3, s: b*110, d: b*4 },
            { f: A3, s: b*114, d: b*5 },
        ];

        bassNotes.forEach(n => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = 'square';
            osc.frequency.value = n.f;
            gain.gain.setValueAtTime(0, ac.currentTime + n.s);
            gain.gain.linearRampToValueAtTime(vol * 0.35, ac.currentTime + n.s + 0.01);
            gain.gain.setValueAtTime(vol * 0.25, ac.currentTime + n.s + n.d * 0.7);
            gain.gain.linearRampToValueAtTime(0, ac.currentTime + n.s + n.d);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(ac.currentTime + n.s);
            osc.stop(ac.currentTime + n.s + n.d + 0.02);
            winampScheduledOscs.push(osc);
        });

        // Simple 8-bit drums (noise bursts)
        for (let i = 0; i < 120; i += 2) {
            const t = b * i;
            if (t > winampDuration) break;
            // kick on beat
            const kickOsc = ac.createOscillator();
            const kickGain = ac.createGain();
            kickOsc.type = 'square';
            kickOsc.frequency.setValueAtTime(150, ac.currentTime + t);
            kickOsc.frequency.exponentialRampToValueAtTime(30, ac.currentTime + t + 0.08);
            kickGain.gain.setValueAtTime(vol * 0.4, ac.currentTime + t);
            kickGain.gain.linearRampToValueAtTime(0, ac.currentTime + t + 0.1);
            kickOsc.connect(kickGain);
            kickGain.connect(dest);
            kickOsc.start(ac.currentTime + t);
            kickOsc.stop(ac.currentTime + t + 0.12);
            winampScheduledOscs.push(kickOsc);

            // snare on offbeat
            if (i + 1 < 120) {
                const st = b * (i + 1);
                const snOsc = ac.createOscillator();
                const snGain = ac.createGain();
                snOsc.type = 'sawtooth';
                snOsc.frequency.value = 200 + Math.random() * 300;
                snGain.gain.setValueAtTime(vol * 0.15, ac.currentTime + st);
                snGain.gain.linearRampToValueAtTime(0, ac.currentTime + st + 0.06);
                snOsc.connect(snGain);
                snGain.connect(dest);
                snOsc.start(ac.currentTime + st);
                snOsc.stop(ac.currentTime + st + 0.08);
                winampScheduledOscs.push(snOsc);
            }
        }
    }

    // 8-bit Barka for Winamp
    function playBarka8bit(ac, vol, dest) {
        if (!dest) dest = ac.destination;
        const b = 0.35;

        const C4=261.63, D4=293.66, E4=329.63, F4=349.23;
        const G4=392.00, A4=440.00, B4=493.88, C5=523.25;
        const A2=110.00, C3=130.81, D2=73.42, F2=87.31, G2=98.00;

        // Reuse same melody as playBarka but in 8-bit square wave style
        const melody = [
            { f: E4, s: 0,         d: b*2.5 },
            { f: D4, s: b*2.5,     d: b*0.5 },
            { f: E4, s: b*3,       d: b*0.5 },
            { f: F4, s: b*3.5,     d: b*0.5 },
            { f: E4, s: b*4,       d: b*0.5 },
            { f: D4, s: b*4.5,     d: b*0.5 },
            { f: C4, s: b*5,       d: b*1.5 },
            { f: C4, s: b*7,       d: b*2   },
            { f: D4, s: b*9,       d: b*1   },
            { f: E4, s: b*10,      d: b*0.5 },
            { f: F4, s: b*10.5,    d: b*1.5 },
            { f: F4, s: b*12.5,    d: b*2   },
            { f: F4, s: b*14.5,    d: b*0.5 },
            { f: F4, s: b*15,      d: b*0.75},
            { f: E4, s: b*15.75,   d: b*0.5 },
            { f: D4, s: b*16.25,   d: b*1.5 },
            { f: D4, s: b*18,      d: b*2   },
            { f: C4, s: b*20,      d: b*0.75},
            { f: D4, s: b*20.75,   d: b*0.5 },
            { f: E4, s: b*21.25,   d: b*2.5 },
            // Refrain
            { f: A4, s: b*25,      d: b*1.5 },
            { f: A4, s: b*26.5,    d: b*1.5 },
            { f: A4, s: b*28,      d: b*0.5 },
            { f: B4, s: b*28.5,    d: b*1   },
            { f: B4, s: b*29.5,    d: b*0.5 },
            { f: A4, s: b*30,      d: b*0.5 },
            { f: G4, s: b*30.5,    d: b*1.5 },
            { f: G4, s: b*32.5,    d: b*1.5 },
            { f: F4, s: b*34,      d: b*0.75},
            { f: E4, s: b*34.75,   d: b*0.5 },
            { f: F4, s: b*35.25,   d: b*1.5 },
            { f: F4, s: b*37,      d: b*0.75},
            { f: G4, s: b*37.75,   d: b*0.5 },
            { f: A4, s: b*38.25,   d: b*0.5 },
            { f: G4, s: b*38.75,   d: b*0.5 },
            { f: F4, s: b*39.25,   d: b*0.5 },
            { f: E4, s: b*39.75,   d: b*2   },
            { f: C4, s: b*42,      d: b*2.5 },
        ];

        winampDuration = b * 46;

        melody.forEach(n => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = 'square';
            osc.frequency.value = n.f;
            gain.gain.setValueAtTime(0, ac.currentTime + n.s);
            gain.gain.linearRampToValueAtTime(vol * 0.5, ac.currentTime + n.s + 0.01);
            gain.gain.setValueAtTime(vol * 0.4, ac.currentTime + n.s + n.d * 0.8);
            gain.gain.linearRampToValueAtTime(0, ac.currentTime + n.s + n.d);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(ac.currentTime + n.s);
            osc.stop(ac.currentTime + n.s + n.d + 0.02);
            winampScheduledOscs.push(osc);
        });

        // Bass
        const bass = [
            { f: A2,   s: 0,      d: b*7  },
            { f: F2,   s: b*7,    d: b*5  },
            { f: D2,   s: b*12.5, d: b*5.5},
            { f: C3,   s: b*18,   d: b*6  },
            { f: A2,   s: b*25,   d: b*3.5},
            { f: G2,   s: b*28.5, d: b*3.5},
            { f: F2,   s: b*32.5, d: b*4  },
            { f: C3,   s: b*37,   d: b*3  },
            { f: A2,   s: b*40,   d: b*3  },
            { f: C3,   s: b*43,   d: b*3  },
        ];

        bass.forEach(n => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = 'square';
            osc.frequency.value = n.f;
            gain.gain.setValueAtTime(0, ac.currentTime + n.s);
            gain.gain.linearRampToValueAtTime(vol * 0.3, ac.currentTime + n.s + 0.01);
            gain.gain.setValueAtTime(vol * 0.2, ac.currentTime + n.s + n.d * 0.7);
            gain.gain.linearRampToValueAtTime(0, ac.currentTime + n.s + n.d);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(ac.currentTime + n.s);
            osc.stop(ac.currentTime + n.s + n.d + 0.02);
            winampScheduledOscs.push(osc);
        });
    }

    // ===== DONKEY KONG 8-BIT =====
    function playDonkeyKong8bit(ac, vol, dest) {
        if (!dest) dest = ac.destination;
        var b = 0.18;
        var C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, B4=493.88;
        var C5=523.25, D5=587.33, E5=659.25, F5=698.46, G5=783.99;
        var C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196.00, A3=220.00, B3=246.94;
        var C2=65.41, D2=73.42, E2=82.41, F2=87.31, G2=98.00, A2=110.00;

        // DK Country - main theme riff (jungle swing feel)
        var melody = [
            // Intro phrase
            {f:E4,s:0,d:b},{f:G4,s:b,d:b},{f:A4,s:b*2,d:b*2},{f:G4,s:b*4,d:b},{f:E4,s:b*5,d:b},
            {f:D4,s:b*6,d:b*2},
            {f:E4,s:b*8,d:b},{f:G4,s:b*9,d:b},{f:A4,s:b*10,d:b},{f:C5,s:b*11,d:b*2},{f:A4,s:b*13,d:b},
            {f:G4,s:b*14,d:b*2},
            // Second phrase
            {f:A4,s:b*16,d:b},{f:C5,s:b*17,d:b},{f:D5,s:b*18,d:b*2},{f:C5,s:b*20,d:b},{f:A4,s:b*21,d:b},
            {f:G4,s:b*22,d:b},{f:E4,s:b*23,d:b},{f:G4,s:b*24,d:b*2},
            {f:A4,s:b*26,d:b},{f:G4,s:b*27,d:b},{f:E4,s:b*28,d:b},{f:D4,s:b*29,d:b},{f:C4,s:b*30,d:b*2},
            // Repeat with variation
            {f:E4,s:b*32,d:b},{f:G4,s:b*33,d:b},{f:A4,s:b*34,d:b*2},{f:G4,s:b*36,d:b},{f:E4,s:b*37,d:b},
            {f:D4,s:b*38,d:b},{f:E4,s:b*39,d:b},{f:G4,s:b*40,d:b*2},
            {f:A4,s:b*42,d:b},{f:C5,s:b*43,d:b},{f:D5,s:b*44,d:b*2},{f:E5,s:b*46,d:b},
            {f:D5,s:b*47,d:b},{f:C5,s:b*48,d:b*2},{f:A4,s:b*50,d:b},{f:G4,s:b*51,d:b*3},
            // Ending flourish
            {f:E5,s:b*54,d:b},{f:D5,s:b*55,d:b},{f:C5,s:b*56,d:b},{f:A4,s:b*57,d:b},
            {f:G4,s:b*58,d:b},{f:E4,s:b*59,d:b},{f:G4,s:b*60,d:b*3},
        ];

        var bass = [
            {f:C3,s:0,d:b*4},{f:C3,s:b*4,d:b*4},{f:F3,s:b*8,d:b*4},{f:G3,s:b*12,d:b*4},
            {f:A3,s:b*16,d:b*4},{f:F3,s:b*20,d:b*4},{f:C3,s:b*24,d:b*4},{f:G3,s:b*28,d:b*4},
            {f:C3,s:b*32,d:b*4},{f:C3,s:b*36,d:b*4},{f:F3,s:b*40,d:b*4},{f:G3,s:b*44,d:b*4},
            {f:A3,s:b*48,d:b*4},{f:F3,s:b*52,d:b*4},{f:C3,s:b*56,d:b*4},{f:C3,s:b*60,d:b*3},
        ];

        winampDuration = b * 63;

        melody.forEach(function(n) {
            var osc = ac.createOscillator();
            var gain = ac.createGain();
            osc.type = 'square';
            osc.frequency.value = n.f;
            gain.gain.setValueAtTime(0, ac.currentTime + n.s);
            gain.gain.linearRampToValueAtTime(vol * 0.25, ac.currentTime + n.s + 0.01);
            gain.gain.setValueAtTime(vol * 0.2, ac.currentTime + n.s + n.d * 0.7);
            gain.gain.linearRampToValueAtTime(0, ac.currentTime + n.s + n.d);
            osc.connect(gain); gain.connect(dest);
            osc.start(ac.currentTime + n.s);
            osc.stop(ac.currentTime + n.s + n.d + 0.02);
            winampScheduledOscs.push(osc);
        });

        bass.forEach(function(n) {
            var osc = ac.createOscillator();
            var gain = ac.createGain();
            osc.type = 'square';
            osc.frequency.value = n.f;
            gain.gain.setValueAtTime(0, ac.currentTime + n.s);
            gain.gain.linearRampToValueAtTime(vol * 0.15, ac.currentTime + n.s + 0.01);
            gain.gain.setValueAtTime(vol * 0.1, ac.currentTime + n.s + n.d * 0.7);
            gain.gain.linearRampToValueAtTime(0, ac.currentTime + n.s + n.d);
            osc.connect(gain); gain.connect(dest);
            osc.start(ac.currentTime + n.s);
            osc.stop(ac.currentTime + n.s + n.d + 0.02);
            winampScheduledOscs.push(osc);
        });
    }

    // 8-bit Synthwave track for Winamp (Tetris unlock)
    function playTetrisSynth(ac, vol, dest) {
        var t = ac.currentTime;
        var bpm = 128;
        var beat = 60 / bpm;
        var totalBeats = 64;
        var bassLine = [110, 110, 87.31, 87.31, 130.81, 130.81, 98, 98]; // Am Am F F C C G G

        for (var bar = 0; bar < 8; bar++) {
            var freq = bassLine[bar];
            for (var step = 0; step < 8; step++) {
                var st = t + (bar * 8 + step) * beat;
                // Bass
                var bass = ac.createOscillator();
                bass.type = 'sawtooth';
                bass.frequency.setValueAtTime(freq, st);
                var bg = ac.createGain();
                bg.gain.setValueAtTime(vol * 0.2, st);
                bg.gain.exponentialRampToValueAtTime(0.001, st + beat * 0.8);
                bass.connect(bg); bg.connect(dest);
                bass.start(st); bass.stop(st + beat);
                winampScheduledOscs.push(bass);
            }
            // Lead melody
            var melodies = [
                [freq*4, freq*5, freq*6, freq*5, freq*4, freq*3, freq*4, freq*5],
                [freq*6, freq*5, freq*4, freq*5, freq*6, freq*8, freq*6, freq*5]
            ];
            var mel = melodies[bar % 2];
            for (var m = 0; m < 8; m++) {
                var mt = t + (bar * 8 + m) * beat;
                var lead = ac.createOscillator();
                lead.type = 'square';
                lead.frequency.setValueAtTime(mel[m], mt);
                var lg = ac.createGain();
                lg.gain.setValueAtTime(vol * 0.08, mt);
                lg.gain.exponentialRampToValueAtTime(0.001, mt + beat * 0.9);
                lead.connect(lg); lg.connect(dest);
                lead.start(mt); lead.stop(mt + beat);
                winampScheduledOscs.push(lead);
            }
            // Pad chord
            var padStart = t + bar * 8 * beat;
            var padEnd = padStart + 8 * beat;
            [freq*2, freq*2.5, freq*3].forEach(function(pf) {
                var pad = ac.createOscillator();
                pad.type = 'triangle';
                pad.frequency.setValueAtTime(pf, padStart);
                var pg = ac.createGain();
                pg.gain.setValueAtTime(0, padStart);
                pg.gain.linearRampToValueAtTime(vol * 0.04, padStart + beat);
                pg.gain.setValueAtTime(vol * 0.04, padEnd - beat);
                pg.gain.linearRampToValueAtTime(0, padEnd);
                pad.connect(pg); pg.connect(dest);
                pad.start(padStart); pad.stop(padEnd + 0.01);
                winampScheduledOscs.push(pad);
            });
        }
    }

    // Breakout synthwave track for Winamp — "Neon Brick Anthem"
    function playBreakoutSynth(ac, vol, dest) {
        if (!dest) dest = ac.destination;
        var t = ac.currentTime;
        var bpm = 135;
        var beat = 60 / bpm;
        var totalBars = 16;

        // Chord progression: Am - F - C - G (two bars each, repeat)
        var chords = [
            { bass: 110, notes: [220, 261.63, 329.63] },    // Am
            { bass: 87.31, notes: [174.61, 220, 261.63] },  // F
            { bass: 130.81, notes: [261.63, 329.63, 392] },  // C
            { bass: 98, notes: [196, 246.94, 329.63] }       // G
        ];

        for (var bar = 0; bar < totalBars; bar++) {
            var chord = chords[Math.floor(bar / 2) % 4];
            var barStart = t + bar * 4 * beat;

            // Driving bass (8th notes)
            for (var step = 0; step < 8; step++) {
                var st = barStart + step * beat * 0.5;
                var bass = ac.createOscillator();
                bass.type = 'sawtooth';
                bass.frequency.setValueAtTime(chord.bass, st);
                var bf = ac.createBiquadFilter();
                bf.type = 'lowpass';
                bf.frequency.value = 250;
                var bg = ac.createGain();
                bg.gain.setValueAtTime(vol * 0.25, st);
                bg.gain.exponentialRampToValueAtTime(0.001, st + beat * 0.45);
                bass.connect(bf); bf.connect(bg); bg.connect(dest);
                bass.start(st); bass.stop(st + beat * 0.5);
                winampScheduledOscs.push(bass);
            }

            // Arpeggio (16th notes cycling through chord tones + octave)
            var arpPool = [chord.notes[0], chord.notes[1], chord.notes[2], chord.notes[0] * 2, chord.notes[2], chord.notes[1]];
            for (var a = 0; a < 16; a++) {
                var at = barStart + a * beat * 0.25;
                var arp = ac.createOscillator();
                arp.type = 'triangle';
                arp.frequency.setValueAtTime(arpPool[a % arpPool.length], at);
                var af = ac.createBiquadFilter();
                af.type = 'bandpass';
                af.frequency.value = 1800;
                af.Q.value = 2;
                var ag = ac.createGain();
                ag.gain.setValueAtTime(vol * 0.12, at);
                ag.gain.exponentialRampToValueAtTime(0.001, at + beat * 0.22);
                arp.connect(af); af.connect(ag); ag.connect(dest);
                arp.start(at); arp.stop(at + beat * 0.25);
                winampScheduledOscs.push(arp);
            }

            // Pad chord (whole bar sustain)
            var padEnd = barStart + 4 * beat;
            chord.notes.forEach(function(pf) {
                var pad = ac.createOscillator();
                pad.type = 'sine';
                pad.frequency.setValueAtTime(pf * 2, barStart);
                var pg = ac.createGain();
                pg.gain.setValueAtTime(0, barStart);
                pg.gain.linearRampToValueAtTime(vol * 0.04, barStart + beat * 0.5);
                pg.gain.setValueAtTime(vol * 0.04, padEnd - beat * 0.5);
                pg.gain.linearRampToValueAtTime(0, padEnd);
                pad.connect(pg); pg.connect(dest);
                pad.start(barStart); pad.stop(padEnd + 0.01);
                winampScheduledOscs.push(pad);
            });

            // Kick drum on beats 1 and 3
            for (var k = 0; k < 2; k++) {
                var kt = barStart + k * 2 * beat;
                var kick = ac.createOscillator();
                kick.type = 'sine';
                kick.frequency.setValueAtTime(150, kt);
                kick.frequency.exponentialRampToValueAtTime(40, kt + 0.08);
                var kg = ac.createGain();
                kg.gain.setValueAtTime(vol * 0.35, kt);
                kg.gain.exponentialRampToValueAtTime(0.001, kt + 0.15);
                kick.connect(kg); kg.connect(dest);
                kick.start(kt); kick.stop(kt + 0.2);
                winampScheduledOscs.push(kick);
            }

            // Hi-hat on every 8th note
            for (var h = 0; h < 8; h++) {
                var ht = barStart + h * beat * 0.5;
                var hihat = ac.createOscillator();
                hihat.type = 'square';
                hihat.frequency.setValueAtTime(8000 + Math.random() * 2000, ht);
                var hf = ac.createBiquadFilter();
                hf.type = 'highpass';
                hf.frequency.value = 7000;
                var hg = ac.createGain();
                var hhVol = (h % 2 === 0) ? vol * 0.03 : vol * 0.015;
                hg.gain.setValueAtTime(hhVol, ht);
                hg.gain.exponentialRampToValueAtTime(0.001, ht + 0.03);
                hihat.connect(hf); hf.connect(hg); hg.connect(dest);
                hihat.start(ht); hihat.stop(ht + 0.04);
                winampScheduledOscs.push(hihat);
            }
        }

        winampDuration = totalBars * 4 * beat;
    }

    // Chocolate Rain 8-bit — plays from audio file
    function playChocolateRain8bit(ac, vol, dest) {
        // Use HTML Audio element connected to Web Audio for Winamp visualization
        var audio = new Audio('audio/chocolate_rain_8bit.m4a');
        var source = ac.createMediaElementSource(audio);
        var gain = ac.createGain();
        gain.gain.value = vol * 3;
        source.connect(gain);
        gain.connect(dest || ac.destination);
        audio.play();
        // Store reference for stop functionality
        winampScheduledOscs.push({ stop: function() { audio.pause(); audio.currentTime = 0; } });
        // Track duration from audio
        audio.addEventListener('loadedmetadata', function() {
            winampDuration = audio.duration;
        });
        // Auto-advance when done
        audio.addEventListener('ended', function() {
            // Trigger next track via winamp's existing logic
        });
    }

    // ===== BROWSER THEME + LOADING =====
    var browserLoadingShown = false;

    function getBrowserType() {
        var theme = document.documentElement.getAttribute('data-theme') || 'win98';
        if (theme === 'win98' || theme === 'winxp') return 'ie';
        if (theme === 'macos') return 'safari';
        return 'tor';
    }

    function isWindowsTheme() {
        return getBrowserType() === 'ie';
    }

    // Watermark messages for the browser no-net screen
    var BROWSER_WATERMARK_MESSAGES = {
        pl: [
            'BRAK INTERNETU',
            '404 NOSACZ NOT FOUND',
            'PRZEGLĄDARKA NOSACZA',
            'CEBULA OFFLINE',
            'TOR ZAWIÓDŁ',
            'NOSACZ CZEKA...',
            'INTERNET POSZEDŁ NA CEBULKI',
            'BRAK SIECI CEBULOWEJ',
            'NOSACZ JEST OFFLINE',
            'CEBULKOWY BŁĄD',
            'TRĄBA NOSACZA SZUKA SIECI',
            'BRAK POŁĄCZENIA Z DŻUNGLĄ',
        ],
        en: [
            'NO INTERNET',
            '404 NOSACZ NOT FOUND',
            'NOSACZ BROWSER',
            'ONION OFFLINE',
            'TOR FAILED',
            'NOSACZ IS WAITING...',
            'INTERNET WENT FOR ONIONS',
            'NO ONION NETWORK',
            'NOSACZ IS OFFLINE',
            'ONION ERROR',
            'PROBOSCIS SEEKS SIGNAL',
            'NO JUNGLE CONNECTION',
        ],
        klingon: [
            'QUM TU\'LU\'BE\'',
            '404 NOSACZ SAMlaHbe\'',
            'NOSACZ HaSta QumwI\'',
            'CEBULA Qapbe\'',
            'TOR lujpu\'',
            'NOSACZ loSlu\'taH...',
            'QUM CEBULA DaqDaq jaH',
            'CEBULA QumwI\' tu\'lu\'be\'',
            'NOSACZ Qapbe\'',
        ],
    };

    function getRandomWatermark() {
        var lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
        var msgs = BROWSER_WATERMARK_MESSAGES[lang] || BROWSER_WATERMARK_MESSAGES.en;
        return msgs[Math.floor(Math.random() * msgs.length)];
    }

    function updateBrowserWatermark() {
        var wm = document.getElementById('browserWatermark');
        if (!wm) return;
        var noNet = document.getElementById('browserNoNet');
        // Show watermark only when noNet screen is visible
        if (noNet && !noNet.classList.contains('hidden')) {
            wm.textContent = getRandomWatermark();
            wm.classList.remove('hidden');
        } else {
            wm.classList.add('hidden');
        }
    }

    function updateBrowserTheme() {
        if (window._janArmageddonActive) return;
        var win = document.getElementById('window-browser');
        if (!win) return;
        var type = getBrowserType();
        var titleIcon = win.querySelector('.window-title-icon');
        var titleText = win.querySelector('.window-title-text');
        var urlIcon = win.querySelector('.browser-url-icon');
        var urlText = win.querySelector('.browser-url-text');
        var noNetIcon = document.getElementById('browserNoNetIcon');
        var noNetTitle = document.getElementById('browserNoNetTitle');
        var noNetDesc = document.getElementById('browserNoNetDesc');
        var noNetHint = document.getElementById('browserNoNetHint');
        if (type === 'ie') {
            if (titleIcon) titleIcon.textContent = '\uD83C\uDF10';
            if (titleText) titleText.textContent = 'Internet Explorer';
            if (urlIcon) urlIcon.textContent = '\uD83D\uDD12';
            if (urlText) urlText.textContent = 'http://janjurec.cyberdemigods.com';
            if (noNetIcon) noNetIcon.textContent = '\uD83C\uDF10';
            if (noNetTitle) noNetTitle.textContent = t('browser-nonet-ie-title');
            if (noNetDesc) noNetDesc.textContent = t('browser-nonet-ie-desc');
        } else if (type === 'safari') {
            if (titleIcon) titleIcon.textContent = '\uD83E\uDDED';
            if (titleText) titleText.textContent = 'Safari';
            if (urlIcon) urlIcon.textContent = '\uD83D\uDD12';
            if (urlText) urlText.textContent = 'janjurec.cyberdemigods.com';
            if (noNetIcon) noNetIcon.textContent = '\uD83E\uDDED';
            if (noNetTitle) noNetTitle.textContent = t('browser-nonet-safari-title');
            if (noNetDesc) noNetDesc.textContent = t('browser-nonet-safari-desc');
        } else {
            if (titleIcon) titleIcon.textContent = '\uD83E\uDDC5';
            if (titleText) titleText.textContent = 'Tor Browser';
            if (urlIcon) urlIcon.textContent = '\uD83E\uDDC5';
            if (urlText) urlText.textContent = 'http://janportf0l1o.onion';
            if (noNetIcon) noNetIcon.textContent = '\uD83E\uDDC5';
            if (noNetTitle) noNetTitle.textContent = t('browser-nonet-tor-title');
            if (noNetDesc) noNetDesc.textContent = t('browser-nonet-tor-desc');
        }
        if (noNetHint) noNetHint.textContent = t('browser-nonet-hint');
        updateBrowserWatermark();
    }

    function showSafariInception() {
        var iframe = document.getElementById('safariInception');
        var noNet = document.getElementById('browserNoNet');
        var canvas = document.getElementById('nosaczCanvas');
        var scoreEl = document.getElementById('nosaczScore');
        if (!iframe) return;
        // Hide other browser content
        if (noNet) noNet.classList.add('hidden');
        if (canvas) canvas.classList.add('hidden');
        if (scoreEl) scoreEl.classList.add('hidden');
        // Load the page itself inside the iframe with depth tracking
        iframe.classList.remove('hidden');
        if (!iframe.src || iframe.src === 'about:blank') {
            var depth = parseInt(new URLSearchParams(window.location.search).get('depth') || '0');
            var url = window.location.origin + window.location.pathname + '?depth=' + (depth + 1) + '&theme=macos';
            iframe.src = url;
        }
    }

    function hideSafariInception() {
        var iframe = document.getElementById('safariInception');
        if (!iframe) return;
        iframe.classList.add('hidden');
        iframe.src = 'about:blank';
    }

    function showBrowserLoading() {
        if (getBrowserType() !== 'ie') return; // Only IE needs loading time
        var loadingEl = document.getElementById('browserLoading');
        var noNet = document.getElementById('browserNoNet');
        var canvas = document.getElementById('nosaczCanvas');
        var scoreEl = document.getElementById('nosaczScore');
        if (!loadingEl || !noNet) return;
        // Only show loading if game isn't already running
        if (canvas && !canvas.classList.contains('hidden')) return;
        browserLoadingShown = true;
        noNet.classList.add('hidden');
        loadingEl.classList.remove('hidden');
        // Reset loading bar animation
        var fill = loadingEl.querySelector('.browser-loading-fill');
        if (fill) {
            fill.style.animation = 'none';
            fill.offsetHeight; // force reflow
            fill.style.animation = '';
        }
        // After 3-5 seconds, show "no internet" with dramatic entrance
        var delay = 3000 + Math.random() * 2000;
        setTimeout(function() {
            if (!browserLoadingShown) return;
            loadingEl.classList.add('hidden');
            noNet.classList.remove('hidden');
            updateBrowserWatermark();
            browserLoadingShown = false;
        }, delay);
    }

    function updateBrowserDesktopIcon() {
        if (window._janArmageddonActive) return;
        var iconEl = document.getElementById('icon-browser');
        var labelEl = iconEl ? iconEl.parentElement.querySelector('[data-i18n="icon-browser"]') : null;
        var startItem = document.querySelector('.start-menu-item[data-window="browser"]');
        var type = getBrowserType();
        if (type === 'ie') {
            if (iconEl) iconEl.innerHTML = '<svg viewBox="0 0 32 32" width="32" height="32" style="display:block;margin:0 auto"><circle cx="16" cy="16" r="13" fill="#0078d7" stroke="#005a9e" stroke-width="1.5"/><text x="16" y="21" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold" font-family="serif">e</text></svg>';
            if (labelEl) labelEl.textContent = 'Internet Explorer';
            if (startItem) startItem.innerHTML = '🌐 <span data-i18n="icon-browser">Internet Explorer</span>';
        } else if (type === 'safari') {
            if (iconEl) iconEl.innerHTML = '<svg viewBox="0 0 32 32" width="32" height="32" style="display:block;margin:0 auto"><circle cx="16" cy="16" r="13" fill="#1A8FE3" stroke="#1478c2" stroke-width="1.5"/><circle cx="16" cy="16" r="10" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.4"/><line x1="16" y1="6" x2="16" y2="9" stroke="#fff" stroke-width="1" opacity="0.7"/><line x1="16" y1="23" x2="16" y2="26" stroke="#fff" stroke-width="1" opacity="0.7"/><line x1="6" y1="16" x2="9" y2="16" stroke="#fff" stroke-width="1" opacity="0.7"/><line x1="23" y1="16" x2="26" y2="16" stroke="#fff" stroke-width="1" opacity="0.7"/><polygon points="16,8 19,16 16,24 13,16" fill="#fff" opacity="0.9"/><polygon points="16,8 19,16" fill="#ff3b30" opacity="0.9"/><polygon points="16,24 13,16" fill="#ff3b30" opacity="0.9"/></svg>';
            if (labelEl) {
                labelEl.textContent = 'Safari';
                // Show hint if not seen yet
                if (!sessionStorage.getItem('jan-safari-hint')) {
                    var hint = labelEl.parentElement.querySelector('.safari-hint');
                    if (!hint) {
                        hint = document.createElement('div');
                        hint.className = 'safari-hint';
                        hint.textContent = 'Try me!';
                        hint.style.cssText = 'font-size:9px;color:#1A8FE3;text-align:center;animation:blink-hint 1.5s ease-in-out infinite;margin-top:2px;';
                        labelEl.parentElement.appendChild(hint);
                        // Remove hint after first open
                        var browserIcon = labelEl.parentElement;
                        browserIcon.addEventListener('dblclick', function() {
                            if (hint) { hint.remove(); sessionStorage.setItem('jan-safari-hint', '1'); }
                        }, { once: true });
                    }
                }
            }
            if (startItem) startItem.innerHTML = '🧭 <span data-i18n="icon-browser">Safari</span>';
        } else {
            if (iconEl) iconEl.innerHTML = '<svg viewBox="0 0 32 32" width="32" height="32" style="display:block;margin:0 auto"><circle cx="16" cy="16" r="13" fill="#7D4698" stroke="#4a2d5e" stroke-width="1.5"/><ellipse cx="16" cy="16" rx="6" ry="13" fill="none" stroke="#fff" stroke-width="1" opacity="0.5"/><line x1="3" y1="16" x2="29" y2="16" stroke="#fff" stroke-width="1" opacity="0.5"/><line x1="5" y1="9" x2="27" y2="9" stroke="#fff" stroke-width="0.7" opacity="0.3"/><line x1="5" y1="23" x2="27" y2="23" stroke="#fff" stroke-width="0.7" opacity="0.3"/><text x="16" y="19" text-anchor="middle" fill="#fff" font-size="7" font-weight="bold" font-family="monospace">.onion</text></svg>';
            if (labelEl) labelEl.textContent = 'Tor Browser';
            if (startItem) startItem.innerHTML = '🧅 <span data-i18n="icon-browser">Tor Browser</span>';
        }
    }

    // ===== NOSACZ GAME (Tor Browser) =====
    function initNosaczGame() {
        var canvas = document.getElementById('nosaczCanvas');
        var scoreEl = document.getElementById('nosaczScore');
        var noNet = document.getElementById('browserNoNet');
        var browserWin = document.getElementById('window-browser');
        if (!canvas || !noNet) return;

        var ctx = canvas.getContext('2d');
        var running = false;
        var gameOver = false;
        var score = 0;
        var highScore = parseInt(localStorage.getItem('jan-nosacz-high') || '0');
        var frameId = null;

        // Game objects
        var nosacz = { x: 50, y: 0, w: 36, h: 40, vy: 0, jumping: false };
        var ground = 0;
        var obstacles = [];
        var onions = [];
        var speed = 4;
        var gravity = 0.6;
        var jumpForce = -11;
        var spawnTimer = 0;
        var onionTimer = 0;
        var cloudX = 200;

        // ===== GAME AUDIO =====
        var gameAc = null;
        var gameBgOscs = [];
        var gameBgTimeout = null;
        var dkUnlocked = localStorage.getItem('jan-portfolio-dk') === 'true';

        function initGameAudio() {
            if (gameAc) return;
            gameAc = new (window.AudioContext || window.webkitAudioContext)();
            if (gameAc.state === 'suspended') gameAc.resume();
        }

        function playCollectSound(collectCount) {
            if (!gameAc) return;
            if (window._janArmageddonActive) return;
            if (collectCount > 0 && collectCount % 10 === 0) {
                // Every 10th: speech-like "pyyyyszna cebula"
                playSpeech(gameAc);
            } else {
                // Normal: mniam/mlask chirp
                playMniam(gameAc);
            }
        }

        function playMniam(ac) {
            var osc = ac.createOscillator();
            var gain = ac.createGain();
            osc.type = 'square';
            // Quick chirp up then down - "mniam" feel
            osc.frequency.setValueAtTime(300, ac.currentTime);
            osc.frequency.linearRampToValueAtTime(600, ac.currentTime + 0.04);
            osc.frequency.linearRampToValueAtTime(200, ac.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, ac.currentTime);
            gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.12);
            osc.connect(gain); gain.connect(ac.destination);
            osc.start(ac.currentTime);
            osc.stop(ac.currentTime + 0.13);
        }

        function playSpeech(ac) {
            // Complex multi-tone "pyyyyszna cebula" - longer, more elaborate
            var t = ac.currentTime;
            var notes = [
                {f:400,s:0,d:0.08},{f:500,s:0.08,d:0.06},{f:450,s:0.14,d:0.06},
                {f:600,s:0.22,d:0.06},{f:550,s:0.28,d:0.06},{f:500,s:0.34,d:0.05},
                {f:650,s:0.42,d:0.07},{f:600,s:0.49,d:0.06},{f:500,s:0.55,d:0.05},
                {f:700,s:0.62,d:0.05},{f:600,s:0.67,d:0.05},{f:450,s:0.72,d:0.08},
                {f:350,s:0.82,d:0.06},{f:500,s:0.88,d:0.06},{f:400,s:0.94,d:0.08},
            ];
            notes.forEach(function(n) {
                var osc = ac.createOscillator();
                var gain = ac.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = n.f;
                gain.gain.setValueAtTime(0, t + n.s);
                gain.gain.linearRampToValueAtTime(0.12, t + n.s + 0.01);
                gain.gain.linearRampToValueAtTime(0, t + n.s + n.d);
                osc.connect(gain); gain.connect(ac.destination);
                osc.start(t + n.s);
                osc.stop(t + n.s + n.d + 0.02);
            });
        }

        function playDeathSound(ac) {
            if (!ac) return;
            // Descending "ahhhhh" wail
            var t = ac.currentTime;
            var osc = ac.createOscillator();
            var gain = ac.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.linearRampToValueAtTime(150, t + 0.6);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.3);
            gain.gain.linearRampToValueAtTime(0, t + 0.7);
            osc.connect(gain); gain.connect(ac.destination);
            osc.start(t);
            osc.stop(t + 0.75);
            // Low thud
            var osc2 = ac.createOscillator();
            var gain2 = ac.createGain();
            osc2.type = 'square';
            osc2.frequency.value = 80;
            gain2.gain.setValueAtTime(0.2, t + 0.1);
            gain2.gain.linearRampToValueAtTime(0, t + 0.4);
            osc2.connect(gain2); gain2.connect(ac.destination);
            osc2.start(t + 0.1);
            osc2.stop(t + 0.45);
        }

        // DK-style background loop for the game
        function playGameBgLoop() {
            if (!gameAc || !running) return;
            if (window._janArmageddonActive) return;
            var ac = gameAc;
            var t = ac.currentTime;
            var b = 0.16;
            var C4=261.63,D4=293.66,E4=329.63,F4=349.23,G4=392.00,A4=440.00;
            var C3=130.81,E3=164.81,G3=196.00,A3=220.00;

            // Short jungle riff loop (~2.5 sec)
            var riff = [
                {f:E4,s:0,d:b*0.8},{f:G4,s:b,d:b*0.8},{f:A4,s:b*2,d:b*1.5},
                {f:G4,s:b*3.5,d:b*0.8},{f:E4,s:b*4.5,d:b*0.8},
                {f:D4,s:b*5.5,d:b*0.8},{f:E4,s:b*6.5,d:b*0.8},{f:G4,s:b*7.5,d:b*1.5},
                {f:A4,s:b*9,d:b*0.8},{f:G4,s:b*10,d:b*0.8},{f:E4,s:b*11,d:b*0.8},
                {f:D4,s:b*12,d:b*0.8},{f:C4,s:b*13,d:b*1.5},
            ];
            var bass = [
                {f:C3,s:0,d:b*3.5},{f:A3,s:b*3.5,d:b*3},{f:G3,s:b*6.5,d:b*3},
                {f:E3,s:b*9.5,d:b*2.5},{f:C3,s:b*12,d:b*2.5},
            ];

            riff.forEach(function(n) {
                var osc = ac.createOscillator();
                var gain = ac.createGain();
                osc.type = 'square';
                osc.frequency.value = n.f;
                gain.gain.setValueAtTime(0, t + n.s);
                gain.gain.linearRampToValueAtTime(0.08, t + n.s + 0.01);
                gain.gain.linearRampToValueAtTime(0, t + n.s + n.d);
                osc.connect(gain); gain.connect(ac.destination);
                osc.start(t + n.s); osc.stop(t + n.s + n.d + 0.02);
                gameBgOscs.push(osc);
            });
            bass.forEach(function(n) {
                var osc = ac.createOscillator();
                var gain = ac.createGain();
                osc.type = 'triangle';
                osc.frequency.value = n.f;
                gain.gain.setValueAtTime(0, t + n.s);
                gain.gain.linearRampToValueAtTime(0.06, t + n.s + 0.01);
                gain.gain.linearRampToValueAtTime(0, t + n.s + n.d);
                osc.connect(gain); gain.connect(ac.destination);
                osc.start(t + n.s); osc.stop(t + n.s + n.d + 0.02);
                gameBgOscs.push(osc);
            });

            var loopLen = b * 14.5;
            gameBgTimeout = setTimeout(function() {
                if (running) playGameBgLoop();
            }, loopLen * 1000);
        }

        function stopGameAudio() {
            for (var i = 0; i < gameBgOscs.length; i++) {
                try { gameBgOscs[i].stop(); } catch(e) {}
            }
            gameBgOscs = [];
            if (gameBgTimeout) { clearTimeout(gameBgTimeout); gameBgTimeout = null; }
        }

        var speechText = '';
        var speechStart = 0;
        var speechDuration = 0;

        var canvasSized = false;
        function resizeCanvas() {
            var rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            canvas.width = Math.round(rect.width);
            canvas.height = Math.round(rect.height);
            ground = canvas.height - 40;
            nosacz.y = ground - nosacz.h;
        }

        function startGame() {
            if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
            noNet.classList.add('hidden');
            canvas.classList.remove('hidden');
            scoreEl.classList.remove('hidden');
            var wm = document.getElementById('browserWatermark');
            if (wm) wm.classList.add('hidden');
            if (!canvasSized) { resizeCanvas(); canvasSized = true; }
            score = 0;
            speed = 4;
            obstacles = [];
            onions = [];
            spawnTimer = 0;
            onionTimer = 0;
            nosacz.y = ground - nosacz.h;
            nosacz.vy = 0;
            nosacz.jumping = false;
            running = true;
            gameOver = false;
            scoreEl.textContent = '\uD83E\uDDBD 0';
            initGameAudio();
            stopGameAudio();
            playGameBgLoop();
            loop();
        }

        function endGame() {
            running = false;
            gameOver = true;
            stopGameAudio();
            playDeathSound(gameAc);
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('jan-nosacz-high', String(highScore));
            }
            // Unlock DK in Winamp at 5+ points
            if (score >= 5 && !dkUnlocked) {
                dkUnlocked = true;
                localStorage.setItem('jan-portfolio-dk', 'true');
                unlockWinampDK();
            }
            // Draw game over
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(t('game-over'), canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = '14px Arial';
            ctx.fillText(t('game-score') + ': ' + score + '  |  ' + t('game-highscore') + ': ' + highScore, canvas.width / 2, canvas.height / 2 + 10);
            ctx.fillText(t('game-restart'), canvas.width / 2, canvas.height / 2 + 35);
            if (score >= 5 && localStorage.getItem('jan-portfolio-dk') === 'true') {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('\uD83C\uDFB5 ' + t('game-dk-unlock'), canvas.width / 2, canvas.height / 2 + 60);
            }
        }

        function jump() {
            if (!running && !gameOver) { startGame(); return; }
            if (gameOver) { startGame(); return; }
            if (!nosacz.jumping) {
                nosacz.vy = jumpForce;
                nosacz.jumping = true;
            }
        }

        // Controls
        document.addEventListener('keydown', function(e) {
            var ae = document.activeElement;
            if (e.code === 'Space' && browserWin && !browserWin.classList.contains('hidden') && !(ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable))) {
                e.preventDefault();
                e.stopPropagation();
                jump();
            }
        });
        // Prevent any scroll on the game area
        canvas.parentElement.addEventListener('scroll', function() { this.scrollTop = 0; this.scrollLeft = 0; });
        // Tap on canvas for mobile
        canvas.addEventListener('click', jump);
        canvas.addEventListener('touchstart', function(e) { e.preventDefault(); jump(); }, { passive: false });
        // Also allow clicking noNet screen to start
        noNet.addEventListener('click', jump);

        // Draw nosacz (proboscis monkey - simple cartoon)
        // Preload nosacz head image
        var nosaczImg = new Image();
        nosaczImg.src = '_images/nosacz1.png';
        var nosaczImgReady = false;
        nosaczImg.onload = function() { nosaczImgReady = true; };
        var janNosaczImg = new Image();
        janNosaczImg.src = '_images/janek_icon2.png';
        var janNosaczReady = false;
        janNosaczImg.onload = function() { janNosaczReady = true; };

        function drawNosacz(x, y) {
            var w = nosacz.w;
            var h = nosacz.h;
            // During jankozy — draw Jan's face instead of nosacz
            if (window._janArmageddonActive && janNosaczReady) {
                ctx.save();
                ctx.translate(x + w, y);
                ctx.scale(-1, 1);
                var bob = running ? Math.sin(Date.now() / 100) * 2 : 0;
                ctx.drawImage(janNosaczImg, 0, bob, w, h);
                ctx.restore();
                return;
            }
            if (nosaczImgReady) {
                ctx.save();
                // Flip horizontally (image faces left, we want right)
                ctx.translate(x + w, y);
                ctx.scale(-1, 1);
                // Slight bob animation while running
                var bob = running ? Math.sin(Date.now() / 100) * 2 : 0;
                ctx.drawImage(nosaczImg, 0, bob, w, h);
                ctx.restore();
            } else {
                // Fallback: simple circle
                ctx.fillStyle = '#D2691E';
                ctx.beginPath();
                ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw onion (or kremówka during jankozy)
        var kremowkaImg = new Image();
        kremowkaImg.src = '_images/kremowka.png';
        var kremowkaReady = false;
        kremowkaImg.onload = function() { kremowkaReady = true; };

        function drawOnion(x, y) {
            // During jankozy — draw kremówka instead of onion
            if (window._janArmageddonActive && kremowkaReady) {
                ctx.drawImage(kremowkaImg, x - 2, y - 2, 24, 24);
                return;
            }
            // Bulb
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.arc(x + 10, y + 14, 10, 0, Math.PI * 2);
            ctx.fill();
            // Skin lines
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(x + 10, y + 14, 7, 0, Math.PI * 2);
            ctx.stroke();
            // Root
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 24);
            ctx.lineTo(x + 8, y + 28);
            ctx.moveTo(x + 10, y + 24);
            ctx.lineTo(x + 12, y + 28);
            ctx.stroke();
            // Sprout
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 4);
            ctx.lineTo(x + 8, y - 4);
            ctx.moveTo(x + 10, y + 4);
            ctx.lineTo(x + 13, y - 3);
            ctx.stroke();
        }

        // Draw cactus-like obstacle (rock/firewall)
        function drawObstacle(ob) {
            ctx.fillStyle = '#555';
            ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
            ctx.fillStyle = '#666';
            ctx.fillRect(ob.x + 2, ob.y + 2, ob.w - 4, ob.h - 4);
            // Firewall text
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('FW', ob.x + ob.w / 2, ob.y + ob.h / 2 + 3);
        }

        function loop() {
            if (!running) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Sky
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Stars
            ctx.fillStyle = '#ffffff33';
            for (var s = 0; s < 20; s++) {
                var sx = (s * 137 + 50) % canvas.width;
                var sy = (s * 97 + 20) % (ground - 40);
                ctx.fillRect(sx, sy, 1.5, 1.5);
            }

            // Cloud
            cloudX -= speed * 0.3;
            if (cloudX < -60) cloudX = canvas.width + 40;
            ctx.fillStyle = '#ffffff15';
            ctx.beginPath();
            ctx.arc(cloudX, 50, 18, 0, Math.PI * 2);
            ctx.arc(cloudX + 20, 45, 22, 0, Math.PI * 2);
            ctx.arc(cloudX + 40, 50, 16, 0, Math.PI * 2);
            ctx.fill();

            // Ground
            ctx.fillStyle = '#333';
            ctx.fillRect(0, ground, canvas.width, canvas.height - ground);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, ground);
            ctx.lineTo(canvas.width, ground);
            ctx.stroke();

            // Physics
            nosacz.vy += gravity;
            nosacz.y += nosacz.vy;
            if (nosacz.y >= ground - nosacz.h) {
                nosacz.y = ground - nosacz.h;
                nosacz.vy = 0;
                nosacz.jumping = false;
            }

            // Spawn obstacles
            spawnTimer++;
            if (spawnTimer > 90 + Math.random() * 60) {
                var h = 25 + Math.random() * 25;
                obstacles.push({ x: canvas.width, y: ground - h, w: 20, h: h });
                spawnTimer = 0;
            }

            // Spawn onions
            onionTimer++;
            if (onionTimer > 50 + Math.random() * 80) {
                var oy = ground - 50 - Math.random() * 60;
                onions.push({ x: canvas.width, y: oy, w: 20, h: 28, collected: false });
                onionTimer = 0;
            }

            // Move & draw obstacles
            for (var i = obstacles.length - 1; i >= 0; i--) {
                obstacles[i].x -= speed;
                if (obstacles[i].x + obstacles[i].w < 0) {
                    obstacles.splice(i, 1);
                    continue;
                }
                drawObstacle(obstacles[i]);
                // Collision
                if (nosacz.x + nosacz.w - 8 > obstacles[i].x &&
                    nosacz.x + 8 < obstacles[i].x + obstacles[i].w &&
                    nosacz.y + nosacz.h > obstacles[i].y) {
                    endGame();
                    return;
                }
            }

            // Move & draw onions
            for (var i = onions.length - 1; i >= 0; i--) {
                onions[i].x -= speed;
                if (onions[i].x + onions[i].w < 0) {
                    onions.splice(i, 1);
                    continue;
                }
                if (!onions[i].collected) {
                    drawOnion(onions[i].x, onions[i].y);
                    // Collect
                    if (nosacz.x + nosacz.w - 5 > onions[i].x &&
                        nosacz.x + 5 < onions[i].x + onions[i].w &&
                        nosacz.y < onions[i].y + onions[i].h &&
                        nosacz.y + nosacz.h > onions[i].y) {
                        onions[i].collected = true;
                        score++;
                        scoreEl.textContent = '\uD83E\uDDBD ' + score;
                        playCollectSound(score);
                        if (window._janArmageddonActive) {
                            if (score % 10 === 0) {
                                speechText = 'JAN KOCHA KREMOWKI!!!';
                                speechDuration = 3000;
                            } else {
                                var janSfx = ['jan!', 'kremowka!', 'jan jan!', 'mniam jan!', 'JAAAAN!'];
                                speechText = janSfx[Math.floor(Math.random() * janSfx.length)];
                            }
                        } else if (score % 10 === 0) {
                            speechText = 'Pyyyyszna cebula! Wcale nie czuc\u0301 bieda\u0328!';
                            speechDuration = 3000;
                        } else {
                            var sfx = ['mniam!', 'mlask!', 'nom!', 'mniam mniam!', 'pycha!'];
                            speechText = sfx[Math.floor(Math.random() * sfx.length)];
                            speechDuration = 2000;
                        }
                        speechStart = Date.now();
                    }
                }
            }

            // Draw nosacz
            drawNosacz(nosacz.x, nosacz.y);

            // Big text at top of screen (fatality style)
            var speechElapsed = Date.now() - speechStart;
            if (speechStart > 0 && speechElapsed < speechDuration) {
                ctx.save();
                var progress = speechElapsed / speechDuration;
                // Scale: zoom in then settle (first 200ms)
                var sc = speechElapsed < 80 ? (speechElapsed / 80) * 1.3 : (speechElapsed < 200 ? 1.3 - (speechElapsed - 80) / 120 * 0.3 : 1.0);
                // Fade out last 300ms
                var remaining = speechDuration - speechElapsed;
                var alpha = remaining < 300 ? remaining / 300 : 1;

                var fontSize = speechText.length > 10 ? Math.min(28, canvas.width / 14) : Math.min(38, canvas.width / 9);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.translate(canvas.width / 2, 25);
                ctx.scale(sc, sc);
                ctx.globalAlpha = alpha;

                // Shadow/glow
                ctx.font = 'bold ' + Math.round(fontSize) + 'px Impact, Arial Black, sans-serif';
                ctx.fillStyle = 'rgba(255,80,0,0.25)';
                ctx.fillText(speechText.toUpperCase(), 2, 2);

                // Main text
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.lineWidth = 3;
                ctx.strokeText(speechText.toUpperCase(), 0, 0);
                ctx.fillText(speechText.toUpperCase(), 0, 0);

                ctx.restore();
            }

            // Speed up over time
            if (score > 0 && score % 10 === 0) {
                speed = 4 + Math.floor(score / 10) * 0.5;
                if (speed > 12) speed = 12;
            }

            frameId = requestAnimationFrame(loop);
        }

        // Expose reset for closeWindow
        resetNosaczGame = function() {
            if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
            stopGameAudio();
            if (gameAc) { try { gameAc.close(); } catch(e) {} gameAc = null; }
            running = false;
            gameOver = false;
            canvasSized = false;
            score = 0;
            speed = 4;
            obstacles = [];
            onions = [];
            spawnTimer = 0;
            onionTimer = 0;
            noNet.classList.remove('hidden');
            canvas.classList.add('hidden');
            scoreEl.classList.add('hidden');
            scoreEl.textContent = '\uD83E\uDDBD 0';
            updateBrowserWatermark();
            // Reset loading screen state
            var loadingEl = document.getElementById('browserLoading');
            if (loadingEl) { loadingEl.classList.add('hidden'); }
            browserLoadingShown = false;
        };
    }

    // ===== SESSION LOGGING =====
    const SESSION_LOG_URL = 'https://janjurec-logger.achillesgrek.workers.dev';
    const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    function logSession(type, data) {
        if (!SESSION_LOG_URL) return;
        try {
            navigator.sendBeacon(SESSION_LOG_URL, JSON.stringify({
                session: sessionId,
                type: type,
                data: data,
                timestamp: new Date().toISOString()
            }));
        } catch(e) { /* silent */ }
    }

    // ===== PAINT =====
    function initPaint() {
        const canvas = document.getElementById('paintCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const wrap = canvas.parentElement;

        let painting = false;
        let tool = 'pencil';
        let color = '#000000';
        let size = 3;
        let lastX = 0, lastY = 0;
        let canvasReady = false;
        let clearing = false;
        let sprayInterval = null;

        // Undo stack
        let undoStack = [];
        const MAX_UNDO = 12;
        function saveUndoState() {
            if (canvas.width === 0 || canvas.height === 0) return;
            try { undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); } catch(e) {}
            if (undoStack.length > MAX_UNDO) undoStack.shift();
        }

        // Stamps
        const stampEmojis = ['\u2B50','\uD83C\uDF08','\u2764\uFE0F','\uD83D\uDD25','\uD83D\uDE0E','\uD83C\uDFB5','\uD83E\uDD84','\uD83D\uDC8E','\uD83C\uDF38','\uD83D\uDC7E'];
        let currentStamp = 0;
        const stampPicker = document.getElementById('paintStampPicker');
        if (stampPicker) {
            stampEmojis.forEach(function(emoji, i) {
                var btn = document.createElement('button');
                btn.className = 'paint-stamp-btn' + (i === 0 ? ' active' : '');
                btn.textContent = emoji;
                btn.addEventListener('click', function() {
                    currentStamp = i;
                    stampPicker.querySelectorAll('.paint-stamp-btn').forEach(function(b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    playSound('click');
                });
                stampPicker.appendChild(btn);
            });
        }

        // ===== SOUND SYSTEM (Web Audio) =====
        let paintAc = null;
        function getPaintAc() {
            if (!paintAc || paintAc.state === 'closed') {
                try { paintAc = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
            }
            return paintAc;
        }

        function playSound(type) {
            try {
                var ac = getPaintAc();
                if (!ac) return;
                var t = ac.currentTime;
                var g, osc, osc2, buf, src;

                switch(type) {
                case 'pencil':
                    buf = ac.createBuffer(1, ac.sampleRate * 0.06, ac.sampleRate);
                    var d = buf.getChannelData(0);
                    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
                    src = ac.createBufferSource(); src.buffer = buf;
                    var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = 1.5;
                    g = ac.createGain(); g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                    src.connect(bp); bp.connect(g); g.connect(ac.destination);
                    src.start(t); src.stop(t + 0.06);
                    break;
                case 'spray':
                    buf = ac.createBuffer(1, ac.sampleRate * 0.12, ac.sampleRate);
                    d = buf.getChannelData(0);
                    for (i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.2;
                    src = ac.createBufferSource(); src.buffer = buf;
                    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000;
                    g = ac.createGain(); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    src.connect(hp); hp.connect(g); g.connect(ac.destination);
                    src.start(t); src.stop(t + 0.12);
                    break;
                case 'eraser':
                    osc = ac.createOscillator(); osc.type = 'sine';
                    osc.frequency.setValueAtTime(300, t); osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
                    g = ac.createGain(); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                    osc.connect(g); g.connect(ac.destination); osc.start(t); osc.stop(t + 0.15);
                    break;
                case 'fill':
                    osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, t);
                    osc2 = ac.createOscillator(); osc2.type = 'square'; osc2.frequency.setValueAtTime(90, t);
                    g = ac.createGain(); g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                    osc.connect(g); osc2.connect(g); g.connect(ac.destination);
                    osc.start(t); osc.stop(t + 0.2); osc2.start(t); osc2.stop(t + 0.2);
                    break;
                case 'stamp':
                    osc = ac.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(800, t);
                    osc.frequency.exponentialRampToValueAtTime(400, t + 0.06);
                    g = ac.createGain(); g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                    osc.connect(g); g.connect(ac.destination); osc.start(t); osc.stop(t + 0.06);
                    break;
                case 'click':
                    osc = ac.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, t);
                    g = ac.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
                    osc.connect(g); g.connect(ac.destination); osc.start(t); osc.stop(t + 0.02);
                    break;
                case 'explosion':
                    buf = ac.createBuffer(1, ac.sampleRate * 0.8, ac.sampleRate);
                    d = buf.getChannelData(0);
                    for (i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
                    src = ac.createBufferSource(); src.buffer = buf;
                    osc = ac.createOscillator(); osc.type = 'sine';
                    osc.frequency.setValueAtTime(80, t); osc.frequency.exponentialRampToValueAtTime(20, t + 0.8);
                    g = ac.createGain(); g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
                    var g2 = ac.createGain(); g2.gain.setValueAtTime(0.12, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
                    src.connect(g); osc.connect(g2); g.connect(ac.destination); g2.connect(ac.destination);
                    src.start(t); src.stop(t + 0.8); osc.start(t); osc.stop(t + 0.8);
                    break;
                case 'undo':
                    osc = ac.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(400, t);
                    osc.frequency.setValueAtTime(300, t + 0.08);
                    g = ac.createGain(); g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
                    osc.connect(g); g.connect(ac.destination); osc.start(t); osc.stop(t + 0.16);
                    break;
                }
            } catch(e) {}
        }

        function resizeCanvas() {
            if (wrap.clientWidth === 0 || wrap.clientHeight === 0) return;
            let img = null;
            if (canvasReady && canvas.width > 0 && canvas.height > 0) {
                try { img = ctx.getImageData(0, 0, canvas.width, canvas.height); } catch(e) {}
            }
            canvas.width = wrap.clientWidth;
            canvas.height = wrap.clientHeight;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (img) ctx.putImageData(img, 0, 0);
            canvasReady = true;
        }

        const paintWin = document.getElementById('window-paint');
        const observer = new MutationObserver(() => {
            if (paintWin && !paintWin.classList.contains('hidden')) {
                setTimeout(resizeCanvas, 50);
            }
        });
        if (paintWin) {
            observer.observe(paintWin, { attributes: true, attributeFilter: ['class', 'style'] });
        }
        window.addEventListener('resize', () => {
            if (paintWin && !paintWin.classList.contains('hidden')) resizeCanvas();
        });

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            if (e.touches) {
                return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
            }
            return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
        }

        function getToolSize() {
            if (tool === 'pencil') return Math.max(1, size * 0.5);
            if (tool === 'eraser') return size * 3;
            if (tool === 'spray') return size * 2;
            return size;
        }

        // Spray dots
        function sprayDots(x, y) {
            var radius = getToolSize() * 2;
            var density = Math.max(8, size * 2);
            ctx.fillStyle = color;
            for (var i = 0; i < density; i++) {
                var angle = Math.random() * Math.PI * 2;
                var r = Math.random() * Math.random() * radius;
                ctx.beginPath();
                ctx.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function startPaint(e) {
            if (clearing) return;
            e.stopPropagation();
            const pos = getPos(e);
            lastX = pos.x;
            lastY = pos.y;

            // Stamp: place and done
            if (tool === 'stamp') {
                saveUndoState();
                ctx.font = (size * 4 + 16) + 'px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(stampEmojis[currentStamp], pos.x, pos.y);
                playSound('stamp');
                return;
            }

            // Fill: fill and done
            if (tool === 'fill') {
                saveUndoState();
                floodFill(Math.floor(pos.x), Math.floor(pos.y), color);
                playSound('fill');
                return;
            }

            // Other tools: start painting
            saveUndoState();
            painting = true;

            if (tool === 'spray') {
                sprayDots(pos.x, pos.y);
                playSound('spray');
                sprayInterval = setInterval(function() {
                    sprayDots(lastX, lastY);
                    playSound('spray');
                }, 120);
                return;
            }

            playSound(tool === 'eraser' ? 'eraser' : 'pencil');

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, getToolSize() / 2, 0, Math.PI * 2);
            ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.fill();
        }

        function paint(e) {
            if (!painting) return;
            e.preventDefault();
            const pos = getPos(e);

            if (tool === 'spray') {
                lastX = pos.x;
                lastY = pos.y;
                return;
            }

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = getToolSize();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            lastX = pos.x;
            lastY = pos.y;
        }

        function stopPaint() {
            painting = false;
            if (sprayInterval) { clearInterval(sprayInterval); sprayInterval = null; }
        }

        // Flood fill
        function floodFill(startX, startY, fillColor) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const w = canvas.width, h = canvas.height;
            const idx = (startY * w + startX) * 4;
            const targetR = data[idx], targetG = data[idx+1], targetB = data[idx+2];
            const hex = fillColor.replace('#', '');
            const fillR = parseInt(hex.substr(0,2), 16);
            const fillG = parseInt(hex.substr(2,2), 16);
            const fillB = parseInt(hex.substr(4,2), 16);
            if (targetR === fillR && targetG === fillG && targetB === fillB) return;
            const stack = [[startX, startY]];
            const visited = new Set();
            while (stack.length > 0) {
                const [x, y] = stack.pop();
                if (x < 0 || x >= w || y < 0 || y >= h) continue;
                const key = y * w + x;
                if (visited.has(key)) continue;
                const i = key * 4;
                if (Math.abs(data[i] - targetR) > 10 || Math.abs(data[i+1] - targetG) > 10 || Math.abs(data[i+2] - targetB) > 10) continue;
                visited.add(key);
                data[i] = fillR; data[i+1] = fillG; data[i+2] = fillB; data[i+3] = 255;
                stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // ===== FUN CLEAR (animated) =====
        function funClear() {
            if (clearing) return;
            saveUndoState();
            clearing = true;
            playSound('explosion');
            var statusEl = document.getElementById('paintStatus');
            if (statusEl) statusEl.textContent = 'BOOM!';

            // Bomb: expanding white circle from center
            var cx = canvas.width / 2, cy = canvas.height / 2;
            var maxR = Math.sqrt(cx * cx + cy * cy);
            var r = 0;
            var step = maxR / 20;
            function bombFrame() {
                r += step;
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = r < maxR * 0.3 ? '#ff6600' : (r < maxR * 0.6 ? '#ffcc00' : '#fff');
                ctx.fill();
                ctx.restore();
                if (r < maxR + step) {
                    requestAnimationFrame(bombFrame);
                } else {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    clearing = false;
                    if (statusEl) statusEl.textContent = 'Canvas cleared!';
                }
            }
            // Flash white first
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            requestAnimationFrame(bombFrame);
        }

        // ===== UNDO =====
        function performUndo() {
            if (clearing) return;
            if (undoStack.length === 0) {
                var s = document.getElementById('paintStatus');
                if (s) s.textContent = 'Nothing to undo!';
                return;
            }
            playSound('undo');
            var prevState = undoStack.pop();
            // Show "OH NO!" briefly
            ctx.save();
            ctx.fillStyle = 'rgba(255,0,0,0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold ' + Math.min(60, canvas.width / 5) + 'px Impact, Arial Black, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ff0000';
            ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
            ctx.strokeText('OH NO!', canvas.width / 2, canvas.height / 2);
            ctx.fillText('OH NO!', canvas.width / 2, canvas.height / 2);
            ctx.restore();
            setTimeout(function() {
                ctx.putImageData(prevState, 0, 0);
                var s = document.getElementById('paintStatus');
                if (s) s.textContent = 'Undone!';
            }, 350);
        }

        // Canvas events
        canvas.addEventListener('mousedown', startPaint);
        canvas.addEventListener('mousemove', paint);
        canvas.addEventListener('mouseup', stopPaint);
        canvas.addEventListener('mouseleave', stopPaint);
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startPaint(e); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); paint(e); }, { passive: false });
        canvas.addEventListener('touchend', stopPaint);

        // Ctrl+Z undo
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'z' && paintWin && !paintWin.classList.contains('hidden')) {
                if (paintWin.classList.contains('active') || document.activeElement === canvas) {
                    e.preventDefault();
                    performUndo();
                }
            }
        });

        const fgColorEl = document.getElementById('paintFgColor');
        function updateFgColor() { if (fgColorEl) fgColorEl.style.background = color; }

        // Tool buttons (sidebar)
        document.querySelectorAll('.paint-tool[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                const t = btn.dataset.tool;
                tool = t;
                document.querySelectorAll('.paint-tool').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Show/hide stamp picker
                if (stampPicker) stampPicker.classList.toggle('hidden', t !== 'stamp');
                canvas.style.cursor = t === 'eraser' ? 'cell' : 'crosshair';
                playSound('click');
            });
        });

        // Menu bar
        document.querySelectorAll('.paint-menu-item[data-tool]').forEach(item => {
            item.addEventListener('click', () => {
                const t = item.dataset.tool;
                if (t === 'clear') {
                    funClear();
                } else if (t === 'undo') {
                    performUndo();
                } else if (t === 'save') {
                    savePainting();
                }
            });
        });

        // Color palette
        document.querySelectorAll('.paint-color[data-color]').forEach(swatch => {
            swatch.addEventListener('click', () => {
                color = swatch.dataset.color;
                document.querySelectorAll('.paint-color').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                updateFgColor();
                playSound('click');
            });
        });

        // Custom color picker
        const customPicker = document.getElementById('customColorPicker');
        if (customPicker) {
            customPicker.addEventListener('input', (e) => {
                color = e.target.value;
                document.querySelectorAll('.paint-color').forEach(s => s.classList.remove('active'));
                updateFgColor();
            });
        }

        // Size slider
        const sizeSlider = document.getElementById('paintSize');
        const sizeLabel = document.getElementById('paintSizeLabel');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', () => {
                size = parseInt(sizeSlider.value);
                if (sizeLabel) sizeLabel.textContent = size;
            });
        }

        // Track coords in statusbar
        canvas.addEventListener('mousemove', (e) => {
            const pos = getPos(e);
            const coordsEl = document.getElementById('paintCoords');
            if (coordsEl) coordsEl.textContent = Math.floor(pos.x) + ', ' + Math.floor(pos.y);
        });

        function savePainting() {
            const dataUrl = canvas.toDataURL('image/png');
            const statusEl = document.getElementById('paintStatus');
            logSession('painting', { image: dataUrl.slice(0, 200) + '...[truncated]' });

            // Save as wallpaper option
            try {
                var paintings = JSON.parse(localStorage.getItem('jan-portfolio-paintings') || '[]');
                // Keep max 5 paintings (localStorage size limit)
                if (paintings.length >= 5) paintings.shift();
                paintings.push({ dataUrl: dataUrl, date: Date.now() });
                localStorage.setItem('jan-portfolio-paintings', JSON.stringify(paintings));
                if (statusEl) statusEl.textContent = '\u2705 Saved! Right-click desktop \u2192 Change Wallpaper to use it.';
            } catch(e) {
                // localStorage full - just download
                downloadPainting(dataUrl, statusEl);
            }
        }

        function downloadPainting(dataUrl, statusEl) {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'jan-jurec-paint-' + Date.now() + '.png';
            a.click();
            if (statusEl) statusEl.textContent = 'Downloaded!';
        }
    }

    // ===== NOTEPAD =====
    function initNotepad() {
        var textarea = document.getElementById('notepadText');
        if (!textarea) return;
        var charCount = document.getElementById('notepadCharCount');
        var saveKey = 'jan-portfolio-notepad';
        var debounceTimer = null;

        // Load saved text
        var saved = localStorage.getItem(saveKey);
        if (saved !== null) {
            textarea.value = saved;
            if (charCount) charCount.textContent = 'Characters: ' + saved.length;
        }

        textarea.addEventListener('input', function() {
            // Update character count
            if (charCount) charCount.textContent = 'Characters: ' + textarea.value.length;

            // Debounced save to localStorage
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                localStorage.setItem(saveKey, textarea.value);
            }, 500);
        });
    }

    // ===== BREAKOUT =====
    function initBreakout() {
        var canvas = document.getElementById('breakoutCanvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var W = canvas.width, H = canvas.height;

        // Paddle
        var paddle = { w: 60, h: 10, x: 0, speed: 5 };
        paddle.x = (W - paddle.w) / 2;
        var paddleY = H - 30;

        // Ball
        var ball = { x: W/2, y: paddleY - 8, r: 5, dx: 3, dy: -3 };

        // Bricks
        var BRICK_ROWS = 6, BRICK_COLS = 8;
        var brickW = (W - 20) / BRICK_COLS, brickH = 14, brickPad = 2, brickTop = 30;
        var brickColors = ['#ff4444', '#ff8800', '#ffcc00', '#44ff44', '#4488ff', '#cc44ff'];
        var bricks = [];

        var score = 0, lives = 3, gameRunning = false, gameOver = false;
        var frameId = null;
        var breakoutAc = null;

        function initBricks() {
            bricks = [];
            for (var r = 0; r < BRICK_ROWS; r++) {
                bricks[r] = [];
                for (var c = 0; c < BRICK_COLS; c++) {
                    bricks[r][c] = { alive: true, x: 10 + c * brickW, y: brickTop + r * (brickH + brickPad) };
                }
            }
        }

        function resetBall() {
            ball.x = W / 2;
            ball.y = paddleY - 8;
            ball.dx = (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random());
            ball.dy = -3.5;
        }

        // Mouse control
        canvas.addEventListener('mousemove', function(e) {
            var rect = canvas.getBoundingClientRect();
            paddle.x = e.clientX - rect.left - paddle.w / 2;
            paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
        });

        // Touch control
        canvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
            var rect = canvas.getBoundingClientRect();
            paddle.x = e.touches[0].clientX - rect.left - paddle.w / 2;
            paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
        }, { passive: false });

        function playBounceSound() {
            if (!breakoutAc) return;
            try {
                var osc = breakoutAc.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, breakoutAc.currentTime);
                var g = breakoutAc.createGain();
                g.gain.setValueAtTime(0.06, breakoutAc.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, breakoutAc.currentTime + 0.05);
                osc.connect(g); g.connect(breakoutAc.destination);
                osc.start(); osc.stop(breakoutAc.currentTime + 0.05);
            } catch(e) {}
        }

        function playBrickSound(row) {
            if (!breakoutAc) return;
            try {
                var freq = 300 + (BRICK_ROWS - row) * 100;
                var osc = breakoutAc.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, breakoutAc.currentTime);
                var g = breakoutAc.createGain();
                g.gain.setValueAtTime(0.08, breakoutAc.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, breakoutAc.currentTime + 0.1);
                osc.connect(g); g.connect(breakoutAc.destination);
                osc.start(); osc.stop(breakoutAc.currentTime + 0.1);
            } catch(e) {}
        }

        function update() {
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Wall bounces
            if (ball.x - ball.r < 0 || ball.x + ball.r > W) { ball.dx = -ball.dx; playBounceSound(); }
            if (ball.y - ball.r < 0) { ball.dy = -ball.dy; playBounceSound(); }

            // Paddle bounce
            if (ball.y + ball.r >= paddleY && ball.y + ball.r <= paddleY + paddle.h &&
                ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
                ball.dy = -Math.abs(ball.dy);
                // Angle based on hit position
                var hitPos = (ball.x - paddle.x) / paddle.w - 0.5;
                ball.dx = hitPos * 6;
                playBounceSound();
            }

            // Ball lost
            if (ball.y > H) {
                lives--;
                if (lives <= 0) {
                    gameOver = true;
                    gameRunning = false;
                } else {
                    resetBall();
                }
            }

            // Brick collision
            var allCleared = true;
            for (var r = 0; r < BRICK_ROWS; r++) {
                for (var c = 0; c < BRICK_COLS; c++) {
                    var b = bricks[r][c];
                    if (!b.alive) continue;
                    allCleared = false;
                    if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + brickW &&
                        ball.y + ball.r > b.y && ball.y - ball.r < b.y + brickH) {
                        b.alive = false;
                        ball.dy = -ball.dy;
                        score += (BRICK_ROWS - r) * 10;
                        playBrickSound(r);
                    }
                }
            }

            // Win - all bricks cleared
            if (allCleared) {
                // Unlock Winamp track on first clear
                if (!localStorage.getItem('jan-portfolio-breakout')) {
                    localStorage.setItem('jan-portfolio-breakout', 'true');
                    unlockWinampBreakout();
                }
                initBricks();
                resetBall();
                ball.dx *= 1.1;
                ball.dy *= 1.1;
            }
        }

        function draw() {
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, W, H);

            // Bricks with glow
            for (var r = 0; r < BRICK_ROWS; r++) {
                for (var c = 0; c < BRICK_COLS; c++) {
                    var b = bricks[r][c];
                    if (!b.alive) continue;
                    ctx.shadowColor = brickColors[r];
                    ctx.shadowBlur = 4;
                    ctx.fillStyle = brickColors[r];
                    ctx.fillRect(b.x + 1, b.y + 1, brickW - 2, brickH - 2);
                    // Highlight
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = 'rgba(255,255,255,0.25)';
                    ctx.fillRect(b.x + 2, b.y + 2, brickW - 4, 3);
                }
            }
            ctx.shadowBlur = 0;

            // Paddle with glow
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#0ff';
            ctx.fillRect(paddle.x, paddleY, paddle.w, paddle.h);
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(paddle.x + 2, paddleY + 1, paddle.w - 4, 3);

            // Ball with glow (or Jan's face during jankozy)
            if (window._janArmageddonActive && window._janBallImg && window._janBallImg.complete) {
                ctx.save();
                ctx.drawImage(window._janBallImg, ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);
                ctx.restore();
            } else {
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // HUD
            ctx.fillStyle = '#666';
            ctx.font = '11px Courier New';
            ctx.fillText('Score: ' + score, 10, 16);
            ctx.fillText('Lives: ' + '❤'.repeat(lives), W - 80, 16);

            if (gameOver) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = '#f44';
                ctx.font = 'bold 22px Courier New';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#f44';
                ctx.shadowBlur = 15;
                ctx.fillText('GAME OVER', W/2, H/2 - 10);
                ctx.font = '13px Courier New';
                ctx.fillStyle = '#888';
                ctx.shadowBlur = 0;
                ctx.fillText('Score: ' + score, W/2, H/2 + 15);
                ctx.fillText('Click to restart', W/2, H/2 + 35);
                ctx.textAlign = 'left';
            }
        }

        function loop() {
            if (!gameRunning) return;
            frameId = requestAnimationFrame(loop);
            update();
            draw();
        }

        // ---- Breakout soundtrack ----
        var breakoutMusicNodes = [];
        var breakoutMusicInterval = null;

        function startBreakoutMusic() {
            if (!breakoutAc) return;
            if (window._janArmageddonActive) return;
            try {
                // Master gain for music (lower than SFX)
                var masterGain = breakoutAc.createGain();
                masterGain.gain.value = 0.20;
                masterGain.connect(breakoutAc.destination);

                // Bass drone — deep pulsing pad
                var bass = breakoutAc.createOscillator();
                bass.type = 'sawtooth';
                bass.frequency.value = 55; // A1
                var bassGain = breakoutAc.createGain();
                bassGain.gain.value = 0.5;
                var bassFilter = breakoutAc.createBiquadFilter();
                bassFilter.type = 'lowpass';
                bassFilter.frequency.value = 200;
                bass.connect(bassFilter);
                bassFilter.connect(bassGain);
                bassGain.connect(masterGain);
                bass.start();
                breakoutMusicNodes.push(bass);

                // Bass LFO for pulsing
                var bassLfo = breakoutAc.createOscillator();
                bassLfo.type = 'sine';
                bassLfo.frequency.value = 2;
                var bassLfoGain = breakoutAc.createGain();
                bassLfoGain.gain.value = 0.15;
                bassLfo.connect(bassLfoGain);
                bassLfoGain.connect(bassGain.gain);
                bassLfo.start();
                breakoutMusicNodes.push(bassLfo);

                // Sub bass for warmth
                var sub = breakoutAc.createOscillator();
                sub.type = 'sine';
                sub.frequency.value = 55;
                var subGain = breakoutAc.createGain();
                subGain.gain.value = 0.4;
                sub.connect(subGain);
                subGain.connect(masterGain);
                sub.start();
                breakoutMusicNodes.push(sub);

                // Arpeggiator — cycling through notes
                var arpNotes = [
                    220, 261.63, 329.63, 392, // Am: A C E G
                    220, 293.66, 349.23, 440, // Dm: A D F A
                    196, 246.94, 329.63, 392, // Em: G B E G
                    220, 261.63, 329.63, 392  // Am again
                ];
                var arpIndex = 0;
                var arpOsc = breakoutAc.createOscillator();
                arpOsc.type = 'triangle';
                arpOsc.frequency.value = arpNotes[0];
                var arpGain = breakoutAc.createGain();
                arpGain.gain.value = 0.3;
                var arpFilter = breakoutAc.createBiquadFilter();
                arpFilter.type = 'bandpass';
                arpFilter.frequency.value = 1500;
                arpFilter.Q.value = 2;
                arpOsc.connect(arpFilter);
                arpFilter.connect(arpGain);
                arpGain.connect(masterGain);
                arpOsc.start();
                breakoutMusicNodes.push(arpOsc);

                // Step the arpeggiator
                breakoutMusicInterval = setInterval(function() {
                    if (!breakoutAc || !gameRunning) return;
                    arpIndex = (arpIndex + 1) % arpNotes.length;
                    try {
                        arpOsc.frequency.setTargetAtTime(arpNotes[arpIndex], breakoutAc.currentTime, 0.02);
                        // Subtle envelope per step
                        arpGain.gain.setTargetAtTime(0.35, breakoutAc.currentTime, 0.01);
                        arpGain.gain.setTargetAtTime(0.15, breakoutAc.currentTime + 0.08, 0.05);
                    } catch(e) {}
                }, 180); // ~333 BPM 16th notes, gives driving feel

                // High shimmer pad
                var pad = breakoutAc.createOscillator();
                pad.type = 'sine';
                pad.frequency.value = 660; // E5
                var padGain = breakoutAc.createGain();
                padGain.gain.value = 0.08;
                pad.connect(padGain);
                padGain.connect(masterGain);
                pad.start();
                breakoutMusicNodes.push(pad);

                // Slow detune wobble on pad
                var padLfo = breakoutAc.createOscillator();
                padLfo.type = 'sine';
                padLfo.frequency.value = 0.5;
                var padLfoGain = breakoutAc.createGain();
                padLfoGain.gain.value = 3;
                padLfo.connect(padLfoGain);
                padLfoGain.connect(pad.detune);
                padLfo.start();
                breakoutMusicNodes.push(padLfo);

            } catch(e) {}
        }

        function stopBreakoutMusic() {
            if (breakoutMusicInterval) {
                clearInterval(breakoutMusicInterval);
                breakoutMusicInterval = null;
            }
            for (var i = 0; i < breakoutMusicNodes.length; i++) {
                try { breakoutMusicNodes[i].stop(); } catch(e) {}
            }
            breakoutMusicNodes = [];
        }

        function startGame() {
            // Clean up previous session
            stopBreakoutMusic();
            if (breakoutAc) { try { breakoutAc.close(); } catch(e) {} breakoutAc = null; }
            score = 0; lives = 3; gameOver = false;
            initBricks();
            paddle.x = (W - paddle.w) / 2;
            resetBall();
            gameRunning = true;
            try { breakoutAc = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
            startBreakoutMusic();
            frameId = requestAnimationFrame(loop);
        }

        canvas.addEventListener('click', function() {
            if (!gameRunning) startGame();
        });

        // Stop on window close
        var bWin = document.getElementById('window-breakout');
        if (bWin) {
            var obs = new MutationObserver(function() {
                if (bWin.classList.contains('hidden')) {
                    gameRunning = false;
                    if (frameId) cancelAnimationFrame(frameId);
                    stopBreakoutMusic();
                    if (breakoutAc) { try { breakoutAc.close(); } catch(e) {} breakoutAc = null; }
                }
            });
            obs.observe(bWin, { attributes: true, attributeFilter: ['class'] });
        }

        // Initial screen
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        ctx.fillText('BRICK BREAKER', W/2, H/2 - 20);
        ctx.font = '12px Courier New';
        ctx.fillStyle = '#666';
        ctx.shadowBlur = 0;
        ctx.fillText('Click to start', W/2, H/2 + 10);
        ctx.textAlign = 'left';
    }

    // ===== TETRIS =====
    function initTetris() {
        var canvas = document.getElementById('tetrisCanvas');
        var nextCanvas = document.getElementById('tetrisNext');
        if (!canvas || !nextCanvas) return;
        var ctx = canvas.getContext('2d');
        var nctx = nextCanvas.getContext('2d');
        var COLS = 10, ROWS = 20, CELL = 20;
        canvas.width = COLS * CELL;
        canvas.height = ROWS * CELL;
        nextCanvas.width = 80;
        nextCanvas.height = 80;

        var scoreEl = document.getElementById('tetrisScore');
        var linesEl = document.getElementById('tetrisLines');
        var levelEl = document.getElementById('tetrisLevel');
        var highEl = document.getElementById('tetrisHigh');
        var highScore = parseInt(localStorage.getItem('jan-tetris-high') || '0');
        if (highEl) highEl.textContent = highScore;

        // Colors - neon synthwave palette
        var COLORS = ['#0ff', '#f0f', '#ff0', '#0f0', '#f60', '#00f', '#f00'];
        var GLOW   = ['#066', '#606', '#660', '#060', '#630', '#006', '#600'];
        // Piece shapes (I, T, O, S, Z, J, L)
        var SHAPES = [
            [[1,1,1,1]],
            [[0,1,0],[1,1,1]],
            [[1,1],[1,1]],
            [[0,1,1],[1,1,0]],
            [[1,1,0],[0,1,1]],
            [[1,0,0],[1,1,1]],
            [[0,0,1],[1,1,1]]
        ];

        var board = [];
        var piece = null, nextPiece = null;
        var px, py, pieceType, nextType;
        var score = 0, lines = 0, level = 1;
        var dropInterval = 800, dropTimer = 0, lastTime = 0;
        var gameRunning = false, gamePaused = false, gameOver = false;
        var frameId = null;
        var tetrisAc = null, synthNodes = [], synthLoop = null;

        function newBoard() {
            board = [];
            for (var r = 0; r < ROWS; r++) {
                board[r] = [];
                for (var c = 0; c < COLS; c++) board[r][c] = 0;
            }
        }

        function randomType() { return Math.floor(Math.random() * SHAPES.length); }

        function spawnPiece() {
            pieceType = nextType !== undefined ? nextType : randomType();
            nextType = randomType();
            piece = SHAPES[pieceType].map(function(r) { return r.slice(); });
            px = Math.floor((COLS - piece[0].length) / 2);
            py = 0;
            drawNext();
            if (collides(px, py, piece)) {
                gameOver = true;
                gameRunning = false;
                stopSynth();
                playGameOverSound();
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('jan-tetris-high', '' + highScore);
                    if (highEl) highEl.textContent = highScore;
                }
                // Unlock Winamp track at 1000+ score
                if (score >= 1000 && !localStorage.getItem('jan-portfolio-tetris')) {
                    localStorage.setItem('jan-portfolio-tetris', 'true');
                    unlockWinampTetris();
                }
            }
        }

        function collides(tx, ty, tp) {
            for (var r = 0; r < tp.length; r++) {
                for (var c = 0; c < tp[r].length; c++) {
                    if (!tp[r][c]) continue;
                    var nx = tx + c, ny = ty + r;
                    if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
                    if (ny >= 0 && board[ny][nx]) return true;
                }
            }
            return false;
        }

        function rotate(p) {
            var rows = p.length, cols = p[0].length;
            var rot = [];
            for (var c = 0; c < cols; c++) {
                rot[c] = [];
                for (var r = rows - 1; r >= 0; r--) {
                    rot[c].push(p[r][c]);
                }
            }
            return rot;
        }

        function lock() {
            for (var r = 0; r < piece.length; r++) {
                for (var c = 0; c < piece[r].length; c++) {
                    if (!piece[r][c]) continue;
                    var ny = py + r;
                    if (ny < 0) continue;
                    board[ny][px + c] = pieceType + 1;
                }
            }
            playLockSound();
            clearLines();
            spawnPiece();
        }

        function clearLines() {
            var cleared = 0;
            for (var r = ROWS - 1; r >= 0; r--) {
                var full = true;
                for (var c = 0; c < COLS; c++) { if (!board[r][c]) { full = false; break; } }
                if (full) {
                    board.splice(r, 1);
                    var empty = [];
                    for (var c2 = 0; c2 < COLS; c2++) empty.push(0);
                    board.unshift(empty);
                    cleared++;
                    r++; // recheck same row
                }
            }
            if (cleared > 0) {
                var pts = [0, 100, 300, 500, 800];
                score += (pts[cleared] || 800) * level;
                lines += cleared;
                level = Math.floor(lines / 10) + 1;
                dropInterval = Math.max(80, 800 - (level - 1) * 70);
                if (scoreEl) scoreEl.textContent = score;
                if (linesEl) linesEl.textContent = lines;
                if (levelEl) levelEl.textContent = level;
                playClearSound(cleared);
            }
        }

        function draw() {
            // Background - dark grid
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Grid lines (subtle)
            ctx.strokeStyle = '#1a1a3e';
            ctx.lineWidth = 0.5;
            for (var c = 0; c <= COLS; c++) {
                ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, ROWS * CELL); ctx.stroke();
            }
            for (var r = 0; r <= ROWS; r++) {
                ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(COLS * CELL, r * CELL); ctx.stroke();
            }
            // Board pieces
            for (var r = 0; r < ROWS; r++) {
                for (var c = 0; c < COLS; c++) {
                    if (board[r][c]) {
                        drawCell(ctx, c, r, board[r][c] - 1);
                    }
                }
            }
            // Ghost piece
            if (piece && !gameOver) {
                var gy = py;
                while (!collides(px, gy + 1, piece)) gy++;
                ctx.globalAlpha = 0.2;
                for (var r = 0; r < piece.length; r++) {
                    for (var c = 0; c < piece[r].length; c++) {
                        if (piece[r][c]) drawCell(ctx, px + c, gy + r, pieceType);
                    }
                }
                ctx.globalAlpha = 1;
            }
            // Active piece
            if (piece && !gameOver) {
                for (var r = 0; r < piece.length; r++) {
                    for (var c = 0; c < piece[r].length; c++) {
                        if (piece[r][c]) drawCell(ctx, px + c, py + r, pieceType);
                    }
                }
            }
            // Game over overlay
            if (gameOver) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#f0f';
                ctx.font = 'bold 20px Courier New';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#f0f';
                ctx.shadowBlur = 15;
                ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
                ctx.font = '12px Courier New';
                ctx.fillStyle = '#0ff';
                ctx.shadowColor = '#0ff';
                ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 20);
                ctx.shadowBlur = 0;
                ctx.textAlign = 'left';
            }
            // Paused overlay
            if (gamePaused) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#0ff';
                ctx.font = 'bold 18px Courier New';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#0ff';
                ctx.shadowBlur = 10;
                ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
                ctx.shadowBlur = 0;
                ctx.textAlign = 'left';
            }
        }

        function drawCell(context, x, y, type) {
            var cx = x * CELL, cy = y * CELL;
            // Glow
            context.shadowColor = COLORS[type];
            context.shadowBlur = 6;
            context.fillStyle = COLORS[type];
            context.fillRect(cx + 1, cy + 1, CELL - 2, CELL - 2);
            // Inner highlight
            context.shadowBlur = 0;
            context.fillStyle = 'rgba(255,255,255,0.2)';
            context.fillRect(cx + 2, cy + 2, CELL - 6, 2);
            context.fillRect(cx + 2, cy + 2, 2, CELL - 6);
        }

        function drawNext() {
            nctx.fillStyle = '#050510';
            nctx.fillRect(0, 0, 80, 80);
            var shape = SHAPES[nextType];
            var offX = (80 - shape[0].length * CELL) / 2;
            var offY = (80 - shape.length * CELL) / 2;
            for (var r = 0; r < shape.length; r++) {
                for (var c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        nctx.shadowColor = COLORS[nextType];
                        nctx.shadowBlur = 6;
                        nctx.fillStyle = COLORS[nextType];
                        nctx.fillRect(offX + c * CELL + 1, offY + r * CELL + 1, CELL - 2, CELL - 2);
                        nctx.shadowBlur = 0;
                    }
                }
            }
        }

        function gameLoop(time) {
            if (!gameRunning) return;
            frameId = requestAnimationFrame(gameLoop);
            if (gamePaused) { draw(); return; }
            var dt = time - lastTime;
            lastTime = time;
            dropTimer += dt;
            if (dropTimer > dropInterval) {
                dropTimer = 0;
                if (!collides(px, py + 1, piece)) {
                    py++;
                } else {
                    lock();
                }
            }
            draw();
        }

        function startGame() {
            newBoard();
            score = 0; lines = 0; level = 1;
            dropInterval = 800; dropTimer = 0; gameOver = false; gamePaused = false;
            if (scoreEl) scoreEl.textContent = '0';
            if (linesEl) linesEl.textContent = '0';
            if (levelEl) levelEl.textContent = '1';
            nextType = randomType();
            spawnPiece();
            gameRunning = true;
            lastTime = performance.now();
            startSynth();
            frameId = requestAnimationFrame(gameLoop);
        }

        // Click to start/restart
        canvas.addEventListener('click', function() {
            if (!gameRunning) startGame();
        });

        // Controls
        document.addEventListener('keydown', function(e) {
            var tetrisWin = document.getElementById('window-tetris');
            if (!tetrisWin || tetrisWin.classList.contains('hidden')) return;
            if (!gameRunning || gameOver) return;
            // Don't capture if terminal has focus
            if (document.activeElement && document.activeElement.id === 'terminalInput') return;

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (!gamePaused && !collides(px - 1, py, piece)) px--;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (!gamePaused && !collides(px + 1, py, piece)) px++;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (!gamePaused && !collides(px, py + 1, piece)) { py++; score += 1; if (scoreEl) scoreEl.textContent = score; }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (gamePaused) break;
                    var rotated = rotate(piece);
                    if (!collides(px, py, rotated)) piece = rotated;
                    else if (!collides(px - 1, py, rotated)) { px--; piece = rotated; }
                    else if (!collides(px + 1, py, rotated)) { px++; piece = rotated; }
                    break;
                case ' ':
                    e.preventDefault();
                    if (gamePaused) break;
                    // Hard drop
                    var dropped = 0;
                    while (!collides(px, py + 1, piece)) { py++; dropped++; }
                    score += dropped * 2;
                    if (scoreEl) scoreEl.textContent = score;
                    lock();
                    break;
                case 'p':
                case 'P':
                    gamePaused = !gamePaused;
                    if (gamePaused) stopSynth();
                    else startSynth();
                    break;
            }
        });

        // Stop when window closes
        var tetrisWin = document.getElementById('window-tetris');
        if (tetrisWin) {
            var obs = new MutationObserver(function() {
                if (tetrisWin.classList.contains('hidden')) {
                    gameRunning = false;
                    gamePaused = false;
                    if (frameId) cancelAnimationFrame(frameId);
                    stopSynth();
                }
            });
            obs.observe(tetrisWin, { attributes: true, attributeFilter: ['class'] });
        }

        // Draw initial screen
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 18px Courier New';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        ctx.fillText('TETRIS', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '11px Courier New';
        ctx.fillStyle = '#f0f';
        ctx.shadowColor = '#f0f';
        ctx.fillText('SYNTHWAVE EDITION', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '12px Courier New';
        ctx.fillStyle = '#666';
        ctx.shadowBlur = 0;
        ctx.fillText('Click to start', canvas.width / 2, canvas.height / 2 + 20);
        ctx.textAlign = 'left';

        // === SYNTHWAVE MUSIC ===
        function startSynth() {
            if (tetrisAc) return;
            try {
                tetrisAc = new (window.AudioContext || window.webkitAudioContext)();
                playSynthLoop();
            } catch(e) {}
        }

        function stopSynth() {
            if (synthLoop) { clearTimeout(synthLoop); synthLoop = null; }
            synthNodes.forEach(function(n) { try { n.stop(); } catch(e) {} });
            synthNodes = [];
            if (tetrisAc) { try { tetrisAc.close(); } catch(e) {} tetrisAc = null; }
        }

        function playSynthLoop() {
            if (!tetrisAc || !gameRunning || gamePaused) return;
            var ac = tetrisAc;
            var t = ac.currentTime;
            var bpm = 130 + (level - 1) * 4;
            var beat = 60 / bpm;

            // Korobeiniki-inspired melody (Tetris theme) in minor key
            // A minor pentatonic feel: A3, C4, D4, E4, G4, A4
            var melodyNotes = [
                329.63, 246.94, 261.63, 293.66, // E4 B3 C4 D4
                261.63, 246.94, 220.00, 220.00,  // C4 B3 A3 A3
                261.63, 329.63, 392.00, 349.23,  // C4 E4 G4 F4
                329.63, 261.63, 246.94, 293.66,  // E4 C4 B3 D4
            ];

            var masterGain = ac.createGain();
            masterGain.gain.setValueAtTime(0.10, t);
            masterGain.connect(ac.destination);

            var loopLen = 16 * beat;

            // Melody - clean triangle wave
            for (var m = 0; m < 16; m++) {
                var mt = t + m * beat;
                var mel = ac.createOscillator();
                mel.type = 'triangle';
                mel.frequency.setValueAtTime(melodyNotes[m], mt);
                var mg = ac.createGain();
                mg.gain.setValueAtTime(0.25, mt);
                mg.gain.exponentialRampToValueAtTime(0.03, mt + beat * 0.85);
                mel.connect(mg); mg.connect(masterGain);
                mel.start(mt); mel.stop(mt + beat * 0.9);
                synthNodes.push(mel);
            }

            // Bass - follows root notes, smooth sine
            var bassNotes = [110, 110, 130.81, 123.47, 130.81, 110, 123.47, 110,
                             130.81, 164.81, 196.00, 174.61, 164.81, 130.81, 123.47, 146.83];
            for (var b = 0; b < 16; b++) {
                var bt = t + b * beat;
                var bass = ac.createOscillator();
                bass.type = 'sine';
                bass.frequency.setValueAtTime(bassNotes[b], bt);
                var bg = ac.createGain();
                bg.gain.setValueAtTime(0.2, bt);
                bg.gain.exponentialRampToValueAtTime(0.05, bt + beat * 0.9);
                bass.connect(bg); bg.connect(masterGain);
                bass.start(bt); bass.stop(bt + beat);
                synthNodes.push(bass);
            }

            // Light kick on beats 1, 5, 9, 13
            for (var k = 0; k < 4; k++) {
                var kt = t + k * 4 * beat;
                var kick = ac.createOscillator();
                kick.type = 'sine';
                kick.frequency.setValueAtTime(120, kt);
                kick.frequency.exponentialRampToValueAtTime(30, kt + 0.08);
                var kg = ac.createGain();
                kg.gain.setValueAtTime(0.12, kt);
                kg.gain.exponentialRampToValueAtTime(0.001, kt + 0.1);
                kick.connect(kg); kg.connect(masterGain);
                kick.start(kt); kick.stop(kt + 0.12);
                synthNodes.push(kick);
            }

            // Schedule next loop
            synthLoop = setTimeout(function() {
                synthNodes = [];
                playSynthLoop();
            }, (loopLen - 0.1) * 1000);
        }

        // === SOUND EFFECTS ===
        function playLockSound() {
            if (!tetrisAc) return;
            var osc = tetrisAc.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, tetrisAc.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, tetrisAc.currentTime + 0.05);
            var g = tetrisAc.createGain();
            g.gain.setValueAtTime(0.08, tetrisAc.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, tetrisAc.currentTime + 0.06);
            osc.connect(g); g.connect(tetrisAc.destination);
            osc.start(); osc.stop(tetrisAc.currentTime + 0.06);
        }

        function playClearSound(count) {
            if (!tetrisAc) return;
            var baseFreq = 400;
            for (var i = 0; i < count; i++) {
                (function(idx) {
                    var osc = tetrisAc.createOscillator();
                    osc.type = 'square';
                    var freq = baseFreq + idx * 200;
                    osc.frequency.setValueAtTime(freq, tetrisAc.currentTime + idx * 0.08);
                    var g = tetrisAc.createGain();
                    g.gain.setValueAtTime(0.12, tetrisAc.currentTime + idx * 0.08);
                    g.gain.exponentialRampToValueAtTime(0.001, tetrisAc.currentTime + idx * 0.08 + 0.15);
                    osc.connect(g); g.connect(tetrisAc.destination);
                    osc.start(tetrisAc.currentTime + idx * 0.08);
                    osc.stop(tetrisAc.currentTime + idx * 0.08 + 0.15);
                })(i);
            }
        }

        function playGameOverSound() {
            try {
                var ac = new (window.AudioContext || window.webkitAudioContext)();
                var notes = [440, 415, 392, 370, 349, 330, 311, 294, 277, 261];
                notes.forEach(function(freq, i) {
                    var osc = ac.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.12);
                    var g = ac.createGain();
                    g.gain.setValueAtTime(0.1, ac.currentTime + i * 0.12);
                    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.12 + 0.2);
                    osc.connect(g); g.connect(ac.destination);
                    osc.start(ac.currentTime + i * 0.12);
                    osc.stop(ac.currentTime + i * 0.12 + 0.2);
                });
                setTimeout(function() { ac.close(); }, 2000);
            } catch(e) {}
        }
    }

    // Unlock Tetris track in Winamp
    function unlockWinampTetris() {
        var dk = document.getElementById('winampTetris');
        if (dk) {
            dk.classList.remove('locked');
            dk.innerHTML = '🎮 Neon Grid Runner';
        }
    }

    function unlockWinampBreakout() {
        var el = document.getElementById('winampBreakout');
        if (el) {
            el.classList.remove('locked');
            el.innerHTML = '🧱 Neon Brick Anthem [synthwave]';
        }
    }

    function unlockWinampChocolateRain() {
        var el = document.getElementById('winampChocolateRain');
        if (el) {
            el.classList.remove('locked');
            el.innerHTML = '🍫 Tay Zonday - Chocolate Rain [8bit]';
        }
    }

    function initAfterBoot() {
        initDesktopIcons();
        initWindowControls();
        initDragging();
        initResizing();
        initTaskbar();
        initThemeSwitcher();
        initClock();
        initSkillsTree();
        initTerminal();
        initContextMenu();
        initWallpapers();
        initPaint();
        initNotepad();
        initWinamp();
        initBreakout();
        initTetris();
        initNosaczGame();
        initLanguageSwitcher();
        applyLanguage(currentLang);
        updateBrowserTheme();
        updateBrowserDesktopIcon();

        // Initialize liquid glass for macOS glass effects
        if (window.LiquidGlass) LiquidGlass.init();

        // Reveal desktop now that theme + wallpaper are applied
        var desktopEl = document.getElementById('desktop');
        var taskbarEl = document.getElementById('taskbar');
        if (desktopEl) desktopEl.style.visibility = '';
        if (taskbarEl) taskbarEl.style.visibility = '';

        // Pulse tray buttons on first visit to make OS/language choice visible
        if (!localStorage.getItem('jan-portfolio-theme')) {
            var tray = document.querySelector('.taskbar-tray');
            if (tray) {
                tray.classList.add('tray-attention');
                tray.addEventListener('animationend', function() {
                    tray.classList.remove('tray-attention');
                });
            }
        }

        // Open "About" by default (skip in iframe inception)
        if (window.self === window.top) {
            openWindow('about');
        }

        // Close start menu on outside click
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('startMenu');
            const btn = document.getElementById('startBtn');
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });
    }

    // ===== LANGUAGE =====
    function initLanguageSwitcher() {
        const toggle = document.getElementById('langToggle');
        const dropdown = document.getElementById('langDropdown');

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
            dropdown.classList.add('hidden');
        });

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                currentLang = lang;
                localStorage.setItem('jan-portfolio-lang', lang);
                applyLanguage(lang);
                updateBrowserTheme();
                updateBrowserDesktopIcon();
                dropdown.classList.add('hidden');
            });
        });
        updateActiveLangBtn(currentLang);
    }

    function updateActiveLangBtn(lang) {
        document.querySelectorAll('.lang-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.lang === lang);
        });
        // Update toggle button text
        const toggle = document.getElementById('langToggle');
        const labels = { en: 'EN', pl: 'PL', klingon: 'tlh' };
        if (toggle) toggle.textContent = labels[lang] || lang.toUpperCase();
    }

    function applyLanguage(lang) {
        // Block language switching during jan armageddon (unless called by reverseJanArmageddon)
        if (window._janArmageddonActive) return;
        currentLang = lang;
        updateActiveLangBtn(lang);

        // Update all data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = t(key);
            if (val) {
                if (el.tagName === 'INPUT') {
                    el.placeholder = val;
                } else if (key.startsWith('about-bio')) {
                    el.innerHTML = val;
                } else {
                    el.textContent = val;
                }
            }
        });

        // Update page title based on language
        const titles = {
            en: 'Jan Jurec - Senior DevOps Engineer',
            pl: 'Jan Jurec - Starszy Inżynier DevOps',
            klingon: 'Jan Jurec - DevOps la\' nIvqu\''
        };
        document.title = titles[lang] || titles.en;
    }

    function init() {
        initBootScreen();
    }

    document.addEventListener('DOMContentLoaded', init);
})();

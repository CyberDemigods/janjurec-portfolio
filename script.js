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
    const SINGLETON_WINDOWS = ['terminal', 'paint', 'winamp', 'browser'];
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
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('dblclick', () => {
                openWindow(icon.dataset.window);
            });
            // mobile: single tap opens
            icon.addEventListener('click', () => {
                if (isMobile()) {
                    openWindow(icon.dataset.window);
                }
            });
        });
    }

    // ===== WINDOW MANAGEMENT =====
    function openWindow(name) {
        // Close start menu
        document.getElementById('startMenu').classList.add('hidden');

        // "Lag burst" - after every ~8-15 clicks, queue a few and burst them
        openClickCount++;
        if (!SINGLETON_WINDOWS.includes(name) && openClickCount > 7 && Math.random() < 0.3) {
            lagQueue.push(name);
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

    function closeWindow(name) {
        const win = document.getElementById('window-' + name);
        if (!win) return;

        // Stop Winamp playback when closing
        if (name === 'winamp') {
            stopWinamp();
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
        document.querySelectorAll('.window').forEach(win => {
            win.addEventListener('mousedown', () => bringToFront(win));
        });
    }

    // ===== DRAGGING =====
    function initDragging() {
        let dragTarget = null;
        let offsetX, offsetY;

        document.querySelectorAll('.window-titlebar').forEach(titlebar => {
            titlebar.addEventListener('mousedown', startDrag);
            titlebar.addEventListener('touchstart', startDragTouch, { passive: false });
        });

        function startDrag(e) {
            if (e.target.closest('.win-btn')) return;
            const win = e.target.closest('.window');
            if (win.classList.contains('maximized')) return;
            dragTarget = win;
            const rect = win.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            bringToFront(win);
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        }

        function startDragTouch(e) {
            if (e.target.closest('.win-btn')) return;
            const win = e.target.closest('.window');
            if (win.classList.contains('maximized')) return;
            dragTarget = win;
            const rect = win.getBoundingClientRect();
            const touch = e.touches[0];
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
            bringToFront(win);
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
        }

        function stopDrag() {
            dragTarget = null;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', onDragTouch);
            document.removeEventListener('touchend', stopDrag);
        }
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
                const theme = btn.dataset.theme;
                document.documentElement.setAttribute('data-theme', theme);
                updateActiveThemeBtn(theme);
                localStorage.setItem('jan-portfolio-theme', theme);
                applyWallpaperForTheme(theme);
            });
        });

        // Load saved theme
        const saved = localStorage.getItem('jan-portfolio-theme');
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

        let wallpaper;
        if (savedIndex !== null && wallpapers[parseInt(savedIndex)]) {
            wallpaper = wallpapers[parseInt(savedIndex)];
        } else if (savedIndex === 'jp2' && jp2Unlocked) {
            wallpaper = JP2_WALLPAPER;
        } else {
            // Default: first wallpaper
            wallpaper = wallpapers[0];
        }

        if (wallpaper) {
            desktop.style.background = wallpaper.css;
            desktop.style.backgroundSize = 'cover';
            desktop.style.backgroundPosition = 'center';
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

        // Tab completion
        var knownCommands = [
            'help', 'whoami', 'skills', 'experience', 'contact', 'projects',
            'education', 'neofetch', 'theme', 'matrix', 'clear', 'exit',
            'barka', 'serwerownia', 'achilles', '2137', 'sudo', 'ls', 'dir',
            'pwd', 'date', 'cowsay', 'ping', 'cat readme.md', 'cd .secret'
        ];

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                var partial = input.value.trim().toLowerCase();
                if (!partial) return;
                var matches = knownCommands.filter(function(c) { return c.startsWith(partial); });
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
                const prompt = document.getElementById('terminalPrompt').textContent;
                addLine(prompt + cmd);
                if (cmd) {
                    cmdHistory.unshift(cmd);
                    historyIndex = -1;
                    processCommand(cmd);
                }
                input.value = '';
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

        function processCommand(cmd) {
            const lower = cmd.toLowerCase().trim();
            logSession('terminal', { command: cmd });

            // === EASTER EGG: 2137 ===
            if (lower === '2137') {
                addLine('');
                // W=white(cap/robes), Y=yellow(face/skin), D=dark(features), _=space
                const jp2map = [
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
                const colorMap = { W: '#FFFFFF', Y: '#FFD700', D: '#333333', _: null };
                const blockChar = '█';

                jp2map.forEach(row => {
                    let html = '';
                    for (const c of row) {
                        if (c === '_') {
                            html += ' ';
                        } else {
                            html += `<span style="color:${colorMap[c]}">${blockChar}</span>`;
                        }
                    }
                    addHTML(html, 'ascii-art');
                });

                addLine('');
                addHTML('<span style="color:#FFD700">    Jan Pawel II - Patron polskiego internetu</span>', 'ascii-art');
                addHTML('<span style="color:#FFF">            ⛪ </span><span style="color:#FFD700">2 1 3 7</span><span style="color:#FFF"> ⛪ ODJAZD ⛪</span>', 'ascii-art');
                addLine('');

                // Unlock secret wallpaper!
                if (!jp2Unlocked) {
                    jp2Unlocked = true;
                    localStorage.setItem('jan-portfolio-jp2', 'true');
                    addLine('  ╔══════════════════════════════════════╗', 'success');
                    addLine('  ║  🏆 ACHIEVEMENT UNLOCKED!           ║', 'success');
                    addLine('  ║                                      ║', 'success');
                    addLine('  ║  Secret JP2 wallpaper is now         ║', 'success');
                    addLine('  ║  available in Display Properties!    ║', 'success');
                    addLine('  ║                                      ║', 'success');
                    addLine('  ║  Right-click desktop > Change        ║', 'success');
                    addLine('  ║  Wallpaper to use it.                ║', 'success');
                    addLine('  ╚══════════════════════════════════════╝', 'success');
                    addLine('');
                } else {
                    addLine('  (JP2 wallpaper already unlocked!)', 'info');
                    addLine('');
                }

                // Extra effect: shake the window
                const win = document.getElementById('window-terminal');
                win.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => win.style.animation = '', 500);
                return;
            }

            // === REGULAR COMMANDS ===
            switch (lower) {
                case 'help':
                    addLine('Available commands:', 'info');
                    addLine('  help          - Show this help');
                    addLine('  whoami        - Who is Jan?');
                    addLine('  skills        - List technical skills');
                    addLine('  experience    - Work history');
                    addLine('  contact       - Contact info');
                    addLine('  projects      - GitHub repos');
                    addLine('  education     - Academic background');
                    addLine('  neofetch      - System info');
                    addLine('  theme [name]  - Switch theme (win98/winxp/macos/linux)');
                    addLine('  matrix        - ???');
                    addLine('  clear         - Clear terminal');
                    addLine('  exit          - Close terminal');
                    addLine('');
                    addLine('  ...and maybe some hidden commands ;)', 'info');
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
                    const theme = document.documentElement.getAttribute('data-theme') || 'win98';
                    const osNames = { win98: 'Windows 98', winxp: 'Windows XP', macos: 'macOS Sonoma', linux: 'Ubuntu 24.04 LTS' };
                    addLine('        .--.          jan@portfolio', 'success');
                    addLine('       |o_o |         ─────────────', 'success');
                    addLine('       |:_/ |         OS: ' + (osNames[theme] || theme));
                    addLine('      //   \\ \\        Host: Portfolio v2.1.37');
                    addLine('     (|     | )       Uptime: since 2016');
                    addLine('    /\'\\_   _/`\\       Shell: browser/js');
                    addLine('    \\___)=(___/       Resolution: ' + window.innerWidth + 'x' + window.innerHeight);
                    addLine('                      Theme: ' + theme);
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
                    addLine('=== PASTA O SERWEROWNI WYKOPU ===', 'info');
                    addLine('');
                    addLine('Bichał Miałek kończył nocną wartę w serwerowni wykopu. Za oknem');
                    addLine('zadłużonej willi poznańskie koziołki ocierały się częściami,');
                    addLine('których Miałek wolałby nigdy nie mieć. Przypomniał sobie o żonie,');
                    addLine('którą widywał głównie w niedzielne poranki.');
                    addLine('');
                    addLine('Stękanie ćwiczącego lewicę Rinka dobiegało zza rzędu wykopowych');
                    addLine('monitorów. Miałek automatycznie podłożył ociekające potem dźwięki');
                    addLine('pod obraz żony osadzonej na knadze Rinka.');
                    addLine('');
                    addLine(',,Puk puk".');
                    addLine('Pierwsza myśl - Kifle23. Kurwiszcze, które zrobiłoby wszystko za');
                    addLine('status moderatora w serwisie.');
                    addLine('');
                    addLine('  [... reszta pasty ocenzurowana przez admina ...]', 'info');
                    addLine('  [... ale koziołki zostają! ...]', 'info');
                    addLine('');
                    // Animated Poznań goats butting heads
                    const goatFrames = [
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
                    addLine('  🐐 Poznańskie koziołki 🐐', 'info');
                    const goatContainer = document.createElement('pre');
                    goatContainer.className = 'terminal-line';
                    goatContainer.style.whiteSpace = 'pre';
                    goatContainer.textContent = goatFrames[0].join('\n');
                    output.appendChild(goatContainer);
                    let gFrame = 0;
                    const goatInterval = setInterval(() => {
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

                case 'sudo rm -rf /':
                case 'sudo rm -rf':
                    addLine('Nice try! But this portfolio is indestructible 💪', 'error');
                    break;

                case 'sudo':
                    addLine('jan is not in the sudoers file. This incident will be reported.', 'error');
                    break;

                case 'ls':
                case 'dir':
                    addLine('about.txt    experience.log    skills.cfg    projects/');
                    addLine('education.md contact.vcf       README.md     .secret/');
                    break;

                case 'cat readme.md':
                    addLine('# Jan Jurec - Portfolio', 'info');
                    addLine('Built with pure HTML, CSS & JS. No frameworks harmed.');
                    addLine('Switch OS themes using the tray buttons!');
                    break;

                case 'cd .secret':
                    addLine('Permission denied... or is it? Try some numbers.', 'error');
                    break;

                case 'pwd':
                    addLine('/home/jan/portfolio');
                    break;

                case 'date':
                    addLine(new Date().toString());
                    break;

                case 'ping google.com':
                    addLine('PING google.com: 64 bytes from 142.250.74.206: time=2137ms', 'success');
                    addLine('Interesting ping time, isn\'t it? 🤔');
                    break;

                case 'cowsay':
                case 'cowsay hello':
                    addLine(' ___________');
                    addLine('< hire jan! >');
                    addLine(' -----------');
                    addLine('        \\   ^__^');
                    addLine('         \\  (oo)\\_______');
                    addLine('            (__)\\       )\\/\\');
                    addLine('                ||----w |');
                    addLine('                ||     ||');
                    break;

                default:
                    if (lower.startsWith('theme ')) {
                        const t = lower.split(' ')[1];
                        if (['win98', 'winxp', 'macos', 'linux'].includes(t)) {
                            document.documentElement.setAttribute('data-theme', t);
                            updateActiveThemeBtn(t);
                            localStorage.setItem('jan-portfolio-theme', t);
                            addLine('Theme switched to: ' + t, 'success');
                            updatePrompt(t);
                        } else {
                            addLine('Unknown theme. Available: win98, winxp, macos, linux', 'error');
                        }
                    } else if (lower === 'echo hello world') {
                        addLine('Hello World!');
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
            const prompt = document.getElementById('terminalPrompt');
            const prompts = {
                win98: 'C:\\Users\\Jan>',
                winxp: 'C:\\Users\\Jan>',
                macos: 'jan@portfolio ~ % ',
                linux: 'jan@portfolio:~$ '
            };
            prompt.textContent = prompts[theme] || 'C:\\Users\\Jan>';
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

    // ===== WINAMP PLAYER =====
    let winampAc = null;
    let winampPlaying = false;
    let winampPaused = false;
    let winampCurrentTrack = 'rickroll';
    let winampScheduledOscs = [];
    let winampStartTime = 0;
    let winampDuration = 0;
    let winampAnimFrame = null;

    function unlockWinampBarka() {
        const barkaEl = document.getElementById('winampBarka');
        if (barkaEl) {
            barkaEl.classList.remove('locked');
            barkaEl.textContent = '2. Barka - Pan kiedys\u0301 stan\u0105\u0142 [8bit]';
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

        // Check if barka already unlocked
        if (localStorage.getItem('jan-portfolio-barka') === 'true') {
            unlockWinampBarka();
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
            doStop();
            winampCurrentTrack = trackId;

            // Update playlist highlight
            var tracks = playlistEl.querySelectorAll('.winamp-track');
            for (var j = 0; j < tracks.length; j++) tracks[j].classList.remove('active');
            var trackEl = playlistEl.querySelector('[data-track="' + trackId + '"]');
            if (trackEl) trackEl.classList.add('active');

            winampAc = new (window.AudioContext || window.webkitAudioContext)();
            if (winampAc.state === 'suspended') winampAc.resume();
            winampPlaying = true;
            winampPaused = false;
            playBtn.textContent = '\u25B6';

            var v = getVol();
            if (trackId === 'rickroll') {
                ticker.textContent = 'Rick Astley - Never Gonna Give You Up [8bit]';
                playRickRoll8bit(winampAc, v);
            } else if (trackId === 'barka') {
                ticker.textContent = 'Barka - Pan kiedys\u0301 stan\u0105\u0142 [8bit]';
                playBarka8bit(winampAc, v);
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
            return arr;
        }
    }

    // 8-bit Rick Roll - "Never Gonna Give You Up" melody
    function playRickRoll8bit(ac, vol) {
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
            gain.connect(ac.destination);
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
            gain.connect(ac.destination);
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
            kickGain.connect(ac.destination);
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
                snGain.connect(ac.destination);
                snOsc.start(ac.currentTime + st);
                snOsc.stop(ac.currentTime + st + 0.08);
                winampScheduledOscs.push(snOsc);
            }
        }
    }

    // 8-bit Barka for Winamp
    function playBarka8bit(ac, vol) {
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
            gain.connect(ac.destination);
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
            gain.connect(ac.destination);
            osc.start(ac.currentTime + n.s);
            osc.stop(ac.currentTime + n.s + n.d + 0.02);
            winampScheduledOscs.push(osc);
        });
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
            loop();
        }

        function endGame() {
            running = false;
            gameOver = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('jan-nosacz-high', String(highScore));
            }
            // Draw game over
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = '14px Arial';
            ctx.fillText('Wynik: ' + score + '  |  Rekord: ' + highScore, canvas.width / 2, canvas.height / 2 + 10);
            ctx.fillText('SPACJA aby zagra\u0107 ponownie', canvas.width / 2, canvas.height / 2 + 35);
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
            if (e.code === 'Space' && browserWin && !browserWin.classList.contains('hidden')) {
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
        function drawNosacz(x, y) {
            // Body
            ctx.fillStyle = '#D2691E';
            ctx.beginPath();
            ctx.ellipse(x + 18, y + 25, 14, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            // Belly
            ctx.fillStyle = '#F5DEB3';
            ctx.beginPath();
            ctx.ellipse(x + 18, y + 28, 9, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.fillStyle = '#D2691E';
            ctx.beginPath();
            ctx.arc(x + 18, y + 8, 10, 0, Math.PI * 2);
            ctx.fill();
            // Face
            ctx.fillStyle = '#F5DEB3';
            ctx.beginPath();
            ctx.arc(x + 20, y + 9, 7, 0, Math.PI * 2);
            ctx.fill();
            // Nose (big!)
            ctx.fillStyle = '#CC7744';
            ctx.beginPath();
            ctx.ellipse(x + 26, y + 12, 5, 7, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + 17, y + 6, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // Legs (animated)
            var legOff = running ? Math.sin(Date.now() / 80) * 4 : 0;
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 12, y + 36);
            ctx.lineTo(x + 8, y + 40 + legOff);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 24, y + 36);
            ctx.lineTo(x + 28, y + 40 - legOff);
            ctx.stroke();
        }

        // Draw onion
        function drawOnion(x, y) {
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
                    }
                }
            }

            // Draw nosacz
            drawNosacz(nosacz.x, nosacz.y);

            // Speed up over time
            if (score > 0 && score % 10 === 0) {
                speed = 4 + Math.floor(score / 10) * 0.5;
                if (speed > 12) speed = 12;
            }

            frameId = requestAnimationFrame(loop);
        }
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

        // Resize when window becomes visible or changes size
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
                return {
                    x: (e.touches[0].clientX - rect.left) * scaleX,
                    y: (e.touches[0].clientY - rect.top) * scaleY
                };
            }
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }

        function startPaint(e) {
            e.stopPropagation();
            painting = true;
            const pos = getPos(e);
            lastX = pos.x;
            lastY = pos.y;

            if (tool === 'fill') {
                floodFill(Math.floor(pos.x), Math.floor(pos.y), color);
                painting = false;
                return;
            }

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, getToolSize() / 2, 0, Math.PI * 2);
            ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.fill();
        }

        function paint(e) {
            if (!painting) return;
            e.preventDefault();
            const pos = getPos(e);

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
        }

        function getToolSize() {
            if (tool === 'pencil') return Math.max(1, size * 0.5);
            if (tool === 'eraser') return size * 3;
            return size;
        }

        // Flood fill
        function floodFill(startX, startY, fillColor) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const w = canvas.width;
            const h = canvas.height;

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
                data[i] = fillR;
                data[i+1] = fillG;
                data[i+2] = fillB;
                data[i+3] = 255;

                stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
            }

            ctx.putImageData(imageData, 0, 0);
        }

        // Canvas events
        canvas.addEventListener('mousedown', startPaint);
        canvas.addEventListener('mousemove', paint);
        canvas.addEventListener('mouseup', stopPaint);
        canvas.addEventListener('mouseleave', stopPaint);
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startPaint(e); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); paint(e); }, { passive: false });
        canvas.addEventListener('touchend', stopPaint);

        const fgColorEl = document.getElementById('paintFgColor');

        function updateFgColor() {
            if (fgColorEl) fgColorEl.style.background = color;
        }

        // Tool buttons (sidebar)
        document.querySelectorAll('.paint-tool[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                const t = btn.dataset.tool;
                tool = t;
                document.querySelectorAll('.paint-tool').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                canvas.style.cursor = t === 'eraser' ? 'cell' : t === 'fill' ? 'crosshair' : 'crosshair';
            });
        });

        // Menu bar (File: Save, Edit: Clear)
        document.querySelectorAll('.paint-menu-item[data-tool]').forEach(item => {
            item.addEventListener('click', () => {
                const t = item.dataset.tool;
                if (t === 'clear') {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    document.getElementById('paintStatus').textContent = 'Canvas cleared';
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
            const dataUrl = canvas.toDataURL('image/png', 0.8);
            const statusEl = document.getElementById('paintStatus');

            // Log to session
            logSession('painting', { image: dataUrl.slice(0, 200) + '...[truncated]' });

            // Try to save to backend
            if (SESSION_LOG_URL) {
                fetch(SESSION_LOG_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session: sessionId,
                        type: 'painting_save',
                        image: dataUrl,
                        timestamp: new Date().toISOString()
                    })
                }).then(r => {
                    if (r.ok) {
                        if (statusEl) statusEl.textContent = 'Saved to gallery!';
                    } else {
                        downloadPainting(dataUrl, statusEl);
                    }
                }).catch(() => {
                    downloadPainting(dataUrl, statusEl);
                });
            } else {
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

    function initAfterBoot() {
        initDesktopIcons();
        initWindowControls();
        initDragging();
        initTaskbar();
        initThemeSwitcher();
        initClock();
        initSkillsTree();
        initTerminal();
        initContextMenu();
        initWallpapers();
        initPaint();
        initWinamp();
        initNosaczGame();
        initLanguageSwitcher();
        applyLanguage(currentLang);

        // Open "About" by default
        openWindow('about');

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
        const labels = { en: 'EN', pl: 'PL', klingon: 'tlh', hebrew: 'עבר' };
        if (toggle) toggle.textContent = labels[lang] || lang.toUpperCase();
    }

    function applyLanguage(lang) {
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

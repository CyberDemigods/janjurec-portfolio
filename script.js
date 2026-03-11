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

    // init is defined at the bottom of the file

    // ===== DESKTOP ICONS =====
    function initDesktopIcons() {
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('dblclick', () => {
                openWindow(icon.dataset.window);
            });
            // mobile single tap
            let tapCount = 0;
            icon.addEventListener('click', () => {
                tapCount++;
                if (tapCount === 1) {
                    setTimeout(() => {
                        if (tapCount >= 2) openWindow(icon.dataset.window);
                        tapCount = 0;
                    }, 300);
                }
            });
        });
    }

    // ===== WINDOW MANAGEMENT =====
    function openWindow(name) {
        const win = document.getElementById('window-' + name);
        if (!win) return;
        win.classList.remove('hidden');
        bringToFront(win);
        updateTaskbarButtons();

        // Close start menu
        document.getElementById('startMenu').classList.add('hidden');
    }

    function closeWindow(name) {
        const win = document.getElementById('window-' + name);
        if (!win) return;
        win.classList.add('hidden');
        win.classList.remove('maximized');
        if (windowStates[name]) {
            delete windowStates[name];
        }
        updateTaskbarButtons();
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

        document.querySelectorAll('.window').forEach(win => {
            const name = win.id.replace('window-', '');
            const title = win.querySelector('.window-title span:last-child');
            if (!title) return;

            const isOpen = !win.classList.contains('hidden');
            // Always show in taskbar if not hidden, or was minimized
            const btn = document.createElement('button');
            btn.className = 'taskbar-window-btn' + (isOpen && win.classList.contains('active') ? ' active' : '');
            btn.textContent = title.textContent;
            btn.style.display = isOpen || windowStates[name] ? '' : 'none';

            if (!isOpen) {
                // minimized
                btn.style.display = '';
                btn.classList.remove('active');
            }

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

            if (isOpen || !win.classList.contains('hidden') || btn.style.display !== 'none') {
                container.appendChild(btn);
            }
        });

        // Simpler approach: show buttons for all non-hidden windows
        container.innerHTML = '';
        document.querySelectorAll('.window:not(.hidden)').forEach(win => {
            const name = win.id.replace('window-', '');
            const title = win.querySelector('.window-title span:last-child');
            if (!title) return;

            const btn = document.createElement('button');
            btn.className = 'taskbar-window-btn' + (win.classList.contains('active') ? ' active' : '');
            btn.textContent = title.textContent;
            btn.addEventListener('click', () => {
                if (win.classList.contains('active')) {
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

        input.addEventListener('keydown', (e) => {
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
                    break;

                case 'serwerownia':
                    addLine('=== PASTA O SERWEROWNI WYKOPU ===', 'info');
                    addLine('');
                    addLine('Michał Białek kończył nocną wartę w serwerowni wykopu. Za oknem');
                    addLine('zadłużonej willi poznańskie koziołki ocierały się częściami,');
                    addLine('których Białek wolałby nigdy nie mieć. Przypomniał sobie o żonie,');
                    addLine('którą widywał głównie w niedzielne poranki.');
                    addLine('');
                    addLine('Stękanie ćwiczącego lewicę Kinera dobiegało zza rzędu wykopowych');
                    addLine('monitorów. Białek automatycznie podłożył ociekające potem dźwięki');
                    addLine('pod obraz żony osadzonej na knadze Kinera. Intuicja podpowiadała');
                    addLine('mu, że lekko otyły kolega z pracy przebiera palcami po najkrótszej');
                    addLine('części ciała oglądając zdjęcia białkowej połowicy na fejsbuku.');
                    addLine('Nie mylił się. Czuł jednak dziwaczną dumę połączoną z rozbawieniem,');
                    addLine('które przyniosła mu owa wizja.');
                    addLine('');
                    addLine(',,Puk puk".');
                    addLine('Pierwsza myśl - Elfik32. Kurwiszcze, które zrobiłoby wszystko za');
                    addLine('status moderatora w serwisie.');
                    addLine('');
                    addLine('Białek poczuł się ważny. Myśl o zdradzie żony przerodziła się');
                    addLine('w pewność, że w tę sobotnią noc powstaje dziecko, na które po');
                    addLine('badaniach DNA nie musiałby wyłożyć ani grosza. Zatliła się w jego');
                    addLine('biednym umyśle żądza zemsty. Ocknąwszy się wstał i nonszalancko');
                    addLine('otworzył drzwi.');
                    addLine('');
                    addLine('Elfik32. Czarna owca rodu Steckich stała w progu oparta o framugę');
                    addLine('ze swoim kurewskim uśmieszkiem woźnej. Baletki, krótka spódniczka');
                    addLine('i motzno zarysowany dekolt jaśniały kontrastującą z nocnym');
                    addLine('krajobrazem bielą. - wstawiona jak zwykle - pomyślał Białek.');
                    addLine('');
                    addLine('Elfik położyła palec na ustach. Białek domyślił się, że');
                    addLine('odseparowany od świata zewnętrznego Kiner nie usłyszał pukania');
                    addLine('aktywnej wykopowiczki, która właśnie przyniosła im kanapki.');
                    addLine('Spod granicy niemieckiej.');
                    addLine('');
                    addLine('Elfik sprawnie zzuła obuwie i figlarnie mrugając ruszyła w stronę');
                    addLine('Kinera. Białek podążał wzrokiem za opalonymi stópkami zmierzającymi');
                    addLine('w stronę McKinera, nie mogąc powstrzymać wewnętrznego rozbawienia.');
                    addLine('Za chwilę miał wyjść na jaw fakt, którego nikt z pracowników');
                    addLine('wykopu osobiście nie widział, choć był świadom jego istnienia.');
                    addLine('Fakt, który miał zburzyć spokój Kinera na zawsze.');
                    addLine('');
                    addLine('Elfik wczołgała się pod biurko i sprawnie wyskoczyła po drugiej');
                    addLine('stronie. Kiner wybałuszył oczy i odskoczył w tył z naprężonym');
                    addLine('kutasem w ręku. - Ale...');
                    addLine('');
                    addLine('Spojrzenia Białka i Kinera spotkały się. Kiner był zażenowany całą');
                    addLine('sytuacją, o czym świadczył wyraźny rumieniec na jego aryjskiej');
                    addLine('twarzy.');
                    addLine('');
                    addLine('Śmiech Elfika rozniósł się po pomieszczeniu.');
                    addLine('- Mała pała jak na administratora. - powiedziała Elfik, ledwie');
                    addLine('powstrzymując śmiech. Kiner spąsowiał bardziej. Ręce machinalnie');
                    addLine('powędrowały w stronę rozporka, gdy podchmielona Elfik rzuciła się');
                    addLine('w tę samą stronę.');
                    addLine('- Zostaw. - powiedziała stanowczo.');
                    addLine('');
                    addLine('Zaskoczony Kiner wypuścił pytonga z ręki. Dziesięciocentymetrowy');
                    addLine('organ bezwładnie opadł lekko kołysząc się na boki, gdy Elfik');
                    addLine('doskoczyła do sparaliżowanego grubaska niczym wygłodniała kura');
                    addLine('i stanowczym ruchem opuściła nieco za duże spodnie. Od czasu');
                    addLine('nieudanego eksperymentu z rurkami Kiner powrócił bowiem do starych');
                    addLine('nawyków, co ułatwiło wykopowiczce zadanie.');
                    addLine('');
                    addLine('- Jesteś pijana. - wystękał, gdy Elfik chwyciła go za lekko');
                    addLine('przywiędniętą pałę i chichocząc zaczęła prowadzić w stronę Białka,');
                    addLine('który obserwował sytuację z zaciekawieniem. Programista nie');
                    addLine('protestował jednak zbyt zaciekle. Był to pierwszy raz, kiedy');
                    addLine('kobieca ręka spoczęła na jego wypustce. Było to niewątpliwie');
                    addLine('ciekawe doznanie, gdyż sam Kiner zdawał się zapomnieć o dziwnych');
                    addLine('okolicznościach, w jakich doszło do tego przełomowego momentu.');
                    addLine('');
                    addLine('Białek nie mógł już powstrzymać rozbawienia, obserwując');
                    addLine('zesztywniałego Kinera kroczącego za dzierżącą jego orzeszek');
                    addLine('Elfikiem. Wybuchnął serdecznym śmiechem, mimowolnie puszczając');
                    addLine('krótkiego bąka o dosyć wysokiej tonacji.');
                    addLine('');
                    addLine('- Przepraszam, - rzekł Białek przez łzy - ale nie bardzo rozumiem');
                    addLine('sytuację.');
                    addLine('');
                    addLine('Elfik puściła kinerowe przyrodzenie i kołysząc biodrami powoli');
                    addLine('podeszła do administratora o podkrążonych od pracoholizmu oczach,');
                    addLine('zalotnie kręcąc loczek wydłubany spod natapirowanej burzy blond');
                    addLine('włosów.');
                    addLine('');
                    addLine('- Nie planowałam tego. Zawsze byłam spontaniczna. - wyszeptała');
                    addLine('prowokacyjnie, gmerając już teraz palcami w okolicy guzików');
                    addLine('różowej koszuli Białka.');
                    addLine('');
                    addLine('Kiner zastygł jak posąg w centrum serwerowni. Nie zdawał sobie');
                    addLine('sprawy, jak komicznie wyglądał z opuszczonymi do kostek spodniami');
                    addLine('kupionymi przez mamę w second-handzie, z włosami łonowymi');
                    addLine('w nieładzie i zaczerwienioną od uścisku knagą smętnie zwisającą');
                    addLine('między otłuszczonymi udami. Poczuł ukłucie zazdrości widząc');
                    addLine('pierwszą kobietę, której pozwolił się dotknąć, z zapałem liżącą');
                    addLine('opalony tors Białka. To on powinien być na jej miejscu.');
                    addLine('');
                    addLine('Białek zamknął oczy, czując wilgotne pociągnięcia elfikowego');
                    addLine('języka po swojej klacie. Nie była to zdrada, był to gwałt. Stąd');
                    addLine('też, domyślając się dalszego przebiegu sytuacji, nie miał żadnych');
                    addLine('wyrzutów sumienia. Aby jednak im zapobiec, wyobraził sobie że');
                    addLine('jego żona jest właśnie posuwana przez murzyna. ,,Co za kurwa"');
                    addLine('- pomyślał. Czuł się całkowicie oczyszczony z zarzutów.');
                    addLine('');
                    addLine('Elfik przeszła do lizania twarzy, by w końcu zbliżyć się do ucha');
                    addLine('Białka.');
                    addLine('- Wiesz, do czego tasował twój kolega? - szeptnęła, po kurewsku');
                    addLine('przenosząc wzrok na jego twarz. - Do zdjęć twoich przeróbek');
                    addLine('zrobionych przez...');
                    addLine('- Nie kończ. - przerwał jej Białek. Nie chciał by słowo codziennie');
                    addLine('odmieniane przez przypadki w miejscu jego pracy ostudziło');
                    addLine('podniecenie. Na moment jednak otrzeźwiał i odepchnął rozpaloną');
                    addLine('Stecką od siebie.');
                    addLine('');
                    addLine('- Czego tak właściwie chcesz, hm? - zapytał, badawczo spoglądając');
                    addLine('na Elfika. Nie doczekał jednak odpowiedzi, gdyż Kiner');
                    addLine('niespodziewanie zwinnie, biorąc pod uwagę jego warunki fizyczne,');
                    addLine('chwycił drukarkę Samsunga i ogłuszył Elfika celnym uderzeniem');
                    addLine('w tył głowy. Elfik bezwładnie osunęła się na ziemię, potwierdzając');
                    addLine('swoją renomę kobiety upadłej. W sekundę później Kiner stanął');
                    addLine('z roznegliżowanym Białkiem twarzą w twarz, oko w oko.');
                    addLine('Ich chuje również były całkiem blisko. Zszokowany Białek nie');
                    addLine('rozpoznawał nieśmiałego dotąd kolegi. Coś w nim zdecydowanie');
                    addLine('pękło, a w spojrzeniu programisty była niewidoczna dotąd');
                    addLine('determinacja.');
                    addLine('');
                    addLine('- Zerżnij mnie. - wycedził Kiner. - Zerżnij mnie motzno w odbyt.');
                    addLine('- powtórzył. Powieka nawet nie drgnęła podczas wypowiadania tych');
                    addLine('słów.');
                    addLine('');
                    addLine('Białek w swoim zaskoczeniu wydał niezidentyfikowany dźwięk, lecz');
                    addLine('Kiner natychmiast położył mu palec na ustach.');
                    addLine('- Nikt się nie dowie. Ta kurwa Elfik i tak ci już powiedziała.');
                    addLine('Nie mam nic do stracenia. - powiedział. Nie czekając na reakcję');
                    addLine('Białka, przeszedł od słów do czynów.');
                    addLine('');
                    addLine('Świat Białka wywrócił się do góry nogami, starał się jednak');
                    addLine('chłodno kalkulować, jak wiele nieoczekiwana przygoda gejowska');
                    addLine('mogła zmienić w imidżu samca alfa, na który tak ciężko pracował.');
                    addLine('A Kiner nie żartował. Był silniejszy od niego, co potwierdził');
                    addLine('brutalnie atakując Elfika kilkanaście sekund wcześniej. Setki');
                    addLine('podobnych myśli przelatywały mu przez głowę, gdy rudawy');
                    addLine('programista delikatnie rozchylił mu wargi, by włożyć mięciutki');
                    addLine('palec do ust i wymusić odruch ssania.');
                    addLine('');
                    addLine('Patrząc odważnie w oczy Białka, Kiner zrobił kilka kroków w tył');
                    addLine('i zdjął t-shirt jednym pewnym ruchem. Biała delikatna skóra');
                    addLine('i puchate sutki Kinera były dziwacznie atrakcyjne, choć jeszcze');
                    addLine('kilka minut wcześniej podobna myśl nie miała szans pojawić się');
                    addLine('w umyśle Białka.');
                    addLine('');
                    addLine('- Maciek, ty tak na serio? Oddasz mi się? - zapytał');
                    addLine('z niedowierzaniem. Kiner skinął głową i oswobodził się ze spodni,');
                    addLine('które aż do tej chwili pętały mu kostki. Odwrócił się i ułożył');
                    addLine('w pozycji tylnej, która byłaby dla większości mężczyzn');
                    addLine('upokarzająca. Ciasna dziurka programisty zachęcająco przezierała');
                    addLine('przez gąszcz delikatnych włosków, aż prosząc się o rozepchanie.');
                    addLine('Penis Białka zareagował na ten widok od razu, ciekawie wynurzając');
                    addLine('się z rozpiętych jeszcze przez Elfika spodni. - Raz się żyje');
                    addLine('- pomyślał Białek. Wyruchanie kolegi z pracy mogło się okazać');
                    addLine('bardziej męskie, niż przypuszczał. To on miał przecież być stroną');
                    addLine('dominującą.');
                    addLine('');
                    addLine('Białek pozbył się resztek odzienia i pewnym krokiem podszedł do');
                    addLine('wypiętego Kinera. Postanowił zaatakować znienacka. Napluł na rękę');
                    addLine('i jednym ruchem wbił naprężonego kutasa w miękki odbyt');
                    addLine('programisty. Sięgnął ręką do podbrzusza, by przekonać się, że');
                    addLine('i chuj Kinera był tak nabrzmiały, jakby miał eksplodować. Dodało');
                    addLine('mu to siły i pewności siebie. Poczuł się atrakcyjny.');
                    addLine('');
                    addLine('Pierwsze ruchy były jeszcze dość powolne, lecz Kiner starał się');
                    addLine('przyjąć jak najwięcej pomimo słabego nawilżenia. Kolejne');
                    addLine('centymetry napiętej pały Białka znikały w czeluściach jego');
                    addLine('odbytu, a zwierzęce sapanie Kinera tylko podniecało właściciela');
                    addLine('dość dużej jak na polskie warunki kutangi. Białek złapał Kinera');
                    addLine('za biodra i przyciągnął do siebie. - Chciałeś rżnięcia? To masz.');
                    addLine('- wycedził i zaczął miarowo, całym ciężarem napierać na puszyste');
                    addLine('ciałko kolegi. - Pierdol mnie, Michał! - krzyknął resztkami sił');
                    addLine('Kiner, uginając się do samej podłogi, a odgłosy największego');
                    addLine('rżnięcia w historii firmy ocuciły omdlałego Elfika, leżącego');
                    addLine('od dwa metry dalej.');
                    addLine('');
                    addLine('Elfik wstała i zataczając się podeszła do sapiącego Białka.');
                    addLine('- Hej, chłopakii... - z ust dziewczyny wychodził pijacki bełkot,');
                    addLine('który trudno było rozszyfrować. - mogę się przyłączyć?');
                    addLine('- Wypierdalaj stąd! - wrzasnął Białek i odtrącił rękę Elfika,');
                    addLine('która zaczęła mierzwić jego włosy.');
                    addLine('');
                    addLine('Elfik prychnęła i odeszła na kilka kroków. Udawała obrażoną, choć');
                    addLine('ciekawie zerkała na Białka, który bez opamiętania pierdolił');
                    addLine('Kinera jak maszyna. Sam Kiner odwrócił się w jej stronę i złośliwie');
                    addLine('wystawił język na wierzch. Wygrał tę partię.');
                    addLine('');
                    addLine('Poszukiwania piersiówki w torebce w panterkę okazały się owocne.');
                    addLine('Elfik pociągnęła resztkę bimbru dla kurażu i postanowiła nie');
                    addLine('rezygnować z szansy zostania moderatorką swojego ulubionego');
                    addLine('serwisu. Stanęła na wysokości oczu Białka i ostentacyjnie');
                    addLine('rozpoczęła striptiz. Na pierwszy ogień poszła spódniczka. Dopiero');
                    addLine('w tym świetle znać było ślady spermy i wymiocin, które pokrywały');
                    addLine('jasny materiał. Elfik zaplątała się w bluzkę, lecz niezrażona tym');
                    addLine('faktem wciąż starała się wyglądać seksi. Będąc już w samej');
                    addLine('bieliźnie odwróciła się i wypięła prosto przed twarzą Kinera,');
                    addLine('który niewiele myśląc splunął prosto na naddarty materiał');
                    addLine('elfikowych majtek. Elfik wybuchnęła śmiechem. Po zdjęciu stanika');
                    addLine('ułożyła się na podłodze i uchyliła majtki, pokazując nieco');
                    addLine('zarośniętą cipkę o wyraźnie zarysowanych wargach. - Nudzi mi się.');
                    addLine('- powiedziała. - Długo jeszcze będziecie się pierdolić?. Białek');
                    addLine('jednak nie odpowiedział, zbyt zaaferowany stanem');
                    addLine('przedorgazmicznym, który sobie zafundował.');
                    addLine('');
                    addLine('Największa kurewna wykopu postanowiła zabawić się sama. Sięgnęła');
                    addLine('ręką po trzonek od łopaty, która była maskotką serwisu i zaczęła');
                    addLine('nim jeździć po wargach sromowych. Śluz gęsto skapywał na podłogę,');
                    addLine('a Elfik pociągała się za sutki, wijąc się jak piskorz po tanich');
                    addLine('panelach. Trzonek wszedł w luźną jamę Elfika jak w masło.');
                    addLine('Prawdopodobnie nie czuła niczego, a choć starała się zwrócić na');
                    addLine('siebie uwagę przez jęki i udawane podniecenie, Białek i Kiner');
                    addLine('byli zajęci sobą. Spojeni w jedność dochodzili właśnie razem,');
                    addLine('o czym obwieścił światu pierwotny ryk rudego programisty.');
                    addLine('Zmęczony m__b od razu wyszedł z Kinera, racząc się widokiem');
                    addLine('ciepłego jeszcze ciasteczka z kremem. Na pożegnanie przytulił się');
                    addLine('do mięciutkiego tyłeczka kolegi, który dostarczył mu wiele');
                    addLine('satysfakcji. I - jak podpowiadała mu intuicja - miał dostarczyć');
                    addLine('jeszcze nieraz. Kutas Białka pokryty był lekko kałem, lecz Kiner');
                    addLine('sprawnie sobie z tym poradził, naprędce zlizując brązową maź');
                    addLine('z mięknącego już chuja administratora wykopu. - Byłeś zajebisty,');
                    addLine('nikt mnie jeszcze tak nie jebał. - powtarzał zmęczonym głosem');
                    addLine('Kiner. - Zdejmij skarpetki, chcę ci podziękować jeszcze bardziej.');
                    addLine('');
                    addLine('Zdziwiony Białek zsunął białe stopki z nóg, po czym Kiner rzucił');
                    addLine('się do ssania dużego palca. Znudzona Elfik naprędce znalazła się');
                    addLine('obok niego, próbując zmieścić w ustach jeszcze więcej palców, by');
                    addLine('zyskać sobie przychylność Białka. Ten zaś był w siódmym niebie.');
                    addLine('Nie spieszyło mu się już do domu tak, jak kilka godzin wcześniej.');
                    addLine('Kiner wykorzystał rozmarzenie kolegi, by na koniec usiąść mu na');
                    addLine('twarzy i zmusić go do ssania swoich kulek. W oczach Białka');
                    addLine('pojawiły się pierwsze ślady przywiązania, co bardzo Maćka');
                    addLine('wzruszyło. Nie zepsuło tej chwili nawet faux-pas Elfika, która');
                    addLine('odepchnięta zapachem stóp Białka zwymiotowała na jego nogi.');
                    addLine('');
                    addLine('Życie w serwisie już nigdy nie miało być takie samo.');
                    addLine('');
                    addLine('                              ~ fin ~', 'info');
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
            let matrixCount = 0;
            const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ01234567890ABCDEF';
            const interval = setInterval(() => {
                let line = '';
                for (let i = 0; i < 60; i++) {
                    line += chars[Math.floor(Math.random() * chars.length)];
                }
                addLine(line, 'success');
                scrollTerminal();
                matrixCount++;
                if (matrixCount > 20) {
                    clearInterval(interval);
                    addLine('');
                    addLine('Wake up, Jan...', 'info');
                    addLine('The Matrix has you...', 'info');
                    addLine('Follow the white rabbit. 🐇', 'info');
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
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                currentLang = lang;
                localStorage.setItem('jan-portfolio-lang', lang);
                applyLanguage(lang);
            });
        });
        updateActiveLangBtn(currentLang);
    }

    function updateActiveLangBtn(lang) {
        document.querySelectorAll('.lang-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.lang === lang);
        });
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

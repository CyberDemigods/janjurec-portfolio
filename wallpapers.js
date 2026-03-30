/* ===========================
   WALLPAPER DEFINITIONS
   Each theme has its own set of wallpapers.
   The secret JP2 wallpaper is unlocked by typing 2137 in terminal.
   =========================== */

const WALLPAPERS = {
    win98: [
        {
            name: '(None)',
            css: '#008080'
        },
        {
            name: 'Clouds',
            css: `#008080 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Cdefs%3E%3CradialGradient id='c1' cx='20%25' cy='40%25' r='30%25'%3E%3Cstop offset='0%25' stop-color='%23fff' stop-opacity='0.6'/%3E%3Cstop offset='100%25' stop-color='%23fff' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c2' cx='60%25' cy='30%25' r='25%25'%3E%3Cstop offset='0%25' stop-color='%23fff' stop-opacity='0.5'/%3E%3Cstop offset='100%25' stop-color='%23fff' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c3' cx='80%25' cy='55%25' r='28%25'%3E%3Cstop offset='0%25' stop-color='%23fff' stop-opacity='0.45'/%3E%3Cstop offset='100%25' stop-color='%23fff' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c4' cx='40%25' cy='65%25' r='22%25'%3E%3Cstop offset='0%25' stop-color='%23fff' stop-opacity='0.4'/%3E%3Cstop offset='100%25' stop-color='%23fff' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c5' cx='50%25' cy='20%25' r='35%25'%3E%3Cstop offset='0%25' stop-color='%23fff' stop-opacity='0.5'/%3E%3Cstop offset='100%25' stop-color='%23fff' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect fill='%23008080' width='800' height='600'/%3E%3Crect fill='url(%23c1)' width='800' height='600'/%3E%3Crect fill='url(%23c2)' width='800' height='600'/%3E%3Crect fill='url(%23c3)' width='800' height='600'/%3E%3Crect fill='url(%23c4)' width='800' height='600'/%3E%3Crect fill='url(%23c5)' width='800' height='600'/%3E%3C/svg%3E") center/cover no-repeat`
        },
        {
            name: 'Setup',
            css: 'linear-gradient(180deg, #000080 0%, #000080 40%, #1084d0 60%, #1084d0 100%)'
        },
        {
            name: 'Forest',
            css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23004000' width='800' height='600'/%3E%3Crect fill='%23006000' y='300' width='800' height='300'/%3E%3Cpolygon fill='%23005500' points='100,300 150,100 200,300'/%3E%3Cpolygon fill='%23004400' points='250,300 320,80 390,300'/%3E%3Cpolygon fill='%23005500' points='400,300 460,120 520,300'/%3E%3Cpolygon fill='%23004400' points='550,300 630,60 710,300'/%3E%3Cpolygon fill='%23005000' points='50,300 100,150 150,300'/%3E%3Cpolygon fill='%23003800' points='650,300 700,140 750,300'/%3E%3Crect fill='%23442200' x='145' y='280' width='10' height='20'/%3E%3Crect fill='%23442200' x='315' y='280' width='10' height='20'/%3E%3Crect fill='%23442200' x='455' y='280' width='10' height='20'/%3E%3Crect fill='%23442200' x='625' y='280' width='10' height='20'/%3E%3C/svg%3E") center/cover no-repeat`
        },
        {
            name: 'Haze',
            css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
    ],

    winxp: [
        {
            name: 'Bliss',
            css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000'%3E%3Cdefs%3E%3ClinearGradient id='sky' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23245EDC'/%3E%3Cstop offset='25%25' stop-color='%234A90D9'/%3E%3Cstop offset='50%25' stop-color='%2387CEEB'/%3E%3Cstop offset='65%25' stop-color='%23B0E0E6'/%3E%3C/linearGradient%3E%3CradialGradient id='cl1' cx='25%25' cy='20%25' r='18%25'%3E%3Cstop offset='0%25' stop-color='%23fff' stop-opacity='0.9'/%3E%3Cstop offset='100%25' stop-color='%23fff' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='cl2' cx='70%25' cy='15%25' r='20%25'%3E%3Cstop offset='0%25' stop-color='%23fff' stop-opacity='0.85'/%3E%3Cstop offset='100%25' stop-color='%23fff' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect fill='url(%23sky)' width='1600' height='1000'/%3E%3Crect fill='url(%23cl1)' width='1600' height='1000'/%3E%3Crect fill='url(%23cl2)' width='1600' height='1000'/%3E%3Cellipse fill='%234CAF50' cx='400' cy='850' rx='900' ry='400'/%3E%3Cellipse fill='%2366BB6A' cx='1200' cy='900' rx='800' ry='350'/%3E%3Cellipse fill='%2381C784' cx='800' cy='950' rx='1000' ry='300' opacity='0.7'/%3E%3C/svg%3E") center/cover no-repeat`
        },
        {
            name: 'Azul',
            css: 'linear-gradient(135deg, #667eea 0%, #1a3f80 50%, #0a246a 100%)'
        },
        {
            name: 'Autumn',
            css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000'%3E%3Cdefs%3E%3ClinearGradient id='as' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ff8c00'/%3E%3Cstop offset='50%25' stop-color='%23ff6347'/%3E%3Cstop offset='100%25' stop-color='%238b0000'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23as)' width='1600' height='1000'/%3E%3Cellipse fill='%23cc4400' cx='300' cy='800' rx='600' ry='350'/%3E%3Cellipse fill='%23aa3300' cx='1100' cy='850' rx='700' ry='300'/%3E%3Cellipse fill='%23993300' cx='700' cy='900' rx='800' ry='250' opacity='0.6'/%3E%3C/svg%3E") center/cover no-repeat`
        },
        {
            name: 'Radiance',
            css: 'radial-gradient(ellipse at 30% 50%, #ffd700 0%, #ff8c00 30%, #0054e3 70%, #0a246a 100%)'
        },
        {
            name: 'Vortec',
            css: 'linear-gradient(180deg, #0a246a 0%, #3168d5 30%, #6eb5ff 50%, #3168d5 70%, #0a246a 100%)'
        }
    ],

    macos: [
        {
            name: 'Sonoma',
            css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0' y1='0' x2='0.8' y2='1'%3E%3Cstop offset='0%25' stop-color='%23071330'/%3E%3Cstop offset='30%25' stop-color='%23122555'/%3E%3Cstop offset='60%25' stop-color='%230F2040'/%3E%3Cstop offset='100%25' stop-color='%23071330'/%3E%3C/linearGradient%3E%3CradialGradient id='g1' cx='15%25' cy='75%25' r='45%25'%3E%3Cstop offset='0%25' stop-color='%23FF3B6B' stop-opacity='0.9'/%3E%3Cstop offset='50%25' stop-color='%23E8445A' stop-opacity='0.4'/%3E%3Cstop offset='100%25' stop-color='%23E8445A' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='g2' cx='40%25' cy='60%25' r='40%25'%3E%3Cstop offset='0%25' stop-color='%23FF9F43' stop-opacity='0.85'/%3E%3Cstop offset='50%25' stop-color='%23F7971E' stop-opacity='0.3'/%3E%3Cstop offset='100%25' stop-color='%23F7971E' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='g3' cx='75%25' cy='25%25' r='45%25'%3E%3Cstop offset='0%25' stop-color='%234F8EF7' stop-opacity='0.9'/%3E%3Cstop offset='50%25' stop-color='%233A6FD8' stop-opacity='0.4'/%3E%3Cstop offset='100%25' stop-color='%233A6FD8' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='g4' cx='65%25' cy='80%25' r='38%25'%3E%3Cstop offset='0%25' stop-color='%23D946EF' stop-opacity='0.8'/%3E%3Cstop offset='50%25' stop-color='%23A855F7' stop-opacity='0.3'/%3E%3Cstop offset='100%25' stop-color='%23A855F7' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='g5' cx='90%25' cy='55%25' r='35%25'%3E%3Cstop offset='0%25' stop-color='%2306B6D4' stop-opacity='0.7'/%3E%3Cstop offset='50%25' stop-color='%230891B2' stop-opacity='0.2'/%3E%3Cstop offset='100%25' stop-color='%230891B2' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='g6' cx='30%25' cy='20%25' r='30%25'%3E%3Cstop offset='0%25' stop-color='%238B5CF6' stop-opacity='0.6'/%3E%3Cstop offset='100%25' stop-color='%238B5CF6' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect fill='url(%23bg)' width='1600' height='1000'/%3E%3Crect fill='url(%23g1)' width='1600' height='1000'/%3E%3Crect fill='url(%23g2)' width='1600' height='1000'/%3E%3Crect fill='url(%23g3)' width='1600' height='1000'/%3E%3Crect fill='url(%23g4)' width='1600' height='1000'/%3E%3Crect fill='url(%23g5)' width='1600' height='1000'/%3E%3Crect fill='url(%23g6)' width='1600' height='1000'/%3E%3C/svg%3E") center/cover no-repeat`
        },
        {
            name: 'Big Sur',
            css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%231a1a3e'/%3E%3Cstop offset='30%25' stop-color='%23365f8a'/%3E%3Cstop offset='50%25' stop-color='%2392c5de'/%3E%3Cstop offset='70%25' stop-color='%23f0c27f'/%3E%3Cstop offset='100%25' stop-color='%23c56e4a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23s)' width='1600' height='1000'/%3E%3Cellipse fill='%23283a5c' cx='400' cy='700' rx='700' ry='250' opacity='0.7'/%3E%3Cellipse fill='%231a2a4a' cx='1100' cy='750' rx='600' ry='200' opacity='0.6'/%3E%3Cellipse fill='%23344a6c' cx='750' cy='800' rx='900' ry='180' opacity='0.5'/%3E%3C/svg%3E") center/cover no-repeat`
        },
        {
            name: 'Monterey',
            css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000'%3E%3Cdefs%3E%3ClinearGradient id='n' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%230a0a1a'/%3E%3Cstop offset='50%25' stop-color='%23141428'/%3E%3Cstop offset='100%25' stop-color='%230a0a1a'/%3E%3C/linearGradient%3E%3CradialGradient id='st' cx='50%25' cy='40%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23223' stop-opacity='1'/%3E%3Cstop offset='100%25' stop-color='%23000' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect fill='url(%23n)' width='1600' height='1000'/%3E%3Crect fill='url(%23st)' width='1600' height='1000'/%3E%3Ccircle fill='%23fff' cx='200' cy='150' r='1' opacity='0.8'/%3E%3Ccircle fill='%23fff' cx='500' cy='80' r='1.5' opacity='0.6'/%3E%3Ccircle fill='%23fff' cx='800' cy='200' r='1' opacity='0.9'/%3E%3Ccircle fill='%23fff' cx='1100' cy='100' r='1.2' opacity='0.7'/%3E%3Ccircle fill='%23fff' cx='1400' cy='180' r='1' opacity='0.5'/%3E%3Ccircle fill='%23fff' cx='300' cy='300' r='0.8' opacity='0.6'/%3E%3Ccircle fill='%23fff' cx='700' cy='120' r='1.3' opacity='0.8'/%3E%3Ccircle fill='%23fff' cx='1000' cy='250' r='0.9' opacity='0.7'/%3E%3Ccircle fill='%23fff' cx='1300' cy='50' r='1.1' opacity='0.9'/%3E%3Ccircle fill='%23fff' cx='600' cy='350' r='0.7' opacity='0.5'/%3E%3Ccircle fill='%23fff' cx='900' cy='60' r='1.4' opacity='0.6'/%3E%3Ccircle fill='%23fff' cx='150' cy='400' r='1' opacity='0.4'/%3E%3Ccircle fill='%23fff' cx='1500' cy='300' r='0.8' opacity='0.7'/%3E%3Ccircle fill='%23fff' cx='450' cy='250' r='1.2' opacity='0.5'/%3E%3C/svg%3E") center/cover no-repeat`
        },
        {
            name: 'Ventura',
            css: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 20%, #0f3460 40%, #e94560 60%, #533483 80%, #1a1a2e 100%)'
        },
        {
            name: 'Sequoia',
            css: 'linear-gradient(160deg, #0f0c29 0%, #302b63 40%, #24243e 100%)'
        }
    ],

    linux: [
        {
            name: 'Aubergine',
            css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000'%3E%3Cdefs%3E%3ClinearGradient id='ub' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%232C001E'/%3E%3Cstop offset='40%25' stop-color='%23450A2F'/%3E%3Cstop offset='100%25' stop-color='%232C001E'/%3E%3C/linearGradient%3E%3CradialGradient id='u1' cx='30%25' cy='40%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23E95420' stop-opacity='0.3'/%3E%3Cstop offset='100%25' stop-color='%23E95420' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='u2' cx='70%25' cy='60%25' r='45%25'%3E%3Cstop offset='0%25' stop-color='%23772953' stop-opacity='0.5'/%3E%3Cstop offset='100%25' stop-color='%23772953' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect fill='url(%23ub)' width='1600' height='1000'/%3E%3Crect fill='url(%23u1)' width='1600' height='1000'/%3E%3Crect fill='url(%23u2)' width='1600' height='1000'/%3E%3C/svg%3E") center/cover no-repeat`
        },
        {
            name: 'Focal Fossa',
            css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000'%3E%3Cdefs%3E%3ClinearGradient id='ff' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%232c001e'/%3E%3Cstop offset='50%25' stop-color='%23300020'/%3E%3Cstop offset='100%25' stop-color='%232c001e'/%3E%3C/linearGradient%3E%3CradialGradient id='ff1' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23e95420' stop-opacity='0.15'/%3E%3Cstop offset='100%25' stop-color='%23e95420' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='ff2' cx='20%25' cy='80%25' r='40%25'%3E%3Cstop offset='0%25' stop-color='%23772953' stop-opacity='0.4'/%3E%3Cstop offset='100%25' stop-color='%23772953' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='ff3' cx='80%25' cy='20%25' r='35%25'%3E%3Cstop offset='0%25' stop-color='%23e95420' stop-opacity='0.2'/%3E%3Cstop offset='100%25' stop-color='%23e95420' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect fill='url(%23ff)' width='1600' height='1000'/%3E%3Crect fill='url(%23ff1)' width='1600' height='1000'/%3E%3Crect fill='url(%23ff2)' width='1600' height='1000'/%3E%3Crect fill='url(%23ff3)' width='1600' height='1000'/%3E%3C/svg%3E") center/cover no-repeat`
        },
        {
            name: 'Matrix',
            css: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23000a00' width='800' height='600'/%3E%3Ctext fill='%23003300' font-family='monospace' font-size='14'%3E%3Ctspan x='10' y='20'%3E01001000 01100101 01101100%3C/tspan%3E%3Ctspan x='10' y='40'%3E01101100 01101111 00100000%3C/tspan%3E%3Ctspan x='10' y='60'%3E01010111 01101111 01110010%3C/tspan%3E%3Ctspan x='10' y='80'%3E01101100 01100100 00100001%3C/tspan%3E%3Ctspan x='10' y='100'%3E01001000 01101001 01110010%3C/tspan%3E%3Ctspan x='10' y='120'%3E01100101 00100000 01001010%3C/tspan%3E%3Ctspan x='10' y='140'%3E01100001 01101110 00100001%3C/tspan%3E%3C/text%3E%3C/svg%3E") repeat`
        },
        {
            name: 'Nord',
            css: 'linear-gradient(135deg, #2e3440 0%, #3b4252 30%, #434c5e 60%, #4c566a 100%)'
        },
        {
            name: 'Dracula',
            css: 'linear-gradient(135deg, #282a36 0%, #44475a 50%, #282a36 100%)'
        }
    ]
};

// Secret JP2 wallpaper - pope bust: white cap, gold face, white robes
const JP2_WALLPAPER = {
    name: '??? JP2 ???',
    secret: true,
    css: null,
    generate: function() {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        // Dark background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 1200, 800);

        // Same map as terminal: W=white, Y=yellow/gold, D=dark features
        const map = [
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

        const colorMap = { W: '#FFFFFF', Y: '#FFD700', D: '#222222' };
        const chars = '2137JP2ODJAZD21370KREMOWKI';
        const blockSize = 16;
        const startX = (1200 - map[0].length * blockSize) / 2;
        const startY = 50;

        ctx.font = 'bold 14px monospace';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';
        let ci = 0;

        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                const ch = map[r][c];
                if (ch === '_') continue;
                const color = colorMap[ch];
                // Slight color variation for richness
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.7 + Math.random() * 0.3;
                const char = chars[ci % chars.length];
                ctx.fillText(char, startX + c * blockSize + blockSize/2, startY + r * blockSize);
                ci++;
            }
        }

        // Title
        ctx.globalAlpha = 0.8;
        ctx.font = 'bold 32px serif';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('✝  2 1 3 7  ✝', 600, 540);

        ctx.globalAlpha = 0.5;
        ctx.font = 'italic 18px serif';
        ctx.fillStyle = '#DAA520';
        ctx.fillText('Patron Polskiego Internetu', 600, 585);

        // Subtle corner crosses
        ctx.globalAlpha = 0.06;
        ctx.font = '120px serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('✝', 120, 620);
        ctx.fillText('✝', 1080, 620);

        ctx.globalAlpha = 1;
        return canvas.toDataURL('image/png');
    }
};

// Generate JP2 wallpaper on load
(function() {
    const dataUrl = JP2_WALLPAPER.generate();
    JP2_WALLPAPER.css = `url("${dataUrl}") center/cover no-repeat #111`;
})();

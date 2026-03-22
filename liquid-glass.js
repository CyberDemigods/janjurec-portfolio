/**
 * liquid-glass.js v3
 * Apple-style Liquid Glass with REAL refraction via Canvas
 * Based on Apple's 5-layer model: Lensing, Frosting, Dimming, Specular, Shadow
 * Vanilla JS, no dependencies
 */
(function() {
    'use strict';

    var _active = new Map();
    var _wallpaperImg = null;
    var _wallpaperReady = false;
    var _wallpaperUrl = '';
    var _isMacos = false;
    var _initDone = false;

    // ================================================================
    // CONFIGURATION — Apple's 5-layer model adapted for web
    // ================================================================
    var CONFIG = {
        window: {
            // Layer 1: Lensing (Canvas barrel distortion)
            edgeWidth: 55,           // px from edge where refraction occurs
            refractionStrength: 22,  // max pixel displacement at edges
            renderScale: 0.5,        // render at 50% for performance
            // Layer 2: Frosting (backdrop-filter)
            blur: 2,
            saturate: 180,
            // Layer 3: Adaptive dimming (background overlay)
            bgColor: 'rgba(255, 255, 255, 0.12)',
            // Layer 4: Specular / Shine
            shineInsetShadow: 'inset -10px -8px 0px -11px rgba(255,255,255,1), inset 0px -9px 0px -8px rgba(255,255,255,1)',
            shineFilter: 'blur(1px) drop-shadow(10px 4px 6px rgba(0,0,0,0.25)) brightness(115%)',
            shineOpacity: 0.5,
            // Layer 5: Shadow + Rim
            rimColor: 'rgba(255, 255, 255, 0.8)',
            rimWidth: '1px',
            shadow: '0 8px 32px rgba(31, 38, 135, 0.2), inset 0 4px 20px rgba(255, 255, 255, 0.3)',
            // Content
            contentOpacity: 0.5,
            titlebarOpacity: 0.7
        },
        icon: {
            edgeWidth: 18,
            refractionStrength: 14,
            renderScale: 1,
            blur: 1,
            saturate: 160,
            bgColor: 'rgba(255, 255, 255, 0.10)',
            shineInsetShadow: 'inset -6px -5px 0px -7px rgba(255,255,255,1), inset 0px -6px 0px -5px rgba(255,255,255,1)',
            shineFilter: 'blur(0.5px) drop-shadow(6px 3px 4px rgba(0,0,0,0.2)) brightness(112%)',
            shineOpacity: 0.4,
            rimColor: 'rgba(255, 255, 255, 0.7)',
            rimWidth: '1px',
            shadow: '0 6px 24px rgba(31, 38, 135, 0.2), inset 0 2px 12px rgba(255, 255, 255, 0.25)',
            contentOpacity: 0.4,
            titlebarOpacity: 0.6
        }
    };

    var LG = window.LiquidGlass = {};

    // ================================================================
    // INIT
    // ================================================================
    LG.init = function() {
        _isMacos = document.documentElement.getAttribute('data-theme') === 'macos';
        _initDone = true;
        _tryLoadWallpaper();
    };

    LG.reinit = function() {
        _isMacos = document.documentElement.getAttribute('data-theme') === 'macos';
        _wallpaperReady = false;
        _wallpaperImg = null;
        _wallpaperUrl = '';
        _tryLoadWallpaper();
    };

    function _tryLoadWallpaper() {
        var desktop = document.querySelector('.desktop');
        if (!desktop) return;

        // Get the raw background value (e.g., "url(./wallpapers/foo.jpg)")
        var bg = desktop.style.background || getComputedStyle(desktop).backgroundImage;
        var m = bg.match(/url\(["']?(.*?)["']?\)/);
        if (!m || !m[1]) return;

        var url = m[1];
        // Already loaded this one
        if (url === _wallpaperUrl && _wallpaperReady) return;
        _wallpaperUrl = url;

        // Resolve relative URL to absolute
        var a = document.createElement('a');
        a.href = url;
        var absoluteUrl = a.href;

        _wallpaperImg = new Image();
        // Don't set crossOrigin for same-origin images
        _wallpaperImg.onload = function() {
            _wallpaperReady = true;
        };
        _wallpaperImg.onerror = function() {
            // Retry without any CORS
            _wallpaperReady = false;
        };
        _wallpaperImg.src = absoluteUrl;
    }

    // ================================================================
    // LAYER 1: LENSING — Canvas barrel distortion
    // ================================================================

    /**
     * Render wallpaper with edge-focused barrel distortion.
     * Apple: "bends and concentrates light in real-time"
     * Clear center, pixels pushed outward at edges.
     */
    function _renderRefraction(canvas, elRect, dRect, cfg) {
        if (!_wallpaperReady || !_wallpaperImg) return false;

        var scale = cfg.renderScale;
        var cw = Math.round(elRect.width * scale);
        var ch = Math.round(elRect.height * scale);
        if (cw < 4 || ch < 4) return false;

        canvas.width = cw;
        canvas.height = ch;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Map element position to wallpaper image coordinates
        var wpW = _wallpaperImg.naturalWidth;
        var wpH = _wallpaperImg.naturalHeight;

        // Desktop uses background-size: cover — calculate actual mapping
        var dAspect = dRect.width / dRect.height;
        var wAspect = wpW / wpH;
        var drawW, drawH, offsetX, offsetY;

        if (dAspect > wAspect) {
            // Desktop wider than image — fit width, crop height
            drawW = dRect.width;
            drawH = dRect.width / wAspect;
            offsetX = 0;
            offsetY = (dRect.height - drawH) / 2;
        } else {
            // Desktop taller — fit height, crop width
            drawH = dRect.height;
            drawW = dRect.height * wAspect;
            offsetX = (dRect.width - drawW) / 2;
            offsetY = 0;
        }

        var scaleX = wpW / drawW;
        var scaleY = wpH / drawH;

        // Element position relative to the drawn wallpaper
        var relLeft = elRect.left - dRect.left - offsetX;
        var relTop = elRect.top - dRect.top - offsetY;

        // Extra margin for sampling beyond element edges
        var marginPx = Math.round(cfg.refractionStrength * scale) + 4;
        var extW = cw + marginPx * 2;
        var extH = ch + marginPx * 2;

        // Source rect on wallpaper image (with margin)
        var srcX = (relLeft - marginPx / scale) * scaleX;
        var srcY = (relTop - marginPx / scale) * scaleY;
        var srcW = (elRect.width + marginPx * 2 / scale) * scaleX;
        var srcH = (elRect.height + marginPx * 2 / scale) * scaleY;

        // Draw extended wallpaper portion
        var extCanvas = document.createElement('canvas');
        extCanvas.width = extW;
        extCanvas.height = extH;
        var extCtx = extCanvas.getContext('2d', { willReadFrequently: true });

        try {
            extCtx.drawImage(_wallpaperImg, srcX, srcY, srcW, srcH, 0, 0, extW, extH);
        } catch(e) {
            return false;
        }

        var extData;
        try {
            extData = extCtx.getImageData(0, 0, extW, extH);
        } catch(e) {
            // CORS / tainted canvas
            return false;
        }
        var src = extData.data;

        var outData = ctx.createImageData(cw, ch);
        var dst = outData.data;

        var edgeW = cfg.edgeWidth * scale;
        var strength = cfg.refractionStrength * scale;
        var cx = cw / 2;
        var cy = ch / 2;

        for (var y = 0; y < ch; y++) {
            for (var x = 0; x < cw; x++) {
                // Distance to nearest edge
                var distEdge = Math.min(x, cw - 1 - x, y, ch - 1 - y);

                // Default: sample from corresponding position (+ margin offset)
                var sampleX = x + marginPx;
                var sampleY = y + marginPx;

                if (distEdge < edgeW) {
                    // Edge zone — barrel distortion: push outward from center
                    var factor = 1 - (distEdge / edgeW);
                    // Smoothstep for natural falloff
                    factor = factor * factor * (3 - 2 * factor);

                    var dx = x - cx;
                    var dy = y - cy;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0.5) {
                        var shift = factor * strength;
                        sampleX += Math.round((dx / dist) * shift);
                        sampleY += Math.round((dy / dist) * shift);
                    }
                }

                // Clamp
                sampleX = Math.max(0, Math.min(extW - 1, sampleX));
                sampleY = Math.max(0, Math.min(extH - 1, sampleY));

                var srcIdx = (sampleY * extW + sampleX) * 4;
                var dstIdx = (y * cw + x) * 4;
                dst[dstIdx]     = src[srcIdx];
                dst[dstIdx + 1] = src[srcIdx + 1];
                dst[dstIdx + 2] = src[srcIdx + 2];
                dst[dstIdx + 3] = 255;
            }
        }

        ctx.putImageData(outData, 0, 0);
        return true;
    }

    // ================================================================
    // APPLY GLASS EFFECT
    // ================================================================
    LG.apply = function(element, type) {
        if (!_initDone) LG.init();
        if (!_isMacos) return;
        if (_active.has(element)) return;

        // Re-detect wallpaper in case it changed
        if (!_wallpaperReady) _tryLoadWallpaper();

        type = type || 'window';
        var cfg = CONFIG[type] || CONFIG.window;

        var saved = _saveStyles(element, type);

        var desktop = document.querySelector('.desktop');
        var dRect = desktop ? desktop.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
        var elRect = element.getBoundingClientRect();

        // ---- Glass container (z-index:-1 = behind content, above parent bg) ----
        var glass = document.createElement('div');
        glass.className = 'lg-glass';
        glass.style.cssText =
            'position:absolute;inset:0;border-radius:inherit;' +
            'pointer-events:none;overflow:hidden;z-index:-1;';

        // LAYER 1: Lensing — Canvas with real pixel distortion
        var refrCanvas = document.createElement('canvas');
        refrCanvas.className = 'lg-refract';
        refrCanvas.style.cssText =
            'position:absolute;inset:0;width:100%;height:100%;' +
            'border-radius:inherit;';
        var refractionWorked = _renderRefraction(refrCanvas, elRect, dRect, cfg);
        glass.appendChild(refrCanvas);

        // LAYER 4: Specular / Shine — Apple's signature reflection
        var shineLayer = document.createElement('div');
        shineLayer.className = 'lg-shine';
        shineLayer.style.cssText =
            'position:absolute;inset:0;border-radius:inherit;' +
            'background:rgba(255,255,255,0.1);' +
            'box-shadow:' + cfg.shineInsetShadow + ';' +
            'opacity:' + cfg.shineOpacity + ';' +
            'filter:' + cfg.shineFilter + ';';
        glass.appendChild(shineLayer);

        // LAYER 5: Rim — bright border + inner glow
        var rimLayer = document.createElement('div');
        rimLayer.className = 'lg-rim';
        rimLayer.style.cssText =
            'position:absolute;inset:0;border-radius:inherit;' +
            'border:' + cfg.rimWidth + ' solid ' + cfg.rimColor + ';' +
            'box-shadow:inset 0 0 15px rgba(255,255,255,0.12);';
        glass.appendChild(rimLayer);

        // ---- Insert glass BEFORE other children ----
        element.insertBefore(glass, element.firstChild);

        // ---- LAYER 2+3: Frosting + Dimming on element itself ----
        element.style.background = cfg.bgColor;
        element.style.boxShadow = cfg.shadow;
        element.style.border = cfg.rimWidth + ' solid ' + cfg.rimColor;
        element.style.backdropFilter = 'blur(' + cfg.blur + 'px) saturate(' + cfg.saturate + '%)';
        element.style.webkitBackdropFilter = element.style.backdropFilter;
        element.style.overflow = 'hidden';

        // ---- Make children semi-transparent (content shows through glass) ----
        if (type === 'window') {
            // All structural children need position:relative to be above z-index:-1 glass
            element.querySelectorAll('.window-titlebar, .window-body, .window-menubar, .window-statusbar').forEach(function(child) {
                child.style.position = 'relative';
                child.style.zIndex = '1';
                child.style.background = 'transparent';
                child.style.backgroundColor = 'transparent';
                child.style.backdropFilter = 'none';
                child.style.webkitBackdropFilter = 'none';
            });
            element.querySelectorAll('.window-body, .window-statusbar').forEach(function(child) {
                child.style.opacity = String(cfg.contentOpacity);
            });
            var titlebar = element.querySelector('.window-titlebar');
            if (titlebar) titlebar.style.opacity = String(cfg.titlebarOpacity);
        }

        if (type === 'icon') {
            var img = element.querySelector('.icon-img');
            if (img) {
                img.style.opacity = String(cfg.contentOpacity);
                img.style.filter = 'brightness(1.1)';
            }
            var label = element.querySelector('.icon-label');
            if (label) label.style.opacity = String(cfg.contentOpacity);
        }

        // ---- Store instance ----
        _active.set(element, {
            type: type,
            cfg: cfg,
            saved: saved,
            glass: glass,
            refrCanvas: refrCanvas,
            dRect: dRect,
            refractionWorked: refractionWorked
        });
    };

    // ================================================================
    // UPDATE POSITION (during drag)
    // ================================================================
    LG.updatePosition = function(element) {
        var inst = _active.get(element);
        if (!inst || !inst.refractionWorked) return;

        var rect = element.getBoundingClientRect();
        _renderRefraction(inst.refrCanvas, rect, inst.dRect, inst.cfg);
    };

    // ================================================================
    // REMOVE GLASS EFFECT
    // ================================================================
    LG.remove = function(element) {
        var inst = _active.get(element);
        if (!inst) return;

        if (inst.glass && inst.glass.parentNode) {
            inst.glass.parentNode.removeChild(inst.glass);
        }

        var s = inst.saved;
        Object.keys(s.el).forEach(function(p) {
            element.style[p] = s.el[p];
        });

        s.children.forEach(function(c) {
            Object.keys(c.styles).forEach(function(p) {
                c.el.style[p] = c.styles[p];
            });
        });

        _active.delete(element);
    };

    // ================================================================
    // HELPERS
    // ================================================================
    function _saveStyles(element, type) {
        var saved = { el: {}, children: [] };
        var props = ['background', 'backgroundColor', 'boxShadow', 'border',
                     'backdropFilter', 'webkitBackdropFilter', 'overflow', 'opacity'];

        props.forEach(function(p) { saved.el[p] = element.style[p]; });

        if (type === 'window') {
            element.querySelectorAll('.window-titlebar, .window-body, .window-menubar, .window-statusbar').forEach(function(child) {
                var cs = {};
                ['background', 'backgroundColor', 'backdropFilter', 'webkitBackdropFilter',
                 'opacity', 'position', 'zIndex'].forEach(function(p) {
                    cs[p] = child.style[p];
                });
                saved.children.push({ el: child, styles: cs });
            });
        }

        if (type === 'icon') {
            var img = element.querySelector('.icon-img');
            if (img) {
                saved.children.push({ el: img, styles: { opacity: img.style.opacity, filter: img.style.filter } });
            }
            var label = element.querySelector('.icon-label');
            if (label) {
                saved.children.push({ el: label, styles: { opacity: label.style.opacity } });
            }
        }

        return saved;
    }

    LG.isActive = function(element) {
        return _active.has(element);
    };

    LG.destroy = function() {
        _active.forEach(function(inst, el) {
            LG.remove(el);
        });
    };

})();

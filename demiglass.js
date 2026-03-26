/**
 * DemiGlass.js v6.2.0
 *
 * Apple-style Liquid Glass effect for the web.
 * Frosted translucent elements with backdrop blur, SVG refraction
 * (feDisplacementMap), color absorption, directional edge lighting,
 * specular highlights, and depth shadows.
 *
 * Author: CyberDemigods
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DemiGlass = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var clamp = function(v, lo, hi) { return Math.min(Math.max(v, lo), hi); };
  var lerp  = function(a, b, t) { return a + (b - a) * t; };

  // ── Background config (needed for Safari clone fallback) ──
  var _bgCSS = '';
  var _bgAttachment = 'fixed';

  // ── Feature detection: does backdrop-filter support url(#svg)? ──
  // Safari supports backdrop-filter blur/saturate but ignores url().
  // We detect this once and fall back to a background-clone approach.
  var _backdropUrlSupported = null; // null = not tested yet

  function testBackdropUrl() {
    if (_backdropUrlSupported !== null) return _backdropUrlSupported;
    // Create a throwaway SVG filter and test element
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.style.cssText = 'position:absolute;width:0;height:0;';
    svg.innerHTML = '<filter id="_dg_test"><feFlood/></filter>';
    document.body.appendChild(svg);

    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:-9999px;width:10px;height:10px;' +
      '-webkit-backdrop-filter:url(#_dg_test);backdrop-filter:url(#_dg_test);';
    document.body.appendChild(el);

    var cs = getComputedStyle(el);
    var val = cs.backdropFilter || cs.webkitBackdropFilter || '';
    _backdropUrlSupported = val.indexOf('url') !== -1;

    el.remove();
    svg.remove();
    return _backdropUrlSupported;
  }

  // ── WebGL displacement renderer (Safari fallback) ─────
  // When backdrop-filter:url(#svg) is unsupported, we render the
  // displaced background onto a <canvas> via a WebGL shader.

  var _bgSource = null;   // cached background canvas

  var _GL_VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0,1);}';
  var _GL_FS = [
    'precision mediump float;',
    'varying vec2 v;',
    'uniform sampler2D bg,dm;',
    'uniform float sc;',
    'uniform vec2 off,sz,vp;',
    'void main(){',
    '  vec2 d=(texture2D(dm,v).rg-0.5)*sc;',
    '  vec2 uv=(off+v*sz+d)/vp;',
    '  uv.y=1.0-uv.y;',
    '  gl_FragColor=texture2D(bg,clamp(uv,0.0,1.0));',
    '}'
  ].join('\n');

  function _glShader(gl, src, type) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  // Load image from data URI and upload as WebGL texture
  function _glLoadTex(gl, src, unit, cb) {
    var tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([128,128,128,255]));
    var img = new Image();
    img.onload = function() {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (cb) cb();
    };
    img.src = src;
    return tex;
  }

  function _glUploadCanvas(gl, tex, unit, canvas) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  function GLDisplacer(w, h, dispMapURI) {
    var dpr = window.devicePixelRatio || 1;
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;' +
      'pointer-events:none;border-radius:inherit;z-index:0;';

    var gl = this.canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
    if (!gl) { this.ok = false; return; }
    this.gl = gl;
    this.ok = true;

    // Compile & link
    var vs = _glShader(gl, _GL_VS, gl.VERTEX_SHADER);
    var fs = _glShader(gl, _GL_FS, gl.FRAGMENT_SHADER);
    var pg = gl.createProgram();
    gl.attachShader(pg, vs); gl.attachShader(pg, fs);
    gl.linkProgram(pg); gl.useProgram(pg);
    this._pg = pg;

    // Fullscreen quad
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pg, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    this._uSc  = gl.getUniformLocation(pg, 'sc');
    this._uOff = gl.getUniformLocation(pg, 'off');
    this._uSz  = gl.getUniformLocation(pg, 'sz');
    this._uVp  = gl.getUniformLocation(pg, 'vp');
    gl.uniform1i(gl.getUniformLocation(pg, 'bg'), 0);
    gl.uniform1i(gl.getUniformLocation(pg, 'dm'), 1);

    // Background texture (placeholder until loaded)
    this._bgTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._bgTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([8,8,16,255]));

    // Displacement map texture
    this._dmTex = _glLoadTex(gl, dispMapURI, 1);
  }

  GLDisplacer.prototype.setBg = function(source) {
    _glUploadCanvas(this.gl, this._bgTex, 0, source);
  };

  GLDisplacer.prototype.draw = function(thumbX, thumbY, thumbW, thumbH, vpW, vpH, scale) {
    var gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this._pg);
    gl.uniform1f(this._uSc, scale);
    gl.uniform2f(this._uOff, thumbX, thumbY);
    gl.uniform2f(this._uSz, thumbW, thumbH);
    gl.uniform2f(this._uVp, vpW, vpH);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  GLDisplacer.prototype.destroy = function() {
    var ext = this.gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    this.canvas.remove();
  };

  // ── Background capture ──────────────────────────────────
  // Renders the page background CSS to a canvas for use as WebGL texture.
  // Tries SVG foreignObject first, falls back to solid backgroundColor.

  function _captureBg(w, h, cb) {
    if (_bgSource) { cb(_bgSource); return; }

    var css = _bgCSS || '';
    if (!css) {
      try { css = getComputedStyle(document.body).background || ''; } catch(e) {}
    }

    // Try foreignObject SVG → Blob → Image → Canvas
    try {
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('xmlns', ns);
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      var fo = document.createElementNS(ns, 'foreignObject');
      fo.setAttribute('width', '100%');
      fo.setAttribute('height', '100%');
      var div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
      div.setAttribute('style',
        'margin:0;width:' + w + 'px;height:' + h + 'px;background:' +
        css.replace(/"/g, "'") + ';background-attachment:' + _bgAttachment);
      fo.appendChild(div);
      svg.appendChild(fo);

      var svgStr = new XMLSerializer().serializeToString(svg);
      var blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function() {
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        // Verify it rendered (not all-black)
        var px = ctx.getImageData(0, 0, Math.min(w, 16), Math.min(h, 16)).data;
        var ok = false;
        for (var i = 0; i < px.length; i += 4) {
          if (px[i] > 10 || px[i+1] > 10 || px[i+2] > 10) { ok = true; break; }
        }
        if (ok) { _bgSource = c; cb(c); }
        else { _bgFallbackSolid(w, h, cb); }
      };
      img.onerror = function() {
        URL.revokeObjectURL(url);
        _bgFallbackSolid(w, h, cb);
      };
      img.src = url;
    } catch(e) {
      _bgFallbackSolid(w, h, cb);
    }
  }

  function _bgFallbackSolid(w, h, cb) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    try {
      ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#080810';
    } catch(e) {
      ctx.fillStyle = '#080810';
    }
    ctx.fillRect(0, 0, w, h);
    _bgSource = c;
    cb(c);
  }

  // ── SVG refraction filter factory ──────────────────────
  // Uses feTurbulence at very low frequency for smooth, lens-like
  // displacement — NOT noisy high-freq blur.
  var _filterId = 0;

  // Vignette SVG data URI — black center (0), white edges (1)
  // Used for edge-only refraction: turbulence masked so center = neutral
  function vignetteURI(innerStop, outerStop) {
    var i = innerStop || 25;
    var o = outerStop || 85;
    return "data:image/svg+xml," + encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'>" +
      "<defs><radialGradient id='v'>" +
      "<stop offset='" + i + "%' stop-color='black'/>" +
      "<stop offset='" + o + "%' stop-color='white'/>" +
      "</radialGradient></defs>" +
      "<rect width='1' height='1' fill='url(#v)'/></svg>"
    );
  }

  // Lens displacement map — smooth radial gradient for convex lens effect.
  // Center = rgb(128,128,128) = neutral (no displacement).
  // Edges shift outward: R channel goes 0.5→0 (left push), G channel 0.5→0 (up push)
  // on the left/top side, and 0.5→1 on right/bottom — creating a magnifying distortion.
  // For simplicity we use two overlapping gradients with different centers.
  function lensMapURI(innerStop, outerStop) {
    var i = innerStop || 40;
    var o = outerStop || 95;
    // Neutral gray in center, white at edges
    // The displacement map works as: pixel_offset = (channel_value - 0.5) * scale
    // So gray(128)=0 offset, white(255)=+max, black(0)=-max
    // A radial gradient gray→white pushes pixels OUTWARD from center = magnify edges
    return "data:image/svg+xml," + encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>" +
      "<defs>" +
      "<radialGradient id='lx' cx='40%' cy='50%' r='55%'>" +
        "<stop offset='" + i + "%' stop-color='rgb(128,128,128)'/>" +
        "<stop offset='" + o + "%' stop-color='rgb(64,128,128)'/>" +
      "</radialGradient>" +
      "<radialGradient id='rx' cx='60%' cy='50%' r='55%'>" +
        "<stop offset='" + i + "%' stop-color='rgb(128,128,128)'/>" +
        "<stop offset='" + o + "%' stop-color='rgb(192,128,128)'/>" +
      "</radialGradient>" +
      "<radialGradient id='ty' cx='50%' cy='40%' r='55%'>" +
        "<stop offset='" + i + "%' stop-color='rgb(128,128,128)'/>" +
        "<stop offset='" + o + "%' stop-color='rgb(128,64,128)'/>" +
      "</radialGradient>" +
      "<radialGradient id='by' cx='50%' cy='60%' r='55%'>" +
        "<stop offset='" + i + "%' stop-color='rgb(128,128,128)'/>" +
        "<stop offset='" + o + "%' stop-color='rgb(128,192,128)'/>" +
      "</radialGradient>" +
      "</defs>" +
      "<rect width='200' height='200' fill='rgb(128,128,128)'/>" +
      "<rect width='200' height='200' fill='url(#lx)' opacity='0.5'/>" +
      "<rect width='200' height='200' fill='url(#rx)' opacity='0.5'/>" +
      "<rect width='200' height='200' fill='url(#ty)' opacity='0.5'/>" +
      "<rect width='200' height='200' fill='url(#by)' opacity='0.5'/>" +
      "</svg>"
    );
  }

  // Simple edge-only lens: neutral center, ring displacement at edges
  function edgeLensURI(innerStop, outerStop) {
    var i = innerStop || 40;
    var o = outerStop || 90;
    return "data:image/svg+xml," + encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>" +
      "<defs>" +
      "<radialGradient id='e'>" +
        "<stop offset='0%' stop-color='rgb(128,128,128)'/>" +
        "<stop offset='" + i + "%' stop-color='rgb(128,128,128)'/>" +
        "<stop offset='" + ((i + o) / 2) + "%' stop-color='rgb(160,160,160)'/>" +
        "<stop offset='" + o + "%' stop-color='rgb(96,96,96)'/>" +
        "<stop offset='100%' stop-color='rgb(128,128,128)'/>" +
      "</radialGradient>" +
      "</defs>" +
      "<rect width='200' height='200' fill='url(#e)'/>" +
      "</svg>"
    );
  }

  function makeRefractionFilter(opts) {
    var id = 'lgr' + (++_filterId);
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    svg.setAttribute('aria-hidden', 'true');

    var freq = opts.refractionFreq || 0.008;
    var octaves = opts.refractionOctaves || 1;
    var seed = Math.floor(Math.random() * 999);
    var scale = opts.refraction || 0;
    var edge = opts.edgeRefraction || false;
    var lens = opts.lensRefraction || false;
    var edgeLens = opts.edgeLensRefraction || false;
    var edgeInner = opts.edgeInner || 25;
    var edgeOuter = opts.edgeOuter || 85;

    var filterBody;
    var mapURI = null; // static displacement map URI (for WebGL fallback)

    if (edgeLens) {
      // ── Edge lens: smooth radial displacement ring at edges, perfectly neutral center
      // No turbulence — pure geometric lens distortion
      mapURI = edgeLensURI(edgeInner, edgeOuter);
      filterBody =
        '<feImage href="' + mapURI + '" ' +
        'preserveAspectRatio="none" result="lens"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="lens" ' +
        'scale="' + scale + '" xChannelSelector="R" yChannelSelector="G"/>';
    } else if (lens) {
      // ── Full lens: smooth radial displacement map, center neutral, edges push outward
      mapURI = lensMapURI(edgeInner, edgeOuter);
      filterBody =
        '<feImage href="' + mapURI + '" ' +
        'preserveAspectRatio="none" result="lens"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="lens" ' +
        'scale="' + scale + '" xChannelSelector="R" yChannelSelector="G"/>';
    } else if (edge) {
      // ── Edge turbulence: random warp masked to edges via vignette
      filterBody =
        '<feTurbulence type="turbulence" baseFrequency="' + freq + '" ' +
        'numOctaves="' + octaves + '" seed="' + seed + '" result="warp"/>' +
        '<feImage href="' + vignetteURI(edgeInner, edgeOuter) + '" ' +
        'preserveAspectRatio="none" result="vig"/>' +
        '<feComposite in="warp" in2="vig" operator="arithmetic" ' +
        'k1="1" k2="0" k3="-0.5" k4="0.5" result="edgeWarp"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="edgeWarp" ' +
        'scale="' + scale + '" xChannelSelector="R" yChannelSelector="G"/>';
    } else {
      // ── Full turbulence (uniform across whole area)
      filterBody =
        '<feTurbulence type="turbulence" baseFrequency="' + freq + '" ' +
        'numOctaves="' + octaves + '" seed="' + seed + '" result="warp"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="warp" ' +
        'scale="' + scale + '" xChannelSelector="R" yChannelSelector="G"/>';
    }

    svg.innerHTML =
      '<filter id="' + id + '" x="-20%" y="-20%" width="140%" height="140%" ' +
      'color-interpolation-filters="sRGB">' + filterBody + '</filter>';

    document.body.appendChild(svg);

    return {
      id: id,
      svg: svg,
      disp: svg.querySelector('feDisplacementMap'),
      turb: svg.querySelector('feTurbulence'),
      mapURI: mapURI,  // null for turbulence modes, data URI for lens modes
    };
  }

  // =================================================================
  //  GlassSlider
  // =================================================================

  function GlassSlider(container, opts) {
    this.container = typeof container === 'string'
      ? document.querySelector(container) : container;
    if (!this.container) return;

    var d = {
      min: 0, max: 100, value: 50, step: 1,
      orientation: 'horizontal',
      trackThickness: 6,
      thumbWidth: 96, thumbHeight: 56,
      // Backdrop blur
      blur: 6,
      saturate: 1.4,
      brightness: 1.06,
      // Refraction (SVG displacement)
      refraction: 0,            // displacement scale in px (0 = off)
      refractionFreq: 0.008,    // turbulence frequency (lower = smoother waves)
      refractionOctaves: 1,     // turbulence complexity (1 = smooth, 2+ = more detail)
      edgeRefraction: false,    // true = turbulence only at edges, clear center
      lensRefraction: false,    // true = smooth convex lens (no turbulence)
      edgeLensRefraction: false,// true = smooth lens ring at edges, perfect center
      edgeInner: 25,            // % radius where edge effect starts
      edgeOuter: 85,            // % radius where edge effect is full
      // Drag dynamics
      dragRefraction: false,    // true = refraction only while dragging, fades to 0 on release
      // Appearance
      specular: 0.35,
      tint: 'rgba(255,255,255,0.04)',
      borderColor: 'rgba(255,255,255,0.45)',
      borderWidth: 1,
      borderTopColor: null,
      shadow: true,
      fillColor: 'transparent',
      trackBg: 'transparent',
      onChange: null,
    };

    this.o = {};
    for (var k in d) this.o[k] = opts && opts[k] !== undefined ? opts[k] : d[k];

    this.value = this.o.value;
    this.dragging = false;
    this.dragIntensity = 0;   // 0..1, ramps to 1 on drag, decays to 0 on release
    this.raf = null;
    this.destroyed = false;
    this.mx = 0.5; this.my = 0.3;
    this._filter = null;

    this._build();
    this._bindEvents();
    this._setPos();
    this._tick = this._tick.bind(this);
    this.raf = requestAnimationFrame(this._tick);
  }

  GlassSlider.prototype._build = function() {
    var o = this.o;
    var isV = o.orientation === 'vertical';

    // ── Create SVG refraction filter if refraction > 0
    var hasRefraction = o.refraction > 0 || o.motionRefractionBoost > 0 || o.lensRefraction || o.edgeLensRefraction;
    if (hasRefraction) {
      this._filter = makeRefractionFilter(o);
    }

    // ── Detect fallback mode: backdrop-filter url() not supported (Safari)
    // Use WebGL when we have a static lens map; fall back gracefully for turbulence modes
    this._useWebGL = hasRefraction && this._filter && this._filter.mapURI && !testBackdropUrl();

    // ── Track
    this.track = document.createElement('div');
    this.track.style.cssText =
      'position:relative;cursor:pointer;touch-action:none;overflow:visible;' +
      'background:' + o.trackBg + ';' +
      (isV
        ? 'width:100%;height:100%;'
        : 'width:100%;height:' + Math.max(o.trackThickness, o.thumbHeight + 20) + 'px;');

    // ── Fill
    this.fill = document.createElement('div');
    this.fill.style.cssText =
      'position:absolute;pointer-events:none;transition:none;' +
      'background:' + o.fillColor + ';' +
      (isV
        ? 'left:0;right:0;bottom:0;height:0;'
        : 'top:0;left:0;bottom:0;width:0;');

    // ── Thumb — the glass capsule
    this.thumb = document.createElement('div');
    var bdFilter = this._buildBackdropFilter(o.blur, o.saturate, o.brightness);
    this.thumb.style.cssText =
      'position:absolute;cursor:grab;z-index:10;' +
      'border-radius:9999px;overflow:hidden;' +
      'width:' + o.thumbWidth + 'px;height:' + o.thumbHeight + 'px;' +
      'transition:transform 0.15s cubic-bezier(.4,0,.2,1), box-shadow 0.2s;' +
      '-webkit-backdrop-filter:' + bdFilter + ';' +
      'backdrop-filter:' + bdFilter + ';' +
      'background:' + o.tint + ';' +
      (o.shadow
        ? 'box-shadow:0 2px 8px rgba(0,0,0,0.10), 0 6px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.08);'
        : '') +
      (isV
        ? 'left:50%;transform:translate(-50%,50%);'
        : 'top:50%;transform:translate(-50%,-50%);');

    // ── WebGL fallback: displacement via GPU shader
    this._gl = null;
    if (this._useWebGL) {
      var self = this;
      this._gl = new GLDisplacer(o.thumbWidth, o.thumbHeight, this._filter.mapURI);
      if (this._gl.ok) {
        // CSS filter for blur/saturate on the canvas (displacement done in shader)
        this._gl.canvas.style.filter =
          (o.blur > 0 ? 'blur(' + o.blur + 'px) ' : '') +
          'saturate(' + o.saturate + ') brightness(' + o.brightness + ')';
        this.thumb.appendChild(this._gl.canvas);
        // Load background texture async
        _captureBg(window.innerWidth, window.innerHeight, function(bgCanvas) {
          if (self._gl && self._gl.ok) self._gl.setBg(bgCanvas);
        });
      } else {
        this._useWebGL = false;
        this._gl = null;
      }
    }

    // ── Border
    this.thumbBorder = document.createElement('div');
    var baseAlpha = this._parseBorderAlpha();
    var topColor = o.borderTopColor || 'rgba(255,255,255,' + Math.min(1, baseAlpha * 1.8).toFixed(2) + ')';
    this.thumbBorder.style.cssText =
      'position:absolute;inset:0;border-radius:inherit;pointer-events:none;' +
      'border:' + o.borderWidth + 'px solid ' + o.borderColor + ';' +
      'border-top-color:' + topColor + ';' +
      'border-bottom-color:rgba(255,255,255,' + Math.max(0.05, baseAlpha * 0.4).toFixed(2) + ');';

    // ── Specular
    this.thumbSpec = document.createElement('div');
    this.thumbSpec.style.cssText =
      'position:absolute;inset:0;border-radius:inherit;pointer-events:none;' +
      'opacity:' + o.specular + ';' +
      'background:linear-gradient(170deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.08) 30%, transparent 55%);';

    // ── Inner shadow
    this.thumbInner = document.createElement('div');
    this.thumbInner.style.cssText =
      'position:absolute;inset:0;border-radius:inherit;pointer-events:none;' +
      'box-shadow:inset 0 -1px 3px rgba(0,0,0,0.06), inset 0 1px 2px rgba(255,255,255,0.06);';

    // Assemble
    this.thumb.appendChild(this.thumbBorder);
    this.thumb.appendChild(this.thumbSpec);
    this.thumb.appendChild(this.thumbInner);
    this.track.appendChild(this.fill);
    this.track.appendChild(this.thumb);
    this.container.appendChild(this.track);
  };

  GlassSlider.prototype._parseBorderAlpha = function() {
    var m = this.o.borderColor.match(/[\d.]+(?=\))/);
    return m ? parseFloat(m[0]) : 0.45;
  };

  GlassSlider.prototype._buildBackdropFilter = function(blur, sat, bright) {
    var parts = [];
    // In WebGL mode, displacement is done by shader, not backdrop-filter
    if (this._filter && !this._useWebGL) {
      parts.push('url(#' + this._filter.id + ')');
    }
    parts.push('blur(' + blur.toFixed(1) + 'px)');
    parts.push('saturate(' + sat.toFixed(2) + ')');
    parts.push('brightness(' + bright + ')');
    return parts.join(' ');
  };

  GlassSlider.prototype._bindEvents = function() {
    var self = this;
    var isV = self.o.orientation === 'vertical';

    function start(e) {
      e.preventDefault();
      self.dragging = true;
      self.thumb.style.cursor = 'grabbing';
      self.thumb.style.transform = isV
        ? 'translate(-50%,50%) scale(1.04)'
        : 'translate(-50%,-50%) scale(1.04)';
      if (self.o.shadow) {
        self.thumb.style.boxShadow =
          '0 4px 12px rgba(0,0,0,0.14), 0 10px 28px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.10)';
      }
      doMove(e.touches ? e.touches[0] : e);
    }

    function doMove(e) {
      var r = self.track.getBoundingClientRect();
      var pct;
      if (isV) {
        pct = clamp(1 - ((e.clientY - r.top) / r.height), 0, 1);
      } else {
        pct = clamp((e.clientX - r.left) / r.width, 0, 1);
      }
      var o = self.o;
      var steps = Math.round((pct * (o.max - o.min)) / o.step);
      self.value = clamp(o.min + steps * o.step, o.min, o.max);
      self._setPos();
      if (o.onChange) o.onChange(self.value);
    }

    function move(e) {
      if (!self.dragging) return;
      doMove(e.touches ? e.touches[0] : e);
    }

    function end() {
      if (!self.dragging) return;
      self.dragging = false;
      self.thumb.style.cursor = 'grab';
      self.thumb.style.transform = isV
        ? 'translate(-50%,50%)'
        : 'translate(-50%,-50%)';
      if (self.o.shadow) {
        self.thumb.style.boxShadow =
          '0 2px 8px rgba(0,0,0,0.10), 0 6px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.08)';
      }
    }

    this.track.addEventListener('mousedown', start);
    this.track.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);

    this.thumb.addEventListener('mousemove', function(e) {
      var r = self.thumb.getBoundingClientRect();
      self.mx = clamp((e.clientX - r.left) / r.width, 0, 1);
      self.my = clamp((e.clientY - r.top) / r.height, 0, 1);
    });

    this._cleanup = function() {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchend', end);
    };
  };

  GlassSlider.prototype._setPos = function() {
    var o = this.o;
    var pct = ((this.value - o.min) / (o.max - o.min)) * 100;
    if (o.orientation === 'vertical') {
      this.fill.style.height = pct + '%';
      this.thumb.style.bottom = pct + '%';
    } else {
      this.fill.style.width = pct + '%';
      this.thumb.style.left = pct + '%';
    }
  };

  GlassSlider.prototype._tick = function(ts) {
    if (this.destroyed) return;
    var o = this.o;

    // ── Drag intensity: ramps up when dragging, decays on release
    var dragTarget = this.dragging ? 1 : 0;
    if (dragTarget > this.dragIntensity) {
      this.dragIntensity = lerp(this.dragIntensity, dragTarget, 0.25);
    } else {
      this.dragIntensity = lerp(this.dragIntensity, dragTarget, 0.08);
    }
    if (this.dragIntensity < 0.001) this.dragIntensity = 0;

    // ── Dynamic refraction scale (drag-reactive only)
    var dynRefraction = o.refraction;
    if (this._filter) {
      if (o.dragRefraction) {
        dynRefraction = o.refraction * this.dragIntensity;
      }
      this._filter.disp.setAttribute('scale', dynRefraction.toFixed(1));
    }

    // ── WebGL fallback: render displaced background
    if (this._gl && this._gl.ok) {
      var tr = this.thumb.getBoundingClientRect();
      this._gl.draw(tr.left, tr.top, tr.width, tr.height,
        window.innerWidth, window.innerHeight, dynRefraction);
    }

    // ── Specular follows cursor / gentle idle animation
    var t = ts * 0.001;
    var sx, sy;
    if (this.dragging) {
      sx = 30 + this.mx * 40;
      sy = 15 + this.my * 30;
    } else {
      sx = 42 + Math.sin(t * 0.2) * 8;
      sy = 22 + Math.cos(t * 0.18) * 5;
    }
    this.thumbSpec.style.background =
      'linear-gradient(' + (165 + (sx - 50) * 0.3).toFixed(0) + 'deg, ' +
      'rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.06) 30%, transparent 55%)';

    this.raf = requestAnimationFrame(this._tick);
  };

  GlassSlider.prototype.setValue = function(v) {
    this.value = clamp(v, this.o.min, this.o.max);
    this._setPos();
  };

  /**
   * Zmienia przezroczystość tła thumba (tint alpha).
   * @param {number} alpha — 0 (w pełni przezroczysty) do 1 (biały)
   */
  GlassSlider.prototype.setTint = function(alpha) {
    this._tintAlpha = clamp(alpha, 0, 1);
    this.o.tint = 'rgba(255,255,255,' + this._tintAlpha.toFixed(3) + ')';
  };

  /** Zwraca bieżącą wartość tint alpha */
  GlassSlider.prototype.getTintAlpha = function() {
    if (this._tintAlpha !== undefined) return this._tintAlpha;
    // Parse from initial tint
    var m = this.o.tint.match(/[\d.]+(?=\))/);
    return m ? parseFloat(m[0]) : 0.04;
  };

  GlassSlider.prototype.destroy = function() {
    this.destroyed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this._cleanup) this._cleanup();
    if (this._gl) this._gl.destroy();
    if (this._filter) this._filter.svg.remove();
    this.container.innerHTML = '';
  };

  // =================================================================
  //  GlassElement (panele, navbary, karty)
  // =================================================================

  function GlassElement(el, opts) {
    this.el = el;
    var d = {
      blur: 12,
      saturate: 1.8,
      brightness: 1.05,
      refraction: 0,
      refractionFreq: 0.008,
      refractionOctaves: 1,
      borderRadius: 20,
      specular: 0.35,
      edgeLight: 0.5,
      border: true,
      shadow: true,
      tint: 'rgba(255,255,255,0.06)',
      interactive: true,
    };
    this.o = {};
    for (var k in d) this.o[k] = opts && opts[k] !== undefined ? opts[k] : d[k];

    this.mx = 0.5; this.my = 0.5;
    this.tmx = 0.5; this.tmy = 0.5;
    this.hover = false;
    this.raf = null;
    this.destroyed = false;
    this._filter = null;

    this._build();
    this._bind();
    this._tick = this._tick.bind(this);
    this.raf = requestAnimationFrame(this._tick);
  }

  GlassElement.prototype._build = function() {
    var o = this.o;
    var s = this.el.style;
    // Save original styles for restore on destroy
    this._saved = {
      position: s.position,
      overflow: s.overflow,
      borderRadius: s.borderRadius,
      background: s.background,
      backdropFilter: s.backdropFilter,
      webkitBackdropFilter: s.webkitBackdropFilter,
      boxShadow: s.boxShadow,
    };
    if (!s.position || s.position === 'static') s.position = 'relative';
    s.overflow = 'hidden';
    s.borderRadius = o.borderRadius + 'px';
    s.background = o.tint;
    this.el.classList.add('demiglass');

    // SVG refraction
    var hasRefraction = o.refraction > 0;
    if (hasRefraction) {
      this._filter = makeRefractionFilter(o);
    }

    // Detect Safari fallback — use WebGL for lens modes
    this._useWebGL = hasRefraction && this._filter && this._filter.mapURI && !testBackdropUrl();

    var bdParts = [];
    if (this._filter && !this._useWebGL) bdParts.push('url(#' + this._filter.id + ')');
    bdParts.push('blur(' + o.blur + 'px) saturate(' + o.saturate + ') brightness(' + o.brightness + ')');
    var bd = bdParts.join(' ');
    s.webkitBackdropFilter = bd;
    s.backdropFilter = bd;

    // WebGL fallback: displacement via GPU shader
    this._gl = null;
    if (this._useWebGL) {
      var self = this;
      var rect = this.el.getBoundingClientRect();
      this._gl = new GLDisplacer(rect.width || 200, rect.height || 200, this._filter.mapURI);
      if (this._gl.ok) {
        this._gl.canvas.style.filter =
          'blur(' + o.blur + 'px) saturate(' + o.saturate + ') brightness(' + o.brightness + ')';
        this.el.insertBefore(this._gl.canvas, this.el.firstChild);
        _captureBg(window.innerWidth, window.innerHeight, function(bgCanvas) {
          if (self._gl && self._gl.ok) self._gl.setBg(bgCanvas);
        });
      } else {
        this._useWebGL = false;
        this._gl = null;
      }
    }

    if (o.shadow) {
      s.boxShadow = '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)';
    }

    // Specular
    this.spec = document.createElement('div');
    this.spec.style.cssText =
      'position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:5;' +
      'opacity:' + o.specular + ';' +
      'background:linear-gradient(170deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 30%, transparent 55%);';

    // Border
    if (o.border) {
      this.borderEl = document.createElement('div');
      this.borderEl.style.cssText =
        'position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:6;' +
        'border:0.5px solid rgba(255,255,255,0.18);' +
        'border-top-color:rgba(255,255,255,0.35);' +
        'border-bottom-color:rgba(255,255,255,0.06);';
    }

    // Inner shadow
    this.innerShadow = document.createElement('div');
    this.innerShadow.style.cssText =
      'position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:4;' +
      'box-shadow:inset 0 -1px 3px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,0.05);';

    this.el.appendChild(this.spec);
    this.el.appendChild(this.innerShadow);
    if (this.borderEl) this.el.appendChild(this.borderEl);
  };

  GlassElement.prototype._bind = function() {
    if (!this.o.interactive) return;
    var self = this;
    this._onMove = function(e) {
      var r = self.el.getBoundingClientRect();
      self.tmx = clamp((e.clientX - r.left) / r.width, 0, 1);
      self.tmy = clamp((e.clientY - r.top) / r.height, 0, 1);
    };
    this._onEnter = function() { self.hover = true; };
    this._onLeave = function() { self.hover = false; self.tmx = 0.5; self.tmy = 0.5; };
    this.el.addEventListener('mousemove', this._onMove);
    this.el.addEventListener('mouseenter', this._onEnter);
    this.el.addEventListener('mouseleave', this._onLeave);
  };

  GlassElement.prototype._tick = function(ts) {
    if (this.destroyed) return;
    var t = ts * 0.001;
    this.mx = lerp(this.mx, this.tmx, 0.1);
    this.my = lerp(this.my, this.tmy, 0.1);

    var sx = this.hover ? (30 + this.mx * 40) : (45 + Math.sin(t * 0.2) * 8);
    this.spec.style.background =
      'linear-gradient(' + (165 + (sx - 50) * 0.4).toFixed(0) + 'deg, ' +
      'rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 30%, transparent 55%)';

    if (this.borderEl) {
      var el = this.o.edgeLight;
      var ly = this.hover ? this.my : 0.35;
      var tA = (0.25 + (1 - ly) * el * 0.3).toFixed(3);
      var bA = (0.04 + ly * el * 0.08).toFixed(3);
      this.borderEl.style.borderTopColor = 'rgba(255,255,255,' + tA + ')';
      this.borderEl.style.borderBottomColor = 'rgba(255,255,255,' + bA + ')';
    }

    // WebGL fallback: render displaced background
    if (this._gl && this._gl.ok) {
      var r = this.el.getBoundingClientRect();
      this._gl.draw(r.left, r.top, r.width, r.height,
        window.innerWidth, window.innerHeight, this.o.refraction);
    }

    this.raf = requestAnimationFrame(this._tick);
  };

  GlassElement.prototype.update = function(opts) {
    for (var k in opts) this.o[k] = opts[k];
  };

  GlassElement.prototype.destroy = function() {
    this.destroyed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this._onMove) {
      this.el.removeEventListener('mousemove', this._onMove);
      this.el.removeEventListener('mouseenter', this._onEnter);
      this.el.removeEventListener('mouseleave', this._onLeave);
    }
    if (this._gl) this._gl.destroy();
    [this.spec, this.innerShadow, this.borderEl].forEach(function(e) { if (e) e.remove(); });
    if (this._filter) this._filter.svg.remove();
    this.el.classList.remove('demiglass');
    // Restore original styles
    if (this._saved) {
      var s = this.el.style;
      var sv = this._saved;
      s.position = sv.position;
      s.overflow = sv.overflow;
      s.borderRadius = sv.borderRadius;
      s.background = sv.background;
      s.backdropFilter = sv.backdropFilter;
      s.webkitBackdropFilter = sv.webkitBackdropFilter;
      s.boxShadow = sv.boxShadow;
    }
  };

  // =================================================================
  //  Public API
  // =================================================================

  var instances = new Map();

  return {
    version: '6.2.0',

    setBackground: function(css, attachment) {
      _bgCSS = css || '';
      _bgAttachment = attachment || 'fixed';
      _bgSource = null; // invalidate cached texture
    },

    /** Provide a pre-rendered Image/Canvas as the background source for WebGL fallback */
    setBackgroundSource: function(source) {
      _bgSource = source;
    },

    slider: function(container, opts) {
      return new GlassSlider(container, opts);
    },

    init: function(target, opts) {
      var els = typeof target === 'string'
        ? document.querySelectorAll(target)
        : target instanceof NodeList ? target : [target];
      var res = [];
      els.forEach(function(el) {
        var inst = new GlassElement(el, opts);
        var id = 'lg_' + Math.random().toString(36).slice(2, 8);
        el._lgId = id;
        instances.set(id, inst);
        res.push(inst);
      });
      return res.length === 1 ? res[0] : res;
    },

    destroy: function(target) {
      var els = typeof target === 'string' ? document.querySelectorAll(target) : [target];
      els.forEach(function(el) {
        if (el._lgId && instances.has(el._lgId)) {
          instances.get(el._lgId).destroy();
          instances.delete(el._lgId);
          delete el._lgId;
        }
      });
    },

    destroyAll: function() {
      instances.forEach(function(i) { i.destroy(); });
      instances.clear();
    },
  };
});

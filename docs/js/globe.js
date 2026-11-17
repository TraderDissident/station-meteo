/* Globe en WebGL 1 (iOS 12) : la Terre éclairée par le soleil à la minute, textures du style choisi,
   halo d'atmosphère, rotation lente et au doigt. Tout le calcul de lumière se fait dans le shader. */
(function () {
  var RAD = Math.PI / 180;

  var VS = 'attribute vec2 p; varying vec2 v; void main() { v = p; gl_Position = vec4(p, 0.0, 1.0); }';
  var FS = [
    'varying vec2 v;',
    'uniform sampler2D uDay; uniform sampler2D uNight;',
    'uniform mat3 uRot; uniform vec3 uSun; uniform float uR;',
    'uniform vec4 uTw; uniform float uSoft; uniform vec4 uTerm; uniform vec3 uAtm;',
    'void main() {',
    '  vec2 q = v / uR; float r2 = dot(q, q);',
    '  if (r2 > 1.0) {',
    '    float d = sqrt(r2) - 1.0; float a = exp(-d * 30.0) * 0.65;',
    '    gl_FragColor = vec4(uAtm * a, a); return;',
    '  }',
    '  float z = sqrt(1.0 - r2);',
    '  vec3 w = uRot * vec3(q.x, q.y, z);',
    '  float lat = asin(clamp(w.y, -1.0, 1.0)); float lon = atan(w.x, w.z);',
    '  vec2 uv = vec2(lon / 6.2831853 + 0.5, 0.5 - lat / 3.1415927);',
    '  vec3 day = texture2D(uDay, uv).rgb; vec3 night = texture2D(uNight, uv).rgb;',
    '  float alt = degrees(asin(clamp(dot(w, uSun), -1.0, 1.0)));',
    '  float df = uSoft > 0.5 ? clamp((alt + 6.0) / 9.0, 0.0, 1.0) : clamp((alt + 1.2) / 2.4, 0.0, 1.0);',
    '  df = df * df * (3.0 - 2.0 * df);',
    '  vec3 col = mix(night, day, df);',
    '  float tw = max(0.0, 1.0 - abs(alt + 2.0) / 6.5);',
    '  col = mix(col, uTw.rgb, tw * tw * uTw.a);',
    '  if (uTerm.a > 0.0) { col = mix(col, uTerm.rgb, (1.0 - smoothstep(0.3, 0.8, abs(alt))) * uTerm.a); }',
    '  float rim = pow(1.0 - z, 2.5);',
    '  col = col * (0.8 + 0.2 * z) + uAtm * rim * (0.2 + 0.6 * df);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  var G = { lon: 0, lat: 20, spin: 2, dragging: false, pausedUntil: 0 };
  var cv = null, gl = null, prog = null, loc = {}, tex = {}, size = 0, R = 0.86, raf = 0, last = 0, onFrame = null;
  var params = { soft: 1, tw: [1, 0.55, 0.3, 0.36], term: [1, 1, 1, 0], atm: [0.35, 0.6, 1] };
  var sun = [0, 0, 1], F9 = new Float32Array(9);

  G.supported = function () {
    if (G._sup !== undefined) return G._sup;
    try {
      var c = document.createElement('canvas');
      G._sup = !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { G._sup = false; }
    return G._sup;
  };

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s));
    return s;
  }

  /* Crée le canevas WebGL dans le conteneur. Renvoie false si WebGL manque. */
  G.attach = function (box, frameCb) {
    G.detach();
    cv = document.createElement('canvas');
    cv.className = 'gcv';
    var opts = { alpha: true, premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: false };
    gl = cv.getContext('webgl', opts) || cv.getContext('experimental-webgl', opts);
    if (!gl) { cv = null; return false; }
    var hp = gl.getShaderPrecisionFormat && gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    var prec = hp && hp.precision > 0 ? 'precision highp float;\n' : 'precision mediump float;\n';
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, prec + FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(prog));
    } catch (e) { SM.diag.error('globe ' + e.message); cv = null; gl = null; return false; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var p = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
    ['uDay', 'uNight', 'uRot', 'uSun', 'uR', 'uTw', 'uSoft', 'uTerm', 'uAtm'].forEach(function (n) { loc[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1i(loc.uDay, 0); gl.uniform1i(loc.uNight, 1);
    tex.day = gl.createTexture(); tex.night = gl.createTexture();
    box.appendChild(cv);
    onFrame = frameCb;
    bindDrag();
    return true;
  };

  G.detach = function () {
    cancelAnimationFrame(raf); raf = 0;
    if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
    if (gl && gl.getExtension('WEBGL_lose_context')) gl.getExtension('WEBGL_lose_context').loseContext();
    cv = null; gl = null; prog = null;
  };

  G.active = function () { return !!gl; };

  function upload(t, unit, src) {
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // 2048 × 1024 : puissance de deux, la longitude peut boucler sans couture.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  G.setTextures = function (day, night) {
    if (!gl) return;
    upload(tex.day, gl.TEXTURE0, day);
    upload(tex.night, gl.TEXTURE1, night);
    G.draw();
  };

  G.setStyle = function (p) { Object.keys(p).forEach(function (k) { params[k] = p[k]; }); G.draw(); };

  /* Taille du canevas : carré de côté s (px CSS), sphère un peu plus petite pour laisser le halo. */
  G.resize = function (s) {
    if (!cv) return;
    var pr = Math.min(window.devicePixelRatio || 1, 2);
    size = s;
    cv.width = Math.round(s * pr); cv.height = Math.round(s * pr);
    cv.style.width = s + 'px'; cv.style.height = s + 'px';
    cv.style.marginLeft = cv.style.marginTop = (-s / 2) + 'px';
    gl.viewport(0, 0, cv.width, cv.height);
    G.draw();
  };

  G.setSun = function (lat, lon) {
    var a = lat * RAD, b = lon * RAD;
    sun = [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)];
  };

  /* Rotation vue → monde : Ry(longitude du centre) · Rx(−latitude du centre). */
  function rot() {
    var a = -G.lat * RAD, b = G.lon * RAD, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    // Ligne par ligne : Ry · Rx
    return [
      [cb, sb * sa, sb * ca],
      [0, ca, -sa],
      [-sb, cb * sa, cb * ca]
    ];
  }

  G.draw = function () {
    if (!gl) return;
    var m = rot();
    // Tableaux réutilisés d'une image à l'autre : 30 images par seconde sans rien laisser au ramasse-miettes.
    F9[0] = m[0][0]; F9[1] = m[1][0]; F9[2] = m[2][0]; F9[3] = m[0][1]; F9[4] = m[1][1]; F9[5] = m[2][1]; F9[6] = m[0][2]; F9[7] = m[1][2]; F9[8] = m[2][2];
    gl.uniformMatrix3fv(loc.uRot, false, F9);
    gl.uniform3f(loc.uSun, sun[0], sun[1], sun[2]);
    gl.uniform1f(loc.uR, R);
    gl.uniform4f(loc.uTw, params.tw[0], params.tw[1], params.tw[2], params.tw[3]);
    gl.uniform1f(loc.uSoft, params.soft);
    gl.uniform4f(loc.uTerm, params.term[0], params.term[1], params.term[2], params.term[3]);
    gl.uniform3f(loc.uAtm, params.atm[0], params.atm[1], params.atm[2]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (onFrame) onFrame();
  };

  /* Position à l'écran (px CSS depuis le centre du globe) et visibilité d'un point de la Terre. */
  G.project = function (lat, lon) {
    var a = lat * RAD, b = lon * RAD;
    var w = [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)];
    var m = rot();
    // Vue = transposée(rot) · monde
    var x = m[0][0] * w[0] + m[1][0] * w[1] + m[2][0] * w[2];
    var y = m[0][1] * w[0] + m[1][1] * w[1] + m[2][1] * w[2];
    var z = m[0][2] * w[0] + m[1][2] * w[1] + m[2][2] * w[2];
    var rpx = size / 2 * R;
    return { x: x * rpx, y: -y * rpx, front: z > 0.08, z: z };
  };
  G.radius = function () { return size / 2 * R; };

  /* Rotation lente et continue, à 30 images par seconde au plus ; arrêtée pendant le geste et peu après. */
  G.run = function () {
    cancelAnimationFrame(raf);
    last = 0;
    function frame(ts) {
      if (!gl) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (last && ts - last < 32) return;
      var dt = last ? Math.min(ts - last, 100) / 1000 : 0;
      last = ts;
      if (!G.dragging && Date.now() > G.pausedUntil && G.spin) { G.lon = ((G.lon + G.spin * dt + 540) % 360) - 180; G.draw(); }
    }
    raf = requestAnimationFrame(frame);
  };

  function bindDrag() {
    var sx = 0, sy = 0, lon0 = 0, lat0 = 0;
    function start(x, y) { G.dragging = true; sx = x; sy = y; lon0 = G.lon; lat0 = G.lat; }
    function move(x, y) {
      if (!G.dragging) return;
      var k = 90 / Math.max(G.radius(), 50);
      G.lon = ((lon0 - (x - sx) * k + 540) % 360) - 180;
      G.lat = Math.max(-70, Math.min(70, lat0 + (y - sy) * k));
      G.draw();
    }
    function end() { if (G.dragging) { G.dragging = false; G.pausedUntil = 0; if (onFrame) onFrame(true); } }
    cv.addEventListener('touchstart', function (e) { if (e.touches.length === 1) start(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    cv.addEventListener('touchmove', function (e) { if (G.dragging && e.touches.length === 1) { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: false });
    cv.addEventListener('touchend', end, { passive: true });
    cv.addEventListener('touchcancel', end, { passive: true });
    cv.addEventListener('mousedown', function (e) { start(e.clientX, e.clientY); e.preventDefault(); });
    // Souris (essais sur Mac) : écouteurs posés une seule fois sur la fenêtre.
    G._move = move; G._end = end;
    if (!G._win) {
      G._win = true;
      window.addEventListener('mousemove', function (e) { if (G._move) G._move(e.clientX, e.clientY); });
      window.addEventListener('mouseup', function () { if (G._end) G._end(); });
    }
  }

  SM.globe = G;
})();

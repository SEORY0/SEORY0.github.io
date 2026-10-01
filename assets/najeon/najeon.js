// najeon 1.0.0 — generated from spec/najeon.spec.json. Do not edit.
const FRAG = "// najeon 1.0.0 — generated from spec/najeon.spec.json. Do not edit.\nprecision highp float;\n\nuniform vec2  uResolution;\nuniform float uTime;\nuniform float uAngle;   // 관찰각. 색 궤적을 따라 미끄러진다.\nuniform float uScale;\n\nconst int NSTOPS = 15;\nvec3 stops[NSTOPS];\n\nvoid initStops() {\n  stops[0] = vec3(0.5490,0.5255,0.7373);\n  stops[1] = vec3(0.4392,0.6314,0.7882);\n  stops[2] = vec3(0.5608,0.7961,0.6588);\n  stops[3] = vec3(0.7490,0.9255,0.7373);\n  stops[4] = vec3(0.9529,0.8196,0.6039);\n  stops[5] = vec3(0.8784,0.6196,0.6667);\n  stops[6] = vec3(0.6627,0.5020,0.6745);\n  stops[7] = vec3(0.5255,0.4941,0.7020);\n  stops[8] = vec3(0.4196,0.5412,0.7255);\n  stops[9] = vec3(0.3529,0.6549,0.5961);\n  stops[10] = vec3(0.5020,0.7412,0.6078);\n  stops[11] = vec3(0.5961,0.8118,0.6588);\n  stops[12] = vec3(0.6745,0.8275,0.6353);\n  stops[13] = vec3(0.8784,0.6706,0.8275);\n  stops[14] = vec3(0.8157,0.6118,0.7686);\n}\n\n// 유도 궤적 조회. u는 0..1로 감긴 두께장 값.\n// GLSL ES 1.0은 변수 첨자를 못 쓰므로 루프 인덱스로 우회한다.\nvec3 locus(float u) {\n  u = fract(u) * float(NSTOPS);\n  float fi = floor(u);\n  float f = fract(u);\n  float ni = mod(fi + 1.0, float(NSTOPS));\n  vec3 a = stops[0];\n  vec3 b = stops[0];\n  for (int k = 0; k < NSTOPS; k++) {\n    if (float(k) == fi) a = stops[k];\n    if (float(k) == ni) b = stops[k];\n  }\n  return mix(a, b, smoothstep(0.0, 1.0, f));\n}\n\n// sin 없는 해시. sin 기반은 픽셀당 수십 번 불리면 저사양 GPU와\n// 소프트웨어 렌더러에서 프레임을 못 맞춘다.\nfloat hash(vec2 p) {\n  vec2 q = fract(p * vec2(233.34, 851.73));\n  q += dot(q, q + 23.45);\n  return fract(q.x * q.y);\n}\n\nfloat vnoise(vec2 p) {\n  vec2 i = floor(p), f = fract(p);\n  vec2 u = f * f * (3.0 - 2.0 * f);\n  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),\n             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);\n}\n\nfloat fbm(vec2 p) {\n  float v = 0.0, a = 0.5;\n  for (int i = 0; i < 2; i++) {\n    v += a * vnoise(p);\n    p *= 2.03;\n    a *= 0.5;\n  }\n  return v;\n}\n\nvoid main() {\n  initStops();\n\n  vec2 uv = gl_FragCoord.xy / uResolution;\n  vec2 p = uv * vec2(uResolution.x / uResolution.y, 1.0) * uScale;\n\n  // 겹 1 — 도메인 워핑으로 두께장.\n  // 워핑 결과를 한 번 더 접어 대리석 같은 결을 만든다. 레퍼런스의 자개는\n  // 뭉개진 얼룩이 아니라 흐르다 접힌 띠다.\n  float f = 1.200;\n  float amp = 3.600;\n  // 이방성을 좌표 단계에서 한 번 건다. 여기서 걸어야 워핑 잡음까지 결을\n  // 물려받는다. 뒤에서 걸면 등방성 q가 섞여 들어와 정렬이 희석된다.\n  // 등방성 잡음은 죽처럼 뭉개져 \"잔잔한 곳이 비어\" 보인다.\n  vec2 pa = vec2(p.x, p.y / 0.350);\n\n  vec2 q = vec2(fbm(pa * f + 1.7), fbm(pa * f + 8.3));\n  vec2 w = pa * f + amp * q;\n  float thickness = fbm(w + 0.5 * vec2(q.y, -q.x));\n\n  // 접힌 띠. abs로 되접으면 가장자리가 또렷해진다.\n  float fold = 1.0 - abs(2.0 * fract(thickness * 1.7 + q.x * 0.5) - 1.0);\n  thickness = mix(thickness, fold, 0.18);\n\n  // 겹 2 — 이방성 결이 두께장을 변조\n  float ga = radians(74.0);\n  vec2 dir = vec2(cos(ga), sin(ga));\n  float stripe = sin(dot(p, dir) * 38.00 + q.y * 6.28);\n  thickness += 0.020 * stripe * 0.25;\n\n  // 관찰각이 궤적 위를 미끄러진다 -- 실제 자개가 각도로 색이 바뀌는 것\n  float phase = 0.0625 + uAngle * 0.35 + uTime * 0.01;\n  float cyc = 2.600;\n\n  // 여러 깊이의 적층을 동시에 본다. 한 겹만 조회하면 바탕 하나에 섬광\n  // 하나가 되어 중간색이 안 생긴다. 겹쳐야 색이 섞인다.\n  float deep = q.y * 1.35 + thickness * 0.28;\n  vec3 col = mix(locus(thickness * cyc + phase),\n                 locus(deep * cyc + phase + 0.31),\n                 0.200);\n\n  // 발색 피복. 색은 표면 전체가 아니라 군데군데 번쩍인다.\n  // 전면 발색은 자개가 아니라 기름막으로 읽힌다 (두 번째 검증에서 확인).\n  // 마스크는 별도 잡음으로 뽑는다. q.x를 재사용하면 접힘과 상관이 생겨\n  // 넓은 무채색 구역이 만들어진다 (타일은 처음부터 별도 잡음을 썼고,\n  // 그래서 같은 스펙인데 셰이더만 okC 0.029, 타일 0.039로 갈렸다).\n  float iris = smoothstep(0.075,\n                          0.695,\n                          vnoise(p * 0.85 + 61.0));\n  col = mix(vec3(0.6314,0.6549,0.7137), col, iris);\n\n  // 섬광. 자개의 서명이다.\n  //\n  // 주변 색을 진하게 하는 게 아니라 정해진 민트로 간다. 레퍼런스에서\n  // 상위 4% 채도 화소의 70%가 색상각 160-180도에 몰려 있다 -- 어디서\n  // 터지든 민트색이다.\n  float fl = exp(-pow((thickness - 0.520) /\n                       0.075, 2.0));\n  // 솎아내기. 등두께선 전체를 따라가면 굵은 리본이 된다.\n  fl *= smoothstep(0.760,\n                   0.980, vnoise(p * 1.35 + 51.0));\n  col = mix(col, vec3(0.5137,0.9608,0.8118), fl * 0.950);\n\n\n  // 음영. 면이 평평하지 않아 곳곳이 빛을 다르게 받는다.\n  //\n  // RGB를 곱해 내리면 안 된다. 검정 쪽으로 눌리면서 민트가 카키가 되고\n  // 파랑이 먼지 낀 색이 된다 -- 색마다 회색이 들어가는 그 탁함이다.\n  // 자개의 명암은 어두워지는 게 아니라 옅어지는 쪽으로 움직인다.\n  float shade = (q.y - 0.42) * 2.0;\n  col = mix(col, vec3(0.97), clamp(-shade, 0.0, 1.0) * 0.580);\n  col += max(0.0, shade) * 0.1276;\n\n  // 겹 3 — 광택.\n  //\n  // 화면을 가로지르는 띠가 아니라 면의 기울기에 묶는다. 띠는 어디에\n  // 걸리느냐가 화면 위치에 따라 정해져서 재질이 아니라 조명 장치처럼 보인다.\n  // 실제 정반사는 빛 쪽으로 기운 면에서 생긴다.\n  float sa = radians(101.0);\n  vec2 ldir = vec2(cos(sa), sin(sa));\n  float slope = fbm(pa * f + 8.3 + ldir * 0.4) - q.y;\n  float spec = smoothstep(0.1200,\n                          0.1700, slope);\n  col += pow(spec, 0.80) * (1.0 - col)\n       * 0.650;\n\n  // 겹 4 — 미세립\n  float micro = hash(gl_FragCoord.xy * 0.850);\n  col += (micro - 0.5) * 0.0140;\n\n  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);\n}\n";

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed');
  }
  return sh;
}

/**
 * 캔버스에 자개를 그린다.
 *
 * WebGL을 못 쓰거나 컨텍스트가 날아가면 PNG 타일로 후퇴한다. 타일은 같은
 * 스펙에서 같은 모델로 나온 것이라 다른 재질이 되지 않는다.
 * 반환값의 destroy()를 부르면 애니메이션 루프와 리스너가 정리된다.
 */
export function najeon(canvas, opts = {}) {
  // scale이 크면 얼룩이 잘게 부서져 자개가 아니라 기름막처럼 보인다.
  // pixelBudget은 픽셀당 비용이 큰 셰이더라 필요하다. 큰 면을 DPR 2로
  // 그리면 저사양 GPU와 소프트웨어 렌더러에서 컨텍스트가 날아간다.
  const {
    scale = 1.25, angle = 0.0, interactive = true, animate = true,
    pixelBudget = 1200000,
    tileUrl = new URL('./tiles/najeon-1024.png', import.meta.url).href,
  } = opts;

  // WebGL을 못 쓰면 타일로 후퇴한다. 타일은 같은 스펙에서 같은 모델로
  // 나온 것이라, 후퇴해도 다른 재질이 되지 않는다.
  function fallback() {
    canvas.style.backgroundImage = 'url(' + tileUrl + ')';
    canvas.style.backgroundSize = 'cover';
    return {
      destroy() {
        canvas.style.backgroundImage = '';
        canvas.style.backgroundSize = '';
      },
    };
  }

  let gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false })
      || canvas.getContext('experimental-webgl');
  } catch (err) {
    gl = null;
  }

  if (!gl) return fallback();

  let viewAngle = angle;
  let raf = 0;
  let running = true;
  const start = performance.now();

  // 컨텍스트는 실제 기기에서도 날아간다 -- GPU가 자원을 회수하거나 탭이
  // 오래 묻혀 있으면. 흰 화면을 남기지 않고 CSS로 후퇴한다.
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    running = false;
    cancelAnimationFrame(raf);
    canvas.style.backgroundImage = 'url(' + tileUrl + ')';
    canvas.style.backgroundSize = 'cover';
  });

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'link failed');
    }
  } catch (err) {
    return fallback();
  }

  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uAngle = gl.getUniformLocation(program, 'uAngle');
  const uScale = gl.getUniformLocation(program, 'uScale');

  function resize() {
    const css = Math.max(1, canvas.clientWidth) * Math.max(1, canvas.clientHeight);
    // 픽셀 예산 안에 들도록 DPR을 깎는다. 큰 면일수록 선명도를 양보한다.
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(pixelBudget / css));
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function draw() {
    if (!running) return;
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, animate ? (performance.now() - start) / 1000 : 0);
    gl.uniform1f(uAngle, viewAngle);
    gl.uniform1f(uScale, scale);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // 정지한 면을 매 프레임 다시 그릴 이유가 없다. 셰이더가 픽셀당 fbm을
  // 일곱 번 부르므로 소프트웨어 GL에서는 그러다 컨텍스트가 죽는다.
  // 바뀔 때만 그린다.
  let pending = false;
  function invalidate() {
    if (pending || !running) return;
    pending = true;
    raf = requestAnimationFrame(() => {
      pending = false;
      draw();
    });
  }

  function loop() {
    if (!running) return;
    draw();
    raf = requestAnimationFrame(loop);
  }

  function onPointer(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    viewAngle = angle + x * 1.2 + y * 0.6;
    if (!animate) invalidate();
  }

  const observer = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => invalidate())
    : null;
  if (observer && !animate) observer.observe(canvas);

  if (interactive) window.addEventListener('pointermove', onPointer, { passive: true });

  if (animate) loop();
  else draw();

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
      if (interactive) window.removeEventListener('pointermove', onPointer);
    },
  };
}

export default najeon;

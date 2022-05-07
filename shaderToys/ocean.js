// shadertoy2021展示作品
// https://www.shadertoy.com/view/7dyXWC#
// author:rockhard

// 移したやつ（去年の1月下旬）
// datでいじれるよ

let config = {
  seaColor:{r:0,g:99,b:158}
};

(function(){
  let gui = new dat.GUI({width:240});
  gui.addColor(config, 'seaColor');

})();

let sh;

let vs =
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

let fs =
"precision mediump float;" +
"uniform float uTime;" + // 秒数でよいかと
"uniform vec2 uResolution;" + // 全体の大きさでよいかと
"uniform sampler2D uTexture;" + // ランダム
"uniform vec3 uSeaColor;" +
"float wavedx(vec2 position, vec2 direction, float time, float freq){" +
"  float x = dot(direction, position) * freq + time;" +
"  return exp(sin(x) - 1.0);" +
"}" +
"float getwaves(vec2 position){" +
"  float iter = 0.0;" +
"  float phase = 6.0;" +
"  float speed = 2.0;" +
"  float weight = 1.0;" +
"  float w = 0.0;" +
"  float ws = 0.0;" +
"  for(int i = 0; i < 5; i++){" +
"    vec2 p = vec2(sin(iter), cos(iter));" +
"    float res = wavedx(position, p, speed*uTime, phase);" +
"    w += res * weight;" +
"    ws += weight;" +
"    iter += 12.0;" +
"    weight *= 0.75;" +
"    phase *= 1.18;" +
"    speed *= 1.08;" +
"  }" +
"  return w / ws;" +
"}" +
"float sea_octave(vec2 uv, float choppy){" +
"  return getwaves(uv * choppy) + getwaves(uv);" +
"}" +
"float noise3D(vec3 p){" +
"  vec3 s = vec3(7.0, 157.0, 113.0);" +
"  vec3 ip = floor(p);" + // Unique unit cell ID.
"  vec4 h = vec4(0.0, s.yz, s.y + s.z) + dot(ip, s);" +
"  p -= ip;" + // Cell's fractional component;
"  p = p * p * (3.0 - 2.0 * p);" +
"  h = mix(fract(sin(h) * 43758.5453), fract(sin(h + s.x) * 43758.5453), p.x);" +
"  h.xy = mix(h.xz, h.yw, p.y);" +
"  return mix(h.x, h.y, p.z);" +
"}" +
// borrowed from
// https://www.shadertoy.com/view/Xs33Df
"float smaxP(float a, float b, float s){" +
"  float h = clamp(0.5 + 0.5 * (a - b) / s, 0.0, 1.0);" +
"  return mix(b, a, h) + h * (1.0 - h) * s;" +
"}" +
"vec3 Freq = vec3(0.125, 0.31, 0.128);" +
"vec3 Amp = vec3(1.0, 1.5, 2.5);" +
"vec2 path(float z){" +
"  return vec2(Amp.x * sin(z * Freq.x), Amp.y * cos(z * Freq.y) + Amp.z * (sin(z * Freq.z) - 1.0));" +
"}" +
"float map(vec3 p){" +
"  float n = noise3D(p);" + // ノイズ～～
"  float tx = n;" +
"  vec3 q = p * 0.35;" + // rock.
"  float h = dot(sin(q) * cos(q.yzx), vec3(0.222)) + dot(sin(q * 1.5)*cos(q.yzx * 1.5), vec3(0.111));" +
"  float d = p.y + h * 3.9;" + // some hills.
"  q = sin(p * 0.5 + h);" +
"  h = q.x * q.y * q.z;" + // tunnel walls. ???
"  p.xy -= path(p.z);" + // detail wall. ?????
"  float tnl = 1.5 - length(p.xy * vec2(0.33, 0.66)) + (0.25 - tx * 0.35);" +
"  return smaxP(d, tnl, 2.0) - tx * 0.25 + tnl * 0.8;" +
"}" +
"const int STEP = 36;" +
"const float FAR = 35.0;" +
"float logBisectTrace(vec3 ro, vec3 rd){" +
"  float t = 0.0;" +
"  float told = 0.0;" +
"  float mid, dn;" +
"  float d = map(ro);" +
"  float sgn = sign(d);" +
"  for(int i = 0; i < STEP; i++){" +
"    if(sign(d) != sgn || d < 0.001 || t > FAR){ break; }" +
"    told = t;" +
"    t += step(d, 1.0) * (log(abs(d) + 1.1) - d) + d;" +
"    d = map(rd * t + ro);" +
// If a threshold was crossed without a solution, use the bisection method.
"  }" +
"  if(sign(d) != sgn){" +
"    dn = sign(map(rd * told + ro));" +
"    vec2 iv = vec2(told, t);" + // Near, Far
"    for(int ii = 0; ii < 5; ii++){" +
"      mid = dot(iv, vec2(0.5));" +
"      float d = map(rd * mid + ro);" +
"      if(abs(d) < 0.001){ break; }" +
"      iv = mix(vec2(iv.x, mid), vec2(mid, iv.y), step(0.0, d * dn));" +
"    }" +
"    t = mid;" +
"  }" +
"  return min(t, FAR);" +
"}" +
"vec3 normal(vec3 p, float t){" +
"  vec2 e = vec2(-t, t);" +
"  return normalize(e.yxx * map(p + e.yxx) + e.xxy * map(p + e.xxy) + e.xyx * map(p + e.xyx) + e.y * map(p + e.y));" +
"}" +
"vec3 rotY(vec3 v, float a){" +
"  float c = cos(a);" +
"  float s = sin(a);" +
"  return vec3(c * v.x - s * v.z, v.y, s * v.x + c * v.z);" +
"}" +
//borrowed from
//https://www.shadertoy.com/view/4ls3zM
"void main(){" +
//"  vec2 uv = gl_FragCoord.xy / uResolution.xy - 0.5;" + // -0.5～0.5
//"  uv.x *= uResolution.x / uResolution.y;" + // ...
"  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);" +
"  float time = uTime * 0.2;" +
// 位置計算
"  vec3 pos = (sin(time * 0.14) * 2.0 + 4.5) * vec3(sin(time * 0.5), 0.0, cos(time * 0.5));" +
"  pos.z -= time;" +
"  pos.y += 0.7 * sin(time * 0.2);" +
// dirの計算・・だと思う
"  float rot = -time * 0.5;" +
"  vec3 dir = normalize(vec3(uv, -0.6));" +
"  dir = rotY(dir, rot);" +
// sunベクトル
"  vec3 sun = vec3(-0.6, 0.5, -0.3);" +
"  float i = max(0.0, 1.2 / (length(sun - dir) + 1.0));" +
"  vec3 col = vec3(pow(i, 1.9), pow(i, 1.0), pow(i, 0.8)) * 1.25;" +
// 海の色からベースカラーを決める
"  col = mix(col, uSeaColor, (1.0 - dir.y) * 0.9);" +
// dir.yの符号に応じて海や岩を描画
"  if(dir.y > 0.0){" + // water suf.
"    float d = (pos.y - 3.0) / dir.y;" +
"    vec2 wat = (dir * d).xz - pos.xz;" +
"    d += sin(wat.x + time);" +
"    wat = (dir * d).xz - pos.xz;" +
"    wat = wat * 0.1 + 0.2 * texture2D(uTexture, wat * 0.01).xz;" +
"    col += sea_octave(wat, 0.5) * 0.6 * max(2.0/(-d), 0.0);" +
"  }else{" + // rock.
"    vec3 ro = pos;" +
"    ro.y += 12.0;" +
"    float t = logBisectTrace(ro, dir);" +
"    vec3 rock = vec3(0.0);" +
"    if(t < FAR){" +
"      pos = ro + dir * t;" +
"      t /= FAR;" +
"      vec3 sn = normal(pos, 0.1 / (1.0 + t));" +
"      float fre = clamp(1.0 + dot(sun, sn), 0.0, 1.0);" + // Fresnel_ref.
"      float Schlick = pow(1.0 - max(dot(dir, normalize(dir + sun)), 0.0), 5.0);" +
"      fre *= mix(0.2, 1.0, Schlick);" + // Hard clay.
"      float dif = dot(sn, sun) * 0.2;" +
// テクスチャを使っているのはここ。
"      rock = (dif * texture2D(uTexture, pos.xz * 0.05).xyz + fre*fre*0.35) * col;" +
"      float y = smoothstep(0.9, 1.0, (1.0 + dir.y));" +
"      if(y > 0.0){ rock = mix(rock, col, y*t); }" +
"      col = mix(rock, col, t);" +
"    }" +
"    float f = (-dir.y - 0.3 + sin(time * 0.05) * 0.2) * 0.3185;" +
"    f = clamp(f, 0.0, 1.0);" +
"    col = mix(col, rock, f);" +
"  }" +
"  gl_FragColor = vec4(col, 1.0);" +
"}";

function preload(){
  img = loadImage("random.png");
}

//let seaColor = {r:0, g:99, b:158}; // default:0,99,158.

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  sh = createShader(vs, fs);
  pixelDensity(1);
  shader(sh);
}

function draw() {
  const col = getProperColor(config.seaColor);
  sh.setUniform("uResolution", [width, height]);
  sh.setUniform("uTime", frameCount/60);
  sh.setUniform("uTexture", img);
  sh.setUniform("uSeaColor", [col.r/255, col.g/255, col.b/255]); // こうしないと駄目
  quad(-1, -1, -1, 1, 1, 1, 1, -1);
}

function getProperColor(col){
  if(typeof(col) == 'object'){ return {r:col.r, g:col.g, b:col.b}; }
  if(typeof(col) == 'string'){
    col = color(col);
    return {r:red(col), g:green(col), b:blue(col)};
  }
  return {r:255, g:255, b:255};
}

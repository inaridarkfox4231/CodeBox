// pavelさんの流体シミュレーションをp5.jsでやる試み
// reference: https://github.com/PavelDoGreat/WebGL-Fluid-Simulation

/*
MIT License
Copyright (c) 2017 Pavel Dobryakov
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// この辺が限界ですね
// まあそろそろ離れるつもりだったし
// 最後にいい思い出ができた
// おけー
// 結論：p5.jsはここまで。

let config = {
    SIM_RESOLUTION: 128, // simulateResolution. たとえば128x128なら縦横128分割。
    DYE_RESOLUTION: 512, // 染める場合のResolution.
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1, // 減衰要素ここか
    VELOCITY_DISSIPATION: 0.2,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 30, // vorticityの計算に使う定数
    SPLAT_RADIUS: 0.25,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.8,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1.0,
}

// prototypeのidが-1なのでこれが入ってそれで終わりみたいな感じなんかね
class pointerPrototype{
  constructor(){
    this.id = -1;
    this.texcoordX = 0;
    this.texcoordY = 0;
    this.prevTexcoordX = 0;
    this.prevTexcoordY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.down = false;
    this.moved = false;
    this.color = [30, 0, 300];
  }
}

let pointers = [];
let splatStack = [];

let gl, _gl;
let _node;

let ext = {}; // extをグローバルにする実験

let textureWidth;
let textureHeight;

// リサイズ用のメモ
let canvasWidth;
let canvasHeight;

let lastUpdateTime;
let colorUpdateTimer;

// とりあえずシェーダだけ移そうかと

// 基本バーテックスシェーダ
const baseVertexShader =
"precision highp float;" +
"attribute vec2 aPosition;" +
"varying vec2 vUv;" +
"varying vec2 vL;" + // left  // 「//」は中に入れちゃ駄目です。
"varying vec2 vR;" + // right
"varying vec2 vT;" + // top
"varying vec2 vB;" + // bottom
"uniform vec2 texelSize;" +
"void main () {" +
// 0～1の0～1で上下逆なのでTがプラス
"  vUv = aPosition * 0.5 + 0.5;" +
"  vL = vUv - vec2(texelSize.x, 0.0);" +
"  vR = vUv + vec2(texelSize.x, 0.0);" +
"  vT = vUv + vec2(0.0, texelSize.y);" +
"  vB = vUv - vec2(0.0, texelSize.y);" +
"  gl_Position = vec4(aPosition, 0.0, 1.0);" +
"}";

// simple vertex shader.
// vLやら何やらを使ってない場合はこっちを使いましょう。copyとか使ってないはず。
// vUvは使おう。これ-1～1を0～1にするやつだから。copyとかで使ってる。
// あ、texelSize使ってる場合はだめ。だからそれは...あー、いいや。
// vertexで使ってないならsimpleでいい。texelSizeだけ使うからinputする。それで。OK!
const simpleVertexShader =
"precision highp float;" +
"attribute vec2 aPosition;" +
"varying vec2 vUv;" +
"void main () {" +
"  vUv = aPosition * 0.5 + 0.5;" +
"  gl_Position = vec4(aPosition, 0.0, 1.0);" +
"}";

// 基本ブラーシェーダ
const blurVertexShader =
"precision highp float;" +
"attribute vec2 aPosition;" +
"varying vec2 vUv;" +
"varying vec2 vL;" +
"varying vec2 vR;" + // 左右だけ
"uniform vec2 texelSize;" +
"void main (){" +
"  vUv = aPosition * 0.5 + 0.5;" +
"  float offset = 1.33333333;" + // 4/3？
"  vL = vUv - texelSize * offset;" +
"  vR = vUv + texelSize * offset;" +
"  gl_Position = vec4(aPosition, 0.0, 1.0);" +
"}";

// ブラーシェーダ
const blurShader =
"precision mediump float;" +
"precision mediump sampler2D;" +
"varying vec2 vUv;" +
"varying vec2 vL;" + // 左右だけ～
"varying vec2 vR;" +
"uniform sampler2D uTexture;" +
"void main () {" +
"  vec4 sum = texture2D(uTexture, vUv) * 0.29411764;" +
"  sum += texture2D(uTexture, vL) * 0.35294117;" +
"  sum += texture2D(uTexture, vR) * 0.35294117;" +
"  gl_FragColor = sum;" +
"}";

// リサイズに使うコピー用シェーダ
// これsimpleにしようね
// これ考えられてるな...バーテックスから0～1を渡せばそのままテクスチャの内容コピーできるんだ。
// これRenderNodeの御用達シェーダにして使い回すか。resizeでも使うし。
const copyShader =
"precision mediump float;" +
"precision mediump sampler2D;" +
"varying highp vec2 vUv;" +
"uniform sampler2D uTexture;" +
"void main () {" +
"  gl_FragColor = texture2D(uTexture, vUv);" +
"}";

// クリアシェーダ
// これsimpleにしようね
const clearShader =
"precision mediump float;" +
"precision mediump sampler2D;" +
"varying highp vec2 vUv;" +
"uniform sampler2D uTexture;" +
"uniform float value;" +
"void main () {" +
"  gl_FragColor = value * texture2D(uTexture, vUv);" +
"}";

// カラーシェーダ
// これsimpleにしようね
const colorShader =
"precision mediump float;" +
"uniform vec4 color;" +
"void main () {" +
"  gl_FragColor = color;" +
"}";

// チェッカーボード。透明の時に使うやつ。
// これsimpleにしようね
const checkerboardShader =
"precision highp float;" +
"precision highp sampler2D;" +
"varying vec2 vUv;" +
//"uniform sampler2D uTexture;" +
"uniform float aspectRatio;" +
"const float SCALE = 25.0;" + // セミコロン抜け！
"void main () {" +
"  vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));" +
"  float v = mod(uv.x + uv.y, 2.0);" +
"  v = v * 0.1 + 0.8;" +
"  gl_FragColor = vec4(vec3(v), 1.0);" +
"}";

// ディスプレイ用
const displayShaderSource =
"precision highp float;" +
"precision highp sampler2D;" +
"varying vec2 vUv;" +
"varying vec2 vL;" +
"varying vec2 vR;" +
"varying vec2 vT;" +
"varying vec2 vB;" +
"uniform sampler2D uTexture;" +
"uniform sampler2D uBloom;" +
"uniform sampler2D uSunrays;" +
"uniform sampler2D uDithering;" +
"uniform vec2 ditherScale;" +
"uniform vec2 texelSize;" +
// 各種フラグ
"uniform bool uShadingFlag;" +
"uniform bool uBloomFlag;" +
"uniform bool uSunraysFlag;" +
// リニア→ガンマ
"vec3 linearToGamma (vec3 color) {" + // linearをGammaに変換・・
"  color = max(color, vec3(0));" +
"  return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));" +
"}" +
// メインコード
"void main () {" +
"  vec3 c = texture2D(uTexture, vUv).rgb;" +
"  if(uShadingFlag){" +
"    vec3 lc = texture2D(uTexture, vL).rgb;" +
"    vec3 rc = texture2D(uTexture, vR).rgb;" +
"    vec3 tc = texture2D(uTexture, vT).rgb;" +
"    vec3 bc = texture2D(uTexture, vB).rgb;" +
"    float dx = length(rc) - length(lc);" +
"    float dy = length(tc) - length(bc);" +
"    vec3 n = normalize(vec3(dx, dy, length(texelSize)));" +
"    vec3 l = vec3(0.0, 0.0, 1.0);" +
"    float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);" +
"    c *= diffuse;" +
"  }" +
"  vec3 bloom;" +
"  if(uBloomFlag){" +
"    bloom = texture2D(uBloom, vUv).rgb;" +
"  }" +
" if(uSunraysFlag){" +
"   float sunrays = texture2D(uSunrays, vUv).r;" +
"   c *= sunrays;" +
"   if(uBloomFlag){" +
"     bloom *= sunrays;" +
"   }" +
" }" +
"  if(uBloomFlag){" +
"    float noise = texture2D(uDithering, vUv * ditherScale).r;" +
"    noise = noise * 2.0 - 1.0;" +
"    bloom += noise / 255.0;" +
"    bloom = linearToGamma(bloom);" +
"    c += bloom;" +
"  }" +
"  float a = max(c.r, max(c.g, c.b));" + // 透明度はr,g,bのうちMAXのものを採用する、なるほど・・真っ黒だと見えなくなると。
"  gl_FragColor = vec4(c, a);" +
"}";

// bloomの事前準備
// これsimpleにしようね
const bloomPrefilterShader =
"precision mediump float;" +
"precision mediump sampler2D;" +
"varying vec2 vUv;" +
"uniform sampler2D uTexture;" +
"uniform vec3 curve;" +
"uniform float threshold;" +
"void main () {" +
"  vec3 c = texture2D(uTexture, vUv).rgb;" +
"  float br = max(c.r, max(c.g, c.b));" +
"  float rq = clamp(br - curve.x, 0.0, curve.y);" +
"  rq = curve.z * rq * rq;" +
"  c *= max(rq, br - threshold) / max(br, 0.0001);" +
"  gl_FragColor = vec4(c, 0.0);" +
"}";

// bloomのメインシェーダ
const bloomBlurShader =
"precision mediump float;" +
"precision mediump sampler2D;" +
"varying vec2 vL;" +
"varying vec2 vR;" +
"varying vec2 vT;" +
"varying vec2 vB;" +
"uniform sampler2D uTexture;" +
"void main () {" +
"  vec4 sum = vec4(0.0);" +
"  sum += texture2D(uTexture, vL);" +
"  sum += texture2D(uTexture, vR);" +
"  sum += texture2D(uTexture, vT);" +
"  sum += texture2D(uTexture, vB);" +
"  sum *= 0.25;" +
"  gl_FragColor = sum;" +
"}";

// bloomの仕上げシェーダ
const bloomFinalShader =
"precision mediump float;" +
"precision mediump sampler2D;" +
"varying vec2 vL;" +
"varying vec2 vR;" +
"varying vec2 vT;" +
"varying vec2 vB;" +
"uniform sampler2D uTexture;" +
"uniform float intensity;" +
"void main () {" +
"  vec4 sum = vec4(0.0);" +
"  sum += texture2D(uTexture, vL);" +
"  sum += texture2D(uTexture, vR);" +
"  sum += texture2D(uTexture, vT);" +
"  sum += texture2D(uTexture, vB);" +
"  sum *= 0.25;" +
"  gl_FragColor = sum * intensity;" +
"}";

// sunrayのシェーダが始まりました
// これsimpleにしようね
const sunraysMaskShader =
"precision highp float;" +
"precision highp sampler2D;" +
"varying vec2 vUv;" +
"uniform sampler2D uTexture;" +
"void main () {" +
"  vec4 c = texture2D(uTexture, vUv);" +
"  float br = max(c.r, max(c.g, c.b));" +
"  c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);" +
"  gl_FragColor = c;" +
"}";

// sunrayメインシェーダ
// これsimpleにしようね
const sunraysShader =
"precision highp float;" +
"precision highp sampler2D;" +
"varying vec2 vUv;" +
"uniform sampler2D uTexture;" +
"uniform float weight;" +
"const int ITERATIONS = 16;" + // ここintでしょうよ
"void main () {" +
"  float Density = 0.3;" +
"  float Decay = 0.95;" +
"  float Exposure = 0.7;" +
"  vec2 coord = vUv;" +
"  vec2 dir = vUv - 0.5;" +
"  dir *= 1.0 / float(ITERATIONS) * Density;" +
"  float illuminationDecay = 1.0;" +
"  float color = texture2D(uTexture, vUv).a;" +
"  for (int i = 0; i < ITERATIONS; i++)" +
"  {" +
"    coord -= dir;" +
"    float col = texture2D(uTexture, coord).a;" +
"    color += col * illuminationDecay * weight;" +
"    illuminationDecay *= Decay;" +
"  }" +
"  gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);" +
"}";

// splat用のフラグメントシェーダはこっちですね
// これsimpleにしようね
const splatShader =
"precision highp float;" +
"precision highp sampler2D;" +
"varying vec2 vUv;" +
"uniform sampler2D uTarget;" +
"uniform float aspectRatio;" +
"uniform vec3 color;" +
"uniform vec2 point;" +
"uniform float radius;" +
"void main () {" +
"  vec2 p = vUv - point.xy;" +
"  p.x *= aspectRatio;" +
"  vec3 splat = exp(-dot(p, p) / radius) * color;" +
"  vec3 base = texture2D(uTarget, vUv).xyz;" +
"  gl_FragColor = vec4(base + splat, 1.0);" +
"}";

// これsimpleにしようね. ただtexelSizeは使うのでよろしくね。
const advectionShader =
"precision highp float;" +
"precision highp sampler2D;" +
"varying vec2 vUv;" +
"uniform sampler2D uVelocity;" +
"uniform sampler2D uSource;" + // この2つは同じものであるようだ。
"uniform vec2 texelSize;" +
"uniform vec2 dyeTexelSize;" +
"uniform float dt;" +
"uniform float dissipation;" +
"uniform bool uUseManualFiltering;" + // manualを使うかどうかのフラグ
"vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {" +
"  vec2 st = uv / tsize - 0.5;" +
"  vec2 iuv = floor(st);" +
"  vec2 fuv = fract(st);" +
"  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);" +
"  vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);" +
"  vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);" +
"  vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);" +
"  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);" +
"}" +
"void main () {" +
"  vec2 coord;" +
"  vec4 result;" +
"  if(uUseManualFiltering){" +
"    coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;" +
"    result = bilerp(uSource, coord, dyeTexelSize);" +
"  }else{" +
"    coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;" +
"    result = texture2D(uSource, coord);" +
"  }" +
"  float decay = 1.0 + dissipation * dt;" +
"  gl_FragColor = result / decay;" +
"}";

const divergenceShader =
"precision mediump float;" +
"precision mediump sampler2D;" +
"varying highp vec2 vUv;" +
"varying highp vec2 vL;" +
"varying highp vec2 vR;" +
"varying highp vec2 vT;" +
"varying highp vec2 vB;" +
"uniform sampler2D uVelocity;" +
"void main () {" +
"  float L = texture2D(uVelocity, vL).x;" +
"  float R = texture2D(uVelocity, vR).x;" +
"  float T = texture2D(uVelocity, vT).y;" +
"  float B = texture2D(uVelocity, vB).y;" +
"  vec2 C = texture2D(uVelocity, vUv).xy;" +
"  if (vL.x < 0.0) { L = -C.x; }" +
"  if (vR.x > 1.0) { R = -C.x; }" +
"  if (vT.y > 1.0) { T = -C.y; }" +
"  if (vB.y < 0.0) { B = -C.y; }" +
"  float div = 0.5 * (R - L + T - B);" +
"  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);" +
"}";

const curlShader =
"precision mediump float;" +
"precision mediump sampler2D;" +
"varying highp vec2 vUv;" +
"varying highp vec2 vL;" +
"varying highp vec2 vR;" +
"varying highp vec2 vT;" +
"varying highp vec2 vB;" +
"uniform sampler2D uVelocity;" + // 入力は速度だけ
"void main () {" +
"  float L = texture2D(uVelocity, vL).y;" +
"  float R = texture2D(uVelocity, vR).y;" +
"  float T = texture2D(uVelocity, vT).x;" +
"  float B = texture2D(uVelocity, vB).x;" +
"  float vorticity = R - L - T + B;" +
"  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);" +
"}";

const vorticityShader =
"precision highp float;" +
"precision highp sampler2D;" +
"varying vec2 vUv;" +
"varying vec2 vL;" +
"varying vec2 vR;" +
"varying vec2 vT;" +
"varying vec2 vB;" +
"uniform sampler2D uVelocity;" +
"uniform sampler2D uCurl;" +
"uniform float curl;" +
"uniform float dt;" +
"void main () {" +
"  float L = texture2D(uCurl, vL).x;" +
"  float R = texture2D(uCurl, vR).x;" +
"  float T = texture2D(uCurl, vT).x;" +
"  float B = texture2D(uCurl, vB).x;" +
"  float C = texture2D(uCurl, vUv).x;" +
"  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));" +
"  force /= length(force) + 0.0001;" +
"  force *= curl * C;" +
"  force.y *= -1.0;" +
"  vec2 velocity = texture2D(uVelocity, vUv).xy;" +
"  velocity += force * dt;" +
"  velocity = min(max(velocity, -1000.0), 1000.0);" +
"  gl_FragColor = vec4(velocity, 0.0, 1.0);" +
"}";

// pressureを計算するためのイテレーションです
const pressureShader =
"precision mediump float;" +
"precision mediump sampler2D;" +
"varying highp vec2 vUv;" +
"varying highp vec2 vL;" +
"varying highp vec2 vR;" +
"varying highp vec2 vT;" +
"varying highp vec2 vB;" +
"uniform sampler2D uPressure;" + // pressure値
"uniform sampler2D uDivergence;" + // div値
"void main () {" +
"  float L = texture2D(uPressure, vL).x;" +
"  float R = texture2D(uPressure, vR).x;" +
"  float T = texture2D(uPressure, vT).x;" +
"  float B = texture2D(uPressure, vB).x;" +
"  float C = texture2D(uPressure, vUv).x;" +
"  float divergence = texture2D(uDivergence, vUv).x;" +
"  float pressure = (L + R + B + T - divergence) * 0.25;" +
"  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);" +
"}";

const gradientSubtractShader =
"precision mediump float;" +
"precision mediump sampler2D;" +
"varying highp vec2 vUv;" +
"varying highp vec2 vL;" +
"varying highp vec2 vR;" +
"varying highp vec2 vT;" +
"varying highp vec2 vB;" +
"uniform sampler2D uPressure;" +
"uniform sampler2D uVelocity;" +
"void main () {" +
"  float L = texture2D(uPressure, vL).x;" +
"  float R = texture2D(uPressure, vR).x;" +
"  float T = texture2D(uPressure, vT).x;" +
"  float B = texture2D(uPressure, vB).x;" +
"  vec2 velocity = texture2D(uVelocity, vUv).xy;" +
"  velocity.xy -= vec2(R - L, T - B);" + // pressureのgradを引く
"  gl_FragColor = vec4(velocity, 0.0, 1.0);" +
"}";

// シェーダ移し終わり
// んー。とりあえずおいといて。いろいろ。
// まとめるの大変そうなので。いろいろ整理しないと無理。

function setup() {
  _gl = createCanvas(windowWidth, windowHeight, WEBGL);
  // ここで登録しといてサイズ変更の際にリサイズ処理に使う
  canvasWidth = width;
  canvasHeight = height;
  gl = _gl.GL;
  pixelDensity(1);

  _node = new RenderNode();
  pointers.push(new pointerPrototype());
  confirmExtensions();
  initFramebuffers();

  // 何から始めたらいいのやら。
  // とりあえずframebuffersは用意できたんで、シェーダー作っていきます。
  // レンダーシステムとして各種シェーダと描画機能を用意する
  const positions = [-1, -1, -1, 1, 1, -1, 1, 1];

  let sh;
  sh = createShader(blurVertexShader, blurShader);
  _node.regist('blur', sh, 'board')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTexture');

  sh = createShader(simpleVertexShader, copyShader);
  _node.regist('copy', sh, 'simple')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTexture');

  sh = createShader(simpleVertexShader, clearShader);
  _node.regist('clear', sh, 'simple')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTexture');

  sh = createShader(simpleVertexShader, colorShader);
  _node.regist('color', sh, 'simple')
       .registAttribute('aPosition', positions, 2);

  sh = createShader(simpleVertexShader, checkerboardShader);
  _node.regist('checkerboard', sh, 'simple')
       .registAttribute('aPosition', positions, 2);
       //.registUniformLocation('uTexture'); // 使ってないので。

  // displayがあれこれめんどくさいことになってるのは
  // #defineを使ってるから。ただこれははっきりいってインチキなので、
  // flagで書き換えてしまいました。
  // どうインチキかというとフラグに応じてその場でシェーダー作ってる
  // のよ。めんどくさいので、やりません。
  // 普通に作ってOK.
  // ただめんどくさいことになるのは覚悟しておいてください。
  // まあ今更って感じだわね。

  sh = createShader(baseVertexShader, displayShaderSource);
  _node.regist('display', sh, 'board')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTexture')
       .registUniformLocation('uBloom')
       .registUniformLocation('uSunrays')
       .registUniformLocation('uDithering');

  sh = createShader(simpleVertexShader, bloomPrefilterShader);
  _node.regist('bloomPrefilter', sh, 'simple')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTexture');

  sh = createShader(baseVertexShader, bloomBlurShader);
  _node.regist('bloomBlur', sh, 'board')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTexture');

  sh = createShader(baseVertexShader, bloomFinalShader);
  _node.regist('bloomFinal', sh, 'board')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTexture');

  sh = createShader(simpleVertexShader, sunraysMaskShader);
  _node.regist('sunraysMask', sh, 'simple')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTexture');

  sh = createShader(simpleVertexShader, sunraysShader);
  _node.regist('sunrays', sh, 'simple')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTexture');

  // ここから先は以前と同じはずです
  // ただ明らかに見た目が違うのでどういう処理をしているのでしょうか...

  sh = createShader(simpleVertexShader, splatShader);
  _node.regist('splat', sh, 'simple')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTarget');

  sh = createShader(simpleVertexShader, advectionShader);
  _node.regist('advection', sh, 'simple')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uVelocity')
       .registUniformLocation('uSource');

  sh = createShader(baseVertexShader, divergenceShader);
  _node.regist('divergence', sh, 'board')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uVelocity');

  sh = createShader(baseVertexShader, curlShader);
  _node.regist('curl', sh, 'board')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uVelocity');

  sh = createShader(baseVertexShader, vorticityShader);
  _node.regist('vorticity', sh, 'board')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uVelocity')
       .registUniformLocation('uCurl');

  // 圧力項の計算用
  sh = createShader(baseVertexShader, pressureShader);
  _node.regist('pressure', sh, 'board')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uPressure')
       .registUniformLocation('uDivergence');

  sh = createShader(baseVertexShader, gradientSubtractShader);
  _node.regist('gradientSubtract', sh, 'board')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uPressure')
       .registUniformLocation('uVelocity');

  // ふぅー...ってまだ何も始まっていないが。
  multipleSplats(floor(Math.random() * 20) + 5);
  lastUpdateTime = Date.now();
  colorUpdateTimer = 0.0;

  // じゃあとりあえずマウスだけ移すね
  const canvas = document.getElementsByTagName('canvas')[0];
  canvas.addEventListener('mousedown', mouseDownAction);
  canvas.addEventListener('mousemove', mouseMoveAction);
  window.addEventListener('mouseup', mouseUpAction);
}

function draw(){
  // とりあえずdeltaTimeをば
  const dt = calcDeltaTime();

  // 後回し
  if(resizeCheck()){
    initFramebuffers();
  }

  updateColors(dt); // 後回し
  applyInputs(); // これはやらないとだね。
  if(!config.PAUSED){
    step(dt); // Pキーで止められるようにする感じね
  }
  render();
  // 以上です！
}

// リサイズするべきか否かのチェック（リサイズするならtrueを返す）
function resizeCheck(){
  if(canvasWidth !== windowWidth || canvasHeight !== windowHeight){
    canvasWidth = windowWidth;
    canvasHeight = windowHeight;
    resizeCanvas(canvasWidth, canvasHeight);
    return true;
  }
  return false;
}

function updateColors(dt){
  if(!config.COLORFUL){ return; }
  colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
  if (colorUpdateTimer >= 1) {
    colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
    pointers.forEach(p => {
      p.color = generateColor(Math.random());
    });
  }
}

// -------------------------------- //
// stepとrender.
// 明日にしますか。

function step(dt){
  gl.disable(gl.BLEND);
  let simRes = getResolution(config.SIM_RESOLUTION);
  const w = simRes.frameWidth;
  const h = simRes.frameHeight;

  // ここら辺の処理はあっちとあんま変わんないみたいですね
  //_node.setViewport(0, 0, w, h);
  // まずcurl shader. 書き込む先はcurl.
  _node.bindFBO('curl');
  _node.use('curl', 'board')
       .setAttribute()
       .setFBO('uVelocity', 'velocity')
       .setUniform('texelSize', [1/w, 1/h])
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();

  // vorticity shader. 書き込む先はvelocity.
  _node.bindFBO('velocity');
  _node.use('vorticity', 'board')
       .setAttribute()
       .setFBO('uVelocity', 'velocity')
       .setFBO('uCurl', 'curl')
       .setUniform('texelSize', [1/w, 1/h])
       .setUniform('curl', config.CURL)
       .setUniform('dt', dt)
       .drawArrays(gl.TRIANGLE_STRIP)
       .swapFBO('velocity')
       .clear();

  // divergence shader. 書き込む先はdivergence.
  _node.bindFBO('divergence');
  _node.use('divergence', 'board')
       .setAttribute()
       .setFBO('uVelocity', 'velocity')
       .setUniform('texelSize', [1/w, 1/h])
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();

  // clear shader. 書き込む先はpressureで、書き込んだらswapする。
  _node.bindFBO('pressure');
  _node.use('clear', 'simple')
       .setAttribute()
       .setFBO('uPressure', 'pressure')
       .setUniform('value', config.PRESSURE)
       .drawArrays(gl.TRIANGLE_STRIP)
       .swapFBO('pressure')
       .clear();

  // pressure shader.
  // イテレーションでpressureを求めるパート
  _node.use('pressure', 'board')
       .setAttribute()
       .setFBO('uDivergence', 'divergence')
       .setUniform('texelSize', [1/w, 1/h]);
  for(let i = 0; i < config.PRESSURE_ITERATIONS; i++){
    _node.bindFBO('pressure')
         .setFBO('uPressure', 'pressure')
         .drawArrays(gl.TRIANGLE_STRIP);
    _node.swapFBO('pressure');
  }
  _node.clear();

  // gradient subtract shader. 書き込む先はvelocity.
  _node.bindFBO('velocity');
  _node.use('gradientSubtract', 'board')
       .setAttribute()
       .setFBO('uPressure', 'pressure')
       .setFBO('uVelocity', 'velocity')
       .setUniform('texelSize', [1/w, 1/h])
       .drawArrays(gl.TRIANGLE_STRIP)
       .swapFBO('velocity')
       .clear();

  // 最後に移流項（advection）やってる。ここ順番が逆なのよね。
  // 洗練させた結果こうなったとみるしかない。作者でないので
  // わかりませんが...
  let dyeRes = getResolution(config.DYE_RESOLUTION); // 必要
  const dw = dyeRes.frameWidth;
  const dh = dyeRes.frameHeight;
  // ハーフフロートが使えないならマニュアルフィルタリングする
  const useManualFiltering = (ext.textureHalfFloatLinear ? false : true);
  // 同じシェーダでvelocityとdyeにそれぞれ書き込むんだけど
  // dyeの方viewport変えるっぽいね
  // そこだけ注意してください（多分変えるだけでいいはず...）
  _node.bindFBO('velocity');
  _node.use('advection', 'simple')
       .setAttribute()
       .setFBO('uVelocity', 'velocity')
       .setFBO('uSource', 'velocity')
       .setUniform('texelSize', [1/w, 1/h])
       .setUniform('dt', dt)
       .setUniform('dissipation', config.VELOCITY_DISSIPATION);
  if(useManualFiltering){
    _node.setUniform('uUseManualFiltering', useManualFiltering)
         .setUniform('dyeTexelSize', [1/w, 1/h]);
  }
  _node.drawArrays(gl.TRIANGLE_STRIP)
       .swapFBO('velocity');

  // ここでviewportと書き込み先を変更
  //_node.setViewport(0, 0, dw, dh);
  _node.bindFBO('dye')
       .setFBO('uVelocity', 'velocity')
       .setFBO('uSource', 'dye')
       .setUniform('dissipation', config.DENSITY_DISSIPATION);
  if(useManualFiltering){
    _node.setUniform('uUseManualFiltering', useManualFiltering)
         .setUniform('dyeTexelSize', [1/dw, 1/dh]);
  }
  _node.drawArrays(gl.TRIANGLE_STRIP)
       .swapFBO('dye')
       .clear();

  // お疲れさまでした。
}

function render(){
  // 引数はnullでいいと思う。saveの仕組みを考えたらそれでいける、はず。
  // まあp5.jsだし多分大丈夫のはず...
  // 検証しました。いけます。p5.jsすごい！

  if(config.BLOOM){
    applyBloom();
  }
  if(config.SUNRAYS){
    applySunrays();
    blurSunrays();
  }
  // background(255)要らないです。ようやくできた。sunraysで失敗してた。
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);
  // こうですね
  // あっちでは透明バージョンでsaveする場合に特殊なことをしているのでああなってただけなんです。
  // 今回それはやらないので普通にこの形式でOKです。そういうこと。

  if(!config.TRANSPARENT){
    const col = config.BACK_COLOR;
    drawColor(col.r/255, col.g/255, col.b/255); // 全部255で割る
  }
  if(config.TRANSPARENT){
    // saveFlagが立ってる場合は描画しないでclear()だけして抜ける。
    drawCheckerboard();
  }

  drawDisplay(); // 仕上げ！！！
}

function applyBloom(){
  // dyeを元にしてbloomになんか焼き付ける
  gl.disable(gl.BLEND);
  let res = getResolution(config.BLOOM_RESOLUTION);
  //_node.setViewport(res.frameWidth, res.frameHeight);

  let knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
  let curve0 = config.BLOOM_THRESHOLD - knee;
  let curve1 = knee * 2;
  let curve2 = 0.25 / knee;
  // どうもここの処理texxelSize使ってないんだけど
  // まあ使わなくていいならそれでいいのか...？よくわからないね。
  // texelSizeにデタラメ入れてもバグんなかったから。
  _node.bindFBO('bloom_0');
  _node.use('bloomPrefilter', 'simple')
       .setAttribute()
       .setFBO('uTexture', 'dye')
       .setUniform('curve', [curve0, curve1, curve2])
       .setUniform('threshold', config.BLOOM_THRESHOLD)
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear(); // ここclear必須っぽいな

  // まあ本来はシェーダー切り替えるたびにclear必要だけどね...

  // bloomやっぱ通し番号にするか...0,1,2,...,8みたいに。
  // その方が良さそう。
  _node.use('bloomBlur', 'board')
       .setAttribute();
  // FBOもuniformもbindやsetするあれごとに異なるので、
  // その都度設定し直す。
  // まず0→1, 1→2, ..., N-1→Nとする
  for(let i = 1; i <= config.BLOOM_ITERATIONS; i++){
    // i-1→iって感じ
    const w = (res.frameWidth >> (i-1));
    const h = (res.frameHeight >> (i-1));
    //_node.setViewport(0, 0, (res.frameWidth >> i), (res.frameHeight >> i));
    _node.bindFBO('bloom_' + i);
    _node.setUniform('texelSize', [1/w, 1/h])
         .setFBO('bloom_' + (i-1))
         .drawArrays(gl.TRIANGLE_STRIP);
  }

  gl.blendFunc(gl.ONE, gl.ONE);
  gl.enable(gl.BLEND);

  // 次にN→N-1,...,2→1とする。
  for(let i = config.BLOOM_ITERATIONS; i >= 2; i--){
    const w = (res.frameWidth >> i);
    const h = (res.frameHeight >> i);
    //_node.setViewport(0, 0, (res.frameWidth >> (i-1)), (res.frameHeight >> (i-1)));
    _node.bindFBO('bloom_' + (i-1));
    _node.setUniform('texelSize', [1/w, 1/h])
         .setFBO('bloom_' + i)
         .drawArrays(gl.TRIANGLE_STRIP);
  }

  _node.clear();
  gl.disable(gl.BLEND);

  // 最後に1→0でおしまい
  const w1 = (res.frameWidth >> 1);
  const h1 = (res.frameHeight >> 1);
  //_node.setViewport(0, 0, res.frameWidth, res.frameHeight);
  _node.bindFBO('bloom_0');
  _node.use('bloomFinal', 'board')
       .setAttribute()
       .setFBO('bloom_1')
       .setUniform('texelSize', [1/w1, 1/h1])
       .setUniform('intensity', config.BLOOM_INTENSITY)
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
  // bloomについては以上。
}

function applySunrays(){
  gl.disable(gl.BLEND);
  // sunraysMaskのshaderでdyeに焼きこんで...
  // 調べたけどどうやら一時的にwriteに書きこんでその結果を利用する
  // みたいですね。swapさえしなければそれは可能なはずです。
  // RenderNodeの方もそれが可能なようにちょこっと書き換えた。
  let sunRes = getResolution(config.SUNRAYS_RESOLUTION);
  let dyeRes = getResolution(config.DYE_RESOLUTION);

  // dyeのreadからdyeのwrite.
  //_node.setViewport(0, 0, dyeRes.frameWidth, dyeRes.frameHeight);
  _node.bindFBO('dye');
  _node.use('sunraysMask', 'simple')
       .setAttribute()
       .setFBO('uTexture', 'dye')
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();

  // dyeのwriteからsunrays.
  //_node.setViewport(0, 0, sunRes.frameWidth, sunRes.frameHeight);
  _node.bindFBO('sunrays');
  _node.use('sunrays', 'simple')
       .setAttribute()
       .setFBO('uTexture', 'dye', true) // writeをアタッチする
       .setUniform('weight', config.SUNRAYS_WEIGHT)
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
}

function blurSunrays(){
  // 出てくるのはsunraysとsunraysTempだけ。
  // デフォルトが1なので1回でいいでしょ。
  let res = getResolution(config.SUNRAYS_RESOLUTION);
  //_node.setViewport(res.frameWidth, res.frameHeight);
  _node.bindFBO('sunraysTemp');
  _node.use('blur', 'board')
       .setAttribute()
       .setUniform('texelSize', [1/res.frameWidth, 0])
       .setFBO('uTexture', 'sunrays')
       .drawArrays(gl.TRIANGLE_STRIP);

  _node.bindFBO('sunrays');
  _node.setUniform('texelSize', [0, 1/res.frameHeight])
       .setFBO('uTexture', 'sunraysTemp')
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
}

function drawColor(r, g, b){
  //const w = gl.drawingBufferWidth;
  //const h = gl.drawingBufferHeight;
  //_node.setViewport(0, 0, w, h);
  _node.bindFBO(null);

  _node.use('color', 'simple')
       .setAttribute()
       .setUniform('color', [r, g, b, 1])
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();

  // clear(); // トラぺ要らないかも。ここclearにしてsaveでよさげ。
  // 多分あっちのパーティクルもそうなんじゃないか...
}

function drawCheckerboard(){
  _node.bindFBO(null);

  _node.use('checkerboard', 'simple')
       .setAttribute()
       .setUniform('aspectRatio', width/height)
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
}

function drawDisplay(){
  // スクリーンへの描画
  _node.bindFBO(null);

  // Ditheringは外しても割と普通に動くので後回しでいいです。
  // とりあえず無しで作っちゃいましょう。

  _node.use('display', 'board')
       .setAttribute()
       .setFBO('uTexture', 'dye');

  if(config.SHADING){
    _node.setUniform('uShadingFlag', true);
    _node.setUniform('texelSize', [1/width, 1/height]);
  }

  // コメントアウト外しても大丈夫になった！
  if(config.BLOOM){
    _node.setUniform('uBloomFlag', true);
    _node.setFBO('uBloom', 'bloom_0');
    // ditheringは後回し
  }

  if(config.SUNRAYS){
    _node.setUniform('uSunraysFlag', true);
    _node.setFBO('uSunrays', 'sunrays');
  }

  _node.drawArrays(gl.TRIANGLE_STRIP)
       .clear()
       .flush();
  // これでうごくはず...
}

// -------------------------------- //

function multipleSplats(amount){
  // amountの回数だけsplatを呼び出す。
  // splatでは
  for (let i = 0; i < amount; i++) {
    let col = generateColor(Math.random());
    col.r *= 10.0;
    col.g *= 10.0;
    col.b *= 10.0;
    // 花火の原理考えたらちょっと速度はいじった方がいいかも（まあめんどくさいしいいか）
    const x = Math.random();
    const y = Math.random();
    const velocity = 500 * Math.random();
    const direction = Math.PI * 2.0 * Math.random();
    splat(x, y, velocity * Math.cos(direction), velocity * Math.sin(direction), col);
  }
}

// splatPointerではdeltaXとdeltaYの値により方向を割り出すので、
// テクスチャ座標の変位にアスペクト比を考慮して掛け算することで、
// きちんとした方向になるよう修正しないといけないわけです。
function splatPointer (pointer) {
  let dx = pointer.deltaX * config.SPLAT_FORCE;
  let dy = pointer.deltaY * config.SPLAT_FORCE;
  splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
}

function splat(x, y, dx, dy, col){
  // viewportについてはその都度大きさに合わせてって感じでやることにしました
  // となると情報持たせる意味が無いですね...まあそんなもんでしょ（？）
  let simRes = getResolution(config.SIM_RESOLUTION);
  let dyeRes = getResolution(config.DYE_RESOLUTION);
  // これらの情報を元にフレームを用意
  // まずvelocityについて
  //_node.setViewport(0, 0, simRes.frameWidth, simRes.frameHeight);
  _node.bindFBO('velocity');
  _node.use('splat', 'simple')
       .setAttribute()
       .setFBO('uTarget', 'velocity')
       .setUniform('aspectRatio', width/height)
       .setUniform('point', [x, y])
       .setUniform('color', [dx, dy, 0.0])
       .setUniform('radius', correctRadius(config.SPLAT_RADIUS / 100.0))
       .drawArrays(gl.TRIANGLE_STRIP);
  _node.swapFBO('velocity');
  // 次にdyeについて
  //_node.setViewport(0, 0, dyeRes.frameWidth, dyeRes.frameHeight);
  _node.bindFBO('dye')
       .setFBO('uTarget', 'dye')
       .setUniform('color', [col.r, col.g, col.b])
       .drawArrays(gl.TRIANGLE_STRIP)
       .swapFBO('dye')
       .clear();
  // おしまい
}

function applyInputs(){
  if(splatStack.length > 0){
    multipleSplats(splatStack.pop());
  }
  // ここですね。pointersのpointerがmovedの場合にそれを、フラグを折りつつ、splatを実行する。
  pointers.forEach(p => {
    if (p.moved){
      p.moved = false;
      splatPointer(p);
    }
  });
}

// --------------------------------------------------------------- //
// texture float usability check.
// RenderNodeの処理にした方がいいかもです

// texture floatが使えるかどうかチェック

// extは外部変数にするべき
// というかp5wgexから内容をアクセスできるようにする
// HALF_FLOAT_OESがこちらからしか使えないみたいなので（拡張機能）
// webgl2ならgl.HALF_FLOATがあるんですけどね。使えないのです。

// というわけでextensionsの確認メソッドにしました
// ext={}に順次追加していきます
// 引っかかったらalertを発信
function confirmExtensions(){
  ext.textureFloat = gl.getExtension('OES_texture_float');
  // これのHALF_FLOAT_OESが欲しいわけですね
  ext.textureHalfFloat = gl.getExtension('OES_texture_half_float');
  // halfFloatでlinearが使える場合これが何らかのオブジェクトになる感じ
  ext.textureHalfFloatLinear = gl.getExtension('OES_texture_half_float_linear');
  ext.elementIndexUint = gl.getExtension('OES_element_index_uint');
  if(ext.textureFloat == null || ext.textureHalfFloat == null){
    alert('float texture not supported');
  }
  if(ext.elementIndexUint == null){
    alert('Your web browser does not support the WebGL Extension OES_element_index_uint.');
  }
}

// --------------------------------------------------------------- //
// global functions.

// framebuffer.

// 名前もcreate_fboに変更
// resizeするならnameがないとね
function create_fbo(name, texId, w, h, textureFormat, filterParam){
  // フォーマットチェック
  if(!textureFormat){
    textureFormat = gl.UNSIGNED_BYTE;
  }
  if(!filterParam){
    filterParam = gl.NEAREST;
  }

  // フレームバッファの生成
  let framebuffer = gl.createFramebuffer();

  // フレームバッファをWebGLにバインド
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  // 深度バッファ用レンダーバッファの生成とバインド
  let depthRenderBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);

  // レンダーバッファを深度バッファとして設定
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);

  // フレームバッファにレンダーバッファを関連付ける
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

  // フレームバッファ用テクスチャの生成
  let fTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + texId);

  // フレームバッファ用のテクスチャをバインド
  gl.bindTexture(gl.TEXTURE_2D, fTexture);

  // フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, textureFormat, null);

  // テクスチャパラメータ
  // このNEARESTのところを可変にする
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterParam);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterParam);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // フレームバッファにテクスチャを関連付ける
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
  // 中身をクリアする(clearに相当する)
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

  // 各種オブジェクトのバインドを解除
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // オブジェクトを返して終了
  return {f:framebuffer, d:depthRenderBuffer, t:fTexture, id:texId, name:name, frameWidth:w, frameHeight:h, texelSizeX:1/w, texelSizeY:1/h};
}

// fboのペアを作る
// nameはreadやwriteの中に入ってるイメージですかね
function create_double_fbo(name, texId, w, h, textureFormat, filterParam){
  // texIdは片方について1増やす
  let fbo1 = create_fbo(name, texId, w, h, textureFormat, filterParam);
  let fbo2 = create_fbo(name, texId + 1, w, h, textureFormat, filterParam);
  let doubleFbo = {};
  doubleFbo.read = fbo1;
  doubleFbo.write = fbo2;
  doubleFbo.swap = function(){
    let tmp = this.read;
    this.read = this.write;
    this.write = tmp;
  }
  doubleFbo.frameWidth = w;
  doubleFbo.frameHeight = h;
  doubleFbo.texelSizeX = 1/w;
  doubleFbo.texelSizeY = 1/h;
  doubleFbo.name = name; // まあ直接アクセスできる方がいいよね
  return doubleFbo;
}

// リサイズ～
// 新しいそれが同じ名前になる必要がある？
// もとのそれをリネームして...とかする必要がありそう。んー－－。
// これ単独の場合にしか使えないね...RenderNodeさんを生かすならば。
// ちょい書き換え...新しく作ってそこに落としてそれをregist上書き。バグってるかどうかは使わないと分かりません（え？）
function resize_fbo(target, texId, w, h, textureFormat, filterParam){
  // targetの名前をcopyにする
  //_node.renameFBO(target.name, target.name + 'copy');
  // targetの
  let newFBO = create_fbo(target.name, texId, w, h, textureFormat, filterParam);
  // これにtargetのtextureをコピペする感じですかね
  // viewport...
  //_node.setViewport(0, 0, w, h);
  //_node.bindFBO(target.name);
  _node.bindFBO(newFBO); // これで！
  _node.use('copy', 'simple')
       .setAttribute()
       //.setUniform('texelSize', [1/w, 1/h])
       .setFBO('uTexture', target.name) // 'copy'は要らない！
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
  _node.registFBO(newFBO); // これでいけるはず。分かんないけど。
  //_node.deleteFBO(target.name + 'copy');
  return newFBO;
}

// ダブルのリサイズ～
// rightの方に書き込む感じ
function resize_double_fbo(target, texId, w, h, textureFormat, filterParam){
  if(target.frameWidth == w && target.frameHeight == h){
    return target;
  }
  // targetのreadはresizeする。
  // 単独のあれは使えないので...どうしよ。
  // 新しいのを作ってそこに落としてからはめこむ。
  // できました。難しくなかったですね。
  let newFBO = create_fbo(target.name, texId, w, h, textureFormat, filterParam);
  // 新しいbindFBOにより、直接fboを入れられるようになった。
  _node.bindFBO(newFBO);
  _node.use('copy', 'simple')
       .setAttribute()
       //.setUniform('texelSize', [1/w, 1/h])
       .setFBO('uTexture', target.name)
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
  target.read = newFBO;
  //target.read = resize_fbo(target.read, texId, w, h, textureFormat, filterParam);
  // writeは普通に新しく作る。
  target.write = create_fbo(target.name, texId + 1, w, h, textureFormat, filterParam);
  target.frameWidth = w;
  target.frameHeight = h;
  target.texelWidth = 1/w;
  target.texelHeight = 1/h;
  return target;
}

// initFramebuffers.
function initFramebuffers(){
  // wやhの代わりにsimResとdyeResを使う
  let simRes = getResolution(config.SIM_RESOLUTION);
  let dyeRes = getResolution(config.DYE_RESOLUTION);
  const halfFloat = ext.textureHalfFloat.HALF_FLOAT_OES;
  const linearFilterParam = (ext.textureHalfFloatLinear ? gl.LINEAR : gl.NEAREST);

  gl.disable(gl.BLEND);

  // dyeを0にしてvelocityを2にしたらうまくいったので順番大事らしい

  // dyeについて必要ならresize処理
  if(!_node.existFBO("dye")){
    _node.registDoubleFBO("dye", 0, dyeRes.frameWidth, dyeRes.frameHeight, halfFloat, linearFilterParam);
  }else{
    _node.resizeDoubleFBO("dye", 0, dyeRes.frameWidth, dyeRes.frameHeight, halfFloat, linearFilterParam);
  }

  // velocityについて必要ならresize処理
  if(!_node.existFBO("velocity")){
    _node.registDoubleFBO("velocity", 2, simRes.frameWidth, simRes.frameHeight, halfFloat, linearFilterParam);
  }else{
    _node.resizeDoubleFBO("velocity", 2, simRes.frameWidth, simRes.frameHeight, halfFloat, linearFilterParam);
  }

  // 0,1がvelocityで2,3がdyeで4がdivergenceで5がcurlで6,7がpressureです
  // 8以降を今から用意する
  _node.registFBO('divergence', 4, simRes.frameWidth, simRes.frameHeight, halfFloat, gl.NEAREST);
  _node.registFBO('curl', 5, simRes.frameWidth, simRes.frameHeight, halfFloat, gl.NEAREST);
  _node.registDoubleFBO('pressure', 6, simRes.frameWidth, simRes.frameHeight, halfFloat, gl.NEAREST);

  // TODO
  initBloomFramebuffers(); // 8,9,10,11,12,13,14,15,16.
  initSunrayFramebuffers();// 17,18.
}

// とりあえずこの辺用意してシェーダー用意してって地道にやってくわ。
function initBloomFramebuffers(){
  let res = getResolution(config.BLOOM_RESOLUTION);
  const halfFloat = ext.textureHalfFloat.HALF_FLOAT_OES;
  const linearFilterParam = (ext.textureHalfFloatLinear ? gl.LINEAR : gl.NEAREST);
  // bloom_0と、bloom_1～bloom_8を用意する感じ
  _node.registFBO('bloom_0', 8, res.frameWidth, res.frameHeight, halfFloat, linearFilterParam);
  // ITERATIONSは最大で8で...まあ8で。
  // bloom_0を用意した。bloom_1～bloom_8が用意される（予定）
  for(let i = 1; i <= config.BLOOM_ITERATIONS; i++){
    let fw = (res.frameWidth >> i);
    let fh = (res.frameHeight >> i);
    _node.registFBO('bloom_' + i, 8 + i, fw, fh, halfFloat, linearFilterParam);
  }
}

function initSunrayFramebuffers(){
  let res = getResolution(config.SUNRAYS_RESOLUTION);
  const halfFloat = ext.textureHalfFloat.HALF_FLOAT_OES;
  const linearFilterParam = (ext.textureHalfFloatLinear ? gl.LINEAR : gl.NEAREST);

  _node.registFBO('sunrays', 17, res.frameWidth, res.frameHeight, halfFloat, linearFilterParam);
  _node.registFBO('sunraysTemp', 18, res.frameWidth, res.frameHeight, halfFloat, linearFilterParam);
}

// vboの作成
function create_vbo(data){
  // バッファオブジェクトの生成
  let vbo = gl.createBuffer();

  // バッファをバインドする
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  // バッファにデータをセット
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

  // バッファのバインドを無効化
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // 生成したVBOを返して終了
  return vbo;
}

// attributeの登録
function set_attribute(attributes){
  // 引数として受け取った配列を処理する
  for(let name of Object.keys(attributes)){
    const attr = attributes[name];
    // バッファをバインドする
    gl.bindBuffer(gl.ARRAY_BUFFER, attr.vbo);

    // attributeLocationを有効にする
    gl.enableVertexAttribArray(attr.location);

    // attributeLocationを通知し登録する
    gl.vertexAttribPointer(attr.location, attr.stride, gl.FLOAT, false, 0, 0);
  }
}

// iboの作成
function create_ibo(data, type){
  // type:Uint16ArrayまたはUint32Array.
  // バッファオブジェクトの生成
  let ibo = gl.createBuffer();

  // バッファをバインドする
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

  // バッファにデータをセット
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new (type)(data), gl.STATIC_DRAW);

  // バッファのバインドを無効化
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // 生成したIBOを返して終了
  return ibo;
}

// --------------------------------------------------------------- //
// utility.

function _RGB(r, g, b){
  if(arguments.length === 1){
    g = r;
    b = r;
  }
  return {r:r, g:g, b:b};
}

function _HSV(h, s, v){
  h = constrain(h, 0, 1);
  s = constrain(s, 0, 1);
  v = constrain(v, 0, 1);
  let _r = constrain(abs(((6 * h) % 6) - 3) - 1, 0, 1);
  let _g = constrain(abs(((6 * h + 4) % 6) - 3) - 1, 0, 1);
  let _b = constrain(abs(((6 * h + 2) % 6) - 3) - 1, 0, 1);
  _r = _r * _r * (3 - 2 * _r);
  _g = _g * _g * (3 - 2 * _g);
  _b = _b * _b * (3 - 2 * _b);
  let result = {};
  result.r = v * (1 - s + s * _r);
  result.g = v * (1 - s + s * _g);
  result.b = v * (1 - s + s * _b);
  return result;
}

// _HSVの結果を0.15倍してるだけなんだけどどうも使い回してるようで。
// そんな感じですかね。hueを引数にした方が良いね。
function generateColor(_hue){
  let _rgb = _HSV(_hue, 1.0, 1.0);
  return {r:_rgb.r * 0.15, g:_rgb.g * 0.15, b:_rgb.b * 0.15};
}

// aspect比は先に掛ける...みたいな。??
function correctRadius(radius){
  let aspectRatio = width / height;
  if (aspectRatio > 1)
    radius *= aspectRatio;
  return radius;
}

// calcDeltaTime
function calcDeltaTime(){
  let _now = Date.now();
  let dt = (_now - lastUpdateTime) / 1000;
  dt = Math.min(dt, 0.016666);
  lastUpdateTime = _now;
  return dt;
}

// 3次行列式。
function calcDet(a,b,c,d,e,f,g,h,i){
  const det = a*(e*i-f*h) + b*(f*g-d*i) + c*(d*h-e*g);
  return det;
}

// ちょっとした工夫
// 2べきに合わせるということらしい
function getResolution(resolution){
  let aspectRatio = width / height;
  //let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  if(aspectRatio < 1){ aspectRatio = 1.0 / aspectRatio; }
  // 要するに縦横のでかい方÷小さい方
  let _min = Math.round(resolution);
  let _max = Math.round(resolution * aspectRatio);

  if(width > height){
    return {frameWidth: _max, frameHeight: _min};
  }
  return {frameWidth: _min, frameHeight: _max};
}

function normalizeColor(input){
  let output = {r:input.r / 255, g:input.g / 255, b:input.b / 255};
  return output;
}

// wrap持ってきた。
function wrap (value, min, max) {
    let range = max - min;
    if (range == 0) return min;
    return (value - min) % range + min;
}

// --------------------------------------------------------------- //
// interaction.
// 帰ったらやる！！
// pointerはあれ、タッチだと複数出るんだけど、マウスだと1個までなのよ。

function mouseDownAction(e){
  let pointer = pointers.find(p => p.id == -1); // idが-1のpointerを探してあったらそれを取る
  // 無い場合は新しく生成する
  if(pointer == null){
    pointer = new pointerPrototype();
  }
  updatePointerDownData(pointer, -1, e.offsetX, e.offsetY);
}

function mouseMoveAction(e){
  let pointer = pointers[0];
  if(!pointer.down){ return; }
  updatePointerMoveData(pointer, e.offsetX, e.offsetY);
}

function mouseUpAction(){
  updatePointerUpData(pointers[0]);
}

// pointerの初期設定ですね～色はランダムのようです。
function updatePointerDownData(pointer, id, posX, posY){
  pointer.id = id;
  pointer.down = true;
  pointer.moved = false;
  // どうも位置情報を左下(0,0)で(0,0)～(1,1)に正規化しているみたいです
  pointer.texcoordX = posX / width;
  pointer.texcoordY = 1.0 - posY / height;
  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;
  pointer.deltaX = 0;
  pointer.deltaY = 0;
  pointer.color = generateColor(Math.random());
}

// posX,posYはそのときのマウス位置で、pointerが持ってるのと比較して移動判定する。
// 移動が認識されたら
function updatePointerMoveData(pointer, posX, posY){
  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;
  pointer.texcoordX = posX / width;
  pointer.texcoordY = 1.0 - posY / height;
  pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
  pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
  pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
}

// 簡単なメソッドでもこうして、ね。
function updatePointerUpData(pointer){
  pointer.down = false;
}

// 元になるのはテクスチャ座標ベースでの変位なのでたとえば縦長ならDeltaXで横方向縮小し
function correctDeltaX(delta){
  let aspectRatio = canvas.width / canvas.height;
  if (aspectRatio < 1){ delta *= aspectRatio; }
  return delta;
}

// 横長ならDeltaYで縦方向縮小する（必ず縮小する流れ）
function correctDeltaY(delta){
  let aspectRatio = canvas.width / canvas.height;
  if (aspectRatio > 1){ delta /= aspectRatio; }
  return delta;
}

// --------------------------------------------------------------- //
// UnionFind.

// 0,1,2,...,n-1をqueryでまとめる
// いくつの塊になったのかとそのレベルを返す感じ（lvで参照できる）
function getUnionFind(n, query){
  let parent = [];
  let rank = [];
  for(let i = 0; i < n; i++){
    parent.push(i);
    rank.push(0);
  }
  function Find(a){
    if(parent[a] == a){
      return a;
    }else{
      parent[a] = Find(parent[a]);
      return parent[a];
    }
  }
  function Union(a, b){
    let aRoot = Find(a);
    let bRoot = Find(b);
    if(rank[aRoot] > rank[bRoot]){
      parent[bRoot] = aRoot;
    }else if(rank[bRoot] > rank[aRoot]){
      parent[aRoot] = bRoot;
    }else if(aRoot != bRoot){
      parent[bRoot] = aRoot;
      rank[aRoot] = rank[aRoot] + 1;
    }
  }
  for(let i = 0; i < 2; i++){
    for(let q of query){
      Union(q[0], q[1]);
    }
  }
  let uf = [];
  for(let i = 0; i < n; i++){
    uf.push({id:i, pt:parent[i]});
  }
  uf.sort((x, y) => {
    if(x.pt < y.pt){ return -1; }
    if(x.pt > y.pt){ return 1; }
    return 0;
  });
  uf[0].lv = 0;
  let count = 1;
  for(let i = 1; i < n; i++){
    if(uf[i].pt == uf[i-1].pt){
      uf[i].lv = uf[i-1].lv;
    }else{
      uf[i].lv = uf[i-1].lv + 1;
      count++;
    }
  }
  uf.sort((x, y) => {
    if(x.id < y.id){ return -1; }
    if(x.id > y.id){ return 1; }
    return 0;
  });
  return {uf:uf, count:count}; // countは集合の個数
}

// --------------------------------------------------------------- //
// RenderSystem class.
// shaderとprogramとtopologyのsetとあとテクスチャのロケーション
// その組です
// topologyはattribute群ですね
// たとえば立方体やトーラスを登録するわけ（もちろん板ポリも）

class RenderSystem{
  constructor(name, _shader){
    this.name = name;
    this.shader = _shader;
    shader(_shader);
    this.program = _shader._glProgram;
    this.topologies = {};
    this.uniformLocations = {};
  }
  getName(){
    return this.name;
  }
  registTopology(topologyName){
    if(this.topologies[topologyName] !== undefined){ return; }
    this.topologies[topologyName] = new Topology(topologyName);
  }
  getProgram(){
    return this.program;
  }
  getShader(){
    return this.shader;
  }
  getTopology(topologyName){
    return this.topologies[topologyName];
  }
  registUniformLocation(uniformName){
    if(this.uniformLocations[uniformName] !== undefined){ return; }
    this.uniformLocations[uniformName] = gl.getUniformLocation(this.program, uniformName);
  }
  setTexture(uniformName, _texture, locationID){
    gl.activeTexture(gl.TEXTURE0 + locationID);
    gl.bindTexture(gl.TEXTURE_2D, _texture);
    gl.uniform1i(this.uniformLocations[uniformName], locationID);
  }
}

// --------------------------------------------------------------- //
// RenderNode class.
// RenderSystemを登録して名前で切り替える感じ
// こっちで統一しよう。で、トポロジー。
// 一つのプログラムに複数のトポロジーを登録できる
// そして同じプログラムを使い回すことができる
// 立方体やトーラスを切り替えて描画したりできるというわけ

class RenderNode{
  constructor(){
    this.renderSystems = {};
    this.framebufferObjects = {}; // 追加！！
    this.currentRenderSystem = undefined;
    this.currentShader = undefined;
    this.currentTopology = undefined;
    this.useTextureFlag = false;
    this.uMV = new p5.Matrix(); // デフォルト4x4行列
    // uMVをここにコピーして使い回す感じ
  }
  registRenderSystem(renderSystemName, _shader){
    if(this.renderSystems[renderSystemName] !== undefined){ return this; }
    this.renderSystems[renderSystemName] = new RenderSystem(renderSystemName, _shader);
    // regist時に自動的にuseされるイメージ
    this.useRenderSystem(renderSystemName);
    return this;
  }
  useRenderSystem(renderSystemName){
    // 使うプログラムを決める
    this.currentRenderSystem = this.renderSystems[renderSystemName];
    this.currentShader = this.currentRenderSystem.getShader();
    this.currentShader.useProgram();
    return this;
  }
  registTopology(topologyName){
    // currentProgramに登録するので事前にuseが必要ですね
    this.currentRenderSystem.registTopology(topologyName);
    // regist時に自動的にuseされる
    this.useTopology(topologyName);
    return this;
  }
  useTopology(topologyName){
    // たとえば複数のトポロジーを使い回す場合ここだけ切り替える感じ
    this.currentTopology = this.currentRenderSystem.getTopology(topologyName);
    return this;
  }
  regist(renderSystemName, _shader, topologyName){
    // registでまとめてやる処理とする
    this.registRenderSystem(renderSystemName, _shader);
    this.registTopology(topologyName);
    return this;
  }
  use(renderSystemName, topologyName){
    // まとめてやれた方がいい場合もあるので
    //if(this.renderSystems[renderSystemName] == undefined){ return this; }
    this.useRenderSystem(renderSystemName);
    //this.registTopology(topologyName); // 登録済みなら何もしない
    this.useTopology(topologyName);
    return this;
  }
  existFBO(target){
    // あるかどうかチェックする関数. targetがfboの場合はそれが持つnameで見る。
    if(typeof(target) == 'string'){
      return this.framebufferObjects[target] !== undefined;
    }
    return this.framebufferObjects[target.name] !== undefined;
  }
  registFBO(target, texId, w, h, textureFormat, filterParam){
    // fboをセット(同じ名前の場合は新しく作って上書き)
    // targetがstringの場合はcreate_fboするけど
    // fbo自身の場合にはそれをはめこんで終了って感じにする
    if(typeof(target) == 'string'){
      let fbo = create_fbo(target, texId, w, h, textureFormat, filterParam);
      this.framebufferObjects[target] = fbo;
      return this;
    }
    // targetがfboの場合。名前はtargetが持ってるはず。直接放り込む。
    this.framebufferObjects[target.name] = target;
    return this;
  }
  registDoubleFBO(targetName, texId, w, h, textureFormat, filterParam){
    //doubleFBOをセット(同じ名前の場合は新しく作って上書き)
    let fbo = create_double_fbo(targetName, texId, w, h, textureFormat, filterParam);
    this.framebufferObjects[targetName] = fbo;
    return this;
  }
  resizeFBO(targetName, texId, w, h, textureFormat, filterParam){
    // resizeもメソッド化しないと...
    let fbo = this.framebufferObjects[targetName];
    this.framebufferObjects[targetName] = resize_fbo(fbo, texId, w, h, textureFormat, filterParam);
  }
  resizeDoubleFBO(targetName, texId, w, h, textureFormat, filterParam){
    // リサイズダブル。これらはreturn thisしなくていいでしょうね
    let fbo = this.framebufferObjects[targetName];
    this.framebufferObjects[targetName] = resize_double_fbo(fbo, texId, w, h, textureFormat, filterParam);
  }
  bindFBO(target){
    // FBOをbindもしくはnullで初期化。ダブルの場合はwriteをセット。viewport設定機能を追加。
    if(typeof(target) == 'string'){
      let fbo = this.framebufferObjects[target];
      if(!fbo){ return this; }
      if(fbo.write){
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.write.f);
        gl.viewport(0, 0, fbo.frameWidth, fbo.frameHeight);
        return this;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.f);
      gl.viewport(0, 0, fbo.frameWidth, fbo.frameHeight);
      return this;
    }
    if(target == null){
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height); // nullの場合は全体
      return this;
    }
    // targetがfboそのものの場合。
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.f);
    gl.viewport(0, 0, target.frameWidth, target.frameHeight);
    return this;
  }
  clearFBO(){
    // そのときにbindしているframebufferのクリア操作
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    return this; // ←これが欲しいだけ。
  }
  setFBO(uniformName, FBOName, alternative = false){
    // FBOを名前経由でセット。ダブルの場合はreadをセット。
    // alternative == trueの場合にfbo.writeがあるならそっち！
    // sunraysのblurでそういうことしてるので対応させる感じね
    if(FBOName == null){ return this; }
    let fbo = this.framebufferObjects[FBOName];
    if(!fbo){ return this; }
    if(fbo.read){
      if(!alternative){
        this.setTexture(uniformName, fbo.read.t, fbo.read.id);
      }else{
        this.setTexture(uniformName, fbo.write.t, fbo.write.id);
      }
      return this;
    }
    this.setTexture(uniformName, fbo.t, fbo.id);
    return this;
  }
  swapFBO(FBOName){
    // ダブル前提。ダブルの場合にswapする
    if(FBOName == null){ return this; }
    let fbo = this.framebufferObjects[FBOName];
    if(fbo.read && fbo.write){ fbo.swap(); }
    return this;
  }
  registAttribute(attributeName, data, stride){
    this.currentTopology.registAttribute(this.currentRenderSystem.getProgram(), attributeName, data, stride);
    return this;
  }
  registAttributes(attrData){
    for(let attrName of Object.keys(attrData)){
      const attr = attrData[attrName];
      this.registAttribute(attrName, attr.data, attr.stride);
    }
    return this;
  }
  setAttribute(){
    // その時のtopologyについて準備する感じ
    this.currentTopology.setAttribute();
    return this;
  }
  registIndexBuffer(data, type){
    // デフォルトはUint16Array. 多い場合はUint32Arrayを指定する。
    if(type === undefined){ type = Uint16Array; }
    this.currentTopology.registIndexBuffer(data, type);
    return this;
  }
  bindIndexBuffer(){
    this.currentTopology.bindIndexBuffer();
    return this;
  }
  registUniformLocation(uniformName){
    this.currentRenderSystem.registUniformLocation(uniformName);
    return this;
  }
  setTexture(uniformName, _texture, locationID){
    this.currentRenderSystem.setTexture(uniformName, _texture, locationID);
    this.useTextureFlag = true; // 1回でも使った場合にtrue
    return this;
  }
  setUniform(uniformName, data){
    this.currentShader.setUniform(uniformName, data);
    return this;
  }
  clear(){
    // 描画の後処理
    // topologyを切り替える場合にも描画後にこれを行なったりする感じ
    // 同じプログラム、トポロジーで点描画や線描画を行う場合などは
    // その限りではない（レアケースだけどね）
    this.currentTopology.clear();
    // textureを使っている場合はbindを解除する
    if(this.useTextureFlag){
      gl.bindTexture(gl.TEXTURE_2D, null);
      this.useTextureFlag = false;
    }
    return this;
  }
  setViewport(x, y, w, h){
    gl.viewport(x, y, w, h);
    return this;
  }
  setMatrixStandard(){
    // uMVをuMVMatrixとして一通り通知する関数
    const sh = this.currentShader;
    sh.setUniform('uProjectionMatrix', _gl.uPMatrix.mat4);
    sh.setUniform('uModelViewMatrix', this.uMV.mat4);
    sh.setUniform('uViewMatrix', _gl._curCamera.cameraMatrix.mat4);
    _gl.uNMatrix.inverseTranspose(this.uMV);
    sh.setUniform('uNormalMatrix', _gl.uNMatrix.mat3);
  }
  setMatrix(tf){
    // uMVとuPとuViewとuNormalを登録(uNormalは使われないこともあるけど)
    //let uMV = _gl.uMVMatrix.copy();
    // this.uMVにuMVMatrixの内容をコピー
    for(let i = 0; i < 16; i++){
      this.uMV.mat4[i] = _gl.uMVMatrix.mat4[i];
    }
    if(tf !== undefined){
      this.transform(tf); // tfは配列。tr, rotX, rotY, rotZ, scale.
      // rotAxisも一応残しといて。
    }
    this.setMatrixStandard();
    return this;
  }
  transform(tf){
    // tfのコマンドに従っていろいろ。
    for(let command of tf){
      const name = Object.keys(command)[0];
      const value = command[name];
      switch(name){
        case "tr":
          // 長さ1の配列の場合は同じ値にする感じで
          if(value.length === 1){ value.push(value[0], value[0]); }
          this.uMV.translate(value);
          break;
        // rotX～rotZはすべてスカラー値
        case "rotX":
          this.uMV.rotateX(value); break;
        case "rotY":
          this.uMV.rotateY(value); break;
        case "rotZ":
          this.uMV.rotateZ(value); break;
        case "rotAxis":
          // 角度と、軸方向からなる長さ4の配列
          this.uMV.rotate(...value); break;
        case "scale":
          // 長さ1の場合は同じ値にする。
          if(value.length === 1){ value.push(value[0], value[0]); }
          this.uMV.scale(...value); break;
      }
    }
  }
  setVertexColor(){
    const sh = this.currentShader;
    sh.setUniform('uUseColorFlag', 0);
    return this;
  }
  setMonoColor(col, a = 1){
    const sh = this.currentShader;
    sh.setUniform('uUseColorFlag', 1);
    sh.setUniform('uMonoColor', [col.r, col.g, col.b, a]);
    return this;
  }
  setDirectionalLight(col, x, y, z){
    const sh = this.currentShader;
    sh.setUniform('uUseDirectionalLight', true);
    sh.setUniform('uDirectionalDiffuseColor', [col.r, col.g, col.b]);
    sh.setUniform('uLightingDirection', [x, y, z]);
    return this;
  }
  setAmbientLight(col){
    const sh = this.currentShader;
    sh.setUniform('uAmbientColor', [col.r, col.g, col.b]);
    return this;
  }
  setPointLight(col, x, y, z, att0 = 1, att1 = 0, att2 = 0){
    // att0,att1,att2はattenuation（減衰）
    // たとえば0,0,1だと逆2乗の減衰になるわけ
    const sh = this.currentShader;
    sh.setUniform('uUsePointLight', true);
    sh.setUniform('uPointLightDiffuseColor', [col.r, col.g, col.b]);
    sh.setUniform('uPointLightLocation', [x, y, z]);
    sh.setUniform('uAttenuation', [att0, att1, att2]);
    return this;
  }
  drawArrays(mode, first, count){
    // 引数はドローコール、スタートと終わりなんだけどね。んー。
    // トポロジーがサイズ持ってるからそれ使って描画？
    if(arguments.length == 1){
      first = 0;
      count = this.currentTopology.getAttrSize();
    }
    gl.drawArrays(mode, first, count);
    return this;
  }
  drawElements(mode, count){
    // 大きい場合はgl.UNSIGNED_INTを指定
    const _type = this.currentTopology.getIBOType();
    const type = (_type === Uint16Array ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT);
    // 基本的にサイズをそのまま使うので
    if(count === undefined){ count = this.currentTopology.getIBOSize(); }
    gl.drawElements(mode, count, type, 0);
    return this;
  }
  flush(){
    gl.flush();
    return this;
  }
}

// --------------------------------------------------------------- //
// Topology class.
// topologyのsetを用意して、それで・・・うん。
// 同じ内容でもプログラムが違えば違うトポロジーになるので
// 使い回しはできないですね・・・（ロケーション）

class Topology{
  constructor(name){
    this.name = name;
    this.attributes = {}; // Object.keysでフェッチ。delete a[name]で削除。
    this.attrSize = 0;
    this.ibo = undefined;
    this.iboType = undefined;
    this.iboSize = 0;
  }
  getName(){
    return this.name;
  }
  getAttrSize(){
    return this.attrSize;
  }
  getIBOType(){
    return this.iboType;
  }
  getIBOSize(){
    return this.iboSize;
  }
  registAttribute(program, attributeName, data, stride){
    let attr = {};
    attr.vbo = create_vbo(data);
    attr.location = gl.getAttribLocation(program, attributeName);
    attr.stride = stride;
    this.attrSize = Math.floor(data.length / stride); // attrの個数
    this.attributes[attributeName] = attr;
  }
  setAttribute(){
    set_attribute(this.attributes);
  }
  registIndexBuffer(data, type){
    this.ibo = create_ibo(data, type);
    this.iboType = type;
    this.iboSize = data.length; // iboのサイズ
  }
  bindIndexBuffer(){
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
  }
  clear(){
    // 描画が終わったらbindを解除する
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    if(this.ibo !== undefined){ gl.bindBuffer(gl.ELEMENT_BUFFER, null); }
    return this;
  }
}
// ------------------------------------------------------------ //

// ------------------------------------------------------------ //
// BackgroundManager.
// やりかたとしては・・ね、
// まずこれを作って、
// 使い方1:普通に2Dでなんか描いてそれずーっとうしろにおいておく
// これはdrawでいろいろ描いたうえでdisplayしまくりだけ
// 使い方2:2Dで以下略

// 名前を付けました。
// これで複数のbgManagerを併用できる。
// _nodeは一つしかないので複数ほしいときに困るわけです・・
// まあメモリ解放すればいいんだろうけど。

// uniformIdを追加
class BackgroundManager{
  constructor(uniformId){
    const id = BackgroundManager.id++;
    this.name = "bgManager" + id;
    this.uniformId = uniformId; // uniform使用時のテクスチャ番号
    this.layers = [];
    this.layers.push(createGraphics(width, height));
    this.currentLayerId = 0;
    // シェーダーとか用意して_node.use("bgShader", "bg")とでもして
    // もろもろ用意する感じですかね
    // 余裕があればポストエフェクト（・・・）
    let _shader = this.getBGShader();
    _node.regist(this.name, _shader, 'plane')
         .registAttribute('aPosition', [-1,1,1,1,-1,-1,1,-1], 2)
         .registUniformLocation('uTex');
    this.texture = new p5.Texture(_gl, this.layers[0]);
  }
  getBGShader(){
    // bgShader. 背景を描画する。
    const bgVert=
    "precision mediump float;" +
    "attribute vec2 aPosition;" +
    "void main(){" +
    "  gl_Position = vec4(aPosition, 0.0, 1.0);" +
    "}";
    const bgFrag=
    "precision mediump float;" +
    "uniform sampler2D uTex;" +
    "uniform vec2 uResolution;" +
    "void main(){" +
    "  vec2 p = gl_FragCoord.xy / uResolution.xy;" +
    "  p.y = 1.0 - p.y;" +
    "  vec4 tex = texture2D(uTex, p);" +
    "  if(tex.a < 0.5){ discard; }" + // 透明度0でdiscardしないとダメ
    "  gl_FragColor = tex;" +
    "}";
    return createShader(bgVert, bgFrag);
  }
  addLayer(){
    this.layers.push(createGraphics(width, height));
    return this;
  }
  removeLayer(id){
    if(id === 0){ return; } // 0番は特別なのでリムーブしないでください
    this.layers.splice(id, 1);
  }
  setLayer(id){
    this.currentLayerId = id;
    return this;
  }
  getLayer(id){
    // 柔軟性大事
    return this.layers[id];
  }
  draw(command, args = []){
    this.layers[this.currentLayerId][command](...args);
    return this;
  }
  resizeDestroy(w, h){
    // すべてのlayerを新しいサイズで置き換える
    for(let layer of this.layers){
      layer.resizeCanvas(w, h); // resizeじゃないですよ。
      layer.clear();
    }
    // こんだけ。
  }
  display(){
    // 0おいて1おいて・・
    gl.disable(gl.DEPTH_TEST);
    // uMVMatrixをいじる必要はないです
    // 「そういう」行列を渡せばいいだけの話なのでいじらないでくださいね
    // 0番に1,2,3,...を乗せていきます
    for(let i = 1; i < this.layers.length; i++){
      this.layers[0].image(this.layers[i], 0, 0);
    }
    this.texture.update();
    camera(0, 0, height * 0.5 * Math.sqrt(3), 0, 0, 0, 0, 1, 0);
    _node.use(this.name, 'plane')
         .setAttribute()
         .setTexture('uTex', this.texture.glTex, this.uniformId) // 0はbg用に予約。
         .setUniform("uResolution", [width, height])
         .drawArrays(gl.TRIANGLE_STRIP)
         .clear(); // clearも忘れずに
    gl.enable(gl.DEPTH_TEST);
  }
}

BackgroundManager.id = 0; // 識別子

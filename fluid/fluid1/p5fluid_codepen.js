// 参考：codePenのこれ
// https://codepen.io/PavelDoGreat/pen/zdWzEL
// pavel(@PavelDoGreat)さんの流体シミュレーション。

// こっちにも貼っておかないとね。

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

// --------------------------------------------------------- //
// config.

let config = {
  TEXTURE_DOWNSAMPLE: 1,
  DENSITY_DISSIPATION: 0.98,
  VELOCITY_DISSIPATION: 0.99,
  PRESSURE_DISSIPATION: 0.8,
  PRESSURE_ITERATIONS: 25,
  VISCOSITY_ITERATIONS: 25,
  CURL: 30,
  SPLAT_RADIUS: 0.005,
  SPEED_FACTOR: 10.0,
  VISCOSITY: 500.0
}

let pointers = [];
let splatStack = [];

let gl, _gl;
let _node;

let ext = {}; // extをグローバルにする実験

let textureWidth;
let textureHeight;

// fboはノングローバルにしました。

let lastTime; // 最後に記録した時間

let bg;

// ---------------------------------------------------------- //
// pointer.

class pointerPrototype{
  constructor(){
    this.id = -1;
    this.x = 0;
    this.y = 0;
    this.dx = 0;
    this.dy = 0;
    this.down = false;
    this.moved = false;
    this.color = [30, 0, 300];
  }
  setId(newId){
    this.id = newId;
  }
  activate(){
    this.down = true;
  }
  inActivate(){
    this.down = false;
  }
  fire(){
    this.moved = this.down;
  }
  fireOff(){
    this.moved = false;
  }
  update(x, y){
    this.dx = (x - this.x) * SPEED_FACTOR;
    this.dy = (y - this.y) * SPEED_FACTOR;
    this.x = x;
    this.y = y;
  }
}


// --------------------------------------------------------- //
// shader.

const baseVertexShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"attribute vec2 aPosition;" +
"varying vec2 vUv;" +
"varying vec2 vL;" +
"varying vec2 vR;" +
"varying vec2 vT;" +
"varying vec2 vB;" +
"uniform vec2 texelSize;" + // texelSizeを使う

"void main () {" +
  "vUv = aPosition * 0.5 + 0.5;" +
  "vL = vUv - vec2(texelSize.x, 0.0);" +
  "vR = vUv + vec2(texelSize.x, 0.0);" +
  "vT = vUv + vec2(0.0, texelSize.y);" +
  "vB = vUv - vec2(0.0, texelSize.y);" +
  "gl_Position = vec4(aPosition, 0.0, 1.0);" +
"}";

const clearShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"varying vec2 vUv;" +
"uniform sampler2D uTexture;" +
"uniform float value;" +

"void main () {" +
  "gl_FragColor = value * texture2D(uTexture, vUv);" +
"}";

const displayShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"varying vec2 vUv;" +
"uniform sampler2D uTexture;" +

"void main () {" +
  "gl_FragColor = texture2D(uTexture, vUv);" +
"}";

// 速度に関しては
// https://mofu-dev.com/blog/stable-fluids/における
// externalForceと同じ(ような)処理と思われる
// length(p)のところを別の距離関数にしたら面白そう
// あるいはdxdyの情報使ってなんかやってもいいかも
const splatShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"varying vec2 vUv;" +
"uniform sampler2D uTarget;" +
"uniform float aspectRatio;" +
"uniform vec3 color;" +
"uniform vec2 point;" +
"uniform float radius;" +

"void main () {" +
  "vec2 q = vUv;" +
  "vec2 p = q - point.xy;" +
  "p.x *= aspectRatio;" +
  "float d = length(p);" +
  //"d = max(abs(p.x), abs(p.y));" + // 正方形とか
  "vec3 splat = exp(-pow(d, 2.0) / radius) * color;" +
  "vec3 base = texture2D(uTarget, vUv).xyz;" +
  "gl_FragColor = vec4(base + splat, 1.0);" +
"}";

const advectionManualFilteringShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"varying vec2 vUv;" +
"uniform sampler2D uVelocity;" +
"uniform sampler2D uSource;" +
"uniform vec2 texelSize;" +
"uniform float dt;" +
"uniform float dissipation;" +

"vec4 bilerp (in sampler2D sam, in vec2 p) {" +
  "vec4 st;" +
  "st.xy = floor(p - 0.5) + 0.5;" +
  "st.zw = st.xy + 1.0;" +
  "vec4 uv = st * texelSize.xyxy;" +
  "vec4 a = texture2D(sam, uv.xy);" +
  "vec4 b = texture2D(sam, uv.zy);" +
  "vec4 c = texture2D(sam, uv.xw);" +
  "vec4 d = texture2D(sam, uv.zw);" +
  "vec2 f = p - st.xy;" +
  "return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);" +
"}" +

"void main () {" +
  "vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;" +
  "gl_FragColor = dissipation * bilerp(uSource, coord);" +
  "gl_FragColor.a = 1.0;" +
"}";

const advectionShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"varying vec2 vUv;" +
"uniform sampler2D uVelocity;" +
"uniform sampler2D uSource;" +
"uniform vec2 texelSize;" +
"uniform float dt;" +
"uniform float dissipation;" +

"void main () {" +
  "vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;" +
  "gl_FragColor = dissipation * texture2D(uSource, coord);" +
  "gl_FragColor.a = 1.0;" +
"}";

// https://mofu-dev.com/blog/stable-fluids
// の方では最後にdtで割っていますがこちらでは割っていません
// そこら辺が差異のようです

// 線形近似？？
// 間隔を半分にすればこれの2倍とかそういう感じの・・んー。
const divergenceShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"varying vec2 vUv;" +
"varying vec2 vL;" +
"varying vec2 vR;" +
"varying vec2 vT;" +
"varying vec2 vB;" +
"uniform sampler2D uVelocity;" +

"vec2 sampleVelocity (in vec2 uv) {" +
  "vec2 multiplier = vec2(1.0, 1.0);" +
  "if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; }" + // 境界条件っぽいね。
  "if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; }" + // 多分だけど反射を実装してるんだと思う。
  "if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; }" +
  "if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; }" +
  "return multiplier * texture2D(uVelocity, uv).xy;" +
"}" +

"void main () {" +
  "float L = sampleVelocity(vL).x;" +
  "float R = sampleVelocity(vR).x;" +
  "float T = sampleVelocity(vT).y;" +
  "float B = sampleVelocity(vB).y;" +
  "float div = 0.5 * (R - L + T - B);" + // 普通に各点での速度のdivergenceを取っているみたい。
  "gl_FragColor = vec4(div, 0.0, 0.0, 1.0);" + // dtで割ってない
"}";

const curlShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"varying vec2 vUv;" +
"varying vec2 vL;" +
"varying vec2 vR;" +
"varying vec2 vT;" +
"varying vec2 vB;" +
"uniform sampler2D uVelocity;" +

"void main () {" +
  "float L = texture2D(uVelocity, vL).y;" +
  "float R = texture2D(uVelocity, vR).y;" +
  "float T = texture2D(uVelocity, vT).x;" +
  "float B = texture2D(uVelocity, vB).x;" +
  "float vorticity = R - L - T + B;" +
  "gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);" +
"}";

const vorticityShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"varying vec2 vUv;" +
"varying vec2 vT;" +
"varying vec2 vB;" +
"uniform sampler2D uVelocity;" + // velocityです。
"uniform sampler2D uCurl;" +
"uniform float curl;" +
"uniform float dt;" +

"void main () {" +
  "float T = texture2D(uCurl, vT).x;" +
  "float B = texture2D(uCurl, vB).x;" +
  "float C = texture2D(uCurl, vUv).x;" +
  "vec2 force = vec2(abs(T) - abs(B), 0.0);" + // x軸方向限定かこれ
  "force *= 1.0 / length(force + 0.00001) * curl * C;" + // forceを方向単位ベクトルにして大きさはcurl*Cということみたい
  "vec2 vel = texture2D(uVelocity, vUv).xy;" + // で、速度。
  "gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);" + // 外力項？
"}";

// 粘性～
// よくわからん！必要なのか？？これ。まあいいか・・
const viscosityShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"varying vec2 vUv;" +
"varying vec2 vL;" +
"varying vec2 vR;" +
"varying vec2 vT;" +
"varying vec2 vB;" +
"uniform sampler2D uVelocity;" +
"uniform float viscosity;" +
"uniform float dt;" +

"vec2 boundary (in vec2 uv) {" +
  "uv = min(max(uv, 0.0), 1.0);" +
  "return uv;" +
"}" +

"void main () {" +
  "vec2 L = texture2D(uVelocity, boundary(vL)).xy;" +
  "vec2 R = texture2D(uVelocity, boundary(vR)).xy;" +
  "vec2 T = texture2D(uVelocity, boundary(vT)).xy;" +
  "vec2 B = texture2D(uVelocity, boundary(vB)).xy;" +
  "vec2 C = texture2D(uVelocity, vUv).xy;" +
  "vec2 velocity = ((L + R + B + T) * viscosity * dt + C) / (1.0 + 4.0 * viscosity * dt);" +
  "gl_FragColor = vec4(velocity, 0.0, 1.0);" +
"}";

// あっちとどう違うのかっていう。
// まずあっちと違って2の差分でやってるんですよ。
// でも1だろうと2だろうとそんな差はないはずでね。

// とりあえずここに関してはhttps://www2.akita-nct.ac.jp/libra/report/47/47062.pdfの中心差分のやり方で計算しているとみて
// 間違いなさそう。で、dtで割ってないけど、そのあとdt掛けたものを引いてる
// から問題ないわね。
const pressureShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"varying vec2 vUv;" +
"varying vec2 vL;" +
"varying vec2 vR;" +
"varying vec2 vT;" +
"varying vec2 vB;" +
"uniform sampler2D uPressure;" +
"uniform sampler2D uDivergence;" +

"vec2 boundary (in vec2 uv) {" +
  "uv = min(max(uv, 0.0), 1.0);" +
  "return uv;" +
"}" +

"void main () {" +
  "float L = texture2D(uPressure, boundary(vL)).x;" +
  "float R = texture2D(uPressure, boundary(vR)).x;" +
  "float T = texture2D(uPressure, boundary(vT)).x;" +
  "float B = texture2D(uPressure, boundary(vB)).x;" +
  //"float C = texture2D(uPressure, vUv).x;" + // 使ってない
  "float divergence = texture2D(uDivergence, vUv).x;" +
  "float pressure = (L + R + B + T - divergence) * 0.25;" +
  "gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);" +
"}";

// dtで割らない理由は何となくわかった
// 最終的にあっちでは圧力勾配のdt倍を引いてるのですよ。
// 同次性により例の反復計算の方程式で両辺にdtを掛けても結果は同じ
// したがって圧力のdt倍をそのまま出してそれを引けばいいわけね
// そういった理由からそもそもdtで割っていないのでしょう。

// さらにあっちで0.5倍してるけどこっちではしてないので
// 0.5dt倍のPを出してることになる。。
const gradientSubtractShader =
"precision highp float;" +
"precision mediump sampler2D;" +

"varying vec2 vUv;" +
"varying vec2 vL;" +
"varying vec2 vR;" +
"varying vec2 vT;" +
"varying vec2 vB;" +
"uniform sampler2D uPressure;" +
"uniform sampler2D uVelocity;" +

"vec2 boundary (in vec2 uv) {" +
  "uv = min(max(uv, 0.0), 1.0);" +
  "return uv;" +
"}" +

"void main () {" +
  "float L = texture2D(uPressure, boundary(vL)).x;" +
  "float R = texture2D(uPressure, boundary(vR)).x;" +
  "float T = texture2D(uPressure, boundary(vT)).x;" +
  "float B = texture2D(uPressure, boundary(vB)).x;" +
  "vec2 velocity = texture2D(uVelocity, vUv).xy;" +
  "velocity.xy -= vec2(R - L, T - B);" +
  "gl_FragColor = vec4(velocity, 0.0, 1.0);" +
"}";


// ------------------------------------------------------------ //
// main.

function setup() {
  _gl = createCanvas(windowWidth, windowHeight, WEBGL);
  gl = _gl.GL;
  pixelDensity(1);

  _node = new RenderNode();
  pointers.push(new pointerPrototype());
  confirmExtensions();
  initFramebuffers();

  // レンダーシステムとして各種シェーダと描画機能を用意する
  const positions = [-1, -1, -1, 1, 1, -1, 1, 1];

  let sh;
  sh = createShader(baseVertexShader, clearShader);
  _node.regist('clear', sh, 'board')
  //_node.use('clear', 'clear')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTexture');

  sh = createShader(baseVertexShader, displayShader);
  _node.regist('display', sh, 'board')
       //.use('display', 'display')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTexture');

  sh = createShader(baseVertexShader, splatShader);
  _node.regist('splat', sh, 'board')
  //_node.use('splat', 'splat')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uTarget');

  sh = createShader(baseVertexShader, (ext.textureHalfFloatLinear ? advectionShader : advectionManualFilteringShader));
  _node.regist('advection', sh, 'board')
  //_node.use('advection', 'advection')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uVelocity')
       .registUniformLocation('uSource');

  sh = createShader(baseVertexShader, divergenceShader);
  _node.regist('divergence', sh, 'board')
  //_node.use('divergence', 'divergence')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uVelocity');

  sh = createShader(baseVertexShader, curlShader);
  _node.regist('curl', sh, 'board')
  //_node.use('curl', 'curl')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uVelocity');

  sh = createShader(baseVertexShader, vorticityShader);
  _node.regist('vorticity', sh, 'board')
  //_node.use('vorticity', 'vorticity')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uVelocity')
       .registUniformLocation('uCurl');

  // 粘性項の計算用
  sh = createShader(baseVertexShader, viscosityShader);
  _node.regist('viscosity', sh, 'board')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uVelocity');

  // 圧力項の計算用
  sh = createShader(baseVertexShader, pressureShader);
  _node.regist('pressure', sh, 'board')
  //_node.use('pressure', 'pressure')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uPressure')
       .registUniformLocation('uDivergence');

  sh = createShader(baseVertexShader, gradientSubtractShader);
  _node.regist('gradientSubtract', sh, 'board')
  //_node.use('gradientSubtract', 'gradientSubtract')
       .registAttribute('aPosition', positions, 2)
       .registUniformLocation('uPressure')
       .registUniformLocation('uVelocity');

  // 最初のマーキング
  lastTime = Date.now();
  // splats関連の最初の処理
  multipleSplats(floor(Math.random() * 20) + 5);

  // インタラクションはこの形式で登録するのがいいらしい
  // _glにイベント関数を放り込む形式でもできたんだけど
  // (_gl.mousePressed(関数) みたいにする)
  // とりあえず本家に合わせることにしました
  const canvas = document.getElementsByTagName('canvas')[0];
  canvas.addEventListener('mousedown', mouseDownAction);
  canvas.addEventListener('mousemove', mouseMoveAction);
  window.addEventListener('mouseup', mouseUpAction);
  canvas.addEventListener('touchstart', touchStartAction);
  // falseを指定すると特定のケースでpreventDefaultが
  // 不発に終わるのを防げるらしい
  canvas.addEventListener('touchmove', touchMoveAction, false);
  window.addEventListener('touchend', touchEndAction);

  // 簡単に文字
  bg = new BackgroundManager(8);
  bg.setLayer(0).draw("textAlign", [CENTER, CENTER]).draw("noStroke")
    .draw("textSize", [24]).draw("fill", [255]);
}

// あとはメインループ内での処理と
// インタラクションですかね
function draw() {
  resize();
  // メインループをここに記述
  // dtは最後に記録してから現在までの経過時間ですね
  const dt = Math.min((Date.now() - lastTime) / 1000, 0.016);
  lastTime = Date.now();

  if(splatStack.length > 0){
    multipleSplats(splatStack.pop());
  }

  // 計算ここから
  _node.setViewport(0, 0, textureWidth, textureHeight);

  // 移流項パート

  // dissipation:散逸すること. advection:移流。
  // 速度の方は、該当するマスの速度を、その速度だけ逆方向にずらした
  // 位置の速度に適当な(0.99)係数をかけたもので置き換える形。
  _node.bindFBO('velocity');
  _node.use('advection', 'board')
       .setAttribute()
       .setFBO('uVelocity', 'velocity')
       .setFBO('uSource', 'velocity')
       .setUniform('texelSize', [1.0 / textureWidth, 1.0 / textureHeight])
       .setUniform('dt', dt)
       .setUniform('dissipation', config.VELOCITY_DISSIPATION)
       .drawArrays(gl.TRIANGLE_STRIP);
  _node.swapFBO('velocity');

  // じゃあdensityの方は？uSourceがdensityになってる。bindもdensity.
  // つまりその位置のdensityを速度だけ（速度は更新済み）戻したところの
  // densityで置き換える処理。これにより、速度によってdensityが、
  // というか色が流されてくるのを表現しているようです。わかったかも。
  // 係数も0.98と変えている。んー。
  _node.bindFBO('density')
       .setFBO('uVelocity', 'velocity')
       .setFBO('uSource', 'density')
       .setUniform('dissipation', config.DENSITY_DISSIPATION)
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
  _node.swapFBO('density');

  // splat. ここでもvelocityとdensityに処理を加えているようです。

  for(let i = 0; i < pointers.length; i++) {
    const pointer = pointers[i];
    if (pointer.moved) {
      splat(pointer.x, pointer.y, pointer.dx, pointer.dy, pointer.color);
      pointer.moved = false; // ここ必要ですね。
      // これがないと動かして出した後でとどまってるときに出続けちゃう
      // みたいです。
    }
  }

  // というわけでこっからgradientSubtractまでが微分方程式に従って
  // 速度をいじっていくパートとなります。その結果速度が変化するので、
  // それによりadvectionで速度をアップデートするということらしいです。
  // 微分方程式によりその地点での次の瞬間の速度が分かっても
  // そこにある粒子はもうそこにはいないので、そこら辺の補正を行うのが
  // 移流(advection)ということらしいです。

  // 渦パート(オプション)

  // curlは渦度を各地点で速度により計算してるっぽい
  // 渦パート外すとあっちのthree.jsでほにゃららっぽくなる
  // ここは作者さんのオリジナルの処理っぽい。渦度により調整してるのかも。
  _node.bindFBO('curl')
  _node.use('curl', 'board')
       .setAttribute()
       .setFBO('uVelocity', 'velocity')
       .setUniform('texelSize', [1.0 / textureWidth, 1.0 / textureHeight])
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();

  // 渦度により速度に処理を加えているっぽい
  _node.bindFBO('velocity')
  _node.use('vorticity', 'board')
       .setAttribute()
       .setFBO('uVelocity', 'velocity')
       .setFBO('uCurl', 'curl')
       .setUniform('texelSize', [1.0 / textureWidth, 1.0 / textureHeight])
       .setUniform('curl', config.CURL)
       .setUniform('dt', dt)
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
  _node.swapFBO('velocity');

  // 粘性を入れるならここ。
  // 入れたけど違いがよくわからん。。。
  _node.use('viscosity', 'board')
       .setAttribute()
       .setUniform('viscosity', config.VISCOSITY)
       .setUniform('dt', dt);
  for(let i = 0; i < config.VISCOSITY_ITERATIONS; i++){
    _node.bindFBO('velocity')
         .setFBO('uVelocity', 'velocity')
         .drawArrays(gl.TRIANGLE_STRIP);
    _node.swapFBO('velocity');
  }
  _node.clear();
  // あの人のデモもなんか違い分かりにくかったから
  // そういうものなんじゃないですかね（雑）

  // 圧力計算パート

  _node.bindFBO('divergence');
  _node.use('divergence', 'board')
       .setAttribute()
       .setFBO('uVelocity', 'velocity')
       .setUniform('texelSize', [1.0 / textureWidth, 1.0 / textureHeight])
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();

  _node.bindFBO('pressure');
  _node.use('clear', 'board')
       .setAttribute()
       .setFBO('uPressure', 'pressure')
       .setUniform('value', config.PRESSURE_DISSIPATION)
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
  _node.swapFBO('pressure');
  //pressure.swap();

  _node.use('pressure', 'board')
       .setAttribute()
       .setFBO('uDivergence', 'divergence')
       .setUniform('texelSize', [1.0 / textureWidth, 1.0 / textureHeight]);
  for(let i = 0; i < config.PRESSURE_ITERATIONS; i++){
    _node.bindFBO('pressure')
         .setFBO('uPressure', 'pressure')
         .drawArrays(gl.TRIANGLE_STRIP);
    _node.swapFBO('pressure');
  }
  _node.clear();

  // 仕上げパート

  _node.bindFBO('velocity');
  _node.use('gradientSubtract', 'board')
       .setAttribute()
       .setFBO('uPressure', 'pressure')
       .setFBO('uVelocity', 'velocity')
       .setUniform('texelSize', [1.0 / textureWidth, 1.0 / textureHeight])
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
  _node.swapFBO('velocity');

  // 描画パート

  // displayはdensityの中身を描画してるだけ。
  _node.bindFBO(null);
  _node.setViewport(0, 0, width, height);
  _node.use('display', 'board')
       .setAttribute()
       .setFBO('uTexture', 'density')
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();

  // 簡単に文字。お疲れさまでした。
  bg.setLayer(0).draw("clear").draw("text", ["FLUID_TEST", width*0.5, height*0.5]);
  bg.display();
}

// フレームバッファ群（サイズ変更の際にリセットされる感じ）
function initFramebuffers(){
  textureWidth = width / 2;
  textureHeight = height / 2;
  const w = textureWidth;
  const h = textureHeight;
  const halfFloat = ext.textureHalfFloat.HALF_FLOAT_OES;
  const linearFilterParam = (ext.textureHalfFloatLinear ? gl.LINEAR : gl.NEAREST);

  _node.registDoubleFBO('density', 2, w, h, halfFloat, linearFilterParam);
  _node.registDoubleFBO('velocity', 0, w, h, halfFloat, linearFilterParam);
  _node.registFBO('divergence', 4, w, h, halfFloat, gl.NEAREST);
  _node.registFBO('curl', 5, w, h, halfFloat, gl.NEAREST);
  _node.registDoubleFBO('pressure', 6, w, h, halfFloat, gl.NEAREST);
}

// multipleSplats.
function multipleSplats(amount) {
  for (let i = 0; i < amount; i++) {
    const col = [Math.random() * 10, Math.random() * 10, Math.random() * 10];
    const x = width * Math.random();
    const y = height * Math.random();
    // 極座標で書き換え
    const speed = Math.sqrt(Math.random()) * 500;
    const direction = Math.random() * TAU;
    const dx = speed * Math.cos(direction);
    const dy = speed * Math.sin(direction);
    splat(x, y, dx, dy, col);
  }
}

// splat関数
// 今気づいたけどここでは描画してない？
// colorとは別にdx, -dyの情報を送ってそれを描画の方でも使う
// みたいな感じですかね
function splat (x, y, dx, dy, col) {
  // もろもろ準備してから書き直しですね

  // 先にvelocityについての処理
  // おそらく初期条件に当たる・・これを微分方程式でいじる感じですかね
  // colorは色であって色ではない・・ですね。

  // velocityでやっていること。おそらく...
  // デルタ関数的なサムシングだと思う。dx, -dyがキャンバス内での
  // 速度、最初は全部0なわけだけど。pointerのところにその速度の
  // それを加えているみたいです。で、動かない（dx=dy=0）場合は
  // 何も加わらないというわけですね。
  // 反射するボールとか用意したら面白そう
  // 大きさの情報はconfigの定数で、あくまで位置と速度だけで決まる
  // もっとも個別に半径指定することもできそうではあるけれど。
  _node.setViewport(0, 0, textureWidth, textureHeight);
  _node.bindFBO('velocity');
  _node.use('splat', 'board')
       .setAttribute()
       .setFBO('uTarget', 'velocity')
       .setUniform('aspectRatio', width/height)
       .setUniform('point', [x/width, 1 - y/height])
       .setUniform('color', [dx, -dy, 1.0])
       .setUniform('radius', config.SPLAT_RADIUS)
       .drawArrays(gl.TRIANGLE_STRIP);
  _node.swapFBO('velocity');

  // こちらはdensityの処理
  // 色を足してるみたい。で、その色が速度により流れる。
  // さっきのデルタのそれによって流れるわけね。よくできてる。
  // そういう認識でいいのかな・・・
  // で、速度は微分方程式により変化していく、それにより色も、
  // 流れていく。
  _node.bindFBO('density')
       .setFBO('uTarget', 'density')
       .setUniform('color', [col[0] * 0.3, col[1] * 0.3, col[2] * 0.3])
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
  _node.swapFBO('density');
  //density.swap();
}

function resize() {
  if (width != windowWidth || height != windowHeight) {
    resizeCanvas(windowWidth, windowHeight);
    bg.resizeDestroy(windowWidth, windowHeight);
    //canvas.width = canvas.clientWidth;
    //canvas.height = canvas.clientHeight;
    initFramebuffers(); //console.log("resize");
  }
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
// framebufferを生成するための関数
// attribute関連はstaticメソッドに移しました。
// RenderNodeの処理にする・・？

// フレームバッファをオブジェクトとして生成する関数

// よくわかんないけどあの流体の計算みたいなことをする場合
// ハーフフロートオンリーでデプスは必要ないので
// 他の形式が重要になってきそうですね

// あくまで計算用です。それとは別にシェーダーがあって描画用の機構が
// あるみたい。

// 番号は事前に指定しておくようにするのか・・・
// むぅ
// 今って2D画像についてはp5.Texture使っちゃってるのよね
// あそこもいじらないといけないんかなって思うと割とつらい
// んーまあなるようにしかならないのだけど
// 使うテクスチャすべてに通し番号を付けてそれらがかぶらないように
// するということ
// テクスチャが本体なのでテクスチャそれ自体を生成する関数を
// 設けてこれ以降2Dのあれを・・だめだ。p5のimageだから特殊で・・んー。
// bgManager生成するときに番号を引数として渡してかぶらないように
// するしかなさそうですね
// ていうかあれ、nodeも渡さないといけないし
// それも含めてですけど
// p5.Texture便利なので流用したい
// というかp5の2D描画機能使えないんじゃ
// p5.jsのwebglを機能強化する意味がないのですよ（そこが肝心なので）

// 書き換え
// formatのところをtypeにする
// そんでformatはgl.RGBAだから問題ない、と。
// 今回textureFormatのところはgl.FLOATでもgl.UNSIGNED_BYTEでもないです
// あとidを用意しますね

// 名前もcreate_fboに変更
function create_fbo(texId, w, h, textureFormat, filterParam){
  // フォーマットチェック
  if(!textureFormat){
    textureFormat = gl.UNSIGNED_BYTE;
  }
  if(!filterParam){
    filterParam = gl.NEAREST;
  }

  // フレームバッファの生成
  let frameBuffer = gl.createFramebuffer();

  // フレームバッファをWebGLにバインド
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

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
  return {f:frameBuffer, d:depthRenderBuffer, t:fTexture, id:texId};
}

// fboのペアを作る
function create_double_fbo(texId, w, h, textureFormat, filterParam){
  // texIdは片方について1増やす
  let fbo1 = create_fbo(texId, w, h, textureFormat, filterParam);
  let fbo2 = create_fbo(texId + 1, w, h, textureFormat, filterParam);
  let doubleFbo = {};
  doubleFbo.read = fbo1;
  doubleFbo.write = fbo2;
  doubleFbo.swap = function(){
    let tmp = this.read;
    this.read = this.write;
    this.write = tmp;
  }
  return doubleFbo;
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

// 3次行列式。
function calcDet(a,b,c,d,e,f,g,h,i){
  const det = a*(e*i-f*h) + b*(f*g-d*i) + c*(d*h-e*g);
  return det;
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
  registFBO(FBOName, texId, w, h, textureFormat, filterParam){
    // fboをセット(同じ名前の場合は新しく作って上書き)
    let fbo = create_fbo(texId, w, h, textureFormat, filterParam);
    this.framebufferObjects[FBOName] = fbo;
    return this;
  }
  registDoubleFBO(FBOName, texId, w, h, textureFormat, filterParam){
    //doubleFBOをセット(同じ名前の場合は新しく作って上書き)
    let fbo = create_double_fbo(texId, w, h, textureFormat, filterParam);
    this.framebufferObjects[FBOName] = fbo;
    return this;
  }
  bindFBO(FBOName){
    // FBOをbindもしくはnullで初期化。ダブルの場合はwriteをセット。
    if(FBOName == null){
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); return this;
    }
    let fbo = this.framebufferObjects[FBOName];
    if(!fbo){ return this; }
    if(fbo.write){
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.write.f); return this;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.f);
    return this;
  }
  clearFBO(){
    // そのときにbindしているframebufferのクリア操作
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    return this; // ←これが欲しいだけ。
  }
  setFBO(uniformName, FBOName){
    // FBOを名前経由でセット。ダブルの場合はreadをセット。
    if(FBOName == null){ return this; }
    let fbo = this.framebufferObjects[FBOName];
    if(!fbo){ return this; }
    if(fbo.read){
      this.setTexture(uniformName, fbo.read.t, fbo.read.id);
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

// ----------------------------------------------------------- //
// interaction.
// とりあえず関数だけ書きます
// 引数としてeventを取ることができます

// ここら辺はpointerPrototypeのクラスとしてのメソッドとかいろいろ
// 定義すればマシになるはず

function mouseDownAction(){
  pointers[0].down = true;
  pointers[0].color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
}

// たとえば4つまで増やして、マウスの進行方向に対して4つの
// 90°ずつずらした方向に移動するとかさせたら面白そう
// んで壁で反射するとか
// もしくは飛んでいくとかでも。マウスタッチのたびにとんでいく？んー。
function mouseMoveAction(e){
  pointers[0].moved = pointers[0].down;
  pointers[0].dx = (e.offsetX - pointers[0].x) * config.SPEED_FACTOR;
  pointers[0].dy = (e.offsetY - pointers[0].y) * config.SPEED_FACTOR;
  pointers[0].x = e.offsetX;
  pointers[0].y = e.offsetY;
}

function mouseUpAction(){
  pointers[0].down = false;
}

// preventDefaultを使うと、
// マウス操作時の挙動がスマホ操作時に起きるのを防げるらしい！

// pointersの追加についての挙動はおいおい詳しく見ていきましょう
// 多分そんな難しくないはず
function touchStartAction(e){
  e.preventDefault();
  const touches = e.targetTouches; // touchオブジェクトの配列
  for (let i = 0; i < touches.length; i++) {
    if (i >= pointers.length){
      pointers.push(new pointerPrototype());
    }
    pointers[i].id = touches[i].identifier; // オブジェクトの識別子
    pointers[i].down = true;
    pointers[i].x = touches[i].pageX; // 要するにmouseX的なやつ
    pointers[i].y = touches[i].pageY; // 要するにmouseY的なやつ
    pointers[i].color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
  }
}

// preventDefaultを使うと、
// マウス操作時の挙動がスマホ操作時に起きるのを防げるらしい！
function touchMoveAction(e){
  e.preventDefault();
  const touches = e.targetTouches;
  for (let i = 0; i < touches.length; i++) {
    let pointer = pointers[i];
    pointer.moved = pointer.down;
    pointer.dx = (touches[i].pageX - pointer.x) * config.SPEED_FACTOR;
    pointer.dy = (touches[i].pageY - pointer.y) * config.SPEED_FACTOR;
    pointer.x = touches[i].pageX;
    pointer.y = touches[i].pageY;
  }
}

// 複数あるので全部まとめて切り離すわけにはいかないんですね
// 多分そういうことかと
// idを利用してオフになったポインターを割り出しているようです
// changedTouchesは接触状態が変化したすべてのタッチオブジェクトです。
function touchEndAction(e){
  const touches = e.changedTouches;
  for (let i = 0; i < touches.length; i++){
    for (let j = 0; j < pointers.length; j++){
      if (touches[i].identifier == pointers[j].id){
        pointers[j].down = false;
      }
    }
  }
}

// index attributeのみを使って点描画するテスト
// attribute使えば指定しやすいと思う。

let gl;
let _gl;

let seasons = [];

let pointBuf1;
let count = 0;

let myShader;
let vs =
"precision mediump float;" +
"attribute float aIndex;" + // unique attribute.
"uniform float uPointSize;" +
"uniform float uScale;" +
"uniform float uCount;" +
"uniform float uPatternId;" +
"const float TAU = 6.28318;" +
"varying vec2 vIndex;" +
"varying float vRatio;" +
"uniform mat4 uModelViewMatrix;" +
"uniform mat4 uProjectionMatrix;" +
// 入力は0～1でindexを網羅するように設定
// 0～120のとき0で600～720のとき1ですね
// 120～600のときはdelayの値がy*360でつまりy*360+120<uCount<y*360+240のときに(uCount-y*360-120)/120
// 720～1200の場合は逆でy*360+720<uCount<y*360+840のときに(y*360+840-uCount)/120ですね。
"float getRatioPtn(in float x, in float y){" +
"  float ratio0 = max(abs(x*2.0-1.0),abs(y*2.0-1.0));" +
"  float k = floor(y * 10.0);" +
"  k = (mod(floor(x * 10.0), 2.0) == 0.0 ? k : 9.0 - k);" +
"  float ratio1 = (10.0 * floor(x * 10.0) + k)/100.0;" +
"  float ratio2 = (floor(x * 10.0) + 10.0 * k)/100.0;" +
"  float ratio3 = mod(7.0 * (10.0 * floor(x * 10.0) + k), 100.0) / 100.0;" +
"  if(uPatternId == 0.0){ return ratio0; }" +
"  if(uPatternId == 1.0){ return ratio1; }" +
"  if(uPatternId == 2.0){ return ratio2; }" +
"  return ratio3;" +
"}" +
"float getRatio(float z){" +
"  if(uCount < 60.0){ return 0.0; }" +
"  if(z * 180.0 + 60.0 < uCount && uCount < z * 180.0 + 120.0){" +
"    return (uCount - z * 180.0 - 60.0) / 60.0;" +
"  }else if(uCount < z * 180.0 + 61.0){ return 0.0; }" +
"  return 1.0;" +
"}" +
"void main() {" +
// 320x320個の点を配置
"  float x = mod(aIndex, 480.0) / 480.0;" +
"  float y = floor(aIndex / 480.0) / 360.0;" +
"  vIndex = vec2(x, y);" +
"  vec3 p = vec3(vec2(x, y) * 2.0 - 1.0, 0.0) * vec3(240.0, 180.0, 0.0);" +
"  float ptn = getRatioPtn(x, y);" +
"  float ratio = getRatio(ptn);" +
"  ratio = ratio * ratio * (3.0 - 2.0 * ratio);" +
"  vRatio = ratio;" +
//"  vec3 p = (1.0-ratio)*p0 + ratio*p1;" +
"  vec3 rdm;" +
"  rdm.x = cos(aIndex * 331.49) + 2.0 * sin(aIndex * 255.68);" +
"  rdm.y = 2.0 * cos(aIndex * 161.49) + sin(aIndex * 354.38);" +
"  rdm.z = cos(aIndex * 251.29) + sin(aIndex * 119.68);" +
"  p += 0.5 * (1.0 - cos(TAU * ratio)) * uScale * rdm;" +
"  vec4 positionVec4 =  vec4(p, 1.0);" +
"  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;" +
"  gl_PointSize = uPointSize * 0.5 * (1.0 - cos(TAU*ratio)) * 3.0;" +
"}";

let fs =
"precision mediump float;" +
"uniform float uCount;" +
"uniform sampler2D uSeason1;" +
"uniform sampler2D uSeason2;" +
"const float TAU = 6.28318;" +
"varying vec2 vIndex;" +
"varying float vRatio;" +
// getRGB(HSBtoRGB)
"vec3 getRGB(float h, float s, float b){" +
"    vec3 c = vec3(h, s, b);" +
"    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);" +
"    rgb = rgb * rgb * (3.0 - 2.0 * rgb);" +
"    return c.z * mix(vec3(1.0), rgb, c.y);" +
"}" +
// mask関連の余計な処理をカットしました。いいのか悪いのかは知らない・・
"void main(){" +
"  vec4 col_1 = texture2D(uSeason1, vIndex);" +
"  vec4 col_2 = texture2D(uSeason2, vIndex);" +
"  gl_FragColor = col_1 * (1.0 - vRatio) + col_2 * vRatio;" +
"}";

let indices = [];
const NUM = 172800; // 480x360.

let gr;

function preload(){
  seasons.push( loadImage("https://inaridarkfox4231.github.io/assets/season/spring_tiny.png"));
  seasons.push( loadImage("https://inaridarkfox4231.github.io/assets/season/summer_tiny.png"));
  seasons.push( loadImage("https://inaridarkfox4231.github.io/assets/season/autumn_tiny.png"));
  seasons.push( loadImage("https://inaridarkfox4231.github.io/assets/season/winter_tiny.png"));
}

function setup(){
  _gl=createCanvas(640, 640, WEBGL);
  gl = _gl.GL
  pixelDensity(1);
  myShader = createShader(vs, fs);
  _gl.pointSize = 1;
  myShader.isPointShader = () => true;
  _gl.userPointShader = myShader;

  pointBuf1 = gl.createBuffer(); // これがvboになる
  for(let i = 0; i < NUM; i++){
    indices.push(i);
  }

  // 背景設定
  gl.enable(gl.DEPTH_TEST);
  gr = createGraphics(width, height);
  gr.fill(255);
  gr.textSize(min(width, height) * 0.025);
  gr.textAlign(LEFT, TOP);

  // bufferDataは1回でいい。ここで設定してしまう。
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf1);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function draw(){
  let start = millis();

  // 背景関連
  resetShader();
  gl.disable(gl.DEPTH_TEST);
  texture(gr);
  plane(width, height);
  gl.enable(gl.DEPTH_TEST);

  // 点描画
  resetShader();
  shader(myShader);
  //rotateX(TAU * count / 241);
  //rotateY(TAU * count / 353);
  myShader.setUniform("uScale", min(width, height) * 0.5);
  myShader.setUniform("uCount", count % 300);
  const index = floor((count % 1200) / 300);
  myShader.setUniform("uPatternId", index);
  myShader.setUniform("uSeason1", seasons[index]);
  myShader.bindTextures();
  myShader.setUniform("uSeason2", seasons[(index + 1)%4]);
  myShader.bindTextures();
  myDrawPoints();
  count++;

  // 描画速度をテキストで表示（次のフレームで速度レートが表示される）
  let end = millis();
  // 1/60秒を1としたときの描画所要時間
  const performanceRatio = (end-start)*60/1000;
  gr.background(0);
  const offset = min(width, height)*0.025;
  gr.text(performanceRatio.toFixed(3), offset, offset);
}

function myDrawPoints(){
  _gl._setPointUniforms(myShader);

  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf1);
  myShader.enableAttrib(myShader.attributes.aIndex, 1);

  gl.drawArrays(gl.POINTS, 0, NUM);

  myShader.unbindShader();
}

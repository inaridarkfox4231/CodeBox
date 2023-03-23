// さてと。
// とりあえずテンプレート作るね

// すげぇ
// gl_PointCoordってテクスチャ座標入ってるんだ
// しかもこれ0.0～1.0の2次元か？
// てことは・・てことはつまり・・・・

// やっぱわからん！！！
/*
まず描画に_drawPointsを使っているんですが

var gl = this.GL;
var pointShader = this._getImmediatePointShader();
this._setPointUniforms(pointShader);
this._bindBuffer(vertexBuffer, gl.ARRAY_BUFFER, this._vToNArray(vertices), Float32Array, gl.STATIC_DRAW);
pointShader.enableAttrib(pointShader.attributes.aPosition, 3);
gl.drawArrays(gl.Points, 0, vertices.length);
pointShader.unbindShader();

_setPointUniforms()でpointShaderにbindUniformsしてるのよね
ここで
_boundをtrueにしてる
ここでは行列の設定とかもしてるのだけどね
useProgramとかいろいろ
次に
最後にunbindShader()してるね
ここ今まで何もしてなかったんだけど
今は
unbindTexturesで全部なくしてる
textureだけですが
でもなぁ
その前にtexture放り込んでるし
おかしい
*/
// sampler2Dには入っていますが
// 入ってるだけで登録がされないですね
// 原因はunbindTexturesです
// これコメントアウトすると正常に機能する
// でも分かることはそれだけ
// setUniformが1回しか機能しない？
// unbindTexturesの何らかの処理が原因で
// それ以降のsetUniformが無効化されていると考えるのがいいかもしれない
// setUniformは実行されているわけですから
// ダミーを入れることで不具合が生じているとかそういうことかもしれないです
// わかりませんが
// ダミーが上書きできないとかそういうこと？
// わかんないけどね
// あそこダミー入れてるでしょ。それが原因かもしれないっていう。

let gl;
let buf; // bufは必要

let fox;

let count = 0;

let myShader;
let vs =
`
precision mediump float; // これがないと両方でuCount使えなくてエラーになる
attribute vec3 aPosition;
uniform float uPointSize;
uniform float uCount;
uniform float uDistanceFactor;
const float TAU = 6.28318;
varying float vStrokeWeight;
varying vec3 vPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
void main() {
  vec3 p = aPosition;
  p = -1.0 + 2.0 * p;
  vPosition = p;
  float properCount = uCount + abs(sin(p.x * 4321.579)) * 240.0;
  float theta = properCount * TAU / 183.0;
  float phi = properCount * TAU / 237.0;
  p.x += 0.05 * sin(theta) * cos(phi);
  p.y += 0.05 * sin(theta) * sin(phi);
  p.z += 0.05 * cos(theta);
  vec4 positionVec4 =  vec4(p * uDistanceFactor, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
  gl_PointSize = uPointSize;
  vStrokeWeight = uPointSize;
}
`
let fs =
`
precision mediump float;
precision mediump int;
uniform vec4 uMaterialColor;
uniform float uCount;
uniform sampler2D uFox;
const float TAU = 6.28318;
varying float vStrokeWeight;
varying vec3 vPosition;

// getRGB,参上！
vec3 getRGB(float h, float s, float b){
    vec3 c = vec3(h, s, b);
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main(){
  float mask = 0.0;

  // make a circular mask using the gl_PointCoord (goes from 0 - 1 on a point)
  // might be able to get a nicer edge on big strokeweights with smoothstep but slightly less performant

  mask = step(0.98, length(gl_PointCoord * 2.0 - 1.0));

  // if strokeWeight is 1 or less lets just draw a square
  // this prevents weird artifacting from carving circles when our points are really small
  // if strokeWeight is larger than 1, we just use it as is

  mask = mix(0.0, mask, clamp(floor(vStrokeWeight - 0.5),0.0,1.0));

  // throw away the borders of the mask
  // otherwise we get weird alpha blending issues

  if(mask > 0.98){
    discard;
  }
  //gl_FragColor = vec4(getRGB(0.55, length(gl_PointCoord.xy - vec2(0.5)), 1.0), 1.0);
  vec2 p = vPosition.xy;
  float idX = (abs(sin(p.x * 4319.35)) < 0.5 ? 0.0 : 1.0);
  float idY = (abs(sin(p.y * 3152.29)) < 0.5 ? 0.0 : 1.0);
  vec4 col = texture2D(uFox, vec2(0.5 * idX, 0.5 * idY) + gl_PointCoord.xy * 0.5);
  if(col.a < 0.01){ discard; }
  gl_FragColor = col;
}
`

function setup(){
  let _gl=createCanvas(windowWidth, windowHeight, WEBGL);
  gl = this._renderer.GL
  pixelDensity(1);
  myShader = createShader(vs, fs);
  shader(myShader);

  stroke(255);
  strokeWeight(40);
  myShader.isPointShader = () => true;
  _gl.userPointShader = myShader;

  fox = createGraphics(200, 200);
  fox.textSize(50);
  //fox.background(0, 128, 255);
  fox.textAlign(CENTER, CENTER);
  fox.text("🦊", 50, 50);
  fox.text("🐺", 150, 50);
  fox.text("🐱", 50, 150);
  fox.text("🐭", 150, 150);
}

function draw(){
  let start = millis();
  background(0);
  rotateX(TAU * count / 241);
  rotateZ(TAU * count / 353);
  myShader.setUniform("uCount", count);
  const DISTANCE_FACTOR = min(width, height) * 0.5;
  myShader.setUniform("uDistanceFactor", DISTANCE_FACTOR);
  myShader.setUniform("uFox", fox);
  myPoints(1000);
  count++;
  let end = millis();
  if(count%60==0){console.log((end-start)*60/1000);}
}

function myPoints(num){
  const gId = `myPoints|${num}`;
  if(!this._renderer.geometryInHash(gId)){
    const myPointsGeom = new p5.Geometry();
    let v = createVector();
    for(let i = 0; i < num; i++){
      // もはやただのノイズ
      // 1より大きい値にすればidにできるね・・0.01～0.99に落とすとかして。何でもできる。自由自在。
      let x = noise(i, 0, 0);
      let y = noise(0, i, 0);
      let z = noise(0, 0, i);
      myPointsGeom.vertices.push(v.set(x, y, z).copy());
    }
    buf = this._renderer.createBuffers(gId, myPointsGeom);
  }
  // これでいいんだ
  this._renderer._drawPoints(buf.model.vertices, this._renderer.immediateMode.buffers.point);
}

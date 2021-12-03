// 三角形
// できた・・達成感すごい。
// 正方形や法線による陰影はまた今度

// トポロジーの切り替え成功
// インデックスバッファの利用にも成功
// 法線・・は、ライティングの話になるので今はできない・・？
// とりあえずambientとdirectionalとphongShadingだけできればいいです

// --------------------------------------------------------------- //
// global.

let _gl, gl;

let _node; // これが統括する。

let properFrameCount = 0; // カウントも必要

// --------------------------------------------------------------- //
// shader.

let myVert=
"precision mediump float;" +
"attribute vec3 aPosition;" + // position.
"attribute vec4 aVertexColor;" +
"varying vec4 vVertexColor;" +
"uniform mat4 uModelViewMatrix;" +
"uniform mat4 uProjectionMatrix;" +
"void main(){" +
"  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);" +
"  gl_Position = uProjectionMatrix * viewModelPosition;" +
"  vVertexColor = aVertexColor;" +
"}";

let myFrag=
"precision mediump float;" +
"varying vec4 vVertexColor;" +
"void main(){" +
"  gl_FragColor = vVertexColor;" + // 初期速度は0で。
"}";

// --------------------------------------------------------------- //
// setup.

function setup() {
  _gl = createCanvas(640, 640, WEBGL);
  pixelDensity(1);
  gl = _gl.GL; // レンダリングコンテキストの取得

  let positions = [-50, 0, 0, 0, 100, 0, 50, 0, 0];
  let colors = [1,0,0,1,0,1,0,1,0,0,1,1];

  // nodeを用意
  _node = new RenderSystemSet();

  let _shader = createShader(myVert, myFrag);
  _node.registProgram('my', _shader);
  _node.use('my', 'triangle');
  _node.registAttribute('aPosition', positions, 3);
  _node.registAttribute('aVertexColor', colors, 4);

  positions = [-200,-200,0,-150,-200,0,-200,-150,0,-150,-150,0];
  colors = [0,0.5,1,1,0,0.5,1,1,1,1,1,1,1,1,1,1];
  _node.use('my', 'square');
  _node.registAttribute('aPosition', positions, 3);
  _node.registAttribute('aVertexColor', colors, 4);

  positions = [0, -100, 0,100,-100,0,0,-50,0,100,-50,0];
  colors = [1,0.5,0,1,1,0.5,0,1,1,1,1,1,1,1,1,1];
  let indices = [0,1,2,2,1,3];
  _node.use('my', 'square2');
  _node.registAttribute('aPosition', positions, 3);
  _node.registAttribute('aVertexColor', colors, 4);
  _node.registIndexBuffer(indices, Uint16Array);
  // typeはUint16ArrayまたはUint32Array
  // それに応じて描画時にgl.UNSIGNED_SHORTまたはgl.UNSIGNED_INTを指定
}

// --------------------------------------------------------------- //
// main loop.

function draw(){
  background(0);

  _node.use('my', 'triangle');
  _node.setAttribute();
  _node.setUniform('uProjectionMatrix', _gl.uPMatrix.mat4)
       .setUniform('uModelViewMatrix', _gl.uMVMatrix.mat4);
  // ドローコール
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  translate(100,0,0);

  _node.setUniform('uProjectionMatrix', _gl.uPMatrix.mat4)
       .setUniform('uModelViewMatrix', _gl.uMVMatrix.mat4);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  translate(100,0,0);

  _node.setUniform('uProjectionMatrix', _gl.uPMatrix.mat4)
       .setUniform('uModelViewMatrix', _gl.uMVMatrix.mat4);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  _node.clear(); // 一応トポロジー切り替えではclearしましょう
  // 切り替え前のトポロジーのデータがclearできなくなるので・・・

  translate(-200,0,0);

  _node.use('my', 'square');
  _node.setAttribute();
  _node.setUniform('uProjectionMatrix', _gl.uPMatrix.mat4)
       .setUniform('uModelViewMatrix', _gl.uMVMatrix.mat4);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  _node.clear();

  _node.use('my', 'square2');
  _node.setAttribute();
  _node.setUniform('uProjectionMatrix', _gl.uPMatrix.mat4)
       .setUniform('uModelViewMatrix', _gl.uMVMatrix.mat4);
  _node.bindIndexBuffer();
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  gl.flush(); // すべての描画が終わったら実行
  _node.clear(); // clearも忘れずに

  // step.
  properFrameCount++;
}

// --------------------------------------------------------------- //
// texture float usability check.

// texture floatが使えるかどうかチェック
function textureFloatCheck(){
  let ext;
  ext = gl.getExtension('OES_texture_float') || gl.getExtension('OES_texture_half_float');
  if(ext == null){
    alert('float texture not supported');
    return;
  }
}

// --------------------------------------------------------------- //
// framebuffer.
// framebufferを生成するための関数
// attribute関連はstaticメソッドに移しました。

// フレームバッファをオブジェクトとして生成する関数
function create_framebuffer(w, h, format){
  // フォーマットチェック
  let textureFormat = null;
  if(!format){
    textureFormat = gl.UNSIGNED_BYTE;
  }else{
    textureFormat = format;
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

  // フレームバッファ用のテクスチャをバインド
  gl.bindTexture(gl.TEXTURE_2D, fTexture);

  // フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, textureFormat, null);

  // テクスチャパラメータ
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // フレームバッファにテクスチャを関連付ける
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);

  // 各種オブジェクトのバインドを解除
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // オブジェクトを返して終了
  return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
}

// --------------------------------------------------------------- //
// utility.

// HSBデータを受け取ってRGBAを取得する関数
// デフォではHSBを0～100で指定すると長さ4の配列でRGBが0～1でAが1の
// ものを返す仕様となっている
function HSBA_to_RGBA(h,s,b,a = 1, max_h = 100, max_s = 100, max_b = 100){
  let hue = h * 6 / max_h; // We will split hue into 6 sectors.
  let sat = s / max_s;
  let val = b / max_b;

  let RGB = [];

  if(sat === 0) {
    RGB = [val, val, val]; // Return early if grayscale.
  }else{
    let sector = Math.floor(hue);
    let tint1 = val * (1 - sat);
    let tint2 = val * (1 - sat * (hue - sector));
    let tint3 = val * (1 - sat * (1 + sector - hue));
    switch(sector){
      case 1:
        RGB = [tint2, val, tint1]; break;
      case 2:
        RGB = [tint1, val, tint3]; break;
      case 3:
        RGB = [tint1, tint2, val]; break;
      case 4:
        RGB = [tint3, tint1, val]; break;
      case 5:
        RGB = [val, tint1, tint2]; break;
      default:
        RGB = [val, tint3, tint1]; break;
    }
   }
   return [...RGB, a];
}

// --------------------------------------------------------------- //
// RenderSystem class.
// shaderとprogramとtopologyのsetとあとテクスチャのロケーション
// その組です
// topologyはattribute群ですね
// たとえば立方体やトーラスを登録するわけ（もちろん板ポリも）

class RenderSystem{
  constructor(_shader){
    this.shader = _shader;
    shader(_shader);
    this.program = _shader._glProgram;
    this.topologies = {};
    this.uniformLocations = {};
  }
  registTopology(topologyName){
    if(this.topologies[topologyName] !== undefined){ return; }
    this.topologies[topologyName] = new Topology();
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
// RenderSystemSet class.
// programを登録して名前で切り替える感じ
// こっちで統一しよう。で、トポロジー。
// 一つのプログラムに複数のトポロジーを登録できる
// そして同じプログラムを使い回すことができる
// 立方体やトーラスを切り替えて描画したりできるというわけ

class RenderSystemSet{
  constructor(){
    this.renderSystems = {};
    this.currentRenderSystem = undefined;
    this.currentShader = undefined;
    this.currentTopology = undefined;
    this.useTextureFlag = false;
  }
  registProgram(renderSystemName, _shader){
    if(this.renderSystems[renderSystemName] !== undefined){ return; }
    this.renderSystems[renderSystemName] = new RenderSystem(_shader);
  }
  use(renderSystemName, topologyName){
    // まとめてやれた方がいい場合もあるので
    if(this.renderSystems[renderSystemName] == undefined){ return; }
    this.useRenderSystem(renderSystemName);
    this.registTopology(topologyName); // 登録済みなら何もしない
    this.useTopology(topologyName);
  }
  useRenderSystem(renderSystemName){
    // 使うプログラムを決める
    this.currentRenderSystem = this.renderSystems[renderSystemName];
    this.currentShader = this.currentRenderSystem.getShader();
    this.currentShader.useProgram();
  }
  registTopology(topologyName){
    // currentProgramに登録するので事前にuseが必要ですね
    this.currentRenderSystem.registTopology(topologyName);
  }
  useTopology(topologyName){
    // たとえば複数のトポロジーを使い回す場合ここだけ切り替える感じ
    this.currentTopology = this.currentRenderSystem.getTopology(topologyName);
  }
  registAttribute(attributeName, data, stride){
    this.currentTopology.registAttribute(this.currentRenderSystem.getProgram(), attributeName, data, stride);
  }
  setAttribute(){
    // その時のtopologyについて準備する感じ
    this.currentTopology.setAttribute();
  }
  registIndexBuffer(data, type){
    this.currentTopology.registIndexBuffer(data, type);
  }
  bindIndexBuffer(){
    this.currentTopology.bindIndexBuffer();
  }
  registUniformLocation(uniformName){
    this.currentRenderSystem.registUniformLocation(uniformName);
  }
  setTexture(uniformName, _texture, locationID){
    this.currentRenderSystem.setTexture(uniformName, _texture, locationID);
    this.useTextureFlag = true; // 1回でも使った場合にtrue
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
  }
}

// --------------------------------------------------------------- //
// Topology class.
// topologyのsetを用意して、それで・・・うん。
// 同じ内容でもプログラムが違えば違うトポロジーになるので
// 使い回しはできないですね・・・（ロケーション）

class Topology{
  constructor(){
    this.vboArray = [];
    this.attLArray = [];
    this.attSArray = [];
    this.ibo = undefined;
  }
  registAttribute(program, attributeName, data, stride){
    this.vboArray.push(Topology.create_vbo(data));
    this.attLArray.push(gl.getAttribLocation(program, attributeName));
    this.attSArray.push(stride);
  }
  setAttribute(){
    Topology.set_attribute(this.vboArray, this.attLArray, this.attSArray);
  }
  registIndexBuffer(data, type){
    this.ibo = Topology.create_ibo(data, type);
  }
  bindIndexBuffer(){
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
  }
  clear(){
    // 描画が終わったらbindを解除する
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    if(this.ibo !== undefined){ gl.bindBuffer(gl.ELEMENT_BUFFER, null); }
  }
  static create_vbo(data){
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
  static set_attribute(vbo, attL, attS){
    // 引数として受け取った配列を処理する
    for(let i in vbo){
      // バッファをバインドする
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);

      // attributeLocationを有効にする
      gl.enableVertexAttribArray(attL[i]);

      // attributeLocationを通知し登録する
      gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
    }
  }
  static create_ibo(data, type){
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
}

// 正方形をおいておいて、
// 線を引いて、
// 分割されて落ちるみたいな？それぞれ自由落下する的な感じだと面白いかもしれない
// もしくは回転しながら中心から外に向かって消えていくのでも面白いかも

// centerとか無しで、画面に正方形をおいておいて、
// クリックで線を引いて割れて落ちる。

// 左マウスダウンの間線が引かれ続ける
// 正方形と2点以上で交わるときにマウスリリースで線が入る感じ
// デフォルトで正方形のアウトラインが書かれてる
// コントゥールが2つ以上の場合に右クリックで割れる
// なおメッシュを再利用すればエフェクトにも使えるし
// もっというとplaneでもいいんですよね

// 正方形との交わりというかquadを取得する関数を作りました
// あとは入力に応じて線を引いて
// それで割るだけ

// デフォルトで

// --------------------------------------------------------------- //
// global.

let _gl, gl;

let _node; // これが統括する。

let bg; // よっしゃテストだ

// tessellation関連
const MINIMUM_DISTANCE = 4;
let _drawer;
let _tessellator;

//let mode = 0;

let hui;

// --------------------------------------------------------------- //
// shader.

let lightVert=
"precision mediump float;" +

"attribute vec3 aPosition;" +
"attribute vec4 aVertexColor;" +
"attribute vec3 aNormal;" +

"uniform vec3 uAmbientColor;" +

"uniform mat4 uModelViewMatrix;" +
"uniform mat4 uProjectionMatrix;" +
"uniform mat3 uNormalMatrix;" +

"varying vec4 vVertexColor;" +
"varying vec3 vNormal;" +
"varying vec3 vViewPosition;" +
"varying vec3 vAmbientColor;" +

"void main(void){" +
  // 場合によってはaPositionをいじる（頂点位置）
  // 場合によってはaNormalもここで計算するかもしれない
"  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);" +

  // Pass varyings to fragment shader
"  vViewPosition = viewModelPosition.xyz;" +
"  gl_Position = uProjectionMatrix * viewModelPosition;" +

"  vNormal = uNormalMatrix * aNormal;" +
"  vVertexColor = aVertexColor;" +

"  vAmbientColor = uAmbientColor;" +
"}";

let lightFrag =
"precision mediump float;" +

"uniform mat4 uViewMatrix;" +
// directionalLight関連
"uniform vec3 uLightingDirection;" +
"uniform vec3 uDirectionalDiffuseColor;" +
"uniform vec3 uPointLightLocation;" +
"uniform vec3 uPointLightDiffuseColor;" +
"uniform vec3 uAttenuation;" + // デフォルトは1,0,0.
// pointLight関連
"uniform bool uUseDirectionalLight;" + // デフォルトはfalse.
"uniform bool uUsePointLight;" + // デフォルトはfalse;

"const float diffuseFactor = 0.73;" +
"const int USE_VERTEX_COLOR = 0;" +
"const int USE_MONO_COLOR = 1;" +
// DirectionalLight項の計算。
"vec3 getDirectionalLightDiffuseColor(vec3 normal){" +
"  vec3 lightVector = (uViewMatrix * vec4(uLightingDirection, 0.0)).xyz;" +
"  vec3 lightDir = normalize(lightVector);" +
"  vec3 lightColor = uDirectionalDiffuseColor;" +
"  float diffuse = max(0.0, dot(-lightDir, normal));" +
"  return diffuse * lightColor;" +
"}" +
// PointLight項の計算。attenuationも考慮。
"vec3 getPointLightDiffuseColor(vec3 modelPosition, vec3 normal){" +
"  vec3 lightPosition = (uViewMatrix * vec4(uPointLightLocation, 1.0)).xyz;" +
"  vec3 lightVector = modelPosition - lightPosition;" +
"  vec3 lightDir = normalize(lightVector);" +
"  float lightDistance = length(lightVector); " +
"  float d = lightDistance;" +
"  float lightFallOff = 1.0 / dot(uAttenuation, vec3(1.0, d, d*d));" +
"  vec3 lightColor = lightFallOff * uPointLightDiffuseColor;" +
"  float diffuse = max(0.0, dot(-lightDir, normal));" +
"  return diffuse * lightColor;" +
"}" +
// _lightはこれで。
"vec3 totalLight(vec3 modelPosition, vec3 normal){" +
"  vec3 result = vec3(0.0);" + // 0.0で初期化
// directionalLightの影響を加味する
"  if(uUseDirectionalLight){" +
"    result += getDirectionalLightDiffuseColor(normal);" +
"  }" +
// pointLightの影響を加味する
"  if(uUsePointLight){" +
"    result += getPointLightDiffuseColor(modelPosition, normal);" +
"  }" +
"  result *= diffuseFactor;" +
"  return result;" +
"}" +
// include lighting.glsl
"uniform vec4 uMonoColor;" +
"uniform int uUseColorFlag;" + // 0:vertex. 1:mono.
// 単色にしたいときtrueにして有効化する感じ。

"varying vec4 vVertexColor;" +
"varying vec3 vNormal;" +
"varying vec3 vViewPosition;" +
"varying vec3 vAmbientColor;" +
// メインコード
"void main(void){" +
"  vec3 diffuse = totalLight(vViewPosition, normalize(vNormal));" +
"  vec4 col = vec4(1.0);" +

"  if(uUseColorFlag == USE_MONO_COLOR) {" +
"    col = uMonoColor;" +  // uMonoColor単色
"  }" +
"  if(uUseColorFlag == USE_VERTEX_COLOR){" +
"    col = vVertexColor;" + // 頂点色
"  }" +
  // diffuseの分にambient成分を足してrgbに掛けて色を出してspecular成分を足して完成みたいな（？？）
"  col.rgb *= (diffuse + vAmbientColor);" +
"  gl_FragColor = col;" +
"}";

// 頂点色つけるだけの簡易シェーダ
let myVert=
"precision mediump float;" +
"attribute vec3 aPosition;" +
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
"  gl_FragColor = vVertexColor;" +
"}";

// --------------------------------------------------------------- //
// setup.

function setup() {
  _gl = createCanvas(640, 640, WEBGL);
  pixelDensity(1);
  gl = _gl.GL; // レンダリングコンテキストの取得

  // カリング間違えてた。難しいね。
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);

  textureFloatCheck();
  Uint32ArrayCheck();

  // nodeを用意
  _node = new RenderNode();

  _shader = createShader(lightVert, lightFrag);
  _node.registRenderSystem('light', _shader);

  // 中で_node使ってるから_node用意してからでないとバグる
  _drawer = new Drawer();
  _tessellator = new Tessellator();
  _tessellator.setPaintColor(_HSV(0.05,1,1), _HSV(0.15,1,1));

  // 左クリックのメニュー表示禁止
  document.oncontextmenu = (e) => {
    e.preventDefault();
  }
}

// --------------------------------------------------------------- //
// main loop.

function draw(){
  //background(0);
  //if(mode == 0){
  _drawer.update();
  //}
  // ちょっとパフォーマンス記録させてちょ
  _drawer.img.setLayer(0)
             .draw("background", [0]);
  _drawer.display();

  _node.useRenderSystem('light')
       .setDirectionalLight(_RGB(1), 0, 0, -1)
       .setAmbientLight(_RGB(0.25));
  _tessellator.display();
}

// --------------------------------------------------------------- //
// texture float usability check.
// RenderNodeの処理にした方がいいかもです

// texture floatが使えるかどうかチェック
function textureFloatCheck(){
  let ext;
  ext = gl.getExtension('OES_texture_float') || this._renderer.getExtension('OES_texture_half_float');
  if(ext == null){
    alert('float texture not supported');
    return;
  }
}

// Uint32Arrayが使えるかどうかチェック
function Uint32ArrayCheck(){
  if (!gl.getExtension('OES_element_index_uint')) {
    throw new Error('Unable to render a 3d model with > 65535 triangles. Your web browser does not support the WebGL Extension OES_element_index_uint.');
  }
}

// --------------------------------------------------------------- //
// global functions.

// framebuffer.
// framebufferを生成するための関数
// attribute関連はstaticメソッドに移しました。
// RenderNodeの処理にする・・？

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
  deleteTopology(topologyName){
    delete this.topologies[topologyName];
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
    this.currentRenderSystem = undefined;
    this.currentShader = undefined;
    this.currentTopology = undefined;
    this.useTextureFlag = false;
    this.tfMatrix = new p5.Matrix(); // デフォルト4x4行列
    // uMVをここにコピーして使い回す感じ
  }
  registRenderSystem(renderSystemName, _shader){
    if(this.renderSystems[renderSystemName] !== undefined){ return; }
    this.renderSystems[renderSystemName] = new RenderSystem(renderSystemName, _shader);
  }
  use(renderSystemName, topologyName){
    // まとめてやれた方がいい場合もあるので
    if(this.renderSystems[renderSystemName] == undefined){ return; }
    this.useRenderSystem(renderSystemName);
    this.registTopology(topologyName); // 登録済みなら何もしない
    this.useTopology(topologyName);
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
  }
  useTopology(topologyName){
    // たとえば複数のトポロジーを使い回す場合ここだけ切り替える感じ
    this.currentTopology = this.currentRenderSystem.getTopology(topologyName);
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
  }
  // delete系関数はそのときのtopologyに対して呼び出す
  deleteIBO(){
    this.currentTopology.deleteIBO();
  }
  deleteAttribute(attributeName){
    this.currentTopology.deleteAttribute(attributeName);
  }
  deleteTopology(){
    this.currentTopology.initialize();
    this.currentRenderSystem.deleteTopology(this.currentTopology.getName());
  }
  setMatrixStandard(uMV){
    // uMVをuMVMatrixとして一通り通知する関数
    const sh = this.currentShader;
    sh.setUniform('uProjectionMatrix', _gl.uPMatrix.mat4);
    sh.setUniform('uModelViewMatrix', uMV.mat4);
    sh.setUniform('uViewMatrix', _gl._curCamera.cameraMatrix.mat4);
    _gl.uNMatrix.inverseTranspose(uMV);
    sh.setUniform('uNormalMatrix', _gl.uNMatrix.mat3);
  }
  setMatrix(tf){
    // uMVとuPとuViewとuNormalを登録(uNormalは使われないこともあるけど)
    let uMV = _gl.uMVMatrix.copy();
    if(tf !== undefined){
      this.transform(tf, uMV); // tfは配列。tr, rotX, rotY, rotZ, scale.
      // rotAxisも一応残しといて。
    }
    this.setMatrixStandard(uMV);
    return this;
  }
  transform(tf, uMV){
    // tfのコマンドに従っていろいろ。
    for(let command of tf){
      const name = Object.keys(command)[0];
      const value = command[name];
      switch(name){
        case "tr":
          // 長さ1の配列の場合は同じ値にする感じで
          if(value.length === 1){ value.push(value[0], value[0]); }
          uMV.translate(value);
          break;
        // rotX～rotZはすべてスカラー値
        case "rotX":
          uMV.rotateX(value); break;
        case "rotY":
          uMV.rotateY(value); break;
        case "rotZ":
          uMV.rotateZ(value); break;
        case "rotAxis":
          // 角度と、軸方向からなる長さ4の配列
          uMV.rotate(...value); break;
        case "scale":
          // 長さ1の場合は同じ値にする。
          if(value.length === 1){ value.push(value[0], value[0]); }
          uMV.scale(...value); break;
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
  deleteIBO(){
    if(this.ibo == undefined){ return; }
    gl.deleteBuffer(this.ibo);
  }
  deleteAttribute(attributeName){
    if(this.attributes[attributeName] == undefined){ return; }
    gl.deleteBuffer(this.attributes[attributeName].vbo);
    delete this.attributes[attributeName];
  }
  initialize(){
    // バッファの解放
    this.deleteIBO();
    for(let name of Object.keys(this.attributes)){
      this.deleteAttribute(name);
    }
  }
}

// ------------------------------------------------------------ //
// computeNormals
// verticesは3つずつ頂点座標が入ってて
// indicesは3つずつ三角形の頂点のインデックスが入ってるわけね

// indicesの3*i,3*i+1,3*i+2それぞれに対して
// たとえばk=indices[3*i]に対して
// verticesの3*k,3*k+1,3*k+2番目の成分を取り出してベクトルを作る
// それを3つやる
// 次にv0,v1,v2で作る三角形のそれぞれの内角の大きさを出す
// なお外積とarcsinで出すのでそのまま正規化されてる
// 向きについてはv0,v1,v2の順に時計回りであることが想定されてる
// 得られた角度を法線ベクトル（大きさ1）にかけて
// それぞれk番目のnormalsに加える
// 終わったらnormalsをすべて正規化
// あとは成分ごとにばらして終了
function getNormals(vertices, indices){
  let normals = [];
  for(let i = 0; i < Math.floor(vertices.length / 3); i++){
    normals.push(createVector(0, 0, 0));
  }
  let v0 = createVector();
  let v1 = createVector();
  let v2 = createVector();
  for(let i = 0; i < Math.floor(indices.length / 3); i++){
    const id = [indices[3*i], indices[3*i+1], indices[3*i+2]];
    v0.set(vertices[3*id[0]], vertices[3*id[0]+1], vertices[3*id[0]+2]);
    v1.set(vertices[3*id[1]], vertices[3*id[1]+1], vertices[3*id[1]+2]);
    v2.set(vertices[3*id[2]], vertices[3*id[2]+1], vertices[3*id[2]+2]);
    const w0 = p5.Vector.sub(v1, v0);
    const w1 = p5.Vector.sub(v2, v0);
    const w2 = p5.Vector.sub(v2, v1);
    const u0 = p5.Vector.cross(w0, w1);
    const u1 = p5.Vector.cross(w0, w2);
    const u2 = p5.Vector.cross(w1, w2);
    const m0 = w0.mag();
    const m1 = w1.mag();
    const m2 = w2.mag();
    const sin0 = u0.mag() / (m0 * m1);
    const sin1 = u1.mag() / (m0 * m2);
    const sin2 = u2.mag() / (m1 * m2);
    const angle0 = asin(sin0);
    const angle1 = asin(sin1);
    const angle2 = asin(sin2);
    const n = p5.Vector.normalize(u0);
    normals[id[0]].add(createVector(n.x*angle0, n.y*angle0, n.z*angle0));
    normals[id[1]].add(createVector(n.x*angle1, n.y*angle1, n.z*angle1));
    normals[id[2]].add(createVector(n.x*angle2, n.y*angle2, n.z*angle2));
  }
  let result = [];
  for(let n of normals){
    n.normalize();
    result.push(...n.array());
  }
  return result;
}

// ------------------------------------------------------ //
// rectangular. 直方体。原点中心でx方向y方向z方向の幅が
// 2倍のsizeX,sizeY,sizeZ. 引数1つの場合はcubeだけど区別しない。
// ±sizeの8つの頂点をもつ。つまり1辺の長さは2*sizeということ。
// 頂点は上面で後ろから
// (-1,-1,1),(1,-1,1),(-1,1,1),(1,1,1),下。
function rectangular(sizeX, sizeY, sizeZ){
  if(arguments.length === 1){
    sizeY = sizeX;
    sizeZ = sizeX;
  }
  let v = [];
  for(let z = 1; z > -2; z -= 2){
    for(let y = -1; y < 2; y += 2){
      for(let x = -1; x < 2; x += 2){
        v.push(...[x * sizeX, y * sizeY, z * sizeZ]);
      }
    }
  }
  let f = [0,1,3,0,3,2,2,3,7,2,7,6,6,7,5,6,5,4,
           4,5,1,4,1,0,1,5,7,1,7,3,4,0,2,4,2,6];
  // fに面情報を入れる
  // vとfから法線を作る。
  let n = getNormals(v, f);
  // 返す。
  return {v:v, f:f, n:n};
}

// ------------------------------------------------------ //
// spherical. 球。原点中心で直径はrとする。detailを設定。
function spherical(size, detailH = 8, detailV = 8){
  if(detailH < 8){ detailH = 8; }
  if(detailV < 8){ detailV = 8; }
  detailH = Math.floor(detailH);
  detailV = Math.floor(detailV);
  let v = [];
  let theta, phi;
  v.push(0, 0, size);
  for(let z = 1; z <= detailV - 1; z++){
    theta = PI * z / detailV; // あ、PIだ。
    for(let x = 0; x < detailH; x++){
      phi = TAU * x / detailH;
      v.push(size * sin(theta) * cos(phi),
             size * sin(theta) * sin(phi),
             size * cos(theta));
    }
  }
  v.push(0, 0, -size);

  // lu, ld, ru, rdはそれぞれ左右の上下
  // のちにuv追加するときわかりやすいように

  let f = [];
  for(let i = 1; i <= detailH - 1; i++){
    f.push(0, i, i+1);
  }
  f.push(0, detailH, 1);
  let lu, ru, ld, rd;
  for(let k = 0; k <= detailV - 3; k++){
    for(let i = 1; i <= detailH - 1; i++){
      lu = i + 1 + k * detailH;
      ru = i + k * detailH;
      ld = i + 1 + (k + 1) * detailH;
      rd = i + (k + 1) * detailH;
      f.push(ru, rd, lu);
      f.push(lu, rd, ld);
    }
    lu = 1 + k * detailH;
    ru = detailH + k * detailH;
    ld = 1 + (k + 1) * detailH;
    rd = detailH + (k + 1) * detailH;
    f.push(ru, rd, lu);
    f.push(lu, rd, ld);
  }
  let k = detailV - 2;
  const bottom = Math.floor(v.length/3) - 1;
  for(let i = 1; i <= detailH - 1; i++){
    f.push(i + k * detailH, bottom, i + 1 + k * detailH);
  }
  f.push((k + 1) * detailH, bottom, 1 + k * detailH);

  let n = getNormals(v, f);
  return {v:v, f:f, n:n};
}

// トーラスと螺旋とトーラスノットはどれもある曲線に対して
// フレネセレで筒を作る流れだから
// もう一般化しちゃおう。関数で。その方が汎用性が高いし
// いいと思うんだよね。

// パラメトリック曲面
// dataにはx軸方向のs,tを媒介変数とする方程式が入ってて
// SとTでディテールを決められるようになってる
// 想定される形としてはs方向を反時計回りに90°回転させた方に
// tって感じだけどね
// んで始点と終点も定義されているというわけ

// オプションとしてsが上と下で縮退してることを通知してもいいかも。
// それなら円錐とかも扱える。
function parametricSurface(data, detailS = 2, detailT = 2){
  const curveFunc = data.func;
  const {s0, s1, t0, t1} = data;
  // sが左上から右上、tが左上から左下というイメージ
  if(detailS < 2){ detailS = 2; }
  if(detailT < 2){ detailT = 2; }
  detailS = Math.floor(detailS);
  detailT = Math.floor(detailT);
  let v = [];
  let s, t, p;
  for(let k = 0; k <= detailT; k++){
    for(let i = 0; i <= detailS; i++){
      s = map(i, 0, detailS, s0, s1);
      t = map(k, 0, detailT, t0, t1);
      p = curveFunc(s, t);
      v.push(p.x, p.y, p.z);
    }
  }

  let f = [];
  let lu, ru, ld, rd;
  for(let k = 0; k < detailT; k++){
    for(let i = 0; i < detailS; i++){
      lu = i + (detailS + 1) * k;
      ru = i + 1 + (detailS + 1) * k;
      ld = lu + (detailS + 1);
      rd = ru + (detailS + 1);
      f.push(ru, rd, lu, lu, rd, ld);
    }
  }
  let n = getNormals(v, f);
  // 返す。
  return {v:v, f:f, n:n};
}

// sLoopとtLoopを作ろうかな。ついでに両方ループも。
// トーラスはその応用なわけだけど・・チューブも同じ要領なのよね。
// チューブの応用で作るのかそれともって感じ
// チューブをパラの応用で作ればいい

// ------------------------------------------------------ //
// donut. トーラス。長半径aで短半径bとしdetailを設定。
function donut(longRadius, shortRadius, longDetail, shortDetail){
  // longRadiusは長半径、shortRadiusは短半径
  // longDetailは外周ディテール、shortDetailは帯方向ディテールです。
  let _data = {};
  _data.func = (s, t) => { return {x:(longRadius+shortRadius*sin(t))*sin(s), y:(80+20*sin(t))*cos(s), z:shortRadius*cos(t)}; }
  _data.s0 = -Math.PI;
  _data.s1 = Math.PI;
  _data.t0 = -Math.PI;
  _data.t1 = Math.PI;
  return parametricSurface(_data, longDetail, shortDetail);
}

// ------------------------------------------------------ //
// pole. 円柱。原点中心で、半径を設定。xy平面を半分に分ける。高さh.
function pole(r, h, detailR, detailH){
  // rは円の半径でhが高さ。これの半分だけxy平面の上に出ている。
  // detailRが半径方向のディテール、detailHが縦。
  let _data = {};
  _data.func = (s, t) => { return {x:r*sin(s), y:r*cos(s), z:t}; }
  _data.s0 = -Math.PI;
  _data.s1 = Math.PI;
  _data.t0 = h * 0.5;
  _data.t1 = -h * 0.5;
  return parametricSurface(_data, detailR, detailH);
}

// capped pole. 上と下をふさいだもの。

// ------------------------------------------------------ //
// con. 円錐。xy平面の上に突き出す感じで半径と高さを指定。

// ------------------------------------------------------ //
// polygon. 多角形。高detailで円。中心原点でx軸正方向rの距離に1つの頂点。
function polygon(r, detail = 3){
  if(detail < 3){ detail = 3; }
  detail = Math.floor(detail);
  let v = [];
  v.push(0, 0, 0);
  for(let i = 0; i < detail; i++){
    v.push(r * cos(TAU * i / detail), r * sin(TAU * i / detail), 0);
  }
  let f = [];
  for(let i = 1; i < detail; i++){
    f.push(0, i, i+1);
  }
  f.push(0, detail, 1);
  let n = getNormals(v, f);
  return {v:v, f:f, n:n};
}

// ------------------------------------------------------ //
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

class BackgroundManager{
  constructor(){
    const id = BackgroundManager.id++;
    this.name = "bgManager" + id;
    this.layers = [];
    this.layers.push(createGraphics(width, height));
    this.currentLayerId = 0;
    // シェーダーとか用意して_node.use("bgShader", "bg")とでもして
    // もろもろ用意する感じですかね
    // 余裕があればポストエフェクト（・・・）
    let _shader = this.getBGShader();
    _node.registRenderSystem(this.name, _shader);
    _node.use(this.name, 'plane')
         .registAttribute('aPosition', [-1,1,0,1,1,0,-1,-1,0,1,-1,0], 3)
         .registUniformLocation('uTex');
    this.texture = new p5.Texture(_gl, this.layers[0]);
  }
  getBGShader(){
    // bgShader. 背景を描画する。
    const bgVert=
    "precision mediump float;" +
    "attribute vec3 aPosition;" +
    "void main(){" +
    "  gl_Position = vec4(aPosition, 1.0);" +
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
    // selectの方が良くない？
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
         .setTexture('uTex', this.texture.glTex, 0) // 0はbg用に予約。
         .setUniform("uResolution", [width, height])
         .drawArrays(gl.TRIANGLE_STRIP)
         .clear(); // clearも忘れずに
    gl.enable(gl.DEPTH_TEST);
  }
}

BackgroundManager.id = 0; // 識別子

// ------------------------------------------------------ //
// Intersection With Square.

// この関数は1辺2rの正方形と(a,b),(c,d)をつなぐ直線の交点列を出力する
// 結果で取得できなかったところにはundefinedが入っている
function getIntersectionsWithSquare(r, a, b, c, d){
  const delta = a*d-b*c;
  let result = new Array(4);
  // XP;
  if(abs(a-c)<0.00001){
    result[0]=undefined;
    result[2]=undefined;
  }else{
    const y0 = ((d-b)*r-delta) / (c-a);
    const y1 = (-(d-b)*r-delta) / (c-a);
    if(abs(y0)<=r){ result[0]={x:r,y:y0}; }else{result[0]=undefined;}
    if(abs(y1)<=r){ result[2]={x:-r,y:y1}; }else{result[2]=undefined;}
  }
  if(abs(b-d)<0.00001){
    result[1]=undefined;
    result[3]=undefined;
  }else{
    const x0 = ((c-a)*r+delta) / (d-b);
    const x1 = (-(c-a)*r+delta) / (d-b);
    if(abs(x0)<r){ result[1]={x:x0,y:r}; }else{result[1]=undefined;}
    if(abs(x1)<r){ result[3]={x:x1,y:-r}; }else{result[3]=undefined;}
  }
  return result;
}

// 実用的な方。単に処理を分けているだけ。この結果が長さ2の配列に
// なるときだけ線を描画する仕組みを作る。
function getIntersectionPoints(r, a, b, c, d){
  let result = getIntersectionsWithSquare(r, a, b, c, d);
  let points = [];
  for(let i = 0; i < 4; i++){
    if(result[i] != undefined){ points.push({x:result[i].x, y:result[i].y, id:i}); }
  }
  return points;
}
// drawSliceLineは要らないかな。この結果使って描画しましょう。

// SliceQuadの頂点の座標列を取得
function getSliceQuadVertices(r, a, b ,c, d){
  let result = getIntersectionsWithSquare(r, a, b, c, d);
  // 6つくらいで場合分けする
  // 単純にresultの0と2については上下にずらし、
  // resultの1と3については左右にずらす。
  let p = getIntersectionPoints(r, a, b, c, d);
  if(p.length != 2){ return []; }
  const e = p[0].x;
  const f = p[0].y;
  const g = p[1].x;
  const h = p[1].y;
  const eps = 0.01;
  //stroke(128, 255, 128);
  //strokeWeight(1);
  if(p[0].id == 0 && p[1].id == 1){
    return [e,f+eps,g+eps,h,g-eps,h,e,f-eps];
  }
  if(p[0].id == 1 && p[1].id == 2){
    return [e+eps,f,g,h-eps,g,h+eps,e-eps,f];
  }
  if(p[0].id == 2 && p[1].id == 3){
    return [e,f+eps,g+eps,h,g-eps,h,e,f-eps];
  }
  if(p[0].id == 0 && p[1].id == 3){
    return [e,f+eps,g-eps,h,g+eps,h,e,f-eps];
  }
  if(p[0].id == 0 && p[1].id == 2){
    return [e,f+eps,g,h+eps,g,h-eps,e,f-eps];
  }
  if(p[0].id == 1 && p[1].id == 3){
    return [e+eps,f,g+eps,h,g-eps,h,e-eps,f];
  }
  return [];
}


// ------------------------------------------------------ //
// tessellation関連
// bgManagerと関連付けないといけないので大変ですね・・・
// まあそれ使えば便利なので何とかしましょう。

// layer1に線を描いていく
// 2で消したり引いたりする
class Drawer{
  constructor(){
    this.img = new BackgroundManager();
    this.img.addLayer().addLayer().addLayer(); // instructionを追加
    this.prepareForDrawLine(1);
    this.prepareForDrawLine(2);
    this.prepareInstruction();
    this.points = [];
    this.contours = [];
    this.drawFlag = false;
    this.reset();
    this.entryPoint = {};
  }
  getContours(){
    return this.contours;
  }
  reset(){
    // テッセレート終わったら消す
    this.points = [];
    this.contours = [[-160, -160, 0, -160, 160, 0, 160, 160, 0, 160, -160, 0]];
    this.img.setLayer(1).draw("clear")
                        .draw("line", [-160, -160, -160, 160])
                        .draw("line", [-160, 160, 160, 160])
                        .draw("line", [160, 160, 160, -160])
                        .draw("line", [160, -160, -160, -160]);
  }
  prepareForDrawLine(layerId){
    this.img.setLayer(layerId)
            .draw("translate", [width * 0.5, height * 0.5])
            .draw("stroke", [255])
            .draw("strokeWeight", [2]);
  }
  prepareInstruction(){
    this.img.setLayer(3)
            .draw("fill", [255])
            .draw("noStroke")
            .draw("textAlign", [CENTER, CENTER])
            .draw("textSize", [20])
            .draw("text", ["Slice: mouseLeftDown", 320, 60])
            .draw("text", ["Break: mouseRightDown", 320, 100]);
  }
  setEntryPoint(){
    this.entryPoint.x = mouseX - width * 0.5;
    this.entryPoint.y = mouseY - height * 0.5;
  }
  activate(){
    this.drawFlag = true;
  }
  inActivate(){
    this.drawFlag = false;
  }
  isActive(){
    return this.drawFlag;
  }
  clearTmpLayer(){
    // テンポラリーレイヤーのクリア
    this.img.setLayer(2).draw("clear");
  }
  drawBreakLine(layerId){
    const {x, y} = this.entryPoint;
    const mx = mouseX - width * 0.5;
    const my = mouseY - height  * 0.5;
    const p = getIntersectionPoints(320, x, y, mx, my);
    if(p.length != 2){ return false; }
    this.img.setLayer(layerId).draw("line", [p[0].x, p[0].y, p[1].x, p[1].y]);
    return true;
  }
  addBreakLine(){
    const {x, y} = this.entryPoint;
    const mx = mouseX - width * 0.5;
    const my = mouseY - height  * 0.5;
    if(!this.drawBreakLine(2)){
      return;
    }
    const q = getSliceQuadVertices(160, x, y, mx, my);
    if(q.length == 0){
      this.clearTmpLayer()
      return;
    }
    this.contours.push([q[0], q[1], 0, q[2], q[3], 0, q[4], q[5], 0, q[6], q[7], 0]);
    this.drawBreakLine(1);
    this.clearTmpLayer();
  }
  update(){
    // リアタイで線を引く
    if(this.drawFlag){
      this.clearTmpLayer();
      this.drawBreakLine(2);
    }
  }
  display(){
    this.img.display();
  }
}

// さてと
//
class Tessellator{
  constructor(){
    this.tesses = [];
    this.h = 30;
    this.upperPaintColor = _RGB(1.0, 0.5, 1.0); // 上面
    this.lowerPaintColor = _RGB(0.0, 0.5, 1.0); // 下面
    // ピッカーで選べるようにする？
  }
  setHeight(h){
    this.h = h;
  }
  setPaintColor(upperColorObj, lowerColorObj){
    if(lowerColorObj === undefined){
      lowerColorObj = _RGB(1.0, 1.0, 1.0);
    }
    this.upperPaintColor = upperColorObj;
    this.lowerPaintColor = lowerColorObj;
  }
  createTessellation(contours){
    // ------- ここから！ ------- //
    // ------- ここまで！ ------- //
    // テッセレーション処理を外注
    // 高さランダムしても面白いかもね
    let boardMeshes = getIslandBoardMeshesFromContours(contours, this.h);
    for(let boardMesh of boardMeshes){
      if(boardMesh == undefined){ continue; }
      // 色
      let {r:ur, g:ug, b:ub} = this.upperPaintColor;
      let {r:lr, g:lg, b:lb} = this.lowerPaintColor;
      let vertexColors = [];
      for(let i = 0; i < boardMesh.v.length / 3; i++){
        const z = boardMesh.v[3*i+2]; // 高さ情報
        const ratio = (this.h - z) / (this.h*2); // 上が0で下が1ね
        const seed = Math.random();
        const pur = (1-seed) * ur + seed; // proper.
        const pug = (1-seed) * ug + seed;
        const pub = (1-seed) * ub + seed;
        vertexColors.push((1-ratio)*pur + ratio*lr,
                          (1-ratio)*pug + ratio*lg,
                          (1-ratio)*pub + ratio*lb, 1);
      }

      const tessName = "tess" + (Tessellator.id++);
      _node.use("light", tessName)
           .registAttributes({
             aPosition:{data:boardMesh.v, stride:3},
             aVertexColor:{data:vertexColors, stride:4},
             aNormal:{data:boardMesh.n, stride:3}})
           .registIndexBuffer(boardMesh.f, Uint32Array);
      this.tesses.push(new Tessa(tessName, boardMesh.v));
    }
  }
  display(){
    if(this.tesses.length == 0){ return; }
    for(let tess of this.tesses){ tess.display(); }
    for(let i = this.tesses.length-1; i>=0; i--){
      let tess=this.tesses[i];
      const p = tess.getPosition();
      if(p.y > height){
        this.tesses.splice(i, 1); // 画面外に出たら排除
      }
    }
  }
}

Tessellator.id = 0;

// tessaはdrawerで生成したメッシュの・・
// つまり動かさない場合、そのままなんですよね。修正がなければ。
// 当たり前ですけど。
// で、それを取得するにあたり、取得部分を分離します。
class Tessa{
  constructor(name, vertices){
    this.name = name;
    this.position = createVector(0, 0, 0);
    const vx = 3*(Math.random()-0.5);
    const vz = 3*(Math.random()-0.5);
    const vy = 4+4*Math.random();
    this.velocity = createVector(vx, -vy, vz);
    this.gravity = createVector(0, 0.3, 0);
    this.properFrameCount = 0;
    this.periodX = 160 + 160 * Math.random();
    this.periodZ = 240 + 80 * Math.random();
  }
  getName(){
    return this.name;
  }
  getPosition(){
    return this.position;
  }
  display(){
    this.velocity.add(this.gravity);
    this.position.add(this.velocity);

    const {x:px, y:py, z:pz} = this.position;
    const tx = this.properFrameCount * TAU / this.periodX;
    const tz = this.properFrameCount * TAU / this.periodZ;
    _node.useTopology(this.name)
         .setAttribute()
         .setMatrix([{tr:[px, py, pz]}])
         .setVertexColor()
         .bindIndexBuffer()
         .drawElements(gl.TRIANGLES)
         .clear(); // clearも忘れずに
    this.properFrameCount++;
  }
}

function tessellation(){
  let ctrs = _drawer.getContours();
  if(ctrs.length == 0){ return; }
  let maxLength = -1;
  for(let i = 0; i < ctrs.length; i++){
    maxLength = max(maxLength, ctrs[i].length);
  }
  if(maxLength < 3){
    _drawer.reset();
    return;
  }
  _tessellator.createTessellation(ctrs);
  _drawer.reset();
  mode = 1;
}

// ------------------------------------------------------------- //
// interaction.

function mousePressed(){
  if(mouseButton == LEFT){
    _drawer.activate();
    _drawer.setEntryPoint();
    return;
  }
  if(mouseButton == RIGHT){
    tessellation();
    _tessellator.setPaintColor(_HSV(Math.random(),1,1), _HSV(0.15,1,1));
    return;
  }
}

function mouseReleased(){
  if(_drawer.isActive()){
    _drawer.addBreakLine();
    _drawer.inActivate();
  }
}

// ------------------------------------------------------------ //
// determinant.
// ベクトル(a,b,c),(d,e,f),(g,h,i)に対し
// 位置ベクトルが作る平行六面体の符号付体積
// これが0の場合三角形はつぶれているという証明にもなる
// 1を使う！
// 三角形が平面上にあるときは暫定的にz座標を1にするとかする

// calcDet(a,b,1,c,d,1,e,f,1)のabsを2で割ると(a,b)(c,d)(e,f)を
// 頂点とする三角形の面積が出る

function calcDet(a,b,c,d,e,f,g,h,i){
  const det = a*(e*i-f*h) + b*(f*g-d*i) + c*(d*h-e*g);
  return det;
}

// ------------------------------------------------------------ //
// calculateTessellation.
// pointsは重複なしでの上面の頂点座標群
// contoursはループの集合ですね、ひとつながりとは限らないので。
// facesは三角形のインデックス列の集合で時計回りにポリゴンですね。
// contourに紐付けることも考えたんですけど、
// まあ、めんどくさいですから・・無しで・・・・・・

// contoursをあれ、する。で、{points, contours, faces}を出力する感じ。

function calculateTessellation(ctrs){
  // step0.triangulateする。
  let tr = _gl._triangulate(ctrs);
  // step1:つぶれた三角形を排除
  for(let i = tr.length - 1; i >= 0; i -= 9){
    const localArea = 0.5*Math.abs(calcDet(tr[i-8],tr[i-7],1,tr[i-5],tr[i-4],1,tr[i-2],tr[i-1],1));
    if(localArea < 0.00001){
      for(let k = 0; k < 9; k++){
        tr.splice(i-k, 1);
      }
    }
  }
  const L1 = tr.length / 3; // 片面の重複込みの頂点数
  // ここでL1が0のときはundefinedを返す感じですかね
  if(L1 == 0){ return undefined; }

  // step2:点オブジェクト生成
  let ps = [];
  for(let i = 0; i < L1; i++){
    ps.push({x:tr[3*i], y:tr[3*i+1], z:i});
  }
  // step3:xとyでソート(xが同じならyの小さい順)
  // おそらくほんとに同じ点のはずなので大丈夫
  ps.sort((p, q) => {
    if(p.x < q.x){
      return -1;
    }
    if(p.x == q.x && p.y < q.y){
      return -1;
    }
    return 0;
  });
  // step4:点の数の配列を用意
  let ps2 = new Array(L1); // ここには重複込みでpointが入る
  // step5:Pointオブジェクトを生成
  let points = [];
  let index = 0;
  points.push({x:ps[0].x, y:ps[0].y, id:index, next:[]});
  index++;
  ps2[ps[0].z] = points[0];
  for(let i = 1; i < L1; i++){
    // ps[i]を取る
    // ps[i-1]と一緒だったらps[i-1].zからps2のを取ってそれを
    // 一緒じゃなかったらindexのPoint作って格納しつつindex++;
    if(ps[i].x == ps[i-1].x && ps[i].y == ps[i-1].y){
      ps2[ps[i].z] = ps2[ps[i-1].z];
    }else{
      const newPoint = {x:ps[i].x, y:ps[i].y, id:index, next:[]};
      ps2[ps[i].z] = newPoint;
      points.push(newPoint);
      index++;
    }
  }
  const L = points.length; // 片面の頂点の個数（重複無し）
  // 三角形の個数はL1/3です。ここでL1/3個の[]を生成します。
  // これらひとつひとつが三角形と対応します。
  const T1 = L1 / 3; // T1は三角形の個数

  // step6:3つの頂点をフェッチしつつ・・idを入れていく。
  // queryでfaceIndexをつないでUnionFindにまとめてもらう。


  let faces = [];
  faces.push(ps2[0].id, ps2[1].id, ps2[2].id);
  // fIdは何番目の三角形の辺として現れたかのコード
  // これが隣接辺で参照されるときに三角形同士が接続を得る
  ps2[0].next.push({id:ps2[2].id, fId:0});
  ps2[1].next.push({id:ps2[0].id, fId:0});
  ps2[2].next.push({id:ps2[1].id, fId:0});

  let query = []; // 統合用クエリ配列

  for(let i = 3; i < L1; i += 3){
    const faceIndex = floor(i/3); // faceIndexはiから計算できます
    // iとi+1とi+2を見る
    faces.push(ps2[i].id, ps2[i+1].id, ps2[i+2].id);
    for(let k = 0; k < 3; k++){
      const from = i+k;
      const to = i+((k+2)%3);
      let pFrom = ps2[from];
      let pTo = ps2[to];
      const target = pFrom.id;
      let isDouble = false;
      for(let m = 0; m < pTo.next.length; m++){
        if(pTo.next[m].id === target){
          const _fId = pTo.next[m].fId;// 逆方向辺の属する三角形のid
          query.push([_fId, faceIndex]); // _fIdとfaceIndexを接続します
          pTo.next.splice(m, 1);
          isDouble = true;
          break;
        }
      }
      // 重複しないならば新規のedgeを追加
      if(!isDouble){
        pFrom.next.push({id:pTo.id, fId:faceIndex});
      }
    }
  }
  const ufResult = getUnionFind(T1, query); // T1は三角形の個数
  const islandCount = ufResult.count; // 島の数
  const uf = ufResult.uf; // uf[fId].lvで属するレベルを確認できる
  // nextを排除するときにそのfIdを常に更新していく感じですね
  // どんな値であってもそれがufに入って・・どれでもいいんだっけ？
  // じゃあ最初に決めてしまえ。

  // step7:contoursの生成
  // nextのところでidを参照するようにする以外特に変更はないです
  let debug = 0;
  let _contours = []; // ここにループを入れていく
  let islandLevels = []; // level配列。k番contourのレベルがkに入ってる.

  while(debug < 999999){
    // nextが存在する点を探す
    let hasNextExists = false;
    let hasNextPoint;
    for(let p of points){
      if(p.next.length > 0){
        hasNextPoint = p;
        hasNextExists = true;
        break;
      }
    }
    // 無ければ終了
    if(!hasNextExists){ break; }
    let cur = hasNextPoint;
    let prev; // prevがある場合にチョイスの仕方を工夫する
    // ループの起点のインデックス
    const startId = hasNextPoint.id;
    let _contour = []; // ここにidを入れていく(頭とおしりは重複させる)
    let islandLevel = -1;
    _contour.push(startId);
    while(debug < 999999){

      let targetId = -1;

      if(cur.next.length == 1 || prev == undefined){
        targetId = 0;
      }else{
        // prevが存在してなおかつnextが2以上の場合
        const dirFromCurToPrev = atan2(prev.y - cur.y, prev.x - cur.x);
        let dirs = [];
        const curV = createVector(cur.x, cur.y);
        for(let i = 0; i < cur.next.length; i++){
          let nextP = createVector(points[cur.next[i].id].x, points[cur.next[i].id].y);
          nextP.sub(curV);
          nextP.rotate(-dirFromCurToPrev);
          let _dir = atan2(nextP.y, nextP.x);
          if(_dir<0){ _dir += TAU; }
          dirs.push(_dir);
        }
        // dirsの中身が最小なところを探す
        let minDir = 99999;
        for(let i = 0; i < dirs.length; i++){
          if(dirs[i] < minDir){
            minDir = dirs[i]; targetId = i;
          }
        }
      }

      const _next = cur.next[targetId];
      const nextId = _next.id;
      islandLevel = uf[_next.fId].lv; // これがレベル

      let q = points[nextId];
      cur.next.splice(targetId, 1); // targetIdを排除
      _contour.push(nextId);
      // qが起点の場合は起点のIndexを格納して抜ける
      if(nextId == startId){
        break;
      }
      // そうでない場合は起点を更新しつつループ
      prev = cur; // 2回目以降のチョイスでprevを適用
      cur = q;
      debug++;
    }
    _contours.push(_contour);
    islandLevels.push(islandLevel);
    debug++;
  }
  //console.log(islandCount);
  //console.log(islandLevels);
  // countはレベルの個数でlevelsはk番contourの属するレベルがlevels[k]
  // という意味。すなわちcountの長さの配列に次々とcontourを入れていく
  // その際に末尾除くすべてのidについてpointsを参照して点の座標を
  // あれすることで個別にできるわけです。
  return {points:points, contours:_contours, faces:faces, count:islandCount, levels:islandLevels};
}


// ------------------------------------------------------------ //
// ここで・・・
// たとえばtextからcontoursを取得する関数とか
// バラ曲線のcontoursを取得する関数とかほしいわね

// というわけでsayoさんの3Dtextから拝借～～～
// というか生コードにも出てくるけど。
// https://openprocessing.org/sketch/956215 ですよ～怪物コード
// はい
// textBoundsは(文字、x,y,size)ってやると
// デフォルトにおける左端、上端、横幅、縦幅がx,y,w,hでアクセス可能に
// なります（文字のサイズはsizeです）。
// 次にgetPath(文字、x,y,size).commandsが意味するのは
// xとyを左端上端とした場合のsizeがsizeの文字領域の描画データです
// データに基づいてcontoursを構成するわけ(Mが起点でZが終点みたいな)
// たとえばこれでLEFTのTOPを指定して取得してから200,200ってやると
// 200,200がLEFTでTOPの点配置になるというわけ

// ところでftはp5.Fontのクラスでないといけないので
// だいたいはDLしてセットするのよね

// ------------------------------------------------------------ //
// getContoursFlower.
// https://openprocessing.org/sketch/1419415
// でいろいろ遊べます。参考までに。
function getContoursFlower(r, m, n, ratio, detail = 400){
  // んー・・・
  let result = [];
  for(let i = 0; i < detail; i++){
    const t = TAU * i / detail;
    const x = r * ((1-ratio)*cos(m*t) - ratio*sin(n*t));
    const y = r * ((1-ratio)*sin(m*t) - ratio*cos(n*t));
    result.push(x, y, 0);
  }
  return [result];
}

// ------------------------------------------------------------ //
// getContoursFromText.
// CENTER,CENTERだけで・・いいわけないか。

// たとえばLEFT,TOPってやると0,0がLEFTでTOPになります。
// CENTER,CENTERってやると0,0が中央に来るわけ。

function getContoursFromText(ft, txt, size, detail, h_align, v_align){
  const bounds = ft.textBounds(txt, 0, 0, size);
  let x, y;
  switch(h_align){
    case LEFT:
      x = -bounds.x; break;
    case CENTER:
      x = -bounds.x - bounds.w * 0.5; break;
    case RIGHT:
      x = -bounds.x - bounds.w; break;
  }
  switch(v_align){
    case TOP:
      y = -bounds.y; break;
    case CENTER:
      y = -bounds.y - bounds.h * 0.5; break;
    case BOTTOM:
      y = -bounds.y - bounds.h; break;
  }
  let contours = [];
  let contour = [];
  let currentPos = createVector();
  const data = ft.font.getPath(txt, x, y, size).commands;

  for(let i = 0; i < data.length; i++){
    const cmd = data[i];
    switch(cmd.type){
      case "M":
        contour = [];
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "L":
        if(currentPos.x == cmd.x && currentPos.y == cmd.y) continue; // ここの処理オリジナルでは無いけどなんで用意したのか
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "C":
        for(let k = 0; k < detail; k++){
          contour.push(new p5.Vector(bezierPoint(currentPos.x, cmd.x1, cmd.x2, cmd.x, k / detail), bezierPoint(currentPos.y, cmd.y1, cmd.y2, cmd.y, k / detail)));
        }
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "Q":
        for(let k = 0; k < detail; k++){
          contour.push(new p5.Vector(bezierPoint(currentPos.x, cmd.x1, cmd.x1, cmd.x, k / detail), bezierPoint(currentPos.y, cmd.y1, cmd.y1, cmd.y, k / detail)));
        }
        currentPos.set(cmd.x, cmd.y);
        contour.push(currentPos.copy()); break;
      case "Z":
        contour.pop();
        // vec2では困るので配列に変換します
        contours.push(vec2ToArray(contour));
    }
  }
  return contours;
}

// vec2の配列を0挿入で長さ1.5倍の配列に変換する
function vec2ToArray(seq){
  let result = [];
  for(let p of seq){
    result.push(p.x, p.y, 0);
  }
  return result;
}

// ------------------------------------------------------------ //
// contoursからメッシュを取得する関数作ろうかと思って
// boardMesh
// 要するに板です
// 得られるのはvとfとnです色はvから適当にって感じで
// 厚さだけ指定(厚さの半分！)

// z1が上の高さでz2が下の高さ。z2は0にすることもあるということで。

function getBoardMeshFromContours(contours, z1, z2){
  if(z2 === undefined){ z2 = -z1; }
  let tessData = calculateTessellation(contours);
  if(tessData == undefined){ return undefined; }

  let points = tessData.points;
  let _contours = tessData.contours;
  let faces = tessData.faces;

  let vertices = [];

  for(let p of points){
    vertices.push(p.x, p.y, z1);
  }
  for(let p of points){
    vertices.push(p.x, p.y, z2);
  }
  // ここは最後でもいいのよね
  // facesは片面だけなので裏面を追加
  const L = points.length;
  const F = faces.length;
  // あ、そっか、Fまで、だ、・・・・
  for(let i = 0; i < F; i+=3){
    faces.push(L+faces[i], L+faces[i+2], L+faces[i+1]);
  }
  // たぶんこれでいいはず

  // できたのでそれぞれについて処理
  // 隣接idについて壁を作るだけ
  let len = 2*L;
  for(let _contour of _contours){
    const startP = points[_contour[0]];
    vertices.push(startP.x, startP.y, z1);
    vertices.push(startP.x, startP.y, z2);
    len += 2;
    for(let i = 1; i < _contour.length; i++){
      // iとi-1について処理
      const rightP = points[_contour[i]];
      vertices.push(rightP.x, rightP.y, z1);
      vertices.push(rightP.x, rightP.y, z2);
      len += 2;
      faces.push(len-4, len-2, len-3, len-3, len-2, len-1);
    }
  }
  let vertexNormals = getNormals(vertices, faces);
  return {v:vertices, f:faces, n:vertexNormals};
}

// getIslandBoardMeshesFromContours.
// アイランドボードメッシュズ。
// 島ごとにv,f,nを計算し配列を返す。
function getIslandBoardMeshesFromContours(contours, z1, z2){
  if(z2 === undefined){ z2 = -z1; }
  let tessData = calculateTessellation(contours);
  if(tessData == undefined){ return undefined; }

  let ps = tessData.points;
  let _ctrs = tessData.contours;

  const count = tessData.count;
  let islands = [];
  for(let i = 0; i < count; i++){ islands.push([]); }
  let levelMap = tessData.levels;
  for(let k = 0; k < _ctrs.length; k++){
    const lv = levelMap[k];
    const contourIds = _ctrs[k];
    let ctr = [];
    // 頭とおしりが重複なので1つ前まで入れる
    for(let h = 0; h < contourIds.length-1; h++){
      const id = contourIds[h];
      ctr.push(ps[id].x, ps[id].y, 0);
    }
    islands[lv].push(ctr);
  }
  // 各々のislands[k]たちで新しく～～～って感じ
  let meshes = [];
  for(let lv = 0; lv < count; lv++){
    const island = islands[lv];
    let _tess = calculateTessellation(island);
    if(_tess == undefined){ continue; }
    let points = _tess.points;
    let _contours = _tess.contours;
    let faces = _tess.faces;

    let vertices = [];
    for(let p of points){
      vertices.push(p.x, p.y, z1);
    }
    for(let p of points){
      vertices.push(p.x, p.y, z2);
    }
    // facesは片面だけなので裏面を追加
    const L = points.length;
    const F = faces.length;
    // あ、そっか、Fまで、だ、・・・・
    for(let i = 0; i < F; i+=3){
      faces.push(L+faces[i], L+faces[i+2], L+faces[i+1]);
    }
    // 隣接idについて壁を作るだけ
    let len = 2*L;
    for(let _contour of _contours){
      const startP = points[_contour[0]];
      vertices.push(startP.x, startP.y, z1);
      vertices.push(startP.x, startP.y, z2);
      len += 2;
      for(let i = 1; i < _contour.length; i++){
        // iとi-1について処理
        const rightP = points[_contour[i]];
        vertices.push(rightP.x, rightP.y, z1);
        vertices.push(rightP.x, rightP.y, z2);
        len += 2;
        faces.push(len-4, len-2, len-3, len-3, len-2, len-1);
      }
    }
    let vertexNormals = getNormals(vertices, faces);
    meshes.push({v:vertices, f:faces, n:vertexNormals});
  }
  return meshes;
}

// getBevelMeshFromContours   // bevelされたメッシュ
// 各ループにおいて頂点を両側に出ている辺の内側方向の法線の平均方向に
// 同じだけずらしてからちょっと持ち上げて
// その間のメッシュを追加する感じですかね
// 上面と下面についてはfacesのデータがあるのでそれを流用する

// できません
// あ、分かった
// まず内側にへこませる
// それでbevel辺をつくってしまう
// あっちと同じやり方で外壁も作っちゃう
// bvで厚み
// bhで上方向に大きくする
// 最後にその内側たちでcontoursを再構成したうえで
// 再び_triangulateすることで上面と下面を作る
// OK!!だそうです。

// z1は上面の高さでz2は下面の高さでbvは内側への変位でbhは面に垂直な
// 方向への変位とする
function getBevelMeshFromContours(contours, bv, bh, z1, z2){
  if(z2 === undefined){ z2 = -z1; }
  let tessData = calculateTessellation(contours);

  let points = tessData.points;
  let _contours = tessData.contours;

  let vertices = [];
  let faces = [];
  // 今回は先に壁を作っちゃいましょう
  let len = 0;
  for(let _contour of _contours){
    const startP = points[_contour[0]];
    vertices.push(startP.x, startP.y, z1);
    vertices.push(startP.x, startP.y, z2);
    len += 2;
    for(let i = 1; i < _contour.length; i++){
      // iとi-1について処理
      const rightP = points[_contour[i]];
      vertices.push(rightP.x, rightP.y, z1);
      vertices.push(rightP.x, rightP.y, z2);
      len += 2;
      faces.push(len-4, len-2, len-3, len-3, len-2, len-1);
    }
  }

  // ベベル面を作りましょう
  let innerPointsArray = [];
  let innerContours = [];
  for(let contour of _contours){
    let innerPoints = [];
    let innerContour = [];
    const l = contour.length;
    for(let i = 0; i < l-1; i++){

      // iとi+1とi-1を見る。-1の場合はl-2で参照する。
      const curP = points[contour[i]];
      const nextP = points[contour[i+1]];
      const prevP = points[contour[(i>0 ? i-1 : l-2)]];
      // prevP→curPとcurP→nextPをそれぞれ反時計回り(x,y→y,-x)して
      // 正規化して足し合わせて正規化して
      // bv進んで上にbh進む感じで
      // 加えてどの点から来たのか覚えておく（idでいい）
      const prevN = createVector(curP.y - prevP.y, -(curP.x - prevP.x)).normalize();
      const nextN = createVector(nextP.y - curP.y, -(nextP.x - curP.x)).normalize();
      const bn = p5.Vector.add(prevN, nextN).normalize().mult(bv);
      innerPoints.push({x:curP.x + bn.x, y:curP.y + bn.y, from:curP});
      innerContour.push(curP.x + bn.x, curP.y + bn.y, 0);
    }
    innerPointsArray.push(innerPoints);
    innerContours.push(innerContour);
  }
  // そうしたうえで、ベベル面についても外壁と同じように、
  // 全く新しい頂点群を作る。情報はfromのcurPにある。xとｙだけでいい。
  for(let innerPoints of innerPointsArray){
    const inn = innerPoints[0];
    const from = inn.from;
    vertices.push(inn.x, inn.y, z1+bh);
    vertices.push(from.x, from.y, z1);
    vertices.push(from.x, from.y, z2);
    vertices.push(inn.x, inn.y, z2-bh);
    len += 4;
    for(let i = 1; i <= innerPoints.length; i++){
      // iとi-1について処理
      const rightInn = innerPoints[(i<innerPoints.length ? i:0)];
      const rightFrom = rightInn.from;
      vertices.push(rightInn.x, rightInn.y, z1+bh);
      vertices.push(rightFrom.x, rightFrom.y, z1);
      vertices.push(rightFrom.x, rightFrom.y, z2);
      vertices.push(rightInn.x, rightInn.y, z2-bh);
      len += 4;
      // 上側が-8,-4,-6,-2で下側が-7,-3,-5,-1です。
      faces.push(len-8, len-4, len-7, len-7, len-4, len-3);
      faces.push(len-6, len-2, len-5, len-5, len-2, len-1);
    }
  }

  // 最後に上面と下面。
  let innerTessData = calculateTessellation(innerContours);
  let pts = innerTessData.points;
  let fs = innerTessData.faces;

  const pl = pts.length;

  for(let i = 0; i < pl; i++){
    vertices.push(pts[i].x, pts[i].y, z1+bh);
  }
  for(let i = 0; i < pl; i++){
    vertices.push(pts[i].x, pts[i].y, z2-bh);
  }

  for(let i = 0; i < fs.length; i += 3){
    faces.push(fs[i]+len, fs[i+1]+len, fs[i+2]+len);
    faces.push(fs[i]+len+pl, fs[i+2]+len+pl, fs[i+1]+len+pl);
  }
  // これですべて、のはず・・
  let vertexNormals = getNormals(vertices, faces);
  return {v:vertices, f:faces, n:vertexNormals};
}

// まず外壁
// そして底面
// 終わったらへこませて
// b1が厚さ（へこみ具合）でb2がそこの厚さ(z2から引く)です
// へこませてその間のところのメッシュ
// へこんだそれについて内壁
// 最後に内部底面は同じように再テッセレート
// 以上
function getDimpleMeshFromContours(contours, b1, b2, z1, z2){
  if(z2 === undefined){ z2 = -z1; }
  let tessData = calculateTessellation(contours);

  let points = tessData.points;
  let _contours = tessData.contours;
  let _faces = tessData.faces; // えーと・・・？？？
  // あー、そうか、どうするかな。。。
  // ごめん。底面が先だわ。

  let vertices = [];
  let faces = [];
  let len = 0;

  // 底面を先に作ります
  for(let p of points){
    vertices.push(p.x, p.y, z2);
    len++;
  }
  const F = _faces.length;
  for(let i = 0; i < F; i+=3){
    faces.push(_faces[i], _faces[i+2], _faces[i+1]);
  }

  // 外壁！
  for(let _contour of _contours){
    const startP = points[_contour[0]];
    vertices.push(startP.x, startP.y, z1);
    vertices.push(startP.x, startP.y, z2);
    len += 2;
    for(let i = 1; i < _contour.length; i++){
      // iとi-1について処理
      const rightP = points[_contour[i]];
      vertices.push(rightP.x, rightP.y, z1);
      vertices.push(rightP.x, rightP.y, z2);
      len += 2;
      faces.push(len-4, len-2, len-3, len-3, len-2, len-1);
    }
  }

  // 内部点を作りましょう
  // 厚さb1を考慮します(先ほどのbvに当たる)
  let innerPointsArray = [];
  let innerContours = [];
  for(let contour of _contours){
    let innerPoints = [];
    let innerContour = [];
    const l = contour.length;
    for(let i = 0; i < l-1; i++){

      // iとi+1とi-1を見る。-1の場合はl-2で参照する。
      const curP = points[contour[i]];
      const nextP = points[contour[i+1]];
      const prevP = points[contour[(i>0 ? i-1 : l-2)]];
      // prevP→curPとcurP→nextPをそれぞれ反時計回り(x,y→y,-x)して
      // 正規化して足し合わせて正規化して
      // bv進んで上にbh進む感じで
      // 加えてどの点から来たのか覚えておく（idでいい）
      const prevN = createVector(curP.y - prevP.y, -(curP.x - prevP.x)).normalize();
      const nextN = createVector(nextP.y - curP.y, -(nextP.x - curP.x)).normalize();
      const bn = p5.Vector.add(prevN, nextN).normalize().mult(b1);
      innerPoints.push({x:curP.x + bn.x, y:curP.y + bn.y, from:curP});
      innerContour.push(curP.x + bn.x, curP.y + bn.y, 0);
    }
    innerPointsArray.push(innerPoints);
    innerContours.push(innerContour);
  }

  // 内部点との境界を作りましょう
  // 今回は高くしないのでそこが違いますね
  for(let innerPoints of innerPointsArray){
    const inn = innerPoints[0];
    const from = inn.from;
    vertices.push(inn.x, inn.y, z1);
    vertices.push(from.x, from.y, z1);
    vertices.push(from.x, from.y, z2);
    vertices.push(inn.x, inn.y, z2);
    len += 4;
    for(let i = 1; i <= innerPoints.length; i++){
      // iとi-1について処理
      const rightInn = innerPoints[(i<innerPoints.length ? i:0)];
      const rightFrom = rightInn.from;
      vertices.push(rightInn.x, rightInn.y, z1);
      vertices.push(rightFrom.x, rightFrom.y, z1);
      vertices.push(rightFrom.x, rightFrom.y, z2);
      vertices.push(rightInn.x, rightInn.y, z2);
      len += 4;
      // 上側が-8,-4,-6,-2で下側が-7,-3,-5,-1です。
      faces.push(len-8, len-4, len-7, len-7, len-4, len-3);
      faces.push(len-6, len-2, len-5, len-5, len-2, len-1);
    }
  }
  // 内壁を作ります
  // innerをフェッチしていくのですが走査は逆方向です（注意！）
  for(let innerPoints of innerPointsArray){
    const inn = innerPoints[0];
    const from = inn.from;
    vertices.push(inn.x, inn.y, z1);
    vertices.push(inn.x, inn.y, z2+b2);
    len += 2;
    for(let i = innerPoints.length-1; i >=0; i--){
      // iとi-1について処理
      const rightInn = innerPoints[(i<innerPoints.length ? i:0)];
      const rightFrom = rightInn.from;
      vertices.push(rightInn.x, rightInn.y, z1);
      vertices.push(rightInn.x, rightInn.y, z2+b2);
      len += 2;
      faces.push(len-4, len-2, len-3, len-3, len-2, len-1);
    }
  }
  // 最後に内部底面。これはあっちと同じね
  let innerTessData = calculateTessellation(innerContours);
  let pts = innerTessData.points;
  let fs = innerTessData.faces;

  const pl = pts.length;
  for(let i = 0; i < pl; i++){
    vertices.push(pts[i].x, pts[i].y, z2+b2);
  }
  for(let i = 0; i < fs.length; i += 3){
    faces.push(fs[i]+len, fs[i+1]+len, fs[i+2]+len);
  }

  let vertexNormals = getNormals(vertices, faces);
  return {v:vertices, f:faces, n:vertexNormals};
}

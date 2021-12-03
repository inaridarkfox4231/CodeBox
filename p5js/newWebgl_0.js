// 全画面にする？

// 参考：h_doxasさんのhttps://wgld.org/d/webgl/w083.html です！

// 縦と横の短い方を決めて
// 今-1～1となっているところを
// そのままでいいや

// 描画するときに位置の指定でそこら辺考慮する感じで
// 位置の調整はmin(uRes)/uResを掛ければいい
// マウスに関してはこれと逆でuRes/min(uRes)を掛ける感じ

// じゃあもういいんでポイントスプライトの実験しましょうかね
// んー。
// gl_PointCoordで参照できればいいわけね？

// シェーダ部分は分離しない
// 名前整理
// テクスチャまとめる
// 以上

// たとえばdShad→dataShader, bgShad→bgShaderとかそういうこと
// pShadはpointShader, ああそうか、もうuserPointShaderどうでもいい
// んだっけ
// PrgはProgramの方がいいと思う、そんなところですかね。

// -----------まとめ----------- //

// ・マルチテクスチャしないなら何にも問題ないみたいですね
// ・浮動小数点数テクスチャは一度にbindできるのは1つまで
// ・それらのテクスチャ番号は一致していないといけない
// ・他の画像イメージは割と自由みたいでそれら(src)については
//   p5.Texture(_gl, src)でtexture生成してそのglTexを使える
// ・番号は浮動小数点数テクスチャがある場合はそれとかぶってはいけない
// ・画像同士ならかぶってもOKだけど同じプログラムの中では分けないと駄目
// ・画像テクスチャの内容更新は2D描画で中身を書き換えつつ
//   update関数を使えばできるよ
//   そういうことらしいです。

// 即時関数化は無しで。レンダラーがないとできないので。
// init()でやってたけどまずそうなのでshader()でやります
// （validateとかいろいろやってるみたいなので）
// あとloadShaderの場合これやらないとエラーになるので。
// initだけだとshaderにレンダラーの通知が行かない・・割とやばい？

// シェーダーごとの処理まとめ
// 1.vsとfsからシェーダー作ってshader()かます
// 2.Programを取得
// 3.attribute名,stride,vbo用のデータからいろいろ作ってProgramに登録
// 4.textureのみtexture名からLocationを取得してProgramに登録
// 以上

// ambientはconstにしました。1ヶ所でしか使わないものをグローバルにする
// のは無駄なので。そうなるとマウス変数もそうすべきよね・・・

// indicesとpoistionsをグローバル化
// これについてはいろいろありそうだけど
// これらからlength取り出すにしても
// どっちみちハードコーディングになっちゃうなら同じこと
// もしドローコールが多いようなら長さだけグローバルコンスタントに
// すればいい。

// このあとやること
// indexBufferへの対応くらい
// できたのでこれ使ってあれ・・を、全面的に書き直す。boidsを。
// そうして足がかりを作る。それができたらいろいろおしまいです。

// 回転と法線について
// _setMatrixUniformsでいろいろやってくれる
// ただ独自定義してProjectionとUVMとVMとNMだけやるといいかも。
// uPerspectiveが要らないので・・

// ライティングについて
// 結局シェーダでどんな処理をするかがすべて
// 渡すのはベクトルやfloatだけでテクスチャも出てこないし
// とりあえずdirectionalとambientだけ扱えればいいんじゃない
// phongとか気になるけどね・・
// ていうかphongってsetAttributesで有効にするの？わかりづらい。
// ちなみにsetUniform関連の一覧は_setFillUniformsにすべてあるし
// 処理については固定シェーダに一通り書いてあるよ。おわり。
// 一つだけ指摘するとvNormalを使うのがphong shadingですね。

// 3Dtextはやり方はわかるんですけどtriangulateが闇・・・・
// てかあそこまでしなくてもよくない？？まあデフォルト使うのが吉ね。


// TODO.
// attributeはひとつにまとめて差し替え可能にする
// programのsetのクラスを作って差し替え可能にする
// shaderをコンストラクタの引数にする（webgl2だとそうしないと動かない）
// vbaは、とりあえずいいです。
// メッシュやtransformはおいおい。一度にできないので。

// Qiitaの方
// ibo部分カット
// おわり！

// だってめんどくさい

// できたようです！！

// ここからですけどね・・・
// たとえば、まだグラデーション三角形すら作ってないし、
// 回転や平行移動もしてないし、
// ライティングや法線もしてないし、
// 同じシェーダの使い回しができるのかどうか、
// インデックスバッファ使えるのかどうか、いろいろ調べないといけない。

// ProgramクラスをRenderSystemに改名（ややこしいので）。
// 別の概念なのでね・・

// --------------------------------------------------------------- //
// global.

let _gl, gl;

let _node; // これが統括する。うまくいくのか・・？

let accell = 0; // 加速度
let properFrameCount = 0; // カウントも必要

let bg, bgTex, base;

let TEX_SIZE = 512; // サンプルが512なので堂々と512で行きます！

let fb, fb2, flip;
// ダブルバッファリング
// まず最初にfbにvsPとfsPを使って位置と速度を登録。
// 次にfbをmoveに渡して変更してfb2に焼き付ける。
// そしてfb2を使って点描画。
// 最後にfbとfb2をスワップさせる。

// --------------------------------------------------------------- //
// shader.

// 初期設定用シェーダ（もはやシェーディング関係ないな）
let dataVert=
"precision mediump float;" +
"attribute vec3 aPosition;" + // unique attribute.
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

// 色を決めてるところでは位置を決めています。
let dataFrag=
"precision mediump float;" +
"uniform float uTexSize;" +
"void main(){" +
// 2x2の場合は0.5と1.5ですね。
"  vec2 p = gl_FragCoord.xy / uTexSize;" + // 0.0～1.0に正規化
// 初期位置と初期速度を設定
"  vec2 pos = (p - 0.5) * 2.0;" + // 位置は-1～1,-1～1で。
"  gl_FragColor = vec4(pos, 0.0, 0.0);" + // 初期速度は0で。
"}";

// 背景設定用シェーダ
let bgVert=
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

// 画像を読み込んで表示するだけ
let bgFrag=
"precision mediump float;" +
"uniform sampler2D uTex;" +
"uniform vec2 uResolution;" +
"void main(){" +
"  vec2 p = gl_FragCoord.xy / uResolution.xy;" +
"  p.y = 1.0 - p.y;" +
"  gl_FragColor = texture2D(uTex, p);" +
"}";

// 動かす用
// vsはそのままでいい（2x2をfsでフェッチするのにFragCoord使うから）
let moveVert =
"precision mediump float;" +
"attribute vec3 aPosition;" + // unique attribute.
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";
let moveFrag =
"precision mediump float;" +
"uniform sampler2D uTex;" +
"uniform float uTexSize;" +
"uniform vec2 uMouse;" +
"uniform bool uMouseFlag;" +
"uniform float uAccell;" + // アクセルの方がしっくりきそう
"const float SPEED = 0.05;" +
"void main(){" +
"  vec2 p = gl_FragCoord.xy / uTexSize;" + // この値でそのままアクセス可
"  vec4 t = texture2D(uTex, p);" +
"  vec2 pos = t.xy;" +
"  vec2 velocity = t.zw;" +
// 更新処理
"  vec2 v = normalize(uMouse - pos) * 0.2;" +
"  vec2 w = normalize(velocity + v);" + // 大きさは常に1で
"  vec4 destColor = vec4(pos + w * SPEED * uAccell, w);" +
// マウスが押されてなければ摩擦で減衰させる感じで
"  if(!uMouseFlag){ destColor.zw = velocity; }" +
"  gl_FragColor = destColor;" +
"}";

let pointVert =
"precision mediump float;" +
"attribute float aIndex;" + // unique attribute.
"uniform sampler2D uTex;" + // テスト
"uniform vec2 uResolution;" + // 解像度
"uniform float uTexSize;" + // テクスチャフェッチ用(intの方がいいかも)
"uniform float uPointScale;" + // velocityをセットするようです
"void main() {" +
// uTexSize * uTexSize個の点を配置
// 0.5を足しているのはきちんとマス目にアクセスするためです
"  float x = (mod(aIndex, uTexSize) + 0.5) / uTexSize;" +
"  float y = (floor(aIndex / uTexSize) + 0.5) / uTexSize;" +
"  vec4 t = texture2D(uTex, vec2(x, y));" +
"  vec2 p = t.xy;" +
"  p *= vec2(min(uResolution.x, uResolution.y)) / uResolution;" +
"  gl_Position = vec4(p, 0.0, 1.0);" +
"  gl_PointSize = 0.1 + uPointScale;" + // 動いてるときだけ大きく
"}";

let pointFrag =
"precision mediump float;" +
"uniform vec4 uAmbient;" + // パーティクルの色
"void main(){" +
"  gl_FragColor = uAmbient;" +
"}";

// --------------------------------------------------------------- //
// setup.

function setup() {
  _gl = createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  gl = _gl.GL; // レンダリングコンテキストの取得

  // 浮動小数点数テクスチャが利用可能かどうかチェック（可能）
  textureFloatCheck();

  // 点描画用のインデックスを格納する配列
  let indices = [];
  // 0～TEX_SIZE*TEX_SIZE-1のindexを放り込む
  for(let i = 0; i < TEX_SIZE * TEX_SIZE; i++){
    indices.push(i);
  }
  // 板ポリの頂点用。これは位置設定、位置更新、背景のすべてで使う
  const positions = [
    -1.0,  1.0,  0.0,
    -1.0, -1.0,  0.0,
     1.0,  1.0,  0.0,
     1.0, -1.0,  0.0
  ];

  // nodeを用意
  _node = new RenderSystemSet();

  // シェーダー1:点の位置と速度の初期設定用
  let dataShader = createShader(dataVert, dataFrag);
  _node.registProgram('data', dataShader);
  _node.use('data', 'plane');
  _node.registAttribute('aPosition', positions, 3);

  // シェーダー2:背景用
  let bgShader = createShader(bgVert, bgFrag);
  _node.registProgram('bg', bgShader);
  _node.use('bg', 'plane');
  _node.registAttribute('aPosition', positions, 3);
  _node.registUniformLocation('uTex');

  // シェーダー3:点の位置と速度の更新用
  let moveShader = createShader(moveVert, moveFrag);
  _node.registProgram('move', moveShader);
  _node.use('move', 'plane');
  _node.registAttribute('aPosition', positions, 3);
  _node.registUniformLocation('uTex');

  // シェーダー4:点描画用
  let pointShader = createShader(pointVert, pointFrag);
  _node.registProgram('point', pointShader);
  _node.use('point', 'points');
  _node.registAttribute('aIndex', indices, 1);
  _node.registUniformLocation('uTex');

  fb = create_framebuffer(TEX_SIZE, TEX_SIZE, gl.FLOAT);
  fb2 = create_framebuffer(TEX_SIZE, TEX_SIZE, gl.FLOAT);
  flip = fb;

  // デフォルト書き込み
  defaultRendering();

  // 背景の用意
  prepareBackground();
  bgTex = new p5.Texture(_gl, bg);

  noStroke();
}

// --------------------------------------------------------------- //
// main loop.

function draw(){
  const start = performance.now();

  // マウスの値を調整して全画面に合わせる
  const _size = min(width, height);
  const mouse_x = (mouseX / width - 0.5) * 2.0 * width / _size;
  const mouse_y = -(mouseY / height - 0.5) *2.0 * height / _size;
  const mouse_flag = mouseIsPressed;

  // ここで位置と速度を更新
  moveRendering(mouse_x, mouse_y, mouse_flag);

  // 背景を描画
  _node.use('bg', 'plane');
  _node.setAttribute();
  _node.setTexture('uTex', bgTex.glTex, 0);
  _node.setUniform("uResolution", [width, height]);
  // ドローコール
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  _node.clear(); // おわったらclear

  // blendの有効化
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  // 点描画
  _node.use('point', 'points');
  _node.setAttribute();
  _node.setTexture('uTex', fb2.t, 0);
  const ambient = HSBA_to_RGBA((properFrameCount % 360)/3.6, 100, 80);
  _node.setUniform("uTexSize", TEX_SIZE)
       .setUniform("uPointScale", accell)
       .setUniform("uAmbient", ambient)
       .setUniform("uResolution", [width, height]);
  // ドローコール
  gl.drawArrays(gl.POINTS, 0, TEX_SIZE * TEX_SIZE);
  gl.flush(); // すべての描画が終わったら実行
  _node.clear(); // clearも忘れずに

  gl.disable(gl.BLEND); // blendを消しておく

  // swap.
  flip = fb;
  fb = fb2;
  fb2 = flip;

  // step.
  properFrameCount++;

  // 加速度調整
  if(mouse_flag){ accell = 1.0; }else{ accell *= 0.95; }

  const end = performance.now();
  const performanceRatio = (end - start) * 60 / 1000;
  bg.image(base, 0, 0);
  bg.text(performanceRatio.toFixed(3), 20, 20);
  bgTex.update(); // update.
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
// offscreen rendering.

// オフスクリーンレンダリングで初期位置を設定
function defaultRendering(){
  // フレームバッファをbind
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb.f);
  // ビューポートをサイズに合わせて設定
  gl.viewport(0, 0, TEX_SIZE, TEX_SIZE);

  clear(); // このclearはオフスクリーンに対して適用される

  _node.use('data', 'plane');
  _node.setAttribute();
  _node.setUniform('uTexSize', TEX_SIZE);
  // ドローコール
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  _node.clear(); // 終わったらclear

  gl.viewport(0, 0, width, height); // 戻しておかないといけない
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// オフスクリーンレンダリングで位置更新
function moveRendering(mx, my, mFlag){
  // fbの内容をfb2が受け取って更新した結果を焼き付ける
  // draw内で最後にfbとfb2をswapさせることで逐次更新を実現する
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb2.f);
  gl.viewport(0, 0, TEX_SIZE, TEX_SIZE);

  clear();

  _node.use('move', 'plane');
  _node.setAttribute();
  _node.setTexture('uTex', fb.t, 0);
  _node.setUniform("uTexSize", TEX_SIZE)
       .setUniform("uAccell", accell)
       .setUniform("uMouseFlag", mFlag)
       .setUniform("uMouse", [mx, my]);
  // ドローコール
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  _node.clear(); // 終わったらclear.

  gl.viewport(0, 0, width, height); // 戻しておく
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); // bindしたものは常に解除
}

// --------------------------------------------------------------- //
// prepare background.

// 背景を用意する
// やっぱいろんな処理が競合しちゃうのでもう板ポリ芸で設定するしか
// ないと思う
function prepareBackground(){
  bg = createGraphics(width, height);
  base = createGraphics(width, height);

  bg.textSize(16);
  bg.textAlign(LEFT, TOP);
  base.background(0);
  base.textAlign(CENTER, CENTER);
  base.textSize(min(width, height)*0.04);
  base.fill(255);
  base.text("This is GPGPU TEST.", width * 0.5, height * 0.45);
  base.text("Press down the mouse to move", width * 0.5, height * 0.5);
  base.text("Release the mouse to stop", width * 0.5, height * 0.55);
  bg.fill(255);
  bg.image(base, 0, 0);
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

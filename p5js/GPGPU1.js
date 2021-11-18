// p5.jsはもういいです。
// GPGPUをやろう。

// 負の数入りましたね・・さて。これをどうするか、ですね・・・

// おおVAOすごいな・・bindするだけで終わりとかありえへん。

// これできるんならGPGPUまでもうちょいだね・・

// GPGPU挑戦します（1回目）
// 最終的な目標としては4つの点が

// 速度3.0にしたら点が動かなかった軽微のバグで済んだ。OK.

// とりあえず4096個でやってみる。4096 = 64 x 64.

// 8100個でやっても速度全く落ちないの戦慄しかないな・・。
// これ以上は増やしてもあんま見た目変わんないかな。
// インタラクションやってみるか・・h_doxasさんのやつみたいに。
let _gl, gl;

let pShad, dShad, bgShad, moveShad;

let pPrg, dPrg, bgPrg, movePrg;

let vertices = [];

let vVBOList = [];

let position = [
  -1.0,  1.0,  0.0,
  -1.0, -1.0,  0.0,
   1.0,  1.0,  0.0,
   1.0, -1.0,  0.0
];

let planeVBOList = [];
let bgVBOList = [];
let moveVBOList = [];

let fb;
let fb2; // fb2を用意する。
let flip;
// まず最初にfbにvsPとfsPを使って位置と速度を登録。
// 次にfbをmoveに渡して変更してfb2に焼き付ける。
// そしてfb2を使って点描画。
// 最後にfbとfb2をスワップさせる。

let vsP =
"precision mediump float;" +
"attribute float aIndex;" + // unique attribute.
"uniform sampler2D uTex;" + // テスト
"uniform float uTexSize;" + // テクスチャフェッチ用(intの方がいいかも)
"varying vec2 vIndex;" +
"void main() {" +
// uTexSize * uTexSize個の点を配置
// 0.5を足しているのはきちんとマス目にアクセスするためです
"  float x = (mod(aIndex, uTexSize) + 0.5) / uTexSize;" +
"  float y = (floor(aIndex / uTexSize) + 0.5) / uTexSize;" +
"  vIndex = vec2(x, y);" +
"  vec4 t = texture2D(uTex, vec2(x, y));" + //VTFは可能。
"  vec2 p = t.xy;" +
"  gl_Position = vec4(p, 0.0, 1.0);" +
"  gl_PointSize = 4.0;" +
"}";

let fsP =
"precision mediump float;" +
"varying vec2 vIndex;" +
"void main(){" +
"  vec2 p = gl_PointCoord.xy;" +
"  if(length(p - vec2(0.5)) > 0.5){ discard; }" + // 丸くなる感じで
// 工夫によっては矢印や星形にもできる
// vsPから速度を受け取ってその方向に向かう矢印にしても面白そう
"  gl_FragColor = vec4(1.0, vIndex.x, vIndex.y, 1.0);" +
"}";

// 初期設定用シェーダ（もはやシェーディング関係ないな）
let vsD=
"precision mediump float;" +
"attribute vec3 aPosition;" + // unique attribute.
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

// 色決めてるところで位置決めてるんだよ！
let fsD=
"precision mediump float;" +
"uniform float uTexSize;" +
"const float TAU = 6.28318;" +
"void main(){" +
"  vec2 p = gl_FragCoord.xy / uTexSize;" + // 0.0～1.0に正規化
// 初期位置と初期速度を設定
"  vec2 pos = (p - 0.5) * 1.8;" + // 位置
"  float t = TAU * abs(sin(p.x * 312.49 + p.y * 255.78));" + // 速度
"  vec2 velocity = vec2(cos(t), sin(t)) * 0.005;" +
"  gl_FragColor = vec4(pos, velocity);" +
"}";

// 動かす用
// vsはそのままでいい（2x2をfsでフェッチするのにFragCoord使うから）
let vsMove =
"precision mediump float;" +
"attribute vec3 aPosition;" + // unique attribute.
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";
let fsMove =
"precision mediump float;" +
"uniform sampler2D uTex;" +
"uniform float uTexSize;" +
"void main(){" +
"  vec2 p = gl_FragCoord.xy / uTexSize;" + // 2x2なので
"  vec4 _tex = texture2D(uTex, p);" +
"  vec2 pos = _tex.xy;" +
"  vec2 velocity = _tex.zw;" +
// 反射処理
"  if(abs(pos.x + velocity.x) > 1.0){ velocity.x *= -1.0; }" +
"  if(abs(pos.y + velocity.y) > 1.0){ velocity.y *= -1.0; }" +
"  pos += velocity;" +
"  gl_FragColor = vec4(pos, velocity);" +
"}";

// 背景設定用シェーダ
let vsBG=
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

let fsBG=
"precision mediump float;" +
"uniform sampler2D uBG;" +
"uniform vec2 uResolution;" +
"void main(){" +
"  vec2 p = gl_FragCoord.xy / uResolution.xy;" +
"  p.y = 1.0 - p.y;" +
"  gl_FragColor = texture2D(uBG, p);" +
"}";

let bg, base;

let TEX_SIZE = 90;

let myVAO; // VAOを使うためのオブジェクト
// 使い方としてはまずvboのかたまりごとにvaoを
// createVertexArrayOES()で生成して
// それをbindVertexArrayOESでbindしている間に行われる
// set_attributeやIBOのbindが
// 情報として登録されるみたい
// 登録が終わったらbind nullで解除
// 実際の使い方としては
// 登録した分については
// bindVertexArrayOES(VAO Object)をやるだけで
// 全部実行される
// 切り替えすると勝手にnullされるよと
// そういうことらしいですね
// つまり登録した分がすべて実行されるということのようです
// （新規は勝手に追加されて次回のbind時に勝手に実行される？？）
// 便利だな～

// まあ今のところ・・IBO前提って感じだし。いいか。
// ちなみに
// p5.jsの場合これらの処理は_drawBuffersに隠蔽されてて
// 干渉できないようになっていますね・・。

function setup() {
  _gl = createCanvas(640, 640, WEBGL);
  pixelDensity(1);
  gl = _gl.GL;

  // VAOを有効化して操作のためのオブジェクトを取得
  myVAO = gl.getExtension('OES_vertex_array_object');
  if(myVAO == null){
    alert('vertex array object not supported');
    return;
  }
  // 今回はテストのみ（使えますが）で使いません。

  // 0～TEX_SIZE*TEX_SIZE-1のindexを放り込む
  for(let i = 0; i < TEX_SIZE * TEX_SIZE; i++){
    vertices.push(i);
  }

  // 浮動小数点数テクスチャが利用可能かどうかチェック
  textureFloatCheck();

  pShad = createShader(vsP, fsP);
  shader(pShad);
  pPrg = pShad._glProgram; // お、エラー出ませんね。

  // attributeとuniformに関する処理
  pPrg.aIndexLocation = gl.getAttribLocation(pPrg, 'aIndex');
  pPrg.aIndexStride = 1;
  pPrg.uTexLocation = gl.getUniformLocation(pPrg, 'uTex');

  dShad = createShader(vsD, fsD);
  shader(dShad);
  dPrg = dShad._glProgram; // お、エラー出ないですね？？？

  // attributeとuniformに関する処理
  dPrg.aPositionLocation = gl.getAttribLocation(dPrg, 'aPosition');
  dPrg.aPositionStride = 3;

  bgShad = createShader(vsBG, fsBG);
  shader(bgShad);
  bgPrg = bgShad._glProgram;

  bgPrg.aPositionLocation = gl.getAttribLocation(bgPrg, 'aPosition');
  bgPrg.aPositionStride = 3;

  moveShad = createShader(vsMove, fsMove);
  shader(moveShad);
  movePrg = moveShad._glProgram;

  movePrg.aPositionLocation = gl.getAttribLocation(movePrg, 'aPosition');
  movePrg.aPositionStride = 3;
  movePrg.uTexLocation = gl.getUniformLocation(movePrg, 'uTex');

  let vIndex = create_vbo(vertices);
  vVBOList = [vIndex];

  let vPlane = create_vbo(position);
  planeVBOList = [vPlane];

  let bgPlane = create_vbo(position);
  bgVBOList = [bgPlane];

  let movePlane = create_vbo(position);
  moveVBOList = [movePlane];

  fb = create_framebuffer(TEX_SIZE, TEX_SIZE, gl.FLOAT);
  fb2 = create_framebuffer(TEX_SIZE, TEX_SIZE, gl.FLOAT);
  flip = fb;

  // デフォルト書き込み
  defaultRendering();

  // 背景の用意
  prepareBackground();

  noStroke();
}

function draw(){
  const start = performance.now();

  moveRendering();

  resetShader();

  // もう原因わかんないからシェーダで背景作ることにした（力技）

  bgShad.useProgram();
  set_attribute(bgVBOList, [bgPrg.aPositionLocation], [bgPrg.aPositionStride]);
  bgShad.setUniform("uBG", bg);
  bgShad.setUniform("uResolution", [width, height]);
  bgShad.bindTextures();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, position.length / 3);

  pShad.useProgram(); // そうね。shaderの関数でいいっぽいわね。んー・・
  // まあなんかあったら原点回帰するか。

  // フレームバッファをテクスチャとしてバインド
  gl.bindTexture(gl.TEXTURE_2D, fb2.t);

  set_attribute(vVBOList, [pPrg.aIndexLocation], [pPrg.aIndexStride]);
  pShad.setUniform("uTexSize", TEX_SIZE);
  gl.uniform1i(pPrg.uTexLocation, 0);

  gl.drawArrays(gl.POINTS, 0, vertices.length);

  gl.bindTexture(gl.TEXTURE2D, null); // なんかあった方がいいのかなと

  // swap.
  flip = fb;
  fb = fb2;
  fb2 = flip;

  const end = performance.now();
  const performanceRatio = (end - start) * 60 / 1000;
  bg.image(base, 0, 0);
  bg.text(performanceRatio.toFixed(3), 20, 20);
}

function textureFloatCheck(){
  let ext;
  ext = gl.getExtension('OES_texture_float') || gl.getExtension('OES_texture_half_float');
  if(ext == null){
    alert('float texture not supported');
    return;
  }
}

function defaultRendering(){
  // ビューポートを設定
  // ビューポートはオフスクリーンレンダリングでは必須っぽいので、
  // これは避けて通れなさそうですね・・
  // というか
  // サイズの違う別のフレームにレンダリングする際に
  // それが必要ということなのでしょう。
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb.f);
  gl.viewport(0, 0, TEX_SIZE, TEX_SIZE);

  clear(); // これもclearで代用できる・・？まあやってること同じだし・・

  dShad.useProgram(); // これでいいみたいですけど。

  set_attribute(planeVBOList, [dPrg.aPositionLocation], [dPrg.aPositionStride]);
  dShad.setUniform("uTexSize", TEX_SIZE);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, position.length / 3);

  gl.viewport(0, 0, width, height); // これは戻しておいた方がいいっぽい。
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function moveRendering(){
  // fbの内容をfb2で受け取って操作して焼き付ける
  // drawループの最後にfbとfb2をスワップさせる
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb2.f);
  gl.viewport(0, 0, TEX_SIZE, TEX_SIZE);

  clear();

  moveShad.useProgram();

  set_attribute(moveVBOList, [movePrg.aPositionLocation], [movePrg.aPositionStride]);
  gl.bindTexture(gl.TEXTURE_2D, fb.t);
  gl.uniform1i(movePrg.uTexLocation, 0);
  moveShad.setUniform("uTexSize", TEX_SIZE);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, position.length / 3);

  gl.viewport(0, 0, width, height); // これは戻しておいた方がいいっぽい。
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function prepareBackground(){
  bg = createGraphics(width, height);
  base = createGraphics(width, height);

  bg.textSize(16);
  bg.textAlign(LEFT, TOP);
  base.background(0);
  base.textAlign(CENTER, CENTER);
  base.textSize(64);
  base.fill(255);
  base.text("GPGPU TEST", width * 0.5, height * 0.5);
  bg.fill(255);
  bg.image(base, 0, 0);
}

// VBOを生成する関数
function create_vbo(data){
  // バッファオブジェクトの生成
  let vbo = gl.createBuffer();

  // バッファをバインドする
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  // バッファにデータをセット
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

  // バッファのバインドを無効化
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // 生成した VBO を返して終了
  return vbo;
}

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

// VBOをバインドし登録する関数
function set_attribute(vbo, attL, attS){
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

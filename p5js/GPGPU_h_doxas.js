// p5.jsはもういいです。
// GPGPUをやろう。

// 負の数入りましたね・・さて。これをどうするか、ですね・・・

// おおVAOすごいな・・bindするだけで終わりとかありえへん。

// これできるんならGPGPUまでもうちょいだね・・

// GPGPU挑戦します（2回目）→https://wgld.org/d/webgl/w083.html
// h_doxasさんのサンプルをそのままコピペする流れでいく

// gl.disable(gl.BLEND)～gl.enable(gl.BLEND)の部分は必須のようです
// 多分blendが有効だと書き込みの際に不具合が生じるのでしょう
// 書き込みの際にdisable・・まあblendを中で使う場合だけど。
// そういう場合にはちゃんとdisableした方がよさそうね

// uniformはsetUniformで簡単に追加できるので特に問題ないはず
// blend関連ちょっと頑張ろうね
// gl.ONEとかあれはdraw内で宣言しないと消されちゃうようです

// TODO
// velocityとambientの更新処理
// マウスフラグは備え付けのやつでOK
// マウス移動時にイベント発生するやつを用意
// 位置更新シェーダにいろいろuniform追加
// 更新の仕方を準拠させる
// これで完成のはず

// とりあえず完成です
// GPGPUには無限の可能性が秘められているので
// まだスタートラインに立ったばかり
// いろいろ作って慣れていきましょう。
// 3次元でもいけるのかなこれ・・

// 3次元なら位置と速度を別フレームにする必要があると思う
// 座標変換とか
// まあそこら辺はもうやってるし・・物理で位置更新するなら必要だけどね・・
// あれ
// マウスのあれでその、blenderみたいに位置とか回転とかいじる、
// あれを実装していろいろ調整できるようにしたい感じね

// さしあたりやること
// 1:説明用にコードを整理する
// 2:ノイズを実装していろいろ便利にする
// 3:他のバリエーションを考える
// って感じかしらね

let _gl, gl;

let dShad, bgShad, moveShad, pShad;

let dPrg, bgPrg, movePrg, pPrg;

let ambient = []; // 色決め用
let accell = 0; // 加速度
let properFrameCount = 0; // カウントも必要

// 板ポリの頂点用。これは位置設定、位置更新、背景のすべてで使う
let position = [
  -1.0,  1.0,  0.0,
  -1.0, -1.0,  0.0,
   1.0,  1.0,  0.0,
   1.0, -1.0,  0.0
];

// 点描画用. といっても具体的な位置ではなくインデックスだけ
// これをもとにして点描画する感じ
let indices = [];

let dVBOList = [];
let bgVBOList = [];
let moveVBOList = [];
let pVBOList = [];

let fb;
let fb2; // fb2を用意する。
let flip;
// まず最初にfbにvsPとfsPを使って位置と速度を登録。
// 次にfbをmoveに渡して変更してfb2に焼き付ける。
// そしてfb2を使って点描画。
// 最後にfbとfb2をスワップさせる。

// 初期設定用シェーダ（もはやシェーディング関係ないな）
let vsD=
"precision mediump float;" +
"attribute vec3 aPosition;" + // unique attribute.
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

// 色を決めてるところでは位置を決めています。
let fsD=
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
let vsBG=
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

// 画像を読み込んで表示するだけ
let fsBG=
"precision mediump float;" +
"uniform sampler2D uBG;" +
"uniform vec2 uResolution;" +
"void main(){" +
"  vec2 p = gl_FragCoord.xy / uResolution.xy;" +
"  p.y = 1.0 - p.y;" +
"  gl_FragColor = texture2D(uBG, p);" +
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

let vsP =
"precision mediump float;" +
"attribute float aIndex;" + // unique attribute.
"uniform sampler2D uTex;" + // テスト
"uniform float uTexSize;" + // テクスチャフェッチ用(intの方がいいかも)
"uniform float uPointScale;" + // velocityをセットするようです
"void main() {" +
// uTexSize * uTexSize個の点を配置
// 0.5を足しているのはきちんとマス目にアクセスするためです
"  float x = (mod(aIndex, uTexSize) + 0.5) / uTexSize;" +
"  float y = (floor(aIndex / uTexSize) + 0.5) / uTexSize;" +
"  vec4 t = texture2D(uTex, vec2(x, y));" +
"  vec2 p = t.xy;" +
"  gl_Position = vec4(p, 0.0, 1.0);" +
"  gl_PointSize = 0.1 + uPointScale;" + // 動いてるときだけ大きく
"}";

let fsP =
"precision mediump float;" +
"uniform vec4 uAmbient;" + // パーティクルの色
"void main(){" +
"  gl_FragColor = uAmbient;" +
"}";

let bg, base;

let TEX_SIZE = 512; // サンプルが512なので堂々と512で行きます！

function setup() {
  _gl = createCanvas(640, 640, WEBGL);
  pixelDensity(1);
  gl = _gl.GL; // レンダリングコンテキストの取得

  // 0～TEX_SIZE*TEX_SIZE-1のindexを放り込む
  for(let i = 0; i < TEX_SIZE * TEX_SIZE; i++){
    indices.push(i);
  }

  // 浮動小数点数テクスチャが利用可能かどうかチェック（可能）
  textureFloatCheck();

  // シェーダー1:点の位置と速度の初期設定用
  dShad = createShader(vsD, fsD);
  shader(dShad);
  dPrg = dShad._glProgram;
  // attributeとuniformに関する処理
  dPrg.aPositionLocation = gl.getAttribLocation(dPrg, 'aPosition');
  dPrg.aPositionStride = 3;
  // vbo生成
  dVBOList = [create_vbo(position)];

  // シェーダー2:背景用
  bgShad = createShader(vsBG, fsBG);
  shader(bgShad);
  bgPrg = bgShad._glProgram;
  // attributeとuniformに関する処理
  bgPrg.aPositionLocation = gl.getAttribLocation(bgPrg, 'aPosition');
  bgPrg.aPositionStride = 3;
  // vbo生成
  bgVBOList = [create_vbo(position)];

  // シェーダー3:点の位置と速度の更新用
  moveShad = createShader(vsMove, fsMove);
  shader(moveShad);
  movePrg = moveShad._glProgram;
  // attributeとuniformに関する処理
  movePrg.aPositionLocation = gl.getAttribLocation(movePrg, 'aPosition');
  movePrg.aPositionStride = 3;
  movePrg.uTexLocation = gl.getUniformLocation(movePrg, 'uTex');
  // vbo生成
  moveVBOList = [create_vbo(position)];

  // シェーダー4:点描画用
  pShad = createShader(vsP, fsP);
  shader(pShad);
  pPrg = pShad._glProgram; // プログラムを使って直接切り替える
  // attributeとuniformに関する処理
  // uniformはテクスチャ以外はsetUniformで放り込めるので不要
  pPrg.aIndexLocation = gl.getAttribLocation(pPrg, 'aIndex');
  pPrg.aIndexStride = 1;
  pPrg.uTexLocation = gl.getUniformLocation(pPrg, 'uTex');
  // vbo生成
  pVBOList = [create_vbo(indices)];

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

  // ここで位置と速度を更新
  moveRendering();

  // 背景を描画
  resetShader();
  bgShad.useProgram();
  bgShad.setUniform("uBG", bg); // 画像であれば問題ない
  bgShad.bindTextures(); // _drawbuffersを使わないので直接bindする
  // attributeとtexture以外のuniform登録
  set_attribute(bgVBOList, [bgPrg.aPositionLocation], [bgPrg.aPositionStride]);
  bgShad.setUniform("uResolution", [width, height]);
  // ドローコール
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, position.length / 3);

  // 点描画
  pShad.useProgram(); // 基本的にuseProgramで切り替える

  // step.
  properFrameCount++;
  ambient = HSBA_to_RGBA((properFrameCount % 360)/3.6, 100, 80);

  // blendの有効化
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  // フレームバッファをテクスチャとしてバインド
  gl.bindTexture(gl.TEXTURE_2D, fb2.t);
  gl.uniform1i(pPrg.uTexLocation, 0);
  // attributeとtexture以外のuniform登録
  set_attribute(pVBOList, [pPrg.aIndexLocation], [pPrg.aIndexStride]);
  pShad.setUniform("uTexSize", TEX_SIZE);
  pShad.setUniform("uPointScale", accell);
  pShad.setUniform("uAmbient", ambient);
  // ドローコール
  gl.drawArrays(gl.POINTS, 0, indices.length);

  gl.flush(); // これにて描画終了

  // 加速度調整
  if(mouseIsPressed){
    accell = 1.0;
  }else{
    accell *= 0.95;
  }

  gl.bindTexture(gl.TEXTURE2D, null); // なんかあった方がいいのかなと
  gl.disable(gl.BLEND); // blendを消しておく

  // swap.
  flip = fb;
  fb = fb2;
  fb2 = flip;

  const end = performance.now();
  const performanceRatio = (end - start) * 60 / 1000;
  bg.image(base, 0, 0);
  bg.text(performanceRatio.toFixed(3), 20, 20);
}

// texture floatが使えるかどうかチェック
function textureFloatCheck(){
  let ext;
  ext = gl.getExtension('OES_texture_float') || gl.getExtension('OES_texture_half_float');
  if(ext == null){
    alert('float texture not supported');
    return;
  }
}

// オフスクリーンレンダリングで初期位置を設定
function defaultRendering(){
  // フレームバッファをbind
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb.f);
  // ビューポートをサイズに合わせて設定
  gl.viewport(0, 0, TEX_SIZE, TEX_SIZE);

  clear(); // このclearはオフスクリーンに対して適用される

  dShad.useProgram(); // これを使う

  set_attribute(dVBOList, [dPrg.aPositionLocation], [dPrg.aPositionStride]);
  dShad.setUniform("uTexSize", TEX_SIZE);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, position.length / 3);

  gl.viewport(0, 0, width, height); // 戻しておかないといけない
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// オフスクリーンレンダリングで位置更新
function moveRendering(){
  // fbの内容をfb2が受け取って更新した結果を焼き付ける
  // draw内で最後にfbとfb2をswapさせることで逐次更新を実現する
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb2.f);
  gl.viewport(0, 0, TEX_SIZE, TEX_SIZE);

  clear();

  moveShad.useProgram();

  gl.bindTexture(gl.TEXTURE_2D, fb.t);
  gl.uniform1i(movePrg.uTexLocation, 0);
  set_attribute(moveVBOList, [movePrg.aPositionLocation], [movePrg.aPositionStride]);
  moveShad.setUniform("uTexSize", TEX_SIZE);
  moveShad.setUniform("uAccell", accell);
  moveShad.setUniform("uMouseFlag", mouseIsPressed);
  const mx = (mouseX / width - 0.5) * 2.0;
  const my = -(mouseY / height - 0.5) *2.0;
  moveShad.setUniform("uMouse", [mx, my]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, position.length / 3);

  gl.viewport(0, 0, width, height); // 戻しておく
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

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
// vboの生成、framebufferの生成、attribute設定用の関数

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

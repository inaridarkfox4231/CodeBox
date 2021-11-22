// 浮動小数点数テクスチャを使って
// いくつかのvec4型の値をテクスチャに格納して
// そこから値を参照するテストを行う感じ
// さしあたって乱数を64個発生させ
// vec4が16個みたいにしてテクスチャに焼きこんで
// 外部でそれを用いる感じのことをしたいですね
// 板ポリ芸でやってみるか・・

// てかquadでやってるけど
// 点描画でもいいんじゃないの？？
// そこずっと気になってた
// まあでもデータ格納目的っていうのと
// 逐次更新じゃ目的が違うか・・
// あのね
// 頂点のデータを使ってデータを格納する場合
// quadだと4回しか頂点呼ばれないからデータもこっちで用意したものは
// 4つしか使えなくてあとは補間になっちゃうのよ
// だから独自データで埋め尽くしたいなら
// 点描画でやった方がいいと思う
// ただ
// 前例がないので
// 困難を極めるでしょう・・・・

// 1x16でvec4でいく

// 第一段階突破
// 次はテクスチャが実際に書き込まれているか、
// またそれを利用できるかどうか。
// 通常の配列と違って中身を見ることができないので、
// 結果で確かめるしかないのがつらいところ。
// 同時にチェックするしかない。

// 第二段階突破・・・・
// いよいよ利用。んー。だめでした～

// 点描画でもピクセルに色がつくなら
// 同じ原理でいけるはずなんだけどね
// んん－－。。

// 本来の板ポリ描画でやったらできました・・・・
// きつい・・・・・
// きつね・・・・うどん・・・

// ポイント1:描画にはuseProgram()含む本来の処理が必要
// p5のメソッドで使えるのはせいぜいsetUniformくらいだけど
// これももう本来の処理でやった方がよさそうね・・だってもうそこ以外
// 全部本来のwebglだもんよ
// もっとも2DCanvasとの共存は普通にできるわけですが。

// ポイント2:float textureの生成
// indexからグリッドの中心の座標を生成してそこを指定
// おそらく2x4とかの場合でも中心を指定すればいいと思われる
// そのうえでデータをバリイングとして渡せば
// それを直接出力することで格納される感じですね。
// なおgl_PointSizeは1で指定する必要があります。POINTSでOKです。

// 今、2x2に赤、緑、青、グレーをこの順で格納しました。
// アクセスするには横に進んで
// (0.25,0.25),(0.75,0.25),(0.25,0.75),(0.75,0.75).
// この順に赤、緑、青、グレーですね。
// ごめんなさい勘違いしてました。横に進むから先に(0.75,0.25)ですね
// ばかもう！

// できたかな・・・4つでやってみる？その前に色分けやって。ください。
// 逐次更新・・とかもできるのよね・・すごいわぁ・・。

// 4x8でやる？？
// 目標の32x32でできました。ノイズ・・
// あとは実装するだけ。
// 内部でやってることは足し算と掛け算で置き換えられる
// perlinについては4095と&取ることができないけど
// 4096でmod取るのとおなじだから問題ないし
// それを加工して（4で割った余りと0～1023→32x32のどこか）って
// やればfloatの値を特定できる。それによりノイズを構成できる。
// いけます。いけます・・・。
// 作れてしまう・・・

// てか2べきである必要ないのか。柔軟性高いな。
// fsで参照すれば簡易ランダムとしても使えるし、ノイズにも使える
// vsで参照すればインデックスによらない、ユーザー定義の位置決めができる。
// どっちで参照するにしても無限の可能性。やばすぎる。やばい。

// ・・・できましたね・・
// おかしいね
// んー？
// できたらしい。
// これでp5NoiseをGLSLで使えるようになったみたいですね
// ほんまか・・？
// シンプレックスに比べると滑らかさが劣るけどまあいいやね
// あのあれ
// 最後のループに行く処理で
// どうもあれ2倍して整数部分と小数部分を取ってるっぽいなって思ったので
// 「そういうふうに」書き直したらギザギザが消えました
// なぜ・・・・？？？？
// できちゃったものは仕方ない
// めでたしめでたし～

let _gl, gl;

//const TEX_SIZE = 2; // 2x2でテスト
// 4x2でやってみる
const DATASIZE_X = 32;
const DATASIZE_Y = 32; // 2べきである必要はないみたいです
// あとこれはデータ格納の練習で
// 任意のデータを格納したいときに重宝するでしょう
// 以上！

// ノイズ作りましょう。
// でき・・・た？？？

let sh;

let vs=
"precision mediump float;" +
"attribute vec3 aPosition;" +
"void main(){" +
"  gl_Position = vec4(aPosition, 1.0);" +
"}";

let fs=
"precision mediump float;" +
"uniform sampler2D uTex;" +
"uniform vec2 uTexSize;" +
"uniform vec2 uResolution;" +
"uniform float uCount;" +
"float TAU = 6.28318;" +
"float PI = 3.14159;" +
// getRGB(HSBtoRGB)
"vec3 getRGB(float h, float s, float b){" +
"    vec3 c = vec3(h, s, b);" +
"    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);" +
"    rgb = rgb * rgb * (3.0 - 2.0 * rgb);" +
"    return c.z * mix(vec3(1.0), rgb, c.y);" +
"}" +
// 乱数テーブルから乱数を取得する。まず4096でmodを取り、次に4で割った
// 余りを保存しておいてそれを引いて4で割る、その結果を32x32に落として
// 該当するベクトルをテクスチャ関数で取り出し、先ほど用意した0,1,2,3
// に従ってどれかの成分を返す感じですね。
"float getPerlin(float n){" +
"  n = mod(n, 4096.0);" +
"  float picker = mod(n, 4.0);" +
"  n = floor((n - picker)/4.0);" +
"  float x = (mod(n, 32.0) + 0.5) / 32.0;" +
"  float y = (floor(n / 32.0) + 0.5) / 32.0;" +
"  vec4 t = texture2D(uTex, vec2(x, y));" +
"  if(picker == 0.0){ return t.x; }" +
"  if(picker == 1.0){ return t.y; }" +
"  if(picker == 2.0){ return t.z; }" +
"  return t.w;" +
"}" +
// スムーサー。p5.Noiseはこれ使ってるけどここいじればバリエーション
// いろいろできそう。0と1で滑らかにつながる形。
"float scaledCosine(float x){ return 0.5 * (1.0 - cos(PI * x)); }" +
// ノイズ
"float noise(float x, float y, float z){" +
"  x=abs(x);y=abs(y);z=abs(z);" +
"  float xi,yi,zi,xf,yf,zf;" +
//"  float xi=floor(x); float yi=floor(y); float zi=floor(z);" +
//"  float xf=fract(x); float yf=fract(y); float zf=fract(z);" +
"  float rxf; float ryf; float of;" +
"  float result = 0.0;" +
"  float ampl = 0.5;" +
"  float n1; float n2; float n3;" +
"  float ampFallOff = 0.5;" +
"  for(int i=0; i<4; i++){" +
"    xi=floor(x); yi=floor(y); zi=floor(z);" +
"    xf=fract(x); yf=fract(y); zf=fract(z);" +
"    of = xi + yi * 16.0 + zi * 256.0;" +
"    rxf = scaledCosine(xf);" +
"    ryf = scaledCosine(yf);" +

"    n1 = getPerlin(of);" +
"    n1 += rxf * (getPerlin(of + 1.0) - n1);" +
"    n2 = getPerlin(of + 16.0);" +
"    n2 += rxf * (getPerlin(of + 16.0 + 1.0) - n2);" +
"    n1 += ryf * (n2 - n1);" +

"    of += 256.0;" +

"    n2 = getPerlin(of);" +
"    n2 += rxf * (getPerlin(of + 1.0) - n2);" +
"    n3 = getPerlin(of + 16.0);" +
"    n3 += rxf * (getPerlin(of + 16.0 + 1.0) - n3);" +
"    n2 += ryf * (n3 - n2);" +

"    n1 += scaledCosine(zf) * (n2 - n1);" +
"    result += n1 * ampl;" +
"    ampl *= ampFallOff;" +
//    xi *= 2.0; yi *= 2.0; zi *= 2.0;" +
//"    xf *= 2.0; yf *= 2.0; zf *= 2.0;" +
//"    if(xf >= 2.0){ xf -= 1.0; xi += 1.0; }" +
//"    if(yf >= 2.0){ yf -= 1.0; yi += 1.0; }" +
//"    if(zf >= 2.0){ zf -= 1.0; zi += 1.0; }" +
"    x *= 2.0; y *= 2.0; z *= 2.0;" +
"  }" +
"  return result;" +
"}" +
"void main(){" +
"  vec2 p = gl_FragCoord.xy / uResolution.xy;" +
//"  p = floor(p * 2.0) / 2.0 + 0.25;" +
//"  p.x = (floor(p.x * uTexSize.x) + 0.5) / uTexSize.x;" +
//"  p.y = 1.0 - p.y;" + // 上下反転させるのです・・・
//"  p.y = (floor(p.y * uTexSize.y) + 0.5) / uTexSize.y;" +
// GLSLはy軸が上方向なのでひっくり返す必要がある(テクスチャ内は下方向)
// うまくいきました。お疲れさまでした。
//"  vec4 _tex = texture2D(uTex, p);" +
//"  p = floor(p * 32.0) / 32.0;" +
"  vec3 col = vec3(0.0);" +
"  float n = noise(p.x, uCount/60.0, 2.0);" +
"  if(n>p.y){ col = vec3(0.0, p.y, 1.0); }else{ col = vec3(p.y); }" +
"  p *= 8.0;" +
"  n = noise(p.x, p.y, uCount/60.0);" +
"  col = vec3(floor(n*8.0)/8.0);" +
"  gl_FragColor = vec4(col, 1.0);" +
"}";

let dataSh;  // データ用シェーダ

let datavs =
"precision mediump float;" +
"attribute float aIndex;" +
"attribute vec4 aData;" +
"uniform vec2 uTexSize;" +
"varying vec4 vData;" +
"void main(){" +
"  vData = aData;" +
"  vec2 p;" +
"  p.x = mod(aIndex, uTexSize.x);" +
"  p.y = floor(aIndex / uTexSize.x);" +
"  p += 0.5;" +
"  p /= uTexSize;" +
"  p = p*2.0-1.0;" +
"  gl_Position = vec4(p, 0.0, 1.0);" + // 各々のpはピクセルの中心
"  gl_PointSize = 1.0;" +
"}";

// おそらくこれでいいはず
let datafs =
"precision mediump float;" +
"varying vec4 vData;" +
"void main(){" +
"  gl_FragColor = vData;" +
"}";

let dataPrg; // データ用プログラム
let dataLocList = [];
let dataStrideList = [];
let dataVBOList = [];

let shPrg;
let shLocList = [];
let shStrideList = [];
let shVBOList = [];

let dataFB;  // データ用フレームバッファ

let position = [
  -1.0,  1.0,  0.0,
  -1.0, -1.0,  0.0,
   1.0,  1.0,  0.0,
   1.0, -1.0,  0.0
];

function setup() {
  _gl = createCanvas(640, 640, WEBGL);
  gl = _gl.GL;
  pixelDensity(1);

  sh = createShader(vs, fs);
  shader(sh);
  shPrg = sh._glProgram;

  shVBOList = [create_vbo(position)];
  shLocList = [gl.getAttribLocation(shPrg, 'aPosition')];
  shStrideList = [3];
  shPrg.uTexLocation = gl.getUniformLocation(shPrg, 'uTex');

  // 浮動小数点数テクスチャが利用可能かどうかチェック
  textureFloatCheck();

  dataSh = createShader(datavs, datafs);
  shader(dataSh);
  dataPrg = dataSh._glProgram;

  // attributeとuniformに関する処理
  dataLocList = [gl.getAttribLocation(dataPrg, 'aIndex'), gl.getAttribLocation(dataPrg, 'aData')];
  dataStrideList = [1, 4];
  let IndexArray = [];
  let dataArray = [];

  for(let i = 0; i < DATASIZE_X * DATASIZE_Y; i++){
    IndexArray.push(i);
    dataArray.push(Math.random(), Math.random(), Math.random(), Math.random());
  }

  dataVBOList = [create_vbo(IndexArray), create_vbo(dataArray)];

  dataFB = create_framebuffer(DATASIZE_X, DATASIZE_Y, gl.FLOAT);

  defaultRendering();
}

function draw() {
  clear();
  sh.useProgram();
  gl.bindTexture(gl.TEXTURE_2D, dataFB.t);
  sh.setUniform("uResolution", [width, height]);
  sh.setUniform("uTexSize", [DATASIZE_X, DATASIZE_Y]);
  sh.setUniform("uCount", frameCount);
  gl.uniform1i(sh.uTexLocation, 0);

  // dataFB.tの内容を使う
  set_attribute(shVBOList, shLocList, shStrideList);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, position.length / 3);
  //quad(-1, -1, -1, 1, 1, 1, 1 ,-1);

  gl.bindTexture(gl.TEXTURE_2D, null);

  gl.flush();
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
  gl.bindFramebuffer(gl.FRAMEBUFFER, dataFB.f);
  gl.viewport(0, 0, DATASIZE_X, DATASIZE_Y);

  clear(); // これもclearで代用できる・・？まあやってること同じだし・・

  dataSh.useProgram(); // これでいいみたいですけど。

  // なんかする
  set_attribute(dataVBOList, dataLocList, dataStrideList);
  dataSh.setUniform("uTexSize", [DATASIZE_X, DATASIZE_Y]);
  gl.drawArrays(gl.POINTS, 0, DATASIZE_X * DATASIZE_Y);

  gl.viewport(0, 0, width, height); // これは戻しておいた方がいいっぽい。
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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

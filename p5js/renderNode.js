// ライティングやります
// とりあえず既存のシェーダの解析（Phong Shading）
// あれそのままコピペしたらえらいことになるね・・・

// とりあえずdirectionalとambientだけもってきた
// uNormalMatrixの作り方
// _gl.uNMatrix.inverseTranspose(_gl.uMVMatrix);
// としてからmat3をuniformで放り込む。
// uViewMatrixについて
// _gl._curCamera.cameraMatrix.mat4
// 要するにカメラ行列のデフォルトですね

// directionalLightについては
// directionalLight(...)としてから
// _gl.directionalLightDirectionsと
// _gl.directionalLightDiffuseColorsを放り込めばいい
// どっちも配列なのでそのまま使えるはず

// uMaterialColorは単色塗りつぶしの場合の色
// uUseMaterialColorをtrueにすれば適用される（デフォルトはfalse）

// あとは面情報（インデックスバッファに使う配列）とpositionsから
// 法線を計算する関数を実装して
// aNormalに入れられるようにすれば完成ね
// テストして

// いまやりたいのは板ポリ芸で平面描いてそのうえに
// ラスタライズで立体置くみたいな
// あの星形のやつ改良する感じで

// とりあえず成功したっぽい
// あそこ0.0なの地味に問題だけど
// 要するにspecular前提で考えてるみたいです。
// なるほど・・考えてみるか。

// って思ったけど数修正して間に合わせちゃった。

// こっちをいじっていきます
// GPGPUの方は適切にそぎ落とします

// まずattributeの個数とかindexBufferのlengthみたいのをtopologyに持たせる
// 最終的に_glやglもRenderNodeに持たせて外部からアクセスできないようにする
// 隠蔽するってこと
// で、bgのmanagerを作る。たとえばlayer0,1みたいにして更新の際に
// clearして0おいて1おくみたいな。で、layer番号を指定して
// draw("メソッド名", arguments....);
// で普通に描画できるようにするなど。
// 2Dはそれでいいとしてwebglも、たとえばシェーダ渡すだけで
// メソッドひとつで背景が付くようにするとか。
// めんどくさいのよ・・・単なるグラデであってもシェーダの方が楽なんでね。
// 毎フレーム更新する場合もsetUniformとかできるようにしたらいいね～～

// あとこれは実験なんだけど
// 色でframebuffer作ってそのtextureに2Dのp5.TextureのglTexを当てはめて
// その内容を更新できないかとか考えてる。そこに貼り付けるって意味だけど。
// そうすればgetでピクセルの色取得して・・
// ある点がこっちから見えるかどうか判定できないかな～って。

// globalにしました。
// shaderもそうしたいんですけどね・・

// pointLightやっぱほしいから変えようかな
// pointLightについて手短に
// specular考えないなら色と位置でいいんですけど
// falloffっていうのがあって
// 距離をdとして2次の近似で減衰を考えるとか
// 距離の2乗に逆比例するやつね
// それが1,0,0がデフォルトでこれ放り込まないとやばいやつね
// 係数です
// ベクトルでまとめて放り込めるように修正しましょうね

// 関数の案

// setMatrix: uMVとuPとuViewを登録
// setNormal: 法線を使う場合。法線の行列を登録するだけ。
// setDirectionalLight: directionalLightの情報を登録。
//   初めの3つで0～1の値3つで色、次の3つで方向。光源から対象。
// setPointLight: 最初の3つで色、次の3つで位置。その次の3つは
//   attenuationで、これは指定しない場合1,0,0になるようにする。
// とりあえずこんなもんか。
// setMonoColor: 頂点色を使わず単色にする場合にこれを呼び出す。
//   然るべくフラグがONになり、色が登録される感じですかね。
// 逆に頂点色使わないならまあそんな感じですかね
// あとはテクスチャ・・UVが設定されているならそれを、って感じね。
// 汎用性考えるんだったらそういう選択肢も用意するべきだわね。

// 頂点色がデフォ/場合によっては単色/あるいはテクスチャ
// まあノーマルマテリアルとかでもいいですが・・・

// おわりました～
// ついでにreturn thisいっぱい書いたよ！
// チェーンで書けるのはうれしいね・・

// テクスチャの貼り付け方とかいじれるようにするとか。
// 繰り返しとかそこら辺の設定をいじる感じ。clampでしょデフォルト。
// そういう情報が込められてるからテクスチャなのよね～

// あとあれ、boidsとかノイズとかもこれで書くとか
// まだやることちょこっと残ってるわね
// まあ無駄だけど。無駄・・んー。

// Scaledあるんなら全部デフォでいいんじゃない
// たとえばcubeは1x1x1とか

// 色について
// _RGB()とか_HSV()で指定することにしました
// それでいく

// setVertexColorで頂点色
// setMonoColorで単色
// 色は_RGBもしくは_HSVで指定する感じ
// それでいく

// Uint32Arrayは拡張機能なのでextensionをかまさないとだめなんですね・・
// 今までは内部でやってくれていたので気付かなかったってわけ。
// まあwebgl2なら標準搭載ですが・・。

// テクスチャ
// 汎用性考えたら0～1でやるべき
// 直方体？
// とりあえず平面で。


// 帰ったらよろしくメモ2021/12/15

// 先に背景
// 2Dの背景オブジェクトを渡すと
// 簡単にそれを背景においてくれる（フルサイズで）。
// その内容を更新してからオブジェクトに通知すると勝手に更新
// またレイヤーを追加して
// 描画時にレイヤー1とか2とかやるとそっちに描画するようになり
// 更新の際に0だけおくのではなくて
// 0おいて1おいて2おいて・・ってなってくれる便利！！
// よく考えたら種要らないやね

// webgl版も
// シェーダー渡すと要するに板ポリ芸で
// それを背景においてくれる

// あらかじめシェーダーというか色々用意しておいてそれを使う
// カメラについては
// uMVは直接いじらないです必要がないので
// 「そういう」行列を渡すだけにすればuMVに影響は出ません
// つまりカメラぐるぐるするような場合でも不都合が生じない
// ということ

// あとあれ
// RenderNodeの中で新しい行列使ってるけど
// 一つだけ用意してそこにコピーするようにすればメモリ節約できるよ

// 0番はbg用に予約することになりました（ごめんね）
// bgManager複数の場合を考えてidを付けたいかなって
// 完了しました。

// --------------------------------------------------------------- //
// global.

let _gl, gl;

let _node; // これが統括する。

let properFrameCount = 0; // カウントも必要

let bg; // よっしゃテストだ

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

  textureFloatCheck();
  Uint32ArrayCheck();

  let positions = [-50, 0, 0, 0, 100, 0, 50, 0, 0];
  let colors = [1,0,0,1,0,1,0,1,0,0,1,1];

  // nodeを用意
  _node = new RenderNode();

  let _shader = createShader(myVert, myFrag);
  _node.registRenderSystem('my', _shader);
  _node.use('my', 'triangle')
       .registAttributes({aPosition:{data:positions, stride:3}, aVertexColor:{data:colors, stride:4}});

  _shader = createShader(lightVert, lightFrag);
  _node.registRenderSystem('light', _shader);

  let _pole = pole(20, 160, 24, 6);
  colors = [];
  for(let i = 0; i < Math.floor(_pole.v.length / 3); i++){
    const h = (_pole.v[3*i+2] + 80) / 160;
    colors.push(h, 0.5 + 0.5 * h, 1, 1);
  }
  _node.use('light', 'pole')
       .registAttributes({aPosition:{data:_pole.v, stride:3}, aVertexColor:{data:colors, stride:4}, aNormal:{data:_pole.n, stride:3}})
       .registIndexBuffer(_pole.f);

  let _polygon = polygon(80, 40);
  colors = [0, 0.5, 1, 1];
  for(let i = 1; i < Math.floor(_polygon.v.length / 3); i++){
    colors.push(1, 1, 1, 1);
  }
  _node.use('light', 'polygon')
       .registAttributes({aPosition:{data:_polygon.v, stride:3}, aVertexColor:{data:colors, stride:4}, aNormal:{data:_polygon.n, stride:3}})
       .registIndexBuffer(_polygon.f);

  // typeはUint16ArrayまたはUint32Array
  // それに応じて描画時にgl.UNSIGNED_SHORTまたはgl.UNSIGNED_INTを指定

  positions = [-100,-100,0,100,-100,0,-100,100,0,100,100,0];
  colors = [1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1];
  let normals = [0,0,1,0,0,1,0,0,1,0,0,1];
  _node.use('light', 'plane')
       .registAttributes({aPosition:{data:positions, stride:3}, aVertexColor:{data:colors, stride:4}, aNormal:{data:normals, stride:3}});

  // boxが使えないのでrectangularにする

  let _sphere = spherical(32, 32, 32);
  colors = [];
  for(let i = 0; i < _sphere.v.length; i++){
    const t = (_sphere.v[3*i+2] + 96) / 128;
    colors.push(...[(t-0.5)*2,0.5+t,1,1]);
  }
  _node.use('light', 'sphere')
       .registAttributes({aPosition:{data:_sphere.v, stride:3}, aVertexColor:{data:colors, stride:4}, aNormal:{data:_sphere.n, stride:3}})
       .registIndexBuffer(_sphere.f);

  let _cube = rectangular(32, 48, 16);
  colors = [];
  for(let i = 0; i < Math.floor(_cube.v.length / 3); i++){
    const t = (_cube.v[3*i+2] + 96) / 128;
    colors.push(...[1, t + 0.5, 0.5, 1]);
  }
  _node.use('light', 'cube')
       .registAttributes({aPosition:{data:_cube.v, stride:3}, aVertexColor:{data:colors, stride:4}, aNormal:{data:_cube.n, stride:3}})
       .registIndexBuffer(_cube.f);

  let _data = {};
  _data.func = (s, t) => { return {x:s, y:t, z:(s*s+t*t)/80}; }
  _data.s0 = -80;
  _data.s1 = 80;
  _data.t0 = -80;
  _data.t1 = 80;
  let _surf = parametricSurface(_data, 24, 24);
  colors = [];
  for(let i = 0; i < Math.floor(_surf.v.length / 3); i++){
    const t = (_surf.v[3*i+2] + 96) / 128;
    colors.push(...[0.5+t, 1, (t-0.5)*2, 1]);
  }
  _node.use('light', 'surf1')
       .registAttributes({aPosition:{data:_surf.v, stride:3}, aVertexColor:{data:colors, stride:4}, aNormal:{data:_surf.n, stride:3}})
       .registIndexBuffer(_surf.f);

  // トーラス
  // 内側にすればあんま目立たない
  let _surf2 = donut(80, 20, 60, 20);
  colors = [];
  for(let i = 0; i < Math.floor(_surf2.v.length / 3); i++){
    const t = (_surf2.v[3*i + 2] + 20) / 40;
    colors.push(...[1, t, 0, 1]);
  }
  _node.use('light', 'surf2')
       .registAttributes({aPosition:{data:_surf2.v, stride:3}, aVertexColor:{data:colors, stride:4}, aNormal:{data:_surf2.n, stride:3}})
       .registIndexBuffer(_surf2.f);

  // bgManagerのテスト
  bg = new BackgroundManager();
  bg.draw("background", [128, 128, 255])
    .addLayer()
    .setLayer(1)
    .draw("noStroke")
    .draw("fill", [255]);
}

// --------------------------------------------------------------- //
// main loop.

function draw(){
  //background(0);
  const col = _HSV((properFrameCount%600)/600, 0.5, 1);
  bg.setLayer(0)
    .draw("background", [col.r*255, col.g*255, col.b*255])
    .setLayer(1)
    .draw("clear");
  for(let y = 0; y < 1; y += 0.1){
    const term = 200+200*noise(1, y);
    const prg = (properFrameCount % term)/term;
    bg.draw("circle", [-40+(width+80)*fract(prg+noise(y)), height*y, 30]);
  }
  bg.display();
  const theta120 = properFrameCount*TAU/120;
  const theta240 = properFrameCount*TAU/240;
  const theta360 = properFrameCount*TAU/360;

  _node.use('light', 'plane')
       .setAttribute()
       .setMatrix([{rotY:theta240}])
       .setVertexColor()
       .setDirectionalLight(_RGB(1), 0, 0, -1)
       .setAmbientLight(_RGB(0.25))
       .setPointLight(_RGB(1), 0, 40, 40, 0, 0, 1)
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();

  _node.use('my', 'triangle')
       .setAttribute()
       .setMatrix([{tr:[0,120,0]}])
       .setVertexColor()
       .drawArrays(gl.TRIANGLES); // ドローコール

  _node.setMatrix([{tr:[100,120,0]}])
       .setVertexColor()
       .drawArrays(gl.TRIANGLES); // ドローコール

  _node.setMatrix([{tr:[200,120,0]}])
       .setVertexColor()
       .drawArrays(gl.TRIANGLES) // ドローコール
       .clear();
  // 一応トポロジー切り替えではclearしましょう
  // 切り替え前のトポロジーのデータがclearできなくなるので・・・



  // 同じ環境でライティングするならまとめてやっちゃうのもあり
  _node.useRenderSystem('light')
       .setDirectionalLight(_RGB(1), 0, 0, -1)
       .setAmbientLight(_RGB(0.25));

  _node.useTopology('pole')
       .setAttribute()
       .setMatrix([{tr:[200,-200,0]}, {rotX:theta240}])
       .setVertexColor()
       .bindIndexBuffer()
       .drawElements(gl.TRIANGLES)
       .clear(); // clearも忘れずに

  _node.useTopology('polygon')
       .setAttribute()
       .setMatrix([{tr:[200,0,0]}, {rotY:theta240}, {rotX:theta120}])
       .setVertexColor()
       .bindIndexBuffer()
       .drawElements(gl.TRIANGLES)
       .clear(); // clearも忘れずに

  _node.useTopology('sphere')
       .setAttribute()
       .setMatrix([{tr:[-200+50*cos(theta120),0,50*sin(theta120)]}, {rotY:theta240}, {rotZ:theta360}])
       .setVertexColor()
       .bindIndexBuffer()
       .drawElements(gl.TRIANGLES)
       .clear();

  _node.useTopology('cube')
       .setAttribute()
       .setMatrix([{tr:[-200,160,0]}, {rotY:theta240}, {rotZ:theta360}])
       .setVertexColor()
       .bindIndexBuffer()
       .drawElements(gl.TRIANGLES)
       .clear(); // clearも忘れずに

  _node.use('light', 'surf1')
       .setAttribute()
       .setMatrix([{tr:[0,-160,0]}, {rotY:theta240}, {rotZ:theta360}])
       .setVertexColor()
       .bindIndexBuffer()
       .drawElements(gl.TRIANGLES)
       .clear(); // clearも忘れずに

  _node.use('light', 'surf2')
       .setAttribute()
       .setMatrix([{tr:[-200,-160,0]}, {rotX:theta120}, {rotY:theta240}])
       .setVertexColor()
       .bindIndexBuffer()
       .drawElements(gl.TRIANGLES)
       .flush()
       .clear(); // clearも忘れずに

  // step.
  properFrameCount++;
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
         .registAttribute('aPosition', [-1,1,0,-1,-1,0,1,1,0,1,-1,0], 3)
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
    "  if(tex.a < 0.00001){ discard; }" + // 透明度0でdiscardしないとダメ
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

/*
// ちょっとお蔵入り
  positions = [-50, -50, -50, 50, -50, 20, -50, 50, -20, 50, 50, -50];
  colors = [1,0.5,0,1,1,0.5,0,1,1,1,1,1,1,1,1,1];
  let indices = [0,1,2,2,1,3];
  let normals2 = getNormals(positions, indices);
  _node.use('light', 'square2')
       .registAttributes({aPosition:{data:positions, stride:3}, aVertexColor:{data:colors, stride:4}, aNormal:{data:normals2, stride:3}})
       .registIndexBuffer(indices);
*/
/*
  _node.useTopology('square2')
       .setAttribute()
       .setMatrix([{tr:[200,-200,0]}, {rotX:theta240}, {scale:[2,2,1]}])
       .setVertexColor()
       .bindIndexBuffer()
       .drawElements(gl.TRIANGLES)
       .clear(); // clearも忘れずに
*/
/*
退場。
  positions = [200, 0, 0, 250, 0, 0, 200, 50, 0, 250, 50, 0];
  colors = [0,0.5,1,1,0,0.5,1,1,1,1,1,1,1,1,1,1];
  _node.use('my', 'square')
       .registAttributes({aPosition:{data:positions, stride:3}, aVertexColor:{data:colors, stride:4}});

  _node.use('my', 'square')
       .setAttribute()
       .setMatrix()
       .setVertexColor()
       .drawArrays(gl.TRIANGLE_STRIP)
       .clear();
*/

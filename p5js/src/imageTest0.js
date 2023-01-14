// image関数はカメラをリセットしたうえで
// depthをオフにすべきでは？という話
// なお
// noTexture()は要らないですね
// fill関数の中で_texをnullにしていました
// 考えるなぁー
// しかし
// 頂点色の場合でもこれやらないとリセットされないのはちょっと
// 困るかもしれないな...
// 使わないのにfill(0)とか書く必要があるのは
// ...ねぇ？
// ていうか
// fillの中で_texをnullにしてるのが不自然なのがいけないわけで
// 仕方ないのかも
// それよりさぁ
// imageの挙動がカメラに左右されたりdepthをオフにしてなかったりするの
// おかしいだろ！
// 2Dと合わせるならこの挙動はおかしいだろ

// webglのimageは
// https://github.com/processing/p5.js/issues/2182
// このissueで作られて
// https://github.com/processing/p5.js/pull/3634
// このプルリクで作られました（歴史ありどどーん！）
// 3年以上前ですね

// WEBGLでも欲しいという。2Dではすでにあったわけだ。
// noLights()はその後追加された...eraseについても追加されたはずだけど。記録がない...
// Erase導入時に追加されてました。

// うん。カメラとデプス
// uMVとuPはpushでとりおいてる
// ので
// 問題ありません！！
// 堂々とデフォルトカメラにしてOK
// だから普通にカメラをあれしたうえで
// depthを切る、でいいと思う。いじっても、元に戻るから。
// むしろ同じように適用するのがおかしいんだよ。

// やるべきこととしては...
// まずcamera();
// ついでperspective();
// どうも、これでいいらしい...

// ごめんなさい色々間違えてました
// ていうか
// _curCameraにdefaultEyeX,Y,Zが定義されてない？？？？
// それどころかdefaultFOVとかも定義されてないようです
// え？？？

// あああああ！！！！！
// defaultCameraFOV壊してるの
// copyか！！！
// うぜぇ！
// defaultを移してないですね...
// カメラのコンストラクタであれやってないようです。
// なぜ？？？
// デフォルトに戻せないの不便では？？？
// というわけで
// copy内で_computeCameraDefaultSettingsを呼び出すことで
// 解決！
// で、あっちでは_setDefaultCameraを_curCameraに対して呼べばいい
// のですね
// OK!

// たった5行変えるだけ
// おそらく通るはず
// なぜって
// おそらくtransformをいじること前提で
// WebGLのimage()は使われていないはず
// だから
// です。

// ていうかさ、
// どう考えても2Dと同じ挙動にするべきなのよ
// 通ると思います。
// ていうか
// 意地でも通す！！！！

// 変更点は二か所
// ひとつはcopyの際にdefaultのsetting
// もうひとつは
// image内でdepthのoff-onとdefault設定
// これですね

// しかしこれ実質スプライト？
// いや
// あのさ
// WEBGLのbackgroundがぽんこつだから
// 指定画像使えないから。不便なので。
// imageで代用できないから
// こういうことする必要があるわけですよ。

// remove camera and depth effect on image function
// Temporarily removes the effect of depth when drawing rectangles in the image function, and also sets the camera to its default state.


// えーーーー
// 嫌だ

// というわけで
// setCameraでuMVMatrixにカメラ行列を設定する
// 処理を追加したうえで
// デプスを切れば
// できます
// が
// めんどいわボケ

let gl, gr;
let defaultCam, cam;

function setup() {
  createCanvas(600, 400, WEBGL);
  gl = this._renderer.GL;
  gr = createGraphics(600, 400, WEBGL);
  gr.stroke(255,128,0);
  gr.strokeWeight(8);
  gr.beginShape();
  gr.fill(0);
  gr.vertex(-300,-200);
  gr.vertex(300,-200);
  gr.fill(0,0,255);
  gr.vertex(300,200);
  gr.vertex(-300,200);
  gr.endShape(CLOSE);
  defaultCam = createCamera();
  cam = createCamera();
  cam.camera(400,400,400,0,0,0,0,0,-1);
}

function draw() {
  clear();
  setCamera(defaultCam);
  gl.disable(gl.DEPTH_TEST);
  image(gr, -300, -200, 600, 400, 0, 0, 600, 400);
  gl.enable(gl.DEPTH_TEST);
  setCamera(cam);

  directionalLight(255, 255, 255, 0, 0, -1);
  ambientLight(64);
  ambientMaterial(255);

  noStroke();
  fill(255,200,200);
  plane(800, 600);
  fill(0,128,255);
  const t = frameCount*TAU/240;
  const x = 100*cos(t);
  const y = 100*sin(t);
  translate(x, y, 100);
  sphere(80);
}
/*
let gl, gr;

function setup() {
  createCanvas(600, 400, WEBGL);
  gr = createGraphics(600, 400, WEBGL);
  gr.stroke(255,128,0);
  gr.strokeWeight(8);
  gr.beginShape();
  gr.fill(0);
  gr.vertex(-300,-200);
  gr.vertex(300,-200);
  gr.fill(0,0,255);
  gr.vertex(300,200);
  gr.vertex(-300,200);
  gr.endShape(CLOSE);
  camera(400,400,400,0,0,0,0,0,-1);
}

function draw() {
  clear();
  image(gr, -300, -200, 600, 400, 0, 0, 600, 400);

  directionalLight(255, 255, 255, 0, 0, -1);
  ambientLight(64);
  ambientMaterial(255);

  noStroke();
  fill(255,200,200);
  plane(800, 600);
  fill(0,128,255);
  const t = frameCount*TAU/240;
  const x = 100*cos(t);
  const y = 100*sin(t);
  translate(x, y, 100);
  sphere(80);
}
*/

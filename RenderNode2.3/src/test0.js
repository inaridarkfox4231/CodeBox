// テストコード。とりあえずシェーダー用意してね。

// はぁーどこまでいけるのやら。

// 何から実験しよう。ドローコール？か。とりあえず。

// ------------------------------------------------------------------------------------------------------------ //
// global.

const ex = p5wgex; // alias.
let _node; // RenderNode.

let bg, bgTex; // おいおいクラス化します。

// ------------------------------------------------------------------------------------------------------------ //
// shader.

// copy. 2D背景付けたい場合にどうぞ。
// 内容的には板ポリ使って画面全体を覆う感じ。
const copyVert =
"precision mediump float;" +
"attribute vec2 aPosition;" +
"varying vec2 vUv;" +
"void main () {" +
"  vUv = aPosition * 0.5 + 0.5;" +
"  vUv.y = 1.0 - vUv.y;" +
"  gl_Position = vec4(aPosition, 0.0, 1.0);" +
"}";

const copyFrag =
"precision mediump float;" +
"precision mediump sampler2D;" +
"varying vec2 vUv;" +
"uniform sampler2D uTex;" +
"void main () {" +
"  gl_FragColor = texture2D(uTex, vUv);" +
"}";

// webgl2なのでESSL300で書いてみる。
// 見ての通り、バージョン指定は1行目なら問題ないみたいです。
let copyVertw2 =
`#version 300 es
precision mediump float;

in vec2 aPosition;
out vec2 vUv;

void main(void){
  vUv = aPosition * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// texture関数はtexture2Dとか不要で、textureとだけ書けば勝手に判断してくれるようですね...
let copyFragw2 =
`#version 300 es
precision mediump float;

in vec2 vUv;
uniform sampler2D uTex;
out vec4 fragColor;

void main(void){
  fragColor = texture(uTex, vUv); // なんとtextureでいいらしい...！
}
`;

// ------------------------------------------------------------------------------------------------------------ //
// main code.

function setup(){
  createCanvas(800, 640, WEBGL);
  const _gl = this._renderer; // こうして渡すと変なエラーが出ないことが分かった
  _node = new ex.RenderNode(_gl);

  // さてと...
  let meshData = [] // 汎用エイリアス。

  // 板を登録
  meshData = [{name:"aPosition", size:2, data:[-1,-1,-1,1,1,-1,1,1]}];
  _node.registFigure("board", meshData);

  // 板ポリ芸を登録
  _node.registPainter("copy", copyVertw2, copyFragw2);
  // 以上。準備終わり。ほんまか...ほんまか？？

  // テスト用背景
  bg = createGraphics(width, height);
  bg.noStroke();
  for(let i=0; i<height; i++){
    bg.fill(0, 0, i*255/height);
    bg.rect(0, i, width, 1);
  }
  bg.fill(255);
  bg.textAlign(CENTER, CENTER);
  bg.textSize(min(width,height)*0.05);
  bg.text("welcome to webgl2", width*0.5, height*0.5);
  bgTex = new p5.Texture(_gl, bg);
}

function draw(){
  clear();
  // viewportのデフォルトは左下0,0の右上width,heightなのでそのままでOK.

  // ごくごく普通の板ポリ芸
  _node.usePainter("copy");
  _node.drawFigure("board");
  _node.setTexture2D("uTex", bgTex.glTex);
  _node.drawArrays("triangle_strip");
  _node.unbind();
  _node.flush();
}

// んー...ドローコールの実験とかしないとなぁ...

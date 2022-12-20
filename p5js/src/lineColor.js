/*
strokeColor計画
まず
_defaultImmediateStrokeShaderという変数を新たに用意して
immediateでstrokeやる場合はこれを使うように仕向ける（カスタムでない場合）。
次に
GeometryにおいてlineVertexColors = []を用意して...
prototype.vertexでcurStrokeColorを放り込む！のだ！
そしてそれを_edgesToVerticesでいろいろいじって組みなおすってわけさ
で
immediateの方でRenderBufferを新たに用意するってわけ。flatten忘れずに。
this._flattenは関数だそうです。mapってある通り、これを適用して放り込める形にするのですよ
*/

// 成功しました～ちょろいな。
// 変更点くまなくさらえるように仕込んでおかないと...
// ていうか変更点多すぎるよ困ったなこれ
/*
まずシェーダーを用意する（lineColorVert, lineColorFrag）
次にRendererGL.prototype._getImmediateStrokeShaderにおいて
if (!this._defaultImmediateStrokeShader) {
  this._defaultImmediateStrokeShader = new _main.default.Shader(this, defaultShaders.lineColorVert, defaultShaders.lineColorFrag);
}
return this._defaultImmediateStrokeShader;
//return this._getLineShader();
_getLineShaderをやめて_defaultImmediateStrokeShaderを用いることにする
その関係上
_main.default.RendererGL
ここで
this._defaultImmediateStrokeShader = undefined;
この一行を追加
次に
RendererGL.prototype.vertex
ここにおいて
var lineVertexColor = this.curStrokeColor || [0.5, 0.5, 0.5, 1];
this.immediateMode.geometry.lineVertexColors.push(lineVertexColor[0], lineVertexColor[1], lineVertexColor[2], lineVertexColor[3]);
この2行を追加する
その関係上lineVertexColorsが無いとまずいので、p5.Geometryにおいて
_main.default.Geometry
ここにおいて
this.lineVertexColors = []; // 線の頂点色用
これを追加
_main.default.Geometry.prototype.resetにおいても
this.lineVertexColors.length = 0;
これを追加
Geometry.prototype._edgesToVertices
ここにおいて
lineVertexColorsになんか入っているのであれば
つまりdataのlengthを見るんだけどそれが0でないなら
lineVertexColorsに入れなおす処理を行う
と同時に
RenderBufferも用意しないといけないのだ
this.immediateMode = {
ここで
stroke: [
  new _main.default.RenderBuffer(4, 'lineVertexColors', 'lineColorBuffer', 'aVertexColor', this, this._flatten),
これでよいはず。
*/

// あー...だめだ。そうか。immediate...あそこいじるとプリミティブのほうもいじらざるをえなく...そうなるとプリミティブの方も...きっついね。んー。
// 全部一緒でいいんだけど
// じゃあこうしよう、begin～endの場合だけ適用されるようにする。それ以外はいつものやつで。プリミティブも、それで、...
// でもなぁ、p5.Geometryでも同じことしたいってなる、場合は、どうしよう？

// endShapeの最後にimmediateMode.geometryにresetを実行させることで解決しました。というか、
// beginShapeの最初のresetって要らないと思うんだよな。おかしいでしょ。？？
// そういうわけで、できました。これでいいはず。

// beginShapeの方のresetは外しました。
// GeometryでlineColor使いたい気持ちもあるけどな...どうするかね。今は無理ですね。
// retainedの方までいじるのはハードルが高いのでとりあえずimmediateだけでいいです。retainedは...issueでも上げるか。...

// やめよ。とりあえずimmediate限定でいいや。

// 以上です。おつかれ～
// これを実装すると、begin～endShapeであれば、逐次strokeにより
// グラデーション線が実現できます。
// 曲線も、いけますよ～
// 2Dでは不可能な感じなのでいい感じに評価を受ける...といいね...
// 問題は適切な名称をつけられるかどうかっていうところ。

function setup(){
  createCanvas(400, 400, WEBGL);
  noFill();
  strokeWeight(2);

  beginShape();
  stroke(255);
  vertex(-100, 0, 0);
  stroke(0, 0, 255);
  vertex(100, 0, 0);
  endShape();
  console.log("---------------");
  beginShape();
  stroke(0,0,255);
  vertex(-100, 100, 0);
  stroke(255);
  vertex(100, 100, 0);
  endShape();
  console.log("---------------");

  stroke(255,0,0);
  translate(100,0,0);
  fill(255);
  sphere(40);
  translate(-100,0,0);

  beginShape();
  stroke(0,255,255);
  vertex(-100, -100, 0);
  stroke(255,255,0);
  vertex(100, -100, 0);
  endShape();
  console.log("---------------");
}

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
this._defaultStrokeColorShader = undefined;
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

// retainedは諦めよう
// 現状vertexでしか色を格納できない
// 頂点色にしたってimmediateでしか使えないんだからいいんだよな
// カスタムでやりたい人がカスタムでやればいいだけの話

// shaderいじる。vertはそのまま。fragの方、bool uUseLineColor
// this._useLineColorを追加しますね
// これが
// geometryの...難しいね。
// modelに入ってる。のよ。retainedの場合はgeometry.modelってやらないとアクセスできない。
// geometry.model.lineVertexColorsってアクセスしないとダメ。全部そう。
// そんでカスタムの場合も。カスタムの場合はあらかじめ用意しておけばいけるはず。

// どこでmodelにぶち込んでいるのかは不明だが...
// RendererGL.prototype.createBuffers ここですね。ここの戻り値がbuffersで、そのbuffers.modelにいろいろぶちこんでるようです。

// 変更点1: shaderを新しく作るのをやめて元のやつをいじる。vertは新しいやつで置き換える、つまりvColorとaVertexColorを追加する。
// そしてvColor = aVertexColorを実行するだけ。それとは別にfragの方、こっちはuUseLineColorっていうboolを用意して、
// これを2箇所ある_setStrokeUniformsの直前で、あの、RendererGLの方に this._useLineColor = false; で初期化する。_main.default.RendererGL = ここに追加。
// immediateの方はimmediateGeometry.lineVertexColorsがなんか入ってるかどうかで見極めるけど、
// retainedの場合はgeometry.lineVertexColorsを見る。そこらへん。

// 変更点2: RenderBufferにRetainedの方も同じのを追加。使わなくても問題ないし、プリミティブはこれを使えない。カスタム前提。用意すれば、
// _edgesToVerticesでちゃんと整形してくれる。

// 以上。

/*
-----main/src/webgl/shaders-----
step1: lineVert, lineFragを改変する。
       lineVertはattribute vec4 aVertexColorとvarying vec4 vColorを追加してvColorにaVertexColorを代入
       lineFragはvarying vec4 vColorを追加してuniform bool uUseLineColorを追加してこれがtrueかどうかでvColor使うかuMaterialColor使うか選ぶ



-----main/src/webgl/p5.RendererGL.js-----
step2: _main.default.RendererGL = ここに
           this._useLineColor = false;
         を追加。

-----main/src/webgl/p5.RendererGL.js-----
step4: RenderBufferをretainedの方にも追加する。
        this.retainedMode = { ってなってるところ。
        new _main.default.RenderBuffer(4, 'lineVertexColors', 'lineColorBuffer', 'aVertexColor', this, this._flatten), を追加

-----main/src/webgl/p5.RendererGL.js-----
step5: _setStrokeUniformsの中で
        uUseLineColorにthis._useLineColorをセットする。
        strokeShader.setUniform('uUseLineColor', this._useLineColor); // 追加

-----main/src/webgl/p5.RendererGL.js-----
step10: this.immediateMode = {
     ここに
     new _main.default.RenderBuffer(4, 'lineVertexColors', 'lineColorBuffer', 'aVertexColor', this, this._flatten),
     これを追加する



-----main/src/webgl/p5.RendererGL.Immediate.js-----
step3_1: _setStrokeUniformsが2箇所ある、ここの直前でlineVertexColorsが空かどうかにより_useLineColorを決定する。
         決定の仕方はimmediateとretainedで微妙に異なる。

         RendererGL.prototype._drawImmediateStroke =
         immediateの方はこれ：this._useLineColor = (this.immediateMode.geometry.lineVertexColors.length > 0); // 追加

-----main/src/webgl/p5.RendererGL.Immediate.js-----
step6: RendererGL.prototype.vertexにおいて
      var lineVertexColor = this.curStrokeColor || [0.5, 0.5, 0.5, 1];
      this.immediateMode.geometry.lineVertexColors.push(lineVertexColor[0], lineVertexColor[1], lineVertexColor[2], lineVertexColor[3]);
      これを追加



-----main/src/webgl/p5.RendererGL.Retained.js-----
step3_2: RendererGL.prototype.drawBuffers =
         retainedの方はこれ：this._useLineColor = (geometry.model.lineVertexColors.length > 0); // 追加



-----main/src/webgl/p5.Geometry.js-----
step7: lineVertexColorsがないとまずいので
       _main.default.Geometry = のところに
         this.lineVertexColors = []; // 線の頂点色用
       を追加する

-----main/src/webgl/p5.Geometry.js-----
step8: _main.default.Geometry.prototype.resetにおいても
       this.lineVertexColors.length = 0;
       これを追加

-----main/src/webgl/p5.Geometry.js-----
step9: Geometry.prototype._edgesToVertices =
       ここでlineVertexColorsになんか入ってる場合に
       それを用いてlineVertexColorsの中身を整形する処理を追加する
       ついでにe0とe1を用いて整理しましょう



       ここまで終わったらプルリクエストの準備を始める。それと同時にサンプルも作る。
       サンプルはまず頂点ごとにstrokeを呼び出すとグラデーションがつくことがわかりやすいように円弧かなぁ...
       直線のbefore/afterでいいよ。
       あともうひとつジオメトリーでもできることをわかりやすいように表現する、こっちは正方形で。



step--: RendererGL.prototype._getImmediateStrokeShaderにおいては変更点なし

step--: shader直接いじることになったので不要。

step--: reset云々の処理はもう不要ですね。まあ今のままでいいとは思わないけどあっちもこっちも変えるのめんどくさい。

変更は以上です。
ジオメトリーでもテストして。うまくいくかなぁ。
*/

/*
issue概要
現在、immediateModeにおいて頂点に色をつけることができるようになっています。
これはstroke, つまり曲線に関してはそうなっていません。
頂点を呼び出すたびにstrokeを呼び出しても最後に呼び出したstrokeの色だけが採用されるため、
全体が同じ色になってしまいます。
これを、lineVertとlineFragを改造することにより、
頂点呼び出しの際にstrokeで決めた色が反映されるように改造したいと思います。
具体的には、begin～endShapeでvertexで線を引く場合に、vertexの直前に呼び出したstrokeの色がその頂点の色となり、
頂点ごとに違う色が付与されて間については補間される様にします。
また、p5.Geometryを作る際に頂点と同じ順番で0～1で色を指定していくことで、
p5.Geometryで作った線についてもそれが反映されるようにします。
*/

// 頂点色についてはないんですよね...p5.Geometryであれした場合のあれこれ。んー。どうするかね。
// それも作りたいね...いつかね。簡単ですよ、たぶん。とりあえず、線。

// https://github.com/processing/p5.js/issues/5912
// このissueで質問者さんが最後に「strokeの場合は補間されないのですね...」って言ってる
// これに対するanswerの形でプルリクエスト送ったらよさそうです。

// それはそれとして...
// WEBGLのbezierVertexとquadraticVertexもどうでもいいfriendlyErrorだすんですけど...？
// しかもp5.jsの公式レファレンスのサンプルがエラー出すのよ。もうふざけてる。
// しかも
// これあの仕様変更では防げないのよね。あれ_processVerticesからの呼び出しにしか対応できないから。
// どうすんのよ。
// 解決しました
// あのエラー endShape で出してる
// だからあの仕様変更で出なくなりますね
// 一件落着！

// じゃあいいか。

// evenoddの実装ためらうのがばかばかしく思えてくる...もうこの際...全部...
// まあevenoddくらいは実装したいよね。fillMode(EVENODD)的な感じで。

function setup(){
  createCanvas(400, 400, WEBGL);
  noFill();
  strokeWeight(2);

  const _gl = this._renderer;
  const geom = new p5.Geometry();
  geom.vertices = [createVector(-100,-100,0), createVector(100,-100,0)];
  geom.lineVertexColors = [0, 1, 1, 1, 1, 1, 0, 1];
  geom.edges = [[0, 1]];
  geom._edgesToVertices();
  _gl.createBuffers("customLine", geom);

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

  _gl.drawBuffers("customLine"); // 実験成功。
  console.log("---------------");
}

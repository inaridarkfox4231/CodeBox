/* なにもない */
// _gl, glを元にexを生成する。
// _glはcreateShaderしてくれるので使いたいですね
// shaderのところも_gl...割と使ってるなぁ...便利だから仕方ないね。

// RenderNodeのコンセプト
// shaderからRenderSystem作って名前で管理
// vboからTopology作って名前で管理(STATICかDYNAMICか指定)
// んで
// ノード経由で使うRenderSystemを指定
// ノード経由で使うTopologyを指定
// bind各種
// uniformなどなど
// レンダリング
// flush!

// ていうか紐付け要らない？のか？

// その前に卍解やっとこう。ばん！かい！
p5.RendererGL.prototype._initContext = function() {
  try {
    this.drawingContext =
      this.canvas.getContext('webgl2', this._pInst._glAttributes) ||
      this.canvas.getContext('experimental-webgl', this._pInst._glAttributes);
    if (this.drawingContext === null) {
      throw new Error('Error creating webgl context');
    } else {
      var gl = this.drawingContext;
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this._viewport = this.drawingContext.getParameter(
        this.drawingContext.VIEWPORT
      );
    }
  } catch (er) {
    throw er;
  }
};
// これでwebglでやろうとしてたことは大体webgl2になります。よかったね。

// レンダリング関連は相当いじることになりそう...つまり指定の仕方が変わるということ。
// まずシェーダとトポロジーの紐付けは
// 行いません
// 実行時にやってなかったら1回だけやります
// それはシェーダーサイドがトポロジー観たときに「お前初見だな！」ってなった場合に1回だけやります
// それとは別にbufferSubDataを実行できます
// これについてはbufferDataがもう済んでいることが前提ですが...(最低1回は必要)
// 最初だけ。以降はsubでOK.その際引数にFloat32のなんかを取る...まあそんな感じで。
// つまりSTATICとか指定できる、指定はvboもiboも別、というかそうか
// webgl2だからvaoとiboみたいにできる...？

// vaoめっちゃ便利だね～っていうかそうか、便利だね...vboの保持が要らないっていうのは、いいね...
// しかし動的更新との相性が気になるところ。
// あとシェーダーとvaoのマッチングは先にやっとかないとだね...

// vaoは段階的に。まずはvboで諸々実装したうえでvaoにしていく感じで。vaoでも動的更新できるといいねぇ。
// てか選ばせろよ。
// framebufferもおいおい拡張していく感じで。ライブラリ化しないと始まらないので。

// 引数は_glとglになります。
const p5wgex = function(_gl, gl){

  // RGBをRGBのまま返す関数. 指定は自由。
  function _RGB(r, g, b){
    if(arguments.length === 1){
      g = r;
      b = r;
    }
    return {r:r, g:g, b:b};
  }

  // HSVをRGBにしてくれる関数. ただし0～1で指定してね
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

  // 直接配列の形で返したい場合はこちら
  function _HSVArray(h, s, v){
    const obj = _HSV(h, s, v);
    return [obj.r, obj.g, obj.b];
  }

  // colがconfig経由の値の場合、それを正しく解釈できるようにするための関数.
  // 戻り値は0～255指定。なのでお手数ですが255で割ってください。
  function getProperColor(col){
    if(typeof(col) === "object"){
      return {r:col.r, g:col.g, b:col.b};
    }else if(typeof(col) === "string"){
      col = color(col);
      return {r:red(col), g:green(col), b:blue(col)};
    }
    return {r:255, g:255, b:255};
  }

  // createShaderの上書き
  function createShader(vs, fs){
    return _gl.createShader(vs, fs);
  }

  // RenderSystem.
  class RenderSystem{
    constructor(){}
  }

  // Topology.
  class Topology{
    constructor(){}
  }

  // RenderNode.
  class RenderNode{
    constructor(){
      this.renderSystems = {};
      this.topologies = {};
    }
  }

  const ex = {};
  ex.createShader = createShader;

  return ex;
}

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

// modelも扱えるようにするよ...おいおいね...

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

  // loadAttributes.
  function loadAttributes(pg){
    // 属性の総数を取得
    const numAttributes = gl.getProgramParameter(pg, gl.ACTIVE_ATTRIBUTES);
    const attributes = {};
    // 属性を格納していく
    for(let i = 0; i < numAttributes; i++){
      const attr = {};
      const attrInfo = gl.getActiveAttrib(pg, i); // 情報を取得
      const name = attrInfo.name;
      attr.name = name; // 名前
      attr.location = gl.getAttribLocation(pg, name); // bindに使うlocation情報
      attr.type = attrInfo.type; // bindに使うgl.FLOATなどの型情報
      attr.size = attrInfo.size; // bindに使う3,4等のサイズ情報。たとえばfloat4なら32bitFloatが4つで16バイトみたいな。
      attributes[name] = attr; // 登録！
    }
    return attributes;
  }

  // loadUniforms.
  function loadUniforms(pg){
    // ユニフォームの総数を取得
    const numUniforms = gl.getProgramParameter(pg, gl.ACTIVE_UNIFORMS);
    const uniforms = {};
    // ユニフォームを格納していく
    let samplerIndex = 0; // サンプラのインデックスはシェーダー内で0ベースで異なってればOK, を検証してみる。
    for(let i = 0; i < numUniforms; i++){
      const uniform = {};
      const uniformInfo = gl.getActiveUniform(pg, i); // ほぼ一緒ですね
      const name = uniformInfo.name;
      uniform.name = name;
      uniform.location = gl.getUniformLocation(pg, name);
      uniform.type = uniformInfo.type; // gl.FLOATなどの型情報
      if(uniform.type === gl.SAMPLER_2D){
        uniform.samplerIndex = samplerIndex++; // 名前からアクセスして...setTextureで使う
      }
      uniforms[name] = uniform;
    }
    return uniforms;
  }

  // create_vbo.
  function createVBO(info){
    const vbo = gl.createBuffer();
    // bindする. bindされているものだけが有効になる。
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // bufferにデータをセット。DYNAMICの場合でもbufferDataでスペースを確保することが必須。
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(info.data), info.usage);
    // 解除
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
  }

  // vbaもついでに作り方確認しておこうかと

  // ibo作ろう.
  function createIBO(info){
    const ibo = gl.createBuffer();
    // bindする。
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    // データをセットする
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new (info.type)(info.data), info.usage);
    // 解除
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return ibo;
  }

  // fboですね
  // infoオブジェクトで指定
  // name, texId, w, h, textureFormat, filterParam
  // texIdは廃止...ですね。で、w,h,textureFormat,textureFilter,textureWrapの3つを指定できるように
  // デフォルトはまずUNSIGNED_BYTE(時にFLOAT,HALF_FLOAT)
  // filterParamはNEARESTが基本だけど流体とかならLINEARを使うかも
  // wrapはまあCLAMP_TO_EDGEが基本だけど他のを使うこともあるかも？って感じ。
  function createFBO(info){
    // フォーマットチェック
    if(!textureFormat){
      textureFormat = gl.UNSIGNED_BYTE;
    }
    if(!filterParam){
      filterParam = gl.NEAREST;
    }

    // フレームバッファの生成
    let framebuffer = gl.createFramebuffer();

    // フレームバッファをWebGLにバインド
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // 深度バッファ用レンダーバッファの生成とバインド
    let depthRenderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);

    // レンダーバッファを深度バッファとして設定
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);

    // フレームバッファにレンダーバッファを関連付ける
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

    // フレームバッファ用テクスチャの生成
    let fTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + texId);

    // フレームバッファ用のテクスチャをバインド
    gl.bindTexture(gl.TEXTURE_2D, fTexture);

    // フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, textureFormat, null);

    // テクスチャパラメータ
    // このNEARESTのところを可変にする
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterParam);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterParam);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // フレームバッファにテクスチャを関連付ける
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
    // 中身をクリアする(clearに相当する)
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    // 各種オブジェクトのバインドを解除
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // オブジェクトを返して終了
    return {f:framebuffer, d:depthRenderBuffer, t:fTexture, id:texId, name:name, frameWidth:w, frameHeight:h, texelSizeX:1/w, texelSizeY:1/h};
  }

  // Pinselです. 絵筆
  // 命名法に問題が...
  // 本家の方でshaderからattrの情報を取り出すやり方が紹介されてるので使っちゃおう
  // uniformの方も同じようにやろう（後学のために）
  // uniformはindexさえ違ってればいいみたいなので
  // あっちのように番号管理するのを実験的にやめてみるか...うまくいくかわからんけど。
  // uniformに持たせてtextureのactivateで使う。
  // ゆくゆくはキューブマップとかも扱いたいのよ. それでsetTexture2D.
  // このメソッドグローバル化して分離するか...
  class Pinsel{
    constructor(name, _shader){
      this.name = name;
      this.shader = _shader;
      _gl.shader(_shader);
      this.program = _shader._glProgram;
      this.attributes = loadAttributes(this.program); // 属性に関するshader情報
      this.uniforms = loadUniforms(this.program); // ユニフォームに関するshader情報
      this.textureBinded = false;
    }
    setTexture2D(name, _texture){
      const uniform = this.uniforms[name];
      // activateする番号とuniform1iで登録する番号は一致しており、かつsamplerごとに異なる必要があるということ
      gl.activeTexture(gl.TEXTURE0 + uniform.samplerIndex);
      gl.bindTexture(gl.TEXTURE_2D, _texture);
      gl.uniform1i(uniform.location, uniform.samplerIndex);
      this.textureBinded = true;
    }
    getAttributes(){
      return this.attributes;
    }
    getUniforms(){
      return this.uniforms;
    }
    clear(){
      if(!this.textureBinded){ return; }
      // 2Dや3Dのテクスチャがbindされていたら解除(今は2D only.)
      if(gl.getParameter(gl.TEXTURE_BINDING_2D) !== null){
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
      this.textureBinded = false;
    }
  }

  // geometryです. 図形
  class Geometry{
    constructor(name, attrData){
      this.name = name;
      this.vbos = this.createAttrs(attrData); // 名前とvboの組でusageも追加で
    }
    createVBOs(attrData){
      const vbos = {};
      for(let info of attrData){
        const result = {};
        const name = info.name;
        if(info.usage === undefined){ info.usage = gl.STATIC_DRAW; }
        result.name = name;
        result.vbo = createVBO(info);
        result.usage = info.usage;
        vbos[name] = result;
      }
    }
    getVBOs(){
      return this.vbos;
    }
  }

  // iboです. モディファイア（インデックスの取り扱い方を変えるだけ）
  class IndexObj{
    constructor(name, info){
      this.name = name;
      if(info.usage === undefined){ info.usage = gl.STATIC_DRAW; } // これも基本STATICですね...
      if(info.large === undefined){ info.large = false; } // largeでT/F指定しよう. 指定が無ければUint16.
      if(info.large){ info.type = Uint32Array; }else{ info.type = Uint16Array; }
      this.ibo = createIBO(info); // indicesはinfo.dataに入ってる
      this.usage = info.usage;
      this.type = info.type; // Uint16とかUint32とか
    }
  }

  // RenderNode.
  class RenderNode{
    constructor(){
      this.pinsels = {}; // shaderProgramです
      this.geometries = {}; // vboをまとめたもの、あるいはvao
      this.ibos = {}; // iboたちの概念も切り離す。
      this.fbos = {}; // おいおいね
      // doubleと切り離す必要はないと思うよ
      this.currentPinsel = undefined; // そのとき使っているプログラム、というか絵筆
      this.currentGeometry = undefined; // そのとき使っているジオメトリ、というか図形
    }
    registPinsel(name, vs, fs){
      // vsとfsからshaderを作成
      const _shader = _gl.createShader(vs, fs);
      // シェーダーの作成に失敗した場合
      if(!_shader){ console.log("shader is inValid. shaderName:" + name); return this; }
      const newPinsel = new Pinsel(name, _shader);
      // 登録（名前重複の場合は上書き）
      this.pinsels[name] = newPinsel;
      return this;
    }
    registGeometry(name, attrData){
      // attrDataの内容はname,size,dataでいいと思う。
      const newGeometry = new Geometry(name, attrData);
      this.geometries[name] = newGeometry;
      return this;
    }
    registIBO(name, info){
      // typeは65536頂点以上であればUint32Arrayにしないとやばいんだよって. でなければメモリもったいないからこれで。以上。
      const newIBO = new IndexObj(name, info);
      this.ibos[name] = newIBO;
      return this;
    }
    registFBO(){

    }
    registDoubleFBO(){

    }
    setAttributes(){
      const attributes = this.currentPinsel.getAttributes();
      const vbos = this.currentGeometry.getVBOs();
      // どっちかっていうとvbosの方に従うべきかな...
      // 使わないattributeがあってもいいので
      for(let obj of vbos){
        const name = obj.name;
        const attr = attributes[name];
        // vboをbindする
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.vbo);
        // attributeLocationを有効にする
        gl.enableVertexAttribArray(attr.location);
        // attributeLocationを通知し登録する
        gl.vertexAttribPointer(attr.location, attr.size, attr.type, false, 0, 0);
      }
    }
    clear(){
      // 各種bind解除
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_BUFFER, null);
      this.currentPinsel.clear();
    }
    flush(){
      // flush.
      gl.flush();
    }
  }

  // 行列2x2
  class Matrix2x2{
    constructor(){

    }
  }

  // 行列3x3
  class Matrix3x3{
    constructor(){

    }
  }

  // 行列4x4
  class Matrix4x4{
    constructor(){

    }
  }

  const ex = {};
  ex.createShader = createShader;

  return ex;
}

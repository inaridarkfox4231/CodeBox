// やり直し！

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

// ばんかいしたので本題
// これがp5webglのexです、RenderNodeは_glから生成します。
const p5wgex = (function(){

  // ---------------------------------------------------------------------------------------------- //
  // utility.

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

  // ---------------------------------------------------------------------------------------------- //
  // utility for RenderNode.

  // loadAttributes. glを引数として。最初からそうしろよ...って今更。
  function loadAttributes(gl, pg){
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

  // loadUniforms. glを引数に。
  function loadUniforms(gl, pg){
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

  function createVBO(gl, attr){
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attr.data), attr.usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return {
      name:attr.name,
      buf:vbo,
      data:attr.data,
      usage:attr.usage,
    };
  }

  function createVBOs(gl, attrs){
    const vbos = {};
    for(let attr of attrs){
      vbos[attr.name] = createVBO(gl, attr);
    }
    return vbos;
  }

  function validateForIBO(gl, info){
    if(info.usage === undefined){ info.usage = gl.STATIC_DRAW; } // これも基本STATICですね...
    if(info.large === undefined){ info.large = false; } // largeでT/F指定しよう. 指定が無ければUint16.
    if(info.large){
      info.type = Uint32Array; info.drawType = gl.UNSIGNED_INT;
    }else{
      info.type = Uint16Array; info.drawType = gl.UNSIGNED_SHORT;
    }
  }

  function createIBO(gl, info){
    validateForIBO(gl, info);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new (info.type)(info.data), info.usage);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return {
      name: info.name,
      buf: ibo,
      type: info.type,
      data: info.data,
      usage: info.usage,
    };
  }

  function validateForFBO(gl, info){
    // double.
    if(info.double === undefined){ info.double = false; }
    // textureFormat.
    if(info.textureFormat === undefined){ info.textureFormat = gl.UNSIGNED_INT; }
    // textureFilter.
    if(info.textureFilter === undefined){ info.textureFilter = gl.NEAREST; }
    // textureWrap.
    if(info.textureWrap === undefined){ info.textureWrap = gl.CLAMP_TO_EDGE; }
  }

  function createFBO(gl, info){
    validateForFBO(gl, info);

    // framebufferを生成
    let framebuffer = gl.createFramebuffer();

    // bindする。その間対象はこのframebufferとなる。
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // 深度バッファ用レンダーバッファの生成とバインド
    let depthRenderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer);
    // レンダーバッファを深度バッファとして設定
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, info.w, info.h);
    // フレームバッファにレンダーバッファを関連付ける
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderbuffer);

    // 次にtextureを生成する
    let fTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    // フレームバッファ用のテクスチャをバインド
    gl.bindTexture(gl.TEXTURE_2D, fTexture);
    // フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, info.w, info.h, 0, gl.RGBA, info.textureFormat, null);

    // テクスチャパラメータ
    // このNEARESTのところを可変にする
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, info.textureFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, info.textureFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, info.textureWrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, info.textureWrap);
    // フレームバッファにテクスチャを関連付ける
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);

    // 中身をクリアする(clearに相当する)
    gl.viewport(0, 0, info.w, info.h);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    // 各種オブジェクトのバインドを解除
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // オブジェクトを返して終了。
    return {
      f: framebuffer, d: depthRenderbuffer, t: texture,
      name: info.name, w: info.w, h: info.h,
      texelSizeX: 1/info.w, texelSizeY: 1/info.h, double: false,
    }
  }

  function createDoubleFBO(gl, info){
    validateForFBO(gl, info);
    let fbo0 = createFBO(gl, info);
    let fbo1 = createFBO(gl, info);
    return {
      read: {f:fbo0.f, d:fbo0.d, t:fbo0.t},  // f,d,tしか要らないので。
      write: {f:fbo1.f, d:fbo1.d, t:fbo1.t},
      swap: function(){
        let tmp = this.read;
        this.read = this.write;
        this.write = tmp;
      },
      name: info.name, w: info.w, h: info.h,
      texelSizeX: 1/info.w, texelSizeY: 1/info.h, double: true,
    }
  }

  // _glだけ汎用的にしてglが必要なときは適宜取り出す感じで（p5.jsに倣う）

  // ---------------------------------------------------------------------------------------------- //
  // Painter.

  class Painter{
    constructor(_gl, name, _shader){
      this._gl = _gl;
      this.name = name;
      this.shader = _shader;
      _gl.shader(_shader); // これでコンパイルとかやってくれる
      this.program = _shader._glProgram;
      const gl = this._gl.GL;
      this.attributes = loadAttributes(gl, this.program); // 属性に関するshader情報
      this.uniforms = loadUniforms(gl, this.program); // ユニフォームに関するshader情報
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  // Figure.

  class Figure{
    constructor(_gl, name, attrs){
      this._gl = _gl;
      this.name = name;
      const gl = this._gl.GL;
      this.validate(attrs);
      this.vbos = createVBOs(gl, attrs);
    }
    validate(attrs){
      for(let attr of attrs){
        if(attr.usage === undefined){ attr.usage = gl.STATIC_DRAW; }
      }
    }
  }

  // fboとiboはクラス化しない方向で。iboはMAXを取るのがコストなのでlargeかどうか事前に指定しようね。
  // ていうかそれだけだと判断できない場合もあるからね。

  // ---------------------------------------------------------------------------------------------- //
  // RenderNode.

  class RenderNode{
    constructor(_gl){
      this._gl = _gl;
      this.painters = {};
      this.figures = {};
      this.fbos = {};
      this.ibos = {};
      this.currentPainter = undefined;
      this.currentShader = undefined;
      this.currentFigure = undefined;
    }
    registPainter(name, vs, fs){
      const _shader = this._gl.createShader(vs, fs);
      const newPainter = new Painter(this._gl, name, _shader);
      this.painters[name] = newPainter;
      return this;
    }
    registFigure(name, attrs){
      // attrsは配列です。
      const newFigure = new Figure(name, attrs);
      this.figures[name] = newFigure;
      return this;
    }
    registIBO(name, info){
      const newIBO = createIBO(this._gl.GL, info);
      this.ibos[name] = newIBO;
      return this;
    }
    registFBO(name, info){
      const newFBO = createFBO(this._gl.GL, info);
      this.fbos[name] = newFBO;
      return this;
    }
    registDoubleFBO(name, info){
      info.double = true;
      const newFBO = createDoubleFBO(this._gl.GL, info);
      this.fbos[name] = newFBO;
      return this;
    }
  }




  const ex = {};

  return ex;
})();

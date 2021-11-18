// ノイズを実装する企画
// とりあえずよし。おけ！
// setSeed作った！おけ！！

// 4DnoiseChallenge.

// 考えたんだけど
// これ使えばあれ、その、できるね。ただね。んー。
// 64x64個のfloat？
// 4つずつ入るから32x32x4かなぁ。つまり
// 32x32のfloat textureに乱数をぶち込んで
// それ使って計算すればいいってわけね。
// やり方としてはMath.random()を4096回呼んで・・
// vec4型で32x32個作って1024個
// それらにインデックスを付随させる
// 要するにattributeとしてfloat:indexとvec4:rdm値というね。
// んでそれをフラグメントシェーダで焼きこんでfloat textureとし
// それを運用して点描画するってわけね
// そっちでnoiseの計算するわけだけどね・・

// 使えたとする。それで？
// VTFでこのnoiseを使えば、最初の1回だけでよくなるので、
// 例のyurayuraを超高速化できるってわけ
// まあnoiseの負荷次第ではあるんだけどね
// めちゃんこ速くなるはず
// なんといってもbufferDataが1回で済むので・・・・
// やらない選択肢は、ないはずよね。
// contour of noiseもvsでnoise・・というかこっちはGPGPUで更新
// した方がいいのか。
// lifeとか使ってるし。一定時間が経過するか画面外に出たら位置リセットする
// みたいなことやってるし
// んで速度については保持してないみたいなので
// でもそのくらいだろうね
// まあp5のnoise移植出来たらいろいろできそう
// fsで使って色決めたりするのにも使えるだろうし
// 板ポリ芸に応用してもいいですし
// 4次元？？えぇ・・やり方変えないと厳しそう。
// 64x64x64？？
// 値の保持だけなら256x256x4だから全然問題ないけどね。
// ただね
// 計算負荷がね・・・・まあ、やってみますよ。一応。

// 面白い話題だけど今やる気しないので
// パス・・・・
let myNoise;

function setup() {
  createCanvas(400, 400);
  myNoise = new _Noise();
}

function draw() {
  background(220);
  for(i=0;i<100;i++){
    n=myNoise.get3(i,2,3)*400;
    line(n,0,n,200);
    n=myNoise.get3(i,2,3+16)*400;
    line(n,200,n,400);
  }
}

class _Noise{
  constructor(){
    this.perlin = null;
    this.size = 4095;
    this.yWrapByte = 4;
    this.yWrap = (1 << this.yWrapByte);
    this.zWrapByte = 8;
    this.zWrap = (1 << this.zWrapByte);
    this.octaves = 4;
    this.ampFallOff = 0.5;
    this.seed = undefined;
  }
  setSeed(seed){
    /* seed値を決めてperlinを設定する */
    /* これにより得られる値はseedの値で完全に決まる */
    // m is basically chosen to be large (as it is the max period)
    // and for its relationships to a and c
    const m = 4294967296;
    // a - 1 should be divisible by m's prime factors
    const a = 1664525;
    // c and m should be co-prime
    const c = 1013904223;
    let val;
    if(seed === undefined){
      val = ((Math.random() * m) >>> 0);
    }else{
      val = (seed >>> 0);
    }
    this.seed = val;
    this.perlin = new Array(this.size + 1);
    for(let i = 0; i < this.perlin.length; i++){
      val = (a * val + c) % m;
      this.perlin[i] = val / m;
    }
  }
  getSeed(){
    return this.seed;
  }
  setDetail(lod, fallOff){
    if(lod > 0){
      this.octaves = Math.min(Math.max(2, Math.floor(lod)), 8);
    }
    if(fallOff > 0){
      this.ampFallOff = Math.min(Math.max(fallOff, 0.01), 0.99);
    }
  }
  scaledCosine(x){ return 0.5 * (1.0 - Math.cos(Math.PI * x)); }
  get1(x){
    return this.get3(x, 0, 0);
  }
  get2(x, y){
    return this.get3(x, y, 0);
  }
  get3(x,y,z){
    if(this.perlin == null){
      this.perlin = new Array(this.size + 1);
      for(let i = 0; i < this.perlin.length; i++){
        this.perlin[i] = Math.random();
      }
    }
    if(x < 0){ x = -x; }
    if(y < 0){ y = -y; }
    if(z < 0){ z = -z; }
    let xi = Math.floor(x);
    let yi = Math.floor(y);
    let zi = Math.floor(z);
    let xf = x - xi;
    let yf = y - yi;
    let zf = z - zi;
    let rxf, ryf;
    let r = 0;
    let ampl = 0.5;
    let n1, n2, n3;
    for(let o = 0; o < this.octaves; o++){
      let of = xi + (yi << this.yWrapByte) + (zi << this.zWrapByte);
      rxf = this.scaledCosine(xf);
      ryf = this.scaledCosine(yf);

      n1 = this.perlin[of & this.size];
      n1 += rxf * (this.perlin[(of + 1) & this.size] - n1);
      // of0とof1を割合rxfで足し合わせる（rxfが0のときof0みたいな）
      n2 = this.perlin[(of + this.yWrap) & this.size];
      n2 += rxf * (this.perlin[(of + this.yWrap + 1) & this.size] - n2);
      // of16とof17を割合rxfで足し合わせる
      n1 += ryf * (n2 - n1);
      // 得られたn1とn2を割合ryfで足し合わせる

      of += this.zWrap;
      // ofに256を足して・・・

      n2 = this.perlin[of & this.size];
      n2 += rxf * (this.perlin[(of + 1) & this.size] - n2);
      // of256とof257を割合rxfで足し合わせる
      n3 = this.perlin[(of + this.yWrap) & this.size];
      n3 += rxf * (this.perlin[(of + this.yWrap + 1) & this.size] - n3);
      // of272とof273を割合rxfで足し合わせる
      n2 += ryf * (n3 - n2);
      // 得られた結果を割合ryfで足し合わせる

      n1 += this.scaledCosine(zf) * (n2 - n1);
      // これらを、割合rzfで足し合わせる

      // おそらく4次元の場合、この一連の処理をof+=4096したうえで実行する。

      // そして、2つの結果を割合rwfで足し合わせることになるので、
      // 単純に考えて計算負荷は2倍ですかね・・そもそも2次元ノイズであれば
      // これ半分になるので（最初に得られるn1でおしまい）

      // n1を得ることができたらあとは水増しですかね。
      // なおn1が得られた後でn2とn3が空くので、n4と合わせて一連の処理を
      // 実行することができて、最終的にできるn2をn1と・・って流れに
      // なると思う。知らないけどね。んー。それもやらないとなのかな・・
      // 大変すぎてつら。
      r += n1 * ampl;
      ampl *= this.ampFallOff;

      xi <<= 1;
      xf *= 2;
      yi <<= 1;
      yf *= 2;
      zi <<= 1;
      zf *= 2;
      if(xf >= 1.0){ xi++; xf--; }
      if(yf >= 1.0){ yi++; yf--; }
      if(zf >= 1.0){ zi++; zf--; }
    }
    return r;
  }
}

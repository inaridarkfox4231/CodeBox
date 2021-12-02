// Title: Rhythm Generator
// Author: FAL
// Date: 9. Oct. 2017
// Made with p5.js v0.5.14 (plugin: p5.sound.js v0.3.5)

// It's so hard to learn JavaScript!

// どこまでできるかわからないけどforkチャレンジ！

// p5.jsを1.4.0にして
// p5.sound.jsを1.3.1にしました。
// p5.sound.jsが1.4.0でもmasterVolumeをoutputVolumeにすれば動くのですが
// 若干響きが異なるので他のところにも変更が加えられているようです。

var backgroundColor;

var metronome; // メトロノーム！
var myTrackSystem; // マイトラックシステム！
let freqGetter; // 振動数ゲッター！

var soundEnabled = true;

/* ------- Sound --------------------------------------*/

// 多分クラス表記かな・・
var EnvelopedOscillator = function(oscillatorType, envelopeParameter) {
  this.envelopeParameter = envelopeParameter;
  this.oscillatorType = oscillatorType;
	// oscillatorTypeに応じてオシレーターを設定
  switch (oscillatorType) {
    case 'sine':
    case 'triangle':
    case 'sawtooth':
    case 'square':
      this.oscillator = new p5.Oscillator();
      break;
    case 'white':
    case 'pink':
    case 'brown':
      this.oscillator = new p5.Noise();
      break;
  }
  this.oscillator.setType(oscillatorType);
  this.envelope = new p5.Envelope();
  this.envelope.setADSR(envelopeParameter.attackTime, envelopeParameter.decayTime, envelopeParameter.susPercent, envelopeParameter.releaseTime);
  this.envelope.setRange(envelopeParameter.attackLevel, envelopeParameter.releaseLevel);
};
EnvelopedOscillator.prototype.play = function(startTime, sustainTime, frequency) {
  // 0でもOKにしたいので書き換え
  if (frequency !== undefined) this.oscillator.freq(frequency);
  this.envelope.play(this.oscillator, startTime, sustainTime);
};
EnvelopedOscillator.prototype.start = function() {
  this.oscillator.amp(0);
  this.oscillator.start();
};
EnvelopedOscillator.prototype.stop = function() {
  this.oscillator.amp(0);
  this.oscillator.stop();
};
EnvelopedOscillator.prototype.pan = function(value) {
  this.oscillator.pan(value);
};
EnvelopedOscillator.prototype.connect = function(unit) {
  this.connectedUnit = unit;
  this.oscillator.disconnect();
  this.oscillator.connect(unit);
};

// 多分これがFALさんのオリジナルのあれ
// 複数の同じタイプのオシレーターをまとめて取り扱う機構
// 今はcapacityを探ってる。
// なるほど
// たとえば8だったら8つのオシレータが1つずつ代わりばんこにでてきて使われるわけね。可視化してみたい。
// ていうかオシレータにビジュアライズ機能を搭載するとかはないの？

// オシレータセットと、メトロノームと、トラックと、ビジュアライザ。
// まずオシレータセットは音を出す。ノイズでなければ振動数も変化する。
// メトロノームに応じてスタート位置に達したらその音を出す処理を行う感じ
// トラックはノートの配列などいろいろ持っててこれとメトロノームが連携して音を出すタイミングが決まり
// ノートが仕事をしてオシレータセットのカレントに指示を出し出されたオシレータが音を出す
// 振動数と音の長さの情報はノートが持っているのでこれをオシレータに渡して音が出ます
// それと同時にビジュアライザにも指示が出ます
// ビジュアライザはノートが持ってて発動したか否かに応じてどんなふうに描画するのかを決めます
// 音を出す前は固定イメージ、指示が出されたら動き始めて動きが終わったら消える感じです。
// 動きの長さは音の長さでもあるので・・
// どっちかというとノートにdraw機能を持たせてそれが発動するようにした方がいいかもしれません
// そうなるともうびじゅあらい・・
// や、ちがう。STGのshapeみたいにする。つまりビジュアライザはクラスにする、
// ノイズや三角波など種類ごとに何パターンか用意してそれを持たせてそれ経由で描画する
// 位置情報はノートに持たせてそれをビジュアライザに渡して描画が実行されます

// 「その」クラスにインターバルミリ秒が入ってる・・
// 各ノートは基本となる位置、ポジションを持っている。1小節4として0,1,2,3|4,5,6,7|みたいな。
// それとミリ秒を掛け算して基本的な発動タイミング。で、1/2ならそれ＋ミリ秒の半分とか、1/4とか。
// で、音が伸びる長さについても、デフォルトはミリ秒の1として、その1/2とか3/4とか。そういう感じで。
// 分割して、分割して選べるように・・分割範囲からドラッグして伸ばしたら隣も同じ幅で自動的に分割されるように・・厳しいね。
// それにより位置と効果時間が決まったらそれに応じてビジュアライザが出力を行う。これでビジュアライズ成功。

// そのクラスの名前は何ですか？「トラック」です。まとめたものはトラックシステム、です。
/*
  track --- スコア（noteの配列）
        --- メトロノーム
        --- オシレータセット
        --- nextPlaySoundPoint（スコアから取得）
  noteの配列のインデックスが進んでいく
  ミリ秒単位で次のノートの発動タイミングが保持されている（もちろん最初は0）
  ここで注意するのはmillis()で得られるのはプログラム開始からのあれなので
  setupの最後にすべてのメトロノームにそのときのmillis()で得られるミリ秒を渡す。
  で、各メトロノームはまずmillis()で時間を・・そしてスタートのタイミングでの、つまり初期化時の
  ミリ秒と比較してそれが次のノートの発動タイミングと比べて超えているならtrueを返し、
  それによりノートにスイッチが入る。ノートはデータをオシレータセットに渡しオシレータセットは演奏する（適宜次の
  オシレータに演奏のタイミングを譲る）。その一方でビジュアライズの作業を行う。位置情報と経過時間・・発動した時のミリ秒と
  millis()で得られるミリ秒を比較すれば経過時間が出る、それと継続時間からプログレスが出るのでそれに基づいて描画を行う。以上・・
  ノートが最後まで行ったら終了。もちろん意図的に終了させることも可能。
  途中から始める場合。
  初期化の際にmillis()でそのときのミリ秒を記録、それとスタート位置の理想的な経過ミリ秒、及び毎フレームのそのタイミングでのミリ秒から
  タイミングを計算してあとは同じ。最初からそれを想定するならそういう風に書かないといけないわね・・
  つまりデフォで0である演奏開始タイミングを変数化してそれとmillis()で得られるそれを比べてっていう。
  0（もしくは途中からの場合はそのタイミングの理想的経過ミリ秒）に、現在のミリ秒ー開始直前の初期化時のミリ秒（要するにduration）を足して、
  それがnextStartPointを超えるか超えないかで判断するって話ね。
　スコアが次の音の開始タイミングや最後に演奏した音のインデックスの情報を持ってるのね。
　って思ったけど常に保持するのは「次に演奏する」音のインデックスの方がいいかもしれないね。そこからnext～を取得できるから。？
　いや、演奏直後に渡せばいいよ。演奏する→インデックスを増やす→次の開始タイミングを渡す。次のノートがない場合はやらない。
　すべてのtrackが演奏終了したら（スコアがfalseを返すみたいな感じで）全体の演奏は終了。
　そんな感じで。
  update:スコアから次の演奏タイミングを取得。メトロノームを動かす。演奏するかどうかをチェック。演奏しないならこれ以降の処理はしない。
  演奏するならスコアからノートデータを受け取ってオシレータセットに渡して演奏してもらう。そのあとスコアの方でインデックスを増加して
  次の演奏タイミングを更新、それがないならfalseを返すだけ。すべてのトラックがfalseを返したら全体の処理は終了・・。
  draw:すべてのノートを描画する感じ。ノートごとにプログレスを計算してそれに基づいて描画する感じ。演奏前なら具体的なイメージなんか、
  演奏開始後の場合は所要時間とそのタイミングのミリ秒からプログレスを計算して云々。超えてる場合は描画せず終了のフラグを立ててスルーでOK.

  思ったけど描画負荷は軽い方がいいね・・演奏のタイミングに影響出そう。
*/
var ParallelEnvelopedOscillatorSet = function(oscillatorType, envelopeParameter, capacity) {
  this.envelopedOscillatorArray = [];
  this.capacity = capacity;
  this.currentIndex = 0; // 演奏中のインデックス
  for (var i = 0; i < this.capacity; i++) {
    this.envelopedOscillatorArray.push(new EnvelopedOscillator(oscillatorType, envelopeParameter));
  }
};
ParallelEnvelopedOscillatorSet.prototype.play = function(startTime, sustainTime, frequency) {
  this.envelopedOscillatorArray[this.currentIndex].play(startTime, sustainTime, frequency);
  this.currentIndex++;
  if (this.currentIndex >= this.capacity) this.currentIndex = 0; // ここでインデックスをループさせている
};
// まとめてスタート
ParallelEnvelopedOscillatorSet.prototype.start = function() {
  for (var i = 0, len = this.envelopedOscillatorArray.length; i < len; i++) {
    this.envelopedOscillatorArray[i].start();
  }
};
// まとめてストップ
ParallelEnvelopedOscillatorSet.prototype.stop = function() {
  for (var i = 0, len = this.envelopedOscillatorArray.length; i < len; i++) {
    this.envelopedOscillatorArray[i].stop();
  }
};
ParallelEnvelopedOscillatorSet.prototype.pan = function(value) {
  for (var i = 0, len = this.envelopedOscillatorArray.length; i < len; i++) {
    this.envelopedOscillatorArray[i].pan(value);
  }
};



/* ------- Metronome --------------------------------------*/
// メトロノームの仕組みが謎
var Metronome = {
  create: function(intervalMillisecond = 125) {
    var newObject = Object.create(Metronome.prototype);
    newObject.intervalMillisecond = intervalMillisecond; // デフォルト125
    newObject.lastNoteTimeStamp = 0;
    newObject.clickCount = 0;
    return newObject;
  },
  prototype: {
    check: function() {
      var currentTimeStamp = millis();
      if (currentTimeStamp >= this.lastNoteTimeStamp + this.intervalMillisecond) {
				// millis()は現在のミリ秒で、インターバルを超えたらラストノートを更新。
				// その際にカウントを増やす。
        this.lastNoteTimeStamp += this.intervalMillisecond;
				// この行以外は理解したはず・・この行なんだろうね。
        // この行がアクティブになるのは・・あーそうか、フレームカウントたとえば60だったら1000/60でだいたい16ミリ秒ごとに
        // これ実行されるんだけど、その16っていうのがインターバルミリセカンドの2倍以上だった場合に、
        // さらに足すことはしないで、currentをそのままラストノートにしちゃうわけね。
        // もっともこのプログラムでは120だけど。つまり120ミリ秒に1回。おおよそ1秒に8回くらい。だから問題にならない。
        // console使えば実行されてないのがわかるはず。7とかにしちゃうとまずいわけだ。
        if (currentTimeStamp >= this.lastNoteTimeStamp + this.intervalMillisecond){
          this.lastNoteTimeStamp = currentTimeStamp;
        }
        this.clickCount++; // clickCountはノートを更新した回数らしいんだけど利用されてる場所がないのでわけわからん
        // 利用価値があるかどうかに関わらず何かを記録しておくことは重要ということだろう。
        return true;
      }
      return false;
    }
  }
};

/* ------- Track --------------------------------------*/

// たとえばオシレーター4個セット
var Track = function(trackParameter) {
  // ん？
  // ああそうか、オシレータセットひとつひとつにオシレータが8個入ってるのね。
  // 8個ってどういうこと？
  // 調べたら6や7でも普通に動いたわね・・要するにトラックごとに8個ずつ。32とか4とか関係なくて、複数のオシレータを使いまわしてるだけ、
  // その個数が8なのでしょう。
  this.oscillatorSet = new ParallelEnvelopedOscillatorSet(trackParameter.oscillatorType, trackParameter.envelopeParameter, 8);
  if (trackParameter.pan) this.oscillatorSet.pan(trackParameter.pan);

  this.startTime = trackParameter.startTime;
  this.sustainTime = trackParameter.sustainTime;

  this.frequency = trackParameter.frequency;
  this.frequencyPattern = trackParameter.frequencyPattern; // え？undefinedの場合はfrequencyがそのまま。
  // C4を0として（A4が440Hzという設定）配列で決める（だから880HzのA5は9に相当する感じ）
  // 周波数を返す関数を作る。0以上と0以下用に二つの配列をもっておりそれぞれ24と-24までの値が入ってて
  // 引数の符号に応じて適した周波数を返す感じね。getFrequency的な？
  // だから指定の仕方も440とかではない感じになるわね。

  this.notePattern = trackParameter.notePattern; // ここですね。ここを任意に決めると、自由にパターンを決められるわけです。
	// で、確か音程についてもいじれるようにしたはず・・ああー思い出せないい
	// ていうかめんどうだな。。その、漢字変換の場所うざいし。
	// あっちでいじってこっちにコピペして、とかした方がいいと思う。
  // こっちの方が作業しやすいぜ（検索できるのが大きい）

  // ランダムの場合はフラグと、確率を設定する。固定の場合は無視。
  this.isRandom = trackParameter.isRandom;
  this.probability = trackParameter.probability;
};
// updateNotesは結局あの、32を超えたら全部リセットするやつです。（無限ループ）
// 今作りたいやつに関していうと、これは不要なので・・なくす感じですかね。48なら48までで終わりとか。んー。
Track.prototype.updateNotes = function(noteCount) { // だからここは32.
  this.noteArray = []; // 初期化
  this.frequencyArray = []; // あれば・・

  if (this.isRandom) {
    for (var i = 0; i < floor(noteCount / 2); i++) {
      // 確率はそのまんまの意味。
      // 16個だけ作ってそれを2倍にしていますね。だから同じパターンが2回繰り返されている。
      if (random(1) < this.probability) this.noteArray.push(true);
      else this.noteArray.push(false);
    }
    this.noteArray = concat(this.noteArray, this.noteArray);
  } else {
    for (var k = 0; k < noteCount; k++) {
      this.noteArray.push(false);
    }
  }

  if (this.notePattern) {
    var patternLength = this.notePattern.length;
    // 長さが足りない場合は同じパターンのループになる。たとえば長さ8なら8が4回ループする感じね.
    // 6とかの場合も。最後ちぎれるけど。
    for (var m = 0; m < noteCount; m++) {
      if (this.notePattern[m % patternLength]) this.noteArray[m] = true;
    }
  }

  if(this.frequencyPattern){
    let patternLength = this.frequencyPattern.length;
    // とりあえず同じ仕様で
    for (var m = 0; m < noteCount; m++) {
      this.frequencyArray[m] = this.frequencyPattern[m % patternLength];
    }
  }
};
Track.prototype.play = function(noteIndex) {
  // 音程はもちろんここでfrequencyをいじるんだけどやり方を忘れてしまったのでできません
  // 3/4と4/4の切り替えとかできるようにしたら面白そう
  // あとはUIで自由に演奏するとかですかね・・
  let freqIndex;
  if(this.frequencyPattern){
    freqIndex = this.frequencyArray[noteIndex]; // noteIndexがthis.noteIndexになってました。ごめん。
  }else{
    freqIndex = this.frequency; // ノイズの場合はここでundefinedなるのでその場合は計算しない
  }
  let freq;
  if(freqIndex !== undefined){ freq = freqGetter.getFrequency(freqIndex); }
  if (this.noteArray[noteIndex]) this.oscillatorSet.play(this.startTime, this.sustainTime, freq);
};
Track.prototype.start = function() {
  this.oscillatorSet.start();
};



/* ------- Track & Note visualizer --------------------------------*/
// ビジュアライザ関連
// 演奏と同時にアクションが起こる。

var TrackVisualizer = {
  create: function(track, noteVisualizerCreator, xPosition, yPosition) {
    var newObject = Object.create(TrackVisualizer.prototype);
    newObject.track = track;
    newObject.noteVisualizerCreator = noteVisualizerCreator;
    newObject.xPosition = xPosition;
    newObject.yPosition = yPosition;
    newObject.intervalLength = width * 0.05; // 横幅の1/20おきに配置
    return newObject;
  },
  prototype: {
    display: function() {
      // なぜこんなにも多くのpush-popが
      // ていうか何かボードがあって・・とかではないのね
      // フルサイズで自動的に大きさが決まる仕組みだからそこら辺ですかね
      // それでも。。んー。理解したい。でもまあ大して難しいことしてなさそう。
      push();
      translate(this.xPosition, this.yPosition);
      push();
      for (var i = 0, len = this.noteVisualizerArray.length; i < len; i++) {
        if (i == floor(len / 2)) {
          pop();
          push();
          translate(0, height * 0.5); // なるほど。表示位置を半分のところで縦サイズの半分だけ下にずらすわけね。
          // だから32個のうちの16個を横にだーっと並べて残りの16個を下にダーッと並べる。
          // 柔軟性を考えると・・でもこれバリエーションっていうとどうなるんだろう。波打たせるとか？まあ難しいわな。
          // 曲線に沿って並べるとか？自由曲線の上を走らせるのとか（ちょっとイメージできない）
        }
        translate(this.intervalLength, 0); // ここでtranslate.
        this.noteVisualizerArray[i].display();
      }
      pop();
      pop();
    },
    initialize: function() {
      this.noteVisualizerArray = [];
      for (var i = 0, len = this.track.noteArray.length; i < len; i++) {
        this.noteVisualizerArray.push(this.noteVisualizerCreator.create());
      }
    },
    update: function() {
      for (var i = 0, len = this.track.noteArray.length; i < len; i++) {
        this.noteVisualizerArray[i].isWaiting = this.track.noteArray[i];
      }
    },
    receivePlayedNote: function(noteIndex) {
      if (this.noteVisualizerArray[noteIndex].isWaiting) {
        this.noteVisualizerArray[noteIndex].isWaiting = false;
        this.noteVisualizerArray[noteIndex].isPlayed = true;
        this.noteVisualizerArray[noteIndex].playedFrameCount = 0;
      }
    }
  }
};



var AbstractNoteVisualizer = {
  create: function() {
    var newObject = Object.create(AbstractNoteVisualizer.prototype);
    newObject.playedFrameCount = 0;
    newObject.isWaiting = true;
    newObject.isPlayed = false;
    newObject.unitLength = width * 0.01; // unitLengthっていうのを使っているんですよね。横幅の1/100.これをもとにしている。
    // 確かCollapsing Ideaでも同じの使ってたはず。
    // あっちのSTGもサイズに関してはこれ使った方がいいかもだね・・全部書き換えるのめんどくさいけど。
    // それやらないといろいろ面倒なことになりそう、まあサイズ固定でもいいんだけど。
    return newObject;
  },
  prototype: {
    display: function() {
      if (this.isWaiting) this.displayBeforePlay();
      if (this.isPlayed) this.displayAfterPlay();
    },
    displayBeforePlay: function() {}, // 演奏前の表示
    displayAfterPlay: function() {}, // 演奏中の表示。これは演奏が終わると消える処理も込みで入っている。
    getProgressRatio: function() {
      return min(1, this.playedFrameCount / this.fadeFrameCount);
    },
    getFadeRatio: function() {
      return 1 - this.getProgressRatio();
    }
  }
};

var SineNoteVisualizer = {
  create: function() {
    var newObject = Object.create(SineNoteVisualizer.prototype);
    Object.assign(newObject, AbstractNoteVisualizer.create());
    return newObject;
  },
  prototype: {
    fadeFrameCount: 60, // fadeFrameCountはそれぞれ異なる、これコンストラクタに書いた方がいいんじゃ。。だいたい1秒か0.5秒位。
    displayBeforePlay: function() {
      noStroke();
      fill(64);
      var diameter = 1.5 * this.unitLength;
      ellipse(0, 0, diameter, diameter);
    },
    displayAfterPlay: function() {
      if (this.playedFrameCount >= this.fadeFrameCount) return;
      var progressRatio = (-pow(this.getProgressRatio() - 1, 4) + 1);
      var fadeRatio = this.getFadeRatio();
      strokeWeight(this.unitLength * 0.5 * fadeRatio);
      stroke(64, 255 * fadeRatio);
      noFill();
      var diameter = (2 + 4 * progressRatio) * this.unitLength;
      ellipse(0, 0, diameter, diameter);
      noStroke();
      fill(64, 255 * fadeRatio);
      rect(
        0, -1 * this.unitLength - 8 * this.unitLength * progressRatio,
        0.5 * this.unitLength, 2 * this.unitLength * (1 + fadeRatio)
      );
      this.playedFrameCount++;
    }
  }
};
Object.setPrototypeOf(SineNoteVisualizer.prototype, AbstractNoteVisualizer.prototype);

var ShortWhiteNoiseNoteVisualizer = {
  create: function() {
    var newObject = Object.create(ShortWhiteNoiseNoteVisualizer.prototype);
    Object.assign(newObject, AbstractNoteVisualizer.create());
    return newObject;
  },
  prototype: {
    fadeFrameCount: 30,
    displayBeforePlay: function() {
      stroke(64);
      strokeWeight(1);
      noFill();
      var halfSize = 1.5 * this.unitLength;
      quad(halfSize, 0, 0, halfSize, -halfSize, 0, 0, -halfSize);
    },
    displayAfterPlay: function() {
      if (this.playedFrameCount >= this.fadeFrameCount) return;
      var progressRatio = (-pow(this.getProgressRatio() - 1, 4) + 1);
      var fadeRatio = this.getFadeRatio();
      stroke(64, 255 * fadeRatio);
      strokeWeight(1);
      noFill();
      var halfSize = 1.5 * this.unitLength;
      push();
      var maxDisplacement = halfSize * sq(fadeRatio);
      translate(3 * this.unitLength * progressRatio + random(-1, 1) * maxDisplacement, random(-1, 1) * maxDisplacement);
      quad(halfSize, 0, 0, halfSize, -halfSize, 0, 0, -halfSize);
      pop();
      this.playedFrameCount++;
    }
  }
};
Object.setPrototypeOf(ShortWhiteNoiseNoteVisualizer.prototype, AbstractNoteVisualizer.prototype);

var LongWhiteNoiseNoteVisualizer = {
  create: function() {
    var newObject = Object.create(LongWhiteNoiseNoteVisualizer.prototype);
    Object.assign(newObject, AbstractNoteVisualizer.create());
    return newObject;
  },
  prototype: {
    fadeFrameCount: 30,
    displayBeforePlay: function() {
      stroke(64);
      strokeWeight(2);
      noFill();
      var halfSize = 1.5 * this.unitLength;
      var halfInterval = halfSize * 0.4;
      line(-halfSize, -halfInterval, halfSize, -halfInterval);
      line(-halfSize, +halfInterval, halfSize, +halfInterval);
    },
    displayAfterPlay: function() {
      if (this.playedFrameCount >= this.fadeFrameCount) return;
      var progressRatio = pow(this.getProgressRatio() - 1, 5) + 1;
      var fadeRatio = this.getFadeRatio();
      stroke(64, 255 * fadeRatio);
      strokeWeight(2);
      noFill();
      var halfSize = 1.5 * this.unitLength * (1 + 1.5 * progressRatio);
      var halfInterval = 2.5 * this.unitLength * progressRatio;
      line(-halfSize, -halfInterval, halfSize, -halfInterval);
      line(-halfSize, +halfInterval, halfSize, +halfInterval);
      strokeWeight(1);
      for (var i = 0; i < 7; i++) {
        var y = random(-0.9, 0.9) * halfInterval;
        line(-halfSize, y, halfSize, y);
      }
      this.playedFrameCount++;
    }
  }
};
Object.setPrototypeOf(LongWhiteNoiseNoteVisualizer.prototype, AbstractNoteVisualizer.prototype);

var BrownNoiseNoteVisualizer = {
  create: function() {
    var newObject = Object.create(BrownNoiseNoteVisualizer.prototype);
    Object.assign(newObject, AbstractNoteVisualizer.create());
    return newObject;
  },
  prototype: {
    fadeFrameCount: 30,
    displayBeforePlay: function() {
      noStroke();
      fill(64);
      var shapeSize = 2.5 * this.unitLength;
      rect(0, 0, shapeSize, shapeSize, shapeSize * 0.2);
    },
    displayAfterPlay: function() {
      if (this.playedFrameCount >= this.fadeFrameCount) return;
      var progressRatio = pow(this.getProgressRatio() - 1, 5) + 1;
      var fadeRatio = this.getFadeRatio();
      noStroke();
      fill(64, 255 * fadeRatio);
      var shapeSize = 2.5 * this.unitLength;
      var maxDisplacement = 1.5 * this.unitLength * pow(fadeRatio, 4);
      push();
      translate(random(-1, 1) * maxDisplacement, (1 - 3 * progressRatio) * this.unitLength + random(-1, 1) * maxDisplacement);
      rotate(PI * progressRatio);
      rect(0, 0, shapeSize, shapeSize, shapeSize * 0.2);
      pop();
      this.playedFrameCount++;
    }
  }
};
Object.setPrototypeOf(BrownNoiseNoteVisualizer.prototype, AbstractNoteVisualizer.prototype);



/* ------- Track system (manages tracks ant visualizers) ---------------*/
// trackArrayに直接放り込んでる（メソッド無し！）
// あとビジュアライザも直接放り込んでインデックスで同期させてる・・
// てっきりtrackとビジュアライザでワンセットかと思ってた。違うのね。

// TrackSystemにオフセット情報を持たせて線を引くようにしましょう。
// そしてdisplayの際にオフセット情報を渡して各々のビジュアライザがそれをもとにして描画する形式にするべきかも。
// で、オフセット-20～オフセット+120の範囲であればオフセットを引いて描画する。
// これでいこう！！
// マウスプレスによるオフセットの移動や矢印ボタンの表示もTrackSystemが行うと。はい。
// 拡張は？それはまた別の話で・・ビジュアライザとtrackが連携してないので・・連携させちゃうか？めんどくさいんだよな・・
// 連携してればまとめて、まあいいんだけど。

var TrackSystem = function(noteCount) {
  this.noteCount = noteCount; // 32です！
  // 3/4拍子とかだったらまた違うんかな（？）

  this.trackArray = [];
  this.trackVisualizerArray = [];
};
TrackSystem.prototype.start = function() {
  for (var i = 0, len = this.trackArray.length; i < len; i++) {
    this.trackArray[i].start();
  }
  this.updateNotes(this.noteCount); // ここも32.

  this.initializeVisualizers();
  this.updateVisualizers();
};
TrackSystem.prototype.playNextNote = function() {
  for (var i = 0, len = this.trackArray.length; i < len; i++) {
    if (soundEnabled) this.trackArray[i].play(this.nextNoteIndex);
  }
  for (var k = 0, klen = this.trackVisualizerArray.length; k < klen; k++) {
    this.trackVisualizerArray[k].receivePlayedNote(this.nextNoteIndex);
  }

  this.nextNoteIndex++;
  if (this.nextNoteIndex >= this.noteCount) {
    this.updateNotes(this.noteCount);
    // ビジュアライズするノートの切り替えをここでやってるみたい・・？
    this.updateVisualizers();
  }
};
TrackSystem.prototype.updateNotes = function(noteCount) {
  for (var i = 0, len = this.trackArray.length; i < len; i++) {
    this.trackArray[i].updateNotes(noteCount);
  }
  this.nextNoteIndex = 0;
};
TrackSystem.prototype.display = function() {
  for (var i = 0, len = this.trackVisualizerArray.length; i < len; i++) {
    this.trackVisualizerArray[i].display();
  }
};
TrackSystem.prototype.updateVisualizers = function() {
  for (var i = 0, len = this.trackVisualizerArray.length; i < len; i++) {
    this.trackVisualizerArray[i].update();
  }
};
TrackSystem.prototype.initializeVisualizers = function() {
  for (var i = 0, len = this.trackVisualizerArray.length; i < len; i++) {
    this.trackVisualizerArray[i].initialize();
  }
};

/* ---------get Frequency------- */
class FrequencyGetter{
  constructor(left, right){
    // たとえば-12～24なら12と24が入る感じ
    this.plusFrequencyArray = new Array(right + 1);
    this.minusFrequencyArray = new Array(left + 1);
    this.prepare();
  }
  prepare(){
    for(let i = 0; i < this.plusFrequencyArray.length; i++){
      this.plusFrequencyArray[i] = 440 * Math.pow(2, (i - 9) / 12);
    }
    for(let i = 0; i < this.minusFrequencyArray.length; i++){
      this.minusFrequencyArray[i] = 440 * Math.pow(2, (-i - 9) / 12);
    }
  }
  getFrequency(code){
    if(code >= 0){
      return this.plusFrequencyArray[code];
    }
    code *= -1;
    return this.minusFrequencyArray[code];
  }
}

/* ------- Setup & Draw --------------------------------------*/

function setup() {
  var canvasSideLength = max(min(windowWidth, windowHeight) * 0.95, min(displayWidth, displayHeight) * 0.5);
  createCanvas(canvasSideLength, canvasSideLength);
  backgroundColor = color(240);
  ellipseMode(CENTER);
  rectMode(CENTER);

  masterVolume(0.7);
  metronome = Metronome.create(125);


  myTrackSystem = new TrackSystem(32);

  freqGetter = new FrequencyGetter(32, 32);

  var sineOscillatorEnvelopeParameter = {
    attackLevel: 1,
    releaseLevel: 0,
    attackTime: 0.01,
    decayTime: 0.05,
    susPercent: 0.2,
    releaseTime: 0.01
  };
  // たとえば0の代わりに[0,2,4]となっていたら和音になるみたいな？
  // 自動的にオシレーターが追加されて、然るべきタイミングで・・
  var sineTrackParameter = {
    oscillatorType: 'triangle', // それに三角とかもできるといいねー
    envelopeParameter: sineOscillatorEnvelopeParameter,
    pan: 0,
    startTime: 0.01,
    sustainTime: 0.08,
    frequencyPattern: [0, 2, 4, 0, 0, 2, 4, 0, 7, 4, 2, 0, 2, 4, 2, 0,
											 0, 2, 4, 0, 0, 2, 4, 0, 7, 4, 2, 0, 2, 4, 0, 0], // ドレミドレミ
    notePattern:[1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
								 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0],
    isRandom: false
  };
  var sineTrack = new Track(sineTrackParameter);
  myTrackSystem.trackArray.push(sineTrack);

  var shortWhiteNoiseEnvelopeParameter = {
    attackLevel: 0.8,
    releaseLevel: 0,
    attackTime: 0.001,
    decayTime: 0.03,
    susPercent: 0.1,
    releaseTime: 0.01
  };
  var shortWhiteNoiseTrackParameter = {
    oscillatorType: 'white',
    envelopeParameter: shortWhiteNoiseEnvelopeParameter,
    pan: -0.7,
    startTime: 0.01,
    sustainTime: 0.02,
    isRandom: true,
    probability: 0.4
  };
  var shortWhiteNoiseTrack = new Track(shortWhiteNoiseTrackParameter);
  myTrackSystem.trackArray.push(shortWhiteNoiseTrack);

  var longWhiteNoiseEnvelopeParameter = {
    attackLevel: 0.7,
    releaseLevel: 0,
    attackTime: 0.001,
    decayTime: 0.15,
    susPercent: 0.1,
    releaseTime: 0.1
  };
  // あ、whiteとbrownは固定なんだ。
  var longWhiteNoiseTrackParameter = {
    oscillatorType: 'white',
    envelopeParameter: longWhiteNoiseEnvelopeParameter,
    pan: +0.7,
    startTime: 0.01,
    sustainTime: 0.05,
    notePattern: [false, false, false, false, true, false, false, false],
    isRandom: false
  };
  var longWhiteNoiseTrack = new Track(longWhiteNoiseTrackParameter);
  myTrackSystem.trackArray.push(longWhiteNoiseTrack);

  var brownNoiseEnvelopeParameter = {
    attackLevel: 0.9,
    releaseLevel: 0,
    attackTime: 0.001,
    decayTime: 0.1,
    susPercent: 0.2,
    releaseTime: 0.02
  };
  var brownNoiseTrackParameter = {
    oscillatorType: 'brown',
    envelopeParameter: brownNoiseEnvelopeParameter,
    pan: -0.2,
    startTime: 0.01,
    sustainTime: 0.05,
    notePattern: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    isRandom: true,
    probability: 0.3
  };
  var brownNoiseTrack = new Track(brownNoiseTrackParameter);
  myTrackSystem.trackArray.push(brownNoiseTrack);


  myTrackSystem.trackVisualizerArray.push(TrackVisualizer.create(sineTrack, SineNoteVisualizer, width * 0.08, height * 0.16));
  myTrackSystem.trackVisualizerArray.push(TrackVisualizer.create(shortWhiteNoiseTrack, ShortWhiteNoiseNoteVisualizer, width * 0.08, height * 0.24));
  myTrackSystem.trackVisualizerArray.push(TrackVisualizer.create(longWhiteNoiseTrack, LongWhiteNoiseNoteVisualizer, width * 0.08, height * 0.32));
  myTrackSystem.trackVisualizerArray.push(TrackVisualizer.create(brownNoiseTrack, BrownNoiseNoteVisualizer, width * 0.08, height * 0.40));


  myTrackSystem.start();
}



function draw() {
  background(backgroundColor);

  myTrackSystem.display();

  if (metronome.check()) {
    myTrackSystem.playNextNote();
  }
}

function mousePressed() {
  soundEnabled = !soundEnabled;
}

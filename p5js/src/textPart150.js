/*
1.5.0のtext
通常描画であれば_renderPathは考えなくていい
というかおそらくあそこは一緒のはず
*/

/*
まず第4,5引数が無い場合、えー、finalMinHeightについて、CENTERの場合真ん中、BOTTOMの場合一番下、が、yであり、finalMinHeight
なんですね。で、そのyから_offset2を引いたものにLeadingを足していく感じで。それが
最適解としてはfinalMinHeightをマイナスのInfinityに置き換えればいいと思う（要するにバリデーション要らん）
というかマイナスの Number.MAX_VALUE です、ね。
ってなれば話は簡単なんだけどな...
次
引数がある場合なんですが...finalMinHeightはこれrectModeがCENTERでない場合にはうまくいってるんで、CENTERの場合なんですが、
補正を加えるだけでよくって、yは描画位置にしか使わないので...
CENTERでないっていうのは要するにCORNER扱いですね。その場合finalMinHeightっていうのは上端で、あそこでやってるのはそこからBOTTOMなら1倍
CENTERなら0.5倍のascentというかテキストの高さの目安を引いてる、それでうまくいってるわけ。
*/

// ---------------------------p5.js/1.5.0のtext関数-------------------------- //

_main.default.Renderer.prototype.text = function (str, x, y, maxWidth, maxHeight) {
  var p = this._pInst;
  var textWrapStyle = this._textWrap;
  var lines;
  var line;
  var testLine;
  var testWidth;
  var words;
  var chars;
  var shiftedY;
  var finalMaxHeight = Number.MAX_VALUE; // fix for #5785 (top of bounding box)
  var finalMinHeight = y; // ここですね。1.4.2との違いですね。デフォルト値はyのようです！
  if (!(this._doFill || this._doStroke)) {
    return;
  }
  if (typeof str === 'undefined') {
    return;
  } else if (typeof str !== 'string') {
    str = str.toString();
  }
  // Replaces tabs with double-spaces and splits string on any line
  // breaks present in the original string
  str = str.replace(/(\t)/g, '  ');
  lines = str.split('\n');

  if (typeof maxWidth !== 'undefined') { // ここ以降しばらく引数ありの場合の処理...こっちも見ないとだけどね。
    if (this._rectMode === constants.CENTER) { // rectMode===CENTERはここと
      x -= maxWidth / 2; // xだけずらしてるけどyもずらさないといけないのでは...
    }

    switch (this._textAlign) {
      case constants.CENTER:
        x += maxWidth / 2;
        break;
      case constants.RIGHT:
        x += maxWidth;
        break;
    } // ここまで一緒。何をしてるのかはおいおいチェック...その前に引数が無い場合の処理を見るか。

    if (typeof maxHeight !== 'undefined') {
      if (this._rectMode === constants.CENTER) { // ここですね。この二ヶ所。
        y -= maxHeight / 2; // はい。yもずらしてますね。それはいいんですけど...ですけど...
        // finalMinHeight -= maxHeight / 2; // こうしないとまずいわけだ。もしくは....
        // これが最適解かもな...この1行で問題ないはず。
      }

      var originalY = y;
      var ascent = p.textAscent(); // これ無かったよね。フォントごとの、サイズに応じた、高さ、だそうです。はみ出したくないということ。要するに。
      switch (this._textBaseline) {
        case constants.BOTTOM:
          shiftedY = y + maxHeight;
          y = Math.max(shiftedY, y); // fix for #5785 (top of bounding box) // 分からんけどこの2行って y += maxHeightでいいんじゃ？？
          finalMinHeight += ascent; // ここを y+ascentにするとかじゃだめか。んー...変更前のyか。
          break;
        case constants.CENTER:
          shiftedY = y + maxHeight / 2;
          y = Math.max(shiftedY, y); // fix for #5785 (top of bounding box)
          finalMinHeight += ascent / 2; // ここを y+ascent/2にするとか、か？変更前のyだね。
          break;
      } // remember the max-allowed y-position for any line (fix to #928)

      finalMaxHeight = y + maxHeight - ascent; // fix for #5785 (bottom of bounding box)
      if (this._textBaseline === constants.CENTER) {
        finalMaxHeight = originalY + maxHeight - ascent / 2;
      }
    } else {
      // no text-height specified, show warning for BOTTOM / CENTER
      if (this._textBaseline === constants.BOTTOM) {
        return console.warn('textAlign(*, BOTTOM) requires x, y, width and height');
      }
      if (this._textBaseline === constants.CENTER) {
        return console.warn('textAlign(*, CENTER) requires x, y, width and height');
      }
    } // Render lines of text according to settings of textWrap
    // Splits lines at spaces, for loop adds one word + space
    // at a time and tests length with next word added

    if (textWrapStyle === constants.WORD) {
      var nlines = [
      ];
      for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        line = '';
        words = lines[lineIndex].split(' ');
        for (var wordIndex = 0; wordIndex < words.length; wordIndex++) {
          testLine = ''.concat(line + words[wordIndex]) + ' ';
          testWidth = this.textWidth(testLine);
          if (testWidth > maxWidth && line.length > 0) {
            nlines.push(line);
            line = ''.concat(words[wordIndex]) + ' ';
          } else {
            line = testLine;
          }
        }
        nlines.push(line);
      }
      var offset = 0;
      if (this._textBaseline === constants.CENTER) {
        offset = (nlines.length - 1) * p.textLeading() / 2;
      } else if (this._textBaseline === constants.BOTTOM) {
        offset = (nlines.length - 1) * p.textLeading();
      }
      for (var _lineIndex = 0; _lineIndex < lines.length; _lineIndex++) {
        line = '';
        words = lines[_lineIndex].split(' ');
        for (var _wordIndex = 0; _wordIndex < words.length; _wordIndex++) {
          testLine = ''.concat(line + words[_wordIndex]) + ' ';
          testWidth = this.textWidth(testLine);
          if (testWidth > maxWidth && line.length > 0) {
            this._renderText(p, line.trim(), x, y - offset, finalMaxHeight, finalMinHeight);
            line = ''.concat(words[_wordIndex]) + ' ';
            y += p.textLeading();
          } else {
            line = testLine;
          }
        }
        this._renderText(p, line.trim(), x, y - offset, finalMaxHeight, finalMinHeight);
        y += p.textLeading();
      }
    } else {
      var _nlines = [
      ];
      for (var _lineIndex2 = 0; _lineIndex2 < lines.length; _lineIndex2++) {
        line = '';
        chars = lines[_lineIndex2].split('');
        for (var charIndex = 0; charIndex < chars.length; charIndex++) {
          testLine = ''.concat(line + chars[charIndex]);
          testWidth = this.textWidth(testLine);
          if (testWidth <= maxWidth) {
            line += chars[charIndex];
          } else if (testWidth > maxWidth && line.length > 0) {
            _nlines.push(line);
            line = ''.concat(chars[charIndex]);
          }
        }
      }
      _nlines.push(line);
      var _offset = 0;
      if (this._textBaseline === constants.CENTER) {
        _offset = (_nlines.length - 1) * p.textLeading() / 2;
      } else if (this._textBaseline === constants.BOTTOM) {
        _offset = (_nlines.length - 1) * p.textLeading();
      } // Splits lines at characters, for loop adds one char at a time
      // and tests length with next char added

      for (var _lineIndex3 = 0; _lineIndex3 < lines.length; _lineIndex3++) {
        line = '';
        chars = lines[_lineIndex3].split('');
        for (var _charIndex = 0; _charIndex < chars.length; _charIndex++) {
          testLine = ''.concat(line + chars[_charIndex]);
          testWidth = this.textWidth(testLine);
          if (testWidth <= maxWidth) {
            line += chars[_charIndex];
          } else if (testWidth > maxWidth && line.length > 0) {
            this._renderText(p, line.trim(), x, y - _offset, finalMaxHeight, finalMinHeight);
            y += p.textLeading();
            line = ''.concat(chars[_charIndex]);
          }
        }
      }
      this._renderText(p, line.trim(), x, y - _offset, finalMaxHeight, finalMinHeight);
      y += p.textLeading();
    }
  } else { // ここから引数が3つの場合の処理ですね。いずれもCENTERとBOTTOMについて特別な処理をしてる？
    // Offset to account for vertically centering multiple lines of text - no
    // need to adjust anything for vertical align top or baseline
    var _offset2 = 0;

    if (this._textBaseline === constants.CENTER) { // あっちでtextAlignの第二引数使ってたところ...が..._textBaselineになってる？？
      _offset2 = (lines.length - 1) * p.textLeading() / 2; // 処理は同じですね
    } else if (this._textBaseline === constants.BOTTOM) {
      _offset2 = (lines.length - 1) * p.textLeading(); // しかし_textBaselineって何だっけ。一緒かな...一緒？か。で？
    }
    // Renders lines of text at any line breaks present in the original string
    for (var i = 0; i < lines.length; i++) {
      this._renderText(p, lines[i], x, y - _offset2, finalMaxHeight, finalMinHeight); // このfinalMinHeightはyが入ってますね。
      y += p.textLeading(); // そしてyのところは「y - _offset2」で置き換えられているので...
    } // y-_offset2 >= finalMaxHeightのときだけ描画される。
  }
  return p;
};
// あー違うわ。yは大きくなっていくから...finalMaxHeightは最初のyで固定だけど、y - _offset2のyは大きくなっていく、で、これが < finalMaxHeightのとき
// しか描画されない、つまり、
// たとえばbottomでどうして最後の一行だけ描画されるかというと、まず3行だとして2行分上にずらす、で、条件が満たされないが、Leadingを2回足すと
// 一致して描画される。
// centerの場合は1個分しかずらさない。だから最初の行が切られる...1個足すとOKになり、もう1個足してもOK. ただそれだけですね...
// あとは_renderTextがバリデーションを掛けているので描画されないと。困るね。まあいいや。消える理由は分かった。
// 4つだとCENTERの場合1.5ずれるから最低2つ足さないと描画されないわけだ。それで2つだけ...bottomの場合はもう最後の1つしか描画してくれないのね。
// うざ。

// こっちはもういいから次行くか

// -----------------------p5.js/1.5.0の_renderText----------------------------- //

_main.default.Renderer2D.prototype._renderText = function (p, line, x, y, maxY, minY) {
  if (y < minY || y >= maxY) {
    return; // don't render lines beyond our minY/maxY bounds (see #5785)
  }
  p.push(); // fix to #803
  if (!this._isOpenType()) {
    // a system/browser font
    // no stroke unless specified by user
    if (this._doStroke && this._strokeSet) {
      this.drawingContext.strokeText(line, x, y);
    }
    if (this._doFill) {
      // if fill hasn't been set by user, use default text fill
      if (!this._fillSet) {
        this._setFill(constants._DEFAULT_TEXT_FILL);
      }
      this.drawingContext.fillText(line, x, y);
    }
  } else {
    // an opentype font, let it handle the rendering
    this._textFont._renderPath(line, x, y, {
      renderer: this
    });
  }
  p.pop();
  return p;
};

// _renderTextの1.5.0の1.4.2との違いはひとつだけ。
// minYです。
// minYがあって、y < minYであれば実行しない。そこだけ。あとは全部一緒。
// そしてOpenTypeでなければdrawingContextのメソッドで完結する。
// だから悪さをしているのはここ。

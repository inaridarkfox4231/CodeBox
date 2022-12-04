/*
1.4.2のtext
通常描画であれば_renderPathは考えなくていい
というかおそらくあそこは一緒のはず
*/

// ---------------------------p5.js/1.4.2のtext関数-------------------------- //

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
  var finalMaxHeight = Number.MAX_VALUE;

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

  if (typeof maxWidth !== 'undefined') {
    if (this._rectMode === constants.CENTER) {
      x -= maxWidth / 2;
    }

    switch (this._textAlign) {
      case constants.CENTER:
        x += maxWidth / 2;
        break;
      case constants.RIGHT:
        x += maxWidth;
        break;
    }

    var baselineHacked = false;
    if (typeof maxHeight !== 'undefined') {
      if (this._rectMode === constants.CENTER) { // これこっちにもあるんだ。んー？？
        y -= maxHeight / 2;
      }

      switch (this._textBaseline) {
        case constants.BOTTOM:
          shiftedY = y + maxHeight;
          y = Math.max(shiftedY, y);
          break;
        case constants.CENTER:
          shiftedY = y + maxHeight / 2;
          y = Math.max(shiftedY, y);
          break;
        case constants.BASELINE:
          baselineHacked = true;
          this._textBaseline = constants.TOP;
          break;
      }

      // remember the max-allowed y-position for any line (fix to #928)
      finalMaxHeight = y + maxHeight - p.textAscent();
    }

    // Render lines of text according to settings of textWrap
    // Splits lines at spaces, for loop adds one word + space
    // at a time and tests length with next word added
    if (textWrapStyle === constants.WORD) {
      var nlines = [];
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
      var vAlign = p.textAlign().vertical;
      if (vAlign === constants.CENTER) {
        offset = (nlines.length - 1) * p.textLeading() / 2;
      } else if (vAlign === constants.BOTTOM) {
        offset = (nlines.length - 1) * p.textLeading();
      }

      for (var _lineIndex = 0; _lineIndex < lines.length; _lineIndex++) {
        line = '';
        words = lines[_lineIndex].split(' ');
        for (var _wordIndex = 0; _wordIndex < words.length; _wordIndex++) {
          testLine = ''.concat(line + words[_wordIndex]) + ' ';
          testWidth = this.textWidth(testLine);
          if (testWidth > maxWidth && line.length > 0) {
            this._renderText(p, line.trim(), x, y - offset, finalMaxHeight);
            line = ''.concat(words[_wordIndex]) + ' ';
            y += p.textLeading();
          } else {
            line = testLine;
          }
        }
        this._renderText(p, line.trim(), x, y - offset, finalMaxHeight);
        y += p.textLeading();
        if (baselineHacked) {
          this._textBaseline = constants.BASELINE;
        }
      }
    } else {
      var _nlines = [];
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
      var _vAlign = p.textAlign().vertical;
      if (_vAlign === constants.CENTER) {
        _offset = (_nlines.length - 1) * p.textLeading() / 2;
      } else if (_vAlign === constants.BOTTOM) {
        _offset = (_nlines.length - 1) * p.textLeading();
      }

      // Splits lines at characters, for loop adds one char at a time
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
            this._renderText(p, line.trim(), x, y - _offset, finalMaxHeight);
            y += p.textLeading();
            line = ''.concat(chars[_charIndex]);
          }
        }
      }
      this._renderText(p, line.trim(), x, y - _offset, finalMaxHeight);
      y += p.textLeading();

      if (baselineHacked) {
        this._textBaseline = constants.BASELINE;
      }
    }
  } else { // ここから引数が3つの場合の処理ですね。いずれもCENTERとBOTTOMについて特別な処理をしてる？
    // Offset to account for vertically centering multiple lines of text - no
    // need to adjust anything for vertical align top or baseline
    var _offset2 = 0;
    var _vAlign2 = p.textAlign().vertical; // この_vAlign2は消されてる。これはtextAlignの第2引数です。
    if (_vAlign2 === constants.CENTER) {
      _offset2 = (lines.length - 1) * p.textLeading() / 2; // 行数-1にLeadingの半分を掛ける。
    } else if (_vAlign2 === constants.BOTTOM) {
      _offset2 = (lines.length - 1) * p.textLeading(); // 行数-1にLeadingを掛ける
    }
    // Renders lines of text at any line breaks present in the original string
    for (var i = 0; i < lines.length; i++) {
      this._renderText(p, lines[i], x, y - _offset2, finalMaxHeight);
      y += p.textLeading(); // textLeadingをその都度足していくのよ。つまり最初のy-_offset2っていうのは最初の...
    }
  }
  return p;
};

/*
イメージする。
まずCENTERの場合ね、yって全体の真ん中になるわけだが...指定する値はたとえば3つ縦に並ぶとしてその真ん中だわね。で、
わからん...んー。
*/

// -----------------------p5.js/1.4.2の_renderText----------------------------- //

_main.default.Renderer2D.prototype._renderText = function (p, line, x, y, maxY) {
  if (y >= maxY) {
    return; // don't render lines beyond our maxY position
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

// ここで豆知識
// textLeadingの値はtextSizeを決める際に自動的にtextSizeの値の1.25倍として与えられますね。
// 独自にtextLeadingを設定したい場合はtextSizeを決めた後でtextLeadingだけ個別に設定する形になります。
// _DEFAULT_LEADMULTっていうね。これが1.25なのよ。以上。

// textSizeで_applyTextPropertiesを呼び出しててここでtextBaselineの設定をしてるっぽいね

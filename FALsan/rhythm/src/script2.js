// Title: Exotic Melody Generator
// Author: FAL
// Made with p5.js v0.5.14 (plugin: p5.sound.js v0.3.5)
// Change log:
//   Version 0.1.0  (5. Oct. 2017)  First version.
//   Version 0.1.1  (6. Oct. 2017)  Typo fix, refactoring

// クラスで書きたい

var backgroundColor;

var myMelody;
var myChordWheelArray = [];
var myMarker;
var myObserver;


/* ------- Scale --------------------------------------*/

var MusicalScale = function(scaleDegreeArray) {
  this.scaleDegreeArray = scaleDegreeArray;
  this.noteCountPerOctave = scaleDegreeArray.length;
  this.name = '';
};
MusicalScale.prototype.getFrequency = function(noteIndex) {
  return 27.5 * pow(2, this.getAbsoluteScaleDegree(noteIndex) / 12); // 27.5 Hz is the lowest A note on the standard piano.
};
MusicalScale.prototype.getNeighborNoteFrequency = function(noteIndex, chromaticScaleDegreeOffset) {
  return 27.5 * pow(2, (this.getAbsoluteScaleDegree(noteIndex) + chromaticScaleDegreeOffset) / 12);
};
MusicalScale.prototype.getOctave = function(noteIndex) {
  return floor(noteIndex / this.noteCountPerOctave);
};
MusicalScale.prototype.getScaleDegree = function(noteIndex) {
  return this.scaleDegreeArray[noteIndex % this.noteCountPerOctave];
};
MusicalScale.prototype.getAbsoluteScaleDegree = function(noteIndex) {
  return this.getOctave(noteIndex) * 12 + this.getScaleDegree(noteIndex);
};
MusicalScale.prototype.getScaleDegreeDifference = function(noteIndex1, noteIndex2) {
  return this.getAbsoluteScaleDegree(noteIndex2) - this.getAbsoluteScaleDegree(noteIndex1);
};

function toChromaticScaleDegree(array) {
  var numericDegreeArray = [];
  for (var i = 0, len = array.length; i < len; i++) {
    numericDegreeArray.push(chromaticScaleDegreeMap[array[i]]);
  }
  return numericDegreeArray;
}

var chromaticScaleDegreeMap = {
  '1': 0,
  'qb2': 0.5,
  '#1': 1,
  'b2': 1,
  '2': 2,
  '#2': 3,
  'b3': 3,
  '3': 4,
  '#3': 5,
  'b4': 4,
  '4': 5,
  '#4': 6,
  'b5': 6,
  '5': 7,
  '#5': 8,
  'b6': 8,
  '6': 9,
  '#6': 10,
  'b7': 10,
  '7': 11,
  'h#7': 11.5,
  '#7': 12,
  'b8': 11,
  '8': 12
};



/* ------- Sound --------------------------------------*/

var EnvelopedOscillator = function(oscillatorType, envelopeParameter) {
  this.envelopeParameter = envelopeParameter;
  this.oscillatorType = oscillatorType;
  this.oscillator = new p5.Oscillator();
  this.oscillator.setType(oscillatorType);
  this.envelope = new p5.Env();
  this.envelope.setADSR(envelopeParameter.attackTime, envelopeParameter.decayTime, envelopeParameter.susPercent, envelopeParameter.releaseTime);
  this.envelope.setRange(envelopeParameter.attackLevel, envelopeParameter.releaseLevel);
};
EnvelopedOscillator.prototype.play = function(frequency, startTime, sustainTime) {
  this.oscillator.freq(frequency);
  this.envelope.play(this.oscillator, startTime, sustainTime);
};
EnvelopedOscillator.prototype.clone = function() {
  return new EnvelopedOscillator(this.oscillatorType, this.envelopeParameter);
};
EnvelopedOscillator.prototype.start = function() {
  this.oscillator.amp(0);
  this.oscillator.start();
};
EnvelopedOscillator.prototype.stop = function() {
  this.oscillator.amp(0);
  this.oscillator.stop();
};
EnvelopedOscillator.prototype.connect = function(unit) {
  this.connectedUnit = unit;
  this.oscillator.disconnect();
  this.oscillator.connect(unit);
};

var ParallelEnvelopedOscillatorSet = function(baseEnvelopedOscillator, capacity) {
  this.envelopedOscillatorArray = [];
  this.capacity = capacity;
  this.currentIndex = 0;
  for (var i = 0; i < this.capacity; i++) {
    this.envelopedOscillatorArray.push(baseEnvelopedOscillator.clone());
  }
};
ParallelEnvelopedOscillatorSet.prototype.play = function(frequency, startTime, sustainTime) {
  this.envelopedOscillatorArray[this.currentIndex].play(frequency, startTime, sustainTime);
  this.currentIndex++;
  if (this.currentIndex >= this.capacity) this.currentIndex = 0;
};
ParallelEnvelopedOscillatorSet.prototype.start = function() {
  for (var i = 0, len = this.envelopedOscillatorArray.length; i < len; i++) {
    this.envelopedOscillatorArray[i].start();
  }
};
ParallelEnvelopedOscillatorSet.prototype.stop = function() {
  for (var i = 0, len = this.envelopedOscillatorArray.length; i < len; i++) {
    this.envelopedOscillatorArray[i].stop();
  }
};

// Not used:

// var BandPassParallelEnvelopedOscillatorSet = function(baseEnvelopedOscillator, capacity) {
//   function ExtendedConstructor() {
//     for (var i = 0; i < this.capacity; i++) {
//       var newFilter = new p5.BandPass();
//       this.envelopedOscillatorArray[i].oscillator.connect(newFilter);
//     }
//   }
//   ExtendedConstructor.prototype = new ParallelEnvelopedOscillatorSet(baseEnvelopedOscillator, capacity);
//   return new ExtendedConstructor();
// };
// BandPassParallelEnvelopedOscillatorSet.prototype.play = function(frequency, startTime, sustainTime) {
//   this.envelopedOscillatorArray[this.currentIndex].connectedUnit.freq(frequency);
//   ParallelEnvelopedOscillatorSet.prototype.play.call(this, frequency, startTime, sustainTime);
// };


/* ------- Melody generator --------------------------------------*/

var CheapMelodyGenerator = function(parallelOscillatorSet, eighthNoteLengthSecond, sustainTime) {
  var eighthNoteTimeLength = eighthNoteLengthSecond * 1000; // sec -> millisec

  var previousEighthNoteTimeStamp = 0;
  var currentNoteLength = 0;

  var currentScale;
  var getNoteIndex;
  var currentRule;
  var chordType = 'DEFAULT'; // DEFAULT, UNISON, NONE

  this.setRule = function(rule) {
    currentRule = rule;
  };

  this.setScale = function(scale) {
    currentScale = scale;
    getNoteIndex = getNoteIndexMethod(scale.noteCountPerOctave, 4);
  };

  this.setChordType = function(type) {
    chordType = type;
  };

  this.start = function() {
    parallelOscillatorSet.start();
  };

  this.stop = function() {
    parallelOscillatorSet.stop();
  };

  this.play = function() {
    // if (!focused) return;    // Did not work on iOS Safari
    if (!myObserver.activeChordWheel) return;

    var currentTimeStamp = millis();
    if (currentTimeStamp - previousEighthNoteTimeStamp >= eighthNoteTimeLength * currentNoteLength) {
      previousEighthNoteTimeStamp += eighthNoteTimeLength * currentNoteLength;
      if (currentTimeStamp - previousEighthNoteTimeStamp >= eighthNoteTimeLength) {
        previousEighthNoteTimeStamp = currentTimeStamp;
      }
      playNextNote();
    }
  };

  var playNextNote = function() {
    var noteIndex = getNoteIndex();

    parallelOscillatorSet.play(currentScale.getFrequency(noteIndex), 0.07, sustainTime);
    myObserver.receivePlayedNote(noteIndex);

    switch (chordType) {
      case 'DEFAULT':
        parallelOscillatorSet.play(currentScale.getFrequency(noteIndex - 2), 0.05, sustainTime);
        myObserver.receivePlayedNote(noteIndex - 2);
        break;
      case 'UNISON':
        parallelOscillatorSet.play(currentScale.getNeighborNoteFrequency(noteIndex, +12), 0.05, sustainTime);
        break;
    }

    var arrayIndex = floor(random(currentRule.noteLengthArray.length));
    currentNoteLength = currentRule.noteLengthArray[arrayIndex];
  };

  var getNoteIndexMethod = function(arrayLength, baseOctave) {
    var initialIndex = arrayLength * baseOctave;
    var minIndex = arrayLength * (baseOctave - 1);
    var maxIndex = arrayLength * (baseOctave + 1);
    var index = initialIndex;
    var indexAdditionValue = 1;
    var lockAscDescRemainingCount = 0;

    return function() {
      if (random(1) < currentRule.changePitchProbability) {
        if (random(1) < currentRule.backStepProbability & lockAscDescRemainingCount <= 0) {
          index -= indexAdditionValue * 2;
        } else {
          index += indexAdditionValue;
        }
      }

      if (index <= minIndex) {
        indexAdditionValue = 1;
        lockAscDescRemainingCount = 4;
        return index;
      }
      if (index >= maxIndex) {
        indexAdditionValue = -1;
        lockAscDescRemainingCount = 4;
        return index;
      }

      if (lockAscDescRemainingCount <= 0) {
        if (random(1) < currentRule.changeAscDescProbability) {
          indexAdditionValue = -indexAdditionValue;
        }
      } else {
        lockAscDescRemainingCount--;
      }

      return index;
    };
  };
};



/* ------- Screen elements (chord wheel & marker) and their observer  ----------------*/

var ChordWheel = function(xPosition, yPosition, displayColor, scale, chordType) {
  this.xPosition = xPosition;
  this.yPosition = yPosition;
  this.displayColor = displayColor;
  this.scale = scale;
  this.chordType = chordType;

  this.diameter = width * 0.35;
  this.radius = this.diameter * 0.5;
  this.smallCircleDiameter = this.radius * 0.2;
  this.activated = false;

  this.playedNoteEffectMaxRemainingFrameCount = 30;
  this.playedNoteEffectRemainingFrameCount = [];
  for (var i = 0; i < scale.noteCountPerOctave; i++) {
    this.playedNoteEffectRemainingFrameCount.push(0);
  }
};
ChordWheel.prototype.receivePlayedNote = function(noteIndex) {
  var indexInOctave = noteIndex % this.scale.noteCountPerOctave;
  this.playedNoteEffectRemainingFrameCount[indexInOctave] = this.playedNoteEffectMaxRemainingFrameCount;
};
ChordWheel.prototype.checkMouse = function() {
  if (dist(mouseX, mouseY, this.xPosition, this.yPosition) < this.radius) {
    if (this.activated) return;
    myObserver.receiveActivatedChordWheel(this);
    this.activated = true;
  } else {
    this.activated = false;
  }
};
ChordWheel.prototype.display = function() {
  push();
  translate(this.xPosition, this.yPosition);

  stroke(lerpColor(this.displayColor, color(192), 0.8));
  noFill();
  this.drawCircle();
  this.drawEdges();

  stroke(backgroundColor);
  fill(this.displayColor);
  this.drawSmallCircles();

  fill(96);
  text(this.scale.name, 0, 0);

  pop();
};
ChordWheel.prototype.drawCircle = function() {
  ellipse(0, 0, this.diameter, this.diameter);
};
ChordWheel.prototype.drawSmallCircles = function() {
  for (var noteIndex = 0; noteIndex < this.scale.noteCountPerOctave; noteIndex++) {
    var degree = this.scale.scaleDegreeArray[noteIndex];
    var angle = -HALF_PI + degree * TWO_PI / 12;
    var diameterFactor;
    if (this.playedNoteEffectRemainingFrameCount[noteIndex] >= 1) {
      var ratio = this.playedNoteEffectRemainingFrameCount[noteIndex] / this.playedNoteEffectMaxRemainingFrameCount;
      diameterFactor = 1 + 1.5 * pow(ratio, 3);
      this.playedNoteEffectRemainingFrameCount[noteIndex]--;
    } else {
      diameterFactor = 1;
    }
    var diameter = this.smallCircleDiameter * diameterFactor;
    ellipse(this.radius * cos(angle), this.radius * sin(angle), diameter, diameter);
  }
};
ChordWheel.prototype.drawEdges = function() {
  for (var noteIndex = 0; noteIndex < this.scale.noteCountPerOctave; noteIndex++) {
    var degree = this.scale.scaleDegreeArray[noteIndex];
    var angle = -HALF_PI + degree * TWO_PI / 12;
    for (var otherIndex = 0; otherIndex < this.scale.noteCountPerOctave; otherIndex++) {
      var indexDistance = abs(noteIndex - otherIndex);
      if (indexDistance <= 1 || this.scale.noteCountPerOctave - indexDistance <= 1) continue;
      var otherAngle = -HALF_PI + this.scale.scaleDegreeArray[otherIndex] * TWO_PI / 12;
      line(this.radius * cos(angle), this.radius * sin(angle), this.radius * cos(otherAngle), this.radius * sin(otherAngle));
    }
  }
};


var Marker = function() {
  var diameter = width * 0.45;
  var radius = diameter * 0.5;
  var ellipseDiameter = radius * 0.08;

  var xPosition = width * 0.5,
    yPosition = height * 0.5;
  var targetXPosition = xPosition,
    targetYPosition = yPosition;

  this.display = function() {
    noStroke();
    fill(192);
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12 + 0.1 * frameCount / 60) * TWO_PI;
      ellipse(xPosition + radius * cos(angle), yPosition + radius * sin(angle), ellipseDiameter, ellipseDiameter);
    }

    xPosition += (targetXPosition - xPosition) * 0.3;
    yPosition += (targetYPosition - yPosition) * 0.3;
  };

  this.setTarget = function(x, y) {
    targetXPosition = x;
    targetYPosition = y;
  };
};


var Observer = function(melodyGenerator, marker) {
  this.receivePlayedNote = function(noteIndex) {
    this.activeChordWheel.receivePlayedNote(noteIndex);
  };
  this.receiveActivatedChordWheel = function(wheel) {
    this.activeChordWheel = wheel;
    marker.setTarget(wheel.xPosition, wheel.yPosition);
    melodyGenerator.setScale(wheel.scale);
    melodyGenerator.setChordType(wheel.chordType);
  };
};



/* ------- Setup & Draw --------------------------------------*/

function setup() {
  var canvasSideLength = max(min(windowWidth, windowHeight), min(displayWidth, displayHeight) * 0.75);
  createCanvas(canvasSideLength, canvasSideLength);
  backgroundColor = color(255);

  ellipseMode(CENTER);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(height * 0.035);
  textStyle(BOLD);
  smooth();
  strokeWeight(2);

  // prepare scales
  var majorScale = new MusicalScale(toChromaticScaleDegree(['1', '2', '3', '4', '5', '6', '7']));
  majorScale.name = 'Major Scale';
  var maybeArabicScale = new MusicalScale(toChromaticScaleDegree(['1', 'b2', '3', '4', '5', 'b6', '7']));
  var maybeChineseScale = new MusicalScale(toChromaticScaleDegree(['1', 'b3', '4', 'b6', 'b7']));
  var maybeJapaneseScale = new MusicalScale(toChromaticScaleDegree(['1', 'b2', '4', '5', 'b6']));

  // prepare sound
  masterVolume(0.3);
  var envelopeParameter = {
    attackLevel: 1,
    releaseLevel: 0,
    attackTime: 0.003,
    decayTime: 0.5,
    susPercent: 0.01,
    releaseTime: 0.1
  };
  var newEnvelopedOscillator = new EnvelopedOscillator('triangle', envelopeParameter);
  var newParallelOscillatorSet = new ParallelEnvelopedOscillatorSet(newEnvelopedOscillator, 24);

  // prepare melody
  var melodyRule = {
    noteLengthArray: [1, 1, 1, 1, 1, 2, 2, 2, 3],
    changePitchProbability: 0.95,
    changeAscDescProbability: 0.17,
    backStepProbability: 0.07
  };
  var eighthNoteLengthSecond = 0.18;
  var sustainTime = 0.1;
  myMelody = new CheapMelodyGenerator(newParallelOscillatorSet, eighthNoteLengthSecond, sustainTime);
  myMelody.setRule(melodyRule);
  myMelody.start();

  // prepare chord wheels
  myChordWheelArray.push(new ChordWheel(width * 0.25, width * 0.25, color('#1D5E90'), majorScale, 'DEFAULT'));
  myChordWheelArray.push(new ChordWheel(width * 0.75, width * 0.25, color('#E08E21'), maybeArabicScale, 'UNISON'));
  myChordWheelArray.push(new ChordWheel(width * 0.25, width * 0.75, color('#E03721'), maybeChineseScale, 'DEFAULT'));
  myChordWheelArray.push(new ChordWheel(width * 0.75, width * 0.75, color('#19AB3E'), maybeJapaneseScale, 'DEFAULT'));

  // prepare other
  myMarker = new Marker();
  myObserver = new Observer(myMelody, myMarker);
}

function draw() {
  background(backgroundColor);

  for (var i = 0, len = myChordWheelArray.length; i < len; i++) {
    myChordWheelArray[i].checkMouse();
    myChordWheelArray[i].display();
  }
  myMarker.display();

  myMelody.play();
}

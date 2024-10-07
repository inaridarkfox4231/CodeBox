// This tab is independent.
// Last update: 1. Oct. 2017

// But still I'm not sure if these conversions are really correct!!

abstract class AbstractColor
{
  abstract color toColor(float maxValue);
  color toColor() {
    return toColor(255.0);
  }
}

abstract class RgbColor
  extends AbstractColor
{
  final float redFactor, greenFactor, blueFactor;

  RgbColor(float rFac, float gFac, float bFac) {
    redFactor = rFac;
    greenFactor = gFac;
    blueFactor = bFac;
  }
  color toColor(float maxValue) {
    return color(redFactor * maxValue, greenFactor * maxValue, blueFactor * maxValue);
  }
}

final class StandardRgbColor
  extends RgbColor
{
  StandardRgbColor(float rFac, float gFac, float bFac) {
    super(rFac, gFac, bFac);
  }
}

final class LinearRgbColor
  extends RgbColor
{
  LinearRgbColor(float rFac, float gFac, float bFac) {
    super(rFac, gFac, bFac);
  }
  LinearRgbColor(float rVal, float gVal, float bVal, float maxVal) {
    this(rVal / maxVal, gVal / maxVal, bVal / maxVal);
  }
  LinearRgbColor(color rgbColor, float maxVal) {
    this(((rgbColor >> 16) & 0xFF), ((rgbColor >> 8) & 0xFF), (rgbColor & 0xFF), maxVal);
    //    alphaValue = ((rgbColor >> 24) & 0xFF);
  }

  StandardRgbColor toSrgbColor() {
    return new StandardRgbColor(degamma(redFactor), degamma(greenFactor), degamma(blueFactor));
  }
  float degamma(float value) {
    if ( value <= 0.0031308 ) return 12.92 * value;
    else return 1.055 * ( pow(value, 1 / 2.4) ) - 0.055;
  }

  XyzColor toXyzColor() {
    final float xValue = 0.4124 * redFactor + 0.3576 * greenFactor + 0.1805 * blueFactor;
    final float yValue = 0.2126 * redFactor + 0.7152 * greenFactor + 0.0722 * blueFactor;
    final float zValue = 0.0193 * redFactor + 0.1192 * greenFactor + 0.9505 * blueFactor;
    return new XyzColor(xValue, yValue, zValue);
  }

  String toString() {
    return round(redFactor * 255.0) + ", " + round(greenFactor * 255.0) + ", " + round(blueFactor * 255.0);
  }
}



final class CielabColor
  extends AbstractColor
{
  // D65/2° standard illuminant.
  final float tristimulusValueX = 0.95047;
  final float tristimulusValueY = 1.00000;
  final float tristimulusValueZ = 1.08883;

  final float lValue, aValue, bValue;

  CielabColor(float l, float a, float b) {
    lValue = l;
    aValue = a;
    bValue = b;
  }

  color toColor(float maxValue) {
    return toXyzColor().toColor(maxValue);
  }

  float getHue() {
    return atan2(bValue, aValue);
  }
  float getSaturation() {
    return 100.0 * getChroma() / dist(0.0, 0.0, 0.0, lValue, aValue, bValue);
  }
  float getChroma() {
    return sqrt(sq(aValue) + sq(bValue));
  }

  XyzColor toXyzColor() {
    final float yFactor = (lValue + 16.0) / 116.0;
    final float xFactor = yFactor + aValue / 500.0;
    final float zFactor = yFactor - bValue / 200.0;

    final float xValue = tristimulusValueX * toXyzColorFunc(xFactor);
    final float yValue = tristimulusValueY * toXyzColorFunc(yFactor);
    final float zValue = tristimulusValueZ * toXyzColorFunc(zFactor);

    return new XyzColor(constrain(xValue, 0.0, 1.0), constrain(yValue, 0.0, 1.0), constrain(zValue, 0.0, 1.0));
  }

  float toXyzColorFunc(float value) {
    final float delta = 6.0 / 29.0;
    if (value > delta) return value * value * value;
    else return (value - 16.0 / 116.0) * 3.0 * delta * delta;
  }

  String toString() {
    return "l: " + round(lValue) + ", a: " + round(aValue) + ", b: " + round(bValue);
  }

  String toRgbString() {
    final color c = this.toColor(255.0);
    return int(red(c)) + ", " + int(green(c)) + ", " + int(blue(c)) + " (#" + hex(c, 6) + ")";
  }
}



final class XyzColor
  extends AbstractColor
{
  // D65/2° standard illuminant.
  final float tristimulusValueX = 0.95047;
  final float tristimulusValueY = 1.00000;
  final float tristimulusValueZ = 1.08883;

  // Value range: 0 to 1
  final float xValue, yValue, zValue;

  XyzColor(float x, float y, float z) {
    xValue = x;
    yValue = y;
    zValue = z;
  }

  color toColor(float maxValue) {
    return toLinearRgbColor().toSrgbColor().toColor(maxValue);
  }

  LinearRgbColor toLinearRgbColor() {
    final float redFactor = (3.2404542 * xValue - 1.5371385 * yValue - 0.4985314 * zValue);
    final float greenFactor = ( -0.9692660 * xValue + 1.8760108 * yValue + 0.0415560 * zValue);
    final float blueFactor = ( 0.0556434 * xValue - 0.2040259 * yValue + 1.0572252 * zValue);

    return new LinearRgbColor(constrain(redFactor, 0.0, 1.0), constrain(greenFactor, 0.0, 1.0), constrain(blueFactor, 0.0, 1.0));
  }

  CielabColor toCielabColor() {
    final float xFracXn = xValue / tristimulusValueX;
    final float yFracYn = yValue / tristimulusValueY;
    final float zFracZn = zValue / tristimulusValueZ;
    final float lValue = 116.0 * toCielabColorFunc(yFracYn) - 16.0;
    final float aValue = 500.0 * (toCielabColorFunc(xFracXn) - toCielabColorFunc(yFracYn));
    final float bValue = 200.0 * (toCielabColorFunc(yFracYn) - toCielabColorFunc(zFracZn));
    return new CielabColor(lValue, aValue, bValue);
  }
  private float toCielabColorFunc(float value) {
    final float delta = 6.0 / 29.0;
    if (value > pow(delta, 3.0)) return pow(value, 1.0 / 3.0);
    else return (1.0 / 3.0) * sq(delta) * value + 16.0 / 116.0;
  }

  String toString() {
    return "X: " + round(xValue * 100.0) / 100.0 + ", Y: " + round(yValue * 100.0) / 100.0 + ", Z: " + round(zValue * 100.0) / 100.0;
  }
}



// for converting directly without creating instances
color cielabColor(float lValue, float aValue, float bValue) {
  // D65/2° standard illuminant.
  final float tristimulusValueX = 0.95047;
  final float tristimulusValueY = 1.00000;
  final float tristimulusValueZ = 1.08883;

  final float yFactor = (lValue + 16.0) / 116.0;
  final float xFactor = yFactor + aValue / 500.0;
  final float zFactor = yFactor - bValue / 200.0;

  final float xValue = constrain(tristimulusValueX * toXyzColorFunc(xFactor), 0.0, 1.0);
  final float yValue = constrain(tristimulusValueY * toXyzColorFunc(yFactor), 0.0, 1.0);
  final float zValue = constrain(tristimulusValueZ * toXyzColorFunc(zFactor), 0.0, 1.0);

  final float redFactor =   ( 3.2404542 * xValue - 1.5371385 * yValue - 0.4985314 * zValue);
  final float greenFactor = (-0.9692660 * xValue + 1.8760108 * yValue + 0.0415560 * zValue);
  final float blueFactor =  ( 0.0556434 * xValue - 0.2040259 * yValue + 1.0572252 * zValue);

  return color(degamma(constrain(redFactor, 0.0, 1.0)) * 255.0, degamma(constrain(greenFactor, 0.0, 1.0)) * 255.0, degamma(constrain(blueFactor, 0.0, 1.0)) * 255.0);
}

float toXyzColorFunc(float value) {
  final float delta = 6.0 / 29.0;
    if (value > delta) return value * value * value;
    else return (value - 16.0 / 116.0) * 3.0 * delta * delta;
}

float degamma(float value) {
  if (value <= 0.0031308) return 12.92 * value;
  else return 1.055 * pow(value, 1.0 / 2.4) - 0.055;
}

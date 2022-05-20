/**
 * p5-extension
 *
 * An extension for p5.js.
 * GitHub repository: {@link https://github.com/fal-works/p5-extension}
 *
 * @module p5-extension
 * @copyright 2019 FAL
 * @author FAL <contact@fal-works.com>
 * @license MIT
 * @version 0.6.1
 */

(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory(
        exports,
        require("p5"),
        require("@fal-works/creative-coding-core")
      )
    : typeof define === "function" && define.amd
    ? define(["exports", "p5", "@fal-works/creative-coding-core"], factory)
    : ((global = global || self),
      factory((global.p5ex = {}), global.p5, global.CreativeCodingCore));
})(this, function(exports, p5, CCC) {
  "use strict";

  p5 = p5 && p5.hasOwnProperty("default") ? p5["default"] : p5;

  const {
    HtmlUtility,
    RectangleRegion,
    FitBox,
    Arrays: {
      FullName: { loopArray, unifyToArray }
    },
    ArrayList,
    Vector2D,
    Vector2D: {
      FullName: {
        vectorFromPolar,
        copyVector,
        zeroVector,
        constrainVector,
        setCartesian
      }
    },
    Coordinates2D: { distance },
    Numeric: { sin, cos, round, lerp, inverseLerp, max2, clamp },
    MathConstants: { ONE_OVER_SQUARE_ROOT_TWO, INVERSE255 },
    Random: {
      FullName: { randomValue, randomSigned }
    },
    Angle,
    Angle: { TWO_PI },
    HSV,
    ConstantFunction,
    ConstantFunction: { returnVoid },
    Tween,
    Timer
  } = CCC;

  /**
   * The shared `p5` instance.
   */
  /**
   * Sets the given `p5` instance to be shared.
   * @param instance
   */
  const setP5Instance = instance => {
    exports.p = instance;
    exports.renderer = exports.p;
  };
  /**
   * Sets the given `ScaledCanvas` instance to be shared.
   * @param scaledCanvas
   */
  const setCanvas = scaledCanvas => {
    exports.canvas = scaledCanvas;
  };
  /**
   * Sets the given `ScaledCanvas` instance to be shared.
   * This will affect many drawing functions of p5-extension.
   * @param rendererInstance
   */
  const setRenderer = rendererInstance => {
    exports.renderer = rendererInstance;
  };

  /**
   * Creates a new `p5.Color` instance from `color`.
   * @param color Either a grayness value, a color code string, an array of color values or another `p5.Color` instance.
   * @returns A new `p5.Color` instance.
   */
  const parseColor = color =>
    color instanceof p5.Color ? Object.create(color) : exports.p.color(color);
  /**
   * Creates a function that applies a stroke color.
   * @param color `null` will be `noStroke()` and `undefined` will have no effects.
   * @returns A function that runs either `stroke()`, `noStroke()` or nothing.
   */
  const parseStroke = color => {
    if (color === null) return () => exports.renderer.noStroke();
    if (color === undefined) return returnVoid;
    const colorObject = parseColor(color);
    return () => exports.renderer.stroke(colorObject);
  };
  /**
   * Creates a function that applies a fill color.
   * @param color `null` will be `noFill()` and `undefined` will have no effects.
   * @returns A function that runs either `fill()`, `noFill()` or nothing.
   */
  const parseFill = color => {
    if (color === null) return () => exports.renderer.noFill();
    if (color === undefined) return returnVoid;
    const colorObject = parseColor(color);
    return () => exports.renderer.fill(colorObject);
  };
  /**
   * Creates a new `p5.Color` instance by replacing the alpha value with `alpha`.
   * The color mode should be `RGB` when using this function.
   * @param color
   * @param alpha
   */
  const colorWithAlpha = (color, alpha) => {
    const colorObject = parseColor(color);
    return exports.p.color(
      exports.p.red(colorObject),
      exports.p.green(colorObject),
      exports.p.blue(colorObject),
      alpha
    );
  };
  /**
   * Creates a new color by reversing each RGB value of the given `color`.
   * The alpha value will remain the same.
   * Be sure that the color mode is set to RGB ∈ [0, 255].
   * @param color
   * @returns New `p5.Color` instance with reversed RGB values.
   */
  const reverseColor = color =>
    exports.p.color(
      255 - exports.p.red(color),
      255 - exports.p.green(color),
      255 - exports.p.blue(color),
      exports.p.alpha(color)
    );
  /**
   * Creates a new color from HSV values.
   * Be sure that the color mode is set to RGB (red, green, blue, alpha ∈ [0, 255]).
   * @param hue [0, 360]
   * @param saturation [0, 1]
   * @param value [0, 1]
   * @param alpha [0, 255]
   * @returns New `p5.Color` instance.
   */
  const hsvColor = (hue, saturation, value, alpha = 255) => {
    const [r, g, b] = HSV.toRGB([hue, saturation, value]);
    return exports.p.color(r * 255, g * 255, b * 255, alpha);
  };
  /**
   * Converts a `p5.Color` instance to an object representation.
   * @param color
   * @returns RGB values.
   */
  const colorToRGB = color => {
    return {
      r: exports.p.red(color),
      g: exports.p.green(color),
      b: exports.p.blue(color)
    };
  };
  /**
   * Converts a `p5.Color` instance to an object representation.
   * @param color
   * @returns ARGB values.
   */
  const colorToARGB = color => {
    return {
      a: exports.p.alpha(color),
      r: exports.p.red(color),
      g: exports.p.green(color),
      b: exports.p.blue(color)
    };
  };

  /**
   * Creats an `AlphaColor` unit.
   * The max alpha of `stroke()` and `fill()` should be set to `255` when using this function.
   * @param color
   * @param resolution
   */
  const create = (color, resolution) => {
    const colors = new Array(resolution);
    const maxIndex = resolution - 1;
    const baseColor = parseColor(color);
    if (resolution === 1) {
      colors[0] = baseColor;
    } else {
      const baseAlpha = exports.p.alpha(baseColor);
      for (let i = 1; i < resolution; i += 1) {
        const alpha = baseAlpha * (i / maxIndex);
        colors[i] = colorWithAlpha(baseColor, alpha);
      }
    }
    return {
      colors,
      maxIndex
    };
  };
  /**
   * Gets a `p5.Color` instance.
   * @param alphaColor
   * @param alpha Alpha value from `0` to `255`.
   * @returns A `p5.Color` instance.
   */
  const get = (alphaColor, alpha) =>
    alphaColor.colors[round(alphaColor.maxIndex * alpha * INVERSE255)];

  const alphaColor = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    create: create,
    get: get
  });

  /**
   * A list of functions that will be called in `p.setup()` just after creating canvas in `startSketch()`.
   */
  const onSetup = [];

  const overwrite = (shapeColor, strokeColor, fillColor, alphaResolution) => {
    if (alphaResolution === 1) {
      shapeColor.stroke = parseStroke(strokeColor);
      shapeColor.fill = parseFill(fillColor);
      return shapeColor;
    }
    if (strokeColor === null) {
      shapeColor.stroke = () => exports.renderer.noStroke();
    } else if (strokeColor === undefined) {
      shapeColor.stroke = returnVoid;
    } else {
      const strokeAlphaColor = create(strokeColor, alphaResolution);
      shapeColor.stroke = alpha =>
        exports.renderer.stroke(get(strokeAlphaColor, alpha));
    }
    if (fillColor === null) {
      shapeColor.fill = () => exports.renderer.noFill();
    } else if (fillColor === undefined) {
      shapeColor.fill = returnVoid;
    } else {
      const fillAlphaColor = create(fillColor, alphaResolution);
      shapeColor.fill = alpha =>
        exports.renderer.fill(get(fillAlphaColor, alpha));
    }
    return shapeColor;
  };
  /**
   * Creates a `ShapeColor` unit.
   * The max alpha of `stroke()` and `fill()` should be set to `255` when using this function.
   * @param strokeColor `null` will be `noStroke()` and `undefined` will have no effects.
   * @param fillColor `null` will be `noFill()` and `undefined` will have no effects.
   * @param alphaResolution
   */
  const create$1 = (strokeColor, fillColor, alphaResolution) => {
    const shapeColor = {
      stroke: returnVoid,
      fill: returnVoid
    };
    const prepareShapeColor = overwrite.bind(
      undefined,
      shapeColor,
      strokeColor,
      fillColor,
      alphaResolution
    );
    if (exports.p) return prepareShapeColor();
    onSetup.push(prepareShapeColor);
    return shapeColor;
  };
  /**
   * Applies the stroke and fill colors.
   * @param shapeColor
   * @param alpha Alpha value from `0` to `255`.
   */
  const apply = (shapeColor, alpha) => {
    if (alpha < 1) {
      exports.renderer.noStroke();
      exports.renderer.noFill();
      return;
    }
    shapeColor.stroke(alpha);
    shapeColor.fill(alpha);
  };

  const shapeColor = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    create: create$1,
    apply: apply
  });

  /**
   * Stores the current canvas pixels and returns a function that restores them.
   * @param renderer - Instance of either p5 or p5.Graphics. Defaults to shared `p`.
   * @param prepareCallback - Function that will be run just before `loadPixels()`.
   * @returns A function that restores the canvas pixels.
   */
  const storePixels = (renderer = exports.p, prepareCallback) => {
    if (prepareCallback) {
      renderer.push();
      prepareCallback(renderer);
      renderer.pop();
    }
    renderer.loadPixels();
    const storedPixels = renderer.pixels;
    return () => {
      renderer.pixels = storedPixels;
      renderer.updatePixels();
    };
  };
  /**
   * Creates a function for setting color to the specified point.
   * Should be used in conjunction with loadPixels() and updatePixels().
   * @param renderer - Instance of either p5 or p5.Graphics.
   * @param logicalX - The logical x index of the point.
   * @param logicalY - The logical y index of the point.
   * @param red - The red value (0 - 255).
   * @param green - The green value (0 - 255).
   * @param blue - The blue value (0 - 255).
   */
  const createSetPixel = (renderer = exports.p) => {
    const density = renderer.pixelDensity();
    const pixelWidth = renderer.width * density;
    const { pixels } = renderer;
    return (logicalX, logicalY, red, green, blue, alpha) => {
      const startX = logicalX * density;
      const endX = startX + density;
      const startY = logicalY * density;
      const endY = startY + density;
      for (let y = startY; y < endY; y += 1) {
        const pixelIndexAtX0 = y * pixelWidth;
        for (let x = startX; x < endX; x += 1) {
          const valueIndex = 4 * (pixelIndexAtX0 + x);
          pixels[valueIndex] = red;
          pixels[valueIndex + 1] = green;
          pixels[valueIndex + 2] = blue;
          pixels[valueIndex + 3] = alpha;
        }
      }
    };
  };
  /**
   * Creates a function for setting color to the specified row of pixels.
   * Should be used in conjunction with loadPixels() and updatePixels().
   * @param renderer - Instance of either p5 or p5.Graphics.
   * @param logicalY - The logical y index of the pixel row.
   * @param red - The red value (0 - 255).
   * @param green - The green value (0 - 255).
   * @param blue - The blue value (0 - 255).
   * @param alpha - The alpha value (0 - 255).
   */
  const createSetPixelRow = (renderer = exports.p) => {
    const density = renderer.pixelDensity();
    const pixelWidth = renderer.width * density;
    const { pixels } = renderer;
    return (logicalY, red, green, blue, alpha) => {
      const startY = logicalY * density;
      const endY = startY + density;
      for (let y = startY; y < endY; y += 1) {
        const pixelIndexAtX0 = y * pixelWidth;
        for (let x = 0; x < pixelWidth; x += 1) {
          const valueIndex = 4 * (pixelIndexAtX0 + x);
          pixels[valueIndex] = red;
          pixels[valueIndex + 1] = green;
          pixels[valueIndex + 2] = blue;
          pixels[valueIndex + 3] = alpha;
        }
      }
    };
  };

  /**
   * Runs `drawCallback` translated with `offsetX` and `offsetY`,
   * then restores the transformation by calling `translate()` with negative values.
   * Used to avoid calling `push()` and `pop()` frequently.
   *
   * @param drawCallback
   * @param offsetX
   * @param offsetY
   */
  const drawTranslated = (drawCallback, offsetX, offsetY) => {
    exports.renderer.translate(offsetX, offsetY);
    drawCallback();
    exports.renderer.translate(-offsetX, -offsetY);
  };
  /**
   * Runs `drawCallback` rotated with `angle`,
   * then restores the transformation by calling `rotate()` with the negative value.
   * Used to avoid calling `push()` and `pop()` frequently.
   *
   * @param drawCallback
   * @param angle
   */
  const drawRotated = (drawCallback, angle) => {
    exports.renderer.rotate(angle);
    drawCallback();
    exports.renderer.rotate(-angle);
  };
  /**
   * Composite of `drawTranslated()` and `drawRotated()`.
   *
   * @param drawCallback
   * @param offsetX
   * @param offsetY
   * @param angle
   */
  const drawTranslatedAndRotated = (drawCallback, offsetX, offsetY, angle) => {
    exports.renderer.translate(offsetX, offsetY);
    drawRotated(drawCallback, angle);
    exports.renderer.translate(-offsetX, -offsetY);
  };
  /**
   * Runs `drawCallback` scaled with `scaleFactor`,
   * then restores the transformation by scaling with the inversed factor.
   * Used to avoid calling `push()` and `pop()` frequently.
   *
   * @param drawCallback
   * @param scaleFactor
   */
  const drawScaled = (drawCallback, scaleFactor) => {
    exports.renderer.scale(scaleFactor);
    drawCallback();
    exports.renderer.scale(1 / scaleFactor);
  };
  /**
   * Composite of `drawTranslated()` and `drawScaled()`.
   *
   * @param drawCallback
   * @param offsetX
   * @param offsetY
   * @param scaleFactor
   */
  const drawTranslatedAndScaled = (
    drawCallback,
    offsetX,
    offsetY,
    scaleFactor
  ) => {
    exports.renderer.translate(offsetX, offsetY);
    drawScaled(drawCallback, scaleFactor);
    exports.renderer.translate(-offsetX, -offsetY);
  };
  /**
   * Composite of `drawTranslated()`, `drawRotated()` and `drawScaled()`.
   *
   * @param drawCallback
   * @param offsetX
   * @param offsetY
   * @param angle
   * @param scaleFactor
   */
  const drawTransformed = (
    drawCallback,
    offsetX,
    offsetY,
    angle,
    scaleFactor
  ) => {
    exports.renderer.translate(offsetX, offsetY);
    exports.renderer.rotate(angle);
    exports.renderer.scale(scaleFactor);
    drawCallback();
    exports.renderer.scale(1 / scaleFactor);
    exports.renderer.rotate(-angle);
    exports.renderer.translate(-offsetX, -offsetY);
  };
  let lastTranslateX = 0;
  let lastTranslateY = 0;
  let lastRotateAngle = 0;
  let lastScaleFactor = 1;
  /**
   * Runs `translate()`. The given arguments will be saved.
   *
   * Note: Do not switch renderer with `setRenderer()` before undoing this operation with `undoTranslate()`.
   * @param x
   * @param y
   */
  const translate = (x, y) => {
    lastTranslateX = x;
    lastTranslateY = y;
    exports.renderer.translate(x, y);
  };
  /**
   * Applies the inverse of the last transformation by `translate()`.
   */
  const undoTranslate = () => {
    exports.renderer.translate(-lastTranslateX, -lastTranslateY);
  };
  /**
   * Runs `rotate()`. The given argument will be saved.
   *
   * Note: Do not switch renderer with `setRenderer()` before undoing this operation with `undoRotate()`.
   * @param angle
   */
  const rotate = angle => {
    lastRotateAngle = angle;
    exports.renderer.rotate(angle);
  };
  /**
   * Applies the inverse of the last transformation by `rotate()`.
   */
  const undoRotate = () => {
    exports.renderer.rotate(-lastRotateAngle);
  };
  /**
   * Runs `scale()`. The given argument will be saved.
   *
   * Note: Do not switch renderer with `setRenderer()` before undoing this operation with `undoScale()`.
   * @param scaleFactor
   */
  const scale = scaleFactor => {
    lastScaleFactor = scaleFactor;
    exports.renderer.scale(scaleFactor);
  };
  /**
   * Applies the inverse of the last transformation by `scale()`.
   */
  const undoScale = () => {
    exports.renderer.scale(1 / lastScaleFactor);
  };
  /**
   * Runs `translate()` and `rotate()`. The given arguments will be saved.
   *
   * Note: Do not switch renderer with `setRenderer()` before undoing this operation with `undoTranslateRotate()`.
   * @param x
   * @param y
   * @param angle
   */
  const translateRotate = (x, y, angle) => {
    lastTranslateX = x;
    lastTranslateY = y;
    lastRotateAngle = angle;
    exports.renderer.translate(x, y);
    exports.renderer.rotate(angle);
  };
  /**
   * Applies the inverse of the last transformation by `translateRotate()`.
   */
  const undoTranslateRotate = () => {
    exports.renderer.rotate(-lastRotateAngle);
    exports.renderer.translate(-lastTranslateX, -lastTranslateY);
  };
  /**
   * Runs `translate()` and `scale()`. The given arguments will be saved.
   *
   * Note: Do not switch renderer with `setRenderer()` before undoing this operation with `undoTranslateScale()`.
   * @param x
   * @param y
   * @param scaleFactor
   */
  const translateScale = (x, y, scaleFactor) => {
    lastTranslateX = x;
    lastTranslateY = y;
    lastScaleFactor = scaleFactor;
    exports.renderer.translate(x, y);
    exports.renderer.scale(scaleFactor);
  };
  /**
   * Applies the inverse of the last transformation by `translateScale()`.
   */
  const undoTranslateScale = () => {
    exports.renderer.scale(1 / lastScaleFactor);
    exports.renderer.translate(-lastTranslateX, -lastTranslateY);
  };
  /**
   * Runs `rotate()` and `scale()`. The given arguments will be saved.
   *
   * Note: Do not switch renderer with `setRenderer()` before undoing this operation with `undoRotateScale()`.
   * @param angle
   * @param scaleFactor
   */
  const rotateScale = (angle, scaleFactor) => {
    lastRotateAngle = angle;
    lastScaleFactor = scaleFactor;
    exports.renderer.rotate(angle);
    exports.renderer.scale(scaleFactor);
  };
  /**
   * Applies the inverse of the last transformation by `rotateScale()`.
   */
  const undoRotateScale = () => {
    exports.renderer.scale(1 / lastScaleFactor);
    exports.renderer.rotate(-lastRotateAngle);
  };
  /**
   * Runs `translate()`, `rotate()` and `scale()`. The given arguments will be saved.
   *
   * Note: Do not switch renderer with `setRenderer()` before undoing this operation with `undoTransform()`.
   * @param x
   * @param y
   * @param angle
   * @param scaleFactor
   */
  const transform = (x, y, angle, scaleFactor) => {
    lastTranslateX = x;
    lastTranslateY = y;
    lastRotateAngle = angle;
    lastScaleFactor = scaleFactor;
    exports.renderer.translate(x, y);
    exports.renderer.rotate(angle);
    exports.renderer.scale(scaleFactor);
  };
  /**
   * Applies the inverse of the last transformation by `transform()`.
   */
  const undoTransform = () => {
    exports.renderer.scale(1 / lastScaleFactor);
    exports.renderer.rotate(-lastRotateAngle);
    exports.renderer.translate(-lastTranslateX, -lastTranslateY);
  };

  /**
   * similar to p5 `curveVertex()` but takes a 2d-vector as argument.
   * @param vector
   */
  const curveVertexFromVector = vector =>
    exports.renderer.curveVertex(vector.x, vector.y);
  /**
   * Draws a curve through `vertices`.
   * @param vertices
   */
  const drawCurve = vertices => {
    const { length } = vertices;
    exports.renderer.beginShape();
    curveVertexFromVector(vertices[0]);
    for (let i = 0; i < length; i += 1) curveVertexFromVector(vertices[i]);
    curveVertexFromVector(vertices[length - 1]);
    exports.renderer.endShape();
  };
  /**
   * Draws a curve through `vertices`, smoothly connecting the first and last vertex.
   * @param vertices
   */
  const drawCurveClosed = vertices => {
    const { length } = vertices;
    exports.renderer.beginShape();
    for (let i = 0; i < length; i += 1) curveVertexFromVector(vertices[i]);
    for (let i = 0; i < 3; i += 1) curveVertexFromVector(vertices[i]);
    exports.renderer.endShape();
  };

  const drawPath = path => {
    const { controlPoint1, controlPoint2, targetPoint } = path;
    exports.renderer.bezierVertex(
      controlPoint1.x,
      controlPoint1.y,
      controlPoint2.x,
      controlPoint2.y,
      targetPoint.x,
      targetPoint.y
    );
  };
  const drawBezierCurve = curve => {
    const { startPoint, paths } = curve;
    exports.renderer.vertex(startPoint.x, startPoint.y);
    loopArray(paths, drawPath);
  };
  const drawControlLine = vertex => {
    const { point, controlLine } = vertex;
    const { x, y } = point;
    const controlPointOffset = vectorFromPolar(
      0.5 * controlLine.length,
      controlLine.angle
    );
    const controlX = controlPointOffset.x;
    const controlY = controlPointOffset.y;
    exports.renderer.line(
      x - controlX,
      y - controlY,
      x + controlX,
      y + controlY
    );
  };
  const drawBezierControlLines = vertices => {
    loopArray(vertices, drawControlLine);
  };

  const graphicsToImage = graphics => {
    const g = graphics;
    const { width, height } = g;
    const image = exports.p.createImage(width, height);
    image.copy(graphics, 0, 0, width, height, 0, 0, width, height);
    return image;
  };

  let shakeFactor = 0;
  let shakeDecayFactor = 0;
  let shakeType = "DEFAULT";
  const setShake = (
    initialFactor,
    decayFactor,
    type = "DEFAULT",
    force = false
  ) => {
    if (decayFactor >= 1) return;
    if (!force && shakeFactor !== 0) return;
    shakeFactor = initialFactor;
    shakeDecayFactor = decayFactor;
    shakeType = type;
  };
  const applyShake = () => {
    if (shakeFactor === 0) return;
    const { width, height } = exports.canvas.logicalSize;
    const xShake =
      shakeType === "VERTICAL" ? 0 : randomSigned(shakeFactor * width);
    const yShake =
      shakeType === "HORIZONTAL" ? 0 : randomSigned(shakeFactor * height);
    exports.p.translate(xShake, yShake);
    shakeFactor *= shakeDecayFactor;
    if (shakeFactor < 0.001) shakeFactor = 0;
  };

  const line = (from, to) => exports.renderer.line(from.x, from.y, to.x, to.y);
  const lineWithMargin = (from, to, margin) => {
    const angle = Angle.betweenPoints(from, to);
    const offsetX = margin * cos(angle);
    const offsetY = margin * sin(angle);
    return exports.renderer.line(
      from.x + offsetX,
      from.y + offsetY,
      to.x - offsetX,
      to.y - offsetY
    );
  };
  const lineAtOrigin = destination =>
    exports.renderer.line(0, 0, destination.x, destination.y);
  const circleAtOrigin = size => exports.renderer.circle(0, 0, size);
  const arcAtOrigin = (width, height, startRatio, endRatio, mode, detail) =>
    exports.renderer.arc(
      0,
      0,
      width,
      height,
      startRatio * TWO_PI,
      endRatio * TWO_PI,
      mode,
      detail
    );
  const circularArcAtOrigin = (size, startRatio, endRatio, mode, detail) =>
    exports.renderer.arc(
      0,
      0,
      size,
      size,
      startRatio * TWO_PI,
      endRatio * TWO_PI,
      mode,
      detail
    );

  /**
   * Draws texture on `renderer` by applying `runSetPixel` to each coordinate.
   * @param runSetPixel - A function that takes `setPixel`, `x`, `y` as arguments and internally runs `setPixel`.
   * @param renderer - Instance of either p5 or p5.Graphics. Defaults to the shared `p`.
   */
  const drawTexture = (runSetPixel, renderer = exports.p) => {
    const { width, height } = renderer;
    renderer.loadPixels();
    const setPixel = createSetPixel(renderer);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        runSetPixel(setPixel, x, y);
      }
    }
    renderer.updatePixels();
  };
  /**
   * Creates a texture by applying `runSetPixel` to each coordinate of a new `p5.Graphics` instance.
   * @param widht
   * @param height
   * @param runSetPixel - A function that takes `setPixel`, `x`, `y` as arguments and internally runs `setPixel`.
   * @returns New `p5.Graphics` instance.
   */
  const createTexture = (width, height, runSetPixel) => {
    const graphics = exports.p.createGraphics(width, height);
    drawTexture(runSetPixel, graphics);
    return graphics;
  };
  /**
   * Draws texture on `renderer` by applying `runSetPixelRow` to each y coordinate.
   * @param runSetPixelRow - A function that takes `setPixelRow` and `y` as arguments and internally runs `setPixel`.
   * @param renderer - Instance of either p5 or p5.Graphics. Defaults to the shared `p`.
   */
  const drawTextureRowByRow = (runSetPixelRow, renderer = exports.p) => {
    const { height } = renderer;
    renderer.loadPixels();
    const setPixelRow = createSetPixelRow(renderer);
    for (let y = 0; y < height; y += 1) runSetPixelRow(setPixelRow, y);
    renderer.updatePixels();
  };
  /**
   * Creates a texture by applying `runSetPixelRow` to each y coordinate of a new `p5.Graphics` instance.
   * @param width
   * @param height
   * @param runSetPixelRow - A function that takes `setPixelRow` and `y` as arguments and internally runs `setPixel`.
   * @returns New `p5.Graphics` instance.
   */
  const createTextureRowByRow = (width, height, runSetPixelRow) => {
    const graphics = exports.p.createGraphics(width, height);
    drawTextureRowByRow(runSetPixelRow, graphics);
    return graphics;
  };

  /**
   * Draws a trimmed line between [`x1`, `y1`] and [`x2`, `y2`] using the given trimming ratios.
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   * @param startRatio - A number between 0 and 1.
   * @param endRatio - A number between 0 and 1.
   */
  const draw = (x1, y1, x2, y2, startRatio, endRatio) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    exports.renderer.line(
      x1 + startRatio * dx,
      y1 + startRatio * dy,
      x1 + endRatio * dx,
      y1 + endRatio * dy
    );
  };
  /**
   * Creates a function that draws a trimmed line between [`x1`, `y1`] and [`x2`, `y2`].
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   * @returns A new drawing function.
   */
  const create$2 = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return (startRatio, endRatio) =>
      exports.renderer.line(
        x1 + startRatio * dx,
        y1 + startRatio * dy,
        x1 + endRatio * dx,
        y1 + endRatio * dy
      );
  };

  const line$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    draw: draw,
    create: create$2
  });

  /**
   * Draws a trimmed ellipse at [`x`, `y`] using the given size and trimming ratios.
   * @param x
   * @param y
   * @param sizeX
   * @param sizeY
   * @param startRatio - A number between 0 and 1.
   * @param endRatio - A number between 0 and 1.
   * @param mode - Either `CHORD`, `PIE` or `OPEN`.
   * @param detail - For WebGL only. Defaults to `25`.
   */
  const draw$1 = (x, y, sizeX, sizeY, startRatio, endRatio, mode, detail) => {
    if (startRatio === endRatio) return;
    exports.renderer.arc(
      x,
      y,
      sizeX,
      sizeY,
      startRatio * TWO_PI,
      endRatio * TWO_PI,
      mode,
      detail
    );
  };
  /**
   * Creates a function that draws a trimmed ellipse at [`x`, `y`] with the given size.
   * @param x
   * @param y
   * @param sizeX
   * @param sizeY
   * @param mode - Either `CHORD`, `PIE` or `OPEN`.
   * @param detail - For WebGL only. Defaults to `25`.
   * @returns A new drawing function.
   */
  const create$3 = (x, y, sizeX, sizeY, mode, detail) => (
    startRatio,
    endRatio
  ) => draw$1(x, y, sizeX, sizeY, startRatio, endRatio, mode, detail);

  const ellipse = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    draw: draw$1,
    create: create$3
  });

  /**
   * Draws a trimmed circle at [`x`, `y`] using the given size and trimming ratios.
   * @param x
   * @param y
   * @param size
   * @param startRatio - A number between 0 and 1.
   * @param endRatio - A number between 0 and 1.
   * @param mode - Either `CHORD`, `PIE` or `OPEN`.
   * @param detail - For WebGL only. Defaults to `25`.
   */
  const draw$2 = (x, y, size, startRatio, endRatio, mode, detail) =>
    draw$1(x, y, size, size, startRatio, endRatio, mode, detail);
  /**
   * Creates a function that draws a trimmed circle at [`x`, `y`] with the given size.
   * @param x
   * @param y
   * @param size
   * @param mode - Either `CHORD`, `PIE` or `OPEN`.
   * @param detail - For WebGL only. Defaults to `25`.
   * @returns A new drawing function.
   */
  const create$4 = (x, y, size, mode, detail) =>
    create$3(x, y, size, size, mode, detail);

  const circle = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    draw: draw$2,
    create: create$4
  });

  /** For internal use in `createPaths()`. */
  const createPathParameters = (from, to) => {
    return {
      from,
      to,
      length: distance(from.x, from.y, to.x, to.y)
    };
  };
  /**
   * For internal use in `createPolygon()`.
   * @param vertices
   */
  const createPaths = vertices => {
    const vertexCount = vertices.length;
    const pathParameters = new Array(vertexCount);
    const lastIndex = vertexCount - 1;
    let totalLength = 0;
    for (let i = 0; i < lastIndex; i += 1) {
      const parameter = createPathParameters(vertices[i], vertices[i + 1]);
      pathParameters[i] = parameter;
      totalLength += parameter.length;
    }
    const lastParameter = createPathParameters(
      vertices[lastIndex],
      vertices[0]
    );
    pathParameters[lastIndex] = lastParameter;
    totalLength += lastParameter.length;
    const paths = new Array(vertexCount);
    for (let i = 0, lastThresholdRatio = 0; i < vertexCount; i += 1) {
      const parameters = pathParameters[i];
      const lengthRatio = parameters.length / totalLength;
      const nextThresholdRatio = lastThresholdRatio + lengthRatio;
      paths[i] = {
        from: parameters.from,
        to: parameters.to,
        previousRatio: lastThresholdRatio,
        nextRatio: nextThresholdRatio
      };
      lastThresholdRatio = nextThresholdRatio;
    }
    return paths;
  };
  /** For internal use in `createPolygon()`. */
  const getStartPathIndex = (startRatio, paths) => {
    for (let i = paths.length - 1; i >= 0; i -= 1) {
      if (paths[i].previousRatio <= startRatio) return i;
    }
    return 0;
  };
  /** For internal use in `createPolygon()`. */
  const getEndPathIndex = (endRatio, paths) => {
    const { length } = paths;
    for (let i = 0; i < length; i += 1) {
      if (endRatio <= paths[i].nextRatio) return i;
    }
    return length - 1;
  };
  /** For internal use in `createPolygon()`. */
  const drawVertexOnPath = (path, lerpRatio) => {
    const { from, to } = path;
    exports.renderer.vertex(
      lerp(from.x, to.x, lerpRatio),
      lerp(from.y, to.y, lerpRatio)
    );
  };
  /**
   * Creates a function for drawing trimmed 2D polygon through `vertices`.
   * @param vertices
   * @returns Function for drawing trimmed 2D polygon.
   */
  const create$5 = vertices => {
    const paths = createPaths(vertices);
    return (startRatio, endRatio) => {
      const startPathIndex = getStartPathIndex(startRatio, paths);
      const endPathIndex = getEndPathIndex(endRatio, paths);
      const startPathRatio = inverseLerp(
        startRatio,
        paths[startPathIndex].previousRatio,
        paths[startPathIndex].nextRatio
      );
      const endPathRatio = inverseLerp(
        endRatio,
        paths[endPathIndex].previousRatio,
        paths[endPathIndex].nextRatio
      );
      exports.renderer.beginShape();
      drawVertexOnPath(paths[startPathIndex], startPathRatio);
      if (startPathIndex !== endPathIndex) {
        for (let i = startPathIndex; i < endPathIndex; i += 1) {
          const nextVertex = paths[i].to;
          exports.renderer.vertex(nextVertex.x, nextVertex.y);
        }
      }
      drawVertexOnPath(paths[endPathIndex], endPathRatio);
      exports.renderer.endShape();
    };
  };

  const polygon = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    create: create$5
  });

  const createCorner = (x, y, width, height) => {
    const x2 = x + width;
    const y2 = y + height;
    return create$5([
      { x, y },
      { x: x2, y },
      { x: x2, y: y2 },
      { x, y: y2 }
    ]);
  };
  const createCenter = (x, y, width, height) => {
    const halfWidth = 0.5 * width;
    const halfHeight = 0.5 * height;
    const x1 = x - halfWidth;
    const y1 = y - halfHeight;
    const x2 = x + halfWidth;
    const y2 = y + halfHeight;
    return create$5([
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 },
      { x: x1, y: y2 }
    ]);
  };

  const rectangle = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    createCorner: createCorner,
    createCenter: createCenter
  });

  const createCorner$1 = (x, y, size) => createCorner(x, y, size, size);
  const createCenter$1 = (x, y, size) => createCenter(x, y, size, size);

  const square = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    createCorner: createCorner$1,
    createCenter: createCenter$1
  });

  const fullName = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    drawTrimmedLine: draw,
    createTrimmedLine: create$2,
    drawTrimmedEllipse: draw$1,
    createTrimmedEllipse: create$3,
    drawTrimmedCircle: draw$2,
    createTrimmedCircle: create$4,
    createTrimmedPolygon: create$5,
    createTrimmedRectangleCorner: createCorner,
    createTrimmedRectangleCenter: createCenter,
    createTrimmedSquareCorner: createCorner$1,
    createTrimmedSquareCenter: createCenter$1
  });

  const index = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    Line: line$1,
    Ellipse: ellipse,
    Circle: circle,
    Polygon: polygon,
    Rectangle: rectangle,
    Square: square,
    FullName: fullName
  });

  const create$6 = parameters => {
    const {
      displaySize,
      initialDisplayPosition,
      initialFocusPoint,
      minZoomFactor,
      maxZoomFactor
    } = parameters;
    const regionBoundary =
      parameters.regionBoundary || RectangleRegion.createInfinite();
    const zoomFactorThreshold = FitBox.calculateScaleFactor(
      RectangleRegion.getSize(regionBoundary),
      displaySize
    );
    const zoomFactorRangeStart = minZoomFactor
      ? max2(zoomFactorThreshold, minZoomFactor)
      : zoomFactorThreshold;
    const zoomFactorRangeEnd = maxZoomFactor
      ? max2(zoomFactorRangeStart, maxZoomFactor)
      : Infinity;
    return {
      displaySize,
      displayPosition: copyVector(initialDisplayPosition || zeroVector),
      regionBoundary,
      zoomFactorRange: {
        start: zoomFactorRangeStart,
        end: zoomFactorRangeEnd
      },
      focusPoint: initialFocusPoint
        ? copyVector(initialFocusPoint)
        : regionBoundary
        ? RectangleRegion.getCenterPoint(regionBoundary)
        : copyVector(zeroVector),
      zoomFactor: 1,
      zoomTimer: Timer.dummy,
      targetZoomFactor: undefined
    };
  };
  const update = camera => {
    const {
      displaySize: { width, height },
      regionBoundary: {
        topLeft: { x: leftX, y: topY },
        bottomRight: { x: rightX, y: bottomY }
      },
      zoomFactor
    } = camera;
    const logicalHalfWidth = width / (2 * zoomFactor);
    const logicalHalfHeight = height / (2 * zoomFactor);
    const minX = leftX + logicalHalfWidth;
    const maxX = rightX - logicalHalfWidth;
    const minY = topY + logicalHalfHeight;
    const maxY = bottomY - logicalHalfHeight;
    constrainVector(camera.focusPoint, minX, maxX, minY, maxY);
    Timer.Component.step(camera.zoomTimer);
  };
  const draw$3 = (camera, drawCallback) => {
    const { displaySize, displayPosition, focusPoint, zoomFactor } = camera;
    drawTranslatedAndScaled(
      drawCallback,
      displayPosition.x + displaySize.width / 2 - zoomFactor * focusPoint.x,
      displayPosition.y + displaySize.height / 2 - zoomFactor * focusPoint.y,
      zoomFactor
    );
  };
  /**
   * Stops and discards the timer for zoom in/out that is currently running.
   * @param camera
   */
  const stopTweenZoom = camera => {
    camera.zoomTimer = Timer.dummy;
    camera.targetZoomFactor = undefined;
  };
  /**
   * Sets the zoom factor of `camera` immediately to `zoomFactor`.
   * If any zoom timer is set by `tweenZoom`, it will be stopped and discarded.
   * @param camera
   * @param zoomFactor
   */
  const setZoom = (camera, zoomFactor) => {
    const { zoomFactorRange } = camera;
    const newZoomFactor = clamp(
      zoomFactor,
      zoomFactorRange.start,
      zoomFactorRange.end
    );
    camera.zoomFactor = newZoomFactor;
    stopTweenZoom(camera);
  };
  /**
   * Creates and sets a `Timer` component for changing the zoom factor.
   * The timer will be automatically run in `Camera.update`.
   * If any timer is already running, it will be overwritten.
   * @param camera
   * @param targetZoomFactor
   * @param easing
   */
  const tweenZoom = (camera, targetZoomFactor, easing) => {
    const { zoomFactorRange } = camera;
    const endZoomFactor = clamp(
      targetZoomFactor,
      zoomFactorRange.start,
      zoomFactorRange.end
    );
    const timer = Tween.create(v => (camera.zoomFactor = v), 60, {
      start: camera.zoomFactor,
      end: endZoomFactor,
      easing
    });
    timer.onComplete.push(stopTweenZoom.bind(undefined, camera));
    camera.targetZoomFactor = endZoomFactor;
    return (camera.zoomTimer = timer);
  };
  /**
   * Converts `screenPosition` to the logical position in the world that is currently displayed by `camera`.
   * @param camera
   * @param screenPosition
   * @param target The vector to receive the result.
   * @returns The `target` vector.
   */
  const getWorldPosition = (camera, screenPosition, target) => {
    const { displaySize, displayPosition, focusPoint, zoomFactor } = camera;
    const inverseFactor = 1 / zoomFactor;
    return setCartesian(
      target,
      inverseFactor *
        (screenPosition.x - (displayPosition.x + displaySize.width / 2)) +
        focusPoint.x,
      inverseFactor *
        (screenPosition.y - (displayPosition.y + displaySize.height / 2)) +
        focusPoint.y
    );
  };
  /**
   * Converts `worldPosition` to the actual position on the screen.
   * @param camera
   * @param worldPosition
   * @param target The vector to receive the result.
   * @returns The `target` vector.
   */
  const getScreenPosition = (camera, worldPosition, target) => {
    const { displaySize, displayPosition, focusPoint, zoomFactor } = camera;
    return setCartesian(
      target,
      displayPosition.x +
        displaySize.width / 2 +
        zoomFactor * (worldPosition.x - focusPoint.x),
      displayPosition.y +
        displaySize.height / 2 +
        zoomFactor * (worldPosition.y - focusPoint.y)
    );
  };

  const camera = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    create: create$6,
    update: update,
    draw: draw$3,
    stopTweenZoom: stopTweenZoom,
    setZoom: setZoom,
    tweenZoom: tweenZoom,
    getWorldPosition: getWorldPosition,
    getScreenPosition: getScreenPosition
  });

  /**
   * Logical position (independent of the canvas scale factor) of the mouse.
   */
  const position = { x: 0, y: 0 };
  /**
   * Logical position (independent of the canvas scale factor) of the mouse
   * at the previous frame.
   */
  const previousPosition = { x: 0, y: 0 };
  /**
   * Logical displacement (independent of the canvas scale factor) of the mouse
   * from the previous frame.
   */
  const displacement = { x: 0, y: 0 };
  /**
   * Updates `position`, `previousPosition` and `displacement` of the mouse cursor
   * calculating from its physical position.
   */
  const updatePosition = () => {
    if (!exports.canvas) return;
    const factor = 1 / exports.canvas.scaleFactor;
    Vector2D.Mutable.set(previousPosition, position);
    Vector2D.Mutable.setCartesian(
      position,
      factor * exports.p.mouseX,
      factor * exports.p.mouseY
    );
    Vector2D.Assign.subtract(position, previousPosition, displacement);
  };
  /**
   * Sets mouse position to the center point of the canvas.
   */
  const setCenter = () =>
    Vector2D.Mutable.set(position, exports.canvas.logicalCenterPosition);
  /**
   * Runs `callback` translated with the logical mouse position.
   * @param callback
   */
  const drawAtCursor = callback =>
    drawTranslated(callback, position.x, position.y);
  /**
   * Checks if the mouse cursor position is contained in the region of the canvas.
   * @returns `true` if mouse cursor is on the canvas.
   */
  const isOnCanvas = () =>
    RectangleRegion.containsPoint(exports.canvas.logicalRegion, position, 0);

  /**
   * The global flag that indicates if mouse events should be handled.
   */
  let active = true;
  /**
   * Sets the global flag that indicates if mouse events should be handled.
   * @param flag
   */
  const setActive = flag => {
    active = flag;
  };
  /**
   * A `Handler` function with no effect.
   * @returns Nothing so that subsequent `Handler`s will be called.
   */
  const emptyHandler = ConstantFunction.returnVoid;
  /**
   * A `Handler` function with no effect.
   * @returns `false` so that subsequent `Handler`s will be ignored.
   */
  const stopHandler = ConstantFunction.returnFalse;
  /**
   * Run all `handlers`.
   * @param handlers
   * @returns `false` if any handler returned `false`. If not, `true`.
   */
  const runHandlers = handlers => {
    let result = true;
    for (let i = 0; i < handlers.length; i += 1)
      result = handlers[i](position) !== false && result;
    return result;
  };
  /**
   * Creates a `Listener` that will be referred by each mouse event.
   * @param callbacks
   * @returns A `Listener` object.
   */
  const createListener = callbacks => ({
    onClicked: unifyToArray(callbacks.onClicked),
    onPressed: unifyToArray(callbacks.onPressed),
    onReleased: unifyToArray(callbacks.onReleased),
    onMoved: unifyToArray(callbacks.onMoved),
    onEnter: unifyToArray(callbacks.onEnter),
    onLeave: unifyToArray(callbacks.onLeave),
    isMouseOver: callbacks.isMouseOver || ConstantFunction.returnTrue,
    active: true,
    mouseOver: false
  });
  /**
   * The `Listener` that will be called first by any mouse event.
   * Set a `Handler` function that returns `false` here for ignoring subsequent `Handler`s.
   */
  const topListener = createListener({});
  /**
   * A stack of `Listener` objects that will be called by any mouse event.
   * Set a `Handler` function that returns `false` for ignoring subsequent `Handler`s.
   */
  const listenerStack = ArrayList.create(32);
  /**
   * The `Listener` that will be called last by any mouse event
   * after checking the `Handler`s in `listenerStack`.
   */
  const bottomListener = createListener({});
  /**
   * Adds `listener` to `listenerStack`.
   * @param listener
   */
  const addListener = listener => ArrayList.add(listenerStack, listener);
  /**
   * Creates a new `Listener` and adds it to `listenerStack`.
   * @param callbacks
   * @returns Created `Listener`.
   */
  const addNewListener = callbacks => {
    const newListener = createListener(callbacks);
    ArrayList.add(listenerStack, newListener);
    return newListener;
  };
  /**
   * Removes `listener` from `listenerStack`.
   * @param listener
   */
  const removeListener = listener =>
    ArrayList.removeShiftElement(listenerStack, listener);
  /**
   * @param type
   * @returns A function that gets the handler functions (corresponding to `type`) from `listener`.
   */
  const createGetHandlers = type => {
    switch (type) {
      case 0:
        return listener => listener.onClicked;
      case 1:
        return listener => listener.onPressed;
      case 2:
        return listener => listener.onReleased;
      case 3:
        return listener => listener.onMoved;
    }
  };
  /**
   * @param type
   * @returns A function that gets the handler functions (corresponding to `type`) from `listener` and runs them.
   */
  const createRunHandlers = type => {
    const getHandlers = createGetHandlers(type);
    return listener => {
      if (!(listener.active && listener.mouseOver)) return true;
      return runHandlers(getHandlers(listener));
    };
  };
  /**
   * @param type
   * @returns A function that should be called by `type` and runs registered event handlers.
   */
  const createOnEvent = type => {
    const runHandlersOf = createRunHandlers(type);
    return () => {
      if (!active) return;
      if (runHandlersOf(topListener) === false) return;
      const listeners = listenerStack.array;
      let index = listenerStack.size - 1;
      while (index >= 0) {
        if (runHandlersOf(listeners[index]) === false) return;
        index -= 1;
      }
      runHandlersOf(bottomListener);
    };
  };
  const onClicked = createOnEvent(0);
  const onPressed = createOnEvent(1);
  const onReleased = createOnEvent(2);
  const setMouseOverFalse = listener => {
    listener.mouseOver = false;
    return true;
  };
  const updateRun = listener => {
    if (!listener.active) return;
    if (!listener.isMouseOver(position)) {
      if (listener.mouseOver) {
        listener.mouseOver = false;
        return runHandlers(listener.onLeave);
      }
      return;
    }
    if (!listener.mouseOver) {
      listener.mouseOver = true;
      const onEnterResult = runHandlers(listener.onEnter) !== false;
      return runHandlers(listener.onMoved) !== false && onEnterResult;
    }
    return runHandlers(listener.onMoved);
  };
  const onMoved = () => {
    if (!active) return;
    let processListener = updateRun;
    if (processListener(topListener) === false) {
      processListener = setMouseOverFalse;
    }
    const listeners = listenerStack.array;
    let index = listenerStack.size - 1;
    while (index >= 0) {
      if (processListener(listeners[index]) === false) {
        processListener = setMouseOverFalse;
      }
      index -= 1;
    }
    processListener(bottomListener);
  };

  const event = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    get active() {
      return active;
    },
    setActive: setActive,
    emptyHandler: emptyHandler,
    stopHandler: stopHandler,
    createListener: createListener,
    topListener: topListener,
    listenerStack: listenerStack,
    bottomListener: bottomListener,
    addListener: addListener,
    addNewListener: addNewListener,
    removeListener: removeListener,
    onClicked: onClicked,
    onPressed: onPressed,
    onReleased: onReleased,
    onMoved: onMoved
  });

  var State;
  (function(State) {
    State[(State["Default"] = 0)] = "Default";
    State[(State["MouseOver"] = 1)] = "MouseOver";
    State[(State["Pressed"] = 2)] = "Pressed";
    State[(State["Inactive"] = 3)] = "Inactive";
    State[(State["Hidden"] = 4)] = "Hidden";
  })(State || (State = {}));
  const setStateDefault = button => {
    button.state = State.Default;
    button.draw = button.drawDefault;
    button.listener.active = true;
  };
  const setStateMouseOver = button => {
    button.state = State.MouseOver;
    button.draw = button.drawMouseOver;
    button.listener.active = true;
  };
  const setStatePressed = button => {
    button.state = State.Pressed;
    button.draw = button.drawPressed;
    button.listener.active = true;
  };
  const setStateInactive = button => {
    button.state = State.Inactive;
    button.draw = button.drawInactive;
    button.listener.active = false;
  };
  const setStateHidden = button => {
    button.state = State.Hidden;
    button.draw = returnVoid;
    button.listener.active = false;
  };
  /**
   * Creates a new `Button` unit.
   * @param parameters
   * @param addListenerOnStack Either the new listener should be automatically added to `Mouse.Event.listenerStack`.
   *   Defaults to `true`.
   */
  const create$7 = (parameters, addListenerOnStack = true) => {
    const drawDefault = parameters.drawDefault;
    const drawMouseOver = parameters.drawMouseOver || drawDefault;
    const drawPressed = parameters.drawPressed || drawDefault;
    const drawInactive = parameters.drawInactive || drawDefault;
    const draw = drawDefault;
    const listener = addListenerOnStack
      ? addNewListener(parameters)
      : createListener(parameters);
    const button = {
      listener,
      drawDefault,
      drawMouseOver,
      drawPressed,
      drawInactive,
      draw,
      state: State.Default
    };
    const allowSubsequentEvents = !!parameters.allowSubsequentEvents;
    const setMouseOver = () => {
      setStateMouseOver(button);
      return allowSubsequentEvents;
    };
    const setDefault = () => {
      setStateDefault(button);
      return allowSubsequentEvents;
    };
    const setPressed = () => {
      setStatePressed(button);
      return allowSubsequentEvents;
    };
    const autoCursor = () => exports.p.cursor("auto");
    const pointerCursor = () => exports.p.cursor("pointer");
    listener.onEnter.push(setMouseOver, pointerCursor);
    listener.onPressed.push(setPressed);
    listener.onClicked.push(setMouseOver);
    listener.onLeave.push(setDefault, autoCursor);
    if (!allowSubsequentEvents) {
      listener.onMoved.push(stopHandler);
      listener.onReleased.push(stopHandler);
    }
    return button;
  };
  /**
   * Calls `button.draw()`.
   * @param button
   */
  const draw$4 = button => button.draw();

  const button = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    get State() {
      return State;
    },
    setStateDefault: setStateDefault,
    setStateMouseOver: setStateMouseOver,
    setStatePressed: setStatePressed,
    setStateInactive: setStateInactive,
    setStateHidden: setStateHidden,
    create: create$7,
    draw: draw$4
  });

  const index$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    Event: event,
    Button: button,
    position: position,
    previousPosition: previousPosition,
    displacement: displacement,
    updatePosition: updatePosition,
    setCenter: setCenter,
    drawAtCursor: drawAtCursor,
    isOnCanvas: isOnCanvas
  });

  const anyKeyIsDown = keyCodes => {
    for (const keyCode of keyCodes) {
      if (exports.p.keyIsDown(keyCode)) return true;
    }
    return false;
  };

  const keyboard = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    anyKeyIsDown: anyKeyIsDown
  });

  let horizontalMove = 0;
  let verticalMove = 0;
  const unitVector = { x: 0, y: 0 };
  let up = false;
  let left = false;
  let down = false;
  let right = false;
  const setVec = (x, y) => Vector2D.Mutable.setCartesian(unitVector, x, y);
  const update$1 = () => {
    horizontalMove = (left ? -1 : 0) + (right ? 1 : 0);
    verticalMove = (up ? -1 : 0) + (down ? 1 : 0);
    switch (horizontalMove) {
      case -1:
        switch (verticalMove) {
          case -1:
            setVec(-ONE_OVER_SQUARE_ROOT_TWO, -ONE_OVER_SQUARE_ROOT_TWO);
            break;
          case 0:
            setVec(-1, 0);
            break;
          case 1:
            setVec(-ONE_OVER_SQUARE_ROOT_TWO, ONE_OVER_SQUARE_ROOT_TWO);
            break;
        }
        break;
      case 0:
        switch (verticalMove) {
          case -1:
            setVec(0, -1);
            break;
          case 0:
            setVec(0, 0);
            break;
          case 1:
            setVec(0, 1);
            break;
        }
        break;
      case 1:
        switch (verticalMove) {
          case -1:
            setVec(ONE_OVER_SQUARE_ROOT_TWO, -ONE_OVER_SQUARE_ROOT_TWO);
            break;
          case 0:
            setVec(1, 0);
            break;
          case 1:
            setVec(ONE_OVER_SQUARE_ROOT_TWO, ONE_OVER_SQUARE_ROOT_TWO);
            break;
        }
        break;
    }
  };
  const onPressed$1 = () => {
    switch (exports.p.key) {
      case "w":
        up = true;
        break;
      case "a":
        left = true;
        break;
      case "s":
        down = true;
        break;
      case "d":
        right = true;
        break;
    }
    switch (exports.p.keyCode) {
      case 38:
        up = true;
        break;
      case 37:
        left = true;
        break;
      case 40:
        down = true;
        break;
      case 39:
        right = true;
        break;
    }
    update$1();
  };
  const onReleased$1 = () => {
    switch (exports.p.key) {
      case "w":
        up = false;
        break;
      case "a":
        left = false;
        break;
      case "s":
        down = false;
        break;
      case "d":
        right = false;
        break;
    }
    switch (exports.p.keyCode) {
      case 38:
        up = false;
        break;
      case 37:
        left = false;
        break;
      case 40:
        down = false;
        break;
      case 39:
        right = false;
        break;
    }
    update$1();
  };

  const moveKeys = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    get horizontalMove() {
      return horizontalMove;
    },
    get verticalMove() {
      return verticalMove;
    },
    unitVector: unitVector,
    get up() {
      return up;
    },
    get left() {
      return left;
    },
    get down() {
      return down;
    },
    get right() {
      return right;
    },
    onPressed: onPressed$1,
    onReleased: onReleased$1
  });

  let paused = false;
  /**
   * Pauses the sketch by `p.noLoop()`.
   * If already paused, resumes by `p.loop()`.
   */
  const pauseOrResume = () => {
    if (paused) {
      exports.p.loop();
      paused = false;
    } else {
      exports.p.noLoop();
      paused = true;
    }
  };

  /**
   * Creates a 1-dimensional noise function with offset parameter.
   * @param offset Random if not specified.
   * @returns New function that runs `noise()` of p5.
   */
  const withOffset = (offset = randomValue(4096)) => x =>
    exports.p.noise(offset + x);
  /**
   * Creates a 2-dimensional noise function with offset parameters.
   * @param offsetX Random if not specified.
   * @param offsetY Random if not specified.
   * @returns New function that runs `noise()` of p5.
   */
  const withOffset2 = (
    offsetX = randomValue(4096),
    offsetY = randomValue(256)
  ) => (x, y) => exports.p.noise(offsetX + x, offsetY + y);
  /**
   * Creates a 3-dimensional noise function with offset parameters.
   * @param offsetX Random if not specified.
   * @param offsetY Random if not specified.
   * @param offsetZ Random if not specified.
   * @returns New function that runs `noise()` of p5.
   */
  const withOffset3 = (
    offsetX = randomValue(4096),
    offsetY = randomValue(256),
    offsetZ = randomValue(16)
  ) => (x, y, z) => exports.p.noise(offsetX + x, offsetY + y, offsetZ + z);
  /**
   * Creates a noise function without arguments that returns every time an updated value.
   * @param changeRate
   * @param offset Random if not specified.
   * @returns New function that runs `noise()` of p5, internally changing the `x` argument by `changeRate`.
   */
  const withChangeRate = (changeRate, offset = randomValue(4096)) => {
    let x = offset;
    return () => exports.p.noise((x += changeRate));
  };
  /**
   * Creates a 1-dimensional noise function that returns every time an updated value.
   * @param changeRate
   * @param offsetX Random if not specified.
   * @param offsetY Random if not specified.
   * @returns New function that runs `noise()` of p5, internally changing the `y` argument by `changeRate`.
   */
  const withChangeRate1 = (
    changeRate,
    offsetX = randomValue(4096),
    offsetY = randomValue(256)
  ) => {
    let y = offsetY;
    return x => exports.p.noise(offsetX + x, (y += changeRate));
  };
  /**
   * Creates a 2-dimensional noise function that returns every time an updated value.
   * @param changeRate
   * @param offsetX Random if not specified.
   * @param offsetY Random if not specified.
   * @param offsetZ Random if not specified.
   * @returns New function that runs `noise()` of p5, internally changing the `z` argument by `changeRate`.
   */
  const withChangeRate2 = (
    changeRate,
    offsetX = randomValue(4096),
    offsetY = randomValue(256),
    offsetZ = randomValue(16)
  ) => {
    let z = offsetZ;
    return (x, y) =>
      exports.p.noise(offsetX + x, offsetY + y, (z += changeRate));
  };
  /**
   * The expected average value of the result of p5 `noise()`.
   * (May not be accurate)
   */
  const AVERAGE = (repetition => {
    let accumulation = 0;
    let n = 1;
    for (let i = 0; i < repetition; i += 1) accumulation += n /= 2;
    return accumulation / 2;
  })(10);

  const noise = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    withOffset: withOffset,
    withOffset2: withOffset2,
    withOffset3: withOffset3,
    withChangeRate: withChangeRate,
    withChangeRate1: withChangeRate1,
    withChangeRate2: withChangeRate2,
    AVERAGE: AVERAGE
  });

  /**
   * Runs `p.createCanvas()` with the scaled size that fits to `node`.
   * Returns a `ScaledCanvas` instance, which includes the created canvas and the scale factor.
   *
   * @param node The HTML element or its ID.
   * @param logicalSize
   * @param fittingOption No scaling if `null`.
   * @param renderer
   * @returns A `ScaledCanvas` instance.
   */
  const createScaledCanvas = (node, logicalSize, fittingOption, renderer) => {
    const maxCanvasSize = HtmlUtility.getElementSize(
      typeof node === "string" ? HtmlUtility.getElementOrBody(node) : node
    );
    const scaleFactor =
      fittingOption !== null
        ? FitBox.calculateScaleFactor(logicalSize, maxCanvasSize, fittingOption)
        : 1;
    const p5Canvas = exports.p.createCanvas(
      scaleFactor * logicalSize.width,
      scaleFactor * logicalSize.height,
      renderer
    );
    const drawScaledFunction =
      scaleFactor !== 1
        ? drawCallback => drawScaled(drawCallback, scaleFactor)
        : drawCallback => drawCallback();
    return {
      p5Canvas,
      scaleFactor,
      logicalSize,
      logicalRegion: RectangleRegion.create(Vector2D.zero, logicalSize),
      drawScaled: drawScaledFunction,
      logicalCenterPosition: {
        x: logicalSize.width / 2,
        y: logicalSize.height / 2
      }
    };
  };

  /**
   * Calls `new p5()` with the given settings information.
   * @param settings
   */
  const startSketch = settings => {
    const htmlElement =
      typeof settings.htmlElement === "string"
        ? HtmlUtility.getElementOrBody(settings.htmlElement)
        : settings.htmlElement;
    new p5(p => {
      setP5Instance(p);
      p.setup = () => {
        setCanvas(
          createScaledCanvas(
            htmlElement,
            settings.logicalCanvasSize,
            settings.fittingOption,
            settings.renderer
          )
        );
        loopArray(onSetup, listener => listener(p));
        onSetup.length = 0;
        settings.initialize();
      };
      settings.setP5Methods(p);
    }, htmlElement);
  };

  exports.AlphaColor = alphaColor;
  exports.Camera = camera;
  exports.KeyBoard = keyboard;
  exports.Mouse = index$1;
  exports.MoveKeys = moveKeys;
  exports.Noise = noise;
  exports.ShapeColor = shapeColor;
  exports.TrimmedShape2D = index;
  exports.applyShake = applyShake;
  exports.arcAtOrigin = arcAtOrigin;
  exports.circleAtOrigin = circleAtOrigin;
  exports.circularArcAtOrigin = circularArcAtOrigin;
  exports.colorToARGB = colorToARGB;
  exports.colorToRGB = colorToRGB;
  exports.colorWithAlpha = colorWithAlpha;
  exports.createScaledCanvas = createScaledCanvas;
  exports.createSetPixel = createSetPixel;
  exports.createSetPixelRow = createSetPixelRow;
  exports.createTexture = createTexture;
  exports.createTextureRowByRow = createTextureRowByRow;
  exports.curveVertexFromVector = curveVertexFromVector;
  exports.drawBezierControlLines = drawBezierControlLines;
  exports.drawBezierCurve = drawBezierCurve;
  exports.drawCurve = drawCurve;
  exports.drawCurveClosed = drawCurveClosed;
  exports.drawRotated = drawRotated;
  exports.drawScaled = drawScaled;
  exports.drawTexture = drawTexture;
  exports.drawTextureRowByRow = drawTextureRowByRow;
  exports.drawTransformed = drawTransformed;
  exports.drawTranslated = drawTranslated;
  exports.drawTranslatedAndRotated = drawTranslatedAndRotated;
  exports.drawTranslatedAndScaled = drawTranslatedAndScaled;
  exports.graphicsToImage = graphicsToImage;
  exports.hsvColor = hsvColor;
  exports.line = line;
  exports.lineAtOrigin = lineAtOrigin;
  exports.lineWithMargin = lineWithMargin;
  exports.onSetup = onSetup;
  exports.parseColor = parseColor;
  exports.parseFill = parseFill;
  exports.parseStroke = parseStroke;
  exports.pauseOrResume = pauseOrResume;
  exports.reverseColor = reverseColor;
  exports.rotate = rotate;
  exports.rotateScale = rotateScale;
  exports.scale = scale;
  exports.setCanvas = setCanvas;
  exports.setP5Instance = setP5Instance;
  exports.setRenderer = setRenderer;
  exports.setShake = setShake;
  exports.startSketch = startSketch;
  exports.storePixels = storePixels;
  exports.transform = transform;
  exports.translate = translate;
  exports.translateRotate = translateRotate;
  exports.translateScale = translateScale;
  exports.undoRotate = undoRotate;
  exports.undoRotateScale = undoRotateScale;
  exports.undoScale = undoScale;
  exports.undoTransform = undoTransform;
  exports.undoTranslate = undoTranslate;
  exports.undoTranslateRotate = undoTranslateRotate;
  exports.undoTranslateScale = undoTranslateScale;

  Object.defineProperty(exports, "__esModule", { value: true });
});

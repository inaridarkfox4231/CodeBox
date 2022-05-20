/**
 * Falling.
 * Source code in TypeScript: https://github.com/fal-works/p5js-sketches/tree/master/falling

 * @copyright 2020 FAL
 * @version 0.1.1
 */

 // どういうことかというと
 // この作品好きだったんですけどOpenProcessingの方がなんか動かなくて
 // だから動くようにしたいねっていう話をしてた

(function(p5ex, CCC) {
  "use strict";

  /**
   * ---- Common ----------------------------------------------------------------
   */
  const {
    ArrayList,
    Vector2D,
    SimpleDynamics,
    Random,
    Numeric: { cube, min2 },
    Easing
  } = CCC;
  const { onSetup, Noise } = p5ex;
  /**
   * Shared p5 instance.
   */
  let p;
  onSetup.push(p5Instance => {
    p = p5Instance;
  });
  /**
   * Shared canvas instance.
   */
  let canvas;
  onSetup.push(() => {
    canvas = p5ex.canvas;
  });

  /**
   * ---- Settings --------------------------------------------------------------
   */
  /**
   * The id of the HTML element to which the canvas should belong.
   */
  const HTML_ELEMENT_ID = "Falling";
  /**
   * The HTML element to which the canvas should belong.
   */
  const HTML_ELEMENT = CCC.HtmlUtility.getElementOrBody(HTML_ELEMENT_ID);
  /**
   * The logical size of the canvas.
   */
  const LOGICAL_CANVAS_SIZE = {
    width: HTML_ELEMENT.getBoundingClientRect().width,
    height: HTML_ELEMENT.getBoundingClientRect().height
  };
  // console.log(LOGICAL_CANVAS_SIZE.height); // 0???? ここが0になるのがバグの原因。どゆこと？？？？

  // まとめ
  // FALさんのこの作品のコード、GitHubにおいてある方では、index.htmlの中にちゃんとidがFallingのスペースがdivで用意されてて、
  // つまりそこにこれが入る形なわけですよ
  // でもあれ、ね、htmlの形じゃないでしょう。
  // だからこれやるとすっからかんのbodyが取得されてheightが0になっちゃうわけ。
  // だから上記のロジカルなんとかでwとhをwindowのinnerWとinnerHとかにすれば一応は動くよとそういうことです
  // ただまあインチキなのでね。まあ、ね。

  // ...やっぱHTMLの方で作品作るのに慣れた方が良さそうだな...
  // それはそれとしてこのままだといじれないな。うーんどうしたものか。

  /**
   * ---- Dot -------------------------------------------------------------------
   */
  const Dot = (() => {
    const expandDuration = 30;
    const livingDuration = 90;
    const maxSize = 20;
    const graphicsFrameSize = 24;
    const habitableZoneBottomY =
      LOGICAL_CANVAS_SIZE.height + graphicsFrameSize / 2;
    let graphicsFrames;
    const createGraphicsFrame = index => {
      const alphaRatio = 1 - index / livingDuration;
      const sizeRatio = min2(1, index / expandDuration);
      const easeSize = Easing.Out.createBack(2);
      const graphics = p.createGraphics(graphicsFrameSize, graphicsFrameSize);
      graphics.translate(graphics.width / 2, graphics.height / 2);
      graphics.noStroke();
      graphics.fill(32, alphaRatio * 192);
      graphics.circle(0, 0, maxSize * easeSize(sizeRatio));
      return graphics;
    };
    onSetup.push(() => {
      graphicsFrames = CCC.Arrays.createIntegerSequence(livingDuration).map(
        createGraphicsFrame
      );
    });
    const create = (x, y) =>
      Object.assign(Object.assign({}, SimpleDynamics.createQuantity(x, y)), {
        frameCount: 0
      });
    const update = dot => {
      dot.fy = 0.05;
      SimpleDynamics.updateEuler(dot);
      dot.frameCount += 1;
      return dot.frameCount >= livingDuration || dot.y >= habitableZoneBottomY;
    };
    const draw = dot => p.image(graphicsFrames[dot.frameCount], dot.x, dot.y);
    return {
      create,
      update,
      draw
    };
  })();

  /**
   * ---- Dots ------------------------------------------------------------------
   */
  const Dots = (() => {
    const list = ArrayList.create(1024);
    const update = () => {
      ArrayList.removeShiftAll(list, Dot.update); // Dot.updateか。これがCCCの方に説明あるので読みましょう。
    };
    const draw = () => ArrayList.loop(list, Dot.draw);
    const add = (x, y) => ArrayList.add(list, Dot.create(x, y));
    return { update, draw, add };
  })();

  /**
   * ---- Grid ------------------------------------------------------------------
   */
  const Grid = (() => {
    const cellSize = 25;
    const columns = Math.floor(LOGICAL_CANVAS_SIZE.width / cellSize);
    const rows = Math.floor(LOGICAL_CANVAS_SIZE.height / cellSize);
    const createMove = (column, row) => ({
      column,
      row,
      nextMoves: []
    });
    const Left = createMove(-1, 0);
    const Up = createMove(0, -1);
    const Right = createMove(1, 0);
    const Down = createMove(0, 1);
    Left.nextMoves.push(Left, Up, Down);
    Up.nextMoves.push(Left, Up, Right);
    Right.nextMoves.push(Up, Right, Down);
    Down.nextMoves.push(Left, Right, Down);
    const Moves = [Left, Up, Right, Down];
    let currentColumn = Math.floor(columns / 2);
    let currentRow = Math.floor(rows / 2);
    let lastMove = createMove(0, 0);
    lastMove.nextMoves.push(...Moves);
    const reverseMove = move => {
      switch (move) {
        default:
        case Left:
          return Right;
        case Up:
          return Down;
        case Right:
          return Left;
        case Down:
          return Up;
      }
    };
    const getNextMove = () => Random.Arrays.get(lastMove.nextMoves);
    const applyMove = move => {
      const nextColumn = currentColumn + move.column;
      if (nextColumn < 0 || nextColumn >= columns) {
        lastMove = reverseMove(lastMove);
        return false;
      }
      const nextRow = currentRow + move.row;
      if (nextRow < 0 || nextRow >= rows) {
        lastMove = reverseMove(lastMove);
        return false;
      }
      currentColumn = nextColumn;
      currentRow = nextRow;
      return true;
    };
    const getPosition = (column, row) =>
      Vector2D.create((0.5 + column) * cellSize, (0.5 + row) * cellSize);
    const nextPosition = () => {
      let nextMove = getNextMove();
      while (!applyMove(nextMove)) {
        nextMove = getNextMove();
      }
      lastMove = nextMove;
      return getPosition(currentColumn, currentRow);
    };
    return {
      nextPosition
    };
  })();

  /**
   * ---- Repeater --------------------------------------------------------------
   */
  const Repeater = (() => {
    /**
     * Creates a `Repeater` unit.
     * @param callback
     * @param frequency Frequency per frame for running `callback`.
     */
    const create = (callback, frequency = 1) => ({
      callback,
      frequency,
      accumulation: 0
    });
    const run = repeater => {
      repeater.accumulation += repeater.frequency;
      while (repeater.accumulation >= 1) {
        repeater.accumulation -= 1;
        repeater.callback();
      }
    };
    return {
      create,
      run
    };
  })();

  /**
   * ---- Sketch ----------------------------------------------------------------
   */
  let drawBackground;
  const repeater = Repeater.create(() => {
    const position = Grid.nextPosition();
    Dots.add(position.x, position.y);
  });
  const noise = Noise.withChangeRate(0.05);
  const initialize = () => {
    p.background(252);
    drawBackground = p5ex.storePixels();
    p.imageMode(p.CENTER);
  };
  const updateSketch = () => {
    repeater.frequency = 18 * cube(noise());
    Repeater.run(repeater);
    Dots.update();
  };
  const drawSketch = () => {
    Dots.draw();
  };
  const draw = () => {
    updateSketch();
    drawBackground();
    canvas.drawScaled(drawSketch);
  };

  /**
   * ---- Main ------------------------------------------------------------------
   */
  const keyTyped = () => {
    switch (p.key) {
      case "p":
        p5ex.pauseOrResume();
        break;
      case "g":
        p.save("image.png");
        break;
    }
  };
  const setP5Methods = p => {
    p.draw = draw;
    p.keyTyped = keyTyped;
  };
  p5ex.startSketch({
    htmlElement: HTML_ELEMENT,
    logicalCanvasSize: LOGICAL_CANVAS_SIZE,
    initialize: initialize,
    setP5Methods,
    fittingOption: null
  });
})(p5ex, CreativeCodingCore);

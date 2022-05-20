/**
 * creative-coding-core
 *
 * Utility library that might be useful for creative coding.
 * GitHub repository: {@link https://github.com/fal-works/creative-coding-core}
 *
 * @module creative-coding-core
 * @copyright 2019 FAL
 * @author FAL <contact@fal-works.com>
 * @license MIT
 * @version 0.6.1
 */

(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory(exports)
    : typeof define === "function" && define.amd
    ? define(["exports"], factory)
    : ((global = global || self), factory((global.CreativeCodingCore = {})));
})(this, function(exports) {
  "use strict";

  /**
   * Runs `callback` once for each element of `array` from index `start` up to (but not including) `end`.
   * Unlike `Array.prototype.forEach()`, an element of `array` should not be removed during the iteration.
   * @param array
   * @param callback
   */
  const loopRange = (array, callback, start, end) => {
    for (let i = start; i < end; i += 1) callback(array[i], i, array);
  };
  /**
   * Runs `callback` once for each element of `array`.
   * Unlike `Array.prototype.forEach()`, an element of `array` should not be removed during the iteration.
   * @param array
   * @param callback
   */
  const loop = (array, callback) => loopRange(array, callback, 0, array.length);
  /**
   * Runs `callback` once for each element of `array` from index `start` up to (but not including) `end` in descending order.
   * @param array
   * @param callback
   */
  const loopRangeBackwards = (array, callback, start, end) => {
    let index = end;
    while (index > start) {
      --index;
      callback(array[index], index, array);
    }
  };
  /**
   * Runs `callback` once for each element of `array` in descending order.
   * @param array
   * @param callback
   */
  const loopBackwards = (array, callback) =>
    loopRangeBackwards(array, callback, 0, array.length);
  /**
   * Joins two arrays within the specified range and runs `callback` once for each joined pair.
   * You should not remove elements from arrays during the iteration.
   * @param arrayA
   * @param arrayB
   * @param callback
   * @param endA
   * @param endB
   */
  const nestedLoopJoinWithRange = (
    arrayA,
    arrayB,
    callback,
    startA,
    endA,
    startB,
    endB
  ) => {
    for (let i = startA; i < endA; i += 1) {
      for (let k = startB; k < endB; k += 1) callback(arrayA[i], arrayB[k]);
    }
  };
  /**
   * Joins two arrays and runs `callback` once for each joined pair.
   * You should not remove elements from arrays during the iteration.
   * @param arrayA
   * @param arrayB
   * @param callback
   */
  const nestedLoopJoin = (arrayA, arrayB, callback) =>
    nestedLoopJoinWithRange(
      arrayA,
      arrayB,
      callback,
      0,
      arrayA.length,
      0,
      arrayB.length
    );
  /**
   * Runs `callback` once for each pair within `array` from index `start` up to (but not including) `end`.
   * @param array
   * @param callback
   */
  const roundRobinWithRange = (array, callback, start, end) => {
    const iLen = end - 1;
    for (let i = start; i < iLen; i += 1) {
      for (let k = i + 1; k < end; k += 1) callback(array[i], array[k]);
    }
  };
  /**
   * Runs `callback` once for each pair within `array`.
   * @param array
   * @param callback
   */
  const roundRobin = (array, callback) =>
    roundRobinWithRange(array, callback, 0, array.length);
  /**
   * Unifies `arrayOrValue` to array format.
   * @param arrayOrValue - Either an array, value or undefined.
   *   - If already an array, a shallow copy is returned.
   *   - If falsy, a new empty array is returned.
   * @returns A new array.
   */
  const unifyToArray = arrayOrValue =>
    arrayOrValue
      ? Array.isArray(arrayOrValue)
        ? arrayOrValue.slice()
        : [arrayOrValue]
      : [];
  /**
   * Creates a new 1-dimensional array by concatenating sub-array elements of a 2-dimensional array.
   * @param arrays
   * @returns A new 1-dimensional array.
   */
  const flatNaive = arrays => [].concat(...arrays);
  /**
   * An alternative to `Array.prototype.flat()`.
   * @param array
   * @param depth
   * @returns A new array.
   */
  const flatRecursive = (array, depth = 1) =>
    depth > 0
      ? array.reduce(
          (acc, cur) =>
            acc.concat(
              Array.isArray(cur) ? flatRecursive(cur, depth - 1) : cur
            ),
          []
        )
      : array;
  /**
   * Fills `array` by running `factory` and assigning the result for each index of `array`.
   * @param array
   * @param factory A function that returns a new element for assigning to `array`.
   * @param length The length to populate. Default value is `array.length`.
   * @returns Filled `array`.
   */
  const populate = (array, factory, length) => {
    const len = length || array.length;
    for (let i = 0; i < len; i += 1) array[i] = factory(i);
    return array;
  };
  /**
   * Creates a new array filled by running `factory` for each index and assigning the result.
   * @param factory
   * @param length
   * @returns A new populated array.
   */
  const createPopulated = (factory, length) =>
    populate(new Array(length), factory);
  /**
   * Creates a new array of integer numbers starting from `0`.
   * @param length
   * @returns A new number array.
   */
  const createIntegerSequence = length => {
    const array = new Array(length);
    for (let i = 0; i < length; i += 1) array[i] = i;
    return array;
  };
  /**
   * Creates a new array of numbers within `range`.
   * @param range
   * @returns A new number array.
   */
  const fromRange = range => {
    const { start, end } = range;
    const length = end - start;
    const array = new Array(length);
    for (let i = 0; i < length; i += 1) array[i] = start + i;
    return array;
  };
  /**
   * Creates a new array by filtering and mapping `array`.
   * @param array
   * @param callback
   * @returns New array, filtered and mapped.
   */
  const filterMap = (array, callback) => {
    const result = [];
    const len = array.length;
    for (let i = 0; i < len; i += 1) {
      const mappedValue = callback(array[i], i, array);
      if (mappedValue !== undefined) result.push(mappedValue);
    }
    return result;
  };
  /**
   * Runs each function of `functionArray` without any arguments.
   * An element of `functionArray` should not be removed during the iteration.
   * @param functionArray
   * @param argument
   */
  const loopRun = functionArray => {
    const len = functionArray.length;
    for (let i = 0; i < len; i += 1) functionArray[i]();
  };
  /**
   * Runs each function of `functionArray` with given `argument`.
   * An element of `functionArray` should not be removed during the iteration.
   * @param functionArray
   * @param argument
   */
  const loopRunWithArgument = (functionArray, argument) => {
    const len = functionArray.length;
    for (let i = 0; i < len; i += 1) functionArray[i](argument);
  };
  /**
   * Copies values from `source` to `destination`.
   * @param destination
   * @param source
   * @param destinationPosition
   * @param sourcePosition
   * @param length
   */
  const blit = (
    destination,
    source,
    destinationPosition,
    sourcePosition,
    length
  ) => {
    let i = length;
    while (i) {
      i -= 1;
      destination[destinationPosition + i] = source[sourcePosition + i];
    }
  };

  const fullName = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    loopArrayRange: loopRange,
    loopArray: loop,
    loopArrayRangeBackwards: loopRangeBackwards,
    loopArrayBackwards: loopBackwards,
    arrayNestedLoopJoinWithRange: nestedLoopJoinWithRange,
    arrayNestedLoopJoin: nestedLoopJoin,
    arrayRoundRobinWithRange: roundRobinWithRange,
    arrayRoundRobin: roundRobin,
    unifyToArray: unifyToArray,
    flatArrayNaive: flatNaive,
    flatArrayRecursive: flatRecursive,
    populateArray: populate,
    createPopulatedArray: createPopulated,
    createIntegerSequence: createIntegerSequence,
    arrayFromRange: fromRange,
    filterMapArray: filterMap,
    loopRunArray: loopRun,
    loopRunArrayWithArgument: loopRunWithArgument,
    blitArray: blit
  });

  const index = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    FullName: fullName,
    loopRange: loopRange,
    loop: loop,
    loopRangeBackwards: loopRangeBackwards,
    loopBackwards: loopBackwards,
    nestedLoopJoinWithRange: nestedLoopJoinWithRange,
    nestedLoopJoin: nestedLoopJoin,
    roundRobinWithRange: roundRobinWithRange,
    roundRobin: roundRobin,
    unifyToArray: unifyToArray,
    flatNaive: flatNaive,
    flatRecursive: flatRecursive,
    populate: populate,
    createPopulated: createPopulated,
    createIntegerSequence: createIntegerSequence,
    fromRange: fromRange,
    filterMap: filterMap,
    loopRun: loopRun,
    loopRunWithArgument: loopRunWithArgument,
    blit: blit
  });

  /**
   * Creates an array-list unit.
   * @param initialCapacity
   */
  const create = initialCapacity => {
    return {
      array: new Array(initialCapacity),
      size: 0
    };
  };
  /**
   * Creates an array-list unit filled with `value`.
   * @param size
   * @param value
   */
  const createFilled = (size, value) => {
    return {
      array: new Array(size).fill(value),
      size
    };
  };
  /**
   * Creates an array-list unit, filled by running `factory` and assignint the result for each index.
   * @param size
   * @param factory
   */
  const createPopulated$1 = (size, factory) => {
    return {
      array: populate(new Array(size), factory),
      size
    };
  };
  /**
   * Creates an array-list unit by reusing the reference to `array`.
   * The `size` of the array-list will be `array.length`.
   * Be sure that `array` is filled with valid elements.
   *
   * @param array
   * @returns A new array-list unit.
   */
  const fromArray = array => {
    return {
      array,
      size: array.length
    };
  };
  /**
   * Adds `element` to `arrayList`.
   * @param arrayList
   * @param element
   */
  const add = (arrayList, element) => {
    arrayList.array[arrayList.size] = element;
    arrayList.size += 1;
  };
  /**
   * Adds `element` to `arrayList`. Same as `add()`.
   * @param arrayList
   * @param element
   */
  const push = add;
  /**
   * Removes and returns the last element of `arrayList`.
   * Be sure that `arrayList` is not empty.
   * @param arrayList
   * @returns The last element of `arrayList`.
   */
  const pop = arrayList => {
    const lastIndex = arrayList.size - 1;
    const removedElement = arrayList.array[lastIndex];
    arrayList.size = lastIndex;
    return removedElement;
  };
  /**
   * Returns the element of `arrayList` at `index`.
   * @param arrayList
   * @returns The element of `arrayList` at `index`.
   */
  const get = (arrayList, index) => arrayList.array[index];
  /**
   * Returns the last element of `arrayList`.
   * Be sure that `arrayList` is not empty.
   * @param arrayList
   * @returns The last element of `arrayList`.
   */
  const peek = arrayList => arrayList.array[arrayList.size - 1];
  /**
   * Returns the last element of `arrayList`.
   * Be sure that `arrayList` is not empty.
   * Same as `peek()`.
   * @param arrayList
   * @returns The last element of `arrayList`.
   */
  const getLast = peek;
  /**
   * Adds all elements of `array` to `arrayList`.
   * @param arrayList
   * @param array
   */
  const addArray = (arrayList, array) => {
    const { array: thisArray, size: destinaionPosition } = arrayList;
    const len = array.length;
    let i = len;
    while (i) {
      i -= 1;
      thisArray[destinaionPosition + i] = array[i];
    }
    arrayList.size += len;
  };
  /**
   * Adds all elements of `source` to `destination`.
   * @param destination
   * @param source
   */
  const addList = (destination, source) => {
    const { array: destinationArray, size: destinaionPosition } = destination;
    const { array: sourceArray, size: len } = source;
    let i = len;
    while (i) {
      i -= 1;
      destinationArray[destinaionPosition + i] = sourceArray[i];
    }
    destination.size += len;
  };
  /**
   * Clears the contents of `arrayList`.
   * This just sets `size` to `0` and does not nullify references.
   * @param arrayList
   */
  const clear = arrayList => {
    arrayList.size = 0;
  };
  /**
   * Nullifies the slots that are not used.
   * @param arrayList
   */
  const cleanUnusedSlots = arrayList => {
    const { array, size } = arrayList;
    const capacity = array.length;
    array.length = size;
    array.length = capacity;
  };
  /**
   * Clears the contents of `arrayList` and also nullifies all references.
   * @param arrayList
   */
  const clearReference = arrayList => {
    arrayList.size = 0;
    cleanUnusedSlots(arrayList);
  };
  /**
   * Runs `callback` for each element of `arrayList`.
   * @param arrayList
   * @param callback
   */
  const loop$1 = (arrayList, callback) =>
    loopRange(arrayList.array, callback, 0, arrayList.size);
  /**
   * Runs `callback` for each element of `arrayList` in descending order.
   * @param arrayList
   * @param callback
   */
  const loopBackwards$1 = (arrayList, callback) =>
    loopRangeBackwards(arrayList.array, callback, 0, arrayList.size);
  /**
   * Finds the first element where `predicate` returns true.
   * @param arrayList
   * @param predicate Function that returns `true` if a given value matches the condition.
   * @returns The found `element`. `undefined` if not found.
   */
  const find = (arrayList, predicate) => {
    const { array, size } = arrayList;
    for (let i = 0; i < size; i += 1) {
      if (predicate(array[i], i, array)) return array[i];
    }
    return undefined;
  };
  /**
   * Finds `element` in `arrayList`.
   * @param arrayList
   * @param element
   * @returns The index of `element`. `-1` if not found.
   */
  const findIndex = (arrayList, element) => {
    const { array, size } = arrayList;
    for (let i = 0; i < size; i += 1) {
      if (array[i] === element) return i;
    }
    return -1;
  };
  /**
   * Removes the element at `index`.
   * All subsequent elements will be shifted to the previous index.
   * @param arrayList
   * @param index
   * @returns The removed element.
   */
  const removeShift = (arrayList, index) => {
    const { array, size } = arrayList;
    const removedElement = array[index];
    array.copyWithin(index, index + 1, size);
    arrayList.size = size - 1;
    return removedElement;
  };
  /**
   * Removes `element`.
   * All subsequent elements will be shifted to the previous index.
   * @param arrayList
   * @param element
   * @returns The removed element, or `null` if not found.
   */
  const removeShiftElement = (arrayList, element) => {
    const index = findIndex(arrayList, element);
    if (index >= 0) return removeShift(arrayList, index);
    return null;
  };
  /**
   * Removes the element at `index` by moving the last element to `index` and overwriting the existing value.
   * Faster than `removeShift()` and may be useful if you do not need to preserve order of elements.
   *
   * @param arrayList
   * @param index
   * @returns The removed element.
   */
  const removeSwap = (arrayList, index) => {
    const array = arrayList.array;
    const removedElement = array[index];
    const lastIndex = arrayList.size - 1;
    array[index] = array[lastIndex];
    arrayList.size = lastIndex;
    return removedElement;
  };
  /**
   * Removes `element` by replacing it with the last element.
   * @param arrayList
   * @param element
   * @returns The removed element, or `null` if not found.
   */
  const removeSwapElement = (arrayList, element) => {
    const index = findIndex(arrayList, element);
    if (index >= 0) return removeSwap(arrayList, index);
    return null;
  };
  /**
   * Runs `predicate` for each element and removes the element if `predicate` returns `true`.
   * This does not use `removeShift()` internally.
   *
   * Note: Do not add elements within this loop.
   *
   * @param arrayList
   * @param predicate
   * @returns `true` if any element has been removed.
   */

   // うまいなぁこれ
   // 順方向走査で条件を満たすものをremoveしてる
   // predicateがたとえばupdateであればupdate処理の結果それがremoveされる場合はtrueを返してそのままremoveしましょうってなる
   // かしこいね...
  const removeShiftAll = (arrayList, predicate) => {
    const { array, size } = arrayList;
    let writeIndex = 0;
    let found = false;
    for (let readIndex = 0; readIndex < size; readIndex += 1) {
      const value = array[readIndex];
      if (predicate(value, readIndex, array)) {
        found = true;
        continue;
      }
      array[writeIndex] = value;
      writeIndex += 1;
    }
    arrayList.size = writeIndex;
    return found;
  };
  /**
   * Run `removeSwap()` for all indices of element where `predicate` returns true.
   * @param arrayList
   * @param predicate
   * @returns `true` if any element has been removed.
   */
  const removeSwapAll = (arrayList, predicate) => {
    let found = false;
    const array = arrayList.array;
    for (let i = 0; i < arrayList.size; i += 1) {
      if (predicate(array[i], i, array)) {
        removeSwap(arrayList, i);
        found = true;
      }
    }
    return found;
  };
  /**
   * Fills the entire `arrayList` by running `factory` and assigning result for each index.
   * @param arrayList
   * @param factory
   */
  const populate$1 = (arrayList, factory) => {
    populate(arrayList.array, factory);
    arrayList.size = arrayList.array.length;
    return arrayList;
  };
  /**
   * Joins two arrayLists and runs `callback` once for each joined pair.
   * You should not remove elements from arrayLists during the iteration.
   * @param arrayListA
   * @param arrayListB
   * @param callback
   */
  const nestedLoopJoin$1 = (arrayListA, arrayListB, callback) =>
    nestedLoopJoinWithRange(
      arrayListA.array,
      arrayListB.array,
      callback,
      0,
      arrayListA.size,
      0,
      arrayListB.size
    );
  /**
   * Runs `callback` once for each pair within `arrayList`.
   * @param arrayList
   * @param callback
   */
  const roundRobin$1 = (arrayList, callback) =>
    roundRobinWithRange(arrayList.array, callback, 0, arrayList.size);

  const fullName$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    createArrayList: create,
    createFilledArrayList: createFilled,
    createPopulatedArrayList: createPopulated$1,
    arrayListFromArray: fromArray,
    addToArrayList: add,
    pushToArrayList: push,
    popFromArrayList: pop,
    getFromArrayList: get,
    peekFromArrayList: peek,
    getLastFromArrayList: getLast,
    addArrayToArrayList: addArray,
    addListToArrayList: addList,
    clearArrayList: clear,
    cleanUnusedSlotsOfArrayList: cleanUnusedSlots,
    clearReferenceOfArrayList: clearReference,
    loopArrayList: loop$1,
    loopArrayListBackwards: loopBackwards$1,
    findInArrayList: find,
    findIndexInArrayList: findIndex,
    removeShiftFromArrayList: removeShift,
    removeShiftElementFromArrayList: removeShiftElement,
    removeSwapFromArrayList: removeSwap,
    removeSwapElementFromArrayList: removeSwapElement,
    removeShiftAllFromArrayList: removeShiftAll,
    removeSwapAllFromArrayList: removeSwapAll,
    populateArrayList: populate$1,
    arrayListNestedLoopJoin: nestedLoopJoin$1,
    arrayListRoundRobin: roundRobin$1
  });

  const index$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    FullName: fullName$1,
    create: create,
    createFilled: createFilled,
    createPopulated: createPopulated$1,
    fromArray: fromArray,
    add: add,
    push: push,
    pop: pop,
    get: get,
    peek: peek,
    getLast: getLast,
    addArray: addArray,
    addList: addList,
    clear: clear,
    cleanUnusedSlots: cleanUnusedSlots,
    clearReference: clearReference,
    loop: loop$1,
    loopBackwards: loopBackwards$1,
    find: find,
    findIndex: findIndex,
    removeShift: removeShift,
    removeShiftElement: removeShiftElement,
    removeSwap: removeSwap,
    removeSwapElement: removeSwapElement,
    removeShiftAll: removeShiftAll,
    removeSwapAll: removeSwapAll,
    populate: populate$1,
    nestedLoopJoin: nestedLoopJoin$1,
    roundRobin: roundRobin$1
  });

  /**
   * Creates an array-based queue.
   * @param capacity
   * @returns A queue object.
   */
  const create$1 = capacity => ({
    array: new Array(capacity),
    headIndex: 0,
    tailIndex: 0,
    size: 0
  });
  /**
   * Adds `element` to `queue` as the last (newest) element.
   * Be sure that `queue` is not full.
   * @param queue
   * @param element
   */
  const enqueue = (queue, element) => {
    const { array, tailIndex } = queue;
    array[tailIndex] = element;
    const nextTailIndex = tailIndex + 1;
    queue.tailIndex = nextTailIndex < array.length ? nextTailIndex : 0;
    queue.size += 1;
  };
  /**
   * Removes the top (oldest) element from `queue`.
   * Be sure that `queue` is not empty.
   * @param queue
   * @returns Removed element.
   */
  const dequeue = queue => {
    const { array, headIndex } = queue;
    const nextHeadIndex = headIndex + 1;
    queue.headIndex = nextHeadIndex < array.length ? nextHeadIndex : 0;
    queue.size -= 1;
    return array[headIndex];
  };
  /**
   * Removes the top (oldest) element from `queue`.
   * @param queue
   * @returns Removed element, or `undefined` if empty.
   */
  const dequeueSafe = queue => {
    const { array, headIndex, tailIndex } = queue;
    if (headIndex === tailIndex) return undefined;
    const nextHeadIndex = headIndex + 1;
    queue.headIndex = nextHeadIndex < array.length ? nextHeadIndex : 0;
    queue.size -= 1;
    return array[headIndex];
  };
  /**
   * Retunrs the top (oldest) element from `queue`.
   * Be sure that `queue` is not empty.
   * @param queue
   * @returns Removed element.
   */
  const peek$1 = queue => queue.array[queue.headIndex];
  /**
   * Retunrs the top (oldest) element from `queue`.
   * @param queue
   * @returns Removed element, or `undefined` if empty.
   */
  const peekSafe = queue => {
    const { headIndex } = queue;
    return headIndex !== queue.tailIndex ? queue.array[headIndex] : undefined;
  };
  /**
   * Runs `callback` for each element of `queue`.
   * @param arrayList
   * @param callback
   */
  const loop$2 = (queue, callback) => {
    const { array, headIndex, tailIndex } = queue;
    if (headIndex <= tailIndex) {
      loopRange(array, callback, headIndex, tailIndex);
      return;
    }
    loopRange(array, callback, headIndex, array.length);
    loopRange(array, callback, 0, tailIndex);
  };
  /**
   * Removes the top (oldest) element from `queue` if `predicate` returns true.
   * Be sure that `queue` is not empty.
   * @param queue
   * @param predicate Function that returns `true` if a given value matches the condition.
   * @returns Removed element, or `undefined` if not removed.
   */
  const dequeueIf = (queue, predicate) => {
    const { array, headIndex } = queue;
    const topElement = array[headIndex];
    if (!predicate(topElement)) return undefined;
    const nextHeadIndex = headIndex + 1;
    queue.headIndex = nextHeadIndex < array.length ? nextHeadIndex : 0;
    queue.size -= 1;
    return topElement;
  };
  /**
   * Removes the top (oldest) element from `queue` if `predicate` returns true.
   * @param queue
   * @param predicate Function that returns `true` if a given value matches the condition.
   * @returns Removed element, or `undefined` if empty or not removed.
   */
  const dequeueSafeIf = (queue, predicate) =>
    queue.headIndex !== queue.tailIndex
      ? dequeueIf(queue, predicate)
      : undefined;
  /**
   * Checks if `queue` is empty.
   * @param queue
   * @returns `true` if `queue.size === 0`.
   */
  const isEmpty = queue => queue.size === 0;
  /**
   * Clears the contents of `queue`.
   * This does not nullify references.
   * @param queue
   */
  const clear$1 = queue => {
    queue.headIndex = 0;
    queue.tailIndex = 0;
    queue.size = 0;
  };
  /**
   * Clears the contents of `queue` and also nullifies all references.
   * @param queue
   */
  const clearReference$1 = queue => {
    clear$1(queue);
    const { array } = queue;
    const capacity = array.length;
    array.length = 0;
    array.length = capacity;
  };

  const fullName$2 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    createArrayQueue: create$1,
    enqueue: enqueue,
    dequeue: dequeue,
    dequeueSafe: dequeueSafe,
    loopArrayQueue: loop$2,
    peekArrayQueue: peek$1,
    peekArrayQueueSafe: peekSafe,
    dequeueIf: dequeueIf,
    dequeueSafeIf: dequeueSafeIf
  });

  const index$2 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    FullName: fullName$2,
    create: create$1,
    enqueue: enqueue,
    dequeue: dequeue,
    dequeueSafe: dequeueSafe,
    peek: peek$1,
    peekSafe: peekSafe,
    loop: loop$2,
    dequeueIf: dequeueIf,
    dequeueSafeIf: dequeueSafeIf,
    isEmpty: isEmpty,
    clear: clear$1,
    clearReference: clearReference$1
  });

  const create$2 = factory => {
    return {
      value: undefined,
      factory
    };
  };
  const get$1 = object => object.value || (object.value = object.factory());
  const clear$2 = object => {
    object.value = undefined;
  };

  const lazy = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    create: create$2,
    get: get$1,
    clear: clear$2
  });

  const from = (prototypeStructure, length) => {
    const data = {};
    for (const key of Object.keys(prototypeStructure))
      data[key] = new Array(length).fill(prototypeStructure[key]);
    return {
      data,
      length
    };
  };

  const structureOfArrays = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    from: from
  });

  const {
    abs,
    acos,
    asin,
    atan,
    atan2,
    ceil,
    cos,
    exp,
    floor,
    log,
    max,
    min,
    pow,
    round,
    sin,
    sqrt,
    tan,
    clz32,
    imul,
    sign,
    log10,
    log2,
    log1p,
    expm1,
    cosh,
    sinh,
    tanh,
    acosh,
    asinh,
    atanh,
    hypot,
    trunc,
    fround,
    cbrt
  } = Math;
  /**
   * Same as `Math.sqrt`.
   * @returns √x
   */
  const squareRoot = sqrt;
  /**
   * Same as `Math.clz32`.
   */
  const leadingZeros32 = clz32;
  /**
   * Same as `Math.imul`.
   */
  const multInt = imul;
  /**
   * Same as `Math.hypot`.
   */
  const hypotenuse = hypot;
  /**
   * Same as `Math.trunc`.
   */
  const integerPart = trunc;
  /**
   * Same as `Math.fround`.
   */
  const floatRound = fround;
  /**
   * Same as `Math.cbrt`.
   * @returns ∛x
   */
  const cubeRoot = cbrt;
  const square = v => v * v;
  const cube = v => v * v * v;
  const pow4 = v => square(v * v);
  const pow5 = v => square(v * v) * v;
  const squareInt = v => imul(v, v);
  const cubeInt = v => imul(imul(v, v), v);
  /**
   * Checks whether `a` and `b` are considered equal.
   * @param a
   * @param b
   * @returns `true` if the absolute difference of `a` and `b` is smaller than `Number.EPSILON`.
   */
  const equal = (a, b) => abs(a - b) < 2.220446049250313e-16;
  /**
   * Similar to `Math.min` but accepts only two arguments.
   * @param a
   * @param b
   * @returns The smaller of `a` or `b`.
   */
  const min2 = (a, b) => (a < b ? a : b);
  /**
   * Similar to `Math.max` but accepts only two arguments.
   * @param a
   * @param b
   * @returns The larger of `a` or `b`.
   */
  const max2 = (a, b) => (a > b ? a : b);
  /**
   * Safe version of `Math.atan2`;
   * @param y
   * @param x
   * @returns The angle from x-axis to the point. `0` if both `x` and `y` are `0`.
   */
  const atan2safe = (y, x) => (y !== 0 || x !== 0 ? atan2(y, x) : 0);
  /**
   * Calculates the sum of squares of `x` and `y`.
   * @param x
   * @param y
   * @returns `x^2 + y^2`.
   */
  const hypotenuseSquared2D = (x, y) => x * x + y * y;
  /**
   * A 2D version of `Math.hypot`. Calculates the square root of the sum of squares of `x` and `y`.
   * @param x
   * @param y
   * @returns `√(x^2 + y^2)`.
   */
  const hypotenuse2D = (x, y) => sqrt(x * x + y * y);
  /**
   * Linearly interpolates between `start` and `end` by `ratio`.
   * The result will not be clamped.
   * @param start
   * @param end
   * @param ratio
   * @returns Interpolated value, e.g. `start` if `ratio == 0`, `end` if `ratio == 1`.
   */
  const lerp = (start, end, ratio) => start + ratio * (end - start);
  /**
   * Clamps `value` between `min` and `max`.
   * @param value
   * @param min
   * @param max
   * @returns Clamped value equal or greater than `min` and equal or less than `max`.
   */
  const clamp = (value, min, max) =>
    value < min ? min : value > max ? max : value;
  /**
   * Clamps `value` between `min` and `max`, or returns the average of them if `min > max`.
   * @param value
   * @param min
   * @param max
   * @returns Constrained value.
   */
  const constrain = (value, min, max) =>
    min > max ? (min + max) / 2 : value < min ? min : value > max ? max : value;
  /**
   * Maps `value` from the range [`inStart`, `inEnd`] to the range [`outStart`, `outEnd`].
   * @param value
   * @param inStart
   * @param inEnd
   * @param outStart
   * @param outEnd
   * @returns Mapped value (unclamped).
   */
  const map = (value, inStart, inEnd, outStart, outEnd) =>
    outStart + ((outEnd - outStart) * (value - inStart)) / (inEnd - inStart);
  /**
   * Creates a mapping function that maps `value` from the range [`inStart`, `inEnd`] to the range [`outStart`, `outEnd`].
   * @param inStart
   * @param inEnd
   * @param outStart
   * @param outEnd
   * @returns New mapping function.
   */
  const createMap = (inStart, inEnd, outStart, outEnd) => {
    const inLength = inEnd - inStart;
    const outLength = outEnd - outStart;
    return value => outStart + (outLength * (value - inStart)) / inLength;
  };
  /**
   * Maps `value` from the range [`start`, `end`] to the range [0, 1].
   * @param value
   * @param start
   * @param end
   * @returns Mapped value between 0 and 1 (unclamped).
   */
  const inverseLerp = (value, start, end) => (value - start) / (end - start);

  const numeric = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    abs: abs,
    acos: acos,
    asin: asin,
    atan: atan,
    atan2: atan2,
    ceil: ceil,
    cos: cos,
    exp: exp,
    floor: floor,
    log: log,
    max: max,
    min: min,
    pow: pow,
    round: round,
    sin: sin,
    sqrt: sqrt,
    tan: tan,
    clz32: clz32,
    imul: imul,
    sign: sign,
    log10: log10,
    log2: log2,
    log1p: log1p,
    expm1: expm1,
    cosh: cosh,
    sinh: sinh,
    tanh: tanh,
    acosh: acosh,
    asinh: asinh,
    atanh: atanh,
    hypot: hypot,
    trunc: trunc,
    fround: fround,
    cbrt: cbrt,
    squareRoot: squareRoot,
    leadingZeros32: leadingZeros32,
    multInt: multInt,
    hypotenuse: hypotenuse,
    integerPart: integerPart,
    floatRound: floatRound,
    cubeRoot: cubeRoot,
    square: square,
    cube: cube,
    pow4: pow4,
    pow5: pow5,
    squareInt: squareInt,
    cubeInt: cubeInt,
    equal: equal,
    min2: min2,
    max2: max2,
    atan2safe: atan2safe,
    hypotenuseSquared2D: hypotenuseSquared2D,
    hypotenuse2D: hypotenuse2D,
    lerp: lerp,
    clamp: clamp,
    constrain: constrain,
    map: map,
    createMap: createMap,
    inverseLerp: inverseLerp
  });

  const { E, LN10, LN2, LOG2E, LOG10E } = Math;
  const ONE_HALF = 1 / 2;
  const ONE_THIRD = 1 / 3;
  const TWO_THIRDS = 2 / 3;
  const ONE_QUARTER = 1 / 4;
  const TWO_QUARTERS = ONE_HALF;
  const THREE_QUARTERS = 3 / 4;
  const INVERSE30 = 1 / 30;
  const INVERSE60 = 1 / 60;
  const INVERSE255 = 1 / 255;
  /**
   * √2
   */
  const SQUARE_ROOT_TWO = Math.SQRT2;
  /**
   * √(1 / 2) = 1 / √2 = √2 / 2
   */
  const SQUARE_ROOT_ONE_HALF = Math.SQRT1_2;
  /**
   * √3
   */
  const SQUARE_ROOT_THREE = Math.sqrt(3);
  /**
   * 1 / √2 = √(1 / 2) = √2 / 2
   */
  const ONE_OVER_SQUARE_ROOT_TWO = SQUARE_ROOT_ONE_HALF;
  /**
   * 2 / √2 = √2
   */
  const TWO_OVER_SQUARE_ROOT_TWO = SQUARE_ROOT_TWO;
  /**
   * 1 / √3
   */
  const ONE_OVER_SQUARE_ROOT_THREE = 1 / SQUARE_ROOT_THREE;
  /**
   * 2 / √3
   */
  const TWO_OVER_SQUARE_ROOT_THREE = 2 / SQUARE_ROOT_THREE;
  /**
   * √3 / 2
   */
  const SQUARE_ROOT_THREE_OVER_TWO = SQUARE_ROOT_THREE / 2;
  /**
   * √2 / 2 = √(1 / 2) = 1 / √2
   */
  const SQUARE_ROOT_TWO_OVER_TWO = SQUARE_ROOT_ONE_HALF;

  const constants = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    E: E,
    LN10: LN10,
    LN2: LN2,
    LOG2E: LOG2E,
    LOG10E: LOG10E,
    ONE_HALF: ONE_HALF,
    ONE_THIRD: ONE_THIRD,
    TWO_THIRDS: TWO_THIRDS,
    ONE_QUARTER: ONE_QUARTER,
    TWO_QUARTERS: TWO_QUARTERS,
    THREE_QUARTERS: THREE_QUARTERS,
    INVERSE30: INVERSE30,
    INVERSE60: INVERSE60,
    INVERSE255: INVERSE255,
    SQUARE_ROOT_TWO: SQUARE_ROOT_TWO,
    SQUARE_ROOT_ONE_HALF: SQUARE_ROOT_ONE_HALF,
    SQUARE_ROOT_THREE: SQUARE_ROOT_THREE,
    ONE_OVER_SQUARE_ROOT_TWO: ONE_OVER_SQUARE_ROOT_TWO,
    TWO_OVER_SQUARE_ROOT_TWO: TWO_OVER_SQUARE_ROOT_TWO,
    ONE_OVER_SQUARE_ROOT_THREE: ONE_OVER_SQUARE_ROOT_THREE,
    TWO_OVER_SQUARE_ROOT_THREE: TWO_OVER_SQUARE_ROOT_THREE,
    SQUARE_ROOT_THREE_OVER_TWO: SQUARE_ROOT_THREE_OVER_TWO,
    SQUARE_ROOT_TWO_OVER_TWO: SQUARE_ROOT_TWO_OVER_TWO
  });

  const PI = Math.PI;
  const TWO_PI = 2 * PI;
  const HALF_PI = PI / 2;
  const THIRD_PI = PI / 3;
  const QUARTER_PI = PI / 4;
  const THREE_QUARTERS_PI = 3 * QUARTER_PI;
  const SIN30 = ONE_HALF;
  const SIN45 = ONE_OVER_SQUARE_ROOT_TWO;
  const SIN60 = SQUARE_ROOT_THREE_OVER_TWO;
  const COS30 = SIN60;
  const COS45 = SIN45;
  const COS60 = SIN30;
  const DEGREES_TO_RADIANS = TWO_PI / 360;
  const RADIANS_TO_DEGREES = 360 / TWO_PI;
  const createArray = resolution => {
    const array = new Array(resolution);
    const interval = TWO_PI / resolution;
    for (let i = 0; i < resolution; i += 1) array[i] = i * interval;
    return array;
  };
  const fromDegrees = degrees => DEGREES_TO_RADIANS * degrees;
  const toDegrees = radians => RADIANS_TO_DEGREES * radians;
  /**
   * Calculates the angle in radians from origin to `position`.
   * @param position
   * @returns The angle. `0` if `position` is a zero vector.
   */
  const fromOrigin = position => {
    const { x, y } = position;
    return x !== 0 || y !== 0 ? atan2(position.y, position.x) : 0;
  };
  /**
   * Calculates the angle in radians between two points.
   * @param from
   * @param to
   * @returns The angle. `0` if both points are the same.
   */
  const betweenPoints = (from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return dx !== 0 || dy !== 0 ? atan2(dy, dx) : 0;
  };
  /**
   * Calculates the angle in radians between two points.
   * @returns The angle. `0` if both points are the same.
   */
  const betweenCoordinates = (x1, y1, x2, y2) =>
    x1 !== x2 || y1 !== y2 ? atan2(x2 - x1, y2 - y1) : 0;

  const angle = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    PI: PI,
    TWO_PI: TWO_PI,
    HALF_PI: HALF_PI,
    THIRD_PI: THIRD_PI,
    QUARTER_PI: QUARTER_PI,
    THREE_QUARTERS_PI: THREE_QUARTERS_PI,
    SIN30: SIN30,
    SIN45: SIN45,
    SIN60: SIN60,
    COS30: COS30,
    COS45: COS45,
    COS60: COS60,
    DEGREES_TO_RADIANS: DEGREES_TO_RADIANS,
    RADIANS_TO_DEGREES: RADIANS_TO_DEGREES,
    createArray: createArray,
    fromDegrees: fromDegrees,
    toDegrees: toDegrees,
    fromOrigin: fromOrigin,
    betweenPoints: betweenPoints,
    betweenCoordinates: betweenCoordinates
  });

  // こっからがベクトルの話のようです

  /**
   * @param x
   * @param y
   * @returns A new 2D vector.
   */
  const create$3 = (x, y) => ({ x, y });
  /**
   * Zero vector.
   */
  const zero = {
    x: 0,
    y: 0
  };
  /**
   * Checks if a given vector is completely zero.
   * @param v
   * @returns `true` if zero.
   */
  const isZero = v => v.x === 0 && v.y === 0;
  /**
   * Creates a new vector from polar coordinates `angle` and `length`.
   * @param length
   * @param angle
   * @returns new `Vector2D`.
   */
  const fromPolar = (length, angle) => {
    return {
      x: length * cos(angle),
      y: length * sin(angle)
    };
  };
  /**
   * Creates a new vector by adding two vectors.
   * @param a
   * @param b
   * @returns new `Vector2D`.
   */
  const add$1 = (a, b) => {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  };
  /**
   * Creates a new vector by adding cartesian coordinates.
   * @param vector
   * @param x
   * @param y
   * @returns new `Vector2D`.
   */
  const addCartesian = (vector, x, y) => {
    return {
      x: vector.x + x,
      y: vector.y + y
    };
  };
  /**
   * Creates a new vector by adding polar coordinates.
   * @param vector
   * @param length
   * @param angle
   * @returns new `Vector2D`.
   */
  const addPolar = (vector, length, angle) => {
    return {
      x: vector.x + length * cos(angle),
      y: vector.y + length * sin(angle)
    };
  };
  /**
   * Creates a new vector by subtracting `b` from `a`.
   * @param a
   * @param b
   * @returns new `Vector2D`.
   */
  const subtract = (a, b) => {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    };
  };
  /**
   * Creates a new vector by subtracting cartesian coordinates.
   * @param vector
   * @param x
   * @param y
   * @returns new `Vector2D`.
   */
  const subtractCartesian = (vector, x, y) => {
    return {
      x: vector.x - x,
      y: vector.y - y
    };
  };
  /**
   * Creates a new vector by subtracting polar coordinates.
   * @param vector
   * @param length
   * @param angle
   * @returns new `Vector2D`.
   */
  const subtractPolar = (vector, length, angle) => {
    return {
      x: vector.x - length * cos(angle),
      y: vector.y - length * sin(angle)
    };
  };
  /**
   * Creates a new vector with multiplied values.
   * @param vector
   * @param multiplier
   * @returns new `Vector2D`.
   */
  const multiply = (vector, multiplier) => {
    return {
      x: vector.x * multiplier,
      y: vector.y * multiplier
    };
  };
  /**
   * Creates a new vector with divided values.
   * @param vector
   * @param multiplier
   * @returns new `Vector2D`.
   */
  const divide = (vector, divisor) => {
    return {
      x: vector.x / divisor,
      y: vector.y / divisor
    };
  };
  /**
   * Calculates square of distance between `vectorA` and `vectorB`.
   * @param vectorA
   * @param vectorB
   * @returns Square of distance.
   */
  const distanceSquared = (vectorA, vectorB) =>
    hypotenuseSquared2D(vectorB.x - vectorA.x, vectorB.y - vectorA.y);
  /**
   * Calculates distance between `vectorA` and `vectorB`.
   * @param vectorA
   * @param vectorB
   * @returns Distance.
   */
  const distance = (vectorA, vectorB) =>
    hypotenuse2D(vectorB.x - vectorA.x, vectorB.y - vectorA.y);
  /**
   * Returns string e.g. `{x:0,y:0}`
   * @param vector
   * @returns String expression.
   */
  const toStr = vector => `{x:${vector.x},y:${vector.y}}`;
  /**
   * Creates a new vector with same values.
   * @param vector
   */
  const copy = vector => {
    return {
      x: vector.x,
      y: vector.y
    };
  };
  /**
   * Calculates squared length of `vector`.
   * @param vector
   * @returns The squared length.
   */
  const lengthSquared = vector => hypotenuseSquared2D(vector.x, vector.y);
  /**
   * Calculates length of `vector`.
   * @param vector
   * @returns The length.
   */
  const length = vector => hypotenuse2D(vector.x, vector.y);
  /**
   * Calculates angle of `vector` in radians.
   * @param vector
   * @returns The angle. `0` if `vector` is a zero vector.
   */
  const angle$1 = vector => {
    const { x, y } = vector;
    return x !== 0 || y !== 0 ? atan2(vector.y, vector.x) : 0;
  };

  /**
   * @returns A new mutable 2D vector.
   */
  const create$4 = () => ({ x: 0, y: 0 });
  const add$2 = (vector, otherVector) => {
    vector.x += otherVector.x;
    vector.y += otherVector.y;
    return vector;
  };
  const addCartesian$1 = (vector, x, y) => {
    vector.x += x;
    vector.y += y;
    return vector;
  };
  const addPolar$1 = (vector, length, angle) => {
    vector.x += length * cos(angle);
    vector.y += length * sin(angle);
    return vector;
  };
  const subtract$1 = (vector, otherVector) => {
    vector.x -= otherVector.x;
    vector.y -= otherVector.y;
    return vector;
  };
  const subtractCartesian$1 = (vector, x, y) => {
    vector.x -= x;
    vector.y -= y;
    return vector;
  };
  const subtractPolar$1 = (vector, length, angle) => {
    vector.x -= length * cos(angle);
    vector.y -= length * sin(angle);
    return vector;
  };
  const set = (vector, sourceVector) => {
    vector.x = sourceVector.x;
    vector.y = sourceVector.y;
    return vector;
  };
  const setCartesian = (vector, x, y) => {
    vector.x = x;
    vector.y = y;
    return vector;
  };
  const setPolar = (vector, length, angle) => {
    vector.x = length * cos(angle);
    vector.y = length * sin(angle);
    return vector;
  };
  const multiply$1 = (vector, multiplier) => {
    vector.x *= multiplier;
    vector.y *= multiplier;
    return vector;
  };
  const divide$1 = (vector, divisor) => {
    const multiplier = 1 / divisor;
    vector.x *= multiplier;
    vector.y *= multiplier;
    return vector;
  };
  const clamp$1 = (vector, minX, maxX, minY, maxY) => {
    vector.x = clamp(vector.x, minX, maxX);
    vector.y = clamp(vector.y, minY, maxY);
    return vector;
  };
  const constrain$1 = (vector, minX, maxX, minY, maxY) => {
    vector.x = constrain(vector.x, minX, maxX);
    vector.y = constrain(vector.y, minY, maxY);
    return vector;
  };

  const mutable = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    create: create$4,
    add: add$2,
    addCartesian: addCartesian$1,
    addPolar: addPolar$1,
    subtract: subtract$1,
    subtractCartesian: subtractCartesian$1,
    subtractPolar: subtractPolar$1,
    set: set,
    setCartesian: setCartesian,
    setPolar: setPolar,
    multiply: multiply$1,
    divide: divide$1,
    clamp: clamp$1,
    constrain: constrain$1
  });

  const add$3 = (sourceA, sourceB, target) => {
    target.x = sourceA.x + sourceB.x;
    target.y = sourceA.y + sourceB.y;
    return target;
  };
  const addCartesian$2 = (source, x, y, target) => {
    target.x = source.x + x;
    target.y = source.y + y;
    return target;
  };
  const addPolar$2 = (source, length, angle, target) => {
    target.x = source.x + length * cos(angle);
    target.y = source.y + length * sin(angle);
    return target;
  };
  const subtract$2 = (sourceA, sourceB, target) => {
    target.x = sourceA.x - sourceB.x;
    target.y = sourceA.y - sourceB.y;
    return target;
  };
  const subtractCartesian$2 = (source, x, y, target) => {
    target.x = source.x - x;
    target.y = source.y - y;
    return target;
  };
  const subtractPolar$2 = (source, length, angle, target) => {
    target.x = source.x - length * cos(angle);
    target.y = source.y - length * sin(angle);
    return target;
  };
  const setCartesian$1 = (x, y, target) => {
    target.x = x;
    target.y = y;
    return target;
  };
  const setPolar$1 = (length, angle, target) => {
    target.x = length * cos(angle);
    target.y = length * sin(angle);
    return target;
  };
  const multiply$2 = (source, multiplier, target) => {
    target.x = source.x * multiplier;
    target.y = source.y * multiplier;
    return target;
  };
  const divide$2 = (source, divisor, target) => {
    const multiplier = 1 / divisor;
    target.x = source.x * multiplier;
    target.y = source.y * multiplier;
    return target;
  };
  const clamp$2 = (vector, minX, maxX, minY, maxY, target) => {
    target.x = clamp(vector.x, minX, maxX);
    target.y = clamp(vector.y, minY, maxY);
    return target;
  };
  const constrain$2 = (vector, minX, maxX, minY, maxY, target) => {
    target.x = constrain(vector.x, minX, maxX);
    target.y = constrain(vector.y, minY, maxY);
    return target;
  };

  const assign = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    add: add$3,
    addCartesian: addCartesian$2,
    addPolar: addPolar$2,
    subtract: subtract$2,
    subtractCartesian: subtractCartesian$2,
    subtractPolar: subtractPolar$2,
    setCartesian: setCartesian$1,
    setPolar: setPolar$1,
    multiply: multiply$2,
    divide: divide$2,
    clamp: clamp$2,
    constrain: constrain$2
  });

  const fullName$3 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    createVector: create$3,
    zeroVector: zero,
    vectorIsZero: isZero,
    vectorFromPolar: fromPolar,
    addVector: add$1,
    addCartesian: addCartesian,
    addPolar: addPolar,
    subtractVector: subtract,
    subtractCartesian: subtractCartesian,
    subtractPolar: subtractPolar,
    multiplyVector: multiply,
    divideVector: divide,
    distanceOfVectorsSquared: distanceSquared,
    distanceOfVectors: distance,
    vectorToStr: toStr,
    copyVector: copy,
    vectorLengthSquared: lengthSquared,
    vectorLength: length,
    vectorAngle: angle$1,
    createVectorMutable: create$4,
    addVectorMutable: add$2,
    addCartesianMutable: addCartesian$1,
    addPolarMutable: addPolar$1,
    subtractVectorMutable: subtract$1,
    subtractCartesianMutable: subtractCartesian$1,
    subtractPolarMutable: subtractPolar$1,
    setVector: set,
    setCartesian: setCartesian,
    setPolar: setPolar,
    multiplyVectorMutable: multiply$1,
    divideVectorMutable: divide$1,
    clampVector: clamp$1,
    constrainVector: constrain$1,
    addVectorAssign: add$3,
    addCartesianAssign: addCartesian$2,
    addPolarAssign: addPolar$2,
    subtractVectorAssign: subtract$2,
    subtractCartesianAssign: subtractCartesian$2,
    subtractPolarAssign: subtractPolar$2,
    multiplyVectorAssign: multiply$2,
    divideVectorAssign: divide$2,
    clampVectorAssign: clamp$2,
    constrainVectorAssign: constrain$2
  });

// これがVector2Dらしいんだけどなんでこんな分かりづらいんだ...
  const index$3 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    Mutable: mutable,
    Assign: assign,
    FullName: fullName$3,
    create: create$3,
    zero: zero,
    isZero: isZero,
    fromPolar: fromPolar,
    add: add$1,
    addCartesian: addCartesian,
    addPolar: addPolar,
    subtract: subtract,
    subtractCartesian: subtractCartesian,
    subtractPolar: subtractPolar,
    multiply: multiply,
    divide: divide,
    distanceSquared: distanceSquared,
    distance: distance,
    toStr: toStr,
    copy: copy,
    lengthSquared: lengthSquared,
    length: length,
    angle: angle$1
  });

  const create$5 = (topLeftPosition, size) => ({
    topLeft: topLeftPosition,
    bottomRight: {
      x: topLeftPosition.x + size.width,
      y: topLeftPosition.y + size.height
    }
  });
  const createFromCenter = (centerPosition, size) => {
    const { x, y } = centerPosition;
    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;
    return {
      topLeft: { x: x - halfWidth, y: y - halfHeight },
      bottomRight: { x: x + halfWidth, y: y + halfHeight }
    };
  };
  /**
   * Checks if `region` contains `point`.
   * @param region
   * @param point
   * @param margin
   * @returns `true` if contained.
   */
  const containsPoint = (region, point, margin) => {
    const { topLeft, bottomRight } = region;
    const { x, y } = point;
    return (
      x >= topLeft.x + margin &&
      y >= topLeft.y + margin &&
      x < bottomRight.x - margin &&
      y < bottomRight.y - margin
    );
  };
  const getWidth = region => region.bottomRight.x - region.topLeft.x;
  const getHeight = region => region.bottomRight.y - region.topLeft.y;
  const getSize = region => {
    const { topLeft, bottomRight } = region;
    return {
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  };
  /**
   * Returns the center point of `region`.
   * Note that the result will be invalid if the region is infinite.
   * @param region
   * @return The center point.
   */
  const getCenterPoint = region => {
    const { topLeft, bottomRight } = region;
    return {
      x: (topLeft.x + bottomRight.x) / 2,
      y: (topLeft.y + bottomRight.y) / 2
    };
  };
  /**
   * Creates a new `RectangleRegion` by scaling `region` with `scaleFactor`.
   * @param region
   * @param scaleFactor
   * @param originType
   * @returns A new scaled `RectangleRegion` unit.
   */
  const createScaled = (region, scaleFactor, originType) => {
    const { topLeft, bottomRight } = region;
    switch (originType) {
      case 0:
        return {
          topLeft,
          bottomRight: {
            x: lerp(topLeft.x, bottomRight.x, scaleFactor),
            y: lerp(topLeft.y, bottomRight.y, scaleFactor)
          }
        };
      case 1: {
        const center = getCenterPoint(region);
        const size = getSize(region);
        const halfWidth = size.width / 2;
        const halfHeight = size.height / 2;
        return {
          topLeft: {
            x: center.x - halfWidth,
            y: center.y - halfHeight
          },
          bottomRight: {
            x: center.x + halfWidth,
            y: center.y + halfHeight
          }
        };
      }
    }
  };
  /**
   * Clones the given `RectangleRegion` instance;
   * @param region
   * @returns The cloned instance.
   */
  const copy$1 = region => ({
    topLeft: copy(region.topLeft),
    bottomRight: copy(region.bottomRight)
  });
  /**
   * @returns A `RectangleRegion` instance with `Infinity` values.
   */
  const createInfinite = () => ({
    topLeft: { x: -Infinity, y: -Infinity },
    bottomRight: { x: Infinity, y: Infinity }
  });
  /**
   * Creates a new `RectangleRegion` by adding `margin` to `region`.
   * @param region
   * @param margin
   * @returns A new `RectangleRegion` unit.
   */
  const addMargin = (region, margin) => {
    const {
      topLeft: originalTopLeft,
      bottomRight: originalBottomRight
    } = region;
    return {
      topLeft: {
        x: originalTopLeft.x - margin,
        y: originalTopLeft.y - margin
      },
      bottomRight: {
        x: originalBottomRight.x + margin,
        y: originalBottomRight.y + margin
      }
    };
  };
  /**
   * Creates a new `RectangleRegion` by adding `margins` to `region`.
   * @param region
   * @param margins
   * @returns A new `RectangleRegion` unit.
   */
  const addMargins = (region, margins) => {
    const {
      topLeft: originalTopLeft,
      bottomRight: originalBottomRight
    } = region;
    return {
      topLeft: {
        x: originalTopLeft.x - margins.left,
        y: originalTopLeft.y - margins.top
      },
      bottomRight: {
        x: originalBottomRight.x + margins.right,
        y: originalBottomRight.y + margins.bottom
      }
    };
  };

  const rectangleRegion = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    create: create$5,
    createFromCenter: createFromCenter,
    containsPoint: containsPoint,
    getWidth: getWidth,
    getHeight: getHeight,
    getSize: getSize,
    getCenterPoint: getCenterPoint,
    createScaled: createScaled,
    copy: copy$1,
    createInfinite: createInfinite,
    addMargin: addMargin,
    addMargins: addMargins
  });

  /**
   * Calculates the aspect ratio i.e. `width / height`.
   * @param size
   */
  const getAspectRatio = size => size.width / size.height;
  /**
   * Calculates the area i.e. `width * height`.
   * @param size
   */
  const getArea = size => size.width * size.height;
  /**
   * @returns A `RectangleSize` instance with `Infinity` values.
   */
  const createInfinite$1 = () => ({
    width: Infinity,
    height: Infinity
  });

  const rectangleSize = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    getAspectRatio: getAspectRatio,
    getArea: getArea,
    createInfinite: createInfinite$1
  });

  const createCurve = vertexPropertyList => {
    const paths = [];
    const len = vertexPropertyList.length;
    let previousVertex = vertexPropertyList[0];
    let previousControlLine = previousVertex.controlLine;
    for (let i = 1; i < len; i += 1) {
      const currentVertex = vertexPropertyList[i];
      const currentControlLine = currentVertex.controlLine;
      paths.push({
        controlPoint1: addPolar(
          previousVertex.point,
          0.5 * previousControlLine.length,
          previousControlLine.angle
        ),
        controlPoint2: subtractPolar(
          currentVertex.point,
          0.5 * currentControlLine.length,
          currentControlLine.angle
        ),
        targetPoint: currentVertex.point
      });
      previousVertex = currentVertex;
      previousControlLine = currentControlLine;
    }
    return {
      startPoint: vertexPropertyList[0].point,
      paths
    };
  };

  const bezier = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    createCurve: createCurve
  });

  /**
   * Calculates the squared distance between [`x1`, `y1`] and [`x2`, `y2`];
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   * @returns `dx^2 + dy^2`.
   */
  const distanceSquared$1 = (x1, y1, x2, y2) =>
    hypotenuseSquared2D(x2 - x1, y2 - y1);
  /**
   * Calculates the distance between [`x1`, `y1`] and [`x2`, `y2`];
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   * @returns `√(dx^2 + dy^2)`.
   */
  const distance$1 = (x1, y1, x2, y2) => hypotenuse2D(x2 - x1, y2 - y1);

  const coordinates2d = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    distanceSquared: distanceSquared$1,
    distance: distance$1
  });

  /**
   * "easeInQuad" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const quad = square;
  /**
   * "easeInCubic" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const cubic = cube;
  /**
   * "easeInQuart" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const quart = pow4;
  /**
   * "easeInExpo" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const expo = x => (x ? pow(2, 10 * (x - 1)) : 0);
  /**
   * Creates a new "easeInBack" function with `coefficient`.
   * @param coefficient Defaults to 1.70158
   * @returns "easeInBack" function.
   */
  const createBack = (coefficient = 1.70158) => x =>
    x * x * ((coefficient + 1) * x - coefficient);

  const _in = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    quad: quad,
    cubic: cubic,
    quart: quart,
    expo: expo,
    createBack: createBack
  });

  /**
   * "easeOutQuad" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const quad$1 = x => -square(x - 1) + 1;
  /**
   * "easeOutCubic" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const cubic$1 = x => cube(x - 1) + 1;
  /**
   * "easeOutQuart" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const quart$1 = x => -pow4(x - 1) + 1;
  /**
   * "easeOutExpo" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const expo$1 = x => (x < 1 ? -pow(2, -10 * x) + 1 : 1);
  /**
   * Creates a new "easeOutBack" function with `coefficient`.
   * @param coefficient Defaults to 1.70158
   * @returns "easeOutBack" function.
   */
  const createBack$1 = (coefficient = 1.70158) => {
    return x => {
      const r = x - 1;
      const r2 = r * r;
      return (coefficient + 1) * (r * r2) + coefficient * r2 + 1;
    };
  };

  const out = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    quad: quad$1,
    cubic: cubic$1,
    quart: quart$1,
    expo: expo$1,
    createBack: createBack$1
  });

  /**
   * Concatenates two easing functions without normalization.
   * @param easingA - Any easing function.
   * @param easingB - Any easing function.
   * @param thresholdRatio - Defaults to `0.5`.
   * @returns New easing function.
   */
  const concatenate = (easingA, easingB, thresholdRatio = 0.5) => {
    const inverseThresholdRatio = 1 / thresholdRatio;
    return ratio => {
      if (ratio < thresholdRatio) return easingA(inverseThresholdRatio * ratio);
      else {
        const ratioB = 1 - thresholdRatio;
        return easingB((ratio - thresholdRatio) / ratioB);
      }
    };
  };
  /**
   * Integrates two easing functions.
   * Results of both functions will be normalized depending on `thresholdRatio`.
   * @param easingA - Any easing function.
   * @param easingB - Any easing function.
   * @param thresholdRatio - Defaults to `0.5`.
   * @returns New easing function.
   */
  const integrate = (easingA, easingB, thresholdRatio = 0.5) => {
    const inverseThresholdRatio = 1 / thresholdRatio;
    return ratio => {
      if (ratio < thresholdRatio)
        return thresholdRatio * easingA(inverseThresholdRatio * ratio);
      else {
        const ratioB = 1 - thresholdRatio;
        return (
          thresholdRatio + ratioB * easingB((ratio - thresholdRatio) / ratioB)
        );
      }
    };
  };

  /**
   * "easeInOutQuad" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const quad$2 = integrate(quad, quad$1);
  /**
   * "easeInOutCubic" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const cubic$2 = integrate(cubic, cubic$1);
  /**
   * "easeInOutQuart" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const quart$2 = integrate(quart, quart$1);
  /**
   * "easeInOutExpo" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const expo$2 = integrate(expo, expo$1);
  /**
   * Creates a new "easeInOutBack" function with `coefficient`.
   * @param coefficient Defaults to 1.70158
   * @returns "easeInOutBack" function.
   */
  const createBack$2 = coefficient =>
    integrate(createBack(coefficient), createBack$1(coefficient));

  const inOut = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    quad: quad$2,
    cubic: cubic$2,
    quart: quart$2,
    expo: expo$2,
    createBack: createBack$2
  });

  /**
   * "easeOutInQuad" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const quad$3 = integrate(quad$1, quad);
  /**
   * "easeOutInCubic" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const cubic$3 = integrate(cubic$1, cubic);
  /**
   * "easeOutInQuart" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const quart$3 = integrate(quart$1, quart);
  /**
   * "easeOutInExpo" function.
   * @param x Any ratio.
   * @returns Eased ratio. `0` if x=0, `1` if x=1.
   */
  const expo$3 = integrate(expo$1, expo);
  /**
   * Creates a new "easeOutInBack" function with `coefficient`.
   * @param coefficient Defaults to 1.70158
   * @returns "easeOutInBack" function.
   */
  const createBack$3 = coefficient =>
    integrate(createBack$1(coefficient), createBack(coefficient));

  const outIn = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    quad: quad$3,
    cubic: cubic$3,
    quart: quart$3,
    expo: expo$3,
    createBack: createBack$3
  });

  /**
   * "easeLinear" function.
   * @param x Any ratio.
   * @returns Eased ratio (same as `x`). `0` if x=0, `1` if x=1.
   */
  const linear = x => x;

  const fullName$4 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    easeInQuad: quad,
    easeInCubic: cubic,
    easeInQuart: quart,
    easeInExpo: expo,
    createEaseInBack: createBack,
    easeOutQuad: quad$1,
    easeOutCubic: cubic$1,
    easeOutQuart: quart$1,
    easeOutExpo: expo$1,
    createEaseOutBack: createBack$1,
    easeInOutQuad: quad$2,
    easeInOutCubic: cubic$2,
    easeInOutQuart: quart$2,
    easeInOutExpo: expo$2,
    createEaseInOutBack: createBack$2,
    easeOutInQuad: quad$3,
    easeOutInCubic: cubic$3,
    easeOutInQuart: quart$3,
    easeOutInExpo: expo$3,
    createEaseOutInBack: createBack$3,
    easeLinear: linear,
    concatenateEasing: concatenate,
    integrateEasing: integrate
  });

  const index$4 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    In: _in,
    Out: out,
    InOut: inOut,
    OutIn: outIn,
    FullName: fullName$4,
    linear: linear,
    concatenate: concatenate,
    integrate: integrate
  });

  /**
   * The base random function that returns a random number from `0` up to (but not including) `1`.
   * Defaults to `Math.random`.
   * @returns A random value.
   */
  let random = Math.random;
  /**
   * Returns random value from `0` up to (but not including) `1`.
   * @returns A random value.
   */
  let ratio = random;
  /**
   * Sets `randomFunction` as the base function (which is initially set to `Math.random`)
   * so that it will be used as the base of all `Random` functions.
   * @param randomFunction - Any function that returns a (pseudo-)random number from `0` up to (but not including) `1`.
   */
  const setBaseFunction = randomFunction => {
    random = randomFunction;
    ratio = randomFunction;
  };

  /**
   * Returns random value from `0` up to (but not including) `max`.
   * @param max
   * @returns A random value.
   */
  const value = max => random() * max;
  /**
   * Returns random value from `0` to (but not including) `2 * PI`.
   * @returns A random radians value.
   */
  const angle$2 = () => random() * TWO_PI;
  /**
   * Returns random value from `start` up to (but not including) `end`.
   * @param start
   * @param end
   * @returns A random value.
   */
  const between = (start, end) => start + random() * (end - start);
  /**
   * Returns random value from `range.start` up to (but not including) `range.end`.
   * @param range
   * @returns A random value.
   */
  const inRange = range => between(range.start, range.end);
  /**
   * Returns `true` or `false` randomly.
   * @param probability A number between 0 and 1.
   * @returns `true` with the given `probability`.
   */
  const bool = probability => random() < probability;
  /**
   * Returns `1` or `-1` randomly.
   * @param positiveProbability A number between 0 and 1 for the probability of a positive value being returned.
   * @returns Either `1` or `-1`.
   */
  const sign$1 = positiveProbability =>
    random() < positiveProbability ? 1 : -1;
  /**
   * Returns a positive or negative value randomly with a magnitude from `0` up to (but not including) `maxMagnitude`.
   * @param maxMagnitude
   * @returns A random value.
   */
  const signed = maxMagnitude =>
    (random() < 0.5 ? 1 : -1) * random() * maxMagnitude;
  /**
   * Returns a positive or negative value randomly with a magnitude from `0` up to (but not including) `PI`.
   * @returns A random radians value.
   */
  const signedAngle = () => (random() < 0.5 ? 1 : -1) * random() * PI;

  /**
   * Returns a new vector with `length` and random angle.
   * @param length
   * @returns New `Vector2D` unit.
   */
  const vector = length => fromPolar(length, angle$2());
  /**
   * Returns a random point in `region`.
   * @param region
   * @returns Random `Vector2D`.
   */
  const pointInRectangleRegion = region => {
    const { topLeft, bottomRight } = region;
    return {
      x: between(topLeft.x, bottomRight.x),
      y: between(topLeft.y, bottomRight.y)
    };
  };

  /**
   * Returns random integer from 0 up to (but not including) `maxInt`.
   * `maxInt` is not expected to be negative.
   * @param maxInt
   * @returns A random integer value.
   */
  const value$1 = maxInt => floor(random() * maxInt);
  /**
   * Returns random integer from `minInt` up to (but not including) `maxInt`.
   * The case where `minInt > maxInt` or `maxInt <= 0` is not expected.
   * @param minInt
   * @param maxInt
   * @returns A random integer value.
   */
  const between$1 = (minInt, maxInt) =>
    minInt + floor(random() * (maxInt - minInt));
  /**
   * Returns a positive or negative integer randomly
   * with a magnitude from `0` up to (but not including) `maxMagnitude`.
   * @param maxMagnitude
   * @returns A random signed value.
   */
  const signed$1 = maxMagnitude =>
    (random() < 0.5 ? 1 : -1) * floor(random() * maxMagnitude);

  const integer = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    value: value$1,
    between: between$1,
    signed: signed$1
  });

  /**
   * Returns a random value at intervals of `step` from `0` up to (but not including) `1`.
   * @param step - E.g. if `0.25`, the result is either `0`, `0.25`, `0.5` or `0.75`.
   * @returns A random value.
   */
  const ratio$1 = step => floor(random() / step) * step;
  /**
   * Returns a random value at intervals of `step` from `0` up to (but not including) `max`.
   * @param step
   * @param max
   * @returns A random value.
   */
  const value$2 = (step, max) => floor(random() * (max / step)) * step;
  /**
   * Returns a random value at intervals of `step` from `min` up to (but not including) `max`.
   * @param step
   * @param min
   * @param max
   * @returns A random value.
   */
  const between$2 = (step, min, max) =>
    min + floor(random() * ((max - min) / step)) * step;
  /**
   * Returns a positive or negative value randomly at intervals of `step`
   * with a magnitude from `0` up to (but not including) `maxMagnitude`.
   * @param step
   * @param maxMagnitude
   * @returns A random signed value.
   */
  const signed$2 = (step, maxMagnitude) =>
    (random() < 0.5 ? 1 : -1) * floor(random() * (maxMagnitude / step)) * step;
  /**
   * Returns a random value at intervals of `step` from `0` to (but not including) `2 * PI`.
   * @param step - Interval angle.
   * @returns A random radians value.
   */
  const angle$3 = step => floor(random() * (TWO_PI / step)) * step;
  /**
   * Returns a positive or negative value randomly at intervals of `step`
   * with a magnitude from `0` up to (but not including) `PI`.
   * @param step - Interval angle.
   * @returns A random signed radians value.
   */
  const signedAngle$1 = step =>
    (random() < 0.5 ? 1 : -1) * floor(random() * (PI / step)) * step;

  const discrete = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    ratio: ratio$1,
    value: value$2,
    between: between$2,
    signed: signed$2,
    angle: angle$3,
    signedAngle: signedAngle$1
  });

  /**
   * Returns one element of `array` randomly.
   * `array` is not expected to be empty.
   * @param array
   * @returns A random element.
   */
  const get$2 = array => array[value$1(array.length)];
  /**
   * Removes and returns one element from `array` randomly.
   * `array` is not expected to be empty.
   * @param array
   * @returns A random element.
   */
  const removeGet = array => array.splice(value$1(array.length), 1)[0];

  const arrays = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    get: get$2,
    removeGet: removeGet
  });

  /**
   * Similar to `ratio()`, but remaps the result by `curve`.
   * @param curve Function that takes a random value between [0, 1] and returns a remapped value.
   * @returns A random value.
   */
  const ratio$2 = curve => curve(random());
  /**
   * Similar to `value()`, but remaps the result by `curve`.
   * @param curve Function that takes a random value between [0, 1] and returns a remapped value.
   * @param magnitude
   * @returns A random value.
   */
  const value$3 = (curve, magnitude) => curve(random()) * magnitude;
  /**
   * Similar to `between()`, but remaps the result by `curve`.
   * @param curve Function that takes a random value between [0, 1] and returns a remapped value.
   * @param start
   * @param end
   * @returns A random value.
   */
  const between$3 = (curve, start, end) =>
    start + curve(random()) * (end - start);
  /**
   * Similar to `inRange()`, but remaps the result by `curve`.
   * @param curve Function that takes a random value between [0, 1] and returns a remapped value.
   * @param range
   * @returns A random value.
   */
  const inRange$1 = (curve, range) => between$3(curve, range.start, range.end);
  /**
   * Similar to the normal `angle()`, but remaps the result by `curve`.
   * @param curve Any function that takes a random value between [0, 1) and returns a remapped value.
   * @returns A random radians value.
   */
  const angle$4 = curve => curve(random()) * TWO_PI;
  /**
   * Similar to the normal `signed()`, but remaps the result by `curve`.
   * @param curve Any function that takes a random value between [0, 1) and returns a remapped value.
   * @param magnitude
   * @returns A random signed value.
   */
  const signed$3 = (curve, magnitude) =>
    (random() < 0.5 ? 1 : -1) * curve(random()) * magnitude;
  /**
   * Similar to the normal `signedAngle()`, but remaps the result by `curve`.
   * @param curve Any function that takes a random value between [0, 1) and returns a remapped value.
   * @param magnitude
   * @returns A random signed radians value.
   */
  const signedAngle$2 = curve =>
    (random() < 0.5 ? 1 : -1) * curve(random()) * PI;

  const curved = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    ratio: ratio$2,
    value: value$3,
    between: between$3,
    inRange: inRange$1,
    angle: angle$4,
    signed: signed$3,
    signedAngle: signedAngle$2
  });

  const fullName$5 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    setBaseRandomFunction: setBaseFunction,
    get randomRatio() {
      return ratio;
    },
    randomValue: value,
    randomAngle: angle$2,
    randomBetween: between,
    randomInRange: inRange,
    randomBool: bool,
    randomSign: sign$1,
    randomSigned: signed,
    randomSignedAngle: signedAngle,
    randomInteger: value$1,
    randomIntegerBetween: between$1,
    randomIntegerSigned: signed$1,
    randomDiscreteRatio: ratio$1,
    randomDiscreteValue: value$2,
    randomDiscreteAngle: angle$3,
    randomDiscreteBetween: between$2,
    randomDiscreteSigned: signed$2,
    randomDiscreteSignedAngle: signedAngle$1,
    randomFromArray: get$2,
    randomRemoveFromArray: removeGet,
    randomRatioCurved: ratio$2,
    randomValueCurved: value$3,
    randomBetweenCurved: between$3,
    randomInRangeCurved: inRange$1,
    randomVector: vector,
    randomPointInRectangleRegin: pointInRectangleRegion
  });

  const index$5 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    Integer: integer,
    Discrete: discrete,
    Arrays: arrays,
    Curved: curved,
    FullName: fullName$5,
    get random() {
      return random;
    },
    get ratio() {
      return ratio;
    },
    setBaseFunction: setBaseFunction,
    value: value,
    angle: angle$2,
    between: between,
    inRange: inRange,
    bool: bool,
    sign: sign$1,
    signed: signed,
    signedAngle: signedAngle,
    vector: vector,
    pointInRectangleRegion: pointInRectangleRegion
  });

  /**
   * Calculates the scale factor for fitting `nonScaledSize` to `targetSize` keeping the original aspect ratio.
   *
   * @param nonScaledSize
   * @param targetSize
   * @param fittingOption Defaults to `FIT_TO_BOX`.
   */
  const calculateScaleFactor = (nonScaledSize, targetSize, fittingOption) => {
    switch (fittingOption) {
      default:
      case "FIT_TO_BOX":
        return min2(
          targetSize.width / nonScaledSize.width,
          targetSize.height / nonScaledSize.height
        );
      case "FIT_WIDTH":
        return targetSize.width / nonScaledSize.width;
      case "FIT_HEIGHT":
        return targetSize.height / nonScaledSize.height;
    }
  };

  const fitBox = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    calculateScaleFactor: calculateScaleFactor
  });

  /**
   * Finds HTML element by `id`. If not found, returns `document.body`.
   * @param id
   */
  const getElementOrBody = id => document.getElementById(id) || document.body;
  /**
   * Returns the width and height of `node`.
   * If `node === document.body`, returns the inner width and height of `window`.
   * @param node
   */
  const getElementSize = node =>
    node === document.body
      ? {
          width: window.innerWidth,
          height: window.innerHeight
        }
      : node.getBoundingClientRect();

  const htmlUtility = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    getElementOrBody: getElementOrBody,
    getElementSize: getElementSize
  });

  const returnVoid = () => {};
  const returnUndefined = () => undefined;
  const returnNull = () => null;
  const returnZero = () => 0;
  const returnOne = () => 1;
  const returnTrue = () => true;
  const returnFalse = () => false;
  const returnArgument = argument => argument;
  /**
   * Runs `callback` without any arguments.
   * @param callback - Any function that can be run without any arguments.
   */
  const runSelf = callback => callback();

  const constantFunction = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    returnVoid: returnVoid,
    returnUndefined: returnUndefined,
    returnNull: returnNull,
    returnZero: returnZero,
    returnOne: returnOne,
    returnTrue: returnTrue,
    returnFalse: returnFalse,
    returnArgument: returnArgument,
    runSelf: runSelf
  });

  let verbose = returnVoid;
  const outputVerbose = (yes = true) => {
    verbose = yes ? console.info : returnVoid;
  };
  const TIMER = "timer ";
  const CREATED = ": created.";
  const STARTING = ": starting...";
  const STARTED = ": started.";
  const COMPLETING = ": completing...";
  const COMPLETED = ": completed.";

  let nextComponentId = 0;
  /**
   * Callback function for running `component.step()`.
   * @param component
   */
  const step = component => component.step();
  /**
   * Callback function for running `component.reset()`.
   * @param component
   */
  const reset = component => component.reset();
  const defaultName = "no name";
  /**
   * Base class for other classes implementing `Component`.
   */
  class Base {
    constructor(onStart, onComplete) {
      this.id = nextComponentId++;
      this.name = defaultName;
      this.onStart = onStart;
      this.onComplete = onComplete;
      this.isStarted = false;
      this.isCompleted = false;
      verbose(TIMER, this.id, CREATED);
    }
    /**
     * If `this` is not yet started,
     * runs all functions in `this.onStart`, and sets `this.isStarted` to `true`.
     * @returns `true` if just started. `false` if already started.
     */
    tryStart() {
      if (this.isStarted) return false;
      const { id, name } = this;
      verbose(TIMER, id, name, STARTING);
      loopRunWithArgument(this.onStart, id);
      verbose(TIMER, id, name, STARTED);
      return (this.isStarted = true);
    }
    /**
     * Runs all functions in `this.onComplete`, and sets `this.isCompleted` to `true`.
     * @returns `true`.
     */
    complete() {
      const { id, name } = this;
      verbose(TIMER, id, name, COMPLETING);
      loopRunWithArgument(this.onComplete, id);
      verbose(TIMER, id, name, COMPLETED);
      return (this.isCompleted = true);
    }
    /**
     * Sets the name of `this` for debug purpose.
     * @param name
     * @returns `this` instance.
     */
    setName(name) {
      this.name = name;
      return this;
    }
  }

  const component = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    step: step,
    reset: reset,
    Base: Base
  });

  const createProgress = duration => {
    return {
      duration,
      ratioChangeRate: 1 / max2(1, duration),
      count: 0,
      ratio: 0
    };
  };
  const updateProgress = progress => {
    progress.count += 1;
    progress.ratio += progress.ratioChangeRate;
  };
  const resetProgress = progress => {
    progress.count = 0;
    progress.ratio = 0;
  };
  class Unit extends Base {
    constructor(onStart, onProgress, onComplete, progress) {
      super(onStart, onComplete);
      this.onProgress = onProgress;
      this.progress = progress;
    }
    static create(onStart, onProgress, onComplete, progress) {
      return new Unit(onStart, onProgress, onComplete, progress);
    }
    step() {
      if (this.isCompleted) return true;
      this.tryStart();
      const { progress } = this;
      if (progress.count >= progress.duration) {
        progress.ratio = 1;
        loopRunWithArgument(this.onProgress, progress);
        return this.complete();
      }
      loopRunWithArgument(this.onProgress, progress);
      updateProgress(progress);
      return false;
    }
    reset() {
      resetProgress(this.progress);
      this.isStarted = false;
      this.isCompleted = false;
      return this;
    }
    setName(name) {
      super.setName(name);
      return this;
    }
  }
  /**
   * Creates a `Timer` instance.
   * @param parameters
   * @returns New `Timer` instance.
   */
  const create$6 = parameters => {
    return Unit.create(
      unifyToArray(parameters.onStart),
      unifyToArray(parameters.onProgress),
      unifyToArray(parameters.onComplete),
      createProgress(parameters.duration)
    );
  };
  const dummy = Unit.create([], [], [], createProgress(0));
  dummy.isStarted = true;
  dummy.isCompleted = true;

  const setIndex = (chain, index) => {
    chain.index = index;
    chain.currentComponent = chain.components[index];
  };
  /**
   * Increments component index. Set `chain` completed if there is no next component.
   * @param chain
   * @returns `true` if completed i.e. there is no next component.
   */
  const setNextIndex = chain => {
    const nextIndex = chain.index + 1;
    if (nextIndex < chain.components.length) {
      setIndex(chain, nextIndex);
      return false;
    }
    return chain.complete();
  };
  class Unit$1 extends Base {
    constructor(components) {
      super([], []);
      this.components = components.slice();
      this.index = 0;
      this.currentComponent = components[0];
    }
    static create(components) {
      return new Unit$1(components);
    }
    step() {
      this.tryStart();
      if (!this.currentComponent.step()) return false;
      return setNextIndex(this);
    }
    reset() {
      loop(this.components, reset);
      setIndex(this, 0);
      this.isStarted = false;
      this.isCompleted = false;
      return this;
    }
    pushComponent(component) {
      this.components.push(component);
    }
    setName(name) {
      super.setName(name);
      return this;
    }
  }
  /**
   * Creates a sequential composite from `components`.
   * @param components
   * @returns New `Timer.Chain` instance.
   */
  const create$7 = components => Unit$1.create(components);

  const chain = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    Unit: Unit$1,
    create: create$7
  });

  class Unit$2 extends Base {
    constructor(components) {
      super([], []);
      this.components = components.slice();
      this.runningComponentList = fromArray(components.slice());
    }
    static create(components) {
      return new Unit$2(components);
    }
    step() {
      this.tryStart();
      const { runningComponentList } = this;
      removeShiftAll(runningComponentList, step);
      if (runningComponentList.size > 0) return false;
      return this.complete();
    }
    reset() {
      const { runningComponentList } = this;
      clear(runningComponentList);
      addArray(runningComponentList, this.components);
      loop$1(runningComponentList, reset);
      this.isStarted = false;
      this.isCompleted = false;
      return this;
    }
    setName(name) {
      super.setName(name);
      return this;
    }
    addComponent(component) {
      this.components.push(component);
      add(this.runningComponentList, component);
    }
  }
  /**
   * Creates a parallel composite from `components`.
   * @param components
   * @returns New `Timer.Parallel` instance.
   */
  const create$8 = components => Unit$2.create(components);

  const parallel = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    Unit: Unit$2,
    create: create$8
  });

  class Unit$3 extends Base {
    constructor(component, loopCount) {
      super([], []);
      this.component = component;
      this.loopCount = loopCount;
      this.remainingCount = loopCount;
    }
    static create(component, loopCount) {
      return new Unit$3(component, loopCount);
    }
    step() {
      this.tryStart();
      if (!this.component.step()) return false;
      if (this.isCompleted) return true;
      if ((this.remainingCount -= 1) > 0) {
        this.component.reset();
        return false;
      }
      return this.complete();
    }
    reset() {
      const { loopCount } = this;
      this.remainingCount = loopCount;
      this.component.reset();
      this.isStarted = false;
      this.isCompleted = false;
      return this;
    }
    setName(name) {
      super.setName(name);
      return this;
    }
  }
  /**
   * Creates a looped component from `component`.
   * @param component
   * @param loopCount `Infinity` if not specified.
   * @returns New `Timer.Loop` instance.
   */
  const create$9 = (component, loopCount = Infinity) =>
    Unit$3.create(component, loopCount);

  const loop$3 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    Unit: Unit$3,
    create: create$9
  });

  const create$a = capacity => {
    return {
      runningComponents: create(capacity),
      newComponentsBuffer: create(capacity)
    };
  };
  const add$4 = (timerSet, component) =>
    add(timerSet.newComponentsBuffer, component);
  const step$1 = timerSet => {
    const { runningComponents, newComponentsBuffer } = timerSet;
    addList(runningComponents, newComponentsBuffer);
    clear(newComponentsBuffer);
    removeShiftAll(runningComponents, step);
  };
  const clear$3 = timerSet => {
    clear(timerSet.runningComponents);
    clear(timerSet.newComponentsBuffer);
  };
  /**
   * Creates a timer set instance and returns a set of bound functions.
   * @param capacity
   */
  const construct = capacity => {
    const timerSet = create$a(capacity);
    return {
      add: add$4.bind(undefined, timerSet),
      step: step$1.bind(undefined, timerSet),
      clear: clear$3.bind(undefined, timerSet)
    };
  };

  const set$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    create: create$a,
    add: add$4,
    step: step$1,
    clear: clear$3,
    construct: construct
  });

  const index$6 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    Component: component,
    Chain: chain,
    Parallel: parallel,
    Loop: loop$3,
    Set: set$1,
    chain: create$7,
    parallel: create$8,
    loop: create$9,
    outputVerbose: outputVerbose,
    Unit: Unit,
    create: create$6,
    dummy: dummy
  });

  const morseCodeMap = new Map([
    ["A", ".-"],
    ["B", "-..."],
    ["C", "-.-."],
    ["D", "-.."],
    ["E", "."],
    ["F", "..-."],
    ["G", "--."],
    ["H", "...."],
    ["I", ".."],
    ["J", ".---"],
    ["K", "-.-"],
    ["L", ".-.."],
    ["M", "--"],
    ["N", "-."],
    ["O", "---"],
    ["P", ".--."],
    ["Q", "--.-"],
    ["R", ".-."],
    ["S", "..."],
    ["T", "-"],
    ["U", "..-"],
    ["V", "...-"],
    ["W", ".--"],
    ["X", "-..-"],
    ["Y", "-.--"],
    ["Z", "--.."],
    ["1", ".----"],
    ["2", "..---"],
    ["3", "...--"],
    ["4", "....-"],
    ["5", "....."],
    ["6", "-...."],
    ["7", "--..."],
    ["8", "---.."],
    ["9", "----."],
    ["0", "-----"],
    [".", ".-.-.-"],
    [",", "--..--"],
    [":", "---..."],
    ["?", "..--.."],
    ["'", ".----."],
    ["!", "-.-.--"],
    ["-", "-....-"],
    ["/", "-..-."],
    ["@", ".--.-."],
    ["(", "-.--."],
    [")", "-.--.-"],
    ['"', ".-..-."],
    ["=", "-...-"],
    ["+", ".-.-."]
  ]);
  const createSignalUnit = (isOn, length, codeString) => {
    let s = "";
    const binaryCharacter = isOn ? "1" : "0";
    for (let i = 0; i < length; i += 1) {
      s += binaryCharacter;
    }
    return Object.freeze({
      isOn,
      length,
      codeString,
      binaryString: s
    });
  };
  const createOnSignalUnit = (length, codeString) =>
    createSignalUnit(true, length, codeString);
  const createOffSignalUnit = (length, codeString) =>
    createSignalUnit(false, length, codeString);
  const DIT = createOnSignalUnit(1, ".");
  const DAH = createOnSignalUnit(3, "-");
  const INTER_ELEMENT_GAP = createOffSignalUnit(1, "");
  const SHORT_GAP = createOffSignalUnit(3, " ");
  const MEDIUM_GAP = createOffSignalUnit(7, " / ");
  const NUL = createOffSignalUnit(0, "");
  function encode(sentence) {
    const upperCaseSentence = sentence.toUpperCase();
    const signals = [];
    let gap = undefined;
    for (let i = 0, len = upperCaseSentence.length; i < len; i += 1) {
      const character = upperCaseSentence.charAt(i);
      if (character === " ") {
        gap = MEDIUM_GAP;
        continue;
      } else if (character.charCodeAt(0) === 0) {
        if (gap) signals.push(gap);
        gap = undefined;
        signals.push(NUL);
        continue;
      }
      const code = morseCodeMap.get(character);
      if (!code) continue;
      for (let k = 0, kLen = code.length; k < kLen; k += 1) {
        if (gap) signals.push(gap);
        switch (code.charAt(k)) {
          case ".":
            signals.push(DIT);
            break;
          case "-":
          case "_":
            signals.push(DAH);
            break;
          default:
            continue;
        }
        gap = INTER_ELEMENT_GAP;
      }
      gap = SHORT_GAP;
    }
    return signals;
  }
  const toString = signals =>
    signals.reduce((acc, cur) => acc + cur.codeString, "");
  const toBinaryString = signals =>
    signals.reduce((acc, cur) => acc + cur.binaryString, "");
  const getTotalLength = signals =>
    signals.reduce((acc, cur) => acc + cur.length, 0);

  const signal = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    DIT: DIT,
    DAH: DAH,
    INTER_ELEMENT_GAP: INTER_ELEMENT_GAP,
    SHORT_GAP: SHORT_GAP,
    MEDIUM_GAP: MEDIUM_GAP,
    NUL: NUL,
    encode: encode,
    toString: toString,
    toBinaryString: toBinaryString,
    getTotalLength: getTotalLength
  });

  /**
   * Returns duration time per dot in milliseconds.
   * @param wpm - word (PARIS) per minute
   */
  function wpmToDotDuration(wpm) {
    return 1000 / (50 * (wpm / 60));
  }
  const create$b = (on, off, wpm = 25, signals = [], loop = false) => {
    return {
      on,
      off,
      wpm,
      unitTime: wpmToDotDuration(wpm),
      loop,
      signals,
      index: 0,
      timeout: undefined
    };
  };
  const stop = channel => {
    if (channel.timeout) {
      channel.off(NUL);
      clearTimeout(channel.timeout);
      channel.timeout = undefined;
    }
    channel.index = 0;
  };
  const runCurrentSignal = channel => {
    const { unitTime, signals, index, on, off } = channel;
    const currentSignal = signals[index];
    if (currentSignal.isOn) on(currentSignal);
    else off(currentSignal);
    return unitTime * currentSignal.length;
  };
  const setNextRun = (run, channel, ms) => {
    channel.timeout = setTimeout(() => {
      channel.timeout = undefined;
      run(channel);
    }, ms);
  };
  const run = channel => {
    const currentSignalTimeLength = runCurrentSignal(channel);
    channel.index += 1;
    if (channel.index < channel.signals.length) {
      setNextRun(run, channel, currentSignalTimeLength);
      return;
    }
    channel.timeout = setTimeout(() => {
      if (channel.loop) {
        channel.off(NUL);
        channel.timeout = undefined;
      } else {
        channel.off(MEDIUM_GAP);
        setNextRun(run, channel, MEDIUM_GAP.length);
      }
    }, currentSignalTimeLength);
    channel.index = 0;
  };
  const start = (channel, signals) => {
    stop(channel);
    if (signals) channel.signals = signals;
    run(channel);
  };

  const channel = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    wpmToDotDuration: wpmToDotDuration,
    create: create$b,
    stop: stop,
    start: start
  });

  const index$7 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    Signal: signal,
    Channel: channel
  });

  /**
   * Creates a `Timer` instance for tweening value using `setValue()`.
   * @param setValue A function that receives the tweened value.
   * @param duration Duration frame count.
   * @param parameters `start`, `end` and `easing`(linear by default).
   * @returns New `Timer` instance.
   */
  const create$c = (setValue, duration, parameters) => {
    const { start, end } = parameters;
    const ease = parameters.easing || linear;
    return create$6({
      duration,
      onProgress: progress => setValue(lerp(start, end, ease(progress.ratio)))
    });
  };
  /**
   * Creates a `Timer` instance for tweening value using `setValue()`.
   * The parameters are evaluated at the timing when the timer starts.
   * @param setValue A function that receives the tweened value.
   * @param duration Duration frame count.
   * @param getParameters A function that returns `start`, `end` and `easing`(linear by default).
   * @returns New `Timer` instance.
   */
  const setCreate = (setValue, duration, getParameters) => {
    let startValue;
    let endValue;
    let ease;
    return create$6({
      duration,
      onStart: () => {
        const { start, end, easing } = getParameters();
        startValue = start;
        endValue = end;
        ease = easing || linear;
      },
      onProgress: progress =>
        setValue(lerp(startValue, endValue, ease(progress.ratio)))
    });
  };

  /**
   * Creates a `Timer` instance for tweening `vector` from the current values.
   * @param vector The vector to tween.
   * @param duration Duration frame count.
   * @param parameters `target`, `duration` and `easing`(linear by default).
   * @returns New `Timer` instance.
   */
  const create$d = (vector, duration, parameters) => {
    const { x: startX, y: startY } = vector;
    const { x: endX, y: endY } = parameters.target;
    const ease = parameters.easing || linear;
    return create$6({
      duration,
      onProgress: progress => {
        const ratio = ease(progress.ratio);
        setCartesian(
          vector,
          lerp(startX, endX, ratio),
          lerp(startY, endY, ratio)
        );
      }
    });
  };
  /**
   * Creates a `Timer` instance for tweening `vector`.
   * The starting values of `vector` and the parameters are evaluated at the timing when the timer starts.
   * @param vector The vector to tween.
   * @param duration Duration frame count.
   * @param parameters `target`, `duration` and `easing`(linear by default).
   * @returns New `Timer` instance.
   */
  const setCreate$1 = (vector, duration, getParameters) => {
    let startX, startY;
    let endX, endY;
    let ease;
    return create$6({
      duration,
      onStart: () => {
        const { target, easing } = getParameters();
        ({ x: startX, y: startY } = vector);
        ({ x: endX, y: endY } = target);
        ease = easing || linear;
      },
      onProgress: progress => {
        const ratio = ease(progress.ratio);
        setCartesian(
          vector,
          lerp(startX, endX, ratio),
          lerp(startY, endY, ratio)
        );
      }
    });
  };

  const vector2d = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    create: create$d,
    setCreate: setCreate$1
  });

  const index$8 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    Vector2D: vector2d,
    create: create$c,
    setCreate: setCreate
  });

  /**
   * Prints info message.
   */
  let info = returnVoid;
  /**
   * Prints warning message.
   */
  let warn = returnVoid;
  /**
   * Prints error message.
   */
  let error = returnVoid;
  /**
   * Sets if info messages should be output to console log.
   * @param yes
   */
  const outputInfo = (yes = true) => {
    info = yes ? console.info : returnVoid;
  };
  /**
   * Sets if warning messages should be output to console log.
   * @param yes
   */
  const outputWarn = (yes = true) => {
    warn = yes ? console.warn : returnVoid;
  };
  /**
   * Sets if error messages should be output to console log.
   * @param yes
   */
  const outputError = (yes = true) => {
    error = yes ? console.error : returnVoid;
  };

  const log$1 = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    get info() {
      return info;
    },
    get warn() {
      return warn;
    },
    get error() {
      return error;
    },
    outputInfo: outputInfo,
    outputWarn: outputWarn,
    outputError: outputError
  });

  // この辺からquantity（物理量）

  const createQuantity = (x, y, vx, vy) => {
    return {
      x,
      y,
      vx: vx || 0,
      vy: vy || 0
    };
  };
  /**
   * Updates the kinematic quantity naively by Euler method, i.e. adding velocity to position.
   * @param quantity
   */
  const updateEuler = quantity => {
    quantity.x += quantity.vx;
    quantity.y += quantity.vy;
  };
  /**
   * Updates the kinematic quantity naively by Euler method,
   * i.e. adding velocity to position and adding acceleration to velocity.
   * @param quantity
   * @param ax
   * @param ay
   */
  const updateEulerAccelerated = (quantity, ax, ay) => {
    quantity.x += quantity.vx;
    quantity.y += quantity.vy;
    quantity.vx += ax;
    quantity.vy += ay;
  };
  /**
   * Updates the kinematic quantity by Velocity Verlet method.
   * Be sure to use `postUpdateVerlet()` with updated acceleration values after using this function.
   *
   * Not sure if this implementation is correct!
   * @param quantity
   */
  const updateVerlet = (quantity, ax, ay) => {
    quantity.vx2 = quantity.vx + 0.5 * ax;
    quantity.vy2 = quantity.vy + 0.5 * ay;
    quantity.vx += ax;
    quantity.vy += ay;
    quantity.x += quantity.vx2;
    quantity.y += quantity.vy2;
  };
  /**
   * Completes updating the kinematic quantity by Velocity Verlet method after updating the force.
   *
   * Not sure if this implementation is correct!
   * @param quantity
   */
  const postUpdateVerlet = (quantity, ax, ay) => {
    quantity.vx = quantity.vx2 + 0.5 * ax;
    quantity.vy = quantity.vy2 + 0.5 * ay;
  };
  /**
   * Assigns position values to `target` vector.
   * @param quantity
   * @param target
   * @returns `target` vector with assigned position.
   */
  const positionVector = (quantity, target) =>
    setCartesian$1(quantity.x, quantity.y, target);
  /**
   * Extracts velocity values to `target` vector.
   * @param quantity
   * @param target
   * @returns `target` vector with assigned velocity.
   */
  const velocityVector = (quantity, target) =>
    setCartesian$1(quantity.vx, quantity.vy, target);
  /**
   * Returns the speed.
   * @param quantity
   * @returns The speed.
   */
  const getSpeed = quantity => hypotenuse2D(quantity.vx, quantity.vy);
  /**
   * Returns the velocity angle.
   * @param quantity
   * @returns The angle.
   */
  const getVelocityAngle = quantity => atan2safe(quantity.vy, quantity.vx);
  /**
   * Truncates the speed (magnitude of velocity) if it is greater than `maxSpeed`.
   * @param quantity
   * @param maxSpeed
   * @returns The `quantity` instance with truncated velocity values.
   */
  const truncateVelocity = (quantity, maxSpeed) => {
    const { vx, vy } = quantity;
    if (hypotenuseSquared2D(vx, vy) <= maxSpeed * maxSpeed) return quantity;
    const angle = atan2(vy, vx);
    quantity.vx = maxSpeed * cos(angle);
    quantity.vy = maxSpeed * sin(angle);
    return quantity;
  };
  /**
   * Set values of `velocity` to `quantity`.
   * @param quantity
   * @param velocity
   * @returns The `quantity` instance with assigned velocity.
   */
  const setVelocity = (quantity, velocity) => {
    quantity.vx = velocity.x;
    quantity.vy = velocity.y;
    return quantity;
  };
  /**
   * Set velocity values to `quantity`.
   * @param quantity
   * @param velocity
   * @returns The `quantity` instance with assigned velocity.
   */
  const setVelocityCartesian = (quantity, vx, vy) => {
    quantity.vx = vx;
    quantity.vy = vy;
    return quantity;
  };
  /**
   * Set velocity values to `quantity`.
   * @param quantity
   * @param velocity
   * @returns The `quantity` instance with assigned velocity.
   */
  const setVelocityPolar = (quantity, length, angle) => {
    quantity.vx = length * cos(angle);
    quantity.vy = length * sin(angle);
    return quantity;
  };
  /**
   * Let `quantity` bounce if it is out of `region`.
   * @param region
   * @param coefficientOfRestitution
   * @param quantity
   * @returns `true` if bounced.
   */
  const bounceInRectangleRegion = (
    region,
    coefficientOfRestitution,
    quantity
  ) => {
    const { x, y, vx, vy } = quantity;
    const { x: leftX, y: topY } = region.topLeft;
    const { x: rightX, y: bottomY } = region.bottomRight;
    if (x < leftX) {
      quantity.x = leftX;
      if (vx < 0) quantity.vx = -coefficientOfRestitution * vx;
      return true;
    } else if (x >= rightX) {
      quantity.x = rightX - 1;
      if (vx > 0) quantity.vx = -coefficientOfRestitution * vx;
      return true;
    }
    if (y < topY) {
      quantity.y = topY;
      if (vy < 0) quantity.vy = -coefficientOfRestitution * vy;
      return true;
    } else if (y >= bottomY) {
      quantity.y = bottomY - 1;
      if (vy > 0) quantity.vy = -coefficientOfRestitution * vy;
      return true;
    }
    return false;
  };

  const kinematics = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    createQuantity: createQuantity,
    updateEuler: updateEuler,
    updateEulerAccelerated: updateEulerAccelerated,
    updateVerlet: updateVerlet,
    postUpdateVerlet: postUpdateVerlet,
    positionVector: positionVector,
    velocityVector: velocityVector,
    getSpeed: getSpeed,
    getVelocityAngle: getVelocityAngle,
    truncateVelocity: truncateVelocity,
    setVelocity: setVelocity,
    setVelocityCartesian: setVelocityCartesian,
    setVelocityPolar: setVelocityPolar,
    bounceInRectangleRegion: bounceInRectangleRegion
  });

  const createQuantity$1 = (x, y, vx, vy) => {
    return {
      x,
      y,
      vx: vx || 0,
      vy: vy || 0,
      fx: 0,
      fy: 0
    };
  };
  const createVerletQuantity = (x, y, vx, vy) => {
    return {
      x,
      y,
      vx: vx || 0,
      vy: vy || 0,
      vx2: 0,
      vy2: 0,
      fx: 0,
      fy: 0
    };
  };
  /**
   * Updates the kinematic quantity naively by Euler method. Applies the below:
   * 1. Update position by adding velocity.
   * 2. Update velocity by applying force.
   * 3. Clear force to zero.
   *
   * Not sure if this implementation is correct!
   * @param quantity
   */
  const updateEuler$1 = quantity => {
    updateEulerAccelerated(quantity, quantity.fx, quantity.fy);
    quantity.fx = 0;
    quantity.fy = 0;
  };
  /**
   * Updates the kinematic quantity by Velocity Verlet method.
   * Be sure to update force after running this function and then run `postUpdateVerlet()`.
   *
   * Not sure if this implementation is correct!
   * @param quantity
   */
  const updateVerlet$1 = quantity => {
    updateVerlet(quantity, quantity.fx, quantity.fy);
    quantity.fx = 0;
    quantity.fy = 0;
  };
  /**
   * Completes updating the kinematic quantity by Velocity Verlet method after updating the force.
   *
   * Not sure if this implementation is correct!
   * @param quantity
   */
  const postUpdateVerlet$1 = quantity => {
    postUpdateVerlet(quantity, quantity.fx, quantity.fy);
    quantity.fx = 0;
    quantity.fy = 0;
  };
  /**
   * Extracts force values to `target` vector.
   * @param quantity
   * @param target
   * @returns `target` vector with assigned acceleration.
   */
  const forceVector = (quantity, target) =>
    setCartesian$1(quantity.fx, quantity.fy, target);
  /**
   * Truncates the magnitude of force if it is greater than `maxMagnitude`.
   * @param quantity
   * @param maxSpeed
   * @returns The `quantity` instance with truncated force values.
   */
  const truncateForce = (quantity, maxMagnitude) => {
    const { fx, fy } = quantity;
    if (hypotenuseSquared2D(fx, fy) <= maxMagnitude * maxMagnitude)
      return quantity;
    const angle = atan2(fy, fx);
    quantity.fx = maxMagnitude * cos(angle);
    quantity.fy = maxMagnitude * sin(angle);
    return quantity;
  };
  /**
   * Adds `force` to `quantity`.
   * @param quantity
   * @param force
   * @returns The `quantity` instance with assigned force.
   */
  const addForce = (quantity, force) => {
    quantity.fx += force.x;
    quantity.fy += force.y;
    return quantity;
  };
  /**
   * Adds force values to `quantity`.
   * @param quantity
   * @param fx
   * @param fy
   * @returns The `quantity` instance with assigned force.
   */
  const addForceCartesian = (quantity, fx, fy) => {
    quantity.fx += fx;
    quantity.fy += fy;
    return quantity;
  };
  /**
   * Adds force values to `quantity`.
   * @param quantity
   * @param magnitude
   * @param angle
   * @returns The `quantity` instance with assigned force.
   */
  const addForcePolar = (quantity, magnitude, angle) => {
    quantity.fx += magnitude * cos(angle);
    quantity.fy += magnitude * sin(angle);
    return quantity;
  };

  const simpleDynamics = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    createQuantity: createQuantity$1,
    createVerletQuantity: createVerletQuantity,
    updateEuler: updateEuler$1,
    updateVerlet: updateVerlet$1,
    postUpdateVerlet: postUpdateVerlet$1,
    forceVector: forceVector,
    truncateForce: truncateForce,
    addForce: addForce,
    addForceCartesian: addForceCartesian,
    addForcePolar: addForcePolar
  });

  const createQuantity$2 = (x, y, mass, vx, vy) => {
    return {
      x,
      y,
      vx: vx || 0,
      vy: vy || 0,
      fx: 0,
      fy: 0,
      mass
    };
  };
  const createVerletQuantity$1 = (x, y, mass, vx, vy) => {
    return {
      x,
      y,
      vx: vx || 0,
      vy: vy || 0,
      vx2: 0,
      vy2: 0,
      fx: 0,
      fy: 0,
      mass
    };
  };
  /**
   * Updates the kinematic quantity naively by Euler method. Applies the below:
   * 1. Update position by adding velocity.
   * 2. Update velocity by applying force.
   * 3. Clear force to zero.
   *
   * Not sure if this implementation is correct!
   * @param quantity
   */
  const updateEuler$2 = quantity => {
    const { mass } = quantity;
    updateEulerAccelerated(quantity, quantity.fx / mass, quantity.fy / mass);
    quantity.fx = 0;
    quantity.fy = 0;
  };
  /**
   * Updates the kinematic quantity by Velocity Verlet method.
   * Be sure to update force after running this function and then run `postUpdateVerlet()`.
   *
   * Not sure if this implementation is correct!
   * @param quantity
   */
  const updateVerlet$2 = quantity => {
    const { mass } = quantity;
    updateVerlet(quantity, quantity.fx / mass, quantity.fy / mass);
    quantity.fx = 0;
    quantity.fy = 0;
  };
  /**
   * Completes updating the kinematic quantity by Velocity Verlet method after updating the force.
   *
   * Not sure if this implementation is correct!
   * @param quantity
   */
  const postUpdateVerlet$2 = quantity => {
    const { mass } = quantity;
    postUpdateVerlet(quantity, quantity.fx / mass, quantity.fy / mass);
    quantity.fx = 0;
    quantity.fy = 0;
  };

  const dynamics = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    createQuantity: createQuantity$2,
    createVerletQuantity: createVerletQuantity$1,
    updateEuler: updateEuler$2,
    updateVerlet: updateVerlet$2,
    postUpdateVerlet: postUpdateVerlet$2
  });

  let constant = 1;
  let minusConstant = -constant;
  const setConstant = value => {
    constant = value;
    minusConstant = -constant;
  };
  /**
   * Calculates gravitation force.
   * @param attractedRelative Relative position from attractor to attracted.
   * @param massProduct Pre-calcultad product of mass of attractor and attracted.
   * @param distance Pre-calculated distance.
   * @param target Vector to assign the result.
   * @returns The `target` vector with assigned gravitation force.
   */
  const calculateCore = (attractedRelative, massProduct, distance, target) =>
    multiply$2(
      attractedRelative,
      (minusConstant * massProduct) / (distance * distance * distance),
      target
    );
  /**
   * Calculates gravitation force applied on point mass `attracted` exerted by point mass `attractor`.
   * @param attractor Object that has `x`, `y` and `mass`.
   * @param attracted Object that has `x`, `y` and `mass`.
   * @param target Vector to assign the result.
   * @returns The `target` vector with assigned gravitation force.
   */
  const calculate = (attractor, attracted, target) =>
    calculateCore(
      subtract$2(attracted, attractor, target),
      attractor.mass * attracted.mass,
      distance(attractor, attracted),
      target
    );
  /**
   * Calculates gravitation force, assuming that the mass is always `1`.
   * @param attractedRelative Relative position from attractor to attracted.
   * @param distance Pre-calculated distance.
   * @param target Vector to assign the result.
   * @returns The `target` vector with assigned gravitation force.
   */
  const calculateCoreSimple = (attractedRelative, distance, target) =>
    multiply$2(
      attractedRelative,
      minusConstant / (distance * distance * distance),
      target
    );
  /**
   * Calculates gravitation force applied on point `attracted` exerted by point `attractor`, assuming that the mass is always `1`.
   * @param attractor
   * @param attracted
   * @param target Vector to assign the result.
   * @returns The `target` vector with assigned gravitation force.
   */
  const calculateSimple = (attractor, attracted, target) =>
    calculateCoreSimple(
      subtract$2(attracted, attractor, target),
      distance(attractor, attracted),
      target
    );
  /**
   * Adds gravitation force between `bodyA` and `bodyB`.
   * @param bodyA
   * @param bodyB
   * @param forceOnBodyB
   */
  const addForceEachOther = (bodyA, bodyB, forceOnBodyB) => {
    const { x: forceX, y: forceY } = forceOnBodyB;
    bodyA.fx -= forceX;
    bodyA.fy -= forceY;
    bodyB.fx += forceX;
    bodyB.fy += forceY;
  };
  const temporalGravitation = { x: 0, y: 0 };
  /**
   * Set of functions that calculate gravitation force and apply it on the body.
   */
  const attract = {
    /**
     * Calculates gravitation force using pre-calculated values and applies it on `attracted`.
     * @param attracted
     * @param attractedRelative The relative position from the attractor to `attracted`.
     * @param massProduct The pre-calculated product of mass of the attractor and `attracted`
     * @param distance The pre-calculated distance between the attractor and `attracted`.
     */
    precalculated: (attracted, attractedRelative, massProduct, distance) =>
      addForce(
        attracted,
        calculateCore(
          attractedRelative,
          massProduct,
          distance,
          temporalGravitation
        )
      ),
    /**
     * Calculates gravitation force and applies it on `attracted`.
     */
    calculate: (attractor, attracted) =>
      addForce(attracted, calculate(attractor, attracted, temporalGravitation)),
    /**
     * Calculates gravitation force using pre-calculated distance and applies it on `attracted`,
     * assuming that the mass is always `1`.
     * @param attracted
     * @param attractedRelative The relative position from the attractor to `attracted`.
     * @param distance The pre-calculated distance between the attractor and `attracted`.
     */
    precalculatedSimple: (attracted, attractedRelative, distance) =>
      addForce(
        attracted,
        calculateCoreSimple(attractedRelative, distance, temporalGravitation)
      ),
    /**
     * Calculates gravitation force and applies it on `attracted`,
     * assuming that the mass is always `1`.
     */
    calculateSimple: (attractor, attracted) =>
      addForce(
        attracted,
        calculateSimple(attractor, attracted, temporalGravitation)
      )
  };
  /**
   * Set of functions that calculate gravitation force and apply it on both bodies.
   */
  const attractEachOther = {
    /**
     * Calculates gravitation force using pre-calculated values and applies it on both `bodyA` and `bodyB`.
     * @param bodyA
     * @param bodyB
     * @param bodyBRelative The relative position from `bodyA` to `bodyB`.
     * @param massProduct The pre-calculated product of mass of `bodyA` and `bodyB`
     * @param distance The pre-calculated distance between `bodyA` and `bodyB`.
     */
    precalculated: (bodyA, bodyB, bodyBRelative, massProduct, distance) =>
      addForceEachOther(
        bodyA,
        bodyB,
        calculateCore(bodyBRelative, massProduct, distance, temporalGravitation)
      ),
    /**
     * Calculates gravitation force and applies it on both `bodyA` and `bodyB`.
     */
    calculate: (bodyA, bodyB) =>
      addForceEachOther(
        bodyA,
        bodyB,
        calculate(bodyA, bodyB, temporalGravitation)
      ),
    /**
     * Calculates gravitation force using pre-calculated distance and applies it on both `bodyA` and `bodyB`,
     * assuming that the mass is always `1`.
     * @param bodyA
     * @param bodyB
     * @param bodyBRelative The relative position from `bodyA` to `bodyB`.
     * @param distance The pre-calculated distance between `bodyA` and `bodyB`.
     */
    precalculatedSimple: (bodyA, bodyB, bodyBRelative, distance) =>
      addForceEachOther(
        bodyA,
        bodyB,
        calculateCoreSimple(bodyBRelative, distance, temporalGravitation)
      ),
    /**
     * Calculates gravitation force and applies it on both `bodyA` and `bodyB`,
     * assuming that the mass is always `1`.
     */
    calculateSimple: (bodyA, bodyB) =>
      addForceEachOther(
        bodyA,
        bodyB,
        calculateSimple(bodyA, bodyB, temporalGravitation)
      )
  };

  const gravitation = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    get constant() {
      return constant;
    },
    setConstant: setConstant,
    calculateCore: calculateCore,
    calculate: calculate,
    calculateCoreSimple: calculateCoreSimple,
    calculateSimple: calculateSimple,
    attract: attract,
    attractEachOther: attractEachOther
  });

  /**
   * Updates rotation by adding `rotationVelocity` to `rotationAngle`.
   * @param quantity
   */
  const update = quantity => {
    quantity.rotationAngle += quantity.rotationVelocity;
  };
  /**
   * Creates a new rotation quantity with random initial angle, random rotation direction and
   * random rotational speed within the given range.
   * @param minRotationSpeed
   * @param maxRotationSpeed
   * @returns New `Rotation.Quantity`.
   */
  const createRandomQuantity = (minRotationSpeed, maxRotationSpeed) => {
    return {
      rotationAngle: angle$2(),
      rotationVelocity: signed(between(minRotationSpeed, maxRotationSpeed))
    };
  };

  const rotation = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    update: update,
    createRandomQuantity: createRandomQuantity
  });

  /**
   * Creates an array of HSV values with random hue ∈ [0, 360].
   * @param saturation
   * @param value
   * @returns New array of HSV values.
   */
  const withRandomHue = (saturation, value$1) => [
    value(360),
    saturation,
    value$1
  ];
  /**
   * Converts HSV values (hue ∈ [0, 360], saturation ∈ [0, 1] and value ∈ [0, 1])
   * to RGB values (red, green, blue ∈ [0, 1]).
   * @param hsvValues
   * @returns New array of RGB values.
   */
  const toRGB = hsvValues => {
    const [hue, saturation, value] = hsvValues;
    const c = value * saturation;
    const dividedHue = hue * INVERSE60;
    const x = c * (1 - abs((dividedHue % 2) - 1));
    let tmpValues;
    switch (floor(dividedHue)) {
      case 0:
        tmpValues = [c, x, 0];
        break;
      case 1:
        tmpValues = [x, c, 0];
        break;
      case 2:
        tmpValues = [0, c, x];
        break;
      case 3:
        tmpValues = [0, x, c];
        break;
      case 4:
        tmpValues = [x, 0, c];
        break;
      case 5:
        tmpValues = [c, 0, x];
        break;
      default:
        tmpValues = [0, 0, 0];
        break;
    }
    const m = value - c;
    return [tmpValues[0] + m, tmpValues[1] + m, tmpValues[2] + m];
  };

  const hsv = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    withRandomHue: withRandomHue,
    toRGB: toRGB
  });

  exports.Angle = angle;
  exports.ArrayList = index$1;
  exports.ArrayQueue = index$2;
  exports.Arrays = index;
  exports.Bezier = bezier;
  exports.ConstantFunction = constantFunction;
  exports.Coordinates2D = coordinates2d;
  exports.Dynamics = dynamics;
  exports.Easing = index$4;
  exports.FitBox = fitBox;
  exports.Gravitation = gravitation;
  exports.HSV = hsv;
  exports.HtmlUtility = htmlUtility;
  exports.Kinematics = kinematics;
  exports.Lazy = lazy;
  exports.Log = log$1;
  exports.MathConstants = constants;
  exports.MorseCode = index$7;
  exports.Numeric = numeric;
  exports.Random = index$5;
  exports.RectangleRegion = rectangleRegion;
  exports.RectangleSize = rectangleSize;
  exports.Rotation = rotation;
  exports.SimpleDynamics = simpleDynamics;
  exports.StructureOfArrays = structureOfArrays;
  exports.Timer = index$6;
  exports.Tween = index$8;
  exports.Vector2D = index$3;

  Object.defineProperty(exports, "__esModule", { value: true });
});

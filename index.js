const LARGE = 1 << 25;

/**
 * [DEFAULT_CMP description]
 * @param {[type]} a [description]
 * @param {[type]} b [description]
 */
const DEFAULT_CMP = (a, b) => {
  if (a === b) return 0;
  if (a < b) return -1;
  if (a > b) return 1;
  throw new Error('Unable to cmp values');
};

/**
 * [getRandomHeight description]
 * @param  {Number} [maxHeight=Infinity] [description]
 * @return {[type]}                      [description]
 */
const getRandomHeight = (maxHeight=Infinity) => {
  let result = 1;
  while(true) {
    let value = ~~(Math.random() * LARGE);
    while(value) {
      if (result >= maxHeight) return maxHeight;
      if (value % 2) {
        value >>= 1;
        result++;
      } else {
        return result;
      }
    }
  }
};

/**
 * [siblings description]
 * @param  {[type]}    node [description]
 * @return {Generator}      [description]
 */
function* siblings(node) {
  if (!node) return;
  const result = [];
  let cur = node;
  while(cur) {
    result.push(cur);
    cur = cur.nextSibling;
  }
  yield* result.reverse();
}

/**
 * SkipList Node
 */
class Node {
  constructor(value) {
      this.value = value;
      // Right / left ...
      this.next = null;
      this.prev = null;
      // Down / up ...
      this.nextSibling = null;
  }
}

/**
 * [searchList description]
 * @param  {[type]} head  [description]
 * @param  {[type]} value [description]
 * @param  {[type]} cmp   [description]
 * @return {[type]}       [description]
 */
const searchList = (head, value, cmp) => {
  if (!head) return head;
  if (cmp(value, head.value) < 0) return null;
  let prev = head;
  {
    let cur = head.next;
    while(cur) {
      if (cmp(value, cur.value) < 0) break;
      prev = cur;
      cur = cur.next;
    }
  }
  return prev;
};

/**
 * [find description]
 * @param  {[type]} head  [description]
 * @param  {[type]} value [description]
 * @param  {[type]} cmp   [description]
 * @return {[type]}       [description]
 */
const find = (head, value, cmp) => {
  const result = searchList(head, value, cmp);
  if (!result) return result;
  return result.nextSibling ? find(result.nextSibling, value, cmp) : result;
};

/**
 * [getValuesFromHead description]
 * @param  {[type]}    head  [description]
 * @param  {[type]}    value [description]
 * @param  {[type]}    cmp   [description]
 * @return {Generator}       [description]
 */
function* getValuesFromHead(head, value, cmp) {
  const result = searchList(head, value, cmp);
  if (!result) return;
  yield* getValuesFromHead(result.nextSibling, value, cmp);
  yield result;
}

const _cmp = Symbol('cmp');
const _lists = Symbol('lists');
const _search = Symbol('search');
const _getHead = Symbol('getHead');
const _getHeadInfo = Symbol('getHeadInfo');
const _map = Symbol('map');


class SkipList {

  constructor(cmp = DEFAULT_CMP) {
    this[_cmp] = cmp;
    this[_lists] = [];
    this[_map] = new Map();
  }

  [_getHeadInfo](value) {
    let level = this[_lists].length - 1;
    while(level >= 0) {
      if (this[_lists][level]) {
        if (this[_cmp](value, this[_lists][level].value) >= 0) {
          return [level, this[_lists][level]];
        }
      }
      level--;
    }
    return [-1, null];
  }

  [_getHead](value) { return this[_getHeadInfo](value)[1]; }

  [_search](value) { return find(this[_getHead](value), value, this[_cmp]); }

  * nextValues(value) {
    const prevNode = this[_search](value);
    if (!prevNode) {
        yield* this[Symbol.iterator]();
        return;
    }
    let node = prevNode;
    // Don't include previous value
    if (node) { node = node.next; }

    while(node) {
      // don't include self
      if (node.value !== value) { yield node.value; }
      node = node.next;
    }
  }

  get size() { return this[_map].size; }

  has(value) { return this[_map].has(value); }

  add(value) {
    if (this.has(value)) return this;
    const height = getRandomHeight(this[_lists].length + 1);
    const lists = this[_lists].slice();
    const [ headLevel, headEntry ] = this[_getHeadInfo](value);
    let prevAdded = null;

    if (headLevel in lists) {
      let level = headLevel;
      let head = headEntry;
      while(level >= 0) {
        lists[level] = searchList(head, value, this[_cmp]);
        head = lists[level].nextSibling;
        level--;
      }
    }

    for(let i = height - 1; i >= 0; i--) {
      const cur = new Node(value);
      if (!this[_map].has(value)) this[_map].set(value, cur);
      const start = lists[i];
      const prev = searchList(start, value, this[_cmp]);
      const next = prev ? prev.next : this[_lists][i];
      Object.assign(cur, { prev, next });
      if (!prev) { this[_lists][i] = cur; }
      if (next) { next.prev = cur; }
      if (prev) { prev.next = cur; }
      if (prevAdded) { prevAdded.nextSibling = cur; }
      prevAdded = cur;
    }
    return this;
  }

  clear() {
    this[_map].clear();
    this[_lists].length = 0;
  }

  delete(value) {
    if (!this.has(value)) return false;
    const node = this[_map].get(value);
    this[_map].delete(value);

    let index = 0;
    for (const x of siblings(node)) {
      const { prev, next } = x;
      if (next) { next.prev = prev; }
      if (prev) { prev.next = next; }
      if (x === this[_lists][index]) {
        this[_lists][index] = next;
      }
      index++;
    }

    // Cleanup search list
    if (index === this[_lists].length) {
      let cur = index - 1;
      while (cur >= 0 && !this[_lists][cur]) { cur--; }
      this[_lists].length = cur + 1;
    }
    return true;
  }

  * [Symbol.iterator]() {
    let cur = this[_lists][0];
    while(cur) {
      yield cur.value;
      cur = cur.next;
    }
  }

}

module.exports = {
  SkipList,
  DEFAULT_CMP,
};

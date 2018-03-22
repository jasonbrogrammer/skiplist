const { SkipList } = require('./index');


describe('SkipList', () => {
  const values = new Set(
    function* () {
      let count = 1000;
      while(count--) {
        yield Math.random();
      }
    }()
  );

  const addValues = (j) => {
    for(const x of values) {
      j.add(x);
    }
    return j;
  };

  test('should construct', () => {
    expect(() => new SkipList()).not.toThrow();
  });

  test('should add', () => {
    const j = new SkipList();
    const value = Math.random();
    expect(j.size).toBe(0);
    expect(j.has(value)).toBe(false);
    j.add(value);
    expect(j.has(value)).toBe(true);
    expect(j.size).toBe(1);
  });

  test('should add multiple values', () => {
    const j = new SkipList();
    expect(j.size).toBe(0);
    addValues(j);
    expect(() => {
      for(const value of values) {
        if (!j.has(value)) {
          throw new Error(`Missing ${value}`);
        }
      }
    }).not.toThrow();
    expect(j.size).toBe(values.size);
    expect([...j].length).toBe(values.size);
  });

  {
    const j = new SkipList();
    beforeEach(() => addValues(j));

    test('should iterate in sorted order', () => {
      expect(() => {
        let prev = -Infinity;
        for(const x of j) {
          if (prev >= x) {
            throw new Error(`Invalid ordering ${prev} ${x}`);
          }
          prev = x;
        }
      }).not.toThrow();
    });

    test('should clear', () => {
      expect(j.size).not.toBe(0);
      expect([...j]).not.toEqual([]);
      j.clear();
      expect(j.size).toBe(0);
      expect([...j]).toEqual([]);
    });

    test('should delete', () => {
      let deleteAll = true;
      for(const x of values) {
        deleteAll = deleteAll && j.delete(x);
      }
      expect(deleteAll).toBe(true);
      expect(j.size).toBe(0);
      expect([...j].length).toBe(0);
    });

  }

});

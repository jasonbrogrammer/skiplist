const { SkipList } = require('./index');


describe('SkipList', () => {
  const length = 1000;
  const values = new Set(
    function* () {
      let count = length;
      while(count--) {
        yield Math.random();
      }
    }()
  );

  test('should construct', () => {
    expect(() => new SkipList()).not.toThrow();
  });

  describe('operations', () => {
    const j = new SkipList();

    test('should add', () => {
      for(const x of values) {
        expect(j.has(x)).toBe(false);
        j.add(x);
        expect(j.has(x)).toBe(true);
      }
    });

    test('should iterate in sorted order', () => {
      let prev = -Infinity;
      for(const x of j) {
        expect(prev < x).toBe(true);
        prev = x;
      }
    });

    test('should delete', () => {
      for(const x of values) {
        expect(j.has(x)).toBe(true);
        expect(j.delete(x)).toBe(true);
        expect(j.has(x)).toBe(false);
      }
    });

  });

});

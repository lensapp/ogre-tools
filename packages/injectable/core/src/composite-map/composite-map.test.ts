import { CompositeMap } from './composite-map';

describe('compositeMap', () => {
  describe('given no initial values, when a CompositeMap is created', () => {
    let compositeMap;

    beforeEach(() => {
      compositeMap = new CompositeMap();
    });

    it('throws when calling set with a key that is not an array', () => {
      expect(() => compositeMap.set('not an array', 1)).toThrowError(
        'Expected key to be an array',
      );
    });

    it('throws when calling has with a key that is not an array', () => {
      expect(() => compositeMap.has('not an array')).toThrowError(
        'Expected key to be an array',
      );
    });

    it('throws when calling get with a key that is not an array', () => {
      expect(() => compositeMap.get('not an array')).toThrowError(
        'Expected key to be an array',
      );
    });

    it('throws when calling set with a key that is an empty array', () => {
      expect(() => compositeMap.set([], 1)).toThrowError(
        'Keys must be at least length 1',
      );
    });

    it('returns false when has is called with an empty array', () => {
      expect(compositeMap.has([])).toBe(false);
    });

    it('returns undefined when get is called with an empty array', () => {
      expect(compositeMap.get([])).toBe(undefined);
    });

    describe('when a value is set with primitive composed keys, ', () => {
      beforeEach(() => {
        compositeMap.set([1, 2, 3], 'some-value');
      });

      it('when getting the value with same keys, returns the value', () => {
        const actual = compositeMap.get([1, 2, 3]);

        expect(actual).toBe('some-value');
      });

      it('when checking if the value exists using the same keys, returns true', () => {
        const actual = compositeMap.has([1, 2, 3]);

        expect(actual).toBe(true);
      });

      it('when checking if a non existing value exists, returns false', () => {
        const actual = compositeMap.has([1, 'not-2', 3]);

        expect(actual).toBe(false);
      });

      it('when getting a missing value, returns undefined', () => {
        const actual = compositeMap.get([1, 'irrelevant', 3]);

        expect(actual).toBe(undefined);
      });

      it('when getting a value using the prefix of a previously set key, returns undefined', () => {
        const actual = compositeMap.get([1, 2]);

        expect(actual).toBe(undefined);
      });

      it('when checking if the value exists using the prefix of a previously set key, returns false', () => {
        const actual = compositeMap.has([1, 2]);

        expect(actual).toBe(false);
      });
    });

    it('when a value is set with non-primitive composed keys, when getting the value with same keys, returns the value', () => {
      const someNonPrimitiveKey = {};

      compositeMap.set([1, someNonPrimitiveKey, 3], 'some-value');

      const actual = compositeMap.get([1, someNonPrimitiveKey, 3]);

      expect(actual).toBe('some-value');
    });

    it('when a value is set with non-primitive composed keys, when getting the value with keys of different reference equality, returns undefined', () => {
      const someNonPrimitiveKey1 = {};
      const someNonPrimitiveKey2 = {};

      compositeMap.set([1, someNonPrimitiveKey1, 3], 'some-value');

      const actual = compositeMap.get([1, someNonPrimitiveKey2, 3]);

      expect(actual).toBe(undefined);
    });

    it('when no value is set, when getting a value, returns undefined', () => {
      const actual = compositeMap.get([1, 2, 3]);

      expect(actual).toBe(undefined);
    });
  });

  describe('given initial values, when a CompositeMap is created', () => {
    let compositeMap;

    beforeEach(() => {
      compositeMap = new CompositeMap([
        [['some-root-key'], 'some-root-value'],
        [[1, 2, 3], 'some-deep-value'],
      ]);
    });

    it('when iterating values, yields all values', () => {
      const actual = [...compositeMap.values()];

      expect(actual).toEqual(['some-root-value', 'some-deep-value']);
    });

    it('when iterating keys, yields all keys', () => {
      const actual = [...compositeMap.keys()];

      expect(actual).toEqual([['some-root-key'], [1, 2, 3]]);
    });

    it('when iterating entries, yields all entries', () => {
      const actual = [...compositeMap.entries()];

      expect(actual).toEqual([
        [['some-root-key'], 'some-root-value'],
        [[1, 2, 3], 'some-deep-value'],
      ]);
    });

    it('when getting a value with one of the initial keys, returns the value', () => {
      const actual = compositeMap.get([1, 2, 3]);

      expect(actual).toBe('some-deep-value');
    });

    describe('when clearing', () => {
      beforeEach(() => {
        compositeMap.clear();
      });

      it('when iterating values, returns nothing', () => {
        const actual = [...compositeMap.values()];

        expect(actual).toEqual([]);
      });

      it('when iterating keys, returns nothing', () => {
        const actual = [...compositeMap.keys()];

        expect(actual).toEqual([]);
      });

      it('when iterating entries, returns nothing', () => {
        const actual = [...compositeMap.entries()];

        expect(actual).toEqual([]);
      });

      it('when getting a value with one of the initial keys, returns undefined', () => {
        const actual = compositeMap.get([1, 2, 3]);

        expect(actual).toBe(undefined);
      });
    });
  });
});

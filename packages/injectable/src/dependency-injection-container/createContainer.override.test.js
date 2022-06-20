import lifecycleEnum from './lifecycleEnum';
import getInjectable from '../getInjectable/getInjectable';
import createContainer from './createContainer';

describe('createContainer.override', () => {
  it('given an injectable is overridden, injects the overridden injectable', () => {
    const childInjectable = getInjectable({
      id: 'some-injectable',

      instantiate: () => {
        throw Error('Should not come here');
      },
    });

    const parentInjectable = getInjectable({
      id: 'some-other-injectable',

      instantiate: di => di.inject(childInjectable),
    });

    const di = createContainer('some-container');

    di.register(childInjectable, parentInjectable);

    di.override(childInjectable, () => 'some-overridden-value');

    const actual = di.inject(parentInjectable);

    expect(actual).toBe('some-overridden-value');
  });

  it('given transient and overridden, when injected with instantiation parameter, provides override with way to inject using instantiation parameter', () => {
    const someInjectable = getInjectable({
      id: 'some-injectable',
      instantiate: () => 'irrelevant',
      lifecycle: lifecycleEnum.transient,
    });

    const someOtherInjectable = getInjectable({
      id: 'some-other-injectable',
      instantiate: (_, instantiationParameter) => instantiationParameter,
      lifecycle: lifecycleEnum.transient,
    });

    const di = createContainer('some-container');

    di.register(someInjectable, someOtherInjectable);

    di.override(someInjectable, (di, instantiationParameter) =>
      di.inject(someOtherInjectable, instantiationParameter),
    );

    const actual = di.inject(someInjectable, 'some-instantiation-parameter');

    expect(actual).toBe('some-instantiation-parameter');
  });

  it('given singleton and overridden, when injected, provides override with way to inject', () => {
    const someInjectable = getInjectable({
      id: 'some-injectable',
      instantiate: () => 'some-instance',
      lifecycle: lifecycleEnum.transient,
    });

    const someOtherInjectable = getInjectable({
      id: 'some-other-injectable',
      instantiate: () => 'some-other-instance',
      lifecycle: lifecycleEnum.transient,
    });

    const di = createContainer('some-container');

    di.register(someInjectable, someOtherInjectable);

    di.override(someInjectable, di => di.inject(someOtherInjectable));

    const actual = di.inject(someInjectable, 'some-other-instance');

    expect(actual).toBe('some-other-instance');
  });

  it('given an injectable is overridden twice, injects the last overridden injectable', () => {
    const childInjectable = getInjectable({
      id: 'some-injectable',
      instantiate: () => 'irrelevant',
    });

    const parentInjectable = getInjectable({
      id: 'some-other-injectable',
      instantiate: di => di.inject(childInjectable),
    });

    const di = createContainer('some-container');

    di.register(childInjectable, parentInjectable);

    di.override(childInjectable, () => 'irrelevant');
    di.override(childInjectable, () => 'some-reoverridden-value');

    const actual = di.inject(parentInjectable);

    expect(actual).toBe('some-reoverridden-value');
  });

  it('given an injectable is overridden, but overrides are reset, injects the original injectable', () => {
    const childInjectable = getInjectable({
      id: 'some-injectable',
      instantiate: () => 'some-original-value',
    });

    const parentInjectable = getInjectable({
      id: 'some-other-injectable',
      instantiate: di => di.inject(childInjectable),
    });

    const di = createContainer('some-container');

    di.register(childInjectable, parentInjectable);

    di.override(childInjectable, () => 'irrelevant');

    di.reset();

    const actual = di.inject(parentInjectable);

    expect(actual).toBe('some-original-value');
  });

  it('given an injectable is overridden, but then unoverriden, injects the original injectable', () => {
    const someInjectable = getInjectable({
      id: 'irrelevant',
      instantiate: () => 'some-original-value',
    });

    const di = createContainer('some-container');

    di.register(someInjectable);

    di.override(someInjectable, () => 'irrelevant');

    di.unoverride(someInjectable);

    const actual = di.inject(someInjectable);

    expect(actual).toBe('some-original-value');
  });

  it('when overriding non-registered injectable, throws', () => {
    const di = createContainer('some-container');

    const injectable = getInjectable({
      id: 'some-non-registered-injectable',
    });

    expect(() => {
      di.override(injectable, () => 'irrelevant');
    }).toThrow(
      'Tried to override "some-non-registered-injectable" which is not registered.',
    );
  });
});

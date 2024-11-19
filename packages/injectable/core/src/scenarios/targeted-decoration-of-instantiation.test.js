import getInjectable from '../getInjectable/getInjectable';
import createContainer from '../dependency-injection-container/createContainer';
import { getInjectionToken } from '../getInjectionToken/getInjectionToken';
import { instantiationDecoratorToken } from '../dependency-injection-container/tokens';
import lifecycleEnum from '../dependency-injection-container/lifecycleEnum';

describe('createContainer.targeted-decoration-of-instantiation', () => {
  it('given decorator targeting child, when parent is injected, decorates instance and instantiation parameter of only child', () => {
    const decoratorInjectable = getInjectable({
      id: 'some-child-decorator',
      injectionToken: instantiationDecoratorToken,
      decorable: false,

      instantiate: () => ({
        decorate:
          instantiationToBeDecorated => (di, instantiationParameter) => {
            const decoratedInstantiationParameter = `decorated-parameter(${instantiationParameter})`;

            return `decorated-instance(${instantiationToBeDecorated(
              di,
              decoratedInstantiationParameter,
            )})`;
          },

        target: childInjectable,
      }),
    });

    const childInjectable = getInjectable({
      id: 'some-child-injectable',

      instantiate: (di, instantiationParameter) =>
        `child(${instantiationParameter})`,

      lifecycle: lifecycleEnum.transient,
    });

    const parentInjectable = getInjectable({
      id: 'some-parent-injectable',

      instantiate: (di, instantiationParameter) => {
        const childInstance = di.inject(childInjectable, 'child-parameter');

        return `parent(${instantiationParameter}) -> ${childInstance}`;
      },

      lifecycle: lifecycleEnum.transient,
    });

    const di = createContainer('some-container');

    di.register(parentInjectable, childInjectable, decoratorInjectable);

    const actual = di.inject(parentInjectable, 'parent-parameter');

    expect(actual).toBe(
      'parent(parent-parameter) -> decorated-instance(child(decorated-parameter(child-parameter)))',
    );
  });

  it('given decorator targeting an injection token and child implementing the token, when parent is injected, decorates instance and instantiation parameter of only the child', () => {
    const someInjectionTokenForTargetedDecoration = getInjectionToken({
      id: 'some-injection-token-for-targeted-decoration',
    });

    const decoratorInjectable = getInjectable({
      id: 'some-injection-token-decorator',
      injectionToken: instantiationDecoratorToken,
      decorable: false,

      instantiate: () => ({
        decorate:
          instantiationToBeDecorated => (di, instantiationParameter) => {
            const decoratedParameter = `decorated-parameter(${instantiationParameter})`;

            return `decorated-instance(${instantiationToBeDecorated(
              di,
              decoratedParameter,
            )})`;
          },

        target: someInjectionTokenForTargetedDecoration,
      }),
    });

    const childInjectable = getInjectable({
      id: 'some-child-injectable',

      instantiate: (di, instantiationParameter) =>
        `child(${instantiationParameter})`,

      injectionToken: someInjectionTokenForTargetedDecoration,

      lifecycle: lifecycleEnum.transient,
    });

    const parentInjectable = getInjectable({
      id: 'some-parent-injectable',

      instantiate: (di, instantiationParameter) => {
        const childInstance = di.inject(childInjectable, 'child-parameter');

        return `parent(${instantiationParameter}) -> ${childInstance}`;
      },

      lifecycle: lifecycleEnum.transient,
    });

    const di = createContainer('some-container');

    di.register(parentInjectable, childInjectable, decoratorInjectable);

    const actual = di.inject(parentInjectable, 'parent-parameter');

    expect(actual).toBe(
      'parent(parent-parameter) -> decorated-instance(child(decorated-parameter(child-parameter)))',
    );
  });
});

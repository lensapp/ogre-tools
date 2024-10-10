import asyncFn from '@async-fn/jest';
import { noop } from 'lodash/fp';
import React, { forwardRef, Suspense } from 'react';
import { render } from '@testing-library/react';

import {
  createContainer,
  getInjectable,
  getInjectionToken,
} from '@lensapp/injectable';
import { DiContextProvider } from '../withInjectables/withInjectables';
import { getInjectableComponent } from './getInjectableComponent';
import { isPromise } from '@lensapp/fp';
import { useInject } from '../useInject/useInject';

describe('getInjectableComponent', () => {
  let di;
  let mount;
  let onErrorWhileRenderingMock;
  let rendered;

  beforeEach(() => {
    di = createContainer('some-container');

    di.preventSideEffects();

    onErrorWhileRenderingMock = jest.fn();
    mount = mountFor(di, onErrorWhileRenderingMock);
  });

  it('when rendered with props, does so', () => {
    const SomeInjectableComponent = getInjectableComponent({
      id: 'some-injectable-component',
      Component: ({ someProp }) => <div>some-content: {someProp}</div>,
    });

    di.register(SomeInjectableComponent);

    rendered = mount(<SomeInjectableComponent someProp="some-prop-value" />);

    expect(rendered.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div>
            some-content: 
            some-prop-value
          </div>
        </div>
      </body>
    `);
  });

  it('when rendered with ref, forwards the ref', () => {
    const someRef = React.createRef();

    const SomeInjectableComponent = getInjectableComponent({
      id: 'some-injectable-component',

      Component: forwardRef((props, ref) => (
        <div data-testid="some-element" ref={ref}>
          some-content
        </div>
      )),
    });

    di.register(SomeInjectableComponent);
    rendered = mount(<SomeInjectableComponent ref={someRef} />);

    const someElement = rendered.getByTestId('some-element');

    expect(someRef.current).toBe(someElement);
  });

  it('given placeholder component, when rendered with ref, forwards the ref', () => {
    const someRef = React.createRef();

    const SomeInjectableComponent = getInjectableComponent({
      id: 'some-injectable-component',

      Component: forwardRef((props, ref) => (
        <div data-testid="some-element" ref={ref}>
          some-content
        </div>
      )),

      PlaceholderComponent: () => null,
    });

    di.register(SomeInjectableComponent);
    rendered = mount(<SomeInjectableComponent ref={someRef} />);

    const someElement = rendered.getByTestId('some-element');

    expect(someRef.current).toBe(someElement);
  });

  it('given class component, when rendered with props, does so', () => {
    class SomeClassComponent extends React.Component {
      render() {
        return <div>some-content: {this.props.someProp}</div>;
      }
    }

    const SomeInjectableComponent = getInjectableComponent({
      id: 'some-injectable-component',
      Component: SomeClassComponent,
    });

    di.register(SomeInjectableComponent);

    rendered = mount(<SomeInjectableComponent someProp="some-prop-value" />);

    expect(rendered.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div>
            some-content: 
            some-prop-value
          </div>
        </div>
      </body>
    `);
  });

  it('given nested injectable components and rendered, when inner component throws injectable error, the error has injectable context', () => {
    const someNonRegisteredInjectable = getInjectable({
      id: 'some-non-registered-injectable',
      instantiate: di => 'irrelevant',
    });

    const SomeParentInjectableComponent = getInjectableComponent({
      id: 'some-parent-injectable-component',
      Component: ({ children }) => <div>{children}</div>,
    });

    const SomeChildInjectableComponent = getInjectableComponent({
      id: 'some-child-injectable-component',
      Component: () => {
        useInject(someNonRegisteredInjectable);

        return <div>irrelevant</div>;
      },
    });

    di.register(
      SomeParentInjectableComponent,
      SomeChildInjectableComponent,
      // Notice: not registered
      // someNonRegisteredInjectable
    );

    withSuppressedConsoleError(() => {
      rendered = mount(
        <SomeParentInjectableComponent>
          <SomeChildInjectableComponent />
        </SomeParentInjectableComponent>,
      );
    });

    expect(onErrorWhileRenderingMock).toHaveBeenCalledWith(
      'Tried to inject non-registered injectable "some-container" -> "some-parent-injectable-component" -> "some-child-injectable-component" -> "some-non-registered-injectable".',
    );
  });

  it('given injectable component that is nested within multiple parent injectable components, and the nested component throws an injectable error, when rendered in all parent components, the injectable errors have context of the first error, as that is how injectable context of singletons (here the ChildComponent) must work', () => {
    const someNonRegisteredInjectable = getInjectable({
      id: 'some-non-registered-injectable',
      instantiate: di => 'irrelevant',
    });

    const SomeParentInjectableComponent = getInjectableComponent({
      id: 'some-parent-injectable-component',
      Component: ({ children }) => <div>{children}</div>,
    });

    const SomeOtherParentInjectableComponent = getInjectableComponent({
      id: 'some-other-parent-injectable-component',
      Component: ({ children }) => <div>{children}</div>,
    });

    const SomeChildInjectableComponent = getInjectableComponent({
      id: 'some-child-injectable-component',
      Component: () => {
        useInject(someNonRegisteredInjectable);

        return <div>irrelevant</div>;
      },
    });

    di.register(
      SomeParentInjectableComponent,
      SomeOtherParentInjectableComponent,
      SomeChildInjectableComponent,
      // Notice: not registered
      // someNonRegisteredInjectable
    );

    withSuppressedConsoleError(() => {
      rendered = mount(
        <SomeParentInjectableComponent>
          <SomeChildInjectableComponent />
        </SomeParentInjectableComponent>,
      );
    });

    const someError1 = onErrorWhileRenderingMock.mock.calls[0][0];
    onErrorWhileRenderingMock.mockClear();

    withSuppressedConsoleError(() => {
      rendered = mount(
        <SomeOtherParentInjectableComponent>
          <SomeChildInjectableComponent />
        </SomeOtherParentInjectableComponent>,
      );
    });

    const someError2 = onErrorWhileRenderingMock.mock.calls[0][0];

    onErrorWhileRenderingMock.mockClear();

    expect(someError1).toBe(
      'Tried to inject non-registered injectable "some-container" -> "some-parent-injectable-component" -> "some-child-injectable-component" -> "some-non-registered-injectable".',
    );

    expect(someError2).toBe(
      // Notice: the context is within "some-parent-injectable-component", and not within "some-other-parent-injectable-component", where the error2 actually originates.
      'Tried to inject non-registered injectable "some-container" -> "some-parent-injectable-component" -> "some-child-injectable-component" -> "some-non-registered-injectable".',
    );
  });

  it('given placeholder which throws an injectable error, and rendered, when suspended, the error of placeholder has injectable context', () => {
    const someNonRegisteredInjectable = getInjectable({
      id: 'some-non-registered-injectable',
      instantiate: di => 'irrelevant',
    });

    const SomePlaceholderInjectableComponent = getInjectableComponent({
      id: 'some-placeholder-injectable-component',

      Component: () => {
        useInject(someNonRegisteredInjectable);

        return <div>irrelevant</div>;
      },
    });

    const SomeInjectableComponent = getInjectableComponent({
      id: 'some-suspending-injectable-component',

      Component: () => {
        // Suspend forever
        throw new Promise(resolve => {});
      },

      PlaceholderComponent: SomePlaceholderInjectableComponent,
    });

    di.register(
      SomeInjectableComponent,
      SomePlaceholderInjectableComponent,
      // Notice: not registered
      // someNonRegisteredInjectable
    );

    withSuppressedConsoleError(() => {
      rendered = mount(<SomeInjectableComponent />);
    });

    expect(onErrorWhileRenderingMock).toHaveBeenCalledWith(
      'Tried to inject non-registered injectable "some-container" -> "some-suspending-injectable-component" -> "some-placeholder-injectable-component" -> "some-non-registered-injectable".',
    );
  });

  it('given overridden, when rendered, renders the override', () => {
    const SomeInjectableComponent = getInjectableComponent({
      id: 'some-injectable-component',
      Component: () => <div>some-content</div>,
    });

    di.register(SomeInjectableComponent);

    di.override(SomeInjectableComponent, () => () => (
      <div>some-overridden-content</div>
    ));

    rendered = mount(<SomeInjectableComponent />);

    expect(rendered.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div>
            some-overridden-content
          </div>
        </div>
      </body>
    `);
  });

  it('given overridden, and rendered inside a parent injectable component, when the override throws an injectable error, the error has curiously context of the parent component, and not the overridden component (reason for this kludge: easy to do, over major effort for very trivial gain)', () => {
    const SomeParentInjectableComponent = getInjectableComponent({
      id: 'some-parent-injectable-component',
      Component: ({ children }) => <div>{children}</div>,
    });

    const SomeInjectableComponent = getInjectableComponent({
      id: 'some-injectable-component',
      Component: () => <div>some-content</div>,
    });

    const someNonRegisteredInjectable = getInjectable({
      id: 'some-non-registered-injectable',
      instantiate: di => 'irrelevant',
    });

    di.register(
      SomeInjectableComponent,
      SomeParentInjectableComponent,
      // Notice: not registered
      // someNonRegisteredInjectable
    );

    di.override(SomeInjectableComponent, () => () => {
      useInject(someNonRegisteredInjectable);
    });

    withSuppressedConsoleError(() => {
      rendered = mount(
        <SomeParentInjectableComponent>
          <SomeInjectableComponent />
        </SomeParentInjectableComponent>,
      );
    });

    expect(onErrorWhileRenderingMock).toHaveBeenCalledWith(
      // Notice: some-injectable-component is missing from the context, as the override does not have access to it.
      // This is a kludge, but a very pragmatic one, as this is a very niche corner-case.
      'Tried to inject non-registered injectable "some-container" -> "some-parent-injectable-component" -> "some-non-registered-injectable".',
    );
  });

  it('given placeholder-component, when rendered with something that suspends, renders the placeholder', () => {
    const instantiateMock = asyncFn();

    const someAsyncInjectable = getInjectable({
      id: 'some-async',
      instantiate: instantiateMock,
    });

    const SomeInjectableComponent = getInjectableComponent({
      id: 'some-injectable-component',

      Component: () => {
        const someSyncInstance = useInject(someAsyncInjectable);

        return <div>{someSyncInstance}</div>;
      },

      PlaceholderComponent: () => <div>some-placeholder</div>,
    });

    di.register(SomeInjectableComponent, someAsyncInjectable);

    rendered = mount(<SomeInjectableComponent someProp="some-prop-value" />);

    expect(rendered.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div>
            some-placeholder
          </div>
        </div>
      </body>
    `);
  });

  it('given no placeholder-component, when rendered with something that suspends, does not capture the suspense', () => {
    const instantiateMock = asyncFn();

    const someAsyncInjectable = getInjectable({
      id: 'some-async',
      instantiate: instantiateMock,
    });

    const SomeInjectableComponent = getInjectableComponent({
      id: 'some-injectable-component',

      Component: () => {
        const someSyncInstance = useInject(someAsyncInjectable);

        return <div>{someSyncInstance}</div>;
      },
    });

    di.register(SomeInjectableComponent, someAsyncInjectable);

    rendered = mount(
      <Suspense fallback={<div>some-non-captured-suspense</div>}>
        <SomeInjectableComponent someProp="some-prop-value" />
      </Suspense>,
    );

    expect(rendered.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div>
            some-non-captured-suspense
          </div>
        </div>
      </body>
    `);
  });

  it('given injectionToken and injected using the token, when rendered, does so', () => {
    const someInjectionToken = getInjectionToken({ id: 'some-token' });

    const SomeInjectableComponent = getInjectableComponent({
      id: 'some-injectable-component',
      Component: () => <div>some-content</div>,
      injectionToken: someInjectionToken,
    });

    di.register(SomeInjectableComponent);

    const SomeInjectableComponentFromToken = di.inject(someInjectionToken);

    rendered = mount(
      <SomeInjectableComponentFromToken someProp="some-prop-value" />,
    );

    expect(rendered.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div>
            some-content
          </div>
        </div>
      </body>
    `);
  });

  it('given side-effect, and rendered, throws while rendering', () => {
    const SomeComponentCausingSideEffectsInjectable = getInjectableComponent({
      id: 'some-injectable-component',
      Component: () => <div>irrelevant</div>,
      causesSideEffects: true,
    });

    di.register(SomeComponentCausingSideEffectsInjectable);

    withSuppressedConsoleError(() => {
      rendered = mount(<SomeComponentCausingSideEffectsInjectable />);
    });

    expect(onErrorWhileRenderingMock).toHaveBeenCalledWith(
      'Tried to inject "some-container" -> "some-injectable-component" when side-effects are prevented.',
    );
  });

  it('given tags, has tags', () => {
    const SomeComponentUsingTags = getInjectableComponent({
      id: 'some-injectable-component',
      Component: () => <div>irrelevant</div>,
      tags: ['some-tag'],
    });

    expect(SomeComponentUsingTags.tags).toEqual(['some-tag']);
  });

  it('given decorable, is not really decorable, as that is YAGNI and not supported yet', () => {
    const SomeComponent = getInjectableComponent({
      id: 'some-injectable-component',
      Component: () => <div>irrelevant</div>,
      decorable: true,
    });

    expect(SomeComponent.decorable).toBe(undefined);
  });

  it('given no existing react "displayName", and function without name, has displayName related to the injectable id', () => {
    const SomeComponent = getInjectableComponent({
      id: 'some-injectable-component',
      Component: () => <div>irrelevant</div>,
    });

    expect(SomeComponent.displayName).toBe(
      'InjectableComponent(some-injectable-component)',
    );
  });

  it('given existing react "displayName", and function with name, still has displayName related to just the injectable id', () => {
    const SomeComponentUsingDisplayName = () => <div>irrelevant</div>;
    SomeComponentUsingDisplayName.displayName = 'SomeExistingDisplayName';

    const SomeComponent = getInjectableComponent({
      id: 'some-injectable-component',
      Component: SomeComponentUsingDisplayName,
    });

    expect(SomeComponent.displayName).toBe(
      'InjectableComponent(some-injectable-component)',
    );
  });
});

const mountFor = (di, onRenderingError) => node =>
  render(
    <ErrorBoundary onError={onRenderingError}>
      <DiContextProvider value={{ di }}>{node}</DiContextProvider>
    </ErrorBoundary>,
  );

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError(error.message);
  }

  render() {
    if (this.state.hasError) {
      return <div>Some error in rendering prevented render</div>;
    }

    return this.props.children;
  }
}

const withSuppressedConsoleError = toBeSuppressed => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(noop);
  const supressed = toBeSuppressed();

  if (isPromise(supressed)) {
    supressed.finally(() => consoleErrorSpy.mockRestore());
  } else {
    consoleErrorSpy.mockRestore();
  }
};
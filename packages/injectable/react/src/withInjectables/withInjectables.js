import React, { useCallback, useEffect, useRef, useState } from 'react';
import { observer, Observer } from 'mobx-react';
import { action, autorun, comparer, isComputed, observable } from 'mobx';

import { isPromise } from '@lensapp/fp';
import { getInjectable } from '@lensapp/injectable';
import {
  fromPromise,
  fromResource,
  isPromiseBasedObservable,
  lazyObservable,
} from 'mobx-utils';

const { Provider: DiContextProvider, Consumer: DiContextConsumer } =
  React.createContext();

export { DiContextProvider };

export const componentNameMapInjectable = getInjectable({
  id: 'component-name-map',
  instantiate: () => new Map(),
});

const WithSyncInjectables = ({
  forwardedRef,
  Component,
  getProps,
  di,
  ...props
}) => {
  const refProps = forwardedRef ? { ref: forwardedRef } : {};
  const retrievedProps = getProps(di, props);

  if (isPromise(retrievedProps)) {
    throw new Error(
      'Returning props and dependencies asynchronously without a placeholder is not supported',
    );
  }

  return <Component {...refProps} {...getProps(di, props)} />;
};

const WithAsyncInjectables = observer(
  ({ forwardedRef, Component, getProps, di, getPlaceholder, ...props }) => {
    const [observableBoxProps] = useState(
      observable.box(props, { deep: false, equals: comparer.shallow }),
    );
    const autorunCleanupRef = useRef();
    const propsResource = useRef(
      fromResource(sink => {
        let count = 0;
        autorunCleanupRef.current = autorun(() => {
          const run = (count += 1);
          let updated = false;
          getProps(di, observableBoxProps.get()).then(data => {
            if (run === count) {
              updated = true;
              sink(data);
            }
          });
          setTimeout(() => {
            if (!updated) {
              sink(undefined);
            }
          }, 0);
        });
      }),
    );
    useEffect(
      action(() => {
        observableBoxProps.set(props);
      }),
    );

    useEffect(() => () => autorunCleanupRef.current?.(), []);

    const refProps = forwardedRef ? { ref: forwardedRef } : {};
    const retrievedProps = propsResource.current.current();

    if (!retrievedProps) {
      return getPlaceholder(props);
    }

    return <Component {...refProps} {...retrievedProps} />;
  },
);

const WithInjectables = React.memo(
  ({ forwardedRef, di, Component, getPlaceholder, getProps, ...props }) =>
    getPlaceholder ? (
      <WithAsyncInjectables
        Component={Component}
        di={di}
        forwardedRef={forwardedRef}
        getProps={getProps}
        getPlaceholder={getPlaceholder}
        {...props}
      />
    ) : (
      <WithSyncInjectables
        Component={Component}
        di={di}
        forwardedRef={forwardedRef}
        getProps={getProps}
        {...props}
      />
    ),
);

export const withInjectables = (Component, { getPlaceholder, getProps }) =>
  React.memo(
    React.forwardRef((props, forwardedRef) => (
      <DiContextConsumer>
        {({ di }) => (
          <WithInjectables
            Component={Component}
            di={di}
            forwardedRef={forwardedRef}
            getPlaceholder={getPlaceholder}
            getProps={getProps}
            {...props}
          />
        )}
      </DiContextConsumer>
    )),
  );

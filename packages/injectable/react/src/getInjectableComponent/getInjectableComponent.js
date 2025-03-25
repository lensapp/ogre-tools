import React, { forwardRef, Suspense, useContext } from 'react';

import {
  getInjectable,
  getInjectionToken,
  lifecycleEnum,
} from '@lensapp/injectable';
import { useInjectDeferred } from '../useInject/useInject';
import {
  diContext,
  DiContextProvider,
} from '../withInjectables/withInjectables';

export const getInjectableComponent = ({
  Component,
  PlaceholderComponent,
  id,
  causesSideEffects,
  tags,
  injectionToken = getInjectionToken({
    id: `some-injectable-component-token(${id})`,
  }),
}) => {
  let diForComponentContext;

  const normalInjectable = getInjectable({
    id,
    injectionToken,
    causesSideEffects,
    tags,

    instantiate: di => {
      diForComponentContext = di;

      return Component;
    },

    lifecycle: lifecycleEnum.transient,
  });

  const InjectableComponent = Object.assign(
    forwardRef((props, ref) => {
      const { di: failSafeDi } = useContext(diContext);
      const InjectedComponent = useInjectDeferred(injectionToken);

      return (
        <DiContextProvider value={{ di: diForComponentContext || failSafeDi }}>
          {PlaceholderComponent ? (
            <Suspense fallback={<PlaceholderComponent {...props} />}>
              <InjectedComponent {...props} ref={ref} />
            </Suspense>
          ) : (
            <InjectedComponent {...props} ref={ref} />
          )}
        </DiContextProvider>
      );
    }),

    normalInjectable,

    { displayName: `InjectableComponent(${id})` },
  );

  return InjectableComponent;
};

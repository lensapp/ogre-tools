import React, { forwardRef, Suspense, useContext, useMemo } from 'react';

import {
  getInjectable,
  getInjectableBunch,
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
  injectionToken,
}) => {
  const componentInjectable = getInjectable({
    id,
    causesSideEffects,
    tags,
    instantiate: () => Component,
  });
  const hocComponentInjectable = getInjectable({
    id: `InjectableComponent(${id})`,
    instantiate: () => InjectableComponent,
    injectionToken,
  });

  const InjectableComponent = Object.assign(
    forwardRef((props, ref) => {
      const failSafeDi = useContext(diContext);
      const InjectedComponent = useInjectDeferred(componentInjectable);

      return (
        <DiContextProvider value={failSafeDi}>
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

    componentInjectable,

    { displayName: `InjectableComponent(${id})` },
  );

  return Object.assign(
    InjectableComponent,
    getInjectableBunch({
      hocComponentInjectable,
      componentInjectable,
    }),
  );
};

import { noop } from 'lodash/fp';
import { computed, createAtom, observable, runInAction, untracked } from 'mobx';
import type { IComputedValue } from 'mobx';

const neutralizeObsoletePromiseSymbol = Symbol.for(
  'neutralize-obsolete-promise',
);

export type IAsyncComputed<TValue, TPending> = {
  value: IComputedValue<TValue | TPending>;
  pending: IComputedValue<boolean>;
  invalidate: () => void;
};

export type AsyncComputedParams<TValue, TPending> = {
  getValueFromObservedPromise: (signal: AbortSignal) => Promise<TValue>;
  valueWhenPending?: TValue | TPending;
  betweenUpdates?: 'show-pending-value' | 'show-latest-value';
};

export const asyncComputed = <TValue, TPending>({
  getValueFromObservedPromise,
  valueWhenPending,
  betweenUpdates = 'show-pending-value',
}: AsyncComputedParams<TValue, TPending>) => {
  const invalidateAtom = createAtom('invalidate');
  const pendingBox = observable.box(false);
  let neutralizeObsoletePromise = noop;
  let controller = new AbortController();

  const syncValueBox = observable.box<TValue | TPending | undefined>(
    valueWhenPending,
    {
      name: 'sync-value-box-for-async-computed',
      deep: false,
    },
  );

  const computedPromise = computed(
    () => {
      controller = new AbortController();
      if (untracked(() => pendingBox.get()) === true) {
        neutralizeObsoletePromise();
      }

      invalidateAtom.reportObserved();

      runInAction(() => {
        pendingBox.set(true);
        if (betweenUpdates === 'show-pending-value') {
          syncValueBox.set(valueWhenPending);
        }
      });

      return Promise.race([
        getValueFromObservedPromise(controller.signal),

        new Promise<typeof neutralizeObsoletePromiseSymbol>(resolve => {
          neutralizeObsoletePromise = () => {
            controller.abort();
            resolve(neutralizeObsoletePromiseSymbol);
          };
        }),
      ]);
    },
    {
      name: 'computed-promise-for-async-computed',
    },
  );

  const originalComputed = computed(
    () => {
      computedPromise.get().then(syncValue => {
        if (syncValue !== neutralizeObsoletePromiseSymbol) {
          runInAction(() => {
            pendingBox.set(false);
            syncValueBox.set(syncValue);
          });
        }
      });

      return syncValueBox.get();
    },

    {
      name: 'computed-promise-result-for-async-computed',
      keepAlive: true,
    },
  );

  return {
    value: originalComputed,

    invalidate: () => {
      runInAction(() => {
        invalidateAtom.reportChanged();
        pendingBox.set(true);
        controller.abort();

        if (betweenUpdates === 'show-pending-value') {
          syncValueBox.set(valueWhenPending);
        }
      });
    },

    pending: computed(() => {
      originalComputed.get();

      return pendingBox.get();
    }),
  };
};

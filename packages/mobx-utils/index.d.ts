import { IComputedValue } from 'mobx';
import type { IEqualsComparer } from 'mobx';

export type IAsyncComputed<TValue, TPending> = {
  value: IComputedValue<TValue | TPending>;
  pending: IComputedValue<boolean>;
  invalidate: () => void;
};

type AsyncComputedParams<TValue, TPending> = {
  getValueFromObservedPromise: () => Promise<TValue>;
  valueWhenPending?: TValue | TPending;
  betweenUpdates?: 'show-pending-value' | 'show-latest-value';
  equals?: IEqualsComparer<TValue | TPending>;
};

export function asyncComputed<TValue, TPending = undefined>(
  configuration: AsyncComputedParams<TValue, TPending>,
): IAsyncComputed<TValue, TPending>;

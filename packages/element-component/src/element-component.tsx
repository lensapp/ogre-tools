import * as React from 'react';
import { pipeline } from '@lensapp/fp';
import { ArrayValues, UnionToIntersection } from 'type-fest';
import { isNamespaced } from './_private/namespace';
import { Plugin } from './plugin/plugin';
import { rejectKeys } from './_private/reject-keys';
import { withMergeOutputOverInput } from './_private/with-merge-output-over-input';

export type ElementComponent<
  TTagName extends keyof JSX.IntrinsicElements,
  TProps = {},
> = React.ComponentType<TProps & JSX.IntrinsicElements[TTagName]>;

type PluginInputProp<T> = T extends Plugin<infer PluginInput, any>
  ? PluginInput
  : never;

type MapPluginInputProp<T extends readonly Plugin<any, any>[]> = {
  [K in keyof T]: PluginInputProp<T[K]>;
};

export function getElementComponent<
  TTagName extends keyof JSX.IntrinsicElements,
>(tagName: TTagName): ElementComponent<TTagName>;

export function getElementComponent<
  TTagName extends keyof JSX.IntrinsicElements,
  PluginTuple extends readonly Plugin<any, any>[],
>(
  tagName: TTagName,
  ...plugins: PluginTuple
): ElementComponent<
  TTagName,
  UnionToIntersection<ArrayValues<MapPluginInputProp<PluginTuple>>>
>;

export function getElementComponent<
  TagName extends keyof JSX.IntrinsicElements,
>(tagName: TagName, ...plugins: any[]) {
  const processedPlugins = plugins.map(withMergeOutputOverInput);

  return (unprocessedProps: any) => {
    const processedProps = pipeline(
      unprocessedProps,
      // @ts-ignore
      ...processedPlugins,
      rejectKeys(isNamespaced),
    ) as JSX.IntrinsicElements[TagName];

    const TagName = tagName as React.ElementType;

    return <TagName {...processedProps} />;
  };
}

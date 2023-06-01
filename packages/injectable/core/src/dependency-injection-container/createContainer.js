import { privateInjectFor } from './privateInjectFor';
import { withInjectionDecoratorsFor } from './withInjectionDecoratorsFor';
import { privateInjectManyFor as nonDecoratedPrivateInjectManyFor } from './privateInjectManyFor';
import { registerFor, registerSingleFor } from './register';
import { purgeInstancesFor } from './purgeInstances';
import { deregisterFor } from './deregister';
import { overrideFor, unoverrideFor } from './override';
import { decorateFor, decorateFunctionFor } from './decorate';
import { getNamespacedIdFor } from './getNamespacedIdFor';
import { checkForNoMatchesFor } from './checkForNoMatchesFor';
import { checkForCyclesFor } from './checkForCyclesFor';
import { setDependeeFor } from './setDependeeFor';
import { checkForSideEffectsFor } from './checkForSideEffectsFor';
import { getRelatedInjectablesFor } from './getRelatedInjectablesFor';
import { noop } from 'lodash/fp';

export default (containerId, { detectCycles = true } = {}) => {
  const injectableSet = new Set();
  const overridingInjectables = new Map();
  let sideEffectsArePrevented = false;
  const alreadyInjected = new Set();
  const injectablesWithPermittedSideEffects = new Set();
  const injectableIdSet = new Set();

  const injectableAndRegistrationContext = new Map();
  const instancesByInjectableMap = new Map();
  const injectablesByInjectionToken = new Map();
  const namespacedIdByInjectableMap = new Map();
  const dependeesByDependencyMap = new Map();
  const dependenciesByDependencyMap = new Map();

  const getNamespacedId = getNamespacedIdFor(injectableAndRegistrationContext);

  const getRelatedInjectables = getRelatedInjectablesFor({
    injectablesByInjectionToken,
    injectableSet,
  });

  const containerRootContextItem = { injectable: { id: containerId } };

  const setDependee = setDependeeFor({
    dependeesByDependencyMap,
    dependenciesByDependencyMap,
  });

  const nonDecoratedPrivateInjectManyForUnknownMeta =
    nonDecoratedPrivateInjectManyFor({
      containerRootContextItem,
      getRelatedInjectables,
      getInject: () => decoratedPrivateInject,
      setDependee,
      getNamespacedId,
    });

  const nonDecoratedPrivateInjectMany =
    nonDecoratedPrivateInjectManyForUnknownMeta({
      withMeta: false,
    });

  const nonDecoratedPrivateInjectManyWithMeta =
    nonDecoratedPrivateInjectManyForUnknownMeta({
      withMeta: true,
    });

  const checkForCycles = detectCycles
    ? checkForCyclesFor({
        dependeesByDependencyMap,
        getNamespacedId,
      })
    : noop;

  const withInjectionDecorators = withInjectionDecoratorsFor({
    injectMany: nonDecoratedPrivateInjectMany,
    setDependee,
    checkForCycles,
    dependenciesByDependencyMap,
  });

  const getSideEffectsArePrevented = injectable =>
    sideEffectsArePrevented &&
    injectable.causesSideEffects &&
    !injectablesWithPermittedSideEffects.has(injectable);

  const checkForNoMatches = checkForNoMatchesFor(getNamespacedId);

  const checkForSideEffects = checkForSideEffectsFor({
    getSideEffectsArePrevented,
    getNamespacedId,
  });

  const nonDecoratedPrivateInject = privateInjectFor({
    getRelatedInjectables,
    alreadyInjected,
    overridingInjectables,
    instancesByInjectableMap,
    getDi: () => privateDi,
    checkForNoMatches,
    checkForSideEffects,
    getNamespacedId,
  });

  const decoratedPrivateInject = withInjectionDecorators(
    nonDecoratedPrivateInject,
  );

  const decoratedPrivateInjectMany = withInjectionDecorators(
    nonDecoratedPrivateInjectMany,
  );

  const decoratedPrivateInjectManyWithMeta = withInjectionDecorators(
    nonDecoratedPrivateInjectManyWithMeta,
  );

  const registerSingle = registerSingleFor({
    injectableSet,
    namespacedIdByInjectableMap,
    instancesByInjectableMap,
    injectablesByInjectionToken,
    injectableIdSet,
    injectableAndRegistrationContext,
  });

  const purgeInstances = purgeInstancesFor({
    getRelatedInjectables,
    instancesByInjectableMap,
  });

  const decorate = decorateFor({ registerSingle });

  const deregister = deregisterFor({
    injectMany: nonDecoratedPrivateInjectMany,
    injectableSet,
    injectableAndRegistrationContext,
    injectablesByInjectionToken,
    overridingInjectables,
    purgeInstances,
    injectableIdSet,
    namespacedIdByInjectableMap,
    // Todo: get rid of function usage.
    getDi: () => privateDi,
    dependenciesByDependencyMap,
    dependeesByDependencyMap,
  });

  const privateRegister = registerFor({
    registerSingle,
    injectMany: nonDecoratedPrivateInjectMany,
  });

  const override = overrideFor({
    getRelatedInjectables,
    alreadyInjected,
    overridingInjectables,
  });

  const unoverride = unoverrideFor({
    overridingInjectables,
    getRelatedInjectables,
  });

  const decorateFunction = decorateFunctionFor({ decorate });

  const privateDi = {
    inject: decoratedPrivateInject,
    injectMany: decoratedPrivateInjectMany,
    injectManyWithMeta: decoratedPrivateInjectManyWithMeta,

    injectFactory: alias => instantiationParameter =>
      publicInject(alias, instantiationParameter),

    register: privateRegister,
    deregister,
    decorate,
    decorateFunction,
    override,
    unoverride,

    reset: () => {
      overridingInjectables.clear();
    },

    preventSideEffects: () => {
      sideEffectsArePrevented = true;
    },

    permitSideEffects: alias => {
      getRelatedInjectables(alias).forEach(injectable =>
        injectablesWithPermittedSideEffects.add(injectable),
      );
    },

    purge: purgeInstances,
  };

  const publicInject = (alias, parameter, customContextItem) =>
    privateDi.inject(
      alias,
      parameter,
      customContextItem
        ? [containerRootContextItem, customContextItem]
        : [containerRootContextItem],
      containerRootContextItem.injectable,
    );

  const publicDi = {
    ...privateDi,

    inject: publicInject,

    injectMany: (alias, parameter, customContextItem) =>
      privateDi.injectMany(
        alias,
        parameter,
        customContextItem
          ? [containerRootContextItem, customContextItem]
          : [containerRootContextItem],
        containerRootContextItem.injectable,
      ),

    register: (...injectables) => {
      privateDi.register({
        injectables,
        context: [containerRootContextItem],
        source: containerRootContextItem.injectable,
      });
    },

    deregister: (...injectables) => {
      privateDi.deregister({
        injectables,
        context: [containerRootContextItem],
        source: containerRootContextItem.injectable,
      });
    },

    injectManyWithMeta: (alias, parameter, customContextItem) =>
      privateDi.injectManyWithMeta(
        alias,
        parameter,
        customContextItem
          ? [containerRootContextItem, customContextItem]
          : [containerRootContextItem],
        containerRootContextItem.injectable,
      ),

    getInstances: alias =>
      getRelatedInjectables(alias).flatMap(injectable => [
        ...instancesByInjectableMap.get(injectable).values(),
      ]),
  };

  return publicDi;
};

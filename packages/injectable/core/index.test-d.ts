import { expectAssignable, expectError, expectNotType, expectType } from 'tsd';

import {
  createContainer,
  createInjectionTargetDecorator,
  createInstantiationTargetDecorator,
  DiContainer,
  DiContainerForInjection,
  getInjectable,
  getInjectableBunch,
  getInjectionToken,
  getKeyedSingletonCompositeKey,
  getSpecificInjectionToken,
  Injectable,
  InjectableBunch,
  injectionDecoratorToken,
  InjectionToken,
  Instantiate,
  instantiationDecoratorToken,
  isInjectable,
  isInjectableBunch,
  isInjectionToken,
  lifecycleEnum,
  SpecificInject,
  SpecificInjectionToken,
} from '.';

const di = createContainer('some-container');

type GetNumber = () => number;
const someGetNumberInjectionToken = getInjectionToken<GetNumber>({
  id: 'some-get-number-token',
});

// given injectable and decorator targeting a token, typing is ok
const decoratorForToken = getInjectable({
  id: 'decorator-for-token',

  instantiate: () =>
    createInstantiationTargetDecorator({
      target: someGetNumberInjectionToken,

      decorate: toBeDecorated => di => {
        expectType<Instantiate<GetNumber, void>>(toBeDecorated);

        const instance = toBeDecorated(di);

        return instance;
      },
    }),

  injectionToken: instantiationDecoratorToken,
});

const foo: unknown = 'number';

if (isInjectable(foo)) {
  expectType<Injectable<unknown, unknown, unknown>>(foo);
}

if (isInjectionToken(foo)) {
  expectType<InjectionToken<unknown, unknown>>(foo);
}

if (isInjectableBunch(foo)) {
  expectType<InjectableBunch<unknown>>(foo);
}

const x1: boolean = isInjectable(foo);
const x2: boolean = isInjectionToken(foo);

// given injectable without instantiation paramater and decorator targeting the injectable, typing is ok
const someInjectableToBeDecorated = getInjectable({
  id: 'some-injectable-to-be-decorated',
  instantiate: () => () => 42,
});

const decoratorForInjectable = getInjectable({
  id: 'decorator-for-injectable',

  instantiate: () =>
    createInstantiationTargetDecorator({
      target: someInjectableToBeDecorated,

      decorate: toBeDecorated => di => {
        expectType<Instantiate<() => 42, void>>(toBeDecorated);

        const instance = toBeDecorated(di);

        return instance;
      },
    }),

  injectionToken: instantiationDecoratorToken,
});

// given injectable with instantiation parameter and decorator targeting the injectable, typing is ok
const someParameterInjectableToBeDecorated = getInjectable({
  id: 'some-parameter-injectable-to-be-decorated',
  instantiate: (di, parameter: number) => `some-instance-${parameter}`,
  lifecycle: lifecycleEnum.transient,
});

expectType<Injectable<string, unknown, number>>(
  someParameterInjectableToBeDecorated,
);

const decoratorForParameterInjectable = getInjectable({
  id: 'decorator-for-parameter-injectable',

  instantiate: () =>
    createInstantiationTargetDecorator({
      target: someParameterInjectableToBeDecorated,

      decorate: toBeDecorated => (di, param) => {
        expectType<number>(param);
        expectType<Instantiate<string, number>>(toBeDecorated);

        const instance = toBeDecorated(di, param);

        return instance;
      },
    }),

  injectionToken: instantiationDecoratorToken,
});

const decoratorWithoutTargetInjectable = getInjectable({
  id: 'decorator-without-target',

  instantiate: () =>
    createInstantiationTargetDecorator({
      decorate: toBeDecorated => (di, param) => {
        expectType<unknown>(param);
        expectType<Instantiate<unknown, unknown>>(toBeDecorated);

        const instance = toBeDecorated(di, param);

        return instance;
      },
    }),

  injectionToken: instantiationDecoratorToken,
});

const decoratorForInjectionParameterInjectable = getInjectable({
  id: 'decorator-for-parameter-injectable',

  instantiate: () =>
    createInjectionTargetDecorator({
      decorate: injectionToBeDecorated => (key, param) => {
        expectType<SpecificInject<unknown, unknown>>(injectionToBeDecorated);
        expectType<
          | Injectable<unknown, unknown, unknown>
          | InjectionToken<unknown, unknown>
        >(key);
        expectType<unknown>(param);

        return injectionToBeDecorated(key, param);
      },
    }),

  injectionToken: injectionDecoratorToken,
});

const decoratorForSpecificInjectionParameterInjectable = getInjectable({
  id: 'decorator-for-parameter-injectable',

  instantiate: () =>
    createInjectionTargetDecorator({
      decorate: injectionToBeDecorated => (key, param) => {
        expectType<SpecificInject<string, number>>(injectionToBeDecorated);
        expectType<
          Injectable<string, unknown, number> | InjectionToken<string, number>
        >(key);
        expectType<number>(param);

        return injectionToBeDecorated(key, param);
      },
      target: someParameterInjectableToBeDecorated,
    }),

  injectionToken: injectionDecoratorToken,
});

// given injectable with unspecified type for instantiation parameter, argument typing is OK
const someInjectableForTypingOfInstantiate = getInjectable({
  id: 'some-injectable',

  instantiate: (di, instantiationParameter) => {
    expectType<DiContainerForInjection>(di);
    expectType<void>(instantiationParameter);
  },

  lifecycle: lifecycleEnum.keyedSingleton({
    getInstanceKey: (di, instantiationParameter) => {
      expectType<DiContainer>(di);
      expectType<void>(instantiationParameter);
    },
  }),
});

const someInjectableWithMatchingInstantiationParameters = getInjectable({
  id: 'some-injectable',

  instantiate: (di, instantiationParameter: string) => {
    expectType<string>(instantiationParameter);
  },

  lifecycle: lifecycleEnum.keyedSingleton({
    getInstanceKey: (di, instantiationParameter: string) => {
      expectType<string>(instantiationParameter);
    },
  }),
});

// given injectable with mismatching types for instantiation parameter, typing is not OK
expectError(
  getInjectable({
    id: 'some-injectable',

    instantiate: (di, instantiationParameter: number) => {},

    lifecycle: lifecycleEnum.keyedSingleton({
      getInstanceKey: (di, instantiationParameter: string) =>
        instantiationParameter,
    }),
  }),
);

const someInjectableWithoutInstantiationParameter = getInjectable({
  id: 'some-injectable',
  instantiate: () => 'some string',
  lifecycle: lifecycleEnum.transient,
});

// given injectable without instantiation parameters, when injected without parameter, typing is OK
expectType<string>(di.inject(someInjectableWithoutInstantiationParameter));

// given injectable without instantiation parameters, when injected with parameter, typing is not OK
expectError(di.inject(someInjectableWithoutInstantiationParameter, 42));

const someInjectableWithInstantiationParameter = getInjectable({
  id: 'some-other-injectable',
  instantiate: (di, instantiationParameter: number) => instantiationParameter,
  lifecycle: lifecycleEnum.transient,
});

// given injectable with instantiation parameters, when injected with parameter, typing is OK
expectType<number>(di.inject(someInjectableWithInstantiationParameter, 42));

// given injectable with instantiation parameters, when injected without parameter, typing is not OK
expectError(di.inject(someInjectableWithInstantiationParameter));

// given injectable with instantiation parameters, when injected with parameter of wrong type, typing is not OK
expectError(
  di.inject(someInjectableWithInstantiationParameter, 'some-not-number'),
);

const someInjectionToken = getInjectionToken<{
  requiredProperty: string;
  optionalProperty?: number;
}>({
  id: 'some-injection-token',
});

// given injection token, when creating implementation with wrong interface, typing is not OK
expectError(
  getInjectable({
    id: 'some-injectable',
    instantiate: () => ({}),
    injectionToken: someInjectionToken,
  }),
);

// given injection token, when creating implementation with incomplete interface, typing is not OK
expectError(
  getInjectable({
    id: 'some-injectable',
    instantiate: () => ({ requiredProperty: 42 }),
    injectionToken: someInjectionToken,
  }),
);

// given injection token, when creating implementation with mandatory but no optional properties, typing is OK
expectNotType<any>(
  getInjectable({
    id: 'some-injectable',
    instantiate: () => ({ requiredProperty: 'some string' }),
    injectionToken: someInjectionToken,
  }),
);

// given injection token, when creating implementation with mandatory and optional properties, typing is OK
expectNotType<any>(
  getInjectable({
    id: 'some-injectable',

    instantiate: () => ({
      requiredProperty: 'some string',
      optionalProperty: 42,
    }),

    injectionToken: someInjectionToken,
  }),
);

const someTokenWithGeneralProperty = getInjectionToken<{
  someGeneralProperty: string;
}>({
  id: 'some-token-with-general-property',
});

const someInjectableWithAlsoSpecificProperty = getInjectable({
  id: 'some-injectable',

  instantiate: () => ({
    someGeneralProperty: 'some string',
    someSpecificProperty: 42,
  }),

  injectionToken: someTokenWithGeneralProperty,
});

// given injection token and implementation which is more specific than the token, when injected as injectable, typing is specific
expectType<{ someGeneralProperty: string; someSpecificProperty: number }>(
  di.inject(someInjectableWithAlsoSpecificProperty),
);

// given injection token and implementation which is more specific than the token, when injected using injection token, typing is not specific
expectType<{ someGeneralProperty: string }>(
  di.inject(someTokenWithGeneralProperty),
);

// given injection token and implementation which is more specific than the token, when injecting many, typing is not specific
expectType<{ someGeneralProperty: string }[]>(
  di.injectMany(someTokenWithGeneralProperty),
);

// given injecting many with meta, typing is OK
expectType<
  {
    instance: {
      requiredProperty: string;
      optionalProperty?: number;
    };

    meta: { id: string };
  }[]
>(di.injectManyWithMeta(someInjectionToken));

// given injecting with meta, typing is OK
expectType<{
  instance: {
    requiredProperty: string;
    optionalProperty?: number;
  };

  meta: { id: string };
}>(di.injectWithMeta(someInjectionToken));

const someOtherInjectionToken = getInjectionToken<{ someProperty: number }>({
  id: 'some-other-injection-token',
});

const someInjectableForOverrides = getInjectable({
  id: 'some-injectable',
  instantiate: () => ({ someProperty: 42 }),
  injectionToken: someOtherInjectionToken,
});

// given injectable, when overriding with matching instantiate, typing is OK
expectType<void>(
  di.override(someInjectableForOverrides, () => ({ someProperty: 84 })),
);

// given injectable, when overriding with not matching instantiate, typing is not OK
expectError(
  di.override(someInjectableForOverrides, () => ({
    someProperty: 'some-not-number',
  })),
);

// given injectable, when early-overriding with matching instantiate, typing is OK
expectType<void>(
  di.earlyOverride(someInjectableForOverrides, () => ({ someProperty: 84 })),
);

// given injectable, when early-overriding with not matching instantiate, typing is not OK
expectError(
  di.earlyOverride(someInjectableForOverrides, () => ({
    someProperty: 'some-not-number',
  })),
);

// given injectable, when overriding with a more specific matching instantiate, typing is OK
expectType<void>(
  di.override(someInjectableForOverrides, () => ({
    someProperty: 84,
    someSpecificProperty: 42,
  })),
);

// given injectable with injection token, when overriding with injection token, typing is OK
expectType<void>(
  di.override(someOtherInjectionToken, () => ({ someProperty: 84 })),
);

// given injectable with injection token, when overriding with injection token, but wrong type of override, typing is not OK
expectError(
  di.override(someOtherInjectionToken, () => ({
    someProperty: 'not a number',
  })),
);

// given injectable, when getting instances using injectable, typing is OK
expectType<string[]>(
  di.getInstances(
    getInjectable({
      id: 'some-injectable',
      instantiate: () => 'irrelevant',
    }),
  ),
);

// given token, when getting instances using token, typing is OK
expectType<number[]>(
  di.getInstances(
    getInjectionToken<number>({
      id: 'some-token',
    }),
  ),
);

// given token with instantiation parameter, when used to inject a factory, typing is ok
expectType<(instantiationParameter: string) => number>(
  di.injectFactory(
    getInjectionToken<number, string>({
      id: 'some-token',
    }),
  ),
);

// given injectable that is keyed singleton, when used to inject a factory, typing is ok
expectType<(instantiationParameter: string) => number>(
  di.injectFactory(
    getInjectable({
      id: 'some-injectable',
      instantiate: (di, key: string) => 42,

      lifecycle: lifecycleEnum.keyedSingleton({
        getInstanceKey: (di, key: string) => key,
      }),
    }),
  ),
);

// given injectable that is transient, when used to inject a factory, typing is ok
expectType<(instantiationParameter: { some: string }) => number>(
  di.injectFactory(
    getInjectable({
      id: 'some-injectable',
      instantiate: (di, instantiationParameter: { some: string }) => 42,

      lifecycle: lifecycleEnum.transient,
    }),
  ),
);

// given injectable that creates a factory as part of instantiate, typing is ok
getInjectable({
  id: 'some-injectable',
  instantiate: di => {
    const factory = di.injectFactory(
      getInjectionToken<number, string>({
        id: 'some-token',
      }),
    );

    expectType<(instantiationParameter: string) => number>(factory);
  },
});

// given injectable that is singleton, when used to inject a factory, typing is not ok
expectError(
  di.injectFactory(
    getInjectable({
      id: 'some-injectable',
      instantiate: () => 'irrelevant',
    }),
  ),
);

// Overrides and unoverrides
const someStringInjectionToken = getInjectionToken<string>({
  id: 'irrelevant',
});

const someInjectable = getInjectable({
  id: 'some-injectable',
  instantiate: di => 'some-string',
  injectionToken: someStringInjectionToken,
});

// given injectable, when overridden using injectable, typing is ok.
di.override(someInjectable, () => 'some-other-string');

// given injectable, when overridden using injectionToken, typing is ok.
di.override(someStringInjectionToken, () => 'some-other-string');

// given injectable, when unoverridden using injectable, typing is ok.
di.unoverride(someInjectable);

// given injectable, when unoverridden using injectionToken, typing is ok.
di.unoverride(someStringInjectionToken);

// given keyed singleton with sourceNamespace as key, typing is ok
const someKeyedSingletonWithSourceNamespaceAsKey = getInjectable({
  id: 'some-keyed-singleton-with-source-namespace-as-key',

  instantiate: di => {
    expectType<string | undefined>(di.sourceNamespace);

    return di.sourceNamespace;
  },

  lifecycle: lifecycleEnum.keyedSingleton({
    getInstanceKey: di => {
      expectType<string | undefined>(di.sourceNamespace);

      return di.sourceNamespace;
    },
  }),
});

// given injectable, when unoverridden using injectionToken, typing is ok.
di.permitSideEffects(someInjectionToken);

// when purging all but overrides, typing is ok.
di.purgeAllButOverrides();

// given injectable bunch, typing is ok
const someInjectableBunch = getInjectableBunch({
  someInjectable: {
    id: 'some-injectable',
    instantiate: (di: DiContainerForInjection, parameter: number) =>
      `some-instance-${parameter}`,
    lifecycle: lifecycleEnum.transient,
  },
});

expectType<{ someInjectable: Injectable<string, unknown, number> }>(
  someInjectableBunch,
);

expectType<{ keys: [1, 2, 3] }>(getKeyedSingletonCompositeKey(1, 2, 3));

// given injectable, typing for "alias has registrations" is ok
expectType<boolean>(di.hasRegistrations(someInjectable));

// given token, typing for "alias has registrations" is ok
expectType<boolean>(di.hasRegistrations(someInjectionToken));

// given general injection token without generics, and a more specific token created by it, typing is ok
const someGeneralInjectionTokenWithoutGenerics = getInjectionToken<number>({
  id: 'some-general-token-without-generics',
});

expectAssignable<{
  id: string;
  for: (id: string) => SpecificInjectionToken<number>;
}>(someGeneralInjectionTokenWithoutGenerics);

const someSpecificInjectionTokenWithoutGenerics =
  someGeneralInjectionTokenWithoutGenerics.for('some-specific-token');

expectAssignable<{
  id: string;
  for: (id: string) => SpecificInjectionToken<number>;
}>(someSpecificInjectionTokenWithoutGenerics);

// given general injection token with generics, and a more specific token created by it, typing is ok
const someGeneralInjectionTokenWithGenerics = getInjectionToken<
  { someProperty: unknown },
  void,
  <Speciality>(
    speciality: Speciality,
  ) => SpecificInjectionToken<{ someProperty: Speciality }>
>({
  id: 'some-general-token',

  specificInjectionTokenFactory: <Speciality>(speciality: Speciality) =>
    getSpecificInjectionToken<{ someProperty: Speciality }>({
      id: 'some-specific-token',
      speciality,
    }),
});

expectType<
  InjectionToken<
    { someProperty: unknown },
    void,
    <Speciality>(
      speciality: Speciality,
    ) => SpecificInjectionToken<{ someProperty: Speciality }>
  >
>(someGeneralInjectionTokenWithGenerics);

const someSpecificInjectionToken = someGeneralInjectionTokenWithGenerics.for(
  'some-specific-token-as-string',
);

expectType<SpecificInjectionToken<{ someProperty: string }>>(
  someSpecificInjectionToken,
);

const someMoreSpecificInjectionToken = someSpecificInjectionToken.for(
  'some-more-specific-token-as-string',
);

expectType<SpecificInjectionToken<{ someProperty: string }>>(
  someMoreSpecificInjectionToken,
);

expectType<{ someProperty: string }>(
  di.inject(someGeneralInjectionTokenWithGenerics.for('some-string')),
);

expectType<{ someProperty: number }>(
  di.inject(someGeneralInjectionTokenWithGenerics.for(42)),
);

expectType<{ someProperty: number }>(
  di.inject(
    someGeneralInjectionTokenWithGenerics.for(42).for('some-deeper-speciality'),
  ),
);

// given general injection token with generics and instantiation parameter, and a more specific token created by it, typing is ok
const someGeneralInjectionTokenWithGenericsAndParameter = getInjectionToken<
  { someProperty: unknown },
  { someInstantiationParameter: unknown },
  <Speciality>(
    speciality: Speciality,
  ) => SpecificInjectionToken<
    { someProperty: Speciality },
    { someInstantiationParameter: Speciality }
  >
>({
  id: 'some-general-token',

  specificInjectionTokenFactory: <Speciality>(speciality: Speciality) =>
    getSpecificInjectionToken<
      { someProperty: Speciality },
      { someInstantiationParameter: Speciality }
    >({
      id: 'some-specific-token',
      speciality,
    }),
});

expectType<{ someProperty: number }>(
  di.inject(someGeneralInjectionTokenWithGenericsAndParameter.for(42), {
    someInstantiationParameter: 37,
  }),
);

expectType<{ someProperty: number }[]>(
  di.injectMany(someGeneralInjectionTokenWithGenericsAndParameter.for(42), {
    someInstantiationParameter: 37,
  }),
);

// given array of injectables and bunches, when registering, is ok
const someArrayOfInjectablesAndBunches = [someInjectable, someInjectableBunch];

expectType<void>(di.register(someInjectable));
expectType<void>(di.register(someInjectableBunch));
expectType<void>(di.register(someInjectable, someInjectableBunch));
expectType<void>(di.register(...someArrayOfInjectablesAndBunches));

// given array of injectables and bunches, when deregistering, is ok
expectType<void>(di.deregister(someInjectable));
expectType<void>(di.deregister(someInjectableBunch));
expectType<void>(di.deregister(someInjectable, someInjectableBunch));
expectType<void>(di.deregister(...someArrayOfInjectablesAndBunches));

const someInjectable1 = getInjectable({
  id: 'some-injectable',

  instantiate: di => {
    expectType<void>(di.register(someInjectable));
    expectType<void>(di.register(someInjectableBunch));
    expectType<void>(di.register(someInjectable, someInjectableBunch));
    expectType<void>(di.register(...someArrayOfInjectablesAndBunches));

    // given array of injectables and bunches, when deregistering, is ok
    expectType<void>(di.deregister(someInjectable));
    expectType<void>(di.deregister(someInjectableBunch));
    expectType<void>(di.deregister(someInjectable, someInjectableBunch));
    expectType<void>(di.deregister(...someArrayOfInjectablesAndBunches));
  },
});

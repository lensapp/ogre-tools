import { componentNameMapInjectable } from '../withInjectables/withInjectables';

export const registerInjectableReact = di => {
  di.register(componentNameMapInjectable);
};

import { getInjectable } from '@lensapp/injectable';
import fse from 'fs-extra';
import type { JsonValue } from 'type-fest';

export type ReadJsonFile = (path: string) => Promise<JsonValue>;

export const readJsonFileWithoutErrorHandlingInjectable = getInjectable({
  id: 'read-json-file-without-error-handling',
  instantiate:
    /* c8 ignore next */
    (): ReadJsonFile => fse.readJson,
});

export const readJsonFileInjectable = getInjectable({
  id: 'read-json-file',

  instantiate:
    (di): ReadJsonFile =>
    async path => {
      const readJsonFileLol = di.inject(
        readJsonFileWithoutErrorHandlingInjectable,
      );

      try {
        return await readJsonFileLol(path);
      } catch (error: any) {
        throw new Error(
          `Tried to read file "${path}", but error was thrown: "${error.message}"`,
        );
      }
    },
});

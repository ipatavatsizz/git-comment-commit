import { ExtensionContext, Memento } from 'vscode';

export class ExtensionStorage {
  storage: Memento & {
    setKeysForSync(keys: readonly string[]): void;
  };

  constructor(context: ExtensionContext) {
    this.storage = context.globalState;
  }

  async update(key: string, value: any) {
    await this.storage.update(key, value);
  }
  async get<T>(key: string) {
    return await this.storage.get<T>(key);
  }
}

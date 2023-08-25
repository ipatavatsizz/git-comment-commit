export class ExtensionUtils {
  static async isBrowser(): Promise<boolean> {
    if (typeof process === 'object') {
      return false;
    }
    return true;
  }
  static isBrowserAsync(): boolean {
    if (typeof process === 'object') {
      return false;
    }
    return true;
  }
}
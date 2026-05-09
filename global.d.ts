export { };

declare module "*.css" {
  const content: {};
  export default content;
}

declare module "firebase/auth" {
  import type { Persistence } from "@firebase/auth";
  import type { AsyncStorageStatic } from "@react-native-async-storage/async-storage";

  export function getReactNativePersistence(
    storage: AsyncStorageStatic,
  ): Persistence;
}

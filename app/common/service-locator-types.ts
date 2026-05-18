import type { ProviderName } from "../types/common.js"

import type { ServiceLocatorRegistry } from "./service-locator-registry.js"

import type RegisterProvider from "./RegisterProvider.js"

export type { ServiceLocatorRegistry }

export interface IServiceLocator {
  use<TRegistryKey extends keyof ServiceLocatorRegistry>(name: TRegistryKey): ServiceLocatorRegistry[TRegistryKey]
  use<TProvider>(name: ProviderName): TProvider
  createProviderInstance<TProvider>(name: ProviderName): TProvider
  createAllSingletonInstances(): void
  register(registerProvider: RegisterProvider): void
  boot(name?: ProviderName): Promise<void>
}

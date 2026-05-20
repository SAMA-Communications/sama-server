import type { ProviderName } from "../types/common.js"

import mainLogger from "../logger/index.js"

import RegisterProvider from "./RegisterProvider.js"
import type { IServiceLocator } from "./service-locator-types.js"
import type { ServiceLocatorRegistry } from "./service-locator-registry.js"

const logger = mainLogger.child("[ServiceLocatorContainer]")

class ServiceLocatorContainer implements IServiceLocator {
  #providersStore: Record<ProviderName, RegisterProvider> = {}
  #providersInstances: Record<ProviderName, unknown> = {}

  use<TRegistryKey extends keyof ServiceLocatorRegistry>(name: TRegistryKey): ServiceLocatorRegistry[TRegistryKey]
  use<TProvider>(name: ProviderName): TProvider {
    return this.createProviderInstance(name)
  }

  createProviderInstance<TProvider>(name: ProviderName): TProvider {
    const registerProvider = this.#providersStore[name]

    if (!registerProvider) {
      throw new Error(`No register provider ${name}`)
    }

    if (registerProvider.scope === RegisterProvider.SCOPE.TRANSIENT) {
      return registerProvider.register(this) as TProvider
    }

    if (!this.#providersInstances[name]) {
      this.#providersInstances[name] = registerProvider.register(this)
    }

    return this.#providersInstances[name] as TProvider
  }

  createAllSingletonInstances(): void {
    const registerProviders = Object.values(this.#providersStore).filter(
      (registerProvider) => registerProvider.scope === RegisterProvider.SCOPE.SINGLETON,
    )

    for (const registerProvider of registerProviders) {
      this.createProviderInstance(registerProvider.name)
    }
  }

  register(registerProvider: RegisterProvider): void {
    const existed = this.#providersStore[registerProvider.name]

    if (existed) {
      logger.warn(
        "[register] %s [replace implementation] %s -> %s",
        registerProvider.name,
        existed.implementationName,
        registerProvider.implementationName,
      )
    } else {
      logger.debug("[register] %s [implementation] %s", registerProvider.name, registerProvider.implementationName)
    }

    this.#providersStore[registerProvider.name] = registerProvider
  }

  async boot(name?: ProviderName): Promise<void> {
    let registerProviderToBoot = name ? [this.#providersStore[name]] : Object.values(this.#providersStore)
    registerProviderToBoot = registerProviderToBoot.filter((registerProvider) => registerProvider && !registerProvider.booted)

    for (const registerProvider of registerProviderToBoot) {
      await registerProvider.boot(this)
      registerProvider.booted = true
      logger.debug("[boot] %s [implementation] %s", registerProvider.name, registerProvider.implementationName)
    }
  }
}

export default new ServiceLocatorContainer()

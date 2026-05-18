import type { ProviderName } from "../types/common.js"

import type { IServiceLocator } from "./service-locator-types.js"

export enum REGISTER_PROVIDER_SCOPE {
  SINGLETON = "SINGLETON",
  TRANSIENT = "TRANSIENT",
}

export type RegisterProviderOptions = {
  name: ProviderName
  scope?: REGISTER_PROVIDER_SCOPE
  implementationName: string
}

export default abstract class RegisterProvider {
  static readonly SCOPE = REGISTER_PROVIDER_SCOPE

  readonly name: ProviderName
  readonly scope: REGISTER_PROVIDER_SCOPE
  readonly implementationName: string

  booted: boolean

  constructor(opts: RegisterProviderOptions) {
    this.name = opts.name
    this.scope = opts.scope ?? RegisterProvider.SCOPE.SINGLETON
    this.implementationName = opts.implementationName

    this.booted = false
  }

  abstract register<TProvider>(slc: IServiceLocator): TProvider

  async boot(slc: IServiceLocator): Promise<void> {}
}

export default class RegisterProvider {
  static SCOPE = {
    SINGLETON: 'SINGLETON',
    TRANSIENT: 'TRANSIENT'
  }

  constructor(opts) {
    this.name = opts.name
    this.scope = opts.scope || RegisterProvider.SCOPE.SINGLETON
    this.implementationName = opts.implementationName

    this.booted = false
  }

  register(slc) {

  }

  async boot(slc) {

  }
}
import RegisterProvider from './RegisterProvider.js'

class ServiceLocatorContainer {
    #providersStore = {}
    #providersInstances = {}

    use(name) {
        const provider = this.createProviderInstance(name)

        return provider
    }

    createProviderInstance(name) {
        const registerProvider = this.#providersStore[name]

        if (!registerProvider) {
            throw new Error(`No register provider ${name}`)
        }

        if (registerProvider.scope === RegisterProvider.SCOPE.TRANSIENT) {
            return registerProvider.register(this)
        }

        if (!this.#providersInstances[name]) {
            this.#providersInstances[name] = registerProvider.register(this)
        }

        return this.#providersInstances[name]
    }

    createAllSingletonInstances() {
        const registerProviders = Object.values(this.#providersStore)
            .filter(registerProvider => registerProvider.scope === RegisterProvider.SCOPE.SINGLETON)
        
        for (const registerProvider of registerProviders) {
            this.createProviderInstance(registerProvider.name)
        }
    }

    register(registerProvider) {
        const existed = this.#providersStore[registerProvider.name]

        if (existed) {
            console.warn(
                '[ServiceLocatorContainer] [register]',
                registerProvider.name,
                '[replace implementation]',
                existed.implementationName,
                '->',
                registerProvider.implementationName
            )
        } else {
            console.log(
                '[ServiceLocatorContainer] [register]',
                registerProvider.name,
                '[implementation]',
                registerProvider.implementationName
            )
        }

        this.#providersStore[registerProvider.name] = registerProvider
    }

    async boot(name) {
        let registerProviderToBoot = name ? [this.#providersStore[name]] : Object.values(this.#providersStore)
        registerProviderToBoot = registerProviderToBoot.filter(registerProvider => !registerProvider.booted)

        for (const registerProvider of registerProviderToBoot) {
            await registerProvider.boot(this)
            registerProvider.booted = true 
            console.log('[ServiceLocatorContainer] [boot]', registerProvider.name, '[implementation]', registerProvider.implementationName)
        }
    }
}

export default new ServiceLocatorContainer()
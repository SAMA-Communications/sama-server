class ServiceLocatorContainer {
    #providers = {}
    #registeredProviders = {}

    use(name) {
        const provider = this.#providers[name]

        if (!provider) {
            throw new Error(`No register provider ${name}`)
        }

        return provider
    }

    register(name, cb){
        Object.defineProperty(this.#providers, name, {
            get: () => {
                if(!this.#registeredProviders.hasOwnProperty(name)){
                    this.#registeredProviders[name] = cb(this)
                }

                return this.#registeredProviders[name]
            },
            configurable: true,
            enumerable: true
        })

        console.log('[ServiceLocatorContainer] [register]', name)

        return this
    }

    async boot() {

    }
}

export default new ServiceLocatorContainer()
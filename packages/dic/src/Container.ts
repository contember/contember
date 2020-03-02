export type ServiceName = string
export type ServiceType = any

export type ServiceTypeMap = { [N in ServiceName]: ServiceType | undefined }

export type ServiceFactory<M extends ServiceTypeMap, T> = (accessors: Readonly<M>) => T
export type ServiceSetup<M extends ServiceTypeMap, T> = (service: T, accessors: Readonly<M>) => T

export type ServiceFactoryMap<M extends ServiceTypeMap> = { [N in keyof M]: ServiceFactory<M, M[N]> }

export class Builder<M extends ServiceTypeMap = {}> {
	constructor(private factories: ServiceFactoryMap<M>) {}

	addService<N extends ServiceName, T extends ServiceType>(
		name: N extends keyof M ? 'Service with this name already exists' : N,
		factory: ServiceFactory<M, T>,
	): Builder<M & { [K in N]: T }> {
		type TypeMapA = M
		type TypeMapB = { [K in N]: T }
		type TypeMapC = TypeMapA & TypeMapB

		type FactoryMapA = ServiceFactoryMap<TypeMapA>
		type FactoryMapB = ServiceFactoryMap<TypeMapB>
		type FactoryMapC = ServiceFactoryMap<TypeMapC>

		const factoryMapA: FactoryMapA = this.factories
		const factoryMapB: FactoryMapB = { [name]: factory } as FactoryMapB
		const factoryMapC: FactoryMapC = { ...factoryMapA, ...factoryMapB }

		return new Builder(factoryMapC)
	}

	replaceService<N extends ServiceName, T extends { [P in keyof M[N]]: M[N][P] }>(
		name: N extends keyof M ? N : 'Service with this name does not exist',
		factory: ServiceFactory<M, T>,
	): Builder<M> {
		return new Builder({ ...this.factories, [name]: factory } as ServiceFactoryMap<M>)
	}

	setupService<N extends ServiceName, T extends { [P in keyof M[N]]: M[N][P] }>(
		name: N extends keyof M ? N : 'Service with this name does not exist',
		setup: ServiceSetup<M, T>,
	): Builder<M> {
		const currentFactory = this.factories[name]
		return new Builder({
			...this.factories,
			[name]: accessor => {
				const service = currentFactory(accessor)
				return setup(service, accessor)
			},
		} as ServiceFactoryMap<M>)
	}

	build(): Container<M> {
		return new ContainerImpl(this.factories) as Container<M>
	}
}

export type Container<M extends ServiceTypeMap> = ContainerImpl<M> & { [K in keyof M]: M[K] }

export class ContainerImpl<M extends ServiceTypeMap> {
	private readonly services: Partial<M> = {}
	private readonly accessors: Readonly<M> = {} as any

	constructor(private factories: ServiceFactoryMap<M>) {
		Object.keys(this.factories).forEach(name => {
			Object.defineProperty(this.accessors, name, {
				get: this.get.bind(this, name),
			})

			Object.defineProperty(this, name, {
				get: this.get.bind(this, name),
			})
		})
	}

	getFactories(): ServiceFactoryMap<M> {
		return this.factories
	}

	get<N extends keyof M>(name: N): M[N] {
		const service: M[N] | undefined = this.services[name]

		if (service === undefined) {
			return (this.services[name] = this.factories[name](this.accessors))
		}

		return service
	}

	pick<N extends keyof M>(...names: N[]): Container<{ [K in N]: M[K] }> {
		const factories: Partial<ServiceFactoryMap<{ [K in N]: M[K] }>> = {}
		for (const name of names) {
			factories[name] = (() => this.get(name)) as any
		}
		return new ContainerImpl(factories as ServiceFactoryMap<{ [K in N]: M[K] }>) as Container<{ [K in N]: M[K] }>
	}
}

export function mergeContainers<M1 extends ServiceTypeMap, M2 extends ServiceTypeMap>(
	containerA: Container<M1>,
	containerB: Container<M2>,
): Container<M1 & M2> {
	return new ContainerImpl({
		...containerA.getFactories(),
		...containerB.getFactories(),
	} as ServiceFactoryMap<M1 & M2>) as Container<M1 & M2>
}

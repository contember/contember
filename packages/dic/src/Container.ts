export type ServiceName = string
export type ServiceType = any

export type ServiceTypeMap = { [N in ServiceName]: ServiceType | undefined }

export type ServiceFactory<M extends ServiceTypeMap, T> = (accessors: Readonly<M>) => T
export type ServiceSetup<M extends ServiceTypeMap, T> = (service: T, accessors: Readonly<M>) => void

export interface ServiceDefinition<M extends ServiceTypeMap, T> {
	factory: ServiceFactory<M, T>
	setup: ServiceSetup<any, T>[]
}

export type ServiceDefinitionMap<M extends ServiceTypeMap> = { [N in keyof M]: ServiceDefinition<M, M[N]> }

export class Builder<M extends ServiceTypeMap = {}> {
	constructor(private factories: ServiceDefinitionMap<M>) {}

	addService<N extends ServiceName, T extends ServiceType>(
		name: N extends keyof M ? 'Service with this name already exists' : N,
		factory: ServiceFactory<M, T> | ServiceDefinition<M, T>,
	): Builder<M & { [K in N]: T }> {
		return new Builder({
			...this.factories,
			[name]: 'factory' in factory ? factory : { factory, setup: [] },
		} as ServiceDefinitionMap<M & { [K in N]: T }>)
	}

	replaceService<N extends ServiceName, T extends { [P in keyof M[N]]: M[N][P] }>(
		name: N extends keyof M ? N : 'Service with this name does not exist',
		factory: ServiceFactory<M, T> | ServiceDefinition<M, T>,
	): Builder<M> {
		const currentFactory = this.factories[name]
		return new Builder({
			...this.factories,
			[name]:
				'factory' in factory
					? factory
					: {
						...currentFactory,
						factory,
					  },
		} as ServiceDefinitionMap<M>)
	}

	setupService<N extends ServiceName, T extends { [P in keyof M[N]]: M[N][P] }>(
		name: N extends keyof M ? N : 'Service with this name does not exist',
		setup: ServiceSetup<M, T>,
	): Builder<M> {
		const currentFactory = this.factories[name]
		return new Builder({
			...this.factories,
			[name]: {
				...currentFactory,
				setup: [...currentFactory.setup, setup],
			},
		} as ServiceDefinitionMap<M>)
	}

	build(): Container<M> {
		return new ContainerImpl(this.factories) as Container<M>
	}
}

export type Container<M extends ServiceTypeMap> = ContainerImpl<M> & { [K in keyof M]: M[K] }
type ServiceRegistry<M extends ServiceTypeMap> = Map<keyof M, ServiceType>

export class ContainerImpl<M extends ServiceTypeMap> {
	private readonly services: ServiceRegistry<M> = new Map()
	private readonly accessors: Readonly<M> = {} as any

	constructor(private definitions: ServiceDefinitionMap<M>) {
		Object.keys(this.definitions).forEach(name => {
			Object.defineProperty(this.accessors, name, {
				get: this.get.bind(this, name),
			})

			Object.defineProperty(this, name, {
				get: this.get.bind(this, name),
			})
		})
	}

	getDefinitions(): ServiceDefinitionMap<M> {
		return this.definitions
	}

	get<N extends keyof M>(name: N): M[N] {
		const existingService: M[N] | undefined = this.services.get(name)
		if (existingService !== undefined) {
			return existingService
		}
		const definition = this.definitions[name]
		const service = definition.factory(this.accessors)
		this.services.set(name, service)
		for (const setup of definition.setup) {
			setup(service, this.accessors)
		}
		return service
	}

	pick<N extends keyof M>(...names: N[]): Container<{ [K in N]: M[K] }> {
		const factories: Partial<ServiceDefinitionMap<{ [K in N]: M[K] }>> = {}
		for (const name of names) {
			factories[name] = { factory: () => this.get(name), setup: [] }
		}
		return new ContainerImpl(factories as ServiceDefinitionMap<{ [K in N]: M[K] }>) as Container<{ [K in N]: M[K] }>
	}
}

export function mergeContainers<M1 extends ServiceTypeMap, M2 extends ServiceTypeMap>(
	containerA: Container<M1>,
	containerB: Container<M2>,
): Container<M1 & M2> {
	return new ContainerImpl({
		...containerA.getDefinitions(),
		...containerB.getDefinitions(),
	} as ServiceDefinitionMap<M1 & M2>) as Container<M1 & M2>
}

type Container<M extends Container.ServiceTypeMap> = Container.Impl<M> & { [K in keyof M]: M[K] }

namespace Container {
	export type ServiceName = string
	export type ServiceType = any

	export type ServiceTypeMap = { [N in ServiceName]: ServiceType | undefined }

	export type ServiceFactory<M extends ServiceTypeMap, T> = (accessors: Readonly<M>) => T

	export type ServiceFactoryMap<M extends ServiceTypeMap> = { [N in keyof M]: ServiceFactory<M, M[N]> }

	export class Builder<M extends ServiceTypeMap> {
		constructor(private factories: ServiceFactoryMap<M>) {}

		addService<N extends ServiceName, T extends ServiceType>(
			name: N extends keyof M ? 'Service with this name already exists' : N,
			factory: ServiceFactory<M, T>
		): Builder<M & { [K in N]: T }> {
			type TypeMapA = M
			type TypeMapB = { [K in N]: T }
			type TypeMapC = TypeMapA & TypeMapB

			type FactoryMapA = ServiceFactoryMap<TypeMapA>
			type FactoryMapB = ServiceFactoryMap<TypeMapB>
			type FactoryMapC = ServiceFactoryMap<TypeMapC>

			const factoryMapA: FactoryMapA = this.factories
			const factoryMapB: FactoryMapB = ({ [name]: factory } as any) as FactoryMapB
			const factoryMapC = (Object.assign(factoryMapB, factoryMapA) as any) as FactoryMapC

			return new Builder(factoryMapC)
		}

		build(): Container<M> {
			return new Impl(this.factories) as Container<M>
		}
	}

	export class Impl<M extends Container.ServiceTypeMap> {
		private readonly services: Partial<M> = {}
		private readonly accessors: Readonly<M> = {} as any

		constructor(private factories: Container.ServiceFactoryMap<M>) {
			Object.keys(this.factories).forEach(name => {
				Object.defineProperty(this.accessors, name, {
					get: this.get.bind(this, name),
				})

				Object.defineProperty(this, name, {
					get: this.get.bind(this, name),
				})
			})
		}

		get<N extends keyof M>(name: N): M[N] {
			const service: M[N] | undefined = this.services[name]

			if (service === undefined) {
				return (this.services[name] = this.factories[name](this.accessors))
			}

			return service
		}

		pick<N extends keyof M>(...names: N[]): Container<{ [K in N]: M[K] }> {
			const factories: Partial<Container.ServiceFactoryMap<{ [K in N]: M[K] }>> = {}
			for (const name of names) {
				factories[name] = (() => this.get(name)) as any
			}
			return new Impl(factories as Container.ServiceFactoryMap<{ [K in N]: M[K] }>) as Container<{ [K in N]: M[K] }>
		}

		merge<M2 extends Container.ServiceTypeMap>(container: Container<M2>): Container<M & M2> {
			return new Impl({
				...(this.factories as object),
				...(container.factories as object),
			} as Container.ServiceFactoryMap<M & M2>) as Container<M & M2>
		}
	}
}

export default Container

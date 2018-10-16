import { SelectedDimension } from '../../state/request'

class Environment {
	public constructor(
		private readonly names: Environment.NameStore = {
			dimensions: {}
		}
	) {}

	public getValue(name: keyof Environment.NameStore): Environment.Value | undefined {
		if (!(name in this.names)) {
			return undefined
		}
		return this.names[name]
	}

	public getAllNames(): Environment.NameStore {
		return { ...this.names }
	}

	public getDimensions(): SelectedDimension {
		return { ...this.names.dimensions }
	}

	public putName(name: Environment.Name, value: Environment.Value): Environment {
		return new Environment({
			...this.names,
			dimensions: { ...this.names.dimensions },
			[name]: value
		})
	}

	public putDelta(delta: Partial<Environment.NameStore>): Environment {
		const currentNames = this.getAllNames()

		for (const newName in delta) {
			const deltaValue = delta[newName]
			if (deltaValue === undefined) {
				delete currentNames[newName]
			} else {
				currentNames[newName] = deltaValue
			}
		}

		return new Environment(currentNames)
	}

	public static generateDelta(
		currentEnvironment: Environment,
		delta: Environment.DeltaFactory
	): Partial<Environment.NameStore> {
		const newDelta: Partial<Environment.NameStore> = {}

		for (const name in delta) {
			const value = delta[name]

			newDelta[name] = typeof value === 'function' ? value(currentEnvironment) : delta[name]
		}

		return newDelta
	}
}

namespace Environment {
	export type Name = string

	export type Value = string | number | object | undefined | null

	export interface NameStore {
		dimensions: SelectedDimension
		[name: string]: Value
	}

	export type DeltaFactory = {
		[name: string]: ((environment: Environment) => Environment.Value) | Environment.Value
	}
}

export default Environment

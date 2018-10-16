class Environment {
	public constructor(private readonly names: Environment.NameStore = {}) {}

	public getName(name: keyof Environment.NameStore): Environment.Name | undefined {
		if (!(name in this.names)) {
			return undefined
		}
		return this.names[name]
	}

	public getAllNames(): Environment.NameStore {
		return {...this.names}
	}

	public putName(name: Environment.Name, value: Environment.Value): Environment {
		return new Environment({
			...this.names,
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
}

namespace Environment {
	export type Name = string

	export type Value = string

	export interface NameStore {
		[name: string]: string
	}
}

export default Environment

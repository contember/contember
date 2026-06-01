import { EnumDefinition } from '../EnumDefinition.js'

export class EnumRegistry {
	public readonly enums: Record<string, EnumDefinition> = {}

	register(name: string, definition: EnumDefinition) {
		if (this.enums[name]) {
			throw new Error(`Enum with name ${name} is already registered`)
		}
		this.enums[name] = definition
	}

	has(definition: EnumDefinition): boolean {
		return Object.values(this.enums).includes(definition)
	}

	getName(definition: EnumDefinition): string {
		for (const [name, def] of Object.entries(this.enums)) {
			if (def === definition) {
				return name
			}
		}
		throw new Error(`Enum with values ${definition.values.join(', ')} is not registered.`)
	}
}

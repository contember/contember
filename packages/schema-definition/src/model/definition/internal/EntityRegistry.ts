import { EntityConstructor } from '../../../utils'

export class EntityRegistry {
	public readonly entities: Record<string, EntityConstructor> = {}

	register(name: string, definition: EntityConstructor) {
		if (this.entities[name]) {
			throw new Error(`Entity with name ${name} is already registered`)
		}
		this.entities[name] = definition
	}

	has(definition: EntityConstructor): boolean {
		return Object.values(this.entities).includes(definition)
	}

	getName(definition: EntityConstructor): string {
		for (const [name, def] of Object.entries(this.entities)) {
			if (def === definition) {
				return name
			}
		}
		throw new Error(`Entity ${definition.name} is not registered. Have you exported the definition?`)
	}
}

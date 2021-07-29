import { Model } from '@contember/schema'
import EntityBuilder from './EntityBuilder'
import { DefaultNamingConventions, NamingConventions } from '../definition/NamingConventions'
import SchemaBuilderInternal from './SchemaBuilderInternal'
import { EntityConfigurator } from './types'

export default class SchemaBuilder {
	private entities: { [name: string]: EntityConfigurator } = {}
	private enums: { [name: string]: string[] } = {}

	constructor(private readonly conventions: NamingConventions = new DefaultNamingConventions()) {}

	public enum(name: string, values: string[]): SchemaBuilder {
		this.enums[name] = values
		return this
	}

	public entity(name: string, configurator: EntityConfigurator): SchemaBuilder {
		this.entities[name] = configurator
		return this
	}

	public buildSchema(): Model.Schema {
		const builder = new SchemaBuilderInternal(this.conventions)

		const addEntity = (name: string, configurator: EntityConfigurator): void => {
			const entityBuilder: EntityBuilder = configurator(new EntityBuilder({}, {}, addEntity))
			const entityOptions = entityBuilder.getOptions()
			const fields = entityBuilder.getFields()
			builder.addEntity(name, entityOptions, fields)
		}
		for (let name in this.entities) {
			const configurator = this.entities[name]
			addEntity(name, configurator)
		}
		Object.keys(this.enums).forEach(name => builder.addEnum(name, this.enums[name]))

		return builder.createSchema()
	}
}

export * from './SchemaBuilderError'

import { Model } from '@contember/schema'
import NamingConventions from './NamingConventions'
import SchemaBuilder from './SchemaBuilder'

abstract class FieldDefinition<O> {
	constructor(public readonly options: O) {}

	protected withOption<K extends keyof O>(this: any, key: K, value: O[K]): { [K in keyof this]: this[K] } {
		return new this.constructor({ ...this.options, [key]: value })
	}

	abstract createField(context: FieldDefinition.CreateFieldContext): Model.AnyField
}

namespace FieldDefinition {
	export interface CreateFieldContext {
		name: string
		entityName: string
		conventions: NamingConventions
		enumRegistry: SchemaBuilder.EnumRegistry
		entityRegistry: SchemaBuilder.EntityRegistry
	}
	export type Map = { [name: string]: FieldDefinition<any> }
}

export default FieldDefinition

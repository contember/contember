import { Model, Schema } from 'cms-common'

export type SchemaUpdater = (schema: Schema) => Schema
type ModelUpdater = (model: Model.Schema) => Model.Schema
type EntityUpdater = (entity: Model.Entity) => Model.Entity
type FieldUpdater<T extends Model.AnyField> = (field: T) => Model.AnyField

export const updateModel = (...modelUpdate: (ModelUpdater | undefined)[]): SchemaUpdater => schema => ({
	...schema,
	model: modelUpdate
		.filter((it): it is ModelUpdater => it !== undefined)
		.reduce((model, updater) => updater(model), schema.model),
})

export const updateEntity = (name: string, entityUpdate: EntityUpdater): ModelUpdater => model => ({
	...model,
	entities: {
		...model.entities,
		[name]: entityUpdate(model.entities[name]),
	},
})

export const updateField = <T extends Model.AnyField = Model.AnyField>(
	name: string,
	fieldUpdater: FieldUpdater<T>
): EntityUpdater => entity => ({
	...entity,
	fields: {
		...entity.fields,
		[name]: fieldUpdater(entity.fields[name] as T),
	},
})
export const addField = (field: Model.AnyField): EntityUpdater => entity => ({
	...entity,
	fields: {
		...entity.fields,
		[field.name]: field,
	},
})

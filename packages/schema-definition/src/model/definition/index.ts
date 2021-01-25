import { Interface } from './types'
import { Model } from '@contember/schema'
import ColumnDefinition from './ColumnDefinition'
import ManyHasOneDefinition from './ManyHasOneDefinition'
import OneHasManyDefinition from './OneHasManyDefinition'
import ManyHasManyDefinition from './ManyHasManyDefinition'
import EnumDefinition from './EnumDefinition'
import OneHasOneDefinition from './OneHasOneDefinition'
import ManyHasManyInverseDefinition from './ManyHasManyInverseDefinition'
import OneHasOneInverseDefinition from './OneHasOneInverseDefinition'
import { EntityConstructor } from './types'
import SchemaBuilder from './SchemaBuilder'
import NamingConventions from './NamingConventions'
import FieldDefinition from './FieldDefinition'
import 'reflect-metadata'
export * from './interfaces'

export function column(type: Model.ColumnType, typeOptions: ColumnDefinition.TypeOptions = {}) {
	return ColumnDefinition.create(type, typeOptions)
}

export function stringColumn() {
	return column(Model.ColumnType.String)
}

export function intColumn() {
	return column(Model.ColumnType.Int)
}

export function boolColumn() {
	return column(Model.ColumnType.Bool)
}

export function doubleColumn() {
	return column(Model.ColumnType.Double)
}

export function dateColumn() {
	return column(Model.ColumnType.Date)
}

export function dateTimeColumn() {
	return column(Model.ColumnType.DateTime)
}

export function jsonColumn() {
	return column(Model.ColumnType.Json)
}

export function enumColumn(enumDefinition: EnumDefinition) {
	return column(Model.ColumnType.Enum, { enumDefinition })
}

export function manyHasOne(target: EntityConstructor, inversedBy?: string): ManyHasOneDefinition {
	return new ManyHasOneDefinition({ target, inversedBy })
}

export function oneHasMany(target: EntityConstructor, ownedBy: string): OneHasManyDefinition {
	return new OneHasManyDefinition({ target, ownedBy })
}

export function manyHasMany(target: EntityConstructor, inversedBy?: string): ManyHasManyDefinition {
	return new ManyHasManyDefinition({ target, inversedBy })
}

export function manyHasManyInverse(target: EntityConstructor, ownedBy: string): ManyHasManyInverseDefinition {
	return new ManyHasManyInverseDefinition({ target, ownedBy })
}

/** @deprecated use manyHasManyInverse */
export function manyHasManyInversed(target: EntityConstructor, ownedBy: string): ManyHasManyInverseDefinition {
	return new ManyHasManyInverseDefinition({ target, ownedBy })
}

export function oneHasOne(target: EntityConstructor, inversedBy?: string): OneHasOneDefinition {
	return new OneHasOneDefinition({ target, inversedBy })
}

export function oneHasOneInverse(target: EntityConstructor, ownedBy: string): OneHasOneInverseDefinition {
	return new OneHasOneInverseDefinition({ target, ownedBy })
}

/** @deprecated use oneHasOneInverse */
export function oneHasOneInversed(target: EntityConstructor, ownedBy: string): OneHasOneInverseDefinition {
	return new OneHasOneInverseDefinition({ target, ownedBy })
}

export function createEnum(...values: string[]) {
	return new EnumDefinition(values)
}

type UniqueOptions<T> = { name?: string; fields: (keyof T)[] }
type DecoratorFunction<T> = (cls: EntityConstructor<T>) => void

export function Unique<T>(options: UniqueOptions<T>): DecoratorFunction<T>
export function Unique<T>(...fields: (keyof T)[]): DecoratorFunction<T>
export function Unique<T>(options: UniqueOptions<T> | keyof T, ...fields: (keyof T)[]): DecoratorFunction<T> {
	if (typeof options !== 'object') {
		options = {
			fields: [options, ...fields],
		}
	}

	return function (cls: EntityConstructor<T>) {
		const keys = Reflect.getMetadata('uniqueKeys', cls) || []
		Reflect.defineMetadata('uniqueKeys', [...keys, options], cls)
	}
}

export abstract class Entity {
	[key: string]: Interface<FieldDefinition<any>> | undefined
}

export type ModelDefinition<M> = {
	[K in keyof M]: EnumDefinition | EntityConstructor
}

export function createModel<M extends ModelDefinition<M>>(definitions: M): Model.Schema {
	const schemaBuilder = new SchemaBuilder(new NamingConventions.Default())
	for (const [name, definition] of Object.entries(definitions)) {
		if (definition instanceof EnumDefinition) {
			schemaBuilder.addEnum(name, definition)
		} else {
			schemaBuilder.addEntity(name, definition as any)
		}
	}
	const schema = schemaBuilder.createSchema()
	return schema
}

export const OnDelete = Model.OnDelete
export const OrderDirection = Model.OrderDirection
export { EnumDefinition }

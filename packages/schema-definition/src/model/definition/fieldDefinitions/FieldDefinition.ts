import { Model } from '@contember/schema'
import { CommonContext } from '../context'

export abstract class FieldDefinition<O> {
	constructor(public readonly options: O) {}

	protected withOption<K extends keyof O>(this: any, key: K, value: O[K]): { [K in keyof this]: this[K] } {
		return new this.constructor({ ...this.options, [key]: value })
	}

	abstract createField(context: CreateFieldContext): Model.AnyField
}

export type CreateFieldContext =
	&  {
		name: string
		entityName: string
	}
	& CommonContext

export type Map = { [name: string]: FieldDefinition<any> }

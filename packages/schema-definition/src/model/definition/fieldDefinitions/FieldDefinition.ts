import { Model } from '@contember/schema'
import { CommonContext } from '../context'

export abstract class FieldDefinition<O> {
	constructor(public readonly options: O) {
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

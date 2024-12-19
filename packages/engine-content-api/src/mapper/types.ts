import { Model, Input, Value } from '@contember/schema'
import { CheckedPrimary } from './CheckedPrimary'

export type JoiningColumns = { sourceColumn: Model.JoiningColumn; targetColumn: Model.JoiningColumn }

export namespace MapperInput {

	export interface ConnectRelationInput {
		connect: Input.UniqueWhere | CheckedPrimary
	}

	export interface CreateRelationInput {
		create: CreateDataInput
	}

	export interface ConnectOrCreateInput {
		connect: Input.UniqueWhere | CheckedPrimary
		create: CreateDataInput
	}

	export interface ConnectOrCreateRelationInput {
		connectOrCreate: ConnectOrCreateInput
	}

	export interface DisconnectSpecifiedRelationInput {
		disconnect: Input.UniqueWhere
	}

	export interface DeleteSpecifiedRelationInput {
		delete: Input.UniqueWhere
	}

	export interface UpdateSpecifiedRelationInput {
		update: { by: Input.UniqueWhere; data: UpdateDataInput }
	}

	export interface UpsertSpecifiedRelationInput {
		upsert: { by: Input.UniqueWhere; update: UpdateDataInput; create: CreateDataInput }
	}

	export interface DisconnectRelationInput {
		disconnect: true
	}

	export interface UpdateRelationInput {
		update: UpdateDataInput
	}

	export interface DeleteRelationInput {
		delete: true
	}

	export interface UpsertRelationInput {
		upsert: { update: UpdateDataInput; create: CreateDataInput }
	}

	export interface CreateDataInput {
		[column: string]: Value.FieldValue | CreateOneRelationInput | CreateManyRelationInput
	}

	export type CreateOneRelationInput = { alias?: string } & (
		| ConnectRelationInput
		| CreateRelationInput
		| ConnectOrCreateRelationInput
	)

	export type CreateManyRelationInput = Array<CreateOneRelationInput>

	export interface UpdateDataInput {
		[column: string]: Value.FieldValue | UpdateOneRelationInput | UpdateManyRelationInput
	}

	export interface UpdateInput {
		by: Input.UniqueWhere
		filter?: Input.OptionalWhere
		data: UpdateDataInput
	}

	export interface UpsertInput {
		by: Input.UniqueWhere
		filter?: Input.OptionalWhere
		update: UpdateDataInput
		create: CreateDataInput
	}

	export interface CreateInput {
		data: CreateDataInput
	}

	export interface DeleteInput {
		by: Input.UniqueWhere
		filter?: Input.OptionalWhere
	}


	export type UpdateOneRelationInput =
		| CreateRelationInput
		| ConnectRelationInput
		| ConnectOrCreateRelationInput
		| DeleteRelationInput
		| DisconnectRelationInput
		| UpdateRelationInput
		| UpsertRelationInput

	export type UpdateManyRelationInputItem = { alias?: string } & (
		| CreateRelationInput
		| ConnectRelationInput
		| ConnectOrCreateRelationInput
		| DeleteSpecifiedRelationInput
		| DisconnectSpecifiedRelationInput
		| UpdateSpecifiedRelationInput
		| UpsertSpecifiedRelationInput
	)

	export type UpdateManyRelationInput = Array<UpdateManyRelationInputItem>

}

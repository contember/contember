import type { GraphQlBuilder } from '../index'

export type Mutations = 'create' | 'update' | 'delete'

export type Queries = 'get' | 'list' | 'paginate'

export type GetQueryArguments = 'by'

export type ListQueryArguments = 'filter' | 'orderBy' | 'offset' | 'limit'

export type PaginateQueryArguments = 'filter' | 'orderBy' | 'skip' | 'first'

export type CreateMutationArguments = 'data'

export type UpdateMutationArguments = 'data' | 'by'

export type DeleteMutationArguments = 'by'

export type ReductionArguments = 'filter' | 'by'

export type HasOneArguments = 'filter'

export type HasManyArguments = 'filter' | 'orderBy' | 'offset' | 'limit'

export type UpdateMutationFields = 'ok' | 'validation' | 'errors' | 'errorMessage' | 'node'

export type CreateMutationFields = 'ok' | 'validation' | 'errors' | 'errorMessage' | 'node'

export type DeleteMutationFields = 'ok' | 'node' | 'errors' | 'errorMessage'

export type WriteArguments = CreateMutationArguments | UpdateMutationArguments | DeleteMutationArguments

export type WriteFields = UpdateMutationFields | CreateMutationFields

export type ReadArguments =
	| GetQueryArguments
	| ListQueryArguments
	| PaginateQueryArguments
	| HasOneArguments
	| HasManyArguments

export interface WriteRelationOps {
	create: 'create' | 'connect'
	update: 'create' | 'connect' | 'delete' | 'disconnect' | 'update' | 'upsert'
}

export type OrderDirection = GraphQlBuilder.GraphQlLiteral<'asc'> | GraphQlBuilder.GraphQlLiteral<'desc'>

// TODO Silly enums because TS does not support enum extension 🙄
// https://github.com/Microsoft/TypeScript/issues/17592
export namespace WriteOperation {
	export interface Operation {
		op: 'create' | 'update' | 'delete'
	}
	export abstract class Operation implements Operation {}

	export interface ContentfulOperation {
		op: 'create' | 'update'
	}
	export abstract class ContentfulOperation extends Operation implements ContentfulOperation {}

	export class Update extends ContentfulOperation {
		override readonly op = 'update' as const
	}

	export class Create extends ContentfulOperation {
		override readonly op = 'create' as const
	}

	export class Delete extends Operation {
		override readonly op = 'delete' as const
	}
}

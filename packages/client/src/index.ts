import * as CrudQueryBuilderTmp from './crudQueryBuilder'

import * as GraphQlBuilderTmp from './graphQlBuilder'
export { GraphQlLiteral } from './graphQlBuilder'

export namespace GraphQlBuilder {
	export import GraphqlLiteral = GraphQlBuilderTmp.GraphQlLiteral
	export import GraphQlLiteral = GraphQlBuilderTmp.GraphQlLiteral
}

export namespace CrudQueryBuilder {
	export type CreateMutationArguments = CrudQueryBuilderTmp.CreateMutationArguments
	export type CreateMutationFields = CrudQueryBuilderTmp.CreateMutationFields
	export type DeleteMutationArguments = CrudQueryBuilderTmp.DeleteMutationArguments
	export type DeleteMutationFields = CrudQueryBuilderTmp.DeleteMutationFields
	export type GetQueryArguments = CrudQueryBuilderTmp.GetQueryArguments
	export type HasManyArguments = CrudQueryBuilderTmp.HasManyArguments
	export type HasOneArguments = CrudQueryBuilderTmp.HasOneArguments
	export type ListQueryArguments = CrudQueryBuilderTmp.ListQueryArguments
	export type Mutations = CrudQueryBuilderTmp.Mutations
	export type OrderDirection = CrudQueryBuilderTmp.OrderDirection
	export type PaginateQueryArguments = CrudQueryBuilderTmp.PaginateQueryArguments
	export type Queries = CrudQueryBuilderTmp.Queries
	export type ReadArguments = CrudQueryBuilderTmp.ReadArguments
	export type ReductionArguments = CrudQueryBuilderTmp.ReductionArguments
	export type UpdateMutationArguments = CrudQueryBuilderTmp.UpdateMutationArguments
	export type UpdateMutationFields = CrudQueryBuilderTmp.UpdateMutationFields
	export type WriteArguments = CrudQueryBuilderTmp.WriteArguments
	export type WriteFields = CrudQueryBuilderTmp.WriteFields
	export type WriteRelationOps = CrudQueryBuilderTmp.WriteRelationOps
}

export * from './builder'
export * from './content'
export * from './graphQlClient'
export * from './system'
export * from './tenant'

export type { Input, Value, Result, Writable } from '@contember/schema'

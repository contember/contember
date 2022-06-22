import * as CrudQueryBuilderTmp from './crudQueryBuilder'

import * as GraphQlBuilderTmp from './graphQlBuilder'
export { GraphQlLiteral } from './graphQlBuilder'

export namespace GraphQlBuilder {
	export import GraphqlLiteral = GraphQlBuilderTmp.GraphQlLiteral
	export import GraphQlLiteral = GraphQlBuilderTmp.GraphQlLiteral
	export import ObjectBuilder = GraphQlBuilderTmp.ObjectBuilder
	export import QueryCompiler = GraphQlBuilderTmp.QueryCompiler
	export import QueryBuilder = GraphQlBuilderTmp.QueryBuilder
	export import RootObjectBuilder = GraphQlBuilderTmp.RootObjectBuilder
}

export namespace CrudQueryBuilder {
	export import CrudQueryBuilder = CrudQueryBuilderTmp.CrudQueryBuilder
	export import ReadBuilder = CrudQueryBuilderTmp.ReadBuilder
	export import WriteBuilder = CrudQueryBuilderTmp.WriteBuilder
	export import WriteDataBuilder = CrudQueryBuilderTmp.WriteDataBuilder
	export import WriteManyRelationBuilder = CrudQueryBuilderTmp.WriteManyRelationBuilder
	export import WriteOneRelationBuilder = CrudQueryBuilderTmp.WriteOneRelationBuilder
	export import WriteOperation = CrudQueryBuilderTmp.WriteOperation
	export import CreateMutationArguments = CrudQueryBuilderTmp.CreateMutationArguments
	export import CreateMutationFields = CrudQueryBuilderTmp.CreateMutationFields
	export import DeleteMutationArguments = CrudQueryBuilderTmp.DeleteMutationArguments
	export import DeleteMutationFields = CrudQueryBuilderTmp.DeleteMutationFields
	export import GetQueryArguments = CrudQueryBuilderTmp.GetQueryArguments
	export import HasManyArguments = CrudQueryBuilderTmp.HasManyArguments
	export import HasOneArguments = CrudQueryBuilderTmp.HasOneArguments
	export import ListQueryArguments = CrudQueryBuilderTmp.ListQueryArguments
	export import Mutations = CrudQueryBuilderTmp.Mutations
	export import OrderDirection = CrudQueryBuilderTmp.OrderDirection
	export import PaginateQueryArguments = CrudQueryBuilderTmp.PaginateQueryArguments
	export import Queries = CrudQueryBuilderTmp.Queries
	export import ReadArguments = CrudQueryBuilderTmp.ReadArguments
	export import ReductionArguments = CrudQueryBuilderTmp.ReductionArguments
	export import UpdateMutationArguments = CrudQueryBuilderTmp.UpdateMutationArguments
	export import UpdateMutationFields = CrudQueryBuilderTmp.UpdateMutationFields
	export import WriteArguments = CrudQueryBuilderTmp.WriteArguments
	export import WriteFields = CrudQueryBuilderTmp.WriteFields
	export import WriteRelationOps = CrudQueryBuilderTmp.WriteRelationOps
}

export * from './content'
export * from './graphQlClient'
export * from './system'
export * from './tenant'

export type { Input, Value, Result } from '@contember/schema'

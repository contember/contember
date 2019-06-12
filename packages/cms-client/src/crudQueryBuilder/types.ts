export type Mutations = 'create' | 'update' | 'delete'

export type Queries = 'get' | 'list'

export type GetQueryArguments = 'by'

export type ListQueryArguments = 'filter' | 'orderBy' | 'offset' | 'limit'

export type CreateMutationArguments = 'data'

export type UpdateMutationArguments = 'data' | 'by'

export type DeleteMutationArguments = 'by'

export type ReductionArguments = 'filter' | 'by'

export type HasOneArguments = 'filter'

export type HasManyArguments = 'filter' | 'orderBy' | 'offset' | 'limit'

export type SupportedArguments =
	| CreateMutationArguments
	| UpdateMutationArguments
	| DeleteMutationArguments
	| GetQueryArguments
	| ListQueryArguments
	| HasOneArguments
	| HasManyArguments

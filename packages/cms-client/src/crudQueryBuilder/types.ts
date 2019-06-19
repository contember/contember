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

export type UpdateMutationFields = 'ok' | 'validation' | 'node'

export type CreateMutationFields = 'ok' | 'validation' | 'node'

export enum WriteOperation {
	Create = 'create',
	Update = 'update'
}

export type WriteArguments = CreateMutationArguments | UpdateMutationArguments | DeleteMutationArguments

export type WriteFields = UpdateMutationFields | CreateMutationFields

export type ReadArguments = GetQueryArguments | ListQueryArguments | HasOneArguments | HasManyArguments

export interface WriteRelationOps {
	create: 'create' | 'connect'
	update: 'create' | 'connect' | 'delete' | 'disconnect' | 'update' | 'upsert'
}

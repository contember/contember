export type Mutations = 'create' | 'update' | 'delete'

export type Queries = 'get' | 'list'

export type GetQueryArguments = 'by'

export type ListQueryArguments = 'filter' | 'orderBy' | 'offset' | 'limit'

export type ReductionArguments = 'filter' | 'by'

export type HasOneArguments = 'filter'

export type HasManyArguments = 'filter' | 'orderBy' | 'offset' | 'limit'

export type SupportedArguments = GetQueryArguments | ListQueryArguments | HasOneArguments | HasManyArguments

export type OmitMethods<Obj, Method> = Pick<Obj, Exclude<keyof Obj, Method>>

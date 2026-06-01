import type { SugaredUniqueWhere, UniqueWhere } from './UniqueWhere.js'

export type SetOnCreate = UniqueWhere | undefined

// TODO maybe make an entirely new grammar that doesn't require parentheses.
export type SugaredSetOnCreate = SugaredUniqueWhere | SugaredUniqueWhere[] | Exclude<SetOnCreate, undefined>

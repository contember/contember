import { SugaredUniqueWhere, UniqueWhere } from './UniqueWhere'

export interface SingleEntityTreeConstraints {
	where: UniqueWhere
}

export interface SugaredSingleEntityTreeConstraints {
	where: SugaredUniqueWhere
}

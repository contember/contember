import { EntityTreeSpecification } from './EntityTreeSpecification'
import { SugaredUniqueWhere, UniqueWhere } from './UniqueWhere'

export interface SingleEntityTreeConstraints extends EntityTreeSpecification {
	where: UniqueWhere
}

export interface SugaredSingleEntityTreeConstraints extends EntityTreeSpecification {
	where: SugaredUniqueWhere
}

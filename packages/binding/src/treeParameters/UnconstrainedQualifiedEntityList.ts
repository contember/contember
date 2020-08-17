import {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import {
	DesugaredEntityListStaticEvents,
	EntityListStaticEvents,
	SugarableEntityListStaticEvents,
	UnsugarableEntityListStaticEvents,
} from './EntityListStaticEvents'
import { DesugaredHasOneRelation, HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import {
	DesugaredQualifiedEntityParameters,
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'

export interface DesugaredUnconstrainedQualifiedEntityList
	extends DesugaredQualifiedEntityParameters,
		DesugaredEntityCreationParameters,
		DesugaredEntityListStaticEvents {
	hasOneRelationPath: DesugaredHasOneRelation[]
}

export interface UnconstrainedQualifiedEntityList
	extends QualifiedEntityParameters,
		EntityCreationParameters,
		EntityListStaticEvents {
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableUnconstrainedQualifiedEntityList
	extends SugarableQualifiedEntityParameters,
		SugarableEntityCreationParameters,
		SugarableEntityListStaticEvents {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableUnconstrainedQualifiedEntityList
	extends UnsugarableQualifiedEntityParameters,
		UnsugarableEntityCreationParameters,
		UnsugarableEntityListStaticEvents {
	// Deliberately leaving out UnsugarableHasOneRelation
}

// E.g. Author.son.sisters(name = 'Jane')
export interface SugaredUnconstrainedQualifiedEntityList extends UnsugarableUnconstrainedQualifiedEntityList {
	entities: string | SugarableUnconstrainedQualifiedEntityList
}

export class BoxedUnconstrainedQualifiedEntityList {
	public constructor(public readonly value: UnconstrainedQualifiedEntityList) {}
	public get type() {
		return 'unconstrainedQualifiedEntityList' as const
	}
	public get isConstrained(): false {
		return false
	}
}

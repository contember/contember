import {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import {
	DesugaredEntityListPreferences,
	EntityListPreferences,
	SugarableEntityListPreferences,
	UnsugarableEntityListPreferences,
} from './EntityListPreferences'
import {
	DesugaredEntityListEventListeners,
	EntityListEventListeners,
	SugarableEntityListEventListeners,
	UnsugarableEntityListEventListeners,
} from './EntityListEventListeners'
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
		DesugaredEntityListEventListeners,
		DesugaredEntityListPreferences {
	hasOneRelationPath: DesugaredHasOneRelation[]
}

export interface UnconstrainedQualifiedEntityList
	extends QualifiedEntityParameters,
		EntityCreationParameters,
		EntityListEventListeners,
		EntityListPreferences {
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableUnconstrainedQualifiedEntityList
	extends SugarableQualifiedEntityParameters,
		SugarableEntityCreationParameters,
		SugarableEntityListEventListeners,
		SugarableEntityListPreferences {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableUnconstrainedQualifiedEntityList
	extends UnsugarableQualifiedEntityParameters,
		UnsugarableEntityCreationParameters,
		UnsugarableEntityListEventListeners,
		UnsugarableEntityListPreferences {
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

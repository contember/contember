import {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import {
	DesugaredEntityListParameters,
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
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

export interface DesugaredQualifiedEntityList
	extends DesugaredEntityListParameters,
		DesugaredQualifiedEntityParameters,
		DesugaredEntityCreationParameters,
		DesugaredEntityListEventListeners {
	hasOneRelationPath: DesugaredHasOneRelation[]
}

export interface QualifiedEntityList
	extends EntityListParameters,
		QualifiedEntityParameters,
		EntityCreationParameters,
		EntityListEventListeners {
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableQualifiedEntityList
	extends SugarableEntityListParameters,
		SugarableQualifiedEntityParameters,
		SugarableEntityCreationParameters,
		SugarableEntityListEventListeners {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableQualifiedEntityList
	extends UnsugarableEntityListParameters,
		UnsugarableQualifiedEntityParameters,
		UnsugarableEntityCreationParameters,
		UnsugarableEntityListEventListeners {
	// Deliberately leaving out UnsugarableHasOneRelation
}

// E.g. Author[age < 123].son.sisters(name = 'Jane')
export interface SugaredQualifiedEntityList extends UnsugarableQualifiedEntityList {
	entities: string | SugarableQualifiedEntityList
}

export class BoxedQualifiedEntityList {
	public constructor(public readonly value: QualifiedEntityList) {}
	public get type() {
		return 'qualifiedEntityList' as const
	}
	public get isConstrained(): true {
		return true
	}
}

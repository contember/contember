import {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import { DesugaredHasOneRelation, HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import {
	DesugaredQualifiedEntityParameters,
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'
import {
	DesugaredSingleEntityStaticEvents,
	SingleEntityStaticEvents,
	SugarableSingleEntityStaticEvents,
	UnsugarableSingleEntityStaticEvents,
} from './SingleEntityStaticEvents'

export interface DesugaredUnconstrainedQualifiedSingleEntity
	extends DesugaredQualifiedEntityParameters,
		DesugaredEntityCreationParameters,
		DesugaredSingleEntityStaticEvents {
	hasOneRelationPath: DesugaredHasOneRelation[]
}

export interface UnconstrainedQualifiedSingleEntity
	extends QualifiedEntityParameters,
		EntityCreationParameters,
		SingleEntityStaticEvents {
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableUnconstrainedQualifiedSingleEntity
	extends SugarableQualifiedEntityParameters,
		SugarableEntityCreationParameters,
		SugarableSingleEntityStaticEvents {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableUnconstrainedQualifiedSingleEntity
	extends UnsugarableQualifiedEntityParameters,
		UnsugarableEntityCreationParameters,
		UnsugarableSingleEntityStaticEvents {
	// Deliberately leaving out UnsugarableHasOneRelation
}

// E.g. Author.son.sisters(name = 'Jane')
export interface SugaredUnconstrainedQualifiedSingleEntity extends UnsugarableUnconstrainedQualifiedSingleEntity {
	entity: string | SugarableUnconstrainedQualifiedSingleEntity
}

export class BoxedUnconstrainedQualifiedSingleEntity {
	public constructor(public readonly value: UnconstrainedQualifiedSingleEntity) {}
	public get type() {
		return 'unconstrainedQualifiedSingleEntity' as const
	}
	public get isConstrained(): false {
		return false
	}
}

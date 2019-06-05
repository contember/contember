import { Input, Model } from 'cms-common'

export interface ColumnContext {
	entity: Model.Entity
	column: Model.AnyColumn
	input: Input.ColumnValue | undefined
}

export interface ManyHasManyInversedContext {
	entity: Model.Entity
	relation: Model.ManyHasManyInversedRelation
	targetEntity: Model.Entity
	targetRelation: Model.ManyHasManyOwnerRelation
	index: number
}

export interface ManyHasManyOwnerContext {
	entity: Model.Entity
	relation: Model.ManyHasManyOwnerRelation
	targetEntity: Model.Entity
	targetRelation: Model.ManyHasManyInversedRelation | null
	index: number
}

export interface ManyHasOneContext {
	entity: Model.Entity
	relation: Model.ManyHasOneRelation
	targetEntity: Model.Entity
	targetRelation: Model.OneHasManyRelation | null
}

export interface OneHasManyContext {
	entity: Model.Entity
	relation: Model.OneHasManyRelation
	targetEntity: Model.Entity
	targetRelation: Model.ManyHasOneRelation
	index: number
}

export interface OneHasOneInversedContext {
	entity: Model.Entity
	relation: Model.OneHasOneInversedRelation
	targetEntity: Model.Entity
	targetRelation: Model.OneHasOneOwnerRelation
}

export interface OneHasOneOwnerContext {
	entity: Model.Entity
	relation: Model.OneHasOneOwnerRelation
	targetEntity: Model.Entity
	targetRelation: Model.OneHasOneInversedRelation | null
}

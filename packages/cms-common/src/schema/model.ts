namespace Model {
	export interface Entity {
		name: string
		pluralName: string
		primary: string
		primaryColumn: string
		tableName: string
		fields: { [name: string]: Column | AnyRelation }
		unique: Array<{ fields: string[]; name: string }>
	}

	export interface Column {
		name: string
		default?: any | (() => any)
		type: string
		columnName: string
		nullable: boolean
		options?: {
			[name: string]: any
		}
	}

	export interface ColumnVisitor<T> {
		visitColumn(entity: Entity, column: Column): T
	}

	export interface RelationVisitor<T> {
		visitRelation(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: Relation | null): T
	}

	export type FieldVisitor<T> = ColumnVisitor<T> &
		(RelationVisitor<T> | RelationByTypeVisitor<T> | RelationByGenericTypeVisitor<T>)

	export interface RelationByTypeVisitor<T> {
		visitManyHasOne(
			entity: Entity,
			relation: ManyHasOneRelation,
			targetEntity: Entity,
			targetRelation: OneHasManyRelation | null
		): T

		visitOneHasMany(
			entity: Entity,
			relation: OneHasManyRelation,
			targetEntity: Entity,
			targetRelation: ManyHasOneRelation
		): T

		visitOneHasOneOwner(
			entity: Entity,
			relation: OneHasOneOwnerRelation,
			targetEntity: Entity,
			targetRelation: OneHasOneInversedRelation | null
		): T

		visitOneHasOneInversed(
			entity: Entity,
			relation: OneHasOneInversedRelation,
			targetEntity: Entity,
			targetRelation: OneHasOneOwnerRelation
		): T

		visitManyHasManyOwner(
			entity: Entity,
			relation: ManyHasManyOwnerRelation,
			targetEntity: Entity,
			targetRelation: ManyHasManyInversedRelation | null
		): T

		visitManyHasManyInversed(
			entity: Entity,
			relation: ManyHasManyInversedRelation,
			targetEntity: Entity,
			targetRelation: ManyHasManyOwnerRelation
		): T
	}

	export interface RelationByGenericTypeVisitor<T> {
		visitHasMany(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: Relation | null): T

		visitHasOne(
			entity: Entity,
			relation: Relation & NullableRelation,
			targetEntity: Entity,
			targetRelation: Relation | null
		): T
	}

	export enum RelationType {
		OneHasOne = 'OneHasOne',
		OneHasMany = 'OneHasMany',
		ManyHasOne = 'ManyHasOne',
		ManyHasMany = 'ManyHasMany'
	}

	export type AnyRelation =
		| OneHasManyRelation
		| ManyHasOneRelation
		| OneHasOneInversedRelation
		| OneHasOneOwnerRelation
		| ManyHasManyInversedRelation
		| ManyHasManyOwnerRelation

	export interface Relation<T extends RelationType = RelationType> {
		name: string
		relation: T
		target: string
	}

	export interface InversedRelation extends Relation {
		ownedBy: string
	}

	export interface OwnerRelation extends Relation {
		inversedBy?: string
	}

	export enum OnDelete {
		cascade = 'cascade',
		restrict = 'restrict',
		setNull = 'set null'
	}

	export type JoiningColumn = {
		columnName: string
		onDelete: OnDelete
	}

	export interface JoiningColumnRelation {
		joiningColumn: JoiningColumn
	}

	export interface NullableRelation {
		nullable: boolean
	}

	export interface JoiningTable {
		tableName: string
		joiningColumn: JoiningColumn
		inverseJoiningColumn: JoiningColumn
	}

	export interface JoiningTableRelation {
		joiningTable: JoiningTable
	}

	export type OneHasManyRelation = Relation<RelationType.OneHasMany> & InversedRelation
	export type ManyHasOneRelation = Relation<RelationType.ManyHasOne> &
		OwnerRelation &
		JoiningColumnRelation &
		NullableRelation
	export type OneHasOneInversedRelation = Relation<RelationType.OneHasOne> & InversedRelation & NullableRelation
	export type OneHasOneOwnerRelation = Relation<RelationType.OneHasOne> &
		OwnerRelation &
		JoiningColumnRelation &
		NullableRelation
	export type ManyHasManyInversedRelation = Relation<RelationType.ManyHasMany> & InversedRelation
	export type ManyHasManyOwnerRelation = Relation<RelationType.ManyHasMany> & OwnerRelation & JoiningTableRelation

	export interface Schema {
		enums: { [name: string]: string[] }
		entities: { [name: string]: Entity }
	}
}

export default Model

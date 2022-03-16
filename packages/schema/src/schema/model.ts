import Input from './input'

namespace Model {
	export interface Entity {
		name: string
		primary: string
		primaryColumn: string
		tableName: string
		fields: { [name: string]: AnyField }
		unique: UniqueConstraints
		view?: View
	}

	export interface View {
		sql: string
		dependencies?: string[]
	}

	export type FieldType = RelationType | ColumnType
	export interface Field<T extends FieldType> {
		type: T
	}

	export type AnyField = AnyColumn | AnyRelation
	export type AnyColumn<T extends ColumnType = ColumnType> = Column<T>

	export enum ColumnType {
		Uuid = 'Uuid',
		String = 'String',
		Int = 'Integer',
		Double = 'Double',
		Bool = 'Bool',
		Enum = 'Enum',
		DateTime = 'DateTime',
		Date = 'Date',
		Json = 'Json',
	}

	export type Column<T extends ColumnType> = ColumnTypeDefinition<T> & {
		name: string
		columnName: string
	}

	export interface ColumnTypeDefinition<T extends ColumnType = ColumnType> extends Field<T> {
		columnType: string
		typeAlias?: string
		nullable: boolean
		default?: string | number | boolean | null
		sequence?: {
			precedence: 'ALWAYS' | 'BY DEFAULT'
			start?: number
		}
	}

	export interface ColumnVisitor<T> {
		visitColumn(entity: Entity, column: AnyColumn): T
	}

	export interface RelationVisitor<T> {
		visitRelation(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: Relation | null): T
	}

	export type FieldVisitor<T> =
		& ColumnVisitor<T>
		& (
			| RelationVisitor<T>
			| RelationByTypeVisitor<T>
			| RelationByGenericTypeVisitor<T>
		)

	export interface RelationByTypeVisitor<T> {
		visitManyHasOne(
			entity: Entity,
			relation: ManyHasOneRelation,
			targetEntity: Entity,
			targetRelation: OneHasManyRelation | null,
		): T

		visitOneHasMany(
			entity: Entity,
			relation: OneHasManyRelation,
			targetEntity: Entity,
			targetRelation: ManyHasOneRelation,
		): T

		visitOneHasOneOwning(
			entity: Entity,
			relation: OneHasOneOwningRelation,
			targetEntity: Entity,
			targetRelation: OneHasOneInverseRelation | null,
		): T

		visitOneHasOneInverse(
			entity: Entity,
			relation: OneHasOneInverseRelation,
			targetEntity: Entity,
			targetRelation: OneHasOneOwningRelation,
		): T

		visitManyHasManyOwning(
			entity: Entity,
			relation: ManyHasManyOwningRelation,
			targetEntity: Entity,
			targetRelation: ManyHasManyInverseRelation | null,
		): T

		visitManyHasManyInverse(
			entity: Entity,
			relation: ManyHasManyInverseRelation,
			targetEntity: Entity,
			targetRelation: ManyHasManyOwningRelation,
		): T
	}

	export interface RelationByGenericTypeVisitor<T> {
		visitHasMany(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: Relation | null): T

		visitHasOne(
			entity: Entity,
			relation: Relation & NullableRelation,
			targetEntity: Entity,
			targetRelation: Relation | null,
		): T
	}

	export enum RelationType {
		OneHasOne = 'OneHasOne',
		OneHasMany = 'OneHasMany',
		ManyHasOne = 'ManyHasOne',
		ManyHasMany = 'ManyHasMany',
	}

	export type AnyInverseRelation =
		| OneHasManyRelation
		| OneHasOneInverseRelation
		| ManyHasManyInverseRelation

	/** @deprecated */
	export type AnyInversedRelation = AnyInverseRelation

	export type AnyOwningRelation =
		| ManyHasOneRelation
		| OneHasOneOwningRelation
		| ManyHasManyOwningRelation

	export type AnyRelation = AnyInverseRelation | AnyOwningRelation

	export interface Relation<T extends RelationType = RelationType> extends Field<T> {
		name: string
		type: T
		target: string
	}

	export interface InverseRelation extends Relation {
		ownedBy: string
	}

	/** @deprecated */
	export interface InversedRelation extends InverseRelation {}

	export interface OwningRelation extends Relation {
		inversedBy?: string
	}

	/** @deprecated */
	export interface OwnerRelation extends OwningRelation {}

	export enum OnDelete {
		cascade = 'cascade',
		restrict = 'restrict',
		setNull = 'set null',
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

	export import OrderDirection = Input.OrderDirection
	export type OrderBy = { path: string[]; direction: OrderDirection }

	export interface OrderableRelation {
		orderBy?: OrderBy[]
	}

	export type OneHasManyRelation =
		& Relation<RelationType.OneHasMany>
		& InverseRelation
		& OrderableRelation

	export type ManyHasOneRelation =
		& Relation<RelationType.ManyHasOne>
		& OwningRelation
		& JoiningColumnRelation
		& NullableRelation

	export type OneHasOneInverseRelation =
		& Relation<RelationType.OneHasOne>
		& InverseRelation
		& NullableRelation
	/** @deprecated */
	export type OneHasOneInversedRelation = OneHasOneInverseRelation

	export type OneHasOneOwningRelation =
		& Relation<RelationType.OneHasOne>
		& OwningRelation
		& JoiningColumnRelation
		& NullableRelation
		& {
			orphanRemoval?: true
		}
	/** @deprecated */
	export type OneHasOneOwnerRelation = OneHasOneOwningRelation

	export type ManyHasManyInverseRelation =
		& Relation<RelationType.ManyHasMany>
		& InverseRelation
		& OrderableRelation
	/** @deprecated */
	export type ManyHasManyInversedRelation = ManyHasManyInverseRelation

	export type ManyHasManyOwningRelation =
		& Relation<RelationType.ManyHasMany>
		& OwningRelation
		& JoiningTableRelation
		& OrderableRelation
	/** @deprecated */
	export type ManyHasManyOwnerRelation = ManyHasManyOwningRelation

	export interface Schema {
		enums: { [name: string]: string[] }
		entities: { [name: string]: Entity }
	}

	export interface UniqueConstraints {
		[name: string]: UniqueConstraint
	}

	export interface UniqueConstraint {
		fields: string[]
		name: string
	}
}

export default Model

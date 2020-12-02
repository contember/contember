import Input from './input'

namespace Model {
	export interface Entity {
		name: string
		primary: string
		primaryColumn: string
		tableName: string
		fields: { [name: string]: AnyField }
		unique: UniqueConstraints
	}

	export type FieldType = RelationType | ColumnType
	export interface Field<T extends FieldType> {
		type: T
	}

	export type AnyField = AnyColumn | AnyRelation
	export type AnyColumn = Column<ColumnType>
	export type AnyColumnDefinition =
		| UuidColumnDefinition
		| StringColumnDefinition
		| IntColumnDefinition
		| DoubleColumnDefinition
		| BoolColumnDefinition
		| EnumColumnDefinition
		| DateTimeColumnDefinition
		| DateColumnDefinition

	export enum ColumnType {
		Uuid = 'Uuid',
		String = 'String',
		Int = 'Integer',
		Double = 'Double',
		Bool = 'Bool',
		Enum = 'Enum',
		DateTime = 'DateTime',
		Date = 'Date',
	}

	export type Column<T extends ColumnType> = Field<T> &
		ColumnDefinitionByType<T> & {
			name: string
			columnName: string
		}

	export interface ColumnTypeDefinition<T extends ColumnType = ColumnType> {
		type: T
		columnType: string
		nullable: boolean
		default?: string | number | boolean | null
	}

	export type ColumnByType<T extends ColumnType, A = AnyColumn> = A extends { type: T } ? A : never
	export type ColumnDefinitionByType<T extends ColumnType, A = AnyColumnDefinition> = A extends { type: T } ? A : never

	export interface UuidColumnDefinition extends ColumnTypeDefinition<ColumnType.Uuid> {
		columnType: 'uuid'
		default?: undefined
	}

	export interface StringColumnDefinition extends ColumnTypeDefinition<ColumnType.String> {
		columnType: 'text'
		default?: string
	}

	export interface IntColumnDefinition extends ColumnTypeDefinition<ColumnType.Int> {
		columnType: 'integer'
		default?: number
	}

	export interface DoubleColumnDefinition extends ColumnTypeDefinition<ColumnType.Double> {
		columnType: 'double precision'
		default?: number
	}

	export interface BoolColumnDefinition extends ColumnTypeDefinition<ColumnType.Bool> {
		columnType: 'boolean'
		default?: boolean
	}

	export interface EnumColumnDefinition extends ColumnTypeDefinition<ColumnType.Enum> {
		columnType: string
		enumName: string
		default?: string
	}

	export interface DateTimeColumnDefinition extends ColumnTypeDefinition<ColumnType.DateTime> {
		columnType: 'timestamptz'
		default?: 'now'
	}

	export interface DateColumnDefinition extends ColumnTypeDefinition<ColumnType.Date> {
		columnType: 'date'
		default?: 'now'
	}

	export interface ColumnVisitor<T> {
		visitColumn(entity: Entity, column: AnyColumn): T
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
			targetRelation: OneHasManyRelation | null,
		): T

		visitOneHasMany(
			entity: Entity,
			relation: OneHasManyRelation,
			targetEntity: Entity,
			targetRelation: ManyHasOneRelation,
		): T

		visitOneHasOneOwner(
			entity: Entity,
			relation: OneHasOneOwnerRelation,
			targetEntity: Entity,
			targetRelation: OneHasOneInverseRelation | null,
		): T

		visitOneHasOneInverse(
			entity: Entity,
			relation: OneHasOneInverseRelation,
			targetEntity: Entity,
			targetRelation: OneHasOneOwnerRelation,
		): T

		visitManyHasManyOwner(
			entity: Entity,
			relation: ManyHasManyOwnerRelation,
			targetEntity: Entity,
			targetRelation: ManyHasManyInverseRelation | null,
		): T

		visitManyHasManyInverse(
			entity: Entity,
			relation: ManyHasManyInverseRelation,
			targetEntity: Entity,
			targetRelation: ManyHasManyOwnerRelation,
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

	export type AnyInverseRelation = OneHasManyRelation | OneHasOneInverseRelation | ManyHasManyInverseRelation

	/** @deprecated */
	export type AnyInversedRelation = AnyInverseRelation

	export type AnyOwningRelation = ManyHasOneRelation | OneHasOneOwnerRelation | ManyHasManyOwnerRelation

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

	export interface OwnerRelation extends Relation {
		inversedBy?: string
	}

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

	export type OneHasManyRelation = Relation<RelationType.OneHasMany> & InverseRelation & OrderableRelation
	export type ManyHasOneRelation = Relation<RelationType.ManyHasOne> &
		OwnerRelation &
		JoiningColumnRelation &
		NullableRelation
	export type OneHasOneInverseRelation = Relation<RelationType.OneHasOne> & InverseRelation & NullableRelation
	/** @deprecated */
	export type OneHasOneInversedRelation = OneHasOneInverseRelation
	export type OneHasOneOwnerRelation = Relation<RelationType.OneHasOne> &
		OwnerRelation &
		JoiningColumnRelation &
		NullableRelation
	export type ManyHasManyInverseRelation = Relation<RelationType.ManyHasMany> & InverseRelation & OrderableRelation
	/** @deprecated */
	export type ManyHasManyInversedRelation = ManyHasManyInverseRelation
	export type ManyHasManyOwnerRelation = Relation<RelationType.ManyHasMany> &
		OwnerRelation &
		JoiningTableRelation &
		OrderableRelation

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

import { Input } from './input'

export namespace Model {

	export type Entity = {
		readonly name: string
		readonly primary: string
		readonly primaryColumn: string
		readonly tableName: string
		readonly fields: { readonly [name: string]: AnyField }
		readonly unique: UniqueConstraints
		readonly indexes: Indexes
		readonly view?: View
		readonly eventLog: EventLogConfig
		readonly migrations: EntityMigrations
	}

	export type EntityMigrations = {
		readonly enabled: boolean
	}

	export type View = {
		readonly sql: string
		readonly dependencies?: readonly string[]
	}

	export type EventLogConfig = {
		readonly enabled: boolean
	}

	export type FieldType = RelationType | ColumnType
	export type Field<T extends FieldType> = {
		readonly type: T
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
		readonly name: string
		readonly columnName: string
	}

	export type ColumnTypeDefinition<T extends ColumnType = ColumnType>  =
		& Field<T>
		& {
			readonly columnType: string
			readonly typeAlias?: string
			readonly nullable: boolean
			readonly default?: string | number | boolean | null
			readonly sequence?: {
				readonly precedence: 'ALWAYS' | 'BY DEFAULT'
				readonly start?: number
			}
		}

	export interface ColumnVisitor<T> {
		visitColumn(entity: Entity, column: AnyColumn): T
	}

	export interface RelationVisitor<T> {
		visitRelation(entity: Entity, relation: Relation, targetEntity: Entity, targetRelation: AnyRelation | null): T
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

	export type Relation<T extends RelationType = RelationType>=
		& Field<T>
		& {
			readonly name: string
			readonly type: T
			readonly target: string
		}

	export type InverseRelation =
		& Relation
		& {
			readonly ownedBy: string
		}

	/** @deprecated */
	export type InversedRelation = InverseRelation

	export type OwningRelation =
		& Relation
		& {
			readonly inversedBy?: string
		}

	/** @deprecated */
	export type OwnerRelation = OwningRelation

	export enum OnDelete {
		cascade = 'cascade',
		restrict = 'restrict',
		setNull = 'set null',
	}

	export type JoiningColumn = {
		readonly columnName: string
		readonly onDelete: OnDelete
	}

	export type JoiningColumnRelation = {
		readonly joiningColumn: JoiningColumn
	}

	export type NullableRelation = {
		readonly nullable: boolean
	}

	export type JoiningTable = {
		readonly tableName: string
		readonly joiningColumn: JoiningColumn
		readonly inverseJoiningColumn: JoiningColumn
		readonly eventLog: EventLogConfig
	}

	export type JoiningTableRelation = {
		readonly joiningTable: JoiningTable
	}

	export import OrderDirection = Input.OrderDirection
	export type OrderBy = {
		readonly path: readonly string[]
		readonly direction: OrderDirection
	}

	export type OrderableRelation = {
		readonly orderBy?: readonly OrderBy[]
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
			readonly orphanRemoval?: true
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

	export type Enum = {
		readonly values: readonly string[]
		readonly migrations: EnumMigrations
	}

	export type EnumMigrations = {
		readonly enabled: boolean
	}


	export type Schema = {
		readonly enums: { readonly [name: string]: Enum }
		readonly entities: { readonly [name: string]: Entity }
	}

	export type UniqueConstraints = {
		readonly [name: string]: UniqueConstraint
	}

	export type UniqueConstraint = {
		readonly fields: readonly string[]
		readonly name: string
	}

	export type Indexes = {
		readonly [name: string]: Index
	}

	export type Index = {
		readonly fields: readonly string[]
		readonly name: string
	}
}

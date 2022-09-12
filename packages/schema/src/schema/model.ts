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

	export type Schema = {
		readonly enums: { readonly [name: string]: readonly string[] }
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


	export interface ColumnContext {
		entity: Model.Entity
		column: Model.AnyColumn
	}

	export type AnyHasManyRelationContext =
		| ManyHasManyInverseContext
		| ManyHasManyOwningContext
		| OneHasManyContext

	export type AnyHasOneRelationContext =
		| ManyHasOneContext
		| OneHasOneOwningContext
		| OneHasOneInverseContext

	export type AnyRelationContext =
		| AnyHasManyRelationContext
		| AnyHasOneRelationContext

	export type AnyFieldContext =
		| ColumnContext
		| AnyRelationContext

	export interface ManyHasManyInverseContext {
		type: 'manyHasManyInverse'
		entity: Model.Entity
		relation: Model.ManyHasManyInverseRelation
		targetEntity: Model.Entity
		targetRelation: Model.ManyHasManyOwningRelation
	}

	export interface ManyHasManyOwningContext {
		type: 'manyHasManyOwning'
		entity: Model.Entity
		relation: Model.ManyHasManyOwningRelation
		targetEntity: Model.Entity
		targetRelation: Model.ManyHasManyInverseRelation | null
	}

	export interface ManyHasOneContext {
		type: 'manyHasOne'
		entity: Model.Entity
		relation: Model.ManyHasOneRelation
		targetEntity: Model.Entity
		targetRelation: Model.OneHasManyRelation | null
	}

	export interface OneHasManyContext {
		type: 'oneHasMany'
		entity: Model.Entity
		relation: Model.OneHasManyRelation
		targetEntity: Model.Entity
		targetRelation: Model.ManyHasOneRelation
	}

	export interface OneHasOneInverseContext {
		type: 'oneHasOneInverse'
		entity: Model.Entity
		relation: Model.OneHasOneInverseRelation
		targetEntity: Model.Entity
		targetRelation: Model.OneHasOneOwningRelation
	}

	export interface OneHasOneOwningContext {
		type: 'oneHasOneOwning'
		entity: Model.Entity
		relation: Model.OneHasOneOwningRelation
		targetEntity: Model.Entity
		targetRelation: Model.OneHasOneInverseRelation | null
	}


	export interface ColumnVisitor<T> {
		visitColumn(context: ColumnContext): T
	}

	export interface RelationVisitor<T> {
		visitRelation(context: AnyRelationContext): T
	}

	export type FieldVisitor<T> =
		& ColumnVisitor<T>
		& (
			| RelationVisitor<T>
			| RelationByTypeVisitor<T>
			| RelationByGenericTypeVisitor<T>
		)

	export interface RelationByTypeVisitor<T> {
		visitManyHasOne(context: ManyHasOneContext): T

		visitOneHasMany(context: OneHasManyContext): T

		visitOneHasOneOwning(context: OneHasOneOwningContext): T

		visitOneHasOneInverse(context: OneHasOneInverseContext): T

		visitManyHasManyOwning(context: ManyHasManyOwningContext): T

		visitManyHasManyInverse(context: ManyHasManyInverseContext): T
	}

	export interface RelationByGenericTypeVisitor<T> {
		visitHasMany(context: AnyHasManyRelationContext): T

		visitHasOne(context: AnyHasOneRelationContext): T
	}
}

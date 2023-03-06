import { Input } from './input'
import { JSONValue } from './json'

export namespace Model {

	export type Entity<Fields extends string = string> = {
		readonly name: string
		readonly primary: string
		readonly primaryColumn: string
		readonly tableName: string
		readonly fields: { readonly [name in Fields]: AnyField }
		readonly unique: Uniques
		readonly indexes: Indexes
		readonly view?: View
		readonly eventLog: EventLogConfig
		readonly orderBy?: readonly OrderBy[]
		readonly description?: string
	}

	export type View = {
		readonly sql: string
		readonly dependencies?: readonly string[]
		readonly idSource?: readonly string[]
		readonly materialized?: boolean
	}

	export type EventLogConfig = {
		readonly enabled: boolean
	}

	export type FieldType = RelationType | ColumnType
	export type Field<T extends FieldType> = {
		readonly type: T
		readonly description?: string
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
		Time = 'Time',
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
			readonly list?: boolean
			readonly typeAlias?: string
			readonly nullable: boolean
			readonly default?: JSONValue
			readonly sequence?: {
				readonly precedence: 'ALWAYS' | 'BY DEFAULT'
				readonly start?: number
			}
			readonly collation?: Collation
			readonly deprecationReason?: string
		}

	export type Collation =
		// generic
		| 'und-x-icu' | 'C' | 'ucs_basic' | 'unicode' | 'POSIX' | 'default'
		// some languages
		| 'cs-x-icu' | 'sk-x-icu' | 'da-x-icu' | 'de-x-icu' | 'en-x-icu' | 'es-x-icu' | 'fr-x-icu' | 'it-x-icu' | 'ja-x-icu' | 'ko-x-icu' | 'nl-x-icu' | 'pl-x-icu' | 'pt-x-icu' | 'ru-x-icu' | 'sv-x-icu' | 'tr-x-icu' | 'zh-x-icu' | 'hu-x-icu' | 'fi-x-icu' | 'el-x-icu' | 'bg-x-icu' | 'hr-x-icu' | 'ro-x-icu' | 'sl-x-icu' | 'sr-x-icu' | 'uk-x-icu' | 'vi-x-icu' | 'th-x-icu' | 'ar-x-icu' | 'he-x-icu' | 'hi-x-icu' | 'id-x-icu' | 'ms-x-icu' | 'fil-x-icu' | 'sw-x-icu' | 'ta-x-icu' | 'te-x-icu' | 'ml-x-icu' | 'bn-x-icu' | 'gu-x-icu' | 'kn-x-icu' | 'mr-x-icu' | 'pa-x-icu' | 'ur-x-icu' | 'or-x-icu' | 'si-x-icu' | 'th-x-icu' | 'lo-x-icu' | 'my-x-icu' | 'ka-x-icu' | 'am-x-icu' | 'ti-x-icu' | 'ne-x-icu' | 'dz-x-icu' | 'kok-x-icu' | 'syr-x-icu' | 'sd-x-icu' | 'bo-x-icu' | 'km-x-icu' | 'mn-x-icu' | 'lo-x-icu' | 'gl-x-icu' | 'eu-x-icu' | 'ca-x-icu' | 'af-x-icu' | 'is-x-icu' | 'mk-x-icu' | 'sq-x-icu' | 'hy-x-icu' | 'mt-x-icu' | 'cy-x-icu' | 'et-x-icu' | 'lv-x-icu' | 'lt-x-icu' | 'tg-x-icu' | 'fa-x-icu' | 'ps-x-icu' | 'ks-x-icu' | 'sd-x'
		// fallback
		| string & {}


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

	export type DeprecatedRelation = {
		readonly deprecationReason?: string
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
		& DeprecatedRelation

	export type ManyHasOneRelation =
		& Relation<RelationType.ManyHasOne>
		& OwningRelation
		& JoiningColumnRelation
		& NullableRelation
		& DeprecatedRelation

	export type OneHasOneInverseRelation =
		& Relation<RelationType.OneHasOne>
		& InverseRelation
		& NullableRelation
		& DeprecatedRelation
	/** @deprecated */
	export type OneHasOneInversedRelation = OneHasOneInverseRelation

	export type OneHasOneOwningRelation =
		& Relation<RelationType.OneHasOne>
		& OwningRelation
		& JoiningColumnRelation
		& NullableRelation
		& DeprecatedRelation
		& {
			readonly orphanRemoval?: true
		}
	/** @deprecated */
	export type OneHasOneOwnerRelation = OneHasOneOwningRelation

	export type ManyHasManyInverseRelation =
		& Relation<RelationType.ManyHasMany>
		& InverseRelation
		& OrderableRelation
		& DeprecatedRelation
	/** @deprecated */
	export type ManyHasManyInversedRelation = ManyHasManyInverseRelation

	export type ManyHasManyOwningRelation =
		& Relation<RelationType.ManyHasMany>
		& OwningRelation
		& JoiningTableRelation
		& OrderableRelation
		& DeprecatedRelation
	/** @deprecated */
	export type ManyHasManyOwnerRelation = ManyHasManyOwningRelation

	export type Schema = {
		readonly enums: { readonly [name: string]: readonly string[] }
		readonly entities: { readonly [name: string]: Entity }
	}

	export type Unique = UniqueIndex | UniqueConstraint
	export type Uniques = readonly (Unique)[]

	export type ConstraintTiming = 'deferrable' | 'deferred'

	export type UniqueConstraint = {
		readonly fields: readonly string[]
		readonly timing?: ConstraintTiming // empty means not deferrable
		readonly name?: string
		readonly index?: false
	}
	export type NullsDistinctBehaviour = 'distinct' | 'not distinct'
	export type UniqueIndex = {
		readonly fields: readonly string[]
		readonly index: true
		readonly nulls?: NullsDistinctBehaviour // empty means distinct
		readonly method?: IndexMethod
	}

	export type Indexes = readonly Index[]

	export type IndexMethod = 'btree' | 'gin' | 'gist' | 'hash' | 'brin' | 'spgist'

	export type Index = {
		readonly fields: readonly string[]
		readonly name?: string
		readonly method?: IndexMethod
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

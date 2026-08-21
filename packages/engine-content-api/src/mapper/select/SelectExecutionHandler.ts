import { Path } from './Path.js'
import { Acl, Input, Model } from '@contember/schema'
import { ColumnValueGetter, SelectNestedData, SelectNestedDefaultValue, SelectRow } from './SelectHydrator.js'
import { SelectBuilder } from '@contember/database'
import { Mapper } from '../Mapper.js'
import { FieldNode, ObjectNode } from '../../inputProcessing/index.js'

export interface SelectExecutionHandler<
	FieldArgs = unknown,
	FieldExtensions extends Record<string, any> = Record<string, any>,
> {
	process(context: SelectExecutionHandlerContext<FieldArgs, FieldExtensions>): void
}

export type DataCallback = (ids: Input.PrimaryValue[]) => Promise<SelectNestedData>

export type SelectExecutionHandlerContext<
	FieldArgs = any,
	FieldExtensions extends Record<string, any> = Record<string, any>,
> =
	& {
		mapper: Mapper
		path: Path
		entity: Model.Entity
		relationPath: Model.AnyRelationContext[]
		/**
		 * Compiles a predicate REFERENCE into a per-row boolean (and selects the backing column). The reference
		 * must come from the permission set the query path implies (see `aclScopeFromPath`), since that is the
		 * set its definition is resolved against.
		 */
		addPredicate: (predicate: Acl.Predicate) => (row: SelectRow) => boolean
		addColumn: (args: {
			predicate?: Acl.Predicate
			query?: (qb: SelectBuilder<SelectBuilder.Result>) => SelectBuilder<SelectBuilder.Result>
			path?: Path
			valueGetter?: ColumnValueGetter
		}) => void
		addData: (args: {
			field: string
			dataProvider: DataCallback
			predicate?: Acl.Predicate
			defaultValue?: SelectNestedDefaultValue
		}) => void
	}
	& (
		| {
			fieldNode: FieldNode<FieldExtensions>
			objectNode?: never
		}
		| {
			fieldNode?: never
			objectNode: ObjectNode<FieldArgs, FieldExtensions>
		}
	)

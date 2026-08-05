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
		 * Compiles a predicate REFERENCE into a per-row boolean (and selects the backing column).
		 *
		 * The reference is resolved against the permission set the query path implies — the through-inclusive
		 * `all` set for anything nested. Pass `rootOnly` when the name was taken from the root set instead:
		 * merging roles renames predicates (`__merge__a__b`) and drops `noRoot` ones, so resolving a root name
		 * against `all` either throws `Undefined predicate` or silently picks a different definition.
		 */
		addPredicate: (predicate: Acl.Predicate, options?: { rootOnly?: boolean }) => (row: SelectRow) => boolean
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

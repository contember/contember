import { Path } from './Path'
import { Acl, Input, Model } from '@contember/schema'
import { ColumnValueGetter, SelectNestedData, SelectNestedDefaultValue, SelectRow } from './SelectHydrator'
import { SelectBuilder } from '@contember/database'
import { Mapper } from '../Mapper'
import { FieldNode, ObjectNode } from '../../inputProcessing'

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
> = {
	mapper: Mapper
	path: Path
	entity: Model.Entity
	relationPath: Model.AnyRelationContext[]
	addPredicate: (predicate: Acl.Predicate) => (row: SelectRow) => boolean
	addColumn: (args: {
		predicate?: Acl.Predicate
		query?: (qb: SelectBuilder<SelectBuilder.Result>) => SelectBuilder<SelectBuilder.Result>
		path?: Path
		valueGetter?: ColumnValueGetter
	}) => void
	addData: (parentField: string, cb: DataCallback, defaultValue?: SelectNestedDefaultValue) => void
} & (
	| {
		fieldNode: FieldNode<FieldExtensions>
		objectNode?: never
	  }
	| {
		fieldNode?: never
		objectNode: ObjectNode<FieldArgs, FieldExtensions>
	  }
)

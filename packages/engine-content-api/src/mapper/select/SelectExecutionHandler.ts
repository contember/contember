import { Path } from './Path.js'
import { Input, Model } from '@contember/schema'
import { SelectNestedData, SelectNestedDefaultValue } from './SelectHydrator.js'
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
> = {
	mapper: Mapper
	path: Path
	entity: Model.Entity

	addColumn: (
		queryCallback: (qb: SelectBuilder<SelectBuilder.Result>) => SelectBuilder<SelectBuilder.Result>,
		path?: Path,
	) => void
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

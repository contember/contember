import { Path } from './Path'
import { Input, Model } from '@contember/schema'
import { SelectNestedData, SelectNestedDefaultValue } from './SelectHydrator'
import { SelectBuilder } from '@contember/database'
import { Mapper } from '../Mapper'
import { FieldNode, ObjectNode } from '../../inputProcessing'

export interface SelectExecutionHandler<MetaArgs> {
	process(context: SelectExecutionHandlerContext): void
}

export type DataCallback = (ids: Input.PrimaryValue[]) => Promise<SelectNestedData>

export interface SelectExecutionHandlerContext {
	mapper: Mapper
	path: Path
	field: ObjectNode | FieldNode
	entity: Model.Entity

	addColumn: (
		queryCallback: (qb: SelectBuilder<SelectBuilder.Result>) => SelectBuilder<SelectBuilder.Result>,
		path?: Path,
	) => void
	addData: (parentField: string, cb: DataCallback, defaultValue?: SelectNestedDefaultValue) => void
}

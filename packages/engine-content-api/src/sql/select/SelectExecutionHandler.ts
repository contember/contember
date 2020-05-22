import Path from './Path'
import { Input, Model } from '@contember/schema'
import SelectHydrator from './SelectHydrator'
import { SelectBuilder } from '@contember/database'
import Mapper from '../Mapper'
import { FieldNode, ObjectNode } from '../../inputProcessing'

interface SelectExecutionHandler<MetaArgs> {
	process(context: SelectExecutionHandler.Context): void
}

namespace SelectExecutionHandler {
	export type DataCallback = (ids: Input.PrimaryValue[]) => Promise<SelectHydrator.NestedData>

	export interface Context {
		mapper: Mapper
		path: Path
		field: ObjectNode | FieldNode
		entity: Model.Entity

		addColumn: (
			queryCallback: (qb: SelectBuilder<SelectBuilder.Result>) => SelectBuilder<SelectBuilder.Result>,
			path?: Path,
		) => void
		addData: (parentField: string, cb: DataCallback, defaultValue?: SelectHydrator.NestedDefaultValue) => void
	}
}

export default SelectExecutionHandler

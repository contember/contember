import FieldNode from '../../graphQlResolver/FieldNode'
import Path from './Path'
import ObjectNode from '../../graphQlResolver/ObjectNode'
import { Input, Model } from '@contember/schema'
import SelectHydrator from './SelectHydrator'
import { SelectBuilder } from '@contember/database'

interface SelectExecutionHandler<MetaArgs> {
	process(context: SelectExecutionHandler.Context): void
}

namespace SelectExecutionHandler {
	export type DataCallback = (ids: Input.PrimaryValue[]) => Promise<SelectHydrator.NestedData>

	export interface Context {
		path: Path
		field: ObjectNode | FieldNode
		entity: Model.Entity

		addColumn: (
			queryCallback: (qb: SelectBuilder<SelectBuilder.Result, any>) => SelectBuilder<SelectBuilder.Result, any>,
			path?: Path,
		) => void
		addData: (parentField: string, cb: DataCallback, defaultValue?: SelectHydrator.NestedDefaultValue) => void
	}
}

export default SelectExecutionHandler

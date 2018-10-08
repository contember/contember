import FieldNode from "../../graphQlResolver/FieldNode";
import Path from "./Path";
import ObjectNode from "../../graphQlResolver/ObjectNode";
import { Input, Model } from "cms-common";
import SelectHydrator from "./SelectHydrator";
import QueryBuilder from "../../../core/knex/QueryBuilder";


interface SelectExecutionHandler<MetaArgs> {
	process(context: SelectExecutionHandler.Context): void
}

namespace SelectExecutionHandler {
	export type DataCallback = (
		ids: Input.PrimaryValue[],
	) => Promise<SelectHydrator.NestedData>

	export interface Context {
		path: Path
		field: ObjectNode | FieldNode
		entity: Model.Entity

		addColumn: (queryCallback: (qb: QueryBuilder) => void, path?: Path) => void
		addData: (parentField: string, cb: DataCallback, defaultValue?: SelectHydrator.NestedDefaultValue) => void;
	}
}

export default SelectExecutionHandler


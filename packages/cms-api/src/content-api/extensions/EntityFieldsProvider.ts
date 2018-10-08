import { GraphQLFieldConfig } from "graphql";
import { Model } from 'cms-common'


interface EntityFieldsProvider<MetaArgs extends object = {}> {
	getFields(entity: Model.Entity, accessibleFields: string[]): EntityFieldsProvider.FieldMap<MetaArgs>;
}

namespace EntityFieldsProvider {
	export type FieldMap<MetaArgs extends object> = {
		[fieldName: string]: GraphQLFieldConfig<any, any> & {
			meta: MetaArgs
		}
	}
}
export default EntityFieldsProvider

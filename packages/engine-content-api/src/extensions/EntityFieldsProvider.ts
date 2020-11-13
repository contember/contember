import { GraphQLFieldConfig } from 'graphql'
import { Model } from '@contember/schema'

interface EntityFieldsProvider<ExtensionArg extends object = {}> {
	getFields(entity: Model.Entity, accessibleFields: string[]): EntityFieldsProvider.FieldMap<ExtensionArg>
}

namespace EntityFieldsProvider {
	export type FieldMap<ExtensionArg extends object> = {
		[fieldName: string]: GraphQLFieldConfig<any, any> & {
			extensions: ExtensionArg
		}
	}
}
export default EntityFieldsProvider

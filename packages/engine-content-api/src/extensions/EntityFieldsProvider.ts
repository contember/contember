import { GraphQLFieldConfig } from 'graphql'
import { Model } from '@contember/schema'

export interface EntityFieldsProvider<ExtensionArg extends object = {}> {
	getFields(entity: Model.Entity, accessibleFields: string[]): FieldMap<ExtensionArg>
}

export type FieldMap<ExtensionArg extends object> = {
	[fieldName: string]: GraphQLFieldConfig<any, any> & {
		extensions: ExtensionArg
	}
}

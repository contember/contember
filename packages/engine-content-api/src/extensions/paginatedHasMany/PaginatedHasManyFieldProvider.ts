import { EntityFieldsProvider, FieldMap } from '../EntityFieldsProvider'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import { PaginatedHasManyFieldProviderVisitor } from './PaginatedHasManyFieldProviderVisitor'

export class PaginatedHasManyFieldProvider implements EntityFieldsProvider<PaginatedHasManyFieldProviderExtension> {
	static extensionName: string = 'PaginatedHasMany'

	constructor(private readonly schema: Model.Schema, private readonly visitor: PaginatedHasManyFieldProviderVisitor) {}

	getFields(entity: Model.Entity, accessibleFields: Model.AnyField[]): FieldMap<PaginatedHasManyFieldProviderExtension> {
		const fields: FieldMap<PaginatedHasManyFieldProviderExtension> = {}
		for (const field of accessibleFields) {
			for (const [name, fieldConfig] of acceptFieldVisitor(this.schema, entity, field, this.visitor)) {
				fields[name] = fieldConfig
			}
		}
		return fields
	}
}

export interface PaginatedHasManyFieldProviderExtension {
	relationName: string
}

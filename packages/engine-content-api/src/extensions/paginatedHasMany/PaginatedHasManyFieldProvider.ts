import { EntityFieldsProvider, FieldMap } from '../EntityFieldsProvider.js'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import { PaginatedHasManyFieldProviderVisitor } from './PaginatedHasManyFieldProviderVisitor.js'

export class PaginatedHasManyFieldProvider implements EntityFieldsProvider<PaginatedHasManyFieldProviderExtension> {
	static extensionName: string = 'PaginatedHasMany'

	constructor(private readonly schema: Model.Schema, private readonly visitor: PaginatedHasManyFieldProviderVisitor) {}

	getFields(entity: Model.Entity, fields: string[]): FieldMap<PaginatedHasManyFieldProviderExtension> {
		return fields.reduce(
			(result, field) => ({ ...result, ...acceptFieldVisitor(this.schema, entity, field, this.visitor) }),
			{},
		)
	}
}

export interface PaginatedHasManyFieldProviderExtension {
	relationName: string
}

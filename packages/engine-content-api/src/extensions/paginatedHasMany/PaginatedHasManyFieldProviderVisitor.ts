import { Model } from '@contember/schema'
import { FieldMap } from '../EntityFieldsProvider'
import { PaginatedHasManyFieldProviderExtension } from './PaginatedHasManyFieldProvider'
import { capitalizeFirstLetter } from '../../utils'
import { PaginatedFieldConfigFactory } from '../../schema/PaginatedFieldConfigFactory'
import { aliasAwareResolver } from '../../schema'

export class PaginatedHasManyFieldProviderVisitor implements
	Model.ColumnVisitor<FieldMap<PaginatedHasManyFieldProviderExtension>>,
	Model.RelationByTypeVisitor<FieldMap<PaginatedHasManyFieldProviderExtension>> {

	constructor(private readonly paginatedFieldFactory: PaginatedFieldConfigFactory) {}

	visitOneHasMany({ targetEntity, relation }: Model.OneHasManyContext) {
		return this.createField(targetEntity, relation)
	}

	visitManyHasManyOwning({ targetEntity, relation }: Model.ManyHasManyOwningContext) {
		return this.createField(targetEntity, relation)
	}

	visitManyHasManyInverse({ targetEntity, relation }: Model.ManyHasManyInverseContext) {
		return this.createField(targetEntity, relation)
	}

	private createField(entity: Model.Entity, relation: Model.Relation): FieldMap<PaginatedHasManyFieldProviderExtension> {
		return {
			[`paginate${capitalizeFirstLetter(relation.name)}`]: {
				...this.paginatedFieldFactory.createFieldConfig(entity),
				extensions: {
					relationName: relation.name,
				},
				resolve: aliasAwareResolver,
			},
		}
	}

	visitColumn() {
		return {}
	}

	visitManyHasOne() {
		return {}
	}

	visitOneHasOneInverse() {
		return {}
	}

	visitOneHasOneOwning() {
		return {}
	}
}

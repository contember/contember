import { Model } from '@contember/schema'
import { FieldMap } from '../EntityFieldsProvider.js'
import { PaginatedHasManyFieldProviderExtension } from './PaginatedHasManyFieldProvider.js'
import { capitalizeFirstLetter } from '../../utils/index.js'
import { PaginatedFieldConfigFactory } from '../../schema/PaginatedFieldConfigFactory.js'
import { aliasAwareResolver } from '../../schema/index.js'

export class PaginatedHasManyFieldProviderVisitor implements
	Model.ColumnVisitor<FieldMap<PaginatedHasManyFieldProviderExtension>>,
	Model.RelationByTypeVisitor<FieldMap<PaginatedHasManyFieldProviderExtension>> {

	constructor(private readonly paginatedFieldFactory: PaginatedFieldConfigFactory) {}

	visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation,
	): FieldMap<PaginatedHasManyFieldProviderExtension> {
		return this.createField(targetEntity, relation)
	}

	visitManyHasManyOwning(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyInverseRelation | null,
	): FieldMap<PaginatedHasManyFieldProviderExtension> {
		return this.createField(targetEntity, relation)
	}

	visitManyHasManyInverse(
		entity: Model.Entity,
		relation: Model.ManyHasManyInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwningRelation,
	): FieldMap<PaginatedHasManyFieldProviderExtension> {
		return this.createField(targetEntity, relation)
	}

	private createField(
		entity: Model.Entity,
		relation: Model.Relation,
	): FieldMap<PaginatedHasManyFieldProviderExtension> {
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

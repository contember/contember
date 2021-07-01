import { Model } from '@contember/schema'
import { FieldMap } from '../EntityFieldsProvider'
import { PaginatedHasManyFieldProviderExtension } from './PaginatedHasManyFieldProvider'
import { capitalizeFirstLetter } from '../../utils'
import { PaginatedFieldConfigFactory } from '../../schema/PaginatedFieldConfigFactory'

export class PaginatedHasManyFieldProviderVisitor
	implements
		Model.ColumnVisitor<FieldMap<PaginatedHasManyFieldProviderExtension>>,
		Model.RelationByTypeVisitor<FieldMap<PaginatedHasManyFieldProviderExtension>>
{
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

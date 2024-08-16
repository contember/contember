import { Model } from '@contember/schema'
import { PaginatedHasManyFieldProvider, PaginatedHasManyFieldProviderExtension } from './PaginatedHasManyFieldProvider'
import { capitalizeFirstLetter } from '../../utils'
import { PaginatedFieldConfigFactory } from '../../schema/PaginatedFieldConfigFactory'
import { aliasAwareResolver } from '../../schema'
import { GraphQLFieldConfig } from 'graphql'

type Result = [
	string,
	GraphQLFieldConfig<any, any> & {
		extensions: PaginatedHasManyFieldProviderExtension
	}
]

export class PaginatedHasManyFieldProviderVisitor implements
	Model.ColumnVisitor<Result[]>,
	Model.RelationByTypeVisitor<Result[]> {

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

	private createField(entity: Model.Entity, relation: Model.Relation): Result[] {
		return [
			[
				`paginate${capitalizeFirstLetter(relation.name)}`,
				{
					...this.paginatedFieldFactory.createFieldConfig(entity),
					description: relation.description,
					extensions: {
						relationName: relation.name,
						extensionKey: PaginatedHasManyFieldProvider.extensionName,
					},
					resolve: aliasAwareResolver,
				},
			],
		]
	}

	visitColumn() {
		return []
	}

	visitManyHasOne() {
		return []
	}

	visitOneHasOneInverse() {
		return []
	}

	visitOneHasOneOwning() {
		return []
	}
}

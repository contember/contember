import { Model } from '@contember/schema'
import { PaginatedHasManyFieldProvider, PaginatedHasManyFieldProviderExtension } from './PaginatedHasManyFieldProvider'
import { capitalizeFirstLetter, isIt } from '../../utils'
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

	public visitOneHasMany({ targetEntity, relation }: Model.OneHasManyContext) {
		return this.createField(targetEntity, relation)
	}

	public visitManyHasManyOwning({ targetEntity, relation }: Model.ManyHasManyOwningContext) {
		return this.createField(targetEntity, relation)
	}

	public visitManyHasManyInverse({ targetEntity, relation }: Model.ManyHasManyInverseContext) {
		return this.createField(targetEntity, relation)
	}

	private createField(entity: Model.Entity, relation: Model.Relation): Result[] {
		return [
			[
				`paginate${capitalizeFirstLetter(relation.name)}`,
				{
					...this.paginatedFieldFactory.createFieldConfig(entity),
					...(isIt<Model.DeprecatedRelation>(relation, 'deprecationReason') ? { deprecationReason: relation.deprecationReason } : {}),
					extensions: {
						relationName: relation.name,
						extensionKey: PaginatedHasManyFieldProvider.extensionName,
					},
					resolve: aliasAwareResolver,
				},
			],
		]
	}

	public visitColumn() {
		return []
	}

	public visitManyHasOne() {
		return []
	}

	public visitOneHasOneInverse() {
		return []
	}

	public visitOneHasOneOwning() {
		return []
	}
}

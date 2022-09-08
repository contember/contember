import { Input, Model } from '@contember/schema'
import { isIt } from '../../utils'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { SelectExecutionHandler, SelectExecutionHandlerContext } from '../../mapper'
import { ImplementationException } from '../../exception'
import { UniqueWhereExpander } from '../../inputProcessing'
import { HasManyToHasOneReducerExtension } from './HasManyToHasOneReducer'

export class HasManyToHasOneReducerExecutionHandler implements SelectExecutionHandler<Input.UniqueQueryInput, HasManyToHasOneReducerExtension> {

	constructor(private readonly schema: Model.Schema, private readonly uniqueWhereExpander: UniqueWhereExpander) {}

	process(context: SelectExecutionHandlerContext<Input.UniqueQueryInput, HasManyToHasOneReducerExtension>): void {
		const { addData, entity, objectNode } = context
		if (!objectNode) {
			throw new Error()
		}
		addData(
			entity.primary,
			async (ids: Input.PrimaryValue[]) => {
				const [targetEntity, targetRelation] = this.getRelationTarget(entity, objectNode.extensions.relationName)
				const uniqueWhere = this.uniqueWhereExpander.expand(targetEntity, {
					...objectNode.args.by,
					[targetRelation.name]: { [entity.primary]: ids },
				})
				if (Object.keys(uniqueWhere).length !== 2) {
					throw new Error('HasManyToHasOneReducerExecutionHandler: only tuple unique keys are allowed')
				}
				const whereWithParentId = {
					and: [objectNode.args.filter || {}, uniqueWhere],
				}
				const newObjectNode = objectNode.withArgs<Input.ListQueryInput>({ filter: whereWithParentId })

				return context.mapper.selectAssoc(targetEntity, newObjectNode, targetRelation, targetRelation.name)
			},
			null,
		)
	}

	private getRelationTarget(
		entity: Model.Entity,
		relationName: string,
	): [Model.Entity, Model.AnyRelation & Model.JoiningColumnRelation] {
		return acceptFieldVisitor(this.schema, entity, relationName, {
			visitColumn: (): never => {
				throw new ImplementationException('HasManyToHasOneReducerExecutionHandler: Not applicable for a column')
			},
			visitRelation: ({ entity, relation, targetEntity, targetRelation }) => {
				if (!targetRelation || !isIt<Model.JoiningColumnRelation>(targetRelation, 'joiningColumn')) {
					throw new Error('HasManyToHasOneReducerExecutionHandler: only applicable for relations with joiningColumn')
				}
				return [targetEntity, targetRelation]
			},
		})
	}
}

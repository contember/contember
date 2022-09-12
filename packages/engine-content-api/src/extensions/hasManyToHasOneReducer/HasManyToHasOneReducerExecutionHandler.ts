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

				const relationContext = acceptFieldVisitor(this.schema, entity, objectNode.extensions.relationName, {
					visitRelation: context => context,
					visitColumn: (): never => {
						throw new ImplementationException('HasManyToHasOneReducerExecutionHandler: Not applicable for a column')
					},
				})

				const { targetEntity, targetRelation } = relationContext
				if (!targetRelation || !isIt<Model.JoiningColumnRelation>(targetRelation, 'joiningColumn')) {
					throw new Error('HasManyToHasOneReducerExecutionHandler: only applicable for relations with joiningColumn')
				}

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

				return context.mapper.selectAssoc(targetEntity, newObjectNode, [
					...context.relationPath,
					relationContext,
				], targetRelation.name)
			},
			null,
		)
	}
}

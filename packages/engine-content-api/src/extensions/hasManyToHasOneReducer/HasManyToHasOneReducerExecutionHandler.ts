import { Input, Model } from '@contember/schema'
import { Accessor, isIt } from '../../utils'
import { acceptFieldVisitor } from '@contember/schema-utils'
import SelectExecutionHandler from '../../sql/select/SelectExecutionHandler'
import Mapper from '../../sql/Mapper'
import ObjectNode from '../../graphQlResolver/ObjectNode'
import UniqueWhereExpander from '../../graphQlResolver/UniqueWhereExpander'

class HasManyToHasOneReducerExecutionHandler implements SelectExecutionHandler<{}> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly mapperAccessor: Accessor<Mapper>,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
	) {}

	process(context: SelectExecutionHandler.Context): void {
		const { addData, entity, field } = context
		const objectNode = field as ObjectNode

		addData(
			entity.primary,
			async (ids: Input.PrimaryValue[]) => {
				const [targetEntity, targetRelation] = this.getRelationTarget(entity, objectNode.meta.relationName)

				const uniqueWhere = this.uniqueWhereExpander.expand(targetEntity, {
					...objectNode.args.by,
					[targetRelation.name]: { [entity.primary]: ids },
				})
				if (Object.keys(uniqueWhere).length !== 2) {
					throw new Error()
				}
				const whereWithParentId = {
					and: [objectNode.args.filter || {}, uniqueWhere],
				}
				const newObjectNode = objectNode.withArgs<Input.ListQueryInput>({ filter: whereWithParentId })

				return this.mapperAccessor.get().select(targetEntity, newObjectNode, targetRelation.name)
			},
			null,
		)
	}

	private getRelationTarget(
		entity: Model.Entity,
		relationName: string,
	): [Model.Entity, Model.Relation & Model.JoiningColumnRelation] {
		return acceptFieldVisitor(this.schema, entity, relationName, {
			visitColumn: (): never => {
				throw new Error()
			},
			visitRelation: (
				entity,
				relation,
				targetEntity,
				targetRelation,
			): [Model.Entity, Model.Relation & Model.JoiningColumnRelation] => {
				if (!targetRelation || !isIt<Model.JoiningColumnRelation>(targetRelation, 'joiningColumn')) {
					throw new Error()
				}
				return [targetEntity, targetRelation]
			},
		})
	}
}

export default HasManyToHasOneReducerExecutionHandler

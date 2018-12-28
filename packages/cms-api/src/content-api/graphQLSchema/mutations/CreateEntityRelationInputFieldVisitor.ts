import { GraphQLInputObjectType } from 'graphql'
import { Input, Model } from 'cms-common'
import { GqlTypeName } from '../utils'
import WhereTypeProvider from '../WhereTypeProvider'
import { Accessor } from '../../../utils/accessor'
import EntityInputProvider from './EntityInputProvider'
import { GraphQLInputFieldConfigMap } from 'graphql/type/definition'
import CreateEntityRelationAllowedOperationsVisitor from './CreateEntityRelationAllowedOperationsVisitor'
import { acceptFieldVisitor } from '../../../content-schema/modelUtils'

export default class CreateEntityRelationInputFieldVisitor
	implements Model.ColumnVisitor<never>, Model.RelationVisitor<GraphQLInputObjectType | undefined> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereTypeBuilder: WhereTypeProvider,
		private readonly createEntityInputProviderAccessor: Accessor<EntityInputProvider<EntityInputProvider.Type.create>>,
		private readonly createEntityRelationAllowedOperationsVisitor: CreateEntityRelationAllowedOperationsVisitor
	) {}

	public visitColumn(): never {
		throw new Error()
	}

	public visitRelation(
		entity: Model.Entity,
		relation: Model.Relation,
		targetEntity: Model.Entity,
		targetRelation: Model.Relation
	): GraphQLInputObjectType | undefined {
		const targetName = targetRelation ? targetRelation.name : undefined
		const fields: GraphQLInputFieldConfigMap = {}
		const allowedOperations = acceptFieldVisitor(
			this.schema,
			entity,
			relation.name,
			this.createEntityRelationAllowedOperationsVisitor
		)

		if (allowedOperations.includes(Input.CreateRelationOperation.connect)) {
			fields[Input.CreateRelationOperation.connect] = {
				type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name),
			}
		}

		const createInput = this.createEntityInputProviderAccessor.get().getInput(targetEntity.name, targetName)
		if (allowedOperations.includes(Input.CreateRelationOperation.create) && createInput !== undefined) {
			fields[Input.CreateRelationOperation.create] = {
				type: createInput,
			}
		}
		if (Object.keys(fields).length === 0) {
			return undefined
		}
		return new GraphQLInputObjectType({
			name: GqlTypeName`${entity.name}Create${relation.name}EntityRelationInput`,
			fields: () => fields,
		})
	}
}

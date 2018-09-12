import { GraphQLInputObjectType } from 'graphql'
import { Acl, Model } from 'cms-common'
import { GqlTypeName } from '../utils'
import WhereTypeProvider from '../WhereTypeProvider'
import Authorizator from '../../../acl/Authorizator'
import { Accessor } from '../../../utils/accessor'
import EntityInputProvider from './EntityInputProvider'
import { GraphQLInputFieldConfigMap } from 'graphql/type/definition'

export default class CreateEntityRelationInputFieldVisitor
	implements Model.ColumnVisitor<GraphQLInputObjectType>, Model.RelationVisitor<GraphQLInputObjectType> {
	constructor(
		private authorizator: Authorizator,
		private whereTypeBuilder: WhereTypeProvider,
		private createEntityInputProviderAccessor: Accessor<EntityInputProvider<Acl.Operation.create>>
	) {}

	public visitColumn(): GraphQLInputObjectType {
		throw new Error()
	}

	public visitRelation(
		entity: Model.Entity,
		relation: Model.Relation,
		targetEntity: Model.Entity,
		targetRelation: Model.Relation
	): GraphQLInputObjectType {
		return new GraphQLInputObjectType({
			name: GqlTypeName`${entity.name}Create${relation.name}EntityRelationInput`,
			fields: () => {
				const targetName = targetRelation ? targetRelation.name : undefined
				const fields: GraphQLInputFieldConfigMap = {}

				//todo this is not so easy, connect may require update of one of sides
				if (this.authorizator.isAllowed(Acl.Operation.read, targetEntity.name)) {
					fields['connect'] = {
						type: this.whereTypeBuilder.getEntityUniqueWhereType(targetEntity.name)
					}
				}

				if (this.authorizator.isAllowed(Acl.Operation.create, targetEntity.name)) {
					fields['create'] = {
						type: this.createEntityInputProviderAccessor.get().getInput(targetEntity.name, targetName)
					}
				}
				return fields
			}
		})
	}
}

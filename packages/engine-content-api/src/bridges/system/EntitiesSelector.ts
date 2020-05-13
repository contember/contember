import { Client } from '@contember/database'
import { Acl, Model, Schema } from '@contember/schema'
import Mapper from '../../sql/Mapper'
import { acceptFieldVisitor, getEntity } from '@contember/schema-utils'
import { FieldNode, ObjectNode } from '../../inputProcessing'
import PermissionsByIdentityFactory from '../../acl/PermissionsByIdentityFactory'

export type EntitiesRelationsInput = readonly {
	name: string
	relations: EntitiesRelationsInput
}[]

export interface EntitiesSelectorContext {
	db: Client
	schema: Schema
	identityVariables: Acl.VariablesMap
	projectRoles: string[]
}

export interface EntitiesSelectorInput {
	entity: string
	id: string
	relations: EntitiesRelationsInput
}

export class EntitiesSelector {
	constructor(
		private readonly mapperFactory: EntitiesSelectorMapperFactory,
		private readonly permissionsByIdentityFactory: PermissionsByIdentityFactory,
	) {}

	async getEntities(context: EntitiesSelectorContext, input: EntitiesSelectorInput): Promise<EntitiesResult | null> {
		const { permissions } = this.permissionsByIdentityFactory.createPermissions(context.schema, {
			projectRoles: context.projectRoles,
		})
		const mapper = this.mapperFactory(context.db, context.schema, context.identityVariables, permissions)
		const entity = getEntity(context.schema.model, input.entity)
		const node = this.createObjectNode(context.schema, entity, input.relations).withArg('by', {
			[entity.primary]: input.id,
		})

		const result = await mapper.selectUnique(entity, node)
		return (result as unknown) as EntitiesResult | null
	}

	private createObjectNode(schema: Schema, entity: Model.Entity, relations: EntitiesRelationsInput): ObjectNode {
		return this.createRelations(schema, entity, new ObjectNode(entity.name, entity.name, [], {}, {}, []), relations)
	}

	private createRelations(
		schema: Schema,
		entity: Model.Entity,
		node: ObjectNode,
		relations: EntitiesRelationsInput,
	): ObjectNode {
		return relations.reduce((node, relation) => {
			const fieldName = relation.name
			const newField = acceptFieldVisitor<ObjectNode>(schema.model, entity, fieldName, {
				visitColumn: () => {
					throw new Error(`${fieldName} is not a relation`)
				},
				visitRelation: ({}, {}, targetEntity) =>
					this.createRelations(
						schema,
						targetEntity,
						new ObjectNode(fieldName, fieldName, [], {}, {}, []),
						relation.relations,
					),
			})
			return node.withField(newField)
		}, node.withField(new FieldNode(entity.primary, 'id', {})))
	}
}

interface EntitiesResultRelations {
	[relation: string]: EntitiesResult | EntitiesResult[] | null
}

export type EntitiesResult = {
	id: string
} & EntitiesResultRelations

export type EntitiesSelectorMapperFactory = (
	db: Client,
	schema: Schema,
	identityVariables: Acl.VariablesMap,
	permissions: Acl.Permissions,
) => Mapper

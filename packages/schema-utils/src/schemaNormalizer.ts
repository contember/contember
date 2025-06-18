import { Acl, Model, ProjectRole, Schema } from '@contember/schema'
import { AllowAllPermissionFactory } from './acl'
import { AliasPermissionFactory } from './acl/AliasPermissionFactory'
import { EntityAliasFactory } from './acl/EntityAliasFactory'

export const normalizeSchema = <S extends Schema>(schema: S): S => {
	const adminRoleDefinition: Partial<Acl.RolePermissions> = schema.acl.roles?.[ProjectRole.ADMIN] ?? {}
	const contentAdminRoleDefinition: Partial<Acl.RolePermissions> = schema.acl.roles?.[ProjectRole.CONTENT_ADMIN] ?? {}
	const { entities: _, ...adminRoleDefinitionWithoutEntities } = adminRoleDefinition
	const { entities: __, ...contentAdminRoleDefinitionWithoutEntities } = contentAdminRoleDefinition
	const processedEntities = Object.entries(schema.model.entities).reduce((acc, [entityName, entity]) => {
		acc[entityName] = {
			...entity,
			fields: new EntityAliasFactory(entity).create(),
		}
		return acc
	}, {} as Record<string, Model.Entity>)

	const processedModel = {
		...schema.model,
		entities: processedEntities,
	}

	const processedAcl = Object.entries(schema.acl.roles || {}).reduce((acc, [roleName, rolePermissions]) => {
		const newEntities = { ...rolePermissions.entities }

		Object.entries(rolePermissions.entities || {}).forEach(([entityName, entityPermissions]) => {
			const entity = processedModel.entities[entityName]
			if (!entity) return
			newEntities[entityName] = new AliasPermissionFactory(entity).create(entityPermissions)
		})

		acc[roleName] = {
			...rolePermissions,
			entities: newEntities,
		}
		return acc
	}, {} as Record<string, Acl.RolePermissions>)

	return {
		...schema,
		model: processedModel,
		acl: {
			...schema.acl,
			roles: {
				...processedAcl,
				[ProjectRole.ADMIN]: {
					stages: '*',
					variables: {},
					entities: adminRoleDefinition.entities
						? processedAcl[ProjectRole.ADMIN]!.entities
						: new AllowAllPermissionFactory().create(processedModel),
					s3: {
						'**': {
							upload: true,
							read: true,
						},
					},
					content: {
						export: true,
						import: true,
						refreshMaterializedView: true,
						...adminRoleDefinition.content,
					},
					system: {
						export: true,
						import: true,
						...adminRoleDefinition.system,
					},
					debug: true,
					...adminRoleDefinitionWithoutEntities,
				},
				[ProjectRole.CONTENT_ADMIN]: {
					stages: '*',
					variables: {},
					entities: contentAdminRoleDefinition.entities
						? processedAcl[ProjectRole.CONTENT_ADMIN]!.entities
						: new AllowAllPermissionFactory().create(processedModel),
					s3: {
						'**': {
							upload: true,
							read: true,
						},
					},
					content: {
						export: true,
						import: true,
						refreshMaterializedView: true,
						...contentAdminRoleDefinition.content,
					},
					system: {
						history: true,
						export: true,
						import: true,
						...contentAdminRoleDefinition.system,
					},
					...contentAdminRoleDefinitionWithoutEntities,
				},
				[ProjectRole.DEPLOYER]: {
					stages: '*',
					entities: {},
					variables: {},
				},
			},
		},
	}
}

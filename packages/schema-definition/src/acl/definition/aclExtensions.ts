import { Acl, Model } from '@contember/schema'
import { createMetadataStore, DecoratorFunction, EntityConstructor } from '../../utils'
import { Role } from './roles'

export type EntityAclExtensionArgs =
	& {
		entity: Model.Entity
		role: Role
		permissions: Acl.EntityPermissions
	}

const entityAclExtensionsStore = createMetadataStore<EntityAclExtension[]>([])

export type EntityAclExtension = (args: EntityAclExtensionArgs) => Acl.EntityPermissions
export const extendEntityAcl = <T>(extension: EntityAclExtension): DecoratorFunction<T> => {
	return function (cls: EntityConstructor) {
		entityAclExtensionsStore.update(cls, current => [...current, extension])
	}
}

export const applyEntityAclExtensions = (
	cls: EntityConstructor,
	args: EntityAclExtensionArgs,
): Acl.EntityPermissions =>
	entityAclExtensionsStore.get(cls).reduce(
		(permissions, ext) => ext({ ...args, permissions }),
		args.permissions,
	)

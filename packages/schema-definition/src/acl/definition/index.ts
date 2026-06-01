import { Acl, Model } from '@contember/schema'
import { AclFactory } from './internal/AclFactory.js'

export * from './customPrimary.js'
export * from './permissions.js'
export * from './references.js'
export * from './roles.js'
export * from './variables.js'

export const createAcl = (
	exportedDefinitions: Record<string, any>,
	model: Model.Schema,
): Acl.Schema => {
	const aclFactory = new AclFactory(model)
	return aclFactory.create(exportedDefinitions)
}

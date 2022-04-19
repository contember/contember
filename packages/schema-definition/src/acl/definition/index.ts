import { Acl, Model } from '@contember/schema'
import { AclFactory } from './internal/AclFactory'

export * from './customPrimary'
export * from './permissions'
export * from './references'
export * from './roles'
export * from './variables'

export const createAcl = (
	exportedDefinitions: Record<string, any>,
	model: Model.Schema,
): Acl.Schema => {
	const aclFactory = new AclFactory(model)
	return aclFactory.create(exportedDefinitions)
}






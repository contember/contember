import { Role } from './roles.js'
import { DecoratorFunction } from '../../utils/index.js'
import { extendEntityAcl } from './aclExtensions.js'

export const allowCustomPrimary = (role?: Role | Role[]): DecoratorFunction<any> => {
	return extendEntityAcl(({ permissions, role: currentRole }) => {
		if (!role || role === currentRole || (Array.isArray(role) && role.includes(currentRole))) {
			return { ...permissions, operations: { ...permissions.operations, customPrimary: true } }
		}
		return permissions
	})
}

import { Role } from './roles'
import { DecoratorFunction } from '../../utils'
import { extendEntityAcl } from './aclExtensions'

export const allowCustomPrimary = (role?: Role | Role[]): DecoratorFunction<any> => {
	return extendEntityAcl(({ permissions, role: currentRole }) => {
		if (!role || role === currentRole || (Array.isArray(role) && role.includes(currentRole))) {
			return { ...permissions, operations: { customPrimary: true } }
		}
		return permissions
	})
}

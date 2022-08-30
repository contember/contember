import { Role } from './roles'
import { allowCustomPrimaryAllRolesStore, allowCustomPrimaryStore } from './internal/stores'
import { DecoratorFunction, EntityConstructor } from '../../utils'

export const allowCustomPrimary = (role?: Role | Role[]): DecoratorFunction<any> => {
	return (entity: EntityConstructor) => {
		if (!role) {
			allowCustomPrimaryAllRolesStore.update(entity, () => true)
		} else {
			allowCustomPrimaryStore.update(entity, val => [...val, ...(Array.isArray(role) ? role : [role])])
		}
	}
}

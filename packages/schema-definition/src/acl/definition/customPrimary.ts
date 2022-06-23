import { Role } from './roles.js'
import { allowCustomPrimaryAllRolesStore, allowCustomPrimaryStore } from './internal/stores.js'
import { DecoratorFunction, EntityConstructor } from '../../model/definition/types.js'

export const allowCustomPrimary = (role?: Role | Role[]): DecoratorFunction<any> => {
	return (entity: EntityConstructor) => {
		if (!role) {
			allowCustomPrimaryAllRolesStore.update(entity, () => true)
		} else {
			allowCustomPrimaryStore.update(entity, val => [...val, ...(Array.isArray(role) ? role : [role])])
		}
	}
}

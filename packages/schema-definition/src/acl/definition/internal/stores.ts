import { createMetadataStore } from './MetadataStore.js'
import { Role } from '../roles.js'
import { AllowDefinition } from '../permissions.js'

export const allowCustomPrimaryStore = createMetadataStore<Role[]>([])
export const allowCustomPrimaryAllRolesStore = createMetadataStore<boolean>(false)

export type EntityPermissionsDefinition =
	& AllowDefinition<any>
	& {
		role: Role<string>
	}
export const allowDefinitionsStore = createMetadataStore<EntityPermissionsDefinition[]>([])

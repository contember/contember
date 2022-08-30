import { createMetadataStore } from '../../../utils/MetadataStore'
import { Role } from '../roles'
import { AllowDefinition } from '../permissions'

export const allowCustomPrimaryStore = createMetadataStore<Role[]>([])
export const allowCustomPrimaryAllRolesStore = createMetadataStore<boolean>(false)

export type EntityPermissionsDefinition =
	& AllowDefinition<any>
	& {
		role: Role<string>
	}
export const allowDefinitionsStore = createMetadataStore<EntityPermissionsDefinition[]>([])

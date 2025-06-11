import { createMetadataStore } from '../../../utils/MetadataStore'
import { AllowDefinitionFactory } from '../permissions'
import { Role } from '../roles'

export type EntityPermissionsDefinition =
	& {
		factory: AllowDefinitionFactory<any>
		role: Role<string>
	}
export const allowDefinitionsStore = createMetadataStore<EntityPermissionsDefinition[]>([])

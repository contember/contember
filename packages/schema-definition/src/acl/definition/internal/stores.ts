import { createMetadataStore } from '../../../utils/MetadataStore.js'
import { AllowDefinitionFactory } from '../permissions.js'
import { Role } from '../roles.js'

export type EntityPermissionsDefinition = {
	factory: AllowDefinitionFactory<any>
	role: Role<string>
}
export const allowDefinitionsStore = createMetadataStore<EntityPermissionsDefinition[]>([])

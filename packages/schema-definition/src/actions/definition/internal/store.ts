import { createMetadataStore } from '../../../utils'
import { BasicTriggerDefinition, WatchTriggerDefinition } from '../triggers'

type StoredTrigger =
	| { type: 'basic'; definition: BasicTriggerDefinition }
	| { type: 'watch'; definition: WatchTriggerDefinition }

export const triggersStore = createMetadataStore<StoredTrigger[]>([])

import { createMetadataStore } from '../../../utils/index.js'
import { BasicTriggerDefinition, WatchTriggerDefinition } from '../triggers.js'

type StoredTrigger =
	| { type: 'basic'; definition: BasicTriggerDefinition }
	| { type: 'watch'; definition: WatchTriggerDefinition }

export const triggersStore = createMetadataStore<StoredTrigger[]>([])

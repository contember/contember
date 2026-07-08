import { createMetadataStore } from '../../../utils/index.js'
import { RetentionDefinition } from '../retention.js'

export const retentionStore = createMetadataStore<RetentionDefinition[]>([])

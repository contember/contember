import type { FieldName, PlaceholderName } from '../treeParameters/index.js'

export type EntityFieldPlaceholders = ReadonlyMap<FieldName, PlaceholderName | Set<PlaceholderName>>

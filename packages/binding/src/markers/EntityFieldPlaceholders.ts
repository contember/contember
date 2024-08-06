import type { FieldName, PlaceholderName } from '../treeParameters'

export type EntityFieldPlaceholders = ReadonlyMap<FieldName, PlaceholderName | Set<PlaceholderName>>

import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { EntityListAccessor } from './EntityListAccessor'

// This type alias is just to indicate what accessors can legally appear at the very top-level.
export type RootAccessor = (EntityAccessor | EntityForRemovalAccessor) | EntityListAccessor

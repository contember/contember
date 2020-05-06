import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'

export type GetEntityByKey = (key: string) => EntityAccessor | EntityForRemovalAccessor | undefined

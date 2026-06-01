import type { EntityAccessor } from './EntityAccessor.js'

export type GetEntityByKey = (key: string | (() => EntityAccessor)) => EntityAccessor

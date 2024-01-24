import { EntityListAccessor } from '@contember/binding'
import { createRequiredContext, createContext } from '@contember/react-utils'
import { EntityAccessor } from '@contember/react-binding'

import { RepeaterMethods } from '../types'

export const [RepeaterEntityListAccessorContext, useRepeaterEntityListAccessor] = createContext<EntityListAccessor | undefined>('RepeaterEntityListAccessorContext', undefined)
export const [RepeaterSortedEntitiesContext, useRepeaterSortedEntities] = createRequiredContext<EntityAccessor[]>('RepeaterSortedEntitiesContext')

export const [RepeaterMethodsContext, useRepeaterMethods] = createRequiredContext<RepeaterMethods>('RepeaterMethodsContext')

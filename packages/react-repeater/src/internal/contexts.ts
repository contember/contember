import { EntityListAccessor } from '@contember/binding'
import { createNonNullableContextFactory, createOptionalContextFactory } from '@contember/react-utils'
import { EntityAccessor } from '@contember/react-binding'

import { RepeaterMethods } from '../types'

export const [RepeaterEntityListAccessorContext, useRepeaterEntityListAccessor] = createOptionalContextFactory<EntityListAccessor | undefined>('RepeaterEntityListAccessorContext', undefined)
export const [RepeaterSortedEntitiesContext, useRepeaterSortedEntities] = createNonNullableContextFactory<EntityAccessor[]>('RepeaterSortedEntitiesContext')

export const [RepeaterMethodsContext, useRepeaterMethods] = createNonNullableContextFactory<RepeaterMethods>('RepeaterMethodsContext')

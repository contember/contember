import { EntityAccessor, EntityListAccessor } from '@contember/react-binding'
import { createRequiredContext } from '@contember/react-utils'

import { RepeaterMethods } from './types'

const RepeaterEntityListAccessorContext_ = createRequiredContext<EntityListAccessor>('RepeaterEntityListAccessorContext')
/** @internal */
export const RepeaterEntityListAccessorContext = RepeaterEntityListAccessorContext_[0]
/**
 * Returns the entity list accessor of the repeater.
 */
export const useRepeaterEntityListAccessor = RepeaterEntityListAccessorContext_[1]


const RepeaterSortedEntitiesContext_ = createRequiredContext<EntityAccessor[]>('RepeaterSortedEntitiesContext')
/** @internal */
export const RepeaterSortedEntitiesContext = RepeaterSortedEntitiesContext_[0]
/**
 * Returns the sorted entities of the repeater.
 */
export const useRepeaterSortedEntities = RepeaterSortedEntitiesContext_[1]

const RepeaterMethodsContext_ = createRequiredContext<RepeaterMethods>('RepeaterMethodsContext')
/** @internal */
export const RepeaterMethodsContext = RepeaterMethodsContext_[0]
/**
 * Returns the methods (moveItem, addItem, removeItem) for manipulating the repeater.
 * {@link RepeaterMethods}
 */
export const useRepeaterMethods = RepeaterMethodsContext_[1]

const RepeaterCurrentEntityContext_ = createRequiredContext<EntityAccessor>('RepeaterCurrentEntityContext')
/** @internal */
export const RepeaterCurrentEntityContext = RepeaterCurrentEntityContext_[0]
/**
 * Returns the current entity in the repeater from the context.
 */
export const useRepeaterCurrentEntity = RepeaterCurrentEntityContext_[1]

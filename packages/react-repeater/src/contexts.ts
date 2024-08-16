import { EntityListAccessor } from '@contember/binding'
import { createRequiredContext, createContext } from '@contember/react-utils'
import { EntityAccessor } from '@contember/react-binding'

import { RepeaterMethods } from './types'

const RepeaterEntityListAccessorContext_ = createRequiredContext<EntityListAccessor>('RepeaterEntityListAccessorContext')
/** @internal */
export const RepeaterEntityListAccessorContext = RepeaterEntityListAccessorContext_[0]
export const useRepeaterEntityListAccessor = RepeaterEntityListAccessorContext_[1]


const RepeaterSortedEntitiesContext_ = createRequiredContext<EntityAccessor[]>('RepeaterSortedEntitiesContext')
/** @internal */
export const RepeaterSortedEntitiesContext = RepeaterSortedEntitiesContext_[0]
export const useRepeaterSortedEntities = RepeaterSortedEntitiesContext_[1]

const RepeaterMethodsContext_ = createRequiredContext<RepeaterMethods>('RepeaterMethodsContext')
/** @internal */
export const RepeaterMethodsContext = RepeaterMethodsContext_[0]
export const useRepeaterMethods = RepeaterMethodsContext_[1]

const RepeaterCurrentEntityContext_ = createRequiredContext<EntityAccessor>('RepeaterCurrentEntityContext')
/** @internal */
export const RepeaterCurrentEntityContext = RepeaterCurrentEntityContext_[0]
export const useRepeaterCurrentEntity = RepeaterCurrentEntityContext_[1]

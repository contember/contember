import { createRequiredContext } from '@contember/react-utils'
import { EntityAccessor, SugaredQualifiedEntityList } from '@contember/react-binding'
import { DataViewFilterHandler, TextFilterArtifacts } from '@contember/react-dataview'

const _SelectCurrentEntitiesContext = createRequiredContext<EntityAccessor[]>('SelectCurrentEntitiesContext')
/** @internal */
export const SelectCurrentEntitiesContext = _SelectCurrentEntitiesContext[0]
export const useSelectCurrentEntities = _SelectCurrentEntitiesContext[1]



const _SelectIsSelectedContext = createRequiredContext<(entity: EntityAccessor) => boolean>('SelectIsSelectedContext')
/** @internal */
export const SelectIsSelectedContext = _SelectIsSelectedContext[0]
export const useSelectIsSelected = _SelectIsSelectedContext[1]

export type SelectHandler = (entity: EntityAccessor, action?: 'select' | 'unselect' | 'toggle') => void
const _SelectHandleSelectContext = createRequiredContext<SelectHandler>('SelectHandleSelectContext')
/** @internal */
export const SelectHandleSelectContext = _SelectHandleSelectContext[0]
export const useSelectHandleSelect = _SelectHandleSelectContext[1]

const _SelectOptionsContext = createRequiredContext<SugaredQualifiedEntityList['entities']>('SelectOptionsContext')
/** @internal */
export const SelectOptionsContext = _SelectOptionsContext[0]
export const useSelectOptions = _SelectOptionsContext[1]

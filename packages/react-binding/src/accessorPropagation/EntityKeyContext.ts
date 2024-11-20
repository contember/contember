import { EntityAccessor } from '@contember/binding'
import { createContext } from 'react'

export const EntityKeyContext = createContext<undefined | string | (() => EntityAccessor)>(undefined)
EntityKeyContext.displayName = 'EntityKeyContext'

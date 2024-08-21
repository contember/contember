import { EntityAccessor } from '@contember/binding-common'
import { createContext } from 'react'

export const EntityKeyContext = createContext<undefined | string | (() => EntityAccessor)>(undefined)
EntityKeyContext.displayName = 'EntityKeyContext'

import { createContext } from 'react'

export const EntityKeyContext = createContext<undefined | string>(undefined)
EntityKeyContext.displayName = 'EntityKeyContext'

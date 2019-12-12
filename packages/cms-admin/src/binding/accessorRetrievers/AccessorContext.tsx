import * as React from 'react'
import { EntityAccessor, EntityForRemovalAccessor } from '../accessors'

export const AccessorContext = React.createContext<undefined | EntityAccessor | EntityForRemovalAccessor>(undefined)

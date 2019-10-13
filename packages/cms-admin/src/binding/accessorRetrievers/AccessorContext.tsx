import * as React from 'react'
import { EntityAccessor, EntityForRemovalAccessor } from '../dao'

export const AccessorContext = React.createContext<undefined | EntityAccessor | EntityForRemovalAccessor>(undefined)

import * as React from 'react'
import { MetaOperationsAccessor } from '../dao'

export type MetaOperationsContextValue = MetaOperationsAccessor | undefined

const MetaOperationsContext = React.createContext<MetaOperationsContextValue>(undefined)

export { MetaOperationsContext }

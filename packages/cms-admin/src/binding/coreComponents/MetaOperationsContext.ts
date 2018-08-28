import * as React from 'react'
import MetaOperationsAccessor from '../dao/MetaOperationsAccessor'

export type MetaOperationsContextValue = MetaOperationsAccessor | undefined

const metaOperationsContext = React.createContext<MetaOperationsContextValue>(undefined)

export default metaOperationsContext

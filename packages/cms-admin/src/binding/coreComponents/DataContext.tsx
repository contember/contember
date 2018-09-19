import * as React from 'react'
import AccessorTreeRoot from '../dao/AccessorTreeRoot'
import EntityAccessor from '../dao/EntityAccessor'
import FieldAccessor from '../dao/FieldAccessor'

export type DataContextValue = undefined | FieldAccessor | EntityAccessor | AccessorTreeRoot

const dataContext = React.createContext<DataContextValue>(undefined)

export default dataContext

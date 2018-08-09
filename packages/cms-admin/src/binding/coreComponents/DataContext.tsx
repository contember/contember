import * as React from 'react'
import EntityAccessor from '../dao/EntityAccessor'
import FieldAccessor from '../dao/FieldAccessor'

export type DataContextValue = undefined | FieldAccessor | EntityAccessor

const dataContext = React.createContext<DataContextValue>(undefined)

export default dataContext

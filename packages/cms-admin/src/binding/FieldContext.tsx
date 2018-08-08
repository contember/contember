import * as React from 'react'
import { EntityContextValue } from './EntityContext'

export type FieldContextValue = boolean | EntityContextValue[] | EntityContextValue

const fieldContext = React.createContext<FieldContextValue>({})

export default fieldContext

import * as React from 'react'
import { EntityContextValue } from './EntityContext'
import FieldMarker from '../dao/FieldMarker'

export type FieldContextValue = undefined | FieldMarker | EntityContextValue

const fieldContext = React.createContext<FieldContextValue>(undefined)

export default fieldContext

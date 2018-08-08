import * as React from 'react'
import { FieldName } from './bindingTypes'
import { FieldContextValue } from './FieldContext'

export type EntityContextValue = {
	[name in FieldName]?: FieldContextValue
}

const entityContext = React.createContext<EntityContextValue>({})

export default entityContext

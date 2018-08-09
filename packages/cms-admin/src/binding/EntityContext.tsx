import * as React from 'react'
import EntityMarker from './EntityMarker'
import RootEntityMarker from './RootEntityMarker'

export type EntityContextValue = RootEntityMarker | EntityMarker

const entityContext = React.createContext<EntityContextValue>(new RootEntityMarker())

export default entityContext

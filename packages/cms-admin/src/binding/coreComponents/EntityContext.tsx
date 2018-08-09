import * as React from 'react'
import EntityMarker from '../dao/EntityMarker'
import RootEntityMarker from '../dao/RootEntityMarker'

export type EntityContextValue = RootEntityMarker | EntityMarker

const entityContext = React.createContext<EntityContextValue>(new RootEntityMarker())

export default entityContext

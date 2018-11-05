import * as React from 'react'
import { Environment } from '../dao'

const EnvironmentContext = React.createContext<Environment>(new Environment())

export { EnvironmentContext }

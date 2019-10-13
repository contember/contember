import * as React from 'react'
import { Environment } from '../dao'

export const EnvironmentContext = React.createContext<Environment>(new Environment())

import { createContext } from 'react'
import { Environment } from '../dao'

export const EnvironmentContext = createContext<Environment>(Environment.create())

import { useContext } from 'react'
import type { Environment } from '../dao'
import { EnvironmentContext } from './EnvironmentContext'

export const useEnvironment = (): Environment => {
	return useContext(EnvironmentContext)
}

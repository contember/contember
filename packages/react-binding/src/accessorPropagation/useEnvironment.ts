import { useContext } from 'react'
import type { Environment } from '@contember/binding'
import { EnvironmentContext } from './EnvironmentContext.js'

export const useEnvironment = (): Environment => {
	return useContext(EnvironmentContext)
}

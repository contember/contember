import { useContext } from 'react'
import type { Environment } from '@contember/binding'
import { EnvironmentContext } from './EnvironmentContext'

export const useEnvironment = (): Environment => {
	return useContext(EnvironmentContext)
}

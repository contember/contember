import { useContext } from 'react'
import { EnvironmentContext } from './EnvironmentContext'

export const useEnvironment = () => {
	return useContext(EnvironmentContext)
}

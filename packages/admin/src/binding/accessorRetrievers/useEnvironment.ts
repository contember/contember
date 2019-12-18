import * as React from 'react'
import { EnvironmentContext } from './EnvironmentContext'

export const useEnvironment = () => {
	return React.useContext(EnvironmentContext)
}

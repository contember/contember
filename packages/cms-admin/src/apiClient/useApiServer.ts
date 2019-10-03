import * as React from 'react'
import { ConfigContext } from '../config'

export const useApiServer = () => {
	const config = React.useContext(ConfigContext)
	return config !== undefined ? config.apiServer : undefined
}

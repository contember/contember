import * as React from 'react'
import { ApiClientError } from '../ApiClientError'
import { ClientConfigContext } from './ClientConfigContext'

export const useClientConfig = () => {
	const clientConfig = React.useContext(ClientConfigContext)

	if (clientConfig === undefined) {
		throw new ApiClientError(`Undefined client config. Perhaps you forgot to use ClientConfigContext?`)
	}
	return clientConfig
}

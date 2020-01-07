import * as React from 'react'
import { ClientError } from '../ClientError'
import { ClientConfigContext } from './ClientConfigContext'

export const useClientConfig = () => {
	const clientConfig = React.useContext(ClientConfigContext)

	if (clientConfig === undefined) {
		throw new ClientError(`Undefined client config. Perhaps you forgot to use ClientConfigContext?`)
	}
	return clientConfig
}

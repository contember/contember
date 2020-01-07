import { useClientConfig } from './config'

export const useApiServer = () => {
	const config = useClientConfig()
	return config !== undefined ? config.apiBaseUrl : undefined
}

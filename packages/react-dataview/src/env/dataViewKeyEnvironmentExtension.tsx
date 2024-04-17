import { BindingError, Environment } from '@contember/react-binding'

export const dataViewKeyEnvironmentExtension = Environment.createExtension((key: string | undefined) => {
	return key
})

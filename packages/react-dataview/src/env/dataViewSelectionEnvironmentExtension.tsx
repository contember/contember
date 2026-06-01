import { BindingError, Environment } from '@contember/react-binding'
import { DataViewSelectionValues } from '../types/index.js'

export const dataViewSelectionEnvironmentExtension = Environment.createExtension((state: DataViewSelectionValues | undefined) => {
	if (state === undefined) {
		throw new BindingError('Environment does not contain data view selection state.')
	}
	return state
})

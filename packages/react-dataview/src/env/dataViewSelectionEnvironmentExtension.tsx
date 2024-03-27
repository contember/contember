import { BindingError, Environment } from '@contember/react-binding'
import { DataViewSelectionState } from '../types'

export const dataViewSelectionEnvironmentExtension = Environment.createExtension((state: DataViewSelectionState | undefined) => {
	if (state === undefined) {
		throw new BindingError('Environment does not contain data view selection state.')
	}
	return state
})

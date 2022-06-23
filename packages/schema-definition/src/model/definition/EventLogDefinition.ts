import { extendEntity } from './extensions.js'

export const DisableEventLog = () =>
	extendEntity(({ entity }) => ({
		...entity,
		eventLog: { enabled: false },
	}))

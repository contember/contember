import { extendEntity } from './extensions'

export const DisableEventLog = () =>
	extendEntity(({ entity }) => ({
		...entity,
		eventLog: { enabled: false },
	}))

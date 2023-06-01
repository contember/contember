import { extendEntity } from './extensions'

export const disableEventLog = () =>
	extendEntity(({ entity }) => ({
		...entity,
		eventLog: { enabled: false },
	}))

/**
 * @deprecated use "disableEventLog"
 */
export const DisableEventLog = disableEventLog

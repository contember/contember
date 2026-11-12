/**
 * Calls `originalEventHandler`, then `ourEventHandler` unless the first one prevented the default action.
 */
export const composeEventHandlers = <E extends { defaultPrevented: boolean }>(
	originalEventHandler?: (event: E) => void,
	ourEventHandler?: (event: E) => void,
	{ checkForDefaultPrevented = true }: { checkForDefaultPrevented?: boolean } = {},
): (event: E) => void => {
	return event => {
		originalEventHandler?.(event)
		if (!checkForDefaultPrevented || !event.defaultPrevented) {
			ourEventHandler?.(event)
		}
	}
}

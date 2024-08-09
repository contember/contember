// Returns a signal that aborts when all present signals are aborted.
export const getCombinedSignal = (components: Iterable<AbortSignal | undefined>): AbortSignal => {
	let abortedCount = 0
	let signalCount = 0

	const controller = new AbortController()
	const refresh = () => {
		if (signalCount === 0) {
			return
		}
		if (abortedCount >= signalCount) {
			controller.abort()
		}
	}

	for (const component of components) {
		if (!component) {
			continue
		}

		signalCount++

		if (component.aborted) {
			abortedCount++
		} else {
			component.addEventListener('abort', () => {
				abortedCount++
				refresh()
			})
		}
	}

	refresh()

	return controller.signal
}

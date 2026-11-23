// Browsers cancel in-flight fetches when the page navigates away, and Chrome and Safari reject them with a plain
// TypeError ("Failed to fetch", "Load failed"), not an AbortError. These listeners tell that apart from a real failure.

// `beforeunload` also fires for a navigation that does not happen (a download link, a cancelled prompt).
const BEFORE_UNLOAD_GRACE_MS = 1000

let watching = false
let leaving = false
let beforeUnloadTimer: ReturnType<typeof setTimeout> | undefined

export const watchPageLeave = (): void => {
	if (watching || typeof globalThis.addEventListener !== 'function') {
		return
	}
	watching = true
	globalThis.addEventListener('beforeunload', () => {
		leaving = true
		clearTimeout(beforeUnloadTimer)
		beforeUnloadTimer = setTimeout(() => {
			leaving = false
		}, BEFORE_UNLOAD_GRACE_MS)
	})
	globalThis.addEventListener('pagehide', () => {
		clearTimeout(beforeUnloadTimer)
		leaving = true
	})
	globalThis.addEventListener('pageshow', () => {
		leaving = false
	})
}

export const isPageLeaving = (): boolean => leaving

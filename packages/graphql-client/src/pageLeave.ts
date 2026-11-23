// Browsers cancel in-flight fetches when the page navigates away, and Chrome and Safari reject them with a plain
// TypeError ("Failed to fetch", "Load failed"), not an AbortError. These listeners tell that apart from a real failure.

// `beforeunload` also fires for a navigation that does not happen (a download link, a cancelled prompt).
const BEFORE_UNLOAD_GRACE_MS = 1000

let watching = false
let pageHidden = false
// A timestamp, not a timer: Deno fires `beforeunload` whenever its event loop empties, and a timer would keep it alive.
let beforeUnloadAt: number | undefined

export const watchPageLeave = (): void => {
	if (watching || typeof globalThis.addEventListener !== 'function') {
		return
	}
	watching = true
	globalThis.addEventListener('beforeunload', () => {
		beforeUnloadAt = Date.now()
	})
	globalThis.addEventListener('pagehide', () => {
		pageHidden = true
	})
	globalThis.addEventListener('pageshow', () => {
		pageHidden = false
		beforeUnloadAt = undefined
	})
}

export const isPageLeaving = (): boolean => pageHidden || (beforeUnloadAt !== undefined && Date.now() - beforeUnloadAt < BEFORE_UNLOAD_GRACE_MS)

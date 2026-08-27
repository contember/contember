import { WriteRefTracker } from '@contember/graphql-client'
import { useReadAfterWriteTrackers } from '../contexts.js'

/**
 * The tracker of the given API path, created on first use. Returns `undefined` when read-after-write
 * is disabled — either globally or by `enabled` — so that every caller can pass the result straight
 * into the client options. A disabled call leaves the map untouched: only the content API needs a tracker.
 */
export const useReadAfterWriteTracker = (path: string, enabled = true): WriteRefTracker | undefined => {
	const trackers = useReadAfterWriteTrackers()
	if (!enabled || trackers === undefined) {
		return undefined
	}
	const tracker = trackers.get(path)
	if (tracker !== undefined) {
		return tracker
	}
	const created = new WriteRefTracker()
	trackers.set(path, created)
	return created
}

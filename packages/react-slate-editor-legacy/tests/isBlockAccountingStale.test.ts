import { describe, expect, it } from 'bun:test'
import { isBlockAccountingStale } from '../src/blockEditor/state/isBlockAccountingStale.js'

describe('isBlockAccountingStale', () => {
	it('accepts an accounting that describes the list', () => {
		expect(isBlockAccountingStale({ trackedBlocks: 5, orphanedBlocks: 0, blockCount: 5 })).toBe(false)
	})

	it('accepts an empty editor', () => {
		expect(isBlockAccountingStale({ trackedBlocks: 0, orphanedBlocks: 0, blockCount: 0 })).toBe(false)
	})

	it('rejects an accounting whose blocks all disappeared from the list', () => {
		// Every block was created by the persist that just finished, so every id changed under us.
		expect(isBlockAccountingStale({ trackedBlocks: 40, orphanedBlocks: 40, blockCount: 40 })).toBe(true)
	})

	it('rejects an accounting whose blocks partially disappeared from the list', () => {
		// Half of the article was pasted in and persisted, so only those ids changed.
		expect(isBlockAccountingStale({ trackedBlocks: 40, orphanedBlocks: 20, blockCount: 40 })).toBe(true)
	})

	it('rejects tracking nothing while the list has blocks', () => {
		expect(isBlockAccountingStale({ trackedBlocks: 0, orphanedBlocks: 0, blockCount: 40 })).toBe(true)
	})

	it('accepts blocks deleted in the editor', () => {
		// Deleting content leaves the refs resolvable — they just no longer point at a path.
		expect(isBlockAccountingStale({ trackedBlocks: 40, orphanedBlocks: 0, blockCount: 40 })).toBe(false)
	})

	it('accepts a block removed outside of the editor', () => {
		// The entity is really gone, so the list lost it as well and its node has to be recreated.
		expect(isBlockAccountingStale({ trackedBlocks: 40, orphanedBlocks: 1, blockCount: 39 })).toBe(false)
	})
})

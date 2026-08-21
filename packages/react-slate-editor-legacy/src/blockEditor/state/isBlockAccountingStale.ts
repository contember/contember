export interface BlockAccountingState {
	/** Blocks tracked in the block ⇄ Slate path map. */
	trackedBlocks: number
	/** Tracked blocks whose entity is no longer in the list. */
	orphanedBlocks: number
	/** Blocks in the entity list, not counting the trash block. */
	blockCount: number
}

/**
 * Tells whether the block ⇄ Slate path accounting still describes the entity list. When it doesn't,
 * refreshing the blocks would create a new entity for every node of the editor *next to* the rows that
 * are already there, and the next persist would duplicate the whole content.
 *
 * Two states qualify:
 * - nothing is tracked at all while the list isn't empty — the map never got populated,
 * - some tracked blocks are gone from the list, yet the list hasn't lost any. Their ids changed under us
 *   (`UnpersistedEntityDummyId` → `ServerId` right after a persist), so the blocks are still there, only
 *   under different keys.
 *
 * Deliberately not stale: refs that resolve to a block but no longer to a path. That's the user deleting
 * content in the editor, and the refresh has to go through with it.
 */
export const isBlockAccountingStale = ({ trackedBlocks, orphanedBlocks, blockCount }: BlockAccountingState): boolean => {
	if (blockCount === 0) {
		return false
	}
	return trackedBlocks === 0 || (orphanedBlocks > 0 && blockCount >= trackedBlocks)
}

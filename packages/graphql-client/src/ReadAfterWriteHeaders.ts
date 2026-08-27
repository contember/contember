/**
 * Headers of the read-after-write protocol: the server returns the id of a committed write in
 * `writeRef`, the client sends outstanding ids back in `readAfter` and the server acknowledges
 * the ones a replica has already seen in `readAfterVisible`.
 */
export const READ_AFTER_WRITE_HEADERS = {
	writeRef: 'X-Contember-Write-Ref',
	readAfter: 'X-Contember-Read-After',
	readAfterVisible: 'X-Contember-Read-After-Visible',
} as const

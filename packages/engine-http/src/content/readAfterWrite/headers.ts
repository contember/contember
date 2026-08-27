/** Response header of a mutation: reference to the write transaction it committed. */
export const writeRefHeaderName = 'X-Contember-Write-Ref'

/** Request header: references of its own writes the client wants this query to observe. */
export const readAfterHeaderName = 'X-Contember-Read-After'

/** Response header: the references the reader serving this query had already applied. */
export const readAfterVisibleHeaderName = 'X-Contember-Read-After-Visible'

/** Opaque to the client; the cluster part lets us reject a reference from a different database. */
export const formatWriteRef = (clusterId: string, xid: string): string => `${clusterId}:${xid}`

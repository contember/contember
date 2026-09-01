import { WriteRefSink } from '@contember/engine-content-api'

/**
 * Collects the write refs of one request. A request may commit several transactions (a multi-root
 * mutation, a materialized view refresh); the last one implies the earlier ones, so only it is kept.
 */
export class SimpleWriteRefSink implements WriteRefSink {
	public xid: string | undefined

	record(xid: string): void {
		this.xid = xid
	}
}

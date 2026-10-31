import { Input } from './input.js'

export namespace Retention {
	/**
	 * When a policy runs. Mirrors the `engine-scheduler` schedule shape structurally,
	 * but is defined here so `@contember/schema` stays free of any engine dependency —
	 * phase 3 adapts this into the scheduler's own type.
	 */
	export type Schedule =
		| { readonly cron: string }
		| { readonly everySeconds: number }
		| { readonly everyMinutes: number }

	/**
	 * `raw` issues a batched SQL `DELETE` (bypasses ACL/immutability, relies on DB
	 * FK cascade); `content` runs the delete through the content pipeline so Actions
	 * triggers / removeOrphan / ACL fire. Default `raw`.
	 */
	export type Strategy = 'raw' | 'content'

	export type Policy = {
		readonly name: string
		/** Plain entity name the policy prunes — the entity it is declared on. */
		readonly entity: string
		readonly strategy: Strategy
		/** Sugar for `where: { field: { lt: now() - interval } }`; `interval` is a Postgres interval string, e.g. `30 days`. */
		readonly olderThan?: {
			readonly field: string
			readonly interval: string
		}
		/** Optional Content-API where, ANDed with `olderThan`. */
		readonly where?: Input.Where
		readonly schedule?: Schedule
		readonly batchSize?: number
		readonly maxPerRun?: number
	}

	export type Schema = {
		readonly policies: {
			readonly [name: string]: Policy
		}
	}
}

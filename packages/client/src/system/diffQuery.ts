import { SystemEvent } from './events'

export interface DiffQueryResponse {
	data: {
		diff: {
			ok: boolean
			errors: Array<'STAGE_NOT_FOUND' | 'MISSING_BASE' | 'NOT_REBASED'>
			result?: null | {
				head: {
					id: string
					name: string
					slug: string
				}
				base: {
					id: string
					name: string
					slug: string
				}
				events: SystemEvent[]
			}
		}
	}
}

export const diffQuery = `query($stage: String!, $filter: [TreeFilter!]!) {
	diff(stage: $stage, filter: $filter) {
		ok
		errors
		result {
			base {
				id
				name
				slug
			}
			head {
				id
				name
				slug
			}
			events {
				id
				type
				transactionId
				dependencies
				description
				createdAt
				identityDescription
			}
		}
	}
}`

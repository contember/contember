export interface ReleaseTreeMutationResponse {
	data: {
		releaseTree: {
			ok: boolean
			errors: Array<'STAGE_NOT_FOUND' | 'MISSING_BASE' | 'FORBIDDEN' | 'NOT_REBASED'>
		}
	}
}

export const releaseTreeMutation = `mutation ($stage: String!, $filter: [TreeFilter!]!) {
	releaseTree(stage: $stage, tree: $filter) {
		ok
		errors
	}
}`

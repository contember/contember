import type { EntityId, FieldValue } from '../treeParameters'

export type ReceivedFieldData = FieldValue | ReceivedEntityData | Array<ReceivedEntityData>

export type ReceivedEntityData =
	& {
		__typename: string
		_meta?: {
			[fieldName: string]: {
				readable?: boolean
				updatable?: boolean
			}
		}
		id: EntityId
	}
	& {
		[fieldName: string]: ReceivedFieldData
	}

export type ReceivedData = ReceivedEntityData | ReceivedEntityData[]

export interface ReceivedDataTree {
	[treeId: string]: ReceivedData | null
}

export interface QueryRequestResponse {
	data: ReceivedDataTree
	errors?: { message: string; path?: string[] }[]
}

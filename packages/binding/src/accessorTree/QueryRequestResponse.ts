import type { EntityId, FieldValue } from '../treeParameters'

export type ReceivedFieldData = FieldValue | ReceivedEntityData | Array<ReceivedEntityData>

export type ReceivedEntityData =
	& {
		__typename: string
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
	errors?: { message: string, path?: string[] }[]
}

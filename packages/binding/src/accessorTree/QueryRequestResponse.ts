import type { Scalar } from '../treeParameters'

export type ReceivedFieldData<A = never> = Scalar | ReceivedEntityData<A> | Array<ReceivedEntityData<A> | A>
export type ReceivedEntityData<A = never> =
	| A
	| {
			id: string
			__typename: string
			[fieldName: string]: ReceivedFieldData<A>
	  }
export type ReceivedData<A = never> = A | ReceivedEntityData<A> | ReceivedEntityData<A>[]

export interface ReceivedDataTree<A = never> {
	[treeId: string]: ReceivedData<A> | null
}

export interface QueryRequestResponse<A = never> {
	data: ReceivedDataTree<A>
	errors?: { message: string, path?: string[] }[]
}

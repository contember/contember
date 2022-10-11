import { Actions } from '@contember/schema'


export class ActionsTarget {
	constructor(
		public readonly name: string | undefined,
		public readonly definition: Omit<Actions.AnyTarget, 'name'>,
	) {
	}
}

export const createTarget = ({
	name,
	...definition
}: Actions.AnyTarget & { name?: string }) => new ActionsTarget(name, definition)

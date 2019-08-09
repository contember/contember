import { Interface } from '@contember/utils'

export function createMock<T>(members: Interface<T>): T {
	return members
}

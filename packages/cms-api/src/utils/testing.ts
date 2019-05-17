import { Interface } from './interfaceType'

export function createMock<T>(members: Interface<T>): T {
	return members
}

type Interface<T> = { [P in keyof T]: T[P] }

export function createMock<T>(members: Interface<T>): T {
	return members
}

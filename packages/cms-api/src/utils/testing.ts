export function createMock<T>(members: { [P in keyof T]: T[P] }): T {
	return members
}

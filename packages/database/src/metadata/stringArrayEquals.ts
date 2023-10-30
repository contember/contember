export const stringArrayEquals = (colA: string[], colB: string[]) => {
	if (colA.length !== colB.length) {
		return false
	}
	const a = [...colA].sort()
	const b = [...colB].sort()
	return a.every((it, index) => it === b[index])
}

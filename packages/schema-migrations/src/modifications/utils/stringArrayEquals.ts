export const stringArrayEquals = (colA: string[], colB: string[]) => {
	return colA.length === colB.length
		&& colA.every((it, index) => it === colB[index])
}

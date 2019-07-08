export type ValidationPath = ({ field: string } | { index: number; alias?: string })[]

export const appendRelationToPath = (
	path: ValidationPath,
	relationName: string,
	index?: { index?: number; alias?: string }
): ValidationPath => {
	const newPath = [...path, { field: relationName }]
	if (index && index.index !== undefined) {
		newPath.push({ index: index.index, alias: index.alias })
	}
	return newPath
}

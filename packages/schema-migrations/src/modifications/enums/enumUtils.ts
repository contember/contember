import { escapeSqlString } from '../../utils/escapeSqlString.js'

export const createCheck = (values: readonly string[]) => {
	const joinedValues = values.map(it => `'${escapeSqlString(it)}'`).join(',')
	return `VALUE IN(${joinedValues})`
}

export const getConstraintName = (enumName: string) => `${enumName}_check`.toLowerCase()

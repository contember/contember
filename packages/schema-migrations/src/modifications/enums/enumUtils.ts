import { escapeSqlString } from '../../utils/escapeSqlString.js'
import { wrapIdentifier } from '../../utils/dbHelpers.js'

export const createCheck = (values: readonly string[]) => {
	const joinedValues = values.map(it => `'${escapeSqlString(it)}'`).join(',')
	return `VALUE IN(${joinedValues})`
}

export const getConstraintName = (enumName: string) => `${enumName}_check`.toLowerCase()

// A plain name stays unquoted so the SQL of existing migrations does not change; PostgreSQL folds it to the same, already lowercase, name.
export const getConstraintNameSql = (enumName: string) => {
	const name = getConstraintName(enumName)
	return /^[a-z_][a-z0-9_]*$/.test(name) ? name : wrapIdentifier(name)
}

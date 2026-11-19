import { INDEX_METHODS, isValidIndexMethod, isValidIndexOpClass } from '@contember/schema-utils'

export const wrapIdentifier = (value: string) => '"' + value.replace(/"/g, '""') + '"'

// A migration can skip the model validation errors for these values, so they are checked again where they enter the SQL.
export const indexMethodClause = (method: string | undefined): string => {
	if (!method) {
		return ''
	}
	if (!isValidIndexMethod(method)) {
		throw new Error(`Invalid index method ${JSON.stringify(method)}: expected one of ${INDEX_METHODS.join(', ')}`)
	}
	return ` USING ${method}`
}

export const indexOpClassSuffix = (opClass: string | undefined): string => {
	if (!opClass) {
		return ''
	}
	if (!isValidIndexOpClass(opClass)) {
		throw new Error(
			`Invalid index operator class ${JSON.stringify(opClass)}: expected an identifier, optionally schema-qualified (e.g. "public.gin_trgm_ops")`,
		)
	}
	return ` ${opClass}`
}

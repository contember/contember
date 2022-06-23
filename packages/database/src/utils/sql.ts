import { Literal } from '../Literal.js'

export const wrapIdentifier = (value: string) => '"' + value.replace(/"/g, '""') + '"'

export const aliasLiteral = (raw: Literal, alias?: string): Literal => {
	if (!alias) {
		return raw
	}
	return new Literal(raw.sql + ' as ' + wrapIdentifier(alias), raw.parameters)
}

export const prependSchema = (tableExpression: string | Literal, schema: string, cteAliases: Set<string>) => {
	if (typeof tableExpression !== 'string') {
		return tableExpression
	}
	return new Literal(
		cteAliases.has(tableExpression)
			? wrapIdentifier(tableExpression)
			: `${wrapIdentifier(schema)}.${wrapIdentifier(tableExpression)}`,
	)
}

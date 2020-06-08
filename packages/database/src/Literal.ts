export class Literal {
	static empty = new Literal('')

	constructor(
		public readonly sql: string,
		public readonly parameters: any[] = [],
		public readonly meta: Record<string, any> = {},
	) {}

	public append(literal: Literal) {
		return new Literal(this.sql.trimLeft() + ' ' + literal.sql, [...this.parameters, ...literal.parameters])
	}

	public appendAll(literal: Literal[], separator: string, prefixSuffix?: [string, string]) {
		const hasPrefixAndSuffix = prefixSuffix && literal.length > 0
		const prefix = hasPrefixAndSuffix ? prefixSuffix?.[0] : ''
		const suffix = hasPrefixAndSuffix ? prefixSuffix?.[1] : ''
		return new Literal(this.sql + prefix + literal.map(it => it.sql).join(separator) + suffix, [
			...this.parameters,
			...literal.map(it => it.parameters).reduce((acc, params) => [...acc, ...params], []),
		])
	}

	public appendString(sql: string) {
		return new Literal((this.sql + sql).trimLeft(), this.parameters)
	}

	public trim(): Literal {
		return new Literal(this.sql.trim(), this.parameters)
	}
}

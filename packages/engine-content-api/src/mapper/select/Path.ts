const MAX_IDENTIFIER_LENGTH = 63

const utf8Encoder = new TextEncoder()
const byteLength = (value: string): number => utf8Encoder.encode(value).length

export type HopGuards = { readonly row: boolean; readonly field: boolean }

/**
 * Path segment of a relation hop. JoinBuilder reuses a join by alias, so hops whose joins differ must differ in
 * alias: a read-guarded target source must not be shared with the same relation traversed unguarded (as-definer)
 * by an ACL predicate, and a join restricted by the relation field's guard must not be shared with an order-by
 * hop, which masks that field with CASE instead. `$` cannot occur in a field name, so no alias collides with a field.
 */
export const hopPathSegment = (fieldName: string, guards: HopGuards): string =>
	guards.field ? `${fieldName}$$` : guards.row ? `${fieldName}$` : fieldName

export class AliasContext {
	private aliasIndex = new Map<string, number>()

	public getAliasIndex(alias: string): number {
		const index = this.aliasIndex.get(alias)
		if (index !== undefined) {
			return index
		}
		const newIndex = this.aliasIndex.size + 1
		this.aliasIndex.set(alias, newIndex)
		return newIndex
	}
}

export class PathFactory {
	private aliasContext = new AliasContext()

	public create(path: string[], rootAlias = 'root_') {
		return new Path(path, this.aliasContext, rootAlias)
	}
}

export class Path {
	public readonly alias: string

	constructor(
		public readonly path: string[],
		private readonly aliasContext: AliasContext,
		public readonly rootAlias = 'root_',
	) {
		this.alias = this.createAlias()
	}

	public get fullAlias() {
		return this.rootAlias + this.path.join('_')
	}

	public back() {
		const newPath = [...this.path]
		newPath.pop()
		return new Path(newPath, this.aliasContext, this.rootAlias)
	}

	public for(path: string) {
		return new Path([...this.path, path], this.aliasContext, this.rootAlias)
	}

	// Engine-owned columns share the alias namespace with client GraphQL aliases. `$` is outside the GraphQL Name
	// grammar, so no client alias (nor `_`-joined aliases) can produce the segment; `kind` must not contain `_`.
	public forInternal(kind: string) {
		return this.for('$' + kind)
	}

	// PostgreSQL limits identifiers in bytes. Untruncated aliases stay below the limit and truncated ones fill it
	// exactly (padded when a multi-byte character does not fit), so the two can never coincide.
	private createAlias(): string {
		const alias = this.fullAlias
		if (byteLength(alias) < MAX_IDENTIFIER_LENGTH) {
			return alias
		}
		const suffix = '_' + this.aliasContext.getAliasIndex(alias).toString()
		const prefixBytes = MAX_IDENTIFIER_LENGTH - suffix.length
		let prefix = ''
		let usedBytes = 0
		for (const char of alias) {
			const charBytes = byteLength(char)
			if (usedBytes + charBytes > prefixBytes) {
				break
			}
			prefix += char
			usedBytes += charBytes
		}
		return prefix + '_'.repeat(prefixBytes - usedBytes) + suffix
	}
}

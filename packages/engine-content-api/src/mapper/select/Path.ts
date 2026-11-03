const MAX_IDENTIFIER_LENGTH = 63

const utf8Encoder = new TextEncoder()
const byteLength = (value: string): number => utf8Encoder.encode(value).length

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

	public constructor() {}

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

	// Segment for a column the engine selects for itself. `$` cannot occur in a GraphQL alias, so these aliases stay
	// distinct from those of selected fields; `kind` must not contain `_`.
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

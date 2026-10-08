const MAX_IDENTIFIER_LENGTH = 63

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

	private createAlias(): string {
		const alias = this.fullAlias

		// intentionally not allowing == MAX_IDENTIFIER_LENGTH
		if (alias.length < MAX_IDENTIFIER_LENGTH) {
			return alias
		}
		const index = this.aliasContext.getAliasIndex(alias).toString()
		return alias.substring(0, MAX_IDENTIFIER_LENGTH - index.length - 1) + '_' + index
	}
}

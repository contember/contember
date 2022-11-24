const MAX_IDENTIFIER_LENGTH = 63

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
	public readonly alias = this.createAlias()

	public get fullAlias() {
		return this.rootAlias + this.path.join('_')
	}
	constructor(
		public readonly path: string[],
		private readonly aliasContext: AliasContext,
		public readonly rootAlias = 'root_',
	) {}

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

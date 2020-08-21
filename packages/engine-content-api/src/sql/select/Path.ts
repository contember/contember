import farmhash from 'farmhash'
const MAX_IDENTIFIER_LENGTH = 63
const HASH_LENGTH = 8

export default class Path {
	constructor(public readonly path: string[], public readonly rootAlias = 'root_') {}

	public back() {
		const newPath = [...this.path]
		newPath.pop()
		return new Path(newPath, this.rootAlias)
	}

	public for(path: string) {
		return new Path([...this.path, path], this.rootAlias)
	}

	public getAlias(): string {
		const alias = this.rootAlias + this.path.join('_')

		// intentionally not allowing == MAX_IDENTIFIER_LENGTH
		if (alias.length < MAX_IDENTIFIER_LENGTH) {
			return alias
		}

		const hash = farmhash.hash32(alias).toString(16)

		return alias.substr(0, MAX_IDENTIFIER_LENGTH - HASH_LENGTH - 1) + '_' + hash
	}
}

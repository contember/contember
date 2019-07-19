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
		return this.rootAlias + this.path.join('_')
	}
}

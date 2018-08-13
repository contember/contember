export default class Path {
	constructor(public readonly path: string[]) {}

	public back() {
		const newPath = [...this.path]
		newPath.pop()
		return new Path(newPath)
	}

	public for(path: string) {
		return new Path([...this.path, path])
	}

	public getAlias(): string {
		return 'root_' + this.path.join('_')
	}
}

import Path from './Path'

class SelectHydrator {
	private columns: Path[] = []
	private entities: Path[] = []
	private groupPromises: { path: Path; parentKeyPath: Path; data: PromiseLike<any> }[] = []

	public addEntity(primaryPath: Path) {
		this.entities.push(primaryPath)
	}

	public addColumn(path: Path) {
		this.columns.push(path)
	}

	public addGroupPromise(path: Path, parentKeyPath: Path, data: PromiseLike<SelectHydrator.GroupedObjects>) {
		this.groupPromises.push({ path, parentKeyPath, data })
	}

	async hydrateGroups(rows: SelectHydrator.Rows, groupingKey: string): Promise<SelectHydrator.GroupedObjects> {
		const result: SelectHydrator.GroupedObjects = {}
		for (let row of rows) {
			const key = row[groupingKey]
			if (!result[key]) {
				result[key] = []
			}
			result[key].push(await this.hydrateRow(row))
		}
		return result
	}

	async hydrateAll(rows: SelectHydrator.Rows): Promise<SelectHydrator.ResultObjects> {
		return Promise.all(rows.map(row => this.hydrateRow(row)))
	}

	async hydrateRow(row: SelectHydrator.Row): Promise<SelectHydrator.ResultObject> {
		const result: SelectHydrator.ResultObject = {}
		for (let primaryPath of this.entities) {
			if (row[primaryPath.getAlias()] === null) {
				continue
			}
			primaryPath.path
				.slice(0, primaryPath.path.length - 1)
				.reduce((obj, part) => (obj[part] = obj[part] || {}), result)
		}

		for (let columnPath of this.columns) {
			const path = [...columnPath.path]
			const last: string = path.pop() as string
			const currentObject = path.reduce((obj, part) => (obj && obj[part]) || undefined, result)
			if (currentObject) {
				currentObject[last] = row[columnPath.getAlias()]
			}
		}
		for (let { path, parentKeyPath, data } of this.groupPromises) {
			const awaitedData = await data
			const pathTmp = [...path.path]
			const last = pathTmp.pop() as string
			const currentObject = pathTmp.reduce((obj, part) => (obj && obj[part]) || undefined, result)
			const parentValue = row[parentKeyPath.getAlias()]
			if (currentObject && parentValue) {
				currentObject[last] = awaitedData[parentValue] || []
			}
		}

		return result
	}
}

namespace SelectHydrator {
	export type Row = { [key: string]: any }
	export type Rows = Row[]

	export type ResultObject = { [key: string]: any }
	export type ResultObjects = ResultObject[]
	export type GroupedObjects = { [groupingKey: string]: ResultObjects }
}

export default SelectHydrator

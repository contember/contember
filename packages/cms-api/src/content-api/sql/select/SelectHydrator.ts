import Path from './Path'
import { Value } from 'cms-common'

class SelectHydrator {
	private columns: Path[] = []
	private promises: {
		path: Path
		parentKeyPath: Path
		data: PromiseLike<SelectHydrator.NestedData>
		defaultValue: SelectHydrator.NestedDefaultValue
	}[] = []

	public addColumn(path: Path) {
		this.columns.push(path)
	}

	public addPromise(
		path: Path,
		parentKeyPath: Path,
		data: PromiseLike<SelectHydrator.NestedData>,
		defaultValue: SelectHydrator.NestedDefaultValue,
	) {
		this.promises.push({ path, parentKeyPath, data, defaultValue })
	}

	public async hydrateGroups(rows: SelectHydrator.Rows, groupBy: string): Promise<SelectHydrator.GroupedObjects> {
		await Promise.all(this.promises.map(it => it.data))
		const result: SelectHydrator.GroupedObjects = {}
		for (let row of rows) {
			const key = row[groupBy] as Value.PrimaryValue
			if (!result[key]) {
				result[key] = []
			}
			result[key].push(await this.hydrateRow(row))
		}
		return result
	}

	public async hydrateAll(rows: SelectHydrator.Rows): Promise<SelectHydrator.ResultObjects>
	public async hydrateAll(rows: SelectHydrator.Rows, indexBy: string): Promise<SelectHydrator.IndexedResultObjects>

	public async hydrateAll(
		rows: SelectHydrator.Rows,
		indexBy?: string,
	): Promise<SelectHydrator.ResultObjects | SelectHydrator.IndexedResultObjects> {
		await Promise.all(this.promises.map(it => it.data))
		if (indexBy) {
			const result: SelectHydrator.IndexedResultObjects = {}
			for (let row of rows) {
				result[row[indexBy] as Value.PrimaryValue] = await this.hydrateRow(row)
			}
			return result
		}

		return Promise.all(rows.map(row => this.hydrateRow(row)))
	}

	private async hydrateRow(row: SelectHydrator.Row): Promise<SelectHydrator.ResultObject> {
		const result: SelectHydrator.ResultObject = {}

		for (let columnPath of this.columns) {
			const path = [...columnPath.path]
			const last: string = path.pop() as string
			const currentObject = path.reduce<any>((obj, part) => (obj[part] = obj[part] || {}), result)

			currentObject[last] = row[columnPath.getAlias()]
		}

		for (let { path, parentKeyPath, data, defaultValue } of this.promises) {
			const awaitedData = await data
			const pathTmp = [...path.path]
			const last = pathTmp.pop() as string
			const currentObject = pathTmp.reduce<any>((obj, part) => (obj && obj[part]) || undefined, result)
			const parentValue = row[parentKeyPath.getAlias()] as Value.PrimaryValue
			if (currentObject && parentValue) {
				currentObject[last] = awaitedData[parentValue] || defaultValue
			}
		}

		return result
	}
}

namespace SelectHydrator {
	export type Row = { [key: string]: Value.AtomicValue }
	export type Rows = Row[]

	export type ResultObject = Value.Object
	export type ResultObjects = ResultObject[]
	export type IndexedResultObjects = { [key: string]: ResultObject }
	export type GroupedObjects = { [groupingKey: string]: ResultObjects }
	export type NestedData = GroupedObjects | IndexedResultObjects
	export type NestedDefaultValue = [] | null
}

export default SelectHydrator

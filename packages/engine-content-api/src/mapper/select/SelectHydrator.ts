import { Path } from './Path'
import { Value } from '@contember/schema'

export class SelectHydrator {
	private columns: Path[] = []
	private promises: {
		path: Path
		parentKeyPath: Path
		data: PromiseLike<SelectNestedData>
		defaultValue: SelectNestedDefaultValue
	}[] = []

	public addColumn(path: Path) {
		this.columns.push(path)
	}

	public addPromise(
		path: Path,
		parentKeyPath: Path,
		data: PromiseLike<SelectNestedData>,
		defaultValue: SelectNestedDefaultValue,
	) {
		this.promises.push({ path, parentKeyPath, data, defaultValue })
	}

	public async hydrateGroups(rows: SelectRow[], groupBy: string): Promise<SelectGroupedObjects> {
		await Promise.all(this.promises.map(it => it.data))
		const result: SelectGroupedObjects = {}
		for (let row of rows) {
			const key = row[groupBy] as Value.PrimaryValue
			if (!result[key]) {
				result[key] = []
			}
			result[key].push(await this.hydrateRow(row))
		}
		return result
	}

	public async hydrateAll(rows: SelectRow[]): Promise<SelectResultObject[]>
	public async hydrateAll(rows: SelectRow[], indexBy: string): Promise<SelectIndexedResultObjects>

	public async hydrateAll(
		rows: SelectRow[],
		indexBy?: string,
	): Promise<SelectResultObject[] | SelectIndexedResultObjects> {
		await Promise.all(this.promises.map(it => it.data))
		if (indexBy) {
			const result: SelectIndexedResultObjects = {}
			for (let row of rows) {
				result[row[indexBy] as Value.PrimaryValue] = await this.hydrateRow(row)
			}
			return result
		}

		return Promise.all(rows.map(row => this.hydrateRow(row)))
	}

	private async hydrateRow(row: SelectRow): Promise<SelectResultObject> {
		const result: SelectResultObject = {}

		for (let columnPath of this.columns) {
			const path = [...columnPath.path]
			const last: string = path.pop() as string
			const currentObject = path.reduce<any>((obj, part) => (obj[part] = obj[part] || {}), result)

			const field = row[columnPath.getAlias()]
			currentObject[last] = this.formatValue(field)
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

	private formatValue(value: any) {
		if (value instanceof Date) {
			return value.toISOString()
		}
		return value
	}
}

export type SelectRow = { [key: string]: Value.AtomicValue }
export type SelectResultObject = Value.Object
export type SelectIndexedResultObjects = { [key: string]: SelectResultObject }
export type SelectGroupedObjects = { [groupingKey: string]: SelectResultObject[] }
export type SelectNestedData = SelectGroupedObjects | SelectIndexedResultObjects
export type SelectNestedDefaultValue = [] | null

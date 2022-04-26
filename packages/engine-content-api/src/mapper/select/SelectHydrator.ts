import { Path } from './Path'
import { Value } from '@contember/schema'

type DataPromises = {
	path: Path
	parentKeyPath: Path
	data: Promise<SelectNestedData>
	defaultValue: SelectNestedDefaultValue
}

type ResolvedData = {
	path: Path
	parentKeyPath: Path
	data: SelectNestedData
	defaultValue: SelectNestedDefaultValue
}

export class SelectHydrator {
	private columns: Path[] = []
	private promises: DataPromises[] = []

	public addColumn(path: Path) {
		this.columns.push(path)
	}

	public addPromise(
		path: Path,
		parentKeyPath: Path,
		data: Promise<SelectNestedData>,
		defaultValue: SelectNestedDefaultValue,
	) {
		this.promises.push({ path, parentKeyPath, data, defaultValue })
	}

	public async hydrateGroups(rows: SelectRow[], groupBy: string): Promise<SelectGroupedObjects> {
		const resolved = await this.resolveDataPromises()
		const result: SelectGroupedObjects = {}
		for (let row of rows) {
			const key = row[groupBy] as Value.PrimaryValue
			if (!result[key]) {
				result[key] = []
			}
			result[key].push(this.hydrateRow(row, resolved))
		}
		return result
	}

	public async hydrateAll(rows: SelectRow[]): Promise<SelectResultObject[]>
	public async hydrateAll(rows: SelectRow[], indexBy: string): Promise<SelectIndexedResultObjects>

	public async hydrateAll(
		rows: SelectRow[],
		indexBy?: string,
	): Promise<SelectResultObject[] | SelectIndexedResultObjects> {
		const resolved = await this.resolveDataPromises()
		if (indexBy) {
			const result: SelectIndexedResultObjects = {}
			for (let row of rows) {
				result[row[indexBy] as Value.PrimaryValue] = this.hydrateRow(row, resolved)
			}
			return result
		}
		const result: SelectResultObject[] = []
		for (const row of rows) {
			result.push(this.hydrateRow(row, resolved))
		}
		return result
	}

	private hydrateRow(row: SelectRow, resolvedData: ResolvedData[]): SelectResultObject {
		const result: SelectResultObject = {}

		for (let columnPath of this.columns) {
			const path = [...columnPath.path]
			const last: string = path.pop() as string
			const currentObject = path.reduce<any>((obj, part) => (obj[part] = obj[part] || {}), result)

			const field = row[columnPath.getAlias()]
			currentObject[last] = this.formatValue(field)
		}

		for (let { path, parentKeyPath, data, defaultValue } of resolvedData) {
			const pathTmp = [...path.path]
			const last = pathTmp.pop() as string
			const currentObject = pathTmp.reduce<any>((obj, part) => (obj && obj[part]) || undefined, result)
			const parentValue = row[parentKeyPath.getAlias()] as Value.PrimaryValue
			if (currentObject) {
				currentObject[last] = (parentValue ? data[parentValue] : undefined) || defaultValue
			}
		}

		return result
	}

	private async resolveDataPromises(): Promise<ResolvedData[]> {
		return await Promise.all(this.promises.map(async (it): Promise<ResolvedData> => ({
			defaultValue: it.defaultValue,
			parentKeyPath: it.parentKeyPath,
			path: it.path,
			data: await it.data,
		})))
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

import { Path } from './Path.js'
import { Value } from '@contember/schema'
import { getFulfilledValues, getRejections } from '../../utils/index.js'
import { logger } from '@contember/logger'
import { RequestMemoryBudget, RequestMemoryBudgetExceededError } from '@contember/database'

type DataPromises = {
	path: Path
	getParentValue: ColumnValueGetter<Value.PrimaryValue | null>
	data: Promise<SelectNestedData>
	defaultValue: SelectNestedDefaultValue
}

type ResolvedData = {
	path: Path
	getParentValue: ColumnValueGetter<Value.PrimaryValue | null>
	data: SelectNestedData
	defaultValue: SelectNestedDefaultValue
}

export type ColumnValueGetter<T extends Value.FieldValue = Value.FieldValue> = (row: SelectRow) => T

type Column = {
	path: Path
	getValue: ColumnValueGetter
}

export class SelectHydrator {
	private columns: Column[] = []
	private promises: DataPromises[] = []
	private formattedDates = 0

	constructor(private readonly memoryBudget?: RequestMemoryBudget) {}

	public addColumn(path: Path, getValue: ColumnValueGetter) {
		this.columns.push({ path, getValue })
	}

	public addPromise(
		path: Path,
		getParentValue: ColumnValueGetter<Value.PrimaryValue | null>,
		data: Promise<SelectNestedData>,
		defaultValue: SelectNestedDefaultValue,
	) {
		this.promises.push({ path, getParentValue, data, defaultValue })
	}

	public async hydrateGroups(rows: SelectRow[], groupBy: string): Promise<SelectGroupedObjects> {
		const hydrated = await this.hydrateRows(rows)
		const result: SelectGroupedObjects = {}
		rows.forEach((row, index) => {
			const key = row[groupBy] as Value.PrimaryValue
			if (!result[key]) {
				result[key] = []
			}
			result[key].push(hydrated[index])
		})
		return result
	}

	public async hydrateAll(rows: SelectRow[]): Promise<SelectResultObject[]>
	public async hydrateAll(rows: SelectRow[], indexBy: string): Promise<SelectIndexedResultObjects>

	public async hydrateAll(
		rows: SelectRow[],
		indexBy?: string,
	): Promise<SelectResultObject[] | SelectIndexedResultObjects> {
		const hydrated = await this.hydrateRows(rows)
		if (indexBy) {
			const result: SelectIndexedResultObjects = {}
			rows.forEach((row, index) => {
				result[row[indexBy] as Value.PrimaryValue] = hydrated[index]
			})
			return result
		}
		return hydrated
	}

	private async hydrateRows(rows: SelectRow[]): Promise<SelectResultObject[]> {
		const resolved = await this.resolveDataPromises()
		this.chargeRows(rows.length, resolved.length)
		this.formattedDates = 0
		const hydrated = rows.map(row => this.hydrateRow(row, resolved))
		// A formatted Date is a new string; their count is known only after the rows are built.
		this.memoryBudget?.addHydrationBytes(this.formattedDates * 72)
		return hydrated
	}

	private hydrateRow(row: SelectRow, resolvedData: ResolvedData[]): SelectResultObject {
		const result: SelectResultObject = {}

		for (let columnPath of this.columns) {
			const path = [...columnPath.path.path]
			const last: string = path.pop() as string
			const currentObject = path.reduce<any>((obj, part) => (obj[part] = obj[part] || {}), result)

			currentObject[last] = this.formatValue(columnPath.getValue(row))
		}

		for (let { path, getParentValue, data, defaultValue } of resolvedData) {
			const pathTmp = [...path.path]
			const last = pathTmp.pop() as string
			const currentObject = pathTmp.reduce<any>((obj, part) => (obj?.[part]) || undefined, result)
			const parentValue = getParentValue(row)
			if (currentObject) {
				currentObject[last] = (parentValue ? data[parentValue] : undefined) || defaultValue
			}
		}

		return result
	}

	private async resolveDataPromises(): Promise<ResolvedData[]> {
		const results = await Promise.allSettled(this.promises.map(async (it): Promise<ResolvedData> => ({
			defaultValue: it.defaultValue,
			getParentValue: it.getParentValue,
			path: it.path,
			data: await it.data,
		})))
		const failures = getRejections(results)
		if (failures.length > 0) {
			// Budget exhaustion aborts every in-flight sibling query; those rejections are expected.
			failures.slice(1)
				.filter(e => !(e instanceof RequestMemoryBudgetExceededError))
				.forEach(e => logger.error(e, { loc: 'SelectHydrator' }))
			throw failures[0]
		}

		return getFulfilledValues(results)
	}

	private formatValue(value: any) {
		if (value instanceof Date) {
			this.formattedDates++
			return value.toISOString()
		}
		return value
	}

	// The row shape is fixed by the columns, so all rows are charged at once, before any of them is allocated.
	private chargeRows(rowCount: number, relationCount: number): void {
		if (!this.memoryBudget || rowCount === 0) {
			return
		}
		const nestedObjects = new Set<string>()
		for (const { path } of this.columns) {
			for (let depth = 1; depth < path.path.length; depth++) {
				nestedObjects.add(path.path.slice(0, depth).join('.'))
			}
		}
		const rowBytes = 40 + this.columns.length * 16 + nestedObjects.size * 48 + relationCount * 16
		this.memoryBudget.addHydrationBytes(rowCount * rowBytes)
	}
}

export type SelectRow = { [key: string]: Value.FieldValue }
export type SelectResultObject = Value.Object
export type SelectIndexedResultObjects = { [key: string]: SelectResultObject }
export type SelectGroupedObjects = { [groupingKey: string]: SelectResultObject[] }
export type SelectNestedData = SelectGroupedObjects | SelectIndexedResultObjects
export type SelectNestedDefaultValue = [] | null

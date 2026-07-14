import { Path } from './Path.js'
import { Value } from '@contember/schema'
import { getFulfilledValues, getRejections } from '../../utils/index.js'
import { logger } from '@contember/logger'
import { MetadataUpdateMasker } from './MetadataUpdateCapability.js'

type UpdateCapability = {
	getValue: ColumnValueGetter<boolean>
	masker: MetadataUpdateMasker
}

type DataPromises = {
	path: Path
	getParentValue: ColumnValueGetter<Value.PrimaryValue | null>
	data: Promise<SelectNestedData>
	defaultValue: SelectNestedDefaultValue
	updateCapability?: UpdateCapability
}

type ResolvedData = {
	path: Path
	getParentValue: ColumnValueGetter<Value.PrimaryValue | null>
	data: SelectNestedData
	defaultValue: SelectNestedDefaultValue
	updateCapability?: UpdateCapability
}

export type ColumnValueGetter<T extends Value.FieldValue = Value.FieldValue> = (row: SelectRow) => T

type Column = {
	path: Path
	getValue: ColumnValueGetter
}

export class SelectHydrator {
	private columns: Column[] = []
	private promises: DataPromises[] = []
	private updateCapability?: UpdateCapability

	public setMetadataUpdateCapability(updateCapability: UpdateCapability): void {
		this.updateCapability = updateCapability
	}

	public addColumn(path: Path, getValue: ColumnValueGetter) {
		this.columns.push({ path, getValue })
	}

	public addPromise(
		path: Path,
		getParentValue: ColumnValueGetter<Value.PrimaryValue | null>,
		data: Promise<SelectNestedData>,
		defaultValue: SelectNestedDefaultValue,
		updateCapability?: UpdateCapability,
	) {
		this.promises.push({ path, getParentValue, data, defaultValue, updateCapability })
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
			const path = [...columnPath.path.path]
			const last: string = path.pop() as string
			const currentObject = path.reduce<any>((obj, part) => (obj[part] = obj[part] || {}), result)

			currentObject[last] = this.formatValue(columnPath.getValue(row))
		}

		for (let { path, getParentValue, data, defaultValue, updateCapability } of resolvedData) {
			const pathTmp = [...path.path]
			const last = pathTmp.pop() as string
			const currentObject = pathTmp.reduce<any>((obj, part) => (obj?.[part]) || undefined, result)
			const parentValue = getParentValue(row)
			if (currentObject) {
				const nestedValue = (parentValue ? data[parentValue] : undefined) || defaultValue
				currentObject[last] = updateCapability !== undefined && !updateCapability.getValue(row)
					? updateCapability.masker.mask(nestedValue)
					: nestedValue
			}
		}

		return this.updateCapability !== undefined && !this.updateCapability.getValue(row)
			? this.updateCapability.masker.maskObject(result)
			: result
	}

	private async resolveDataPromises(): Promise<ResolvedData[]> {
		const results = await Promise.allSettled(this.promises.map(async (it): Promise<ResolvedData> => ({
			defaultValue: it.defaultValue,
			getParentValue: it.getParentValue,
			updateCapability: it.updateCapability,
			path: it.path,
			data: await it.data,
		})))
		const failures = getRejections(results)
		if (failures.length > 0) {
			if (failures.length > 1) {
				failures.slice(1).map(e => logger.error(e, { loc: 'SelectHydrator' }))
			}
			throw failures[0]
		}

		return getFulfilledValues(results)
	}

	private formatValue(value: any) {
		if (value instanceof Date) {
			return value.toISOString()
		}
		return value
	}
}

export type SelectRow = { [key: string]: Value.FieldValue }
export type SelectResultObject = Value.Object
export type SelectIndexedResultObjects = { [key: string]: SelectResultObject }
export type SelectGroupedObjects = { [groupingKey: string]: SelectResultObject[] }
export type SelectNestedData = SelectGroupedObjects | SelectIndexedResultObjects
export type SelectNestedDefaultValue = [] | null

import {
	EntityFieldMarker,
	EntityListSubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	PRIMARY_KEY_NAME,
} from '@contember/react-binding'
import { ExportFactory, ExportFormatterCreateOutputArgs, ExportResult } from './ExportFactory'
import { DataViewDataForExport } from '../types'

export class CsvExportFactory implements ExportFactory {
	create(args: ExportFormatterCreateOutputArgs): ExportResult {
		const data = this.flattenData(args.data, args.marker)
		const filteredData = this.filterData(data)
		const string = this.formatOutput(filteredData)

		return {
			blob: new Blob([string], { type: 'text/csv' }),
			extension: 'csv',
		}
	}

	private isJsonObject(value: any): value is Record<string, unknown> {
		return value !== null && typeof value === 'object' && !Array.isArray(value)
	}

	private isFieldMarker(marker: any): marker is FieldMarker {
		return marker instanceof FieldMarker
	}

	private isRelationMarker(marker: any): marker is HasOneRelationMarker | HasManyRelationMarker {
		return marker instanceof HasOneRelationMarker || marker instanceof HasManyRelationMarker
	}

	protected flattenData(data: any[], marker: EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker) {
		const columns: DataViewDataForExport = []
		this.traverseMarkers(data, [marker], columns)
		return columns
	}

	private traverseMarkers(
		data: any[],
		markerPath: (EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker)[],
		columns: DataViewDataForExport,
	) {
		const currentMarker = markerPath[markerPath.length - 1]

		for (const subMarker of currentMarker.fields.markers.values()) {
			const values = this.extractValues(data, subMarker)

			if (this.isFieldMarker(subMarker)) {
				this.handleFieldMarker(subMarker, values, markerPath, columns)
			} else if (this.isRelationMarker(subMarker)) {
				this.traverseMarkers(values, [...markerPath, subMarker], columns)
			}
		}
	}

	private extractValues(data: any[], subMarker: EntityFieldMarker): EntityFieldMarker[] {
		return data.map(it => (Array.isArray(it) ? it.flatMap(item => item?.[subMarker.placeholderName]) : it?.[subMarker.placeholderName]))
	}

	private handleFieldMarker(
		subMarker: FieldMarker,
		values: unknown[],
		markerPath: (EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker)[],
		columns: DataViewDataForExport,
	) {
		const hasJsonValues = values.some(v => this.isJsonObject(v))

		if (hasJsonValues) {
			this.handleJsonValues(subMarker, values, markerPath, columns)
		} else {
			columns.push({
				markerPath: [...markerPath, subMarker],
				values,
			})
		}
	}

	private handleJsonValues(
		subMarker: FieldMarker,
		values: unknown[],
		markerPath: (EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker)[],
		columns: DataViewDataForExport,
	) {
		const allKeys = this.collectJsonKeys(values)

		for (const key of allKeys) {
			const jsonFieldMarker = this.createJsonFieldMarker(subMarker, key)
			columns.push({
				markerPath: [...markerPath, jsonFieldMarker],
				values: this.extractJsonValues(values, key),
			})
		}
	}

	private collectJsonKeys(values: unknown[]): Set<string> {
		const allKeys = new Set<string>()
		values.forEach(value => {
			if (this.isJsonObject(value)) {
				const flattened = this.flattenJson(value)
				Object.keys(flattened).forEach(key => allKeys.add(key))
			}
		})
		return allKeys
	}

	private createJsonFieldMarker(subMarker: FieldMarker, key: string): FieldMarker {
		return new FieldMarker({
			field: `${subMarker.fieldName}.${key}`,
			defaultValue: undefined,
			isNonbearing: false,
			eventListeners: undefined,
		})
	}

	private extractJsonValues(values: unknown[], key: string) {
		return values.map(value => {
			if (this.isJsonObject(value)) {
				const flattened = this.flattenJson(value)
				return flattened[key] ?? ''
			}
			return ''
		})
	}

	protected filterData(data: DataViewDataForExport): DataViewDataForExport {
		return data.filter(it => {
			const lastMarker = it.markerPath[it.markerPath.length - 1]
			return lastMarker instanceof FieldMarker && (lastMarker.fieldName !== PRIMARY_KEY_NAME || it.markerPath.length === 2)
		})
	}

	protected flattenJson(obj: object, prefix = '') {
		if (!this.isJsonObject(obj)) {
			throw new Error('Invalid input: expected a JSON object')
		}

		const flattened: Record<string, unknown> = {}

		for (const key in obj) {
			if (Object.hasOwn(obj, key)) {
				const value = obj[key]
				const newKey = prefix ? `${prefix}_${key}` : key

				if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
					Object.assign(flattened, this.flattenJson(value, newKey))
				} else {
					flattened[newKey] = value
				}
			}
		}

		return flattened
	}

	protected formatValue(value: unknown): string {
		const stringValue = Array.isArray(value) ? value.join(', ') : String(value ?? '')

		if (stringValue.includes(',') || stringValue.includes('\n')) {
			return `"${stringValue.replace(/"/g, '""')}"`
		}

		return stringValue
	}

	protected formatOutput(data: DataViewDataForExport): string {
		const rows = this.createData(data).map(it => it.join(','))
		const header = this.createHeader(data).join(',')
		return `${header}\n${rows.join('\n')}`
	}

	protected createHeader(data: DataViewDataForExport) {
		return data.map(it => {
			return it.markerPath
			         .map(it => {
				         if (it instanceof FieldMarker) {
					         return it.fieldName || it.placeholderName
				         }

				         if (it instanceof HasOneRelationMarker || it instanceof HasManyRelationMarker) {
					         return it.parameters.field
				         }

				         return null
			         })
			         .filter(it => it !== null)
			         .join(' ')
		})
	}

	protected createData(data: DataViewDataForExport) {
		const maxLength = Math.max(...data.map(it => it.values.length))
		return Array.from({ length: maxLength }, (_, i) => data.map(it => this.formatValue(it.values[i])))
	}
}

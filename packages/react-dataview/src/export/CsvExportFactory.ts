import { EntityListSubTreeMarker, FieldMarker, HasManyRelationMarker, HasOneRelationMarker, PRIMARY_KEY_NAME } from '@contember/binding'
import { ExportFactory, ExportFormatterCreateOutputArgs, ExportResult } from './ExportFactory'
import { DataViewDataForExport } from '../types'

type ContainerMarker = EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker

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

	protected filterData(data: DataViewDataForExport): DataViewDataForExport {
		return data.filter(it => {
			const lastMarker = it.markerPath[it.markerPath.length - 1]
			return (lastMarker instanceof FieldMarker) && (lastMarker.fieldName !== PRIMARY_KEY_NAME || it.markerPath.length === 2)
		})
	}

	protected flattenData(data: any[], marker: ContainerMarker) {
		const columns: DataViewDataForExport = []
		const traverseMarkers = (data: any[], markerPath: [ContainerMarker, ...ContainerMarker[]]) => {
			for (const subMarker of markerPath[markerPath.length - 1].fields.markers.values()) {
				const values = data.map((it: any) =>
					Array.isArray(it)
						? it.flatMap(it => it?.[subMarker.placeholderName])
						: it?.[subMarker.placeholderName],
				)

				if (subMarker instanceof FieldMarker) {
					columns.push({
						markerPath: [...markerPath, subMarker],
						values,
					})
				} else if (subMarker instanceof HasOneRelationMarker || subMarker instanceof HasManyRelationMarker) {
					traverseMarkers(values, [...markerPath, subMarker])
				}
			}
		}
		traverseMarkers(data, [marker])


		return columns
	}

	protected formatValue(value: any) {
		const stringValue = Array.isArray(value) ? value.join(';') : String((value ?? ''))
		if (stringValue.includes(',') || stringValue.includes('\n')) {
			return '"' + stringValue.replace(/"/g, '""') + '"'
		}
		return stringValue
	}

	protected formatOutput(data: DataViewDataForExport): string {
		const rows = this.createData(data).map(it => it.join(','))
		const header = this.createHeader(data).join(',')
		return header + '\n' + rows.join('\n')
	}

	protected createHeader(data: DataViewDataForExport) {
		return data.map(it => {
			return it.markerPath.map(it => {
				if (it instanceof FieldMarker) {
					return it.placeholderName
				} else if (it instanceof HasOneRelationMarker || it instanceof HasManyRelationMarker) {
					return it.parameters.field
				} else {
					return null
				}
			}).filter(it => it !== null).join(' ')
		})
	}

	protected createData(data: DataViewDataForExport) {
		const rows: string[][] = []

		const maxLength = Math.max(...data.map(it => it.values.length))
		for (let i = 0; i < maxLength; i++) {
			const row = data.map(it => {
				const value = it.values[i]
				return this.formatValue(value)
			})
			rows.push(row)
		}
		return rows
	}
}

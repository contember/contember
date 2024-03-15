import { Button } from '../ui/button'
import { DownloadIcon } from 'lucide-react'
import { useDataViewEntityListProps, useDataViewFilteringState } from '@contember/react-dataview'
import { createQueryBuilder, EntityListSubTreeMarker, FieldMarker, Filter, HasManyRelationMarker, HasOneRelationMarker, PlaceholderGenerator, QueryGenerator } from '@contember/binding'
import { ContentClient, ContentQuery, ContentQueryBuilder, replaceGraphQlLiteral } from '@contember/client'
import { useCurrentContentGraphQlClient } from '@contember/react-client'
import { EntityListSubTree, MarkerTreeGenerator, useEnvironment } from '@contember/react-binding'
import * as React from 'react'
import { useCallback } from 'react'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { DataGridColumn } from './grid'

export interface UseDataGridExportArgs<Value> {
	createQuery: (args: { entityName: string, filter: Filter<never>, qb: ContentQueryBuilder }) => ContentQuery<Value[]>
	createOutput: (value: Value[]) => string
	fileName: string
	fileType: string
}

const useDataGridExport = () => {
	const client = useCurrentContentGraphQlClient()
	const entityName = useDataViewEntityListProps().entityName
	const filter = useDataViewFilteringState().filter

	const env = useEnvironment()
	return useCallback(async <V extends {}>({ createQuery, fileName, createOutput, fileType }: UseDataGridExportArgs<V>) => {
		const resolvedFilter = resolveFilter(filter)
		const qb = createQueryBuilder(env.getSchema())
		const query = createQuery({ entityName, filter: resolvedFilter, qb })
		const contentClient = new ContentClient(client)
		const result = await contentClient.query(query)
		const output = createOutput(result as any)
		const blob = new Blob([output], { type: fileType })

		const a = document.createElement('a')
		a.href = URL.createObjectURL(blob)
		a.download = fileName
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
	}, [client, entityName, env, filter])
}

export type DataGridExportButtonProps<V extends {}> =
	& UseDataGridExportArgs<V>
	& {
		children?: React.ReactNode
	}

export const DataGridExportButton = <V extends {}>({ children, ...args }: DataGridExportButtonProps<V>) => {

	const handleExport = useDataGridExport()
	const doExport = useReferentiallyStableCallback(() => handleExport(args))

	return (
		<Button onClick={doExport} variant={'outline'} size={'sm'} className={'gap-2'}>
			<DownloadIcon className={'w-4 h-4'} />
			{children}
		</Button>
	)
}


const resolveFilter = (input?: Filter): Filter<never> => {
	return replaceGraphQlLiteral<unknown>(input) as Filter<never>
}


export const DataGridAutoExport = ({ columns }: { columns: DataGridColumn[] }) => {
	const entityName = useDataViewEntityListProps().entityName
	const filter = useDataViewFilteringState().filter
	const client = useCurrentContentGraphQlClient()


	const env = useEnvironment()
	const doExport = useCallback(async () => {
		const entities = {
			entityName,
			filter,
		}
		const node = (
			<EntityListSubTree entities={entities}>
				{columns.map(it => it.cell)}
			</EntityListSubTree>
		)

		const gen = new MarkerTreeGenerator(node, env)
		const qb = createQueryBuilder(env.getSchema())
		const markerTree = gen.generate()

		const queryGenerator = new QueryGenerator(markerTree, qb)
		const query = queryGenerator.getReadQuery()
		const contentClient = new ContentClient(client)
		const marker = Array.from(markerTree.subTrees.values())[0]
		if (!(marker instanceof EntityListSubTreeMarker)) {
			throw new Error()
		}
		const result = (await contentClient.query(query))[marker.placeholderName]


		const traverseMarkers = (data: any[],  marker: EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker) => {
			const columns: Record<string, any[]> = {}
			for (const subMarker of marker.fields.markers.values()) {
				const values = data.map((it: any) => Array.isArray(it) ? it.flatMap(it => it?.[subMarker.placeholderName]) : it?.[subMarker.placeholderName])

				if (subMarker instanceof FieldMarker) {
					columns[subMarker.placeholderName] = values
				} else if (subMarker instanceof HasOneRelationMarker) {
					for (const [key, value] of Object.entries(traverseMarkers(values, subMarker))) {
						columns[subMarker.parameters.field + ' ' + key] = value
					}
				} else if (subMarker instanceof HasManyRelationMarker) {
					for (const [key, value] of Object.entries(traverseMarkers(values, subMarker))) {
						columns[subMarker.parameters.field + ' ' + key] = value
					}
				}
			}
			return columns
		}

		const toCsv = (data: Record<string, any>) => {
			const keys = Object.keys(data)
			const values = Object.values(data)
			const header = keys.join(',') + '\n'
			const rows = values[0].map((_: {}, index: any) => values.map(it => Array.isArray(it[index]) ? it[index].join(';') : it[index]).join(',')).join('\n')
			return header + rows
		}

		const csv = toCsv(traverseMarkers(result, marker))
		const blob = new Blob([csv], { type: 'text/csv' })

		const a = document.createElement('a')
		a.href = URL.createObjectURL(blob)
		a.download = 'out.csv'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)

	}, [client, columns, entityName, env, filter])

	return (
		<Button onClick={doExport} variant={'outline'} size={'sm'} className={'gap-2'}>
			<DownloadIcon className={'w-4 h-4'} />
			Export
		</Button>
	)
}

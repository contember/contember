import { Component, Entity, EntityListSubTree, Field, useEntity, useEntityListSubTree } from '@contember/interface'
import { SugaredQualifiedEntityList, TreeRootIdProvider, useEntityListSubTreeLoader } from '@contember/react-binding'
import * as React from 'react'
import { useMemo, useState } from 'react'
import { Button } from '@app/lib/ui/button'
import { ChevronDownIcon, ChevronUpIcon, RowsIcon, SearchIcon } from 'lucide-react'
import { Loader } from '@app/lib/ui/loader'
import { Binding } from '@app/lib/binding'
import { DataGrid, DataGridLoader, DataGridToolbar } from '@app/lib/datagrid'
import { DataViewEachRow, DataViewLayout } from '@contember/react-dataview'
import { Dialog, DialogContent, DialogTrigger } from '@app/lib/ui/dialog'

// --- folders - custom component using useEntityListSubTreeLoader
export default () => {
	return (
		<Binding>
			<div className="relative">
				<FolderList parent={null} />
			</div>
		</Binding>
	)
}

const FolderList = Component<{parent: string | null}>(({ parent }) => {
	const entitiesProp = useMemo(() => formatEntities(parent), [parent])
	const entities = useEntityListSubTree(entitiesProp)
	if (entities.length === 0) {
		return <div className="italic">empty folder</div>
	}
	return (
		<div className="grid gap-2">
			{Array.from(entities).map(entity => (
				<Entity accessor={entity} key={entity.id} >
					<Folder />
				</Entity>
			))}
		</div>
	)
}, ({ parent }) => {
	return (
		<EntityListSubTree {...formatEntities(parent)}>
			<Folder />
		</EntityListSubTree>
	)
})

const FolderLoader = ({ parent }: {parent: string}) => {
	const entities = useMemo(() => formatEntities(parent), [parent])
	const [loaderState] = useEntityListSubTreeLoader(entities, useMemo(() => <Folder />, []))
	if (loaderState.state !== 'loaded') {
		return <Loader />
	}
	return (
		<TreeRootIdProvider treeRootId={loaderState.treeRootId}>
			<FolderList parent={parent} />
		</TreeRootIdProvider>
	)
}

const Folder = Component(() => {
	const [expanded, setExpanded] = useState(false)
	const parent = useEntity().idOnServer as string
	return (
		<>
			<div className="flex gap-2 border rounded">
				<Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
					{!expanded ? <ChevronDownIcon size={16} /> : <ChevronUpIcon size={16}/>}
				</Button>
				<span><Field field="name" /></span>
			</div>
			<div className="ml-4">
				{expanded && <FolderLoader parent={parent} />}
			</div>
		</>
	)
}, () => {
	return <>
		<Field field="name" />
	</>
})

// --- folders - custom component using DataView

export const dataview = () => {
	return (
		<Binding>
			<DataViewGrid parent={null} />
		</Binding>
	)
}



const DataViewGrid = Component<{parent: string | null}>(({ parent }) => {
	return (
		<DataGrid
			entities={formatEntities(parent).entities}
			initialSorting={{ name: 'asc' }}
			initialItemsPerPage={9999}
		>
			<DataGridToolbar />

			<DataGridLoader>
				<DataViewLayout name="rows" label={<>
					<RowsIcon className={'w-3 h-3'} />
					<span>Rows</span>
				</>}>
					<div className="grid gap-2">
						<DataViewEachRow>
							<DataViewFolderRow />
						</DataViewEachRow>
					</div>
				</DataViewLayout>

			</DataGridLoader>
		</DataGrid>
	)
})

const DataViewFolderRow = Component(() => {
	const [expanded, setExpanded] = useState(false)
	const parent = useEntity().idOnServer as string
	return (
		<>
			<div className="flex gap-2 border rounded">
				<Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
					{!expanded ? <ChevronDownIcon size={16} /> : <ChevronUpIcon size={16} />}
				</Button>
				<span><Field field="name" /></span>
			</div>

			{expanded && <div className="ml-4 mt-4 border rounded p-2"><DataViewGrid parent={parent} /></div>}
		</>
	)
}, () => {
	return <Field field="name" />
})

// dialog

export const DialogGrid = () => {
	return (
		<Binding>
			<Dialog>
				<DialogTrigger asChild>
					<Button className="gap-2">
						<SearchIcon/> Search
					</Button>
				</DialogTrigger>
				<DialogContent className="h-[60vh]">
					<DialogDataGrid />
				</DialogContent>
			</Dialog>
			<FolderList parent={null} />
		</Binding>
	)
}

const DialogDataGrid = Component(() => {
	return (
		<DataGrid
			entities={'Folder'}
			initialSorting={{ name: 'asc' }}
			initialItemsPerPage={20}
		>
			<DataGridToolbar />

			<DataGridLoader>
				<DataViewLayout name="rows" label={<>
					<RowsIcon className={'w-3 h-3'} />
					<span>Rows</span>
				</>}>
					<div className="grid gap-2">
						<DataViewEachRow>
							<div className="flex gap-2 border rounded">
								<span><Field field="name" /></span>
							</div>
						</DataViewEachRow>
					</div>
				</DataViewLayout>

			</DataGridLoader>
		</DataGrid>
	)
})

// -- common functions

const formatEntities = (parent: string | null): SugaredQualifiedEntityList => {
	return {
		entities: { entityName: 'Folder', filter: { parent: { id: parent ? { eq: parent } : { isNull: true } } } },
		orderBy: 'name asc',
	}
}

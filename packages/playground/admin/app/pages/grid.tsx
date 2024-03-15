import { Component, Field, HasMany } from '@contember/interface'
import { Slots } from '../../lib/components/slots'
import { DataViewHasSelection } from '@contember/react-dataview'
import { DataGrid, DataGridColumns, DataGridRelationFieldTooltip } from '../../lib/components/datagrid'
import * as React from 'react'
import { DefaultDropdown, DropdownMenuItem, DropdownMenuSeparator } from '../../lib/components/ui/dropdown'
import { Binding, DeleteEntityDialog } from '../../lib/components/binding'
import { GridArticleStateLabels } from '../labels'

const GridDropdown = () => (
	<DefaultDropdown>
		<DropdownMenuItem>Edit</DropdownMenuItem>
		<DropdownMenuItem>Make a copy</DropdownMenuItem>
		<DropdownMenuSeparator />
		<DeleteEntityDialog trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
			Delete
		</DropdownMenuItem>} />
	</DefaultDropdown>
)

const GridTile = Component(() => (
	<div className="bg-white rounded-md p-4 shadow-md relative flex flex-col gap-2 border hover:shadow-xl transition-all duration-200">
		<div className={'absolute top-0 right-0'}>
			<GridDropdown />
		</div>
		<h2 className="text-lg font-semibold">
			<Field field="title" />
		</h2>
		<div className="text-sm text-gray-500">
			<Field field="state" />
		</div>

		<div className={'flex -mx-2'}>
			<DataViewHasSelection name={'tags'}>
				<HasMany field="tags">
					<DataGridRelationFieldTooltip filter={'tags'}>
						<Field field="name" />
					</DataGridRelationFieldTooltip>
				</HasMany>
			</DataViewHasSelection>
		</div>
	</div>
))


export default () => (
	<>
		<Slots.Title>
			<h1 className="text-3xl font-semibold">
				Articles
			</h1>
		</Slots.Title>

		<Binding>
			<DataGrid
				entities="GridArticle"
				tile={<GridTile />}
				lastColumnActions={<GridDropdown />}
				columns={[
					DataGridColumns.text({ field: 'title', label: 'Title' }),
					DataGridColumns.enum({ field: 'state', label: 'State', options: GridArticleStateLabels }),
					DataGridColumns.date({ field: 'publishedAt', label: 'Published at' }),
					DataGridColumns.hasOne({ field: 'author', valueField: 'name', label: 'Author' }),
					DataGridColumns.hasOne({ field: 'category', valueField: 'name', label: 'Category' }),
					DataGridColumns.hasMany({ field: 'tags', valueField: 'name', label: 'Tags' }),
					DataGridColumns.boolean({ field: 'locked', label: 'Locked' }),
					DataGridColumns.number({ field: 'views', label: 'Views' }),
				]}
			/>

		</Binding>
	</>
)

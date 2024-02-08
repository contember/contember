import { Component, Field, HasMany } from '@contember/interface'
import { Slots } from '../components/slots'
import { DataViewHasSelection } from '@contember/react-dataview'
import { DataViewColumns, DataViewRelationFieldTooltip, DefaultDataGrid } from '../components/datagrid'
import * as React from 'react'
import { DefaultDropdown, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown'
import { DeleteEntityDialog } from '../components/binding/DeleteEntityDialog'
import { Binding } from '../components/binding/Binding'
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
					<DataViewRelationFieldTooltip filter={'tags'}>
						<Field field="name" />
					</DataViewRelationFieldTooltip>
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
			<DefaultDataGrid
				entities="GridArticle"
				tile={<GridTile />}
				lastColumnActions={<GridDropdown />}
				columns={[
					DataViewColumns.text({ field: 'title', label: 'Title' }),
					DataViewColumns.enum({ field: 'state', label: 'State', options: GridArticleStateLabels }),
					DataViewColumns.date({ field: 'publishedAt', label: 'Published at' }),
					DataViewColumns.hasOne({ field: 'author', valueField: 'name', label: 'Author', filterOptions: 'GridAuthor' }),
					DataViewColumns.hasOne({ field: 'category', valueField: 'name', label: 'Category', filterOptions: 'GridCategory' }),
					DataViewColumns.hasMany({ field: 'tags', valueField: 'name', label: 'Tags', filterOptions: 'GridTag' }),
					DataViewColumns.boolean({ field: 'locked', label: 'Locked' }),
					DataViewColumns.number({ field: 'views', label: 'Views' }),
				]}
			/>

		</Binding>
	</>
)

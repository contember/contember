import { Component, Field, HasMany, If } from '@contember/interface'
import { Slots } from '../../lib/components/slots'
import { createHasManyFilter, DataView, DataViewEachRow, DataViewHasSelection } from '@contember/react-dataview'
import {
	DataGrid,
	DataGridBooleanFilter,
	DataGridColumns,
	DataGridDateFilter,
	DataGridEnumFilter,
	DataGridHasManyFilter,
	DataGridHasOneFilter,
	DataGridLoader,
	DataGridNumberFilter,
	DataGridPagination,
	DataGridPerPageSelector,
	DataGridQueryFilter,
	DataGridRelationFieldTooltip,
	DataGridTextFilter,
} from '../../lib/components/datagrid'
import * as React from 'react'
import { DefaultDropdown, DropdownMenuItem, DropdownMenuSeparator } from '../../lib/components/ui/dropdown'
import { Binding, DeleteEntityDialog } from '../../lib/components/binding'
import { GridArticleStateLabels } from '../labels'
import { formatDate } from '../../lib/utils/formatting'
import { Button } from '../../lib/components/ui/button'
import { EyeIcon, LockIcon, MessageSquareIcon, SettingsIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../../lib/components/ui/popover'
import { DataGridToolbarVisibleFields } from '../../lib/components/datagrid/columns-hiding'


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
						<Button variant={'ghost'} size={'sm'}>
							<Field field="name" />
						</Button>
					</DataGridRelationFieldTooltip>
				</HasMany>
			</DataViewHasSelection>
		</div>
	</div>
))

const filters = <>
	<DataGridQueryFilter />
	<DataGridEnumFilter field={'state'} options={GridArticleStateLabels} label="State" />
	<DataGridDateFilter field={'publishedAt'} label="Published at" />
	<DataGridHasOneFilter field={'author'} label="Author">
		<Field field="name" />
	</DataGridHasOneFilter>
	<Popover>
		<PopoverTrigger asChild>
			<Button className="h-auto" variant={'outline'}>More filters</Button>
		</PopoverTrigger>
		<PopoverContent>
			<div className="flex flex-col gap-2">
				<DataGridHasOneFilter field={'category'} label="Category">
					<Field field="name" />
				</DataGridHasOneFilter>
				<DataGridHasManyFilter field={'tags'} label="Tags">
					<Field field="name" />
				</DataGridHasManyFilter>
				<DataGridHasManyFilter field={'comments.author'} label="Comment authors">
					<Field field="name" />
				</DataGridHasManyFilter>
				<DataGridBooleanFilter field={'locked'} label="Locked" />
				<DataGridNumberFilter field={'views'} label="Views" />
			</div>
		</PopoverContent>
	</Popover>
</>
const columns = [
	DataGridColumns.text({ field: 'title', label: 'Title' }),
	DataGridColumns.enum({ field: 'state', label: 'State', options: GridArticleStateLabels }),
	DataGridColumns.date({ field: 'publishedAt', label: 'Published at' }),
	DataGridColumns.hasOne({ field: 'author', valueField: 'name', label: 'Author', filterOptions: 'GridAuthor' }),
	DataGridColumns.hasOne({ field: 'category', valueField: 'name', label: 'Category', filterOptions: 'GridCategory' }),
	DataGridColumns.hasMany({ field: 'tags', valueField: 'name', label: 'Tags', filterOptions: 'GridTag' }),
	DataGridColumns.hasMany({ field: 'comments', valueField: 'author.name', label: 'Comment authors', filterOptions: 'GridAuthor', filterHandler: createHasManyFilter('comments.author'), filterOption: <Field field="name" /> }),
	DataGridColumns.boolean({ field: 'locked', label: 'Locked' }),
	DataGridColumns.number({ field: 'views', label: 'Views' }),
]

export default () => {
	return (
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
					initialSorting={{
						publishedAt: 'asc',
					}}
					columns={columns}
				/>
			</Binding>
		</>
	)
}


export const customFilters = () => {
	return (
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
					initialSorting={{
						publishedAt: 'asc',
					}}
					filters={filters}
					columns={columns}
				/>
			</Binding>
		</>
	)
}


const CustomGridRow = Component(() => (
	<div className="flex px-4 py-2 border-b last:border-b-0 hover:bg-gray-50">
		<div className="w-20 flex items-center justify-center flex-col gap-2">
			<div className="inline-flex gap-2 text-xs text-gray-600 font-bold">
				<Field field="state" />
			</div>
			<If condition="[locked = true]">
				<LockIcon className="w-4 h-4" />
			</If>
		</div>
		<div className="flex flex-col">
			<div className="flex gap-2">
				<DataViewHasSelection name={'category'}>
					<DataGridRelationFieldTooltip filter={'Category'}>
						<button className="text-lg font-semibold text-gray-600">
							<Field field="category.name" />
						</button>
					</DataGridRelationFieldTooltip>
				</DataViewHasSelection>
				<span className="text-lg font-bold"><Field field="title" /></span>
				<DataViewHasSelection name={'tags'}>
					<HasMany field="tags">
						<DataGridRelationFieldTooltip filter={'tags'}>
							<button className="text-sm border rounded px-2 py-1">
								<Field field="name" />
							</button>
						</DataGridRelationFieldTooltip>
					</HasMany>
				</DataViewHasSelection>
			</div>
			<div className="flex gap-2 text-sm text-gray-500">
				published <Field field="publishedAt" format={formatDate} /> by <span className="font-semibold"><Field field="author.name" /></span>
			</div>
		</div>
		<div className="flex flex-col text-gray-500 text-sm ml-auto">

			<div className="inline-flex gap-2">
				<EyeIcon className="w-4 h-4" />
				<Field<number> field="views" format={it => it ?? 0} />
			</div>
			<div className="inline-flex gap-2">
				<MessageSquareIcon className="w-4 h-4" />
				<HasMany field="comments" listComponent={({ accessor }) => accessor.length} />
			</div>
		</div>
	</div>
))

export const customGrid = () => (
	<>
		<Slots.Title>
			<h1 className="text-3xl font-semibold">
				Articles
			</h1>
		</Slots.Title>

		<Binding>

			<DataView entities="GridArticle">
				<div className="rounded-md border">
					<div className="flex gap-2 bg-gray-100 px-4 py-2 border-b items-end">
						<div className="flex flex-wrap gap-2">
							{filters}
						</div>
						<div className="ml-auto">
							<Popover>
								<PopoverTrigger>
									<Button variant={'outline'} size={'sm'} className={'gap-2'}>
										<SettingsIcon className={'w-4 h-4'} />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-64">
									<div className="flex flex-col gap-2">
										<DataGridToolbarVisibleFields fields={[
											{ header: 'Tags', name: 'tags' },
											{ header: 'Category', name: 'category' },
										]} />
										<DataGridPerPageSelector />
									</div>

								</PopoverContent>
							</Popover>
						</div>
					</div>

					<DataGridLoader>
						<DataViewEachRow>
							<CustomGridRow />

						</DataViewEachRow>
					</DataGridLoader>
				</div>

				<DataGridPagination />

			</DataView>

		</Binding>
	</>
)

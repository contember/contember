import { Component, Field, HasMany, HasOne, If } from '@contember/interface'
import { Slots } from '~/lib/layout'
import { DataViewEachRow, DataViewElement, DataViewLayout } from '@contember/react-dataview'
import {
	createDataGridDateRange,
	DataGrid,
	DataGridActionColumn,
	DataGridBooleanColumn,
	DataGridBooleanFilter,
	DataGridColumn,
	DataGridDateColumn,
	DataGridDateFilter,
	DataGridEnumColumn,
	DataGridEnumFilter,
	DataGridHasManyColumn,
	DataGridHasManyFilter,
	DataGridHasManyTooltip,
	DataGridHasOneColumn,
	DataGridHasOneFilter,
	DataGridHasOneTooltip,
	DataGridIsDefinedColumn,
	DataGridIsDefinedFilter,
	DataGridLoader,
	DataGridNumberColumn,
	DataGridNumberFilter,
	DataGridPagination,
	DataGridQueryFilter,
	DataGridTable,
	DataGridTextColumn,
	DataGridTiles,
	DataGridToolbar,
	DefaultDataGrid,
} from '~/lib/datagrid'
import * as React from 'react'
import { DefaultDropdown, DropdownMenuItem, DropdownMenuSeparator } from '~/lib/ui/dropdown'
import { Binding, DeleteEntityDialog } from '~/lib/binding'
import { GridArticleStateLabels } from '../labels'
import { formatDate } from '~/lib/formatting'
import { Button } from '~/lib/ui/button'
import { EyeIcon, LockIcon, MessageSquareIcon, RowsIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '~/lib/ui/popover'

export const SimpleGrid = () => {
	return (
		<>
			<Slots.Title>
				<h1 className="text-3xl font-semibold">Articles</h1>
			</Slots.Title>

			<Binding>

				<DefaultDataGrid
					entities="GridArticle"
					initialSelection={{
						visibility: {
							state: false,
						},
					}}
				>
					<DataGridActionColumn><Button>Show detail</Button></DataGridActionColumn>
					<DataGridTextColumn header="Title" field="title" />
					<DataGridEnumColumn header="State" field="state" options={GridArticleStateLabels} />
				</DefaultDataGrid>
			</Binding>
		</>
	)
}

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
					initialSorting={{
						publishedAt: 'asc',
					}}
				>
					<DataGridToolbar>
						<CustomGridFilters />
					</DataGridToolbar>

					<DataGridLoader>

						<DataGridTable>
							<CustomGridColumn />
						</DataGridTable>

						<DataGridTiles>
							<CustomGridTile />
						</DataGridTiles>

						<DataViewLayout name="rows" label={(
							<>
								<RowsIcon className="w-3 h-3" />
								<span>Rows</span>
							</>
						)}>
							<DataViewEachRow>
								<CustomGridRow />

							</DataViewEachRow>
						</DataViewLayout>

					</DataGridLoader>

					<DataGridPagination />
				</DataGrid>
			</Binding>
		</>
	)
}

const CustomGridColumn = Component(() => {
	return <>
		<DataGridActionColumn><Button>Show detail</Button></DataGridActionColumn>

		<DataGridTextColumn header="Title" field="title" />

		<DataGridEnumColumn field="state" />

		<DataGridDateColumn header="Published at" field="publishedAt" />

		<DataGridHasOneColumn header="Author" field="author">
			<Field field="name" />
		</DataGridHasOneColumn>

		<DataGridHasOneColumn header="Category" field="category">
			<Field field="name" />
		</DataGridHasOneColumn>

		<DataGridHasManyColumn header="Tags" field="tags">
			<Field field="name" />
		</DataGridHasManyColumn>

		<DataGridColumn header="Comment authors">
			<div className="flex flex-wrap gap-2">
				<HasMany field="comments">
					<HasOne field="author">
						<DataGridHasManyTooltip field="comments.author">
							<span className="cursor-pointer border-dashed border-b border-b-gray-400 hover:border-gray-800">
								<Field field="name" />
							</span>
						</DataGridHasManyTooltip>
					</HasOne>
				</HasMany>
			</div>
		</DataGridColumn>

		<DataGridBooleanColumn header="Locked" field="locked" />
		<DataGridNumberColumn header="Views" field="views" />
		<DataGridIsDefinedColumn header="Is published" field="publishedAt" filterName="publishedAt__defined" />

		<DataGridActionColumn>
			<GridDropdown />
		</DataGridActionColumn>
	</>
})

const CustomGridFilters = Component(() => {
	return (
		<>
			<DataGridQueryFilter />
			<DataGridEnumFilter field="state" />
			<DataGridIsDefinedFilter field="publishedAt" label="Is published" name="publishedAt__defined" />
			<DataGridDateFilter
				field="publishedAt"
				label="Published at"
				ranges={[
					createDataGridDateRange('Today', 0, 0),
					createDataGridDateRange('Last 7 days', -7, 0),
					createDataGridDateRange('Last 30 days', -30, 0),
					createDataGridDateRange('Last 90 days', -90, 0),
				]}
			/>
			<DataGridHasOneFilter field="author" label="Author">
				<Field field="name" />
			</DataGridHasOneFilter>
			<Popover>
				<PopoverTrigger asChild>
					<Button className="h-auto" variant="outline">More filters</Button>
				</PopoverTrigger>
				<PopoverContent>
					<div className="flex flex-col gap-2">
						<DataGridHasOneFilter field="category" label="Category">
							<Field field="name" />
						</DataGridHasOneFilter>
						<DataGridHasManyFilter field="tags" label="Tags">
							<Field field="name" />
						</DataGridHasManyFilter>
						<DataGridHasManyFilter field="comments.author" label="Comment authors">
							<Field field="name" />
						</DataGridHasManyFilter>
						<DataGridBooleanFilter field="locked" label="Locked" />
						<DataGridNumberFilter field="views" label="Views" />
					</div>
				</PopoverContent>
			</Popover>
		</>
	)
})


const CustomGridTile = Component(() => (
	<div className="bg-white rounded-md p-4 shadow-md relative flex flex-col gap-2 border hover:shadow-xl transition-all duration-200">
		<div className="absolute top-0 right-0">
			<GridDropdown />
		</div>
		<h2 className="text-lg font-semibold">
			<Field field="title" />
		</h2>
		<div className="text-sm text-gray-500">
			<Field field="state" />
		</div>

		<div className="flex -mx-2">
			<DataViewElement name="tags" label="Tags">
				<HasMany field="tags">
					<DataGridHasManyTooltip field="tags">
						<Button variant="ghost" size="sm">
							<Field field="name" />
						</Button>
					</DataGridHasManyTooltip>
				</HasMany>
			</DataViewElement>
		</div>
	</div>
))

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

				<DataViewElement name="category" label="Category">
					<HasOne field="category">
						<DataGridHasOneTooltip field="category">
							<button className="text-lg font-semibold text-gray-600">
								<Field field="name" />
							</button>
						</DataGridHasOneTooltip>
					</HasOne>
				</DataViewElement>

				<span className="text-lg font-bold"><Field field="title" /></span>
				<DataViewElement name="tags" label="Tags">
					<HasMany field="tags">
						<DataGridHasManyTooltip field="tags">
							<button className="text-sm border rounded px-2 py-1">
								<Field field="name" />
							</button>
						</DataGridHasManyTooltip>
					</HasMany>
				</DataViewElement>
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
				<Field field="details.commentsCount" />
			</div>
		</div>
	</div>
))


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

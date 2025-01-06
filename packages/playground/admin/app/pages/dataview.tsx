import { Binding } from '~/lib/binding'
import { Slots } from '~/lib/layout'
import {
	DataView,
	DataViewChangePageTrigger,
	DataViewEachRow,
	DataViewFilterScope,
	DataViewLoaderState,
	DataViewQueryFilterName,
	DataViewTextFilterInput,
} from '@contember/react-dataview'
import * as React from 'react'
import { Field, HasMany, Link } from '@contember/interface'
import { formatDate } from '~/lib/formatting'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/lib/ui/table'
import { Button } from '~/lib/ui/button'
import { Input } from '~/lib/ui/input'

export default () => {
	return (
		<>
			<Slots.Title>
				<h1 className="text-3xl font-semibold">
					Articles
				</h1>
			</Slots.Title>
			<p>
				Minimal example of DataView. For most cases, you will want to use <Link to="grid"><a className="underline">DataGrid</a></Link> instead.
			</p>

			<Binding>

				<DataView
					entities="GridArticle"
					initialSorting={{
						publishedAt: 'asc',
					}}
					initialItemsPerPage={10}
				>
					<div>
						<DataViewFilterScope name={DataViewQueryFilterName}>
							<DataViewTextFilterInput>
								<Input />
							</DataViewTextFilterInput>
						</DataViewFilterScope>

					</div>
					<DataViewLoaderState refreshing initial>
						Loading...
					</DataViewLoaderState>
					<DataViewLoaderState failed>
						Failed to load data
					</DataViewLoaderState>
					<DataViewLoaderState loaded>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Title</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Tags</TableHead>
									<TableHead>Published at</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								<DataViewEachRow>
									<TableRow>
										<TableCell>
											<Field field="title" />
										</TableCell>
										<TableCell>
											<Field field="category.name" />
										</TableCell>
										<TableCell>
											<HasMany field="tags">
												<Field field="name" />{', '}
											</HasMany>
										</TableCell>
										<TableCell>
											<Field field="publishedAt" format={formatDate} />
										</TableCell>
									</TableRow>
								</DataViewEachRow>
							</TableBody>
						</Table>
					</DataViewLoaderState>


					<div className="flex gap-2">
						<DataViewChangePageTrigger page="previous">
							<Button>
								Prev
							</Button>
						</DataViewChangePageTrigger>
						<DataViewChangePageTrigger page="next">
							<Button>
								Next
							</Button>
						</DataViewChangePageTrigger>
					</div>
				</DataView>
			</Binding>
		</>
	)
}

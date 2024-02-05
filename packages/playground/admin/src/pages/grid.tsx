import { Field, HasMany, HasOne, Link } from '@contember/interface'
import { Slots } from '../components/slots'
import {
	createBooleanFilter,
	createDateFilter,
	createEnumFilter,
	createHasManyFilter,
	createHasOneFilter,
	createTextFilter,
	DataView,
	DataViewEachRow,
	DataViewEmpty,
	DataViewHasSelection,
	DataViewLoaderState,
	DataViewNonEmpty,
	DataViewSelectionTrigger,
} from '@contember/react-dataview'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import {
	DataTablePagination,
	DataViewColumnHeader,
	DataViewLoaderOverlay,
	DataViewNoResultsRow,
	DataViewRelationFieldTooltip,
	DataViewRelationFilterSelect,
	DataViewTextFilter,
	DefaultDataViewRelationFilterList,
} from '../components/datagrid'
import * as React from 'react'
import { DefaultDropdown, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown'
import { DeleteEntityDialog } from '../components/binding/DeleteEntityDialog'
import { Binding } from '../components/binding/Binding'
import { EyeIcon } from 'lucide-react'
import { Button } from '../components/ui/button'


export default () => (
	<>
		<Slots.Title>
			<h1 className="text-3xl font-semibold">
				Articles
			</h1>
		</Slots.Title>

		<Binding>

			<DataView
				entities="GridArticle"
				initialItemsPerPage={5}
				initialSelection={{
					layout: 'table',
				}}
				filterTypes={{
					title: createTextFilter('title'),
					state: createEnumFilter('state'),
					category: createHasOneFilter('category'),
					author: createHasOneFilter('author'),
					tags: createHasManyFilter('tags'),
					locked: createBooleanFilter('locked'),
					publishedAt: createDateFilter('publishedAt'),
				}}
			>
				<div className="space-y-4">
					<div className={'flex gap-2 items-center'}>
						<DataViewTextFilter name={'title'} />

						<div className={'flex gap-2 rounded bg-gray-50 items-center text-sm px-2 py-2 border'}>
							<span className={'text-xs font-semibold'}>
								Category
							</span>
							<DataViewRelationFilterSelect name={'category'}>
								<Field field={'name'} />
							</DataViewRelationFilterSelect>
							<DefaultDataViewRelationFilterList name={'category'} options={'GridCategory'}>
								<Field field="name" />
							</DefaultDataViewRelationFilterList>
						</div>

						<DefaultDataViewRelationFilterList name={'author'} options={'GridAuthor'}>
							<Field field="name" />
						</DefaultDataViewRelationFilterList>



						<DefaultDataViewRelationFilterList name={'tags'} options={'GridTag'}>
							<Field field="name" />
						</DefaultDataViewRelationFilterList>

						<DataViewHasSelection name={'tags'} value={false}>
							<DataViewSelectionTrigger name={'tags'} value={undefined}>
								<Button variant={'outline'} size={'sm'}>
									<EyeIcon className={'w-3 h-3'} />
									<span>Show tags</span>
								</Button>
							</DataViewSelectionTrigger>
						</DataViewHasSelection>

					</div>
					<DataViewLoaderState refreshing loaded>
						<div className="relative">
							<DataViewLoaderState refreshing>
								<DataViewLoaderOverlay />
							</DataViewLoaderState>
							<DataViewNonEmpty>

								<DataViewHasSelection name={'layout'} value={'grid'}>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<DataViewEachRow>
											<div
												className="bg-white rounded-md p-4 shadow-md relative flex flex-col gap-2 border hover:shadow-xl transition-all duration-200">
												<div className={'absolute top-0 right-0'}>
													<DefaultDropdown>
														<DropdownMenuItem>Edit</DropdownMenuItem>
														<DropdownMenuItem>Make a copy</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DeleteEntityDialog trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
															Delete
														</DropdownMenuItem>} />
													</DefaultDropdown>

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
										</DataViewEachRow>
									</div>
								</DataViewHasSelection>

								<DataViewHasSelection name={'layout'} value={'table'}>
									<div className={'rounded-md border '}>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>
														<DataViewColumnHeader field={'title'} enableOrdering>
															Title
														</DataViewColumnHeader>
													</TableHead>
													<TableHead>
														<DataViewColumnHeader field={'state'} enableOrdering>
															State
														</DataViewColumnHeader>
													</TableHead>
													<TableHead>
														<DataViewColumnHeader field={'publishedAt'} enableOrdering>
															Published at
														</DataViewColumnHeader>
													</TableHead>
													<TableHead>
														<DataViewColumnHeader field={'author.name'} enableOrdering>
															Author
														</DataViewColumnHeader>
													</TableHead>
													<TableHead>
														<DataViewColumnHeader field={'category.name'} enableOrdering>
															Category
														</DataViewColumnHeader>
													</TableHead>
													<DataViewHasSelection name={'tags'}>
														<TableHead>
															<DataViewColumnHeader field={'tags'} enableHiding>
																Tags
															</DataViewColumnHeader>
														</TableHead>
													</DataViewHasSelection>
													<TableHead>
														<DataViewColumnHeader field={'locked'} enableOrdering>
															Locked
														</DataViewColumnHeader>
													</TableHead>
													<TableHead align={'right'}>
														Actions
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												<DataViewEachRow>
													<TableRow>
														<TableCell>
															<Field field="title" />
														</TableCell>
														<TableCell>
															<Field field="state" />
														</TableCell>
														<TableCell>
															<Field field="publishedAt" />
														</TableCell>
														<TableCell>
															<HasOne field={'author'}>
																<Field field="name" />
															</HasOne>
														</TableCell>
														<TableCell>
															<HasOne field={'category'}>
																<DataViewRelationFieldTooltip filter={'category'} actions={<>
																	<Link to={'category/detail(id: $entity.id)'}>
																		<Button variant={'outline'} size={'sm'} className={'space-x-1'}>
																			<EyeIcon className={'w-3 h-3'} />
																			<span>Open</span>
																		</Button>
																	</Link>
																</>}>
																	<Field field="name" />
																</DataViewRelationFieldTooltip>
															</HasOne>
														</TableCell>
														<DataViewHasSelection name={'tags'}>
															<TableCell>
																<div>
																	<HasMany field="tags">
																		<DataViewRelationFieldTooltip filter={'tags'}>
																			<Field field="name" />
																		</DataViewRelationFieldTooltip>
																	</HasMany>
																</div>
															</TableCell>
														</DataViewHasSelection>
														<TableCell>
															<Field field="locked" />
														</TableCell>

														<TableCell align={'right'}>
															<DefaultDropdown>
																<DropdownMenuItem>Edit</DropdownMenuItem>
																<DropdownMenuItem>Make a copy</DropdownMenuItem>
																<DropdownMenuSeparator />
																<DeleteEntityDialog
																	trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
																		Delete
																	</DropdownMenuItem>} />
															</DefaultDropdown>
														</TableCell>
													</TableRow>
												</DataViewEachRow>
											</TableBody>
										</Table>
									</div>
								</DataViewHasSelection>

							</DataViewNonEmpty>


							<DataViewEmpty>
								<DataViewNoResultsRow />
							</DataViewEmpty>
						</div>
					</DataViewLoaderState>
					<DataViewLoaderState initial>
						Loading...
					</DataViewLoaderState>
					<DataTablePagination />
				</div>
			</DataView>
		</Binding>
	</>
)

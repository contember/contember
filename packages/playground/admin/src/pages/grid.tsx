import { DataBindingProvider, DeleteEntityTrigger, Field } from '@contember/interface'
import { MoreHorizontalIcon } from 'lucide-react'
import { Slot } from '../components/slots'
import {
	createTextFilter,
	DataView,
	DataViewEachRow,
	DataViewEmpty,
	DataViewLoaderState,
	TextFilterArtifacts,
	useDataViewFilteringMethods,
	useDataViewFilteringState,
} from '@contember/react-dataview'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { DataTableColumnHeader, DataTablePagination } from '../components/datagrid'
import * as React from 'react'
import { ChangeEvent, useCallback } from 'react'
import { Input } from '../components/ui/input'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropDownTriggerButton,
} from '../components/ui/dropdown'
import { Button } from '../components/ui/button'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '../components/ui/dialog'



const GridTextFilter = () => {
	const filterState = useDataViewFilteringState()
	const { setFilter } = useDataViewFilteringMethods()
	const cb = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setFilter<TextFilterArtifacts>('title', it => ({
			...it,
			nullCondition: false,
			mode: 'matches',
			query: e.target.value,
		}))
	}, [setFilter])

	return <Input placeholder="Filter articles..." value={((filterState).artifact.title as any)?.query ?? ''} onChange={cb} />
}

export const list = () => (
	<>
		<Slot.Title>Articles</Slot.Title>
		<DataBindingProvider>
			<DataView
				entities="Article"
				initialItemsPerPage={5}
				filterTypes={{
					title: createTextFilter('title'),
				}}
			>
				<div className="space-y-4">
					{/*<DataTableToolbar table={table} />*/}
					<GridTextFilter />
					<DataViewLoaderState refreshing loaded>
						<div className="rounded-md border relative">
							<DataViewLoaderState refreshing>
								<div
									className={'absolute top-0 left-0 right-0 bottom-0 bg-white bg-opacity-50 backdrop-blur-sm'}>&nbsp;</div>
								<div className={'absolute inset-0 flex items-center justify-center'}>
									<p className={'text-muted-foreground'}>Loading...</p>
								</div>
							</DataViewLoaderState>

							<Table>
								<TableHeader>
									<TableHead>
										<DataTableColumnHeader field={'title'} enableOrdering>
											Title
										</DataTableColumnHeader>
									</TableHead>
									<TableHead>
									</TableHead>
								</TableHeader>
								<TableBody>
									<DataViewEachRow>
										<TableRow>
											<TableCell>
												<Field field="title" />
											</TableCell>
											<TableCell align={'right'}>

												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<DropDownTriggerButton />
													</DropdownMenuTrigger>
													<DropdownMenuContent className="w-[160px]">
														<DropdownMenuItem>Edit</DropdownMenuItem>
														<DropdownMenuItem>Make a copy</DropdownMenuItem>
														<DropdownMenuSeparator />
														<AlertDialog>
															<AlertDialogTrigger asChild>
																<DropdownMenuItem onSelect={e => e.preventDefault()}>
																	Delete
																</DropdownMenuItem>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
																	<AlertDialogDescription>
																		This action cannot be undone.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Cancel</AlertDialogCancel>

																	<DeleteEntityTrigger immediatePersist>
																		<AlertDialogAction asChild><Button
																			variant={'destructive'}>Confirm</Button></AlertDialogAction>
																	</DeleteEntityTrigger>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									</DataViewEachRow>
									<DataViewEmpty>
										<TableRow>
											<TableCell
												colSpan={2}
												className="h-24 text-center"
											>
												No results.
											</TableCell>
										</TableRow>
									</DataViewEmpty>
								</TableBody>
							</Table>

						</div>
					</DataViewLoaderState>
					<DataViewLoaderState initial>
						Loading...
					</DataViewLoaderState>
					<DataTablePagination />
				</div>
			</DataView>
		</DataBindingProvider>
	</>
)

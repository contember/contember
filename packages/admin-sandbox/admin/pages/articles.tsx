import {
	CreateNewEntityButton,
	CreateScope,
	DataBindingProvider,
	DataGridScope,
	DeleteEntityButton,
	Dropdown,
	DropdownProps,
	EditScope,
	EnumCell,
	FeedbackRenderer,
	Field,
	FieldView,
	HasManySelectCell,
	HasOneSelectCell,
	LinkButton,
	MultiEditScope,
	NavigateBackLink,
	NumberCell,
	noop,
	PersistButton,
	RepeaterItem,
	RepeaterItemProps,
	SideDimensions,
	Stack,
	TextCell,
	TextField,
    GenericCell,
    AnchorButton,
} from '@contember/admin'
import { MoreHorizontalIcon, MoreVerticalIcon } from 'lucide-react'
import { CategoryForm } from '../components/CategoryForm'
import { Directive } from '../components/Directives'
import { EditOrCreateForm } from '../components/EditOrCreateForm'
import { SlotSources } from '../components/Slots'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { DataTableColumnHeader } from './ui/datagrid/column-header'
import { DataTablePagination } from './ui/datagrid/pagination'
import * as React from 'react'
import { ChangeEvent, useCallback, useEffect } from 'react'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown'
import { Button } from './ui/button'
import { DeleteEntityTrigger } from './headless/DeleteEntityTrigger'
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
} from './ui/dialog'
import { DataGridTile } from '../components/DataGridTile'


const stateOptions = {
	draft: 'Draft',
	published: 'Published',
	removed: 'Removed',
}


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
		<SlotSources.Title>Articles</SlotSources.Title>
		<Directive name="content-max-width" content={null} />
		<SlotSources.Actions><LinkButton to="articles/create">Add article</LinkButton></SlotSources.Actions>

		<DataGridScope
			entities="Article"
			itemsPerPage={5}
			tile={(
				<DataGridTile
					to="articles/edit(id: $entity.id)"
					thumbnailField="image.url"
					titleField="title"
				/>
			)}
			tileSize={100}
		>
			<TextCell field="title" header="Title" />
			<TextCell field="content" header="Content" />
			<HasOneSelectCell field="category" options={`Category.locales(locale.code = 'cs').name`} header="Category" />
			<HasManySelectCell field="tags" options={`Tag.locales(locale.code = 'cs').name`} header="Tags" />
			<EnumCell field={'state'} options={stateOptions} header={'State'} />
			<NumberCell field="number" header="Number" />
			<GenericCell canBeHidden={false} justification="justifyEnd">
				<LinkButton to={`articles/edit(id: $entity.id)`} Component={AnchorButton}>Edit</LinkButton>
				<DeleteEntityButton title="Delete" immediatePersist={true} />
			</GenericCell>

		</DataGridScope>
		<DataBindingProvider stateComponent={FeedbackRenderer}>
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
														<Button
															variant="ghost"
															className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
														>
															<MoreHorizontalIcon className="h-4 w-4" />
															<span className="sr-only">Open menu</span>
														</Button>
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

export const create = (
	<>
		<SlotSources.Back>
			<NavigateBackLink to="articles/list">Back to articles</NavigateBackLink>
		</SlotSources.Back>
		<SlotSources.Title>New Article</SlotSources.Title>
		<CreateScope entity="Article" redirectOnSuccess="articles/edit(id: $entity.id)">
			<EditOrCreateForm />
		</CreateScope>
	</>
)

const buttonProps: DropdownProps['buttonProps'] = { distinction: 'seamless', children: <MoreVerticalIcon /> }

export const edit = () => (
	<>
		<SlotSources.Back>
			<NavigateBackLink to="articles/list">Back to articles</NavigateBackLink>
		</SlotSources.Back>
		<EditScope
			entity="Article(id = $id)"
			redirectOnSuccess={(current, ids, entity) => !entity.existsOnServer ? 'articles/list' : undefined}
		>
			<FieldView field="title" render={title => (
				<SlotSources.Title>{`Edit ${title.getAccessor().value ? title.getAccessor().value : 'Article'}`}</SlotSources.Title>
			)} />

			<EditOrCreateForm />

			<SlotSources.Actions>
				<Dropdown buttonProps={buttonProps}>
					<DeleteEntityButton immediatePersist={true} />
				</Dropdown>
			</SlotSources.Actions>
		</EditScope>
	</>
)

export const categories = () => (
	<>
		<SlotSources.Title>Categories</SlotSources.Title>

		<MultiEditScope entities="Category" listProps={{
			sortableBy: 'order',
			beforeContent: <SlotSources.Actions><PersistButton /></SlotSources.Actions>,
		}}>
			<CategoryForm />
		</MultiEditScope>
	</>
)

const CustomRepeaterItem = (props: RepeaterItemProps) => {
	return (
		<Stack gap="gap">
			<CreateNewEntityButton createNewEntity={noop}
								   onClick={() => props.createNewEntity(undefined, props.index)}>Locales</CreateNewEntityButton>
			<RepeaterItem {...props} />
		</Stack>
	)
}

export const tags = () => (
	<>
		<SlotSources.Title>Tags</SlotSources.Title>

		<MultiEditScope entities="Tag" listProps={{ beforeContent: <SlotSources.Actions><PersistButton /></SlotSources.Actions> }}>
			<TextField field={'name'} label="Default name" />
			<Stack horizontal evenly>
				<SideDimensions dimension="locale" hasOneField="locales(locale.code=$currentLocale)" variableName="currentLocale">
					<TextField field="name" label="Name" />
				</SideDimensions>
			</Stack>
			{/* <Repeater field={'locales'} label={'Locales'} sortableBy={'order'} itemComponent={CustomRepeaterItem} containerComponentExtraProps={{ className: 'locales-list' }} itemComponentExtraProps={{ className: 'locale-list-item' }}>
				<SelectField label={'Locale'} options={'Locale.code'} field={'locale'}
					createNewForm={<TextField field={'code'} label={'Locale code'} />} />
				<TextField field={'name'} label={'Name'} />
			</Repeater> */}
		</MultiEditScope>
	</>
)

export default list

import {
	AnchorButton,
	CreateNewEntityButton,
	CreateScope,
	DataGridScope,
	DeleteEntityButton,
	Dropdown,
	DropdownProps,
	EditScope,
	EnumCell,
	FieldView,
	GenericCell,
	HasManySelectCell,
	HasOneSelectCell,
	LinkButton,
	MultiEditScope,
	NavigateBackLink,
	noop,
	NumberCell,
	PersistButton,
	RepeaterItem,
	RepeaterItemProps,
	SideDimensions,
	Stack,
	TextCell,
	TextField,
} from '@contember/admin'
import { MoreVerticalIcon } from 'lucide-react'
import { CategoryForm } from '../components/CategoryForm'
import { Directive } from '../components/Directives'
import { EditOrCreateForm } from '../components/EditOrCreateForm'
import { SlotSources } from '../components/Slots'

import * as React from 'react'
import { DataGridTile } from '../components/DataGridTile'


const stateOptions = {
	draft: 'Draft',
	published: 'Published',
	removed: 'Removed',
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

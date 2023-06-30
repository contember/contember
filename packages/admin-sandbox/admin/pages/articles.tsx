import {
	AnchorButton,
	Button,
	CreateScope,
	DataGridScope,
	DeleteEntityButton,
	EditScope,
	EnumCell,
	FieldView,
	GenericCell,
	HasManySelectCell,
	HasOneSelectCell,
	LinkButton,
	MultiEditScope,
	NavigateBackLink,
	NumberCell,
	PersistButton,
	Repeater,
	RepeaterItem,
	RepeaterItemProps,
	SelectField,
	TextCell,
	TextField,
} from '@contember/admin'
import { CategoryForm } from '../components/CategoryForm'
import { DataGridTile } from '../components/DataGridTile'
import { Directive, Title } from '../components/Directives'
import { EditOrCreateForm } from '../components/EditOrCreateForm'
import { SlotSources as Slots } from '../components/Slots'


const stateOptions = {
	draft: 'Draft',
	published: 'Published',
	removed: 'Removed',
}

export const list = () => (
	<>
		<Title>Articles</Title>
		<Directive name="content-max-width" content={null} />
		<Slots.Actions><LinkButton to="articles/create">Add article</LinkButton></Slots.Actions>

		<DataGridScope
			entities="Article"
			itemsPerPage={20}
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
		<Slots.Back>
			<NavigateBackLink to="articles/list">Back to articles</NavigateBackLink>
		</Slots.Back>
		<Title>New Article</Title>
		<CreateScope entity="Article" redirectOnSuccess="articles/edit(id: $entity.id)">
			<EditOrCreateForm />
		</CreateScope>
	</>
)

export const edit = () => (
	<>
		<Slots.Back>
			<NavigateBackLink to="articles/list">Back to articles</NavigateBackLink>
		</Slots.Back>
		<EditScope
			entity="Article(id = $id)"
			redirectOnSuccess={(current, ids, entity) => !entity.existsOnServer ? 'articles/list' : undefined}
		>
			<Slots.SidebarRightHeader>
				<DeleteEntityButton immediatePersist={true} />
			</Slots.SidebarRightHeader>
			<FieldView field="title" render={title => (
				<Title>{`Edit ${title.getAccessor().value ? title.getAccessor().value : 'Article'}`}</Title>
			)} />

			<EditOrCreateForm />
		</EditScope>
	</>
)

export const categories = () => (
	<>
		<Title>Categories</Title>

		<MultiEditScope entities="Category" listProps={{
			sortableBy: 'order',
			beforeContent: <Slots.Actions><PersistButton /></Slots.Actions>,
		}}>
			<CategoryForm />
		</MultiEditScope>
	</>
)

const CustomRepeaterItem = (props: RepeaterItemProps) => {
	return <>
		<Button onClick={() => props.createNewEntity(undefined, props.index)}>Add item</Button>
		<RepeaterItem {...props} />
	</>
}

export const tags = () => (
	<>
		<Title>Tags</Title>

		<MultiEditScope entities="Tag" listProps={{ beforeContent: <Slots.Actions><PersistButton /></Slots.Actions> }}>
			<TextField field={'name'} label={'Name'} />
			<Repeater field={'locales'} label={'Locales'} sortableBy={'order'} itemComponent={CustomRepeaterItem}>
				<SelectField label={'Locale'} options={'Locale.code'} field={'locale'}
					createNewForm={<TextField field={'code'} label={'Locale code'} />} />
				<TextField field={'name'} label={'Name'} />
			</Repeater>
		</MultiEditScope>
	</>
)

export default list

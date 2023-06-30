import {
	Component,
	Field,
	HasMany,
	If,
	ImageUploadField,
	MultiSelectField,
	PersistButton,
	RichTextField,
	SelectField,
	SlugField,
	TextField,
} from '@contember/admin'
import { SlotSources } from '../components/Slots'
import { CategoryForm } from './CategoryForm'

const ArticleForm = Component(() => <>
	<TextField field={'title'} label={'Title'} />

	<SlugField field={'slug'} label={'Slug'} derivedFrom={'title'} unpersistedHardPrefix={'http://localhost/'} persistedHardPrefix={'bar/'}
		persistedSoftPrefix={'lorem/'} linkToExternalUrl />
	<RichTextField field={'content'} label={'Content'} />

	<ImageUploadField
		label="Image"
		baseEntity="image"
		urlField="url"
		widthField="width"
		heightField="height"
		fileSizeField="size"
		fileTypeField="type"
	/>

	<If condition={'[state = removed]'}>
		<TextField field={'title'} label={'Title'} />
	</If>
</>,
	'ArticleForm',
)

export const stateOptions = {
	draft: 'Draft',
	published: 'Published',
	removed: 'Removed',
}

const ArticleSidebarForm = Component(() => <>
	<SelectField field={'state'} label={'State'} options={Object.entries(stateOptions).map(([value, label]) => ({ value, label }))} allowNull />
	{/*<MultiSelectField*/}
	{/*	label={'tags'}*/}
	{/*	field={'tags'}*/}
	{/*	options={{*/}
	{/*		fields: 'Tag.name',*/}
	{/*		orderBy: 'name desc',*/}
	{/*	}}*/}
	{/*	createNewForm={<TextField field={'name'} label={'Name'} />}*/}
	{/*/>*/}
	<MultiSelectField
		label={'tags'}
		field={'tags'}
		options={`Tag.locales(locale.code = 'cs').name`}
		lazy
	/>
	<MultiSelectField
		label={'Sortable tags'}
		field={'sortedTags'}
		options={{
			fields: 'Tag.name',
			orderBy: 'name desc',
		}}
		createNewForm={<TextField field={'name'} label={'Name'} />}

		connectingEntityField={'tag'}
		sortableBy={'order'}
		lazy
	/>

	<SelectField
		label={'category'}
		field={'category'}
		createNewForm={<CategoryForm />}
		searchByFields={'name'}
		options={{
			entities: 'Category',
			orderBy: 'name desc',
		}}
		optionLabel={<CategoryOptionItem />}
		lazy
	/>
</>,
	'ArticleSidebarForm',
)

const CategoryOptionItem = Component(() => {
	return <>
		<Field field={'name'} />, locales:
		<HasMany field={'locales'}>
			<Field field={'name'} />
		</HasMany>
	</>
})

export const EditOrCreateForm = Component(() => (
	<>
		<ArticleForm />
		<SlotSources.Actions><PersistButton /></SlotSources.Actions>

		<SlotSources.Sidebar>
			<ArticleSidebarForm />
		</SlotSources.Sidebar>
	</>
), 'EditOrCreateForm')

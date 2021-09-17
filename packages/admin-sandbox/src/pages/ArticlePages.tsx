import {
	AnchorButton,
	CreatePage,
	DataBindingProvider,
	DataGrid,
	DeleteEntityButton,
	EditPage,
	FeedbackRenderer,
	GenericCell,
	GenericPage,
	HasManySelectCell,
	HasOneSelectCell,
	MultiSelectField,
	PageLinkButton,
	PageLinkById,
	SelectField,
	TextCell,
	TextField,
	TitleBar,
} from '@contember/admin'


export const ArticleListPage = (
	<GenericPage pageName="articleList">
		<TitleBar actions={<PageLinkButton to="articleCreate">Add article</PageLinkButton>}>Articles</TitleBar>

		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<DataGrid entities="Article" itemsPerPage={20}>
				<TextCell field="title" header="Title" />
				<TextCell field="content" header="Content" />
				<HasOneSelectCell field="category" options={`Category.locales(locale.code = 'cs').name`} header="Category" />
				<HasManySelectCell field="tags" options={`Tag.locales(locale.code = 'cs').name`} header="Tags" />

				<GenericCell canBeHidden={false} justification="justifyEnd">
					<PageLinkButton to={`articleEdit(id: $entity.id)`} Component={AnchorButton}>Edit</PageLinkButton>
					<DeleteEntityButton title="Delete" immediatePersist={true}></DeleteEntityButton>
				</GenericCell>
			</DataGrid>
		</DataBindingProvider>
	</GenericPage>
)

const form = <>
	<MultiSelectField label={'tags'} field={'tags'} options={{
		fields: "Tag.locales(locale.code='cs').name",
		orderBy: 'name desc',
	}} />
	<SelectField label={'category'} field={'category'} options={{
		fields: "Category.locales(locale.code='cs').name",
		orderBy: 'name desc',
	}} />
	<TextField field={'title'} label={'Title'} />
</>

export const ArticleCreatePage = (
	<CreatePage pageName={'articleCreate'} entity={'Article'} redirectOnSuccess={req => ({ ...req, pageName: 'articleList', parameters: {} })}>
		{form}
	</CreatePage>
)

export const ArticleEditPage = (
	<EditPage pageName={'articleEdit'} entity={'Article(id=$id)'} rendererProps={{
		title: 'Article',
	}}>
		{form}
	</EditPage>
)

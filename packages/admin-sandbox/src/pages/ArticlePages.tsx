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
	MultiSelectField,
	PageLinkButton,
	PageLinkById,
	TextCell,
	TextField,
	TitleBar,
} from '@contember/admin'


export const ArticleListPage = (
	<GenericPage pageName="articleList">
		<TitleBar actions={<PageLinkButton to="articleCreate">Add article</PageLinkButton>}>Articles</TitleBar>

		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<DataGrid entities="Article" itemsPerPage={2}>
				<TextCell field="title" header="Title" />
				<TextCell field="content" header="Content" />
				<GenericCell canBeHidden={false} justification="justifyEnd">
					<PageLinkById to={'articleEdit'} Component={AnchorButton}>Edit</PageLinkById>
					<DeleteEntityButton title="Delete" immediatePersist={true}></DeleteEntityButton>
				</GenericCell>
			</DataGrid>
		</DataBindingProvider>
	</GenericPage>
)

const form = <>
	<MultiSelectField label={'tags'} field={'tags'} options={{
		fields: "Tag[name != 'a'].name",
		orderBy: 'name desc',
	}} />
	<TextField field={'title'} label={'Title'} />
</>

export const ArticleCreatePage = (
	<CreatePage pageName={'articleCreate'} entity={'Article'}>
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

import {
	AnchorButton,
	CreatePage,
	EditPage,
	Field,
	ListPage,
	MultiSelectField,
	PageLinkButton,
	PageLinkById,
	TableCell,
	TextField,
} from '@contember/admin'

export const ArticleListPage = (
	<ListPage pageName="articleList" entities="Article" rendererProps={{
		title: 'Articles',
		boxLabel: 'Article',
		actions: <>
			<PageLinkButton to={'articleCreate'}>Add article</PageLinkButton>
		</>,
	}}>
		<TableCell><Field field={'title'} /></TableCell>
		<TableCell><PageLinkById to={'articleEdit'} Component={AnchorButton}>Edit</PageLinkById></TableCell>
	</ListPage>
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

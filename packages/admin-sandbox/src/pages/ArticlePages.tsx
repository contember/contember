import {
	AnchorButton,
	CreatePage,
	EditPage,
	Field,
	ListPage,
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

export const ArticleCreatePage = (
	<CreatePage pageName={'articleCreate'} entity={'Article'}>
		<TextField field={'title'} label={'Title'}/>
	</CreatePage>
)

export const ArticleEditPage = (
	<EditPage pageName={'articleEdit'} entity={'Article(id=$id)'}>
		<TextField field={'title'} label={'Title'} />
	</EditPage>
)

import { Field, Literal, PageLinkButton, TableCell, TablePage } from '@contember/admin'
import * as React from 'react'
import { EditButton } from '../components/EditButton'

export const PostListPage = (
	<TablePage
		pageName={'postList'}
		entities="Post"
		orderBy={[{ title: new Literal('desc') }]}
		rendererProps={{
			title: 'Posts',
			actions: (
				<>
					<PageLinkButton to="postCreate">Add a new post</PageLinkButton>
				</>
			),
		}}
	>
		<TableCell>
			<Field field="title" />
		</TableCell>
		<TableCell shrunk>
			<EditButton pageName="postEdit" />
		</TableCell>
	</TablePage>
)

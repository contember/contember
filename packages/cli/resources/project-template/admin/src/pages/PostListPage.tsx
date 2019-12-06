import { FieldText, Literal, PageLinkButton, TableCell, TablePage } from '@contember/admin'
import * as React from 'react'
import { EditButton } from '../components/EditButton'

export const PostListPage = (
	<TablePage
		pageName={'postList'}
		entityName="Post"
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
			<FieldText name="title" />
		</TableCell>
		<TableCell shrunk>
			<EditButton pageName="postEdit" />
		</TableCell>
	</TablePage>
)

import { CreatePage, NavigateBackButton } from '@contember/admin'
import * as React from 'react'
import { PostForm } from '../forms'

export const PostCreatePage = (
	<CreatePage
		entityName="Post"
		pageName={'postCreate'}
		rendererProps={{
			title: 'Add a new post',
			navigation: <NavigateBackButton to="postList">Posts</NavigateBackButton>,
		}}
		redirectOnSuccess={request => ({ ...request, pageName: 'postList' })}
	>
		<PostForm />
	</CreatePage>
)

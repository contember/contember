import { Component, ImageUploadField, TextAreaField, TextField } from '@contember/admin'
import * as React from 'react'

export const PostForm = Component(
	() => (
		<>
			<TextField field="title" size="large" label={'Title'} />
			<ImageUploadField field="image.url" label="Image" />
			<TextAreaField field="content" label="Content" />
		</>
	),
	'PostForm',
)

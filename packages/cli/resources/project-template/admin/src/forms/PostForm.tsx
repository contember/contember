import { Component, ImageUploadField, TextAreaField, TextField } from '@contember/admin'
import * as React from 'react'

export const PostForm = Component(
	() => (
		<>
			<TextField name="title" size="large" label={'Title'} />
			<ImageUploadField name="image.url" label="Image" />
			<TextAreaField name="content" label="Content" />
		</>
	),
	'PostForm',
)

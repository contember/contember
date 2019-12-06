import { Component, TextAreaField, TextField } from '@contember/admin'
import * as React from 'react'

export const PostForm = Component(
	() => (
		<>
			<TextField name="title" size="large" label={'Title'} />
			<TextAreaField name="perex" label="Perex" />
		</>
	),
	'PostForm',
)

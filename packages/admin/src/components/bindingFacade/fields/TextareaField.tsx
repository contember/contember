import * as React from 'react'
import { Component } from '@contember/binding'
import { TextField, TextFieldProps } from './TextField'

export type TextareaFieldProps = TextFieldProps

const TF: any = TextField // TODO this is a shitty hotfix

export const TextAreaField: React.FunctionComponent<TextFieldProps> = Component(props => (
	<TF {...props} allowNewlines={true} minRows={(props as any).minRows || 3} />
))

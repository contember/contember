import { BindingError, Component, SugaredRelativeSingleField } from '@contember/binding'
import { BaseTextField } from './BaseTextField'
import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'

export interface TextFieldProps extends SugaredRelativeSingleField, BaseTextField {}

export const TextField: FunctionComponent<TextFieldProps> = Component(props => {
	throw new BindingError(`BlockEditor.TextField may only appear as an immediate child of a block!`)
})

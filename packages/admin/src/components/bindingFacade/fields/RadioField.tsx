import { FormGroupProps } from '@contember/ui'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { Component, RelativeSingleField } from '@contember/binding'
import { ChoiceFieldProps } from './ChoiceField'

export interface RadioFieldPublicProps extends Omit<FormGroupProps, 'children'> {
	inline?: boolean
	field: string
}

export interface RadioFieldInternalProps {
	options: ChoiceFieldProps['options']
}

export type RadioFieldProps = RadioFieldPublicProps & RadioFieldInternalProps

export const RadioField: FunctionComponent<RadioFieldProps> = Component(props => {
	throw new Error('Not implemented')
}, 'RadioField')

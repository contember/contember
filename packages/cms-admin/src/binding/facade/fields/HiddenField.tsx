import * as React from 'react'
import { FieldPublicProps } from '../../coreComponents'
import { SimpleRelativeSingleField } from '../aux'

export interface HiddenFieldProps extends FieldPublicProps {
	defaultValue: FieldPublicProps['defaultValue']
}

export const HiddenField = SimpleRelativeSingleField<HiddenFieldProps>(() => null, 'HiddenField')

import * as React from 'react'
import { Box } from '../Box'
import { ErrorList, ErrorListProps } from './ErrorList'

export interface FieldSetProps extends ErrorListProps {
	legend: React.ReactNode
	children: React.ReactNode
}

export const FieldSet = React.memo<FieldSetProps>(props => (
	<Box heading={props.legend}>
		<ErrorList size={props.size} errors={props.errors} />
		{props.children}
	</Box>
))
FieldSet.displayName = 'FieldSet'

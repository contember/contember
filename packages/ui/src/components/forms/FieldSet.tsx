import * as React from 'react'
import cn from 'classnames'
import { ErrorList, ErrorListProps } from './ErrorList'

export interface FieldSetProps extends ErrorListProps {
	legend: React.ReactNode
	children: React.ReactNode
}

export const FieldSet = React.memo<FieldSetProps>(props => (
	<div className={cn('fieldSet')}>
		<ErrorList size={props.size} errors={props.errors} />
		{props.children}
	</div>
))

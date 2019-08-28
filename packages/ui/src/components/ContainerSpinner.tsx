import * as React from 'react'
import cn from 'classnames'
import { Size } from '../types'
import { toEnumViewClass } from '../utils'
import { Spinner } from './Spinner'

export interface ContainerSpinnerProps {
	size?: Size
}

export const ContainerSpinner = React.memo(({ size }: ContainerSpinnerProps) => (
	<div className={cn('containerSpinner', toEnumViewClass(size))}>
		<Spinner />
	</div>
))
ContainerSpinner.displayName = 'ContainerSpinner'

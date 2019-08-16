import * as React from 'react'
import cn from 'classnames'
import { Size } from '../types'
import { toViewClass } from '../utils'
import { Spinner } from './Spinner'

export interface ContainerSpinnerProps {
	size?: Size
}

export const ContainerSpinner = ({ size }: ContainerSpinnerProps) => (
	<div className={cn('containerSpinner', toViewClass(size))}>
		<Spinner />
	</div>
)

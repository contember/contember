import * as React from 'react'
import cn from 'classnames'
import { Size } from '../types'
import { toEnumViewClass } from '../utils'
import { Aether } from './Aether'
import { Spinner } from './Spinner'

export interface ContainerSpinnerProps {
	size?: Size
}

export const ContainerSpinner = React.memo(({ size }: ContainerSpinnerProps) => (
	<Aether className={cn('containerSpinner', toEnumViewClass(size))}>
		<Spinner />
	</Aether>
))
ContainerSpinner.displayName = 'ContainerSpinner'

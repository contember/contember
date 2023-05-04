import { memo } from 'react'
import cn from 'classnames'
import { useComponentClassName } from '../auxiliary'
import type { Size } from '../types'
import { toEnumViewClass } from '../utils'
import { Aether } from './Aether'
import { Spinner } from './Spinner'

export interface ContainerSpinnerProps {
	size?: Size
}

/**
 * @group UI
 */
export const ContainerSpinner = memo(({ size }: ContainerSpinnerProps) => (
	<Aether className={cn(useComponentClassName('containerSpinner'), toEnumViewClass(size))}>
		<Spinner />
	</Aether>
))
ContainerSpinner.displayName = 'ContainerSpinner'

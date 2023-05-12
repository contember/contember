import { useClassName } from '@contember/utilities'
import { memo } from 'react'
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
	<Aether className={useClassName('containerSpinner', toEnumViewClass(size))}>
		<Spinner />
	</Aether>
))
ContainerSpinner.displayName = 'ContainerSpinner'

import { useClassName } from '@contember/utilities'
import { memo } from 'react'
import { toEnumViewClass } from '../../utils'
import { Aether } from '../Aether'
import { Spinner } from '../Spinner/Spinner'
import { SpinnerOverlayProps } from './types'

/**
 * @group UI
 *
 * An overlay with a spinner.
 */
export const SpinnerOverlay = memo(({ size }: SpinnerOverlayProps) => (
	<Aether className={useClassName('spinner-overlay', toEnumViewClass(size))}>
		<Spinner />
	</Aether>
))
SpinnerOverlay.displayName = 'SpinnerOverlay'

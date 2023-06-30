import { useClassName } from '@contember/utilities'
import { memo } from 'react'
import { SpinnerContainerProps, SpinnerOverlay } from '../components'

/**
 * @group UI
 * @deprecated use SpinnerOverlayProps instead
 */
export type ContainerSpinnerProps = SpinnerContainerProps

/**
 * @group UI
 * @deprecated use SpinnerOverlay instead
 */
export const ContainerSpinner = memo((props: ContainerSpinnerProps) => (
	<SpinnerOverlay className={useClassName('containerSpinner', props.className)} {...props} />
))
ContainerSpinner.displayName = 'ContainerSpinner'

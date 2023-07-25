import { memo } from 'react'
import { SpinnerOverlay } from './SpinnerOverlay'
import { SpinnerContainerProps } from './types'

/**
 * Displays a spinner above the children when enabled.
 *
 * @group UI
 *
 * @example
 * ```tsx
 * <SpinnerContainer enabled={true}>
 * 	<SomeComponent />
 * </SpinnerContainer>
 * ```
 */
export const SpinnerContainer = memo(({ enabled, children, size }: SpinnerContainerProps) => (
	<>
		{enabled && <SpinnerOverlay size={size} />}
		{children}
	</>
))
SpinnerContainer.displayName = 'SpinnerContainer'

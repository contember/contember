import { memo } from 'react'
import { SpinnerOverlay } from './SpinnerOverlay'
import { SpinnerContainerProps } from './types'

/**
 * @group UI
 *
 * Displays a spinner above the children when enabled.
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

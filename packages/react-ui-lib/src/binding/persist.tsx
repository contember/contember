import { PersistTrigger } from '@contember/interface'
import { ReactNode } from 'react'
import { dict } from '../dict'
import { Button } from '../ui/button'
import { Loader } from '../ui/loader'
import { usePersistSuccessHandler } from './hooks'

/**
 * Props for the {@link PersistButton} component.
 */
export interface PersistButtonProps {
	/**
	 * Custom button text (default: dictionary.persist.persistButton)
	 */
	label?: ReactNode
}

/**
 * PersistButton component - Universal save button with loading state
 *
 * #### Purpose
 * Provides a consistent UI element for triggering data persistence with visual feedback
 *
 * #### Features
 * - Integrated loading spinner during save operations
 * - Success feedback via toast notifications
 * - Customizable button label
 * - Automatic disabled state during persistence
 *
 * #### Example: Basic usage
 * ```tsx
 * <PersistButton />
 * ```
 *
 * #### Example: Custom label
 * ```tsx
 * <PersistButton label="Save Article" />
 * ```
 */

/**
 * `PersistButton` is a button component that triggers a persistence action (saves unsaved data).
 *
 * #### Used hooks
 * - {@link usePersistSuccessHandler}: Handles success feedback after persistence
 *
 * #### Example: Basic usage
 * ```tsx
 * <PersistButton />
 * ```
 *
 * #### Example: Custom label
 * ```tsx
 * <PersistButton label="Save Article" />
 * ```
 */
export const PersistButton = ({ label }: PersistButtonProps) => {
	return (
		<PersistTrigger onPersistSuccess={usePersistSuccessHandler()}>
			<Button className="group">
				<Loader size="sm" position="absolute" className="hidden group-data-[loading]:block" />
				{label ?? dict.persist.persistButton}
			</Button>
		</PersistTrigger>
	)
}


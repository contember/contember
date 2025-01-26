import { PersistTrigger } from '@contember/interface'
import { ReactNode } from 'react'
import { dict } from '../dict'
import { Button } from '../ui/button'
import { Loader } from '../ui/loader'
import { usePersistSuccessHandler } from './hooks'

/**
 * Props for the {@link PersistButton} component.
 */
export type PersistButtonProps = {
	/**
	 * Custom button text (default: dictionary.persist.persistButton)
	 */
	label?: ReactNode
}

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


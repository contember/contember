import { Button } from '@contember/react-ui-lib-base'
import { ArrowLeftIcon } from 'lucide-react'
import { dict } from '@contember/react-ui-lib-base'

/**
 * Props for the {@link BackButton} component.
 */
export type BackButtonProps = {
	/**
	 * Optional custom button text (default: dictionary backButton.back value)
	 */
	label?: string
}

/**
 * `BackButton` is a navigation button that returns the user to the previous page using the browser's history API.
 * It provides a default label but allows customization via the `label` prop.
 *
 * ## Example: Basic usage
 * ```tsx
 * <BackButton />
 * ```
 *
 * ## Example: Custom label
 * ```tsx
 * <BackButton label="Return to list" />
 * ```
 */
export const BackButton = ({ label }: BackButtonProps) => {
	return (
		<Button
			variant={'ghost'}
			className={'gap-1'}
			onClick={() => history.back()}
		>
			<ArrowLeftIcon size={16} />
			<span>{label ?? dict.backButton.back}</span>
		</Button>
	)
}

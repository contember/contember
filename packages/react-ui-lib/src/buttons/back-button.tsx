import { ArrowLeftIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { dict } from '../dict'
import { Button } from '../ui/button'

/**
 * Props for {@link BackButtonLabel} component.
 */
export type BackButtonLabelProps = {
	/**
	 * Optional custom button text (default: dictionary.backButton.back)
	 * */
	label?: string
}

/**
 * Props {@link BackButtonLabelProps}.
 *
 * `BackButtonLabel` is a presentational component that renders a back arrow icon
 * alongside a label. Typically used inside `BackButton` for consistent styling.
 *
 * #### Example: Basic usage
 * ```tsx
 * <BackButtonLabel />
 * ```
 *
 * #### Example: Custom label
 * ```tsx
 * <BackButtonLabel label="Go Back" />
 * ```
 */
export const BackButtonLabel = ({ label }: BackButtonLabelProps) => (
	<>
		<ArrowLeftIcon size={16} />
		<span>{label ?? dict.backButton.back}</span>
	</>
)

/**
 * Props for {@link BackButton} component.
 */
export type BackButtonProps = {
	/**
	 * Optional custom button content replaces label with default icon
	 * */
	children?: ReactNode
} & BackButtonLabelProps

/**
 * Props {@link BackButtonProps}.
 *
 * `BackButton` is a navigation button that returns the user to the previous page using the browser's history API.
 * It provides a default label but allows customization via the `label` prop or `children`.
 *
 * #### Example: Basic usage
 * ```tsx
 * <BackButton />
 * ```
 *
 * #### Example: Custom label
 * ```tsx
 * <BackButton label="Return to list" />
 * ```
 *
 * #### Example: Custom content
 * ```tsx
 * <BackButton>
 *   <CustomIcon />
 *   <span>Go Back</span>
 * </BackButton>
 * ```
 */
export const BackButton = ({ label, children }: BackButtonProps) => {
	const goBack = () => window.history.back()

	return (
		<Button variant="ghost" className="gap-1" onClick={goBack}>
			{children ?? <BackButtonLabel label={label} />}
		</Button>
	)
}

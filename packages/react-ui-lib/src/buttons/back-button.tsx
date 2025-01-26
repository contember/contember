import { ArrowLeftIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { dict } from '../dict'
import { Button } from '../ui/button'

/**
 * Props for {@link BackButton} component.
 */
export type BackButtonProps = {
	/**
	 * Optional custom button text (default: dictionary.backButton.back)
	 * */
	label?: string
	/**
	 * Optional custom button content replaces label with default icon
	 * */
	children?: ReactNode
}

/**
 * BackButton component - Navigation button for returning to previous page. Uses browser's history API (client-side navigation).
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
 */
export const BackButton = ({ label, children }: BackButtonProps) => {
	const goBack = () => window.history.back()

	return (
		<Button variant="ghost" className="gap-1" onClick={goBack}>
			{children ?? (
				<>
					<ArrowLeftIcon size={16} />
					<span>{label ?? dict.backButton.back}</span>
				</>
			)}
		</Button>
	)
}

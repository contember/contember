import { ReactNode } from 'react'
import { Button } from '../ui/button'
import { ArrowLeftIcon } from 'lucide-react'
import { dict } from '../dict'

export type BackButtonProps = {
	/** Optional custom button text (default: dictionary.backButton.back) */
	label?: string
	/** Optional custom button content replaces label with default icon */
	children?: ReactNode
}

/**
 * BackButton component - Navigation button for returning to previous page
 *
 * #### Purpose
 * Provides consistent backward navigation functionality with browser history integration
 *
 * #### Features
 * - Ghost-style button with left arrow icon
 * - Default localized label from dictionary
 * - Browser-native history navigation
 * - Customizable button text
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
 * #### Integration Notes
 * - Uses browser's history API (client-side navigation)
 */
export const BackButton = ({ label, children }: BackButtonProps) => {
	return (
		<Button
			variant={'ghost'}
			className={'gap-1'}
			onClick={() => window.history.back()}
		>
			{children ?? <>
				<ArrowLeftIcon size={16} />
				<span>{label ?? dict.backButton.back}</span>
			</>}
		</Button>
	)
}

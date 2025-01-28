import { Link, type RoutingLinkTarget } from '@contember/interface'
import { ArrowLeftIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { Slots } from '../layout'
import { AnchorButton } from '../ui/button'

export type LinkBackButtonProps = {
	/** Optional custom button content replaces label with default icon */
	children?: ReactNode
	/** Button label content */
	label: ReactNode
	/** Required routing target for navigation */
	to: RoutingLinkTarget
}

/**
 * LinkBackButton component - Configurable back navigation button with routing
 *
 * #### Purpose
 * Provides a consistent way to navigate back using application routing instead of browser history
 *
 * #### Features
 * - Outline-style button with left arrow icon
 * - Configurable routing target
 * - Renders in dedicated layout slot (Slots.Back)
 * - Client-side navigation via Contember's Link
 * - Fixed small size with right margin
 *
 * #### Example: Basic usage
 * ```tsx
 * <LinkBackButton to="articles" />
 * ```
 *
 * #### Example: With custom label keeps default icon
 * ```tsx
 * <LinkBackButton to="articles" label="Back to Articles" />
 * ```
 *
 * #### Example: With icon only
 * ```tsx
 * <LinkBackButton to="dashboard">
 *   <ArrowLeftIcon />
 * </LinkBackButton>
 * ```
 *
 * #### Example: With icon and label
 * ```tsx
 * <LinkBackButton to="dashboard">
 *   <ArrowLeftIcon /> Dashboard
 * </LinkBackButton>
 * ```
 *
 * #### Integration Notes
 * - Requires routing setup with Contember's Router
 * - Positioned in layout's back slot (Slots.Back)
 * - Use for application-defined navigation targets
 * - Prefer over browser history back for complex flows
 *
 * #### Comparison
 * - **BackButton**: Uses browser history.back()
 * - **LinkBackButton**: Navigates to specific route
 */
export const LinkBackButton = ({ children, label, to }: LinkBackButtonProps) => {
	return (
		<Slots.Back>
			<Link to={to}>
				<AnchorButton size="sm" className="mr-2 gap-2" variant="outline">
					{children ?? <>
						<ArrowLeftIcon />
						<span>{label}</span>
					</>}
				</AnchorButton>
			</Link>
		</Slots.Back>
	)
}

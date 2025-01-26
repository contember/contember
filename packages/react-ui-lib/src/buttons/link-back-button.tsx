import { Link, type RoutingLinkTarget } from '@contember/interface'
import { ArrowLeftIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { Slots } from '../layout'
import { AnchorButton } from '../ui/button'

/**
 * Props for the {@link LinkBackButton} component.
 */
export type LinkBackButtonProps = {
	/**
	 * Optional custom button content replaces label with default icon
	 */
	children?: ReactNode
	/**
	 * Button label content
	 */
	label: ReactNode
	/**
	 * Required routing target for navigation
	 */
	to: RoutingLinkTarget
}

/**
 * `LinkBackButton` is a navigational button that provides a back navigation link.
 * It wraps the link inside a `Slots.Back` container and renders an `AnchorButton`.
 *
 * #### Comparison
 * - **{@link BackButton}**: Uses browser history.back()
 *
 * #### Example: Basic usage (keeps default icon)
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
 * #### Example: With custom icon and label
 * ```tsx
 * <LinkBackButton to="dashboard">
 *   <ArrowLeftIcon /> Dashboard
 * </LinkBackButton>
 * ```
 */
export const LinkBackButton = ({ children, label, to }: LinkBackButtonProps) => {
	return (
		<Slots.Back>
			<Link to={to}>
				<AnchorButton size="sm" className="mr-2 gap-2" variant="outline">
					{children ?? (
						<>
							<ArrowLeftIcon />
							<span>{label}</span>
						</>
					)}
				</AnchorButton>
			</Link>
		</Slots.Back>
	)
}

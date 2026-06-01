import { ReactNode } from 'react'
import { AnchorButton } from '@contember/react-ui-lib-base'
import { ArrowLeftIcon } from 'lucide-react'
import { Link, type RoutingLinkTarget } from '@contember/interface'
import { Slots } from '../layout/index.js'

export const LinkBackButton = ({ children, to }: {
	children: ReactNode
	to: RoutingLinkTarget
}) => {
	return (
		<Slots.Back>
			<Link to={to}>
				<AnchorButton size="sm" className="mr-2 gap-2" variant="outline">
					<ArrowLeftIcon />
					{children}
				</AnchorButton>
			</Link>
		</Slots.Back>
	)
}

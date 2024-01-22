import { Identity2023 } from '@contember/brand'
import { LogOutIcon } from 'lucide-react'
import { memo, PropsWithChildren } from 'react'
import { Navigation } from './Navigation'
import { Slot } from './Slots'
import { LayoutComponent } from './LayoutComponent'
import { Link } from '@contember/interface'

export const Layout = memo(({ children }: PropsWithChildren) => {
	return (
			<LayoutComponent>
				<Slot.Logo>
					<Link to="index">
						<Identity2023.Edit scale={2} />
					</Link>
				</Slot.Logo>
				<Slot.Navigation>
					<Navigation />
				</Slot.Navigation>

				<Slot.Profile>
					{/*<LogoutLink Component={AlertLogoutLink}>*/}
					{/*	<Stack align="center" horizontal gap="gap">*/}
							<LogOutIcon /> Logout
						{/*</Stack>*/}
					{/*</LogoutLink>*/}
				</Slot.Profile>

				<Slot.Footer>
					<p><small>Created with <a className="content-link" href="https://www.contember.com/">AI-assisted Contember
						Studio</a></small></p>
				</Slot.Footer>

				{children}
			</LayoutComponent>
	)
})
Layout.displayName = 'Layout'

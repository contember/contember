import { memo, PropsWithChildren } from 'react'
import { Navigation, UserNavigation } from './navigation'
import { Link } from '@contember/interface'
import { Logo } from './logo'
import { IdentityLoader } from '~/lib/binding'
import { LayoutComponent, Slots } from '~/lib/layout'

export const Layout = memo(({ children }: PropsWithChildren) => {
	return (
		<IdentityLoader>
			<LayoutComponent>

				<Slots.Logo>
					<Link to="index">
						<Logo />
					</Link>
				</Slots.Logo>

				<Slots.Navigation>
					<Navigation />
				</Slots.Navigation>

				<Slots.UserNavigation>
					<UserNavigation />
				</Slots.UserNavigation>

				<Slots.Footer>
					<p><small>Created with <a className="content-link" href="https://www.contember.com/">Contember</a></small></p>
				</Slots.Footer>

				{children}
			</LayoutComponent>
		</IdentityLoader>
	)
})
Layout.displayName = 'Layout'

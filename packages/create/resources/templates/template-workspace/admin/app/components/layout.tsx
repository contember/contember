import { memo, PropsWithChildren } from 'react'
import { IdentityLoader } from '@app/lib/binding'
import { LayoutComponent, Slots } from '@app/lib/layout'
import { Navigation } from './navigation'
import { Link } from '@contember/interface'
import { Logo } from './logo'

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

				<Slots.Footer>
					<p><small>Created with <a className="content-link" href="https://www.contember.com/">Contember</a></small></p>
				</Slots.Footer>

				{children}
			</LayoutComponent>
		</IdentityLoader>
	)
})
Layout.displayName = 'Layout'

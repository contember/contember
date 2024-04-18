import * as React from 'react'
import { memo, PropsWithChildren } from 'react'
import { IdentityLoader } from '../../lib/components/binding/identity'
import { Slots } from '../../lib/components/slots'
import { Navigation } from './navigation'
import { LayoutComponent } from '../../lib/components/layout'
import { Identity2023 } from '@contember/brand'
import { Link } from '@contember/interface'

export const Layout = memo(({ children }: PropsWithChildren) => {
	return (
		<IdentityLoader>
			<LayoutComponent>

				<Slots.Logo>
					<Link to="index">
						<Identity2023.Edit scale={2} />
					</Link>
				</Slots.Logo>

				<Slots.Navigation>
					<Navigation />
				</Slots.Navigation>

				<Slots.Footer>
					<p><small>Created with <a className="content-link" href="https://www.contember.com/">AI-assisted Contember Studio</a></small></p>
				</Slots.Footer>

				{children}
			</LayoutComponent>
		</IdentityLoader>
	)
})
Layout.displayName = 'Layout'

import { PropsWithChildren } from 'react'
import { DialogProvider } from './Dialog'
import { PortalProvider } from './Portal'
import { SectionTabsProvider } from './SectionTabs'
import { StyleProvider } from './StyleProvider'
import { Toaster, ToasterProvider } from './Toaster'

export const Providers = (props: PropsWithChildren) => (
	<StyleProvider>
		<ToasterProvider>
			<PortalProvider>
				<DialogProvider>
					<SectionTabsProvider>
						{props.children}
					</SectionTabsProvider>
					<Toaster />
				</DialogProvider>
			</PortalProvider>
		</ToasterProvider>
	</StyleProvider>
)

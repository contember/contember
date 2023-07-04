import { PropsWithChildren } from 'react'
import { Toaster, ToasterProvider } from './Toaster'
import { DialogProvider } from './Dialog'
import { StyleProvider } from './StyleProvider'
import { DropdownContentContainerProvider } from './Dropdown'
import { SectionTabsProvider } from './SectionTabs'

export const Providers = (props: PropsWithChildren) => (
	<StyleProvider>
		<ToasterProvider>
			<DialogProvider>
				<SectionTabsProvider>
					<DropdownContentContainerProvider>
						{props.children}
						<Toaster />
						<div id="portal-root" style={{ display: 'contents' }} />
					</DropdownContentContainerProvider>
				</SectionTabsProvider>
			</DialogProvider>
		</ToasterProvider>
	</StyleProvider>
)

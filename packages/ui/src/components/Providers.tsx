import { DialogProvider } from './Dialog'
import { PortalProvider, PortalProviderProps } from './Portal'
import { SectionTabsProvider } from './SectionTabs'
import { StyleProvider, StyleProviderProps } from './StyleProvider'
import { Toaster, ToasterProvider } from './Toaster'

export type ProvidersProps = {
	children: React.ReactNode
	portalProviderProps?: PortalProviderProps
	styleProviderProps?: StyleProviderProps
}

export const Providers = ({
	children,
	portalProviderProps,
	styleProviderProps,
}: ProvidersProps) => (
	<StyleProvider {...styleProviderProps}>
		<ToasterProvider>
			<PortalProvider {...portalProviderProps}>
				<DialogProvider>
					<SectionTabsProvider>
						{children}
					</SectionTabsProvider>
					<Toaster />
				</DialogProvider>
			</PortalProvider>
		</ToasterProvider>
	</StyleProvider>
)

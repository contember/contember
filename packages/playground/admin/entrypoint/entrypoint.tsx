import { ContemberClient } from '@contember/react-client'
import { PageModule, RoutingProvider } from '@contember/react-routing'
import { Pages } from '@contember/interface'
import { Toaster } from '@app/lib/toast'
import { Layout } from '@app/entrypoint/components/layout'
import { entrypointConfig } from '@app/entrypoint/config'


export const Entrypoint = () => (<>
	<ContemberClient
		{...entrypointConfig.clientConfig}
	>
		<RoutingProvider pageInQuery>
			<Toaster>
				<Pages
					layout={Layout}
					children={import.meta.glob<PageModule>(
						'./pages/**/*.tsx',
						{ eager: true },
					)}
				/>
			</Toaster>
		</RoutingProvider>

	</ContemberClient>
</>)

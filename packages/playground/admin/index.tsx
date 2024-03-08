import { ApplicationEntrypoint, PageModule, Pages } from '@contember/interface'
import { SlotsProvider } from '@contember/react-slots'
import { Layout } from './app/components/layout'
import './index.css'
import { Toaster } from './lib/components/ui/toast'
import { createErrorHandler, DevBar, DevPanel } from '@contember/react-devbar'
import { LogInIcon } from 'lucide-react'
import { LoginWithEmail } from './lib/components/dev/login-panel'
import { createRoot } from 'react-dom/client'
import { getConfig } from './config'

const errorHandler = createErrorHandler((dom, react, onRecoverableError) => createRoot(dom, { onRecoverableError }).render(react))

const rootEl = document.body.appendChild(document.createElement('div'))

errorHandler(onRecoverableError => createRoot(rootEl, { onRecoverableError }).render(<>
	<SlotsProvider>
		<ApplicationEntrypoint
			{...getConfig()}
			children={
				<>
					<Toaster>
						<Pages
							layout={Layout}
							children={import.meta.glob<PageModule>(
								'./app/pages/**/*.tsx',
								{ eager: true },
							)}
						/>
						{import.meta.env.DEV && <DevBar>
							<DevPanel heading="Login" icon={<LogInIcon />}><LoginWithEmail /></DevPanel>
						</DevBar>}
					</Toaster>
				</>
			}
		/>
	</SlotsProvider>
</>))

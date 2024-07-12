import { LoginWithEmail } from '../lib/dev'
import { OutdatedApplicationDialog } from '@app/lib/outdated-application-dialog'
import { Toaster } from '@app/lib/toast'
import { ApplicationEntrypoint, PageModule, Pages } from '@contember/interface'
import { createErrorHandler, DevBar, DevPanel } from '@contember/react-devbar'
import { SlotsProvider } from '@contember/react-slots'
import { LogInIcon } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import { Layout } from './components/layout'
import '../index.css'
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
								'./pages/**/*.tsx',
								{ eager: true },
							)}
						/>
						{import.meta.env.DEV && <DevBar>
							<DevPanel heading="Login" icon={<LogInIcon/>}><LoginWithEmail/></DevPanel>
						</DevBar>}
					</Toaster>
					<OutdatedApplicationDialog/>
				</>
			}
		/>
	</SlotsProvider>
</>))

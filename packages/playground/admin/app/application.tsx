import { Layout } from '@app/app/components/layout'
import { ApplicationEntrypoint, PageModule, Pages } from '@contember/interface'
import { getConfig } from '@app/app/config'
import { Toaster } from '@app/lib/toast'
import { LogInIcon } from 'lucide-react'
import { LoginWithEmail } from '@app/lib/dev'
import { OutdatedApplicationDialog } from '@app/lib/outdated-application-dialog'
import { SlotsProvider } from '@contember/react-slots'
import { DevBar, DevPanel } from '@contember/react-devbar'


export const Application = () => {
	return (
		<>
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
									<DevPanel heading="Login" icon={<LogInIcon />}><LoginWithEmail /></DevPanel>
								</DevBar>}
							</Toaster>
							<OutdatedApplicationDialog />
						</>
					}
				/>
			</SlotsProvider>
		</>
	)
}

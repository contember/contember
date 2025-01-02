import { Layout } from '~/app/components/layout'
import { ApplicationEntrypoint, PageModule, Pages } from '@contember/interface'
import { getConfig } from '~/app/config'
import { Toaster } from '~/lib/toast'
import { LogInIcon } from 'lucide-react'
import { LoginWithEmail } from '~/lib/dev'
import { OutdatedApplicationDialog } from '~/lib/outdated-application-dialog'
import { SlotsProvider } from '@contember/react-slots'
import { DevBar, DevPanel } from '@contember/react-devbar'
import { EnumOptionsFormatterProvider, FieldLabelFormatterProvider } from '~/lib/labels'
import { enumOptionsFormatter, fieldLabelFormatter } from '~/app/labels'


export const Application = () => {
	return (
		<FieldLabelFormatterProvider value={fieldLabelFormatter}>
			<EnumOptionsFormatterProvider value={enumOptionsFormatter}>
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
			</EnumOptionsFormatterProvider>
		</FieldLabelFormatterProvider>
	)
}

import { Layout } from '@app/app/components/layout'
import { ApplicationEntrypoint, PageModule, Pages } from '@contember/interface'
import { getConfig } from '@app/app/config'
import { Toaster } from '@app/lib/toast'
import { LogInIcon } from 'lucide-react'
import { LoginWithEmail } from '@app/lib/dev'
import { OutdatedApplicationDialog } from '@app/lib/outdated-application-dialog'
import { SlotsProvider } from '@contember/react-slots'
import { DevBar, DevPanel } from '@contember/react-devbar'
import { EnumOptionsFormatterProvider, FieldLabelFormatterProvider } from '@app/lib/labels'
import { enumOptionsFormatter, fieldLabelFormatter } from '@app/app/labels'


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

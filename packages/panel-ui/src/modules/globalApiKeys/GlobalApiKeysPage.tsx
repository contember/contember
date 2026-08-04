import { CreateGlobalApiKeyForm } from '@contember/react-client-tenant'
import { Input, ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import { CreateGlobalApiKeyFormFields, GlobalApiKeyList, type GlobalApiKeyListController } from '@contember/react-ui-lib-tenant'
import { useRef } from 'react'
import { FormDialog } from '../../shell/FormDialog.js'
import { formClassName, PageHeader, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/** Keys that carry tenant-wide roles instead of a project membership. */
export const GlobalApiKeysPage = () => {
	const showToast = useShowToast()
	const listController = useRef<GlobalApiKeyListController>(undefined)

	const createKey = (
		<FormDialog label="Create key" title="Create a global API key" description="Roles are tenant roles, not project roles.">
			{close => (
				<CreateGlobalApiKeyForm
					onSuccess={({ result }) => {
						close()
						// The token is readable exactly once — the tenant API stores only its hash.
						showToast(
							<ToastContent title="API key created">
								<Input type="text" readOnly value={result.apiKey.token ?? ''} />
							</ToastContent>,
							{ type: 'success' },
						)
						listController.current?.refresh()
					}}
				>
					<form className={formClassName}>
						<CreateGlobalApiKeyFormFields />
					</form>
				</CreateGlobalApiKeyForm>
			)}
		</FormDialog>
	)

	return (
		<PageStack>
			<PanelSlots.Title>Global API keys</PanelSlots.Title>
			<PageHeader
				title="Global API keys"
				description="Permanent keys whose identity carries tenant-wide roles and no project membership. The token is readable once, at creation."
				actions={createKey}
			/>
			<PanelSection>
				<GlobalApiKeyList controller={listController} />
			</PanelSection>
		</PageStack>
	)
}

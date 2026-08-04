import { useProjectSlug } from '@contember/react-client'
import { CreateApiKeyForm } from '@contember/react-client-tenant'
import { Input, ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import { ApiKeyList, type ApiKeyListController, CreateApiKeyFormFields } from '@contember/react-ui-lib-tenant'
import { useRef } from 'react'
import { FormDialog } from '../../shell/FormDialog.js'
import { formClassName, PageHeader, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/** Keys whose identity is a member of this project; the roles come from the project's own schema. */
const ProjectApiKeys = ({ projectSlug }: { projectSlug: string }) => {
	const showToast = useShowToast()
	const listController = useRef<ApiKeyListController>(undefined)

	const createKey = (
		<FormDialog label="Create key" title="Create an API key" description="The key becomes a member of this project with the roles you pick.">
			{close => (
				<CreateApiKeyForm
					projectSlug={projectSlug}
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
						<CreateApiKeyFormFields projectSlug={projectSlug} />
					</form>
				</CreateApiKeyForm>
			)}
		</FormDialog>
	)

	return (
		<PageStack>
			<PageHeader
				title="API keys"
				description="Permanent keys scoped to this project. The token is readable once, at creation — afterwards the API keeps only its hash."
				actions={createKey}
			/>
			<PanelSection>
				<ApiKeyList controller={listController} />
			</PanelSection>
		</PageStack>
	)
}

export const ProjectApiKeysPage = () => {
	const projectSlug = useProjectSlug()

	return (
		<>
			<PanelSlots.Title>API keys</PanelSlots.Title>
			{/* The router mounts project pages inside `ProjectScopeProvider` only, so the slug is always set. */}
			{projectSlug !== undefined && <ProjectApiKeys projectSlug={projectSlug} />}
		</>
	)
}

import { useProjectSlug } from '@contember/react-client'
import { SetProjectSecretForm } from '@contember/react-client-tenant'
import { ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import { ProjectSecretList, type ProjectSecretListController, SetProjectSecretFormFields } from '@contember/react-ui-lib-tenant'
import { useRef } from 'react'
import { FormDialog } from '../../shell/FormDialog.js'
import { useProjectPermissions } from '../../shell/permissions.js'
import { formClassName, NoAccessState, PageHeader, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/** Secrets are write-only: the API answers with names and timestamps, never a value. */
const ProjectSecrets = ({ projectSlug }: { projectSlug: string }) => {
	const showToast = useShowToast()
	const listController = useRef<ProjectSecretListController>(undefined)
	const permissions = useProjectPermissions()

	const setSecret = (
		<FormDialog
			label="Set secret"
			title="Set a secret"
			description="An existing key is overwritten; there is no way to read the old value back."
		>
			{close => (
				<SetProjectSecretForm
					projectSlug={projectSlug}
					onSuccess={() => {
						close()
						showToast(<ToastContent>Secret saved</ToastContent>, { type: 'success' })
						listController.current?.refresh()
					}}
				>
					<form className={formClassName}>
						<SetProjectSecretFormFields />
					</form>
				</SetProjectSecretForm>
			)}
		</FormDialog>
	)

	return (
		<PageStack>
			<PageHeader
				title="Secrets"
				description="Values the project's configuration reads at runtime. They are encrypted at rest and never returned by the API — only their names and timestamps are."
				actions={permissions?.canSetSecret === false ? undefined : setSecret}
			/>
			{permissions?.canViewSecrets === false
				? <NoAccessState description="Setting a secret does not imply reading which ones exist; this account may do one and not the other." />
				: (
					<PanelSection>
						<ProjectSecretList controller={listController} />
					</PanelSection>
				)}
		</PageStack>
	)
}

export const ProjectSecretsPage = () => {
	const projectSlug = useProjectSlug()

	return (
		<>
			<PanelSlots.Title>Secrets</PanelSlots.Title>
			{/* The router mounts project pages inside `ProjectScopeProvider` only, so the slug is always set. */}
			{projectSlug !== undefined && <ProjectSecrets projectSlug={projectSlug} />}
		</>
	)
}

import { useProjectSlug } from '@contember/react-client'
import { SetProjectSecretForm } from '@contember/react-client-tenant'
import { ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import { ProjectSecretList, type ProjectSecretListController, SetProjectSecretFormFields } from '@contember/react-ui-lib-tenant'
import { useRef } from 'react'
import { formClassName, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'

/** Secrets are write-only: the API answers with names and timestamps, never a value. */
const ProjectSecrets = ({ projectSlug }: { projectSlug: string }) => {
	const showToast = useShowToast()
	const listController = useRef<ProjectSecretListController>(undefined)

	return (
		<PageStack>
			<PanelSection title="Secrets">
				{/* Empty rather than failing for a caller who may not read them. */}
				<ProjectSecretList controller={listController} />
			</PanelSection>

			<PanelSection title="Set a secret" description="An existing key is overwritten; there is no way to read the old value back.">
				<SetProjectSecretForm
					projectSlug={projectSlug}
					onSuccess={() => {
						showToast(<ToastContent>Secret saved</ToastContent>, { type: 'success' })
						listController.current?.refresh()
					}}
				>
					<form className={formClassName}>
						<SetProjectSecretFormFields />
					</form>
				</SetProjectSecretForm>
			</PanelSection>
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

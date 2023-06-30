import {
	formatContentApiRelativeUrl,
	tenantApiRelativeUrl,
	useApiBaseUrl,
	useProjectSlug,
	useSessionTokenWithMeta,
	useStageSlug,
} from '@contember/react-client'
import { DevPanel, Table, TableCell, TableHeaderCell, TableRow } from '@contember/ui'
import { GlobeIcon } from 'lucide-react'

export const ApiPanel = () => {
	const apiBaseUrl = useApiBaseUrl()
	const projectSlug = useProjectSlug()
	const stageSlug = useStageSlug()
	const sessionToken = useSessionTokenWithMeta()
	if (!projectSlug || !stageSlug) {
		return null
	}
	return (
		<DevPanel icon={<GlobeIcon />} heading="API URLs">
			<Table>
				<TableRow>
					<TableHeaderCell>Project</TableHeaderCell>
					<TableCell>{projectSlug}</TableCell>
				</TableRow>
				<TableRow>
					<TableHeaderCell>Base URL</TableHeaderCell>
					<TableCell>{apiBaseUrl}</TableCell>
				</TableRow>
				<TableRow>
					<TableHeaderCell>Content API URL</TableHeaderCell>
					<TableCell>{apiBaseUrl}{formatContentApiRelativeUrl(projectSlug, stageSlug)}</TableCell>
				</TableRow>

				<TableRow>
					<TableHeaderCell>Tenant API URL</TableHeaderCell>
					<TableCell>{apiBaseUrl}{tenantApiRelativeUrl}</TableCell>
				</TableRow>
				<TableRow>
					<TableHeaderCell>Token</TableHeaderCell>
					<TableCell>
						<span>{sessionToken.token}</span>
					</TableCell>
				</TableRow>
			</Table>
		</DevPanel>
	)
}

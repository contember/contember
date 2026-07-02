import * as React from 'react'
import { Button, Loader, Table, TableCell, TableHead, TableHeader, TableRow } from '@contember/react-ui-lib-base'
import { RefreshCwIcon } from 'lucide-react'
import { useProjectSecretsQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { useProjectSlug } from '@contember/react-client'
import { dict } from '../dict.js'

export interface ProjectSecretListController {
	refresh: () => void
}

export interface ProjectSecretListProps {
	controller?: { current?: ProjectSecretListController }
}

export const ProjectSecretList = ({ controller }: ProjectSecretListProps) => {
	const projectSlug = useProjectSlug()!
	const [query, { refresh }] = useTenantQueryLoader(useProjectSecretsQuery(), {
		projectSlug,
	})
	if (controller) {
		controller.current = { refresh }
	}

	if (query.state === 'error') {
		return <div className="text-destructive italic">{dict.tenant.projectSecretList.failedToLoadData}</div>
	}
	return (
		<div className="relative">
			{query.state !== 'success' && <Loader position="absolute" />}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{dict.tenant.projectSecretList.key}</TableHead>
						<TableHead>{dict.tenant.projectSecretList.created}</TableHead>
						<TableHead className="w-32">
							<div className="flex gap-2 items-center">
								<span>{dict.tenant.projectSecretList.updated}</span>
								<Button variant="outline" onClick={refresh} className="ml-auto" size="sm">
									<RefreshCwIcon className="w-3 h-3" />
								</Button>
							</div>
						</TableHead>
					</TableRow>
				</TableHeader>
				{'data' in query && query.data.length === 0 && (
					<TableRow>
						<TableCell colSpan={3}>{dict.tenant.projectSecretList.noResults}</TableCell>
					</TableRow>
				)}
				{'data' in query && query.data.map(secret => (
					<TableRow key={secret.key}>
						<TableCell className="font-mono">{secret.key}</TableCell>
						<TableCell className="whitespace-nowrap">{new Date(secret.createdAt).toLocaleString()}</TableCell>
						<TableCell className="whitespace-nowrap">{new Date(secret.updatedAt).toLocaleString()}</TableCell>
					</TableRow>
				))}
			</Table>
		</div>
	)
}

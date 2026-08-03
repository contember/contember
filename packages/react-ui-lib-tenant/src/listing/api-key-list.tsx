import * as React from 'react'
import { ReactNode, useState } from 'react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	Loader,
	Table,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	ToastContent,
	useShowToast,
} from '@contember/react-ui-lib-base'
import { BanIcon, RefreshCwIcon } from 'lucide-react'
import { ProjectApiKeysQueryResult, useDisableApiKeyMutation, useProjectApiKeysQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { useProjectSlug } from '@contember/react-client'
import { dict } from '../dict.js'

const formatDateTime = (value?: string | null): ReactNode => {
	if (!value) {
		return <span className="text-gray-400 italic">{dict.tenant.apiKeyList.never}</span>
	}
	return new Date(value).toLocaleString()
}

const projectRoles = (apiKey: ProjectApiKeysQueryResult[number], projectSlug: string): string[] =>
	apiKey.identity.projects
		.filter(it => it.project.slug === projectSlug)
		.flatMap(it => it.memberships.map(membership => membership.role))

export interface ApiKeyListController {
	refresh: () => void
}

export interface ApiKeyListProps {
	controller?: { current?: ApiKeyListController }
}

export const ApiKeyList = ({ controller }: ApiKeyListProps) => {
	const projectSlug = useProjectSlug()!
	const [query, { refresh }] = useTenantQueryLoader(useProjectApiKeysQuery(), { projectSlug })
	if (controller) {
		controller.current = { refresh }
	}
	const showToast = useShowToast()

	const onDisabled = () => {
		refresh()
		showToast(<ToastContent>{dict.tenant.apiKeyList.disableSuccess}</ToastContent>, { type: 'success' })
	}
	const onDisableError = () => {
		showToast(<ToastContent>{dict.tenant.apiKeyList.disableFailed}</ToastContent>, { type: 'error' })
	}

	if (query.state === 'error') {
		return <div className="text-destructive italic">{dict.tenant.apiKeyList.failedToLoadData}</div>
	}
	return (
		<div className="relative">
			{query.state !== 'success' && <Loader position="absolute" />}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{dict.tenant.apiKeyList.description}</TableHead>
						<TableHead>{dict.tenant.apiKeyList.type}</TableHead>
						<TableHead>{dict.tenant.apiKeyList.roles}</TableHead>
						<TableHead>{dict.tenant.apiKeyList.status}</TableHead>
						<TableHead>{dict.tenant.apiKeyList.created}</TableHead>
						<TableHead>{dict.tenant.apiKeyList.lastUsed}</TableHead>
						<TableHead>{dict.tenant.apiKeyList.expires}</TableHead>
						<TableHead className="w-24">
							<div className="flex gap-2 items-center">
								<span>{dict.tenant.apiKeyList.action}</span>
								<Button variant="outline" onClick={refresh} className="ml-auto" size="sm">
									<RefreshCwIcon className="w-3 h-3" />
								</Button>
							</div>
						</TableHead>
					</TableRow>
				</TableHeader>
				{'data' in query && query.data.length === 0 && (
					<TableRow>
						<TableCell colSpan={8}>{dict.tenant.apiKeyList.noResults}</TableCell>
					</TableRow>
				)}
				{'data' in query && query.data.map(apiKey => {
					const roles = projectRoles(apiKey, projectSlug)
					return (
						<TableRow key={apiKey.id}>
							<TableCell>{apiKey.description ?? apiKey.identity.description ?? dict.tenant.apiKeyList.unnamed}</TableCell>
							<TableCell>{apiKey.type ?? dict.tenant.apiKeyList.unknownType}</TableCell>
							<TableCell>{roles.length ? roles.join(', ') : dict.tenant.apiKeyList.noRoles}</TableCell>
							<TableCell>
								{apiKey.enabled === false
									? <span className="text-destructive">{dict.tenant.apiKeyList.disabled}</span>
									: dict.tenant.apiKeyList.enabled}
							</TableCell>
							<TableCell className="whitespace-nowrap">{formatDateTime(apiKey.createdAt)}</TableCell>
							<TableCell className="whitespace-nowrap">{formatDateTime(apiKey.lastUsedAt)}</TableCell>
							<TableCell className="whitespace-nowrap">{formatDateTime(apiKey.expiresAt)}</TableCell>
							<TableCell className="whitespace-nowrap">
								{apiKey.enabled !== false && <DisableApiKeyDialog apiKeyId={apiKey.id} onSuccess={onDisabled} onError={onDisableError} />}
							</TableCell>
						</TableRow>
					)
				})}
			</Table>
		</div>
	)
}

const DisableApiKeyDialog = ({ apiKeyId, onSuccess, onError }: { apiKeyId: string; onSuccess: () => void; onError: () => void }) => {
	const disableApiKey = useDisableApiKeyMutation()
	const [open, setOpen] = useState(false)
	const onConfirm = async () => {
		const result = await disableApiKey({ id: apiKeyId })
		setOpen(false)
		if (result.ok) {
			onSuccess()
		} else {
			onError()
		}
	}
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="destructive">
					<BanIcon className="w-3 h-3" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{dict.tenant.apiKeyList.disableConfirmation}</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{dict.tenant.apiKeyList.cancel}</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button variant="destructive" onClick={onConfirm}>{dict.tenant.apiKeyList.disable}</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

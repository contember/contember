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
import { useDisableApiKeyMutation, useGlobalApiKeysQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { dict } from '../dict.js'

const formatDateTime = (value?: string | null): ReactNode => {
	if (!value) {
		return <span className="text-gray-400 italic">{dict.tenant.globalApiKeyList.never}</span>
	}
	return new Date(value).toLocaleString()
}

export interface GlobalApiKeyListController {
	refresh: () => void
}

export interface GlobalApiKeyListProps {
	controller?: { current?: GlobalApiKeyListController }
}

export const GlobalApiKeyList = ({ controller }: GlobalApiKeyListProps) => {
	const [query, { refresh }] = useTenantQueryLoader(useGlobalApiKeysQuery(), {})
	if (controller) {
		controller.current = { refresh }
	}
	const showToast = useShowToast()

	const onDisabled = () => {
		refresh()
		showToast(<ToastContent>{dict.tenant.globalApiKeyList.disableSuccess}</ToastContent>, { type: 'success' })
	}
	const onDisableError = () => {
		showToast(<ToastContent>{dict.tenant.globalApiKeyList.disableFailed}</ToastContent>, { type: 'error' })
	}

	if (query.state === 'error') {
		return <div className="text-destructive italic">{dict.tenant.globalApiKeyList.failedToLoadData}</div>
	}
	return (
		<div className="relative">
			{query.state !== 'success' && <Loader position="absolute" />}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{dict.tenant.globalApiKeyList.description}</TableHead>
						<TableHead>{dict.tenant.globalApiKeyList.roles}</TableHead>
						<TableHead>{dict.tenant.globalApiKeyList.status}</TableHead>
						<TableHead>{dict.tenant.globalApiKeyList.created}</TableHead>
						<TableHead>{dict.tenant.globalApiKeyList.lastUsed}</TableHead>
						<TableHead>{dict.tenant.globalApiKeyList.expires}</TableHead>
						<TableHead className="w-24">
							<div className="flex gap-2 items-center">
								<span>{dict.tenant.globalApiKeyList.action}</span>
								<Button variant="outline" onClick={refresh} className="ml-auto" size="sm">
									<RefreshCwIcon className="w-3 h-3" />
								</Button>
							</div>
						</TableHead>
					</TableRow>
				</TableHeader>
				{'data' in query && query.data.length === 0 && (
					<TableRow>
						<TableCell colSpan={7}>{dict.tenant.globalApiKeyList.noResults}</TableCell>
					</TableRow>
				)}
				{'data' in query && query.data.map(apiKey => (
					<TableRow key={apiKey.id}>
						<TableCell>{apiKey.description ?? dict.tenant.globalApiKeyList.unnamed}</TableCell>
						<TableCell>
							{apiKey.identity.roles?.length ? apiKey.identity.roles.join(', ') : dict.tenant.globalApiKeyList.noRoles}
						</TableCell>
						<TableCell>
							{apiKey.enabled === false
								? <span className="text-destructive">{dict.tenant.globalApiKeyList.disabled}</span>
								: dict.tenant.globalApiKeyList.enabled}
						</TableCell>
						<TableCell className="whitespace-nowrap">{formatDateTime(apiKey.createdAt)}</TableCell>
						<TableCell className="whitespace-nowrap">{formatDateTime(apiKey.lastUsedAt)}</TableCell>
						<TableCell className="whitespace-nowrap">{formatDateTime(apiKey.expiresAt)}</TableCell>
						<TableCell className="whitespace-nowrap">
							{apiKey.enabled !== false && <DisableApiKeyDialog apiKeyId={apiKey.id} onSuccess={onDisabled} onError={onDisableError} />}
						</TableCell>
					</TableRow>
				))}
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
					<AlertDialogTitle>{dict.tenant.globalApiKeyList.disableConfirmation}</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{dict.tenant.globalApiKeyList.cancel}</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button variant="destructive" onClick={onConfirm}>{dict.tenant.globalApiKeyList.disable}</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

import * as React from 'react'
import { useState } from 'react'
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
import { RefreshCwIcon, UnlinkIcon } from 'lucide-react'
import { useDisconnectMyIdentityProviderMutation, useMyIdentityProvidersQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { dict } from '../dict.js'

export interface IdentityProviderConnectionsController {
	refresh: () => void
}

export interface IdentityProviderConnectionsProps {
	controller?: { current?: IdentityProviderConnectionsController }
}

export const IdentityProviderConnections = ({ controller }: IdentityProviderConnectionsProps) => {
	const [query, { refresh }] = useTenantQueryLoader(useMyIdentityProvidersQuery(), {})
	if (controller) {
		controller.current = { refresh }
	}

	if (query.state === 'error') {
		return <div className="text-destructive italic">{dict.tenant.identityProviderConnections.failedToLoadData}</div>
	}
	return (
		<div className="relative">
			{query.state !== 'success' && <Loader position="absolute" />}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{dict.tenant.identityProviderConnections.provider}</TableHead>
						<TableHead>{dict.tenant.identityProviderConnections.account}</TableHead>
						<TableHead>{dict.tenant.identityProviderConnections.connectedAt}</TableHead>
						<TableHead>{dict.tenant.identityProviderConnections.status}</TableHead>
						<TableHead className="w-24">
							<div className="flex gap-2 items-center">
								<span>{dict.tenant.identityProviderConnections.action}</span>
								<Button variant="outline" onClick={refresh} className="ml-auto" size="sm">
									<RefreshCwIcon className="w-3 h-3" />
								</Button>
							</div>
						</TableHead>
					</TableRow>
				</TableHeader>
				{'data' in query && query.data.length === 0 && (
					<TableRow>
						<TableCell colSpan={5}>{dict.tenant.identityProviderConnections.noResults}</TableCell>
					</TableRow>
				)}
				{'data' in query && query.data.map(connection => (
					<TableRow key={connection.id}>
						<TableCell className="font-medium">{connection.identityProvider.slug}</TableCell>
						<TableCell>{connection.externalIdentifier}</TableCell>
						<TableCell className="whitespace-nowrap">{new Date(connection.createdAt).toLocaleString()}</TableCell>
						<TableCell>
							{connection.identityProvider.disabledAt
								? <span className="text-destructive">{dict.tenant.identityProviderConnections.disabled}</span>
								: null}
						</TableCell>
						<TableCell className="whitespace-nowrap">
							<DisconnectDialog connectionId={connection.id} onSuccess={refresh} />
						</TableCell>
					</TableRow>
				))}
			</Table>
		</div>
	)
}

const DisconnectDialog = ({ connectionId, onSuccess }: { connectionId: string; onSuccess: () => void }) => {
	const disconnect = useDisconnectMyIdentityProviderMutation()
	const showToast = useShowToast()
	const [open, setOpen] = useState(false)
	const onConfirm = async () => {
		const result = await disconnect({ id: connectionId })
		setOpen(false)
		if (result.ok) {
			showToast(<ToastContent>{dict.tenant.identityProviderConnections.disconnected}</ToastContent>, { type: 'success' })
			onSuccess()
		} else {
			const message = dict.tenant.identityProviderConnections.errorMessages[result.error]
				?? dict.tenant.identityProviderConnections.errorMessages.UNKNOWN_ERROR
			showToast(<ToastContent>{message}</ToastContent>, { type: 'error' })
		}
	}
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="destructive">
					<UnlinkIcon className="w-3 h-3" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{dict.tenant.identityProviderConnections.disconnectConfirmation}</AlertDialogTitle>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{dict.tenant.identityProviderConnections.cancel}</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button variant="destructive" onClick={onConfirm}>{dict.tenant.identityProviderConnections.disconnect}</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

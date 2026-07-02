import * as React from 'react'
import { useState } from 'react'
import { Button, Input, Loader, Table, TableCell, TableHead, TableHeader, TableRow } from '@contember/react-ui-lib-base'
import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon } from 'lucide-react'
import { usePersonsQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { dict } from '../dict.js'
import { MfaBadges } from './mfa.js'

const perPage = 20

export interface PersonsListController {
	refresh: () => void
}

export interface PersonsListProps {
	controller?: { current?: PersonsListController }
}

export const PersonsList = ({ controller }: PersonsListProps) => {
	const [page, setPage] = useState(0)
	const [email, setEmail] = useState('')

	const [query, { refresh }] = useTenantQueryLoader(usePersonsQuery(), {
		filter: email ? { email } : undefined,
		offset: page * perPage,
		limit: perPage + 1,
	})
	if (controller) {
		controller.current = { refresh }
	}

	return (
		<div className="relative flex flex-col gap-4">
			<Input
				type="text"
				value={email}
				placeholder={dict.tenant.personsList.filterEmailPlaceholder}
				onChange={e => {
					setPage(0)
					setEmail(e.target.value)
				}}
			/>
			{query.state === 'error'
				? <div className="text-destructive italic">{dict.tenant.personsList.failedToLoadData}</div>
				: (
					<div className="relative">
						{query.state !== 'success' && <Loader position="absolute" />}
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{dict.tenant.personsList.email}</TableHead>
									<TableHead>{dict.tenant.personsList.name}</TableHead>
									<TableHead>{dict.tenant.personsList.roles}</TableHead>
									<TableHead className="w-32">
										<div className="flex gap-2 items-center">
											<span>{dict.tenant.personsList.mfa}</span>
											<Button variant="outline" onClick={refresh} className="ml-auto" size="sm">
												<RefreshCwIcon className="w-3 h-3" />
											</Button>
										</div>
									</TableHead>
								</TableRow>
							</TableHeader>
							{'data' in query && query.data.length === 0 && (
								<TableRow>
									<TableCell colSpan={4}>{dict.tenant.personsList.noResults}</TableCell>
								</TableRow>
							)}
							{'data' in query && query.data.slice(0, perPage).map(person => (
								<TableRow key={person.id}>
									<TableCell>{person.email ?? dict.tenant.personsList.noEmail}</TableCell>
									<TableCell>{person.name ?? dict.tenant.personsList.noName}</TableCell>
									<TableCell>
										{person.identity.roles?.length ? person.identity.roles.join(', ') : dict.tenant.personsList.noRoles}
									</TableCell>
									<TableCell>
										<MfaBadges otpEnabled={person.otpEnabled} emailOtpEnabled={person.emailOtpEnabled} />
									</TableCell>
								</TableRow>
							))}
						</Table>
						<div className="flex gap-2 mt-4 justify-between">
							<Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
								<ChevronLeftIcon className="w-4 h-4" />
								<span className="sr-only">{dict.tenant.personsList.previous}</span>
							</Button>
							<Button variant="outline" disabled={'data' in query && query.data.length <= perPage} onClick={() => setPage(page + 1)}>
								<ChevronRightIcon className="w-4 h-4" />
								<span className="sr-only">{dict.tenant.personsList.next}</span>
							</Button>
						</div>
					</div>
				)}
		</div>
	)
}

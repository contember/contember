import type { SetVariablesMode } from '@contember/graphql-client-actions'
import { useProjectSlug } from '@contember/react-client'
import { useTenantQueryLoader } from '@contember/react-client-tenant'
import { Link } from '@contember/react-routing'
import {
	AnchorButton,
	Button,
	Input,
	Label,
	Loader,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	TableWrapper,
	ToastContent,
	useShowToast,
} from '@contember/react-ui-lib-base'
import { renderConfigQueryState } from '@contember/react-ui-lib-tenant'
import { ArrowLeftIcon, PencilIcon, VariableIcon } from 'lucide-react'
import { useState } from 'react'
import { FormDialog } from '../../shell/FormDialog.js'
import { EmptyState, formClassName, PageHeader, PageStack, PanelSection } from '../../shell/screens.js'
import { PanelSlots } from '../../shell/slots.js'
import { actionsErrorMessage } from './common.js'
import { type ActionsVariable, useSetVariablesMutation, useVariablesQuery } from './hooks.js'

const modeDescription: Record<SetVariablesMode, string> = {
	MERGE: 'Adds this variable or overwrites it, leaving the others alone.',
	SET: 'Replaces the whole set with what is submitted here — every variable not in this form is deleted.',
	APPEND_ONLY_MISSING: 'Adds this variable only if it does not exist yet; an existing value is kept.',
}

const isMode = (value: string): value is SetVariablesMode => value in modeDescription

interface SetVariableFormProps {
	initial?: ActionsVariable
	close: () => void
	onSaved: () => void
}

/** One variable at a time, because the mode applies to the whole submission and `SET` would drop the rest. */
const SetVariableForm = ({ initial, close, onSaved }: SetVariableFormProps) => {
	const showToast = useShowToast()
	const setVariables = useSetVariablesMutation()
	const [name, setName] = useState(initial?.name ?? '')
	const [value, setValue] = useState(initial?.value ?? '')
	const [mode, setMode] = useState<SetVariablesMode>('MERGE')
	const [pending, setPending] = useState(false)

	const submit = async () => {
		setPending(true)
		try {
			await setVariables({ variables: [{ name, value }], mode })
			close()
			showToast(<ToastContent>Variable saved</ToastContent>, { type: 'success' })
			onSaved()
		} catch (error) {
			showToast(<ToastContent title="Variable not saved">{actionsErrorMessage(error)}</ToastContent>, { type: 'error' })
		} finally {
			setPending(false)
		}
	}

	return (
		<form
			className={formClassName}
			onSubmit={e => {
				e.preventDefault()
				submit()
			}}
		>
			<div className="flex flex-col gap-2">
				<Label htmlFor="actions-variable-name">Name</Label>
				<Input id="actions-variable-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="webhookToken" />
				<p className="text-xs text-muted-foreground">Interpolated into a target's URL and headers as {'{{'}name{'}}'}.</p>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="actions-variable-value">Value</Label>
				<Input id="actions-variable-value" type="text" value={value} onChange={e => setValue(e.target.value)} />
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="actions-variable-mode">Mode</Label>
				<Select value={mode} onValueChange={next => setMode(isMode(next) ? next : 'MERGE')}>
					<SelectTrigger id="actions-variable-mode">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="MERGE">MERGE</SelectItem>
						<SelectItem value="SET">SET</SelectItem>
						<SelectItem value="APPEND_ONLY_MISSING">APPEND_ONLY_MISSING</SelectItem>
					</SelectContent>
				</Select>
				<p className={mode === 'SET' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>{modeDescription[mode]}</p>
			</div>
			<Button type="submit" disabled={pending || name === ''}>Save</Button>
		</form>
	)
}

const ActionsVariables = () => {
	// `useTenantQueryLoader` is generic despite the name — the repo's one loader, reused instead of a second one.
	const [query, { refresh }] = useTenantQueryLoader(useVariablesQuery(), {})
	const projectSlug = useProjectSlug()
	// The resolver rejects rather than answering an empty list, so "not yours to see" is an ordinary state.
	const nonData = renderConfigQueryState({
		query,
		forbiddenMessage: 'This account may not read the actions variables; that needs the project admin or deployer role.',
		failedMessage: 'The variables could not be loaded.',
	})
	const variables = 'data' in query ? query.data : undefined

	return (
		<PageStack>
			<PageHeader
				title="Variables"
				description="Values the dispatcher interpolates into a target's URL and headers as {{name}}. Whatever the API returns is shown as it is — it does not mask values."
				actions={
					<>
						<Link to={{ pageName: 'actionsQueue', parameters: { project: projectSlug } }}>
							<AnchorButton variant="ghost" size="sm" className="gap-1.5">
								<ArrowLeftIcon className="size-4" />
								Queue
							</AnchorButton>
						</Link>
						<FormDialog
							label="Set variable"
							title="Set a variable"
							description="Takes effect on the next dispatch; events already in flight keep the old value."
						>
							{close => <SetVariableForm close={close} onSaved={refresh} />}
						</FormDialog>
					</>
				}
			/>
			<PanelSection>
				{nonData !== null ? nonData : (
					<div className="relative">
						{query.state === 'refreshing' && <Loader position="absolute" />}
						{variables !== undefined && variables.length === 0
							? (
								<EmptyState
									icon={<VariableIcon className="size-5" />}
									title="No variables"
									description="Targets that interpolate {{name}} into a URL or a header need one set here, or the placeholder stays unresolved."
								/>
							)
							: (
								<TableWrapper>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Name</TableHead>
												<TableHead>Value</TableHead>
												<TableHead />
											</TableRow>
										</TableHeader>
										<TableBody>
											{variables?.map(variable => (
												<TableRow key={variable.name}>
													<TableCell className="font-mono text-xs">{variable.name}</TableCell>
													<TableCell className="font-mono text-xs break-all">{variable.value}</TableCell>
													<TableCell>
														<div className="flex justify-end">
															<FormDialog
																label="Edit"
																title={`Set ${variable.name}`}
																description="Takes effect on the next dispatch; events already in flight keep the old value."
																icon={<PencilIcon className="size-4" />}
																variant="outline"
															>
																{close => <SetVariableForm initial={variable} close={close} onSaved={refresh} />}
															</FormDialog>
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableWrapper>
							)}
					</div>
				)}
			</PanelSection>
		</PageStack>
	)
}

export const ActionsVariablesPage = () => (
	<>
		<PanelSlots.Title>Actions variables</PanelSlots.Title>
		<ActionsVariables />
	</>
)

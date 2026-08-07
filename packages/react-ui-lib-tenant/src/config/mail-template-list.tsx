import * as React from 'react'
import { useState } from 'react'
import { Button, Loader, Table, TableCell, TableHead, TableHeader, TableRow } from '@contember/react-ui-lib-base'
import { useMailTemplatesQuery, useTenantQueryLoader } from '@contember/react-client-tenant'
import { dict } from '../dict.js'
import { formatConfigValue, ManagedByCliNote, renderConfigQueryState } from './common.js'

export interface MailTemplateListController {
	refresh: () => void
}

export interface MailTemplateListProps {
	controller?: { current?: MailTemplateListController }
}

/** Templates have no id; type + variant + project is what identifies one server-side. */
const templateKey = (template: { type: string; variant?: string | null; projectSlug?: string | null }) =>
	`${template.projectSlug ?? ''}/${template.type}/${template.variant ?? ''}`

/**
 * `MailTemplateList` shows the configured mail templates read-only, with the body
 * collapsed behind a toggle.
 *
 * Templates are written with `contember tenant:apply`; reading them requires
 * `mailTemplate:list`. A type missing from this list is not broken — it means the
 * built-in default is in use.
 *
 * ## Example
 * ```tsx
 * <MailTemplateList />
 * ```
 */
export const MailTemplateList = ({ controller }: MailTemplateListProps) => {
	const [query, { refresh }] = useTenantQueryLoader(useMailTemplatesQuery(), {})
	const [expanded, setExpanded] = useState<string | null>(null)
	if (controller) {
		controller.current = { refresh }
	}

	const nonData = renderConfigQueryState({
		query,
		forbiddenMessage: dict.tenant.mailTemplateList.forbidden,
		failedMessage: dict.tenant.mailTemplateList.failedToLoadData,
	})
	if (nonData !== null) {
		return nonData
	}
	if (!('data' in query)) {
		return null
	}
	const templates = query.data

	return (
		<div className="relative flex flex-col gap-3">
			{query.state !== 'success' && <Loader position="absolute" />}
			<ManagedByCliNote />

			{templates.length === 0
				? <div className="text-gray-500 italic">{dict.tenant.mailTemplateList.noResults}</div>
				: (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{dict.tenant.mailTemplateList.type}</TableHead>
								<TableHead>{dict.tenant.mailTemplateList.variant}</TableHead>
								<TableHead>{dict.tenant.mailTemplateList.project}</TableHead>
								<TableHead>{dict.tenant.mailTemplateList.subject}</TableHead>
								<TableHead>{dict.tenant.mailTemplateList.replyTo}</TableHead>
								<TableHead>{dict.tenant.mailTemplateList.useLayout}</TableHead>
								<TableHead />
							</TableRow>
						</TableHeader>
						{templates.map(template => {
							const key = templateKey(template)
							return (
								<React.Fragment key={key}>
									<TableRow>
										<TableCell className="font-mono text-xs">{template.type}</TableCell>
										<TableCell>{template.variant || '—'}</TableCell>
										<TableCell>{template.projectSlug ?? '—'}</TableCell>
										<TableCell className="font-medium">{template.subject}</TableCell>
										<TableCell>{template.replyTo ?? '—'}</TableCell>
										<TableCell>{formatConfigValue(template.useLayout)}</TableCell>
										<TableCell>
											<Button variant="outline" size="sm" onClick={() => setExpanded(expanded === key ? null : key)}>
												{expanded === key
													? dict.tenant.mailTemplateList.hideContent
													: dict.tenant.mailTemplateList.showContent}
											</Button>
										</TableCell>
									</TableRow>
									{expanded === key && (
										<TableRow>
											<TableCell colSpan={7}>
												<pre className="overflow-x-auto whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded">
													{template.content}
												</pre>
											</TableCell>
										</TableRow>
									)}
								</React.Fragment>
							)
						})}
					</Table>
				)}
		</div>
	)
}

import * as TenantApi from '@contember/graphql-client-tenant'
import { ModelType } from 'graphql-ts-client-api'
import { TenantApiOptions, useTenantApi } from '../useTenantApi.js'
import { useCallback } from 'react'

const mailTemplateFragment = TenantApi.mailTemplateData$$

export type MailTemplatesQueryResult = readonly ModelType<typeof mailTemplateFragment>[]

/**
 * Lists the configured mail templates, including their rendered `content`.
 *
 * Read-only on purpose — templates are written with `contember tenant:apply`.
 * A template not listed here means the built-in default is in use.
 *
 * Requires `mailTemplate:list`; the resolver **throws** for a caller without it.
 */
export const useMailTemplatesQuery = (options: TenantApiOptions = {}) => {
	const executor = useTenantApi(options)
	return useCallback(async ({}: {} = {}): Promise<MailTemplatesQueryResult> => {
		const result = await executor(TenantApi.query$.mailTemplates(mailTemplateFragment), {})

		return result.mailTemplates
	}, [executor])
}

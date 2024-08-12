import { useEffect, useMemo, useState } from 'react'
import { Environment, Schema, SchemaLoader } from '@contember/binding'
import { GraphQlClientError } from '@contember/graphql-client'
import { useCurrentContentGraphQlClient } from '@contember/react-client'

export const useEnvironmentWithSchema = (env: Environment): Environment | undefined => {
	const [schema, setSchema] = useState<Schema | undefined>(() => env.hasSchema() ? env.getSchema() : undefined)
	const contentClient = useCurrentContentGraphQlClient()
	useEffect(() => {
		if (schema !== undefined) {
			return
		}

		(async () => {
			try {
				setSchema(await SchemaLoader.loadSchema(contentClient))

			} catch (e) {
				if (e instanceof GraphQlClientError) {
					if (e.type === 'aborted') {
						return
					}
				} else {
					throw e
				}
			}
		})()
	}, [contentClient, schema])

	return useMemo(() => schema ? env.withSchema(schema) : undefined, [env, schema])
}

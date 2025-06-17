import { GraphQlClient, GraphQlClientOptions } from '@contember/graphql-client'

export type GraphQlClientFactory = (options: GraphQlClientOptions) => GraphQlClient

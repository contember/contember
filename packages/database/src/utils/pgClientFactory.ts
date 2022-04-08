import { Client as PgClient, ClientConfig } from 'pg'
import { DatabaseCredentials } from '../types'

export type PgClientFactory = () => PgClient
export const createPgClientFactory = (config: ClientConfig & DatabaseCredentials) => () => new PgClient(config)

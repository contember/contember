import { IPostgresInterval } from 'postgres-interval'

export type Interval = string & { __kind: 'Interval' }
export type OutputInterval = string & { __kind: 'Interval' } | IPostgresInterval

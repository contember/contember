import KnexConnection from "../core/knex/KnexConnection";

export interface Context
{
  db: KnexConnection
  identityId: string
}

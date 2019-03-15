import { MigrationBuilder } from 'node-pg-migrate'
import { ContentEvent } from '../../dtos/Event'
import { SchemaUpdater } from './schemaUpdateUtils'

export interface Modification<Data> {
	createSql(builder: MigrationBuilder): void | Promise<void>;

	getSchemaUpdater(): SchemaUpdater;

	transformEvents(events: ContentEvent[]): ContentEvent[] | Promise<ContentEvent[]>
}

import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { testMigrations } from '../../src/tests'
import { SQL } from '../../src/tags'

namespace EventLogNoConfig {
	export class Author {
		name = def.stringColumn()
	}
}

namespace EventLogDisabled {
	@def.DisableEventLog()
	export class Author {
		name = def.stringColumn()
	}
}


testMigrations('event log - disable', {
	original: createSchema(EventLogNoConfig),
	updated: createSchema(EventLogDisabled),
	diff: [
		{
			modification: 'toggleEventLog',
			entityName: 'Author',
			enabled: false,
		},
	],
	sql: SQL `DROP TRIGGER "log_event" ON "author";
	DROP TRIGGER "log_event_trx" ON "author";`,
})

testMigrations('event log - enable', {
	original: createSchema(EventLogDisabled),
	updated: createSchema(EventLogNoConfig),
	diff: [
		{
			modification: 'toggleEventLog',
			entityName: 'Author',
			enabled: true,
		},
	],
	sql: SQL`CREATE TRIGGER "log_event"
		AFTER INSERT OR UPDATE OR DELETE
		ON "author"
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
	CREATE CONSTRAINT TRIGGER "log_event_trx"
		AFTER INSERT OR UPDATE OR DELETE
		ON "author"
		DEFERRABLE INITIALLY DEFERRED
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event_commit"();`,
})

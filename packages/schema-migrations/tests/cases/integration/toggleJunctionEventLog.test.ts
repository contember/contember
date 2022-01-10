import { SchemaDefinition as def } from '@contember/schema-definition'
import { testMigrations } from '../../src/tests'
import { SQL } from '../../src/tags'

namespace EventLogNoConfig {
	export class Author {
		name = def.stringColumn()
		tags = def.manyHasMany(Tag)
	}
	export class Tag {
		name = def.stringColumn()
	}
}

namespace EventLogDisabled {
	export class Author {
		name = def.stringColumn()
		tags = def.manyHasMany(Tag).joiningTable({ eventLog: { enabled: false } })
	}

	export class Tag {
		name = def.stringColumn()
	}
}

testMigrations('event log junction - disable', {
	originalSchema: def.createModel(EventLogNoConfig),
	updatedSchema: def.createModel(EventLogDisabled),
	diff: [
		{
			modification: 'toggleJunctionEventLog',
			entityName: 'Author',
			fieldName: 'tags',
			enabled: false,
		},
	],
	sql: SQL `DROP TRIGGER "log_event" ON "author_tags";
	DROP TRIGGER "log_event_trx" ON "author_tags";`,
})

testMigrations('event log junction - enable', {
	originalSchema: def.createModel(EventLogDisabled),
	updatedSchema: def.createModel(EventLogNoConfig),
	diff: [
		{
			modification: 'toggleJunctionEventLog',
			entityName: 'Author',
			fieldName: 'tags',
			enabled: true,
		},
	],
	sql: SQL`CREATE TRIGGER "log_event"
		AFTER INSERT OR UPDATE OR DELETE
		ON "author_tags"
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event"($pga$author_id$pga$, $pga$tag_id$pga$);
	CREATE CONSTRAINT TRIGGER "log_event_trx"
		AFTER INSERT OR UPDATE OR DELETE
		ON "author_tags"
		DEFERRABLE INITIALLY DEFERRED
		FOR EACH ROW
	EXECUTE PROCEDURE "system"."trigger_event_commit"();`,
})

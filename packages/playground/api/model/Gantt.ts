import { c } from '@contember/schema-definition'

export class GanttActivity {
	name = c.stringColumn()
	startTime = c.dateTimeColumn()
	endTime = c.dateTimeColumn()
	discriminator = c.manyHasOne(GanttDiscriminator, 'activities')
	category = c.manyHasOne(GanttCategory)
}

export class GanttDiscriminator {
	slug = c.stringColumn().unique()
	name = c.stringColumn()
	activities = c.oneHasMany(GanttActivity, 'discriminator')
}

export class GanttCategory {
	name = c.stringColumn()
}

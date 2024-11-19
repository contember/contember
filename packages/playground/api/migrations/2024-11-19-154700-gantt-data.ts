import { queryBuilder } from '../client'
import { printMutation } from './utils'

export default printMutation([
	queryBuilder.create('GanttDiscriminator', {
		data: {
			slug: '1',
			name: 'Einstein Lecture Theatre',
		},
	}),
	queryBuilder.create('GanttDiscriminator', {
		data: {
			slug: '2',
			name: 'Newton Hall',
		},
	}),
	queryBuilder.create('GanttDiscriminator', {
		data: {
			slug: '3',
			name: 'Franklin Hall',
		},
	}),
	queryBuilder.create('GanttDiscriminator', {
		data: {
			slug: '4',
			name: 'Tesla Auditorium',
		},
	}),
	queryBuilder.create('GanttDiscriminator', {
		data: {
			slug: '5',
			name: 'Hawking Seminar Room',
		},
	}),
	queryBuilder.create('GanttDiscriminator', {
		data: {
			slug: '6',
			name: 'Galileo Seminar Room',
		},
	}),

	queryBuilder.create('GanttActivity', {
		data: {
			name: 'Introduction to Quantum Physics',
			startTime: '2024-11-19T09:00:00.000Z',
			endTime: '2024-11-19T10:30:00.000Z',
			discriminator: { connect: { slug: '1' } },
		},
	}),

	queryBuilder.create('GanttActivity', {
		data: {
			name: 'Modern Art History',
			startTime: '2024-11-19T09:30:00.000Z',
			endTime: '2024-11-19T11:00:00.000Z',
			discriminator: { connect: { slug: '2' } },
		},
	}),

	queryBuilder.create('GanttActivity', {
		data: {
			name: 'Advanced Calculus',
			startTime: '2024-11-19T10:00:00.000Z',
			endTime: '2024-11-19T11:30:00.000Z',
			discriminator: { connect: { slug: '3' } },
		},
	}),

	queryBuilder.create('GanttActivity', {
		data: {
			name: 'Environmental Science',
			startTime: '2024-11-19T09:00:00.000Z',
			endTime: '2024-11-19T10:00:00.000Z',
			discriminator: { connect: { slug: '4' } },
		},
	}),

	queryBuilder.create('GanttActivity', {
		data: {
			name: 'Philosophy 101',
			startTime: '2024-11-19T11:00:00.000Z',
			endTime: '2024-11-19T12:30:00.000Z',
			discriminator: { connect: { slug: '5' } },
		},
	}),

	queryBuilder.create('GanttActivity', {
		data: {
			name: 'Computer Programming Basics',
			startTime: '2024-11-19T10:30:00.000Z',
			endTime: '2024-11-19T12:00:00.000Z',
			discriminator: { connect: { slug: '6' } },
		},
	}),

	queryBuilder.create('GanttActivity', {
		data: {
			name: 'Medieval Literature',
			startTime: '2024-11-19T11:30:00.000Z',
			endTime: '2024-11-19T13:00:00.000Z',
			discriminator: { connect: { slug: '1' } },
		},
	}),

	queryBuilder.create('GanttActivity', {
		data: {
			name: 'Molecular Biology',
			startTime: '2024-11-19T12:00:00.000Z',
			endTime: '2024-11-19T13:30:00.000Z',
			discriminator: { connect: { slug: '2' } },
		},
	}),

	queryBuilder.create('GanttActivity', {
		data: {
			name: 'Economics Principles',
			startTime: '2024-11-19T13:30:00.000Z',
			endTime: '2024-11-19T15:00:00.000Z',
			discriminator: { connect: { slug: '3' } },
		},
	}),

	queryBuilder.create('GanttActivity', {
		data: {
			name: 'Creative Writing Workshop',
			startTime: '2024-11-19T14:00:00.000Z',
			endTime: '2024-11-19T15:30:00.000Z',
			discriminator: { connect: { slug: '4' } },
		},
	}),
])

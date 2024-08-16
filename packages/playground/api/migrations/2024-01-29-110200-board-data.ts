import { printMutation } from './utils'
import { queryBuilder } from '../client'

export default printMutation([
	queryBuilder.create('BoardTag', {
		data: {
			name: 'Bug',
			slug: 'bug',
			color: '#ff0000',
		},
	}),
	queryBuilder.create('BoardTag', {
		data: {
			name: 'Feature request',
			slug: 'feature-request',
			color: '#00ff00',
		},
	}),
	queryBuilder.create('BoardTag', {
		data: {
			name: 'Question',
			slug: 'question',
			color: '#0000ff',
		},
	}),
	queryBuilder.create('BoardUser', {
		data: {
			name: 'John Doe',
			username: 'john.doe',
		},
	}),
	queryBuilder.create('BoardUser', {
		data: {
			name: 'Jane Doe',
			username: 'jane.doe',
		},
	}),
	queryBuilder.create('BoardTask', {
		data: {
			title: 'Implement the board',
			description: 'Implement the board',
			status: 'done',
			assignee: {
				connect: {
					username: 'john.doe',
				},
			},
			tags: [
				{ connect: { slug: 'feature-request' } },
			],
		},
	}),
	queryBuilder.create('BoardTask', {
		data: {
			title: 'Fix board sorting',
			description: 'it is broken',
			status: 'inProgress',
			assignee: {
				connect: {
					username: 'john.doe',
				},
			},
			tags: [
				{ connect: { slug: 'bug' } },
			],
		},
	}),
	queryBuilder.create('BoardTask', {
		data: {
			title: 'Fix the board',
			description: 'Lorem ipsum dolor sit amet',
			status: 'backlog',
			assignee: {
				connect: {
					username: 'john.doe',
				},
			},
			tags: [
				{ connect: { slug: 'bug' } },
			],
		},
	}),

	queryBuilder.create('BoardTask', {
		data: {
			title: 'Is it broken?',
			description: 'Lorem ipsum dolor sit amet',
			status: 'todo',
			assignee: {
				connect: { username: 'jane.doe' },
			},
			tags: [
				{ connect: { slug: 'bug' } },
				{ connect: { slug: 'question' } },
			],
		},
	}),
	queryBuilder.create('BoardTask', {
		data: {
			title: 'Can you help me?',
			description: 'I need help with the board',
			status: 'backlog',
			tags: [
				{ connect: { slug: 'question' } },
			],
		},
	}),

])

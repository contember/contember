import { Icon } from '@contember/ui'
import moment from 'moment'
import { Component } from 'react'
import ReactTable, { Column } from 'react-table'
import 'react-table/react-table.css'

export default class List extends Component {
	render() {
		const columns: Column[] = [
			{ Header: 'Title', accessor: 'title' },
			{
				Header: 'Date',
				accessor: 'date',
				Cell: props => (
					<div className="text-center">
						<i>{moment(props.value).fromNow()}</i>
					</div>
				),
			},
			{
				Header: 'Published',
				accessor: 'published',
				Cell: props => (
					<div className="text-center">
						<Icon blueprintIcon={props.value ? 'tick' : 'cross'} />
					</div>
				),
			},
			{ Header: 'Author', accessor: 'author' },
		]

		// Random data for now
		const data: any[] = [
			{
				title: 'program Handmade Frozen Pizza Concrete',
				date: '2018-08-15T04:24:27.691Z',
				published: true,
				author: 'Anibal Gusikowski',
			},
			{ title: 'Identity', date: '2018-08-14T09:24:22.868Z', published: true, author: 'Jane Torp' },
			{ title: 'Handmade', date: '2018-08-15T07:10:41.334Z', published: true, author: 'Heloise Leffler' },
			{ title: 'Liberian Dollar', date: '2018-08-15T00:29:06.588Z', published: true, author: 'Nova Ullrich' },
			{
				title: 'Money Market Account SMTP',
				date: '2018-08-14T21:40:41.671Z',
				published: false,
				author: "Henry O'Conner",
			},
			{ title: 'Keyboard bypassing Games', date: '2018-08-14T11:15:38.355Z', published: true, author: 'George Rohan' },
			{
				title: 'New Mexico Buckinghamshire Avon',
				date: '2018-08-15T05:25:23.588Z',
				published: false,
				author: 'Anabel Kutch',
			},
			{
				title: 'Awesome Frozen Computer',
				date: '2018-08-14T23:05:08.515Z',
				published: true,
				author: 'Christina Stamm',
			},
			{
				title: 'Saint Pierre and Miquelon Fantastic',
				date: '2018-08-15T08:44:24.078Z',
				published: false,
				author: 'Maddison Fay',
			},
			{ title: 'Berkshire', date: '2018-08-15T01:05:17.608Z', published: false, author: "Marianne O'Keefe" },
			{ title: 'front-end Idaho', date: '2018-08-14T16:18:38.090Z', published: false, author: 'Orrin Paucek' },
			{ title: 'Generic', date: '2018-08-14T09:02:42.659Z', published: true, author: 'Aleen Keeling' },
			{
				title: 'salmon Credit Card Account framework',
				date: '2018-08-14T13:57:50.385Z',
				published: true,
				author: 'Deven Bayer',
			},
			{ title: 'West Virginia', date: '2018-08-15T00:18:26.745Z', published: true, author: 'Greta Dach' },
			{ title: 'Implementation Berkshire', date: '2018-08-14T15:08:32.756Z', published: false, author: 'Stan Lesch' },
			{ title: 'Ecuador mint green', date: '2018-08-14T15:49:48.360Z', published: true, author: 'Retta Vandervort' },
			{ title: 'Japan', date: '2018-08-14T23:46:39.360Z', published: false, author: 'Domenico Schumm' },
			{ title: 'optimizing SAS Corporate', date: '2018-08-15T07:23:00.501Z', published: true, author: 'Audie Ebert' },
			{
				title: 'Connecticut Supervisor New York',
				date: '2018-08-15T04:59:53.865Z',
				published: false,
				author: 'Alycia Boyer',
			},
			{ title: 'withdrawal', date: '2018-08-14T14:39:59.884Z', published: true, author: 'Maye Schamberger' },
			{
				title: 'Sleek Uganda Shilling New Leu',
				date: '2018-08-14T22:39:56.320Z',
				published: false,
				author: 'Adrienne Hudson',
			},
			{ title: 'Credit Card Account', date: '2018-08-14T12:08:49.374Z', published: false, author: 'Kali Weber' },
			{ title: 'pixel Officer', date: '2018-08-14T16:23:56.942Z', published: true, author: 'Geo Walter' },
			{ title: 'array', date: '2018-08-15T02:59:33.881Z', published: true, author: 'Valentina Ledner' },
			{ title: 'bus Gorgeous Avon', date: '2018-08-15T04:24:07.438Z', published: true, author: 'Sienna Bradtke' },
			{
				title: 'override middleware Upgradable',
				date: '2018-08-15T03:58:43.300Z',
				published: true,
				author: 'Lawson Lynch',
			},
			{ title: 'SMTP Ball Shoals', date: '2018-08-14T23:02:49.544Z', published: false, author: 'Jarrell Schneider' },
			{
				title: 'Grocery Minnesota Indiana',
				date: '2018-08-15T04:03:49.200Z',
				published: false,
				author: 'Regan Satterfield',
			},
			{
				title: 'Customer Credit Card Account strategize',
				date: '2018-08-14T14:00:09.462Z',
				published: true,
				author: 'Francis Konopelski',
			},
			{
				title: 'multi-byte bypass generating',
				date: '2018-08-15T05:05:23.617Z',
				published: true,
				author: 'Nathanael Cartwright',
			},
			{ title: 'Buckinghamshire', date: '2018-08-15T05:03:33.381Z', published: false, author: 'Brigitte Erdman' },
			{
				title: 'executive copying Cambridgeshire',
				date: '2018-08-14T13:00:25.202Z',
				published: false,
				author: 'Rita Ryan',
			},
			{
				title: 'panel Frozen New Mexico',
				date: '2018-08-14T21:59:59.844Z',
				published: false,
				author: 'Charley Dickens',
			},
			{ title: 'input ability Afghani', date: '2018-08-15T05:29:12.211Z', published: false, author: 'Jasen Veum' },
			{ title: 'connect', date: '2018-08-14T14:36:37.248Z', published: true, author: 'Alexzander Frami' },
			{ title: 'Iraqi Dinar Missouri', date: '2018-08-14T17:05:11.083Z', published: true, author: 'Rosina Olson' },
			{
				title: 'Self-enabling niches Personal Loan Account',
				date: '2018-08-15T01:47:34.120Z',
				published: true,
				author: 'Emelia Hammes',
			},
			{
				title: 'Branding Austria Grocery',
				date: '2018-08-14T13:43:03.929Z',
				published: true,
				author: 'Christiana Bogan',
			},
			{ title: 'Berkshire Hat bypass', date: '2018-08-14T23:51:18.085Z', published: false, author: 'Keshawn Stamm' },
			{ title: 'Borders Avon', date: '2018-08-14T21:06:59.482Z', published: true, author: 'Reymundo Herman' },
			{ title: 'turn-key', date: '2018-08-14T09:43:17.217Z', published: true, author: 'Judd Thompson' },
			{
				title: 'Fantastic Plastic Hat generate',
				date: '2018-08-15T02:26:46.611Z',
				published: false,
				author: 'Ulices Okuneva',
			},
			{ title: 'Illinois EXE Expressway', date: '2018-08-15T06:04:17.329Z', published: false, author: 'Jeanne Beier' },
			{ title: 'Granite', date: '2018-08-14T19:21:28.242Z', published: false, author: 'Camilla Mills' },
			{ title: 'protocol Handmade', date: '2018-08-14T15:06:36.936Z', published: true, author: 'Jordon McClure' },
			{ title: 'Technician', date: '2018-08-14T15:34:30.075Z', published: true, author: 'Casandra Ryan' },
			{ title: 'parsing grey frictionless', date: '2018-08-14T12:17:51.676Z', published: false, author: 'Asia Weber' },
			{
				title: 'Unbranded Fresh Cheese teal e-markets',
				date: '2018-08-14T14:01:52.088Z',
				published: true,
				author: 'Liam Leffler',
			},
			{ title: 'frictionless', date: '2018-08-14T11:27:35.580Z', published: true, author: 'Jaiden Jacobs' },
			{ title: 'Object-based digital', date: '2018-08-14T17:54:28.204Z', published: true, author: 'Yazmin McKenzie' },
		]

		return (
			<>
				<ReactTable data={data} columns={columns} />
			</>
		)
	}
}

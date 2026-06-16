import Layout from './Layout.mustache.js'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		We noticed a sign-in to your account ({{email}}) that looked unusual.
	</p>
	<ul>
		{{#geoCountry}}<li>Country: {{geoCountry}}</li>{{/geoCountry}}
		{{#ipAddress}}<li>IP address: {{ipAddress}}</li>{{/ipAddress}}
	</ul>
	<p>
		If this was you, you can safely ignore this message. If you do not
		recognize this activity, change your password as soon as possible and
		review your active sessions.
	</p>
`)

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AccountSchema = new mongoose.Schema({
	account_id: {
		type: Number
	},
	pw_email: {
		type: String
	},
	pw_token: {
		type: String
	},
	slack_token: {
		type: String
	},
	slack_url: {
		type: String
	},
	topics: [{
		type: Number
	}]
}, {timestamps: true});

var Account = mongoose.model('Account', AccountSchema);
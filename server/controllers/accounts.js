var mongoose = require('mongoose');
var Account = mongoose.model('Account');

function AccountsController(){
	this.index = function(req, res){
		Account.find({}, function(err, accounts){
			if(err){
				res.json({error: true, errors: err})
			}
			else {
				res.json(accounts);
			}
		});
	};

	this.show = function(req, res) {
		Account.findOne({account_id: req.params.id}, function(err, account) {
			if(err){
				res.json({error: true, errors: err});
			}
			else {
				res.json(account);
			}
		});
	};

	this.create = function(req, res){
		Account.findOne({account_id: req.body.account_id}, function(err, acc) {
			if(acc) {
				res.json({error: true, data: acc});
			}
			else {
				Account.create(req.body, function(err, account){
					if(err){
						res.json({error: true, errors: err});
					}
					else {
						res.json(account);
					}
				})
			}
		});
	};

	// this.update = function(req, res) {
	// 	Friend.update({_id: req.params.id}, req.body, function(err) {
	// 		if(err) {
	// 			console.log("Error Updating");
	// 		}
	// 		else {
	// 			Friend.find({}, function(err, data) {
	// 				res.json(data);
	// 			});
	// 		}
	// 	});
	// };

	this.delete = function(req, res){
		Account.remove({_id: req.params.id}, function(err){
			if(err) {
				console.log("Error Deleting");
			}
			else {
				res.json({_id: req.params.id});
			}
		});
	};

	this.get_account = function(id, callback) {
		Account.findOne({account_id: id}, function(err, account) {
			if(err){
				callback({error: true, errors: err});
			}
			else {
				callback(account);
			}
		});
	};
	
}

module.exports = new AccountsController();
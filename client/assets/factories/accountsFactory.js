app.factory('accountsFactory', ['$http', function($http) {
	var message = '';

	function AccountConstructor() {
		this.getMessage = function() {
			return message;
		}

		this.setMessage = function(new_message) {
			message = new_message;
		}

		this.index = function(callback) {
			$http.get('/api/accounts').then(function(returned_data){
				if (typeof(callback) == 'function'){
					callback(returned_data.data);
				}
			});
		};

		this.show = function(id, callback) {
			$http.get('/api/accounts/'+id).then(function(returned_data){
				if (typeof(callback) == 'function'){
					callback(returned_data.data);
				}
			});
		}

		this.create = function(newAccount, callback) {
			$http.post('/api/accounts', newAccount).then(function(returned_data){
				if (typeof(callback) == 'function'){
					callback(returned_data.data);
				}
			});
		};

		// this.update = function(id, updateFriend, callback) {
		// 	$http.put('/friends/'+id, updateFriend).then(function(returned_data){
		// 		if (typeof(callback) == 'function'){
		// 			callback(returned_data);
		// 		}
		// 	});
		// }

		this.delete = function(id, callback) {
			$http.delete('/api/accounts/'+id).then(function(returned_data){
				if (typeof(callback) == 'function'){
					callback(returned_data.data);
				}
			});
		};

		this.getAppInfo = function(callback) {
			$http.get('/api/app_info').then(function(returned_data){
				if (typeof(callback) == 'function'){
					callback(returned_data.data);
				}
			});
		};

		this.checkPassword =function(password, callback) {
			$http.post('/api/password', password).then(function(returned_data){
				if (typeof(callback) == 'function'){
					callback(returned_data.data);
				}
			});
		}

		this.exchangeToken = function(auth_code, callback) {
			$http.get('https://slack.com/api/oauth.access', {params: auth_code}).then(function(returned_data){
				if (typeof(callback) == 'function'){
					callback(returned_data.data);
				}
			});
		};

		this.getAccountId = function(pw_key, callback) {
			$http.post('/account_query', pw_key).then(function(returned_data){
				if (typeof(callback) == 'function'){
					callback(returned_data.data);
				}
			});
		};

		this.subscribeTopics = function(key_id_topics, callback) {
			$http.post('/subscribe_topics', key_id_topics).then(function(returned_data){
				if (typeof(callback) == 'function'){
					callback(returned_data.data);
				}
			});
		};

		this.unsubscribeTopics = function(key_topics, callback) {
			$http.post('/unsubscribe_topics', key_topics).then(function(returned_data){
				if (typeof(callback) == 'function'){
					callback(returned_data.data);
				}
			});
		};

	}

	return (new AccountConstructor());
}]);
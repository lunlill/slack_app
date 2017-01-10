app.controller('indexController', ['$scope', 'accountsFactory', '$location', function($scope, accountsFactory, $location) {
	$scope.auth = false;
	$scope.password = {};
	$scope.search = {};

	$scope.getAccounts = function() {
		accountsFactory.index(function(returnedData) {
			$scope.accounts = returnedData;
		});
	}

	$scope.getAccounts();

	$scope.deleteAccount = function(account) {
		var pw_key = {
			'Content-Type': 'application/json',
			'X-PW-Application': 'developer_api',
		};
		pw_key['X-PW-UserEmail'] = account.pw_email;
		pw_key['X-PW-AccessToken'] = account.pw_token;

		accountsFactory.unsubscribeTopics({'pw_key': pw_key, 'topics': account.topics}, function(unsubscribeStatus) {
			unsubscribeStatus = JSON.parse(unsubscribeStatus);
			if(unsubscribeStatus.id == undefined) {
				console.log('Error occurs unsubscribing', unsubscribeStatus);
			}
			else {
				accountsFactory.delete(account._id, function(data) {
					if(data.errors) {
						console.log(data.errors);
					}
					else {
						$scope.getAccounts();
					}
				});
			}
		});
	};

	$scope.authorize = function() {
		accountsFactory.checkPassword($scope.password, function(authStatus) {
			if(!authStatus.res) {
				$scope.errors = 'Invalid password';
			}
			else {
				$scope.auth = true;
			}
		});
	}

	$scope.propertyName = "account_id";
	$scope.reverse = false;

	$scope.sortBy = function(propertyName) {
		$scope.reverse = (propertyName !== null && $scope.propertyName === propertyName) ? !$scope.reverse : false;
		$scope.propertyName = propertyName;
	};
}]);
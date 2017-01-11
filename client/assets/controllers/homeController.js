app.controller('homeController', ['$scope', 'accountsFactory', '$location', '$routeParams', function($scope, accountsFactory, $location, $routeParams) {
	$scope.account = {};
	$scope.errors = {};

	if ($routeParams.code) {
		accountsFactory.getAppInfo(function(app_info) {
			var auth_code = app_info;
			auth_code.code = $routeParams.code;
			accountsFactory.exchangeToken(auth_code, function(data) {
				if(!data.ok) {
					console.log('Error exchanging slack token', data);
				}
				else {
					$scope.account.slack_token = data.access_token;
					$scope.account.slack_url = data.incoming_webhook.url;
					$scope.account.slack_id = data.team_id;
				}
			});
		});
	}

	if ($routeParams.error) {
		$location.url('/');
	}

	$scope.addAccount = function() {
		if (JSON.stringify($scope.account) == '{}') {
			$location.url('/');
		}

		$scope.topics = [];
		if ($scope.lead) {
			$scope.topics.push('lead');
		}
		if ($scope.opportunity) {
			$scope.topics.push('opportunity');
		}
		if ($scope.task) {
			$scope.topics.push('task');
		}

		var pw_key = {
			'Content-Type': 'application/json',
			'X-PW-Application': 'developer_api',
		};
		pw_key['X-PW-UserEmail'] = $scope.account.pw_email;
		pw_key['X-PW-AccessToken'] = $scope.account.pw_token;

		if ($scope.topics.length == 0 || !$scope.account.pw_email || !$scope.account.pw_token) {
			$scope.errors = {};
			if ($scope.topics.length == 0) {
				$scope.errors.topics = "You must choose at least one subject.";
			}
			if (!$scope.account.pw_email) {
				$scope.errors.pw_email = "ProsperWorks Email is required.";
			}
			if (!$scope.account.pw_token) {
				$scope.errors.pw_token = "ProsperWorks Token is required.";
			}
		}
		else {
			accountsFactory.getAccountId(pw_key, function(account_info) {
				account_info = JSON.parse(account_info);
				if(!account_info.id) {
					$scope.errors = {};
					$scope.errors.pw_email = "Your ProsperWorks credentials are invalid."
				}
				else {
					let account_id = account_info.id;
					$scope.account.account_id = account_id;

					accountsFactory.show(account_id, function(db_feedback) {
						if (db_feedback) {
							accountsFactory.setMessage('Your team has already set up notification to slack.');
							$location.url('/complete');
						}
						else {
							accountsFactory.subscribeTopics({'pw_key': pw_key, 'account_id': account_id, 'topics': $scope.topics}, function(subscribed_ids) {
								$scope.account.topics = subscribed_ids;
								accountsFactory.create($scope.account, function(create_status) {
									accountsFactory.setMessage('You have successfully linked ProsperWorks notifications to slack.');
									$location.url('/complete');
								});
							});
						}
					});
				}
			});
		}	
	};
}]);
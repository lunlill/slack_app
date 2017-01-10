app.controller('completeController', ['$scope', 'accountsFactory', '$location', function($scope, accountsFactory, $location) {
	if (accountsFactory.getMessage() == '') {
		$location.url('/');
	}
	$scope.message = accountsFactory.getMessage();
}]);
var app = angular.module('app', ['ngRoute', 'ngMessages', 'ngMaterial', 'md.data.table']);

app.config(function($routeProvider, $locationProvider) {
	$routeProvider
	.when('/', {
		templateUrl: '/partials/home.html',
		controller: 'homeController'
	})
	.when('/oauth', {
		templateUrl: '/partials/registration.html',
		controller: 'homeController'
	})
	.when('/complete', {
		templateUrl: '/partials/complete.html',
		controller: 'completeController'
	})
	.when('/accounts', {
		templateUrl: '/partials/index.html',
		controller: 'indexController'
	})
	.otherwise({
		redirectTo: '/'
	});

	$locationProvider.html5Mode(true);
});

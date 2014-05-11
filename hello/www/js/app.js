'use strict';

function showAlert(message, title) {
  if (navigator.notification) {
    navigator.notification.alert(message, null, title, 'OK');
  } else {
    alert(title ? (title + ": " + message) : message);
  }
}

var PhoneGap = {
     initialize: function() {
         this.bind();
     },
     bind: function() {
         document.addEventListener('deviceready', this.deviceready, false);
     },
     deviceready: function() {
         // note that this is an event handler so the scope is that of the event
         // so we need to call app.report(), and not this.report()
        PhoneGap.report('deviceready');
     },
     report: function(id) {
         //console.log("PhoneGap Report:" + id);
         // hide the .pending <p> and show the .complete <p>
         // document.querySelector('#' + id + ' .pending').className += ' hide';
         // var completeElem = document.querySelector('#' + id + ' .complete');
         // completeElem.className = completeElem.className.split('hide').join('');
         //showAlert('PhoneGap Initialized', 'Message');
     }
 };

PhoneGap.initialize();

$(function() {
  FastClick.attach(document.body);
});



var groupNews = function (list, scope) {
    var news = [],
        monthes = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
        currentDay = null;
    if (!list.length) {
        return [];
    }

    var d = new Date(parseInt(list[0].created_at)),
        day = d.getDate(),
        month = d.getMonth(),
        year = d.getFullYear(),
        date = day + ' ' + monthes[month] + ' ' + year;
    news.push({
        'date': date,
        'type': 'day'
    });
    angular.forEach(list, function (item) {
        var d = new Date(parseInt(item.created_at)),
            day = d.getDate(),
            month = d.getMonth(),
            year = d.getFullYear(),
            date = day + ' ' + monthes[month] + ' ' + year;

        if (currentDay != null && currentDay != date) {
            news.push({
                'date': date,
                'type': 'day'
            });
        }
        currentDay = date;
        item.type = 'item';
        news.push(item);
    });
    return news;
}


var app = angular.module('app', ['ngRoute', 'models']);
app.directive('loadingContainer', function () {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element, attrs) {
            var loadingLayer = angular.element('<div class="loading"></div>');
            element.append(loadingLayer);
            element.addClass('loading-container');
            scope.$watch(attrs.loadingContainer, function(value) {
                loadingLayer.toggleClass('ng-hide', !value);
            });
        }
    };
});
app.config(function ($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/main.html',
      controller: function($scope, $rootScope, NewsItemModel) {
        $rootScope.showBack = false;
        $scope.loadNews($rootScope.region);
      }
    })
    .when('/post/:id', {
      templateUrl: 'partials/post.html',
      controller: function($scope, $rootScope, NewsItemModel, $routeParams) {
        $rootScope.showBack = true;

        $scope.item = NewsItemModel.$search({ 'id': $routeParams.id }).$get();

      }
    })
    .otherwise({
      redirectTo: '/'
    });
});

app.run(function($rootScope, NewsItemModel) {
    $rootScope.$on('$routeChangeStart', function() {
        $rootScope.loading = true;
    })
    $rootScope.$on('$routeChangeSuccess', function() {
        $rootScope.loading = false;
    })
    $rootScope.$on('$routeChangeError', function() {
        $rootScope.loading = false;
    })

    $rootScope.region = 3;
    $rootScope.loadNews = function(regionId) {
        $rootScope.loading = true;
        $rootScope.region = regionId;
        NewsItemModel.$search({ region_id: regionId })
            .$execute({
                page: 1,
                count: 20,
                sorting: { 'created_at': 'desc' },
                fields: ['title', 'created_at', 'mainimage', 'is_top', 'id']
            }).$promise.then(function (res) {
                $rootScope.news = groupNews(res);
                $rootScope.loading = false;

            });
    }
})
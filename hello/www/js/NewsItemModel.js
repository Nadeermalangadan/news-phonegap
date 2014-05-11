var module = angular.module('models', ['bzModel']);


module.config(['bzModelProvider', function (bzModelProvider) {

    bzModelProvider.url('http://news.vn.ua')
        .index('news_vn_ua');
}]);
module.factory('NewsItemModel', ['bzModel', '$filter', '$rootScope', '$sce', function(bzModel, $filter, $rootScope, $sce) {
    var dateFilter = $filter('date'),
        monthes = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'],
        days = ['неділя','понеділок','вівторок','середа','четвер','п\'ятниця','субота'];

    var dates = {};
    return new bzModel({
        $name: 'com_pages_pages',
        $defaults: {
            id: 1,
            title: 'Untitled',
            estimate: ''
        },
        _body: function() {
            var body = this.body;
            body = body.replace(/\[gallery(.*)\]/, '');
            return body;
        },
        $initialize: function() {
            for (var i = 0; i < this.videos; i++) {
                this.videos[i].url = $sce.trustAsResourceUrl(this.videos[i].url);
            }
        },
        getId: function() {
            return this.id;
        },
        getBody: function() {
            return $sce.trustAsHtml(this._body());
        },
        getTizer: function(count) {
            return truncate(this._body(), count || 100) + '...';
        },
        getSeoDescription: function() {
            return truncate(this._body(), 250);
        },
        getSeoTitle: function() {
            return truncate(this.title, 200) + ' - ' + window.bazalt.siteTitle;
        },
        getMainImage: function(thumb) {
            if (angular.isDefined(this.mainimage) && this.mainimage != null) {
                return this.mainimage.thumbnails[thumb];
            }
            return '';
        },
        getImages: function(thumb) {
            this.$$images = this.$$images || this.images.slice(1);
            return this.$$images;
        },
        getUrl: function() {
            var category = {};// this.getCategory();
            if (this.category_id > 8 && this.category_id < 36) {
                return '/blogs/' + this.id;
            }
            var url = '/post/';
            return '' + url + this.id;
        },
        getCategory: function() {
            return $rootScope.categoriesById[parseInt(this.category_id)];
        },
        getTime: function() {
            return dateFilter(this.created_at, 'HH:mm');
        },
        getDay: function() {
            var d = new Date(parseInt(this.created_at));
            return days[d.getDay()];
        },
        getDate: function() {
            if (angular.isDefined(dates[parseInt(this.created_at)])) {
                return dates[parseInt(this.created_at)];
            }
            var d = new Date(parseInt(this.created_at)),
                day = d.getDate(),
                month = d.getMonth(),
                year = d.getFullYear();
            dates[parseInt(this.created_at)] = day + ' ' + monthes[month] + ' ' + year;
            return day + ' ' + monthes[month] + ' ' + year;
        },
        createdAt: function(format) {
            this.$$createdAt = this.$$createdAt || dateFilter(this.created_at, format || 'medium');
            return this.$$createdAt;
        }
    });
}]);
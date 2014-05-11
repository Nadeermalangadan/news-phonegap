(function(angular, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['angular'], function(angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(angular || null, function(angular) {
var app = angular.module('bzModel', ['elasticjs.service']);
app.provider('bzModel', [function() {
    var self = this;

    this.$url = 'http://localhost:9200';
    this.$index = 'default';

    this.url = function (url) {
        this.$url = url;
        return this;
    };
    this.index = function (index) {
        this.$index = index;
        return this;
    };

    this.$get = ['$q', '$log', 'ejsResource', function ($q, $log, ejsResource) {
        var ejs = ejsResource(self.$url);

        return function(args) {

            var obj = function(fields) {
                angular.extend(this, args || {});
                angular.extend(this, args.$defaults || {});
                angular.extend(this, fields || {});
                this.$initialize();
            };

            obj.prototype.$initialize = args.$initialize || obj.prototype.$initialize || angular.noop;

            obj.$client = function() {
                return ejs;
            };
            
            var objToFilter = function(obj) {
                var localFilters = [];
                angular.forEach(obj, function(value, field) {
                    if (angular.isUndefined(value) || value == '' || field[0] == '$') {
                        return;
                    }
                    var filter = angular.isArray(value) ? ejs.TermsFilter : ejs.TermFilter;
                    localFilters.push(
                        filter(field, value)
                    );
                });
                if (!localFilters.length) {
                    return null;
                }
                if (angular.isObject(obj.$exclude)) {
                    localFilters.push(ejs.NotFilter(objToFilter(obj.$exclude)));
                }
                return localFilters.length == 1 ? localFilters[0] : ejs.AndFilter(localFilters);
            };
            
            obj.$request = function() {
                return ejs.Request().indices(self.$index).types(args.$name || 'default');
            };
            obj.$execute = function(query, params) {
                params = params || {};

                var defer = $q.defer(),
                    result = (params.count == 1) ? {} : [];

                result.$resolved = false;
                result.$meta = {};
                result.$promise = defer.promise;

                query.doSearch().then(function(res) {
                    var data = [];

                    if (res.error) {
                        defer.reject(res);
                        return;
                    }
                    result.$total = res.hits.total;
                    result.$max_score = res.hits.max_score;
                    result.$resolved = true;
                    result.$facets = res.facets || {};

                    if (angular.isDefined(params.count) && params.count == 1) {
                        if (result.$total > 0) {
                            var item = new obj(res.hits.hits[0]._source || res.hits.hits[0].fields);
                            angular.copy(item, result);
                        }
                        defer.resolve(result);
                        return;
                    }
                    for (var i = 0, len = res.hits.hits.length; i < len; i++) {
                        var item = new obj(res.hits.hits[i]._source || res.hits.hits[i].fields);

                        data.push(item);
                    }
                    angular.copy(data, result);
                    defer.resolve(result);
                });
                return result;
            };

            obj.$search = function() {
                var request = this.$request(),
                    query = ejs.MatchAllQuery(),
                    filters = [];

                    angular.forEach(arguments, function(argument) {
                        if (angular.isUndefined(argument)) {
                            return;
                        }
                        var filter = objToFilter(argument);

                        if (filter) {
                            filters.push(filter);
                        }
                    });
                    if (filters.length == 1) {
                        query = ejs.FilteredQuery(query, filters[0]);
                    } else if (filters.length > 1) {
                        query = ejs.FilteredQuery(query, ejs.OrFilter(filters));
                    }
                    
                    /*var tags = ejs.TermsFilter('tags.title', ['дтп']);
                    request//.filter(ejs.AndFilter([tags]))
                        .facet(
                        ejs.TermsFacet('tagsFacet')
                            .field('tags.title')
                            .allTerms(false)
                            .facetFilter(ejs.AndFilter([tags]))
                    )*/

                request.$execute = function(params) {
                    return this.$fetch(query, params);
                };
                request.$get = function(params) {
                    params = params || {};
                    params.page = 1;
                    params.count = 1;
                    return this.$fetch(query, params);
                };
                request.$fetch = function(query, params) {
                    params = params || {};
                    params.page = params.page || 1;
                    params.count = params.count || 10;

                    this.from((params.page - 1) * params.count);
                    this.size(params.count);
                    params.fields && this.fields(params.fields);

                    if (params.between) {
                        angular.forEach(params.between, function(value, key) {
                            query = ejs.FilteredQuery(query,
                                ejs.RangeFilter(key)
                                    .from(moment(value[0]).format('YYYY-MM-DD HH:mm:ss'))
                                    .to(moment(value[1]).format('YYYY-MM-DD HH:mm:ss'))
                            );
                        });
                    }
                    if (params.sorting) {
                        var sorts = [];
                        angular.forEach(params.sorting, function(direction, key) {
                            var sort = ejs.Sort(key).asc();
                            direction == 'desc' && sort.desc();
                            sorts.push(sort);
                        });
                        this.sort(sorts);
                    }

                    return obj.$execute(this.query(query || ejs.MatchAllQuery()), params);
                };
                return request;
            };

            return obj;
        }
    }];
}]);

    return app;
}));
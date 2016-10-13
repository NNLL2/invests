
"use strict";
function updateDays(invest) {
    var start_day = moment(invest.start_day);
    var end_day = moment(invest.end_day);
    invest.days = end_day.diff(start_day, "days");
};

function updateEndDate(invest) {
    var start_day = moment(invest.start_day);
    invest.end_day = new Date(start_day.add(invest.days, "days"));
};

function prepare_invest(invest, ownerService, for_show) {
  var c0_init = {
      yearly_rate: 5.00,
      year_days: 365,  
  };

  if (!invest) { // for new, this is only for edit
    invest = {
      start_day: new Date(), 
      owner_id: 1,
      initial_value: 50000,
      category: 0,
      closed: 0,
      actual_gain: 0,
    };
    //invest.current_value = invest.initial_value;
    angular.extend(invest, c0_init);
    invest.days = 180;
    updateEndDate(invest);
    
  } else { // for existing      
    invest.is_new = moment().diff(moment(invest.create_day, "YYYY-MM-DD HH:mm:ss"), "days") < 1;
    //invest.start_day = new Date(invest.start_day);
    invest.initial_value /= 100;
    invest.owner = ownerService.ownerIdToName(invest.owner_id);
    
    if (invest.category == 0) { //existing fixed
      invest.end_day = new Date(invest.end_day);
      updateDays(invest);
      invest.yearly_rate /= 100;
      var to_todays = moment().diff(moment(invest.start_day, "YYYY-MM-DD"), "days");
      invest.current_value = Math.max(0, Math.min(invest.days, to_todays))
          * invest.initial_value 
          * (invest.yearly_rate/100) 
          / invest.year_days 
          + invest.initial_value;
      invest.current_value = Math.round(invest.current_value * 100)/100;
          
      invest.expected_gain = invest.initial_value * (invest.yearly_rate / 100) 
                             * invest.days / invest.year_days;
      
      invest.remain_days = moment(invest.end_day).diff(new Date(), "days");
      invest.over_due =  (invest.closed == 0) && (invest.remain_days < 0);
      if (invest.over_due) {
        invest.over_days = -invest.remain_days;
      }
      
    } else { //existing variable
      invest.current_value /= 100;
      angular.extend(invest, c0_init);
      if (invest.closed == 0) {
        invest.days = 180;
        updateEndDate(invest);
        
        // Compute current gain rate
        var days = moment(invest.update_day, "YYYY-MM-DD").diff(moment(invest.start_day, "YYYY-MM-DD"), "days"); 
        if (days > 0) {
          invest.current_gain_rate = 
              (invest.current_value - invest.initial_value) / invest.initial_value * 365/days * 100;
        } else {
          invest.current_gain_rate = 0;
        }
        
      } else {
        invest.end_day = new Date(invest.end_day);
        updateDays(invest);
      }
    }
    
    invest.start_day = new Date(invest.start_day);
    
    if (invest.closed == 1) {
      invest.actual_gain /= 100;
      invest.actual_gain_rate = invest.actual_gain / invest.initial_value 
                                * invest.year_days/invest.days * 100;       
    } else {
      invest.actual_gain = invest.current_value - invest.initial_value;
      invest.actual_gain = Math.round(invest.actual_gain * 100)/100;
    }
  }
  return invest;
}

function setup_invest($scope, invest, ownerService, for_show) {
  $scope.invest = prepare_invest(invest, ownerService, for_show);
  $scope.updateDays = updateDays;
  $scope.updateEndDate = updateEndDate;
};

function clean_invest(invest) {
  var inv = {}
  inv.name = invest.name;
  inv.owner_id = invest.owner_id;
  inv.initial_value = invest.initial_value * 100;
  inv.actual_gain = invest.actual_gain * 100;
  inv.category = parseInt(invest.category);
  inv.closed = parseInt(invest.closed);
  inv.start_day = moment(invest.start_day).format("YYYY-MM-DD");
  if ((invest.category == 0) || (invest.closed == 1)) {
    inv.end_day = moment(invest.end_day).format("YYYY-MM-DD");    
  }
  if (invest.category == 0) {
    inv.yearly_rate = invest.yearly_rate * 100;
    inv.year_days = invest.year_days;
  } else {
    if (!invest.current_value) {
      inv.current_value = invest.initial_value * 100;
    } else {
      inv.current_value = invest.current_value * 100;
    }
  }

  return inv;
};

function total_value($scope, invests) {
    var sum_init = function(partSum, b) {
      return partSum + b.initial_value;
    }
    var ongoing = invests.filter(function(inv) { return inv.closed == 0;});
    var ongoing_jin = 
      invests.filter(function(inv) { return inv.closed == 0 && inv.owner == 'JIN';});
    var ongoing_wang = 
      invests.filter(function(inv) { return inv.closed == 0 && inv.owner == 'WANG';});
    var closed_invest = 
      invests.filter(function(inv) { return inv.closed == 1;});
      
    $scope.total_invest = ongoing.reduce(sum_init, 0)/100;
    $scope.total_invest_count = ongoing.length;
    $scope.total_invest_jin = ongoing_jin.reduce(sum_init, 0)/100;
    $scope.total_invest_jin_count = ongoing_jin.length;
    $scope.total_invest_wang = ongoing_wang.reduce(sum_init, 0)/100;
    $scope.total_invest_wang_count = ongoing_wang.length;
    var closed_this_year = 
      closed_invest.filter(function(inv) { return inv.end_day.startsWith("2016"); } );
    $scope.total_gain = 
      (closed_this_year.reduce(function(partSum, b) { return partSum + b.actual_gain}, 0))/100;
    $scope.total_current_value = 
      (ongoing.reduce(function(partSum, b) { return partSum + b.current_value}, 0))/100;
}

function prepare_valuelogs_for_chart(valuelogs) {
  /*
  valuelogs = [
    {date: "2016-04-03", value: 1},
    {date: "2016-01-19", value: 2},
    {date: "2016-02-19", value: 3},
    {date: "2016-02-29", value: 4},
    {date: "2017-02-01", value: 6},
   ]; */
   /*
   valuelogs = [{"date": "2015-11-17", "value": 277748900}, {"date": "2015-11-28", "value": 279331000},
  
   {"date": "2015-12-06", "value": 279478900}, {"date": "2015-12-15", "value": 213730000},
    
   {"date": "2015-12-22", "value": 217730000}, {"date": "2016-01-02", "value": 218228600},
 
   {"date": "2016-01-11", "value": 221946502}, {"date": "2016-01-21", "value": 211946502}, 
   {"date": "2016-01-24", "value": 218926502}, {"date": "2016-02-23", "value": 220906902},

   {"date": "2016-03-09", "value": 218911001}, {"date": "2016-04-05", "value": 217911001}];
       
   {"date": "2016-04-06", "value": 218420300}, {"date": "2016-04-08", "value": 223466800}, 
   {"date": "2016-06-07", "value": 247188000}, {"date": "2016-07-07", "value": 261630300}];
   

   {"date": "2016-07-14", "value": 271630300}, {"date": "2016-07-19", "value": 271482400}];
   {"date": "2016-07-28", "value": 272900083}, {"date": "2016-07-30", "value": 273900083}]; */

  valuelogs = valuelogs.sort(function(v1, v2) { 
    return moment(v1.date).isBefore(v2.date)? -1: (moment(v1.date).isAfter(v2.date)? 1: 0);
  });
  

  var lastMonth = "0000-00";
  var lastValue = 0;
  var result = [];
  valuelogs.forEach(function(vl) {
    var currentMonth = vl.date.substring(0, 7);
    if (currentMonth == lastMonth) {
      result.pop();
    } else {
      
      if (lastMonth != "0000-00") {
        var nextOfLastMonth = moment(lastMonth, "YYYY-MM").add(1, 'months').format("YYYY-MM");
        while (nextOfLastMonth != currentMonth) {
          result.push({month: nextOfLastMonth, value: lastValue});
          lastMonth = nextOfLastMonth;
          nextOfLastMonth = moment(lastMonth, "YYYY-MM").add(1, 'months').format("YYYY-MM");
        }
      }
      
    }
    result.push({month: currentMonth, value: vl.value});
    lastMonth = currentMonth;
    lastValue = vl.value;

  });

  return result;  
}

function submit_update($scope, $http, $routeParams, $location) {
  $http.put('/invests/' + $routeParams.invest_id, JSON.stringify(clean_invest($scope.invest)))
    .success(function() {
      $location.path("/invests");
    });
}

function delete_invest($http, $route, invest_id, invest_name) { 
  if (confirm("确定要删除" + invest_name + "?")) {
    $http.delete("/invests/" + invest_id)
        .success(function() {
      $route.reload();
    });
  }
}

function listCtrlFn($scope, $http, $route, $location, ownerService, closed) {
  $scope.isCollapsed = true;
  
  $scope.sortField2 = closed != 0?"-end_day":"end_day";
  
  $scope.sortField = 'end_day';
  $scope.sortReverse = closed != 0;
  $scope.sortField1 = $scope.sortReverse?("-"+$scope.sortField):$scope.sortField;
  
  $scope.setSort = function (field) {
      if ($scope.sortField == field) {
          $scope.sortReverse = !$scope.sortReverse;
      } else {
          $scope.sortField = field;
          $scope.sortReverse = false;
      }
      $scope.sortField1 = $scope.sortReverse?("-"+$scope.sortField):$scope.sortField
  };

  $scope.delete_invest = function(invest_id, invest_name) {
    delete_invest($http, $route, invest_id, invest_name);
  };
  $scope.closed_page = closed;
  $http.get("/invests")
    .success(function(response) {
      $scope.invests = response.invests.filter(function(inv) {
        return (inv.closed == closed);
      });

      total_value($scope, response.invests);
      
      angular.forEach($scope.invests, function(inv) {
        inv = prepare_invest(inv, ownerService, true); 
        if (inv.closed == 0 && inv.category != 0) {
          inv.end_day = new Date("2999-01-01");
        }
      });

    });
}

function draw_valuelogs(valuelogs, title) {
  var ctx = document.getElementById("myChart");
  var myChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: valuelogs.map(function(v){return v.month;}),
          datasets: [{
              label: title,
              data: valuelogs.map(function(v){return v.value/1000000;}),
              backgroundColor: "rgba(75,192,192,0.4)",
              borderColor: "rgba(75,192,192,1)",
              borderWidth: 1
          }]
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {

                  }
              }]
          }
      }
  });
}

/* Main Start */
var app = angular.module('myApp', ['ui.bootstrap', 'ngRoute']);

app.factory('ownerService',
  function($http) {
    var owners = null;
    return { 
      promise: $http.get("/owners").success(
        function(response) {
          owners = response.owners;
        }),
      getOwners: function() { return owners; },
      ownerIdToName: function(id) { 
        return owners.find(function(v) { return v.id == id; }).name;
      }
    };
  });

app.filter(
  'mydec', function() {
      return function(dec) {
        return dec?dec.toFixed(2):dec;
      }
  }
);

app.filter(
  'mydate', function() {
      return function(value) {
        return moment(value).format("YYYY-MM-DD");
      }
  }
);

app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

app.config(['$routeProvider',
  function($routeProvider) {
  
    var originalWhen = $routeProvider.when;
    $routeProvider.when = function(path, route) {
      route.resolve || (route.resolve = {});
      angular.extend(route.resolve, {
            'owners': function(ownerService) {            
              return ownerService.promise;
            }
          });
       return originalWhen.call($routeProvider, path, route);
    };   
      
    $routeProvider.
      when('/invests', {
        templateUrl: '/app/list.html',
        controller: 'listCtrl'
      }).
      when('/invests-closed', {
        templateUrl: '/app/list.html',
        controller: 'listClosedCtrl'
      }).
      when('/invests/create', {
        templateUrl: '/app/edit.html',
        controller: 'createCtrl'
      }).
      when('/invests/:invest_id/edit', {
        templateUrl: '/app/edit.html',
        controller: 'detailCtrl'
      }).
      when('/invests/:invest_id/close', {
        templateUrl: '/app/close.html',
        controller: 'closeCtrl'
      }).
      when('/invests/:invest_id/update', {
        templateUrl: '/app/update-value.html',
        controller: 'updateCtrl'
      }).
      when('/invests/:invest_id/show', {
        templateUrl: '/app/show.html',
        controller: 'showCtrl'
      }).
      when('/valuelogs/:invest_id', {
        templateUrl: '/app/valuelogs.html',
        controller: 'valuelogsCtrl'
      }).
      otherwise({
        redirectTo: '/invests'
      });
  }]
); 

app.controller("NavBarCtrl", 
  function ($scope, $location) {
    $scope.isCollapsed = true;
  });

app.controller('listCtrl', function($scope, $http, $route, $location, ownerService) {
    listCtrlFn($scope, $http, $route, $location, ownerService, 0);
  });


app.controller('listClosedCtrl', function($scope, $http, $route, $location, ownerService) {
    listCtrlFn($scope, $http, $route, $location, ownerService, 1);
  });

app.controller('createCtrl', 
  function($scope, $http,  $location, ownerService) {
    $scope.header = "新建项目";
    $scope.owners = ownerService.getOwners();
    $scope.submit = function() {
      $http.post('/invests', JSON.stringify(clean_invest($scope.invest)))
        .success(function() {
          $location.path("/invests");
        });
    };
    $scope.creating = true;
    setup_invest($scope, null, ownerService);
  });

app.controller('detailCtrl',  
  function($scope, $http, $routeParams, $location, ownerService) {
    $scope.header = "编辑项目"; 
    $scope.owners = ownerService.getOwners();
    $scope.submit = function() {
      submit_update($scope, $http, $routeParams, $location);
    };

    $http.get('/invests/' + $routeParams.invest_id)
      .success(function(response) {
        $scope.creating = false;
        setup_invest($scope, response.invest, ownerService);
      });
  
  });

app.controller('showCtrl',
  function($scope, $http, $routeParams, $location, ownerService) {
    $http.get('/invests/' + $routeParams.invest_id)
      .success(function(response) {
        setup_invest($scope, response.invest, ownerService, true);
      });
  
  });

app.controller('closeCtrl',
  function($scope, $http, $routeParams, $location, ownerService) {
    $scope.submit = function() {
      submit_update($scope, $http, $routeParams, $location);
    };
    
    $http.get('/invests/' + $routeParams.invest_id)
      .success(function(response) {
        setup_invest($scope, response.invest, ownerService);
        if ($scope.invest.category != 0) {
          $scope.invest.end_day = new Date();
        }
        $scope.invest.closed = 1;
      });
  
  });

app.controller('updateCtrl',
  function($scope, $http, $routeParams, $location, ownerService) {
    $scope.owners = ownerService.getOwners();
    $scope.submit = function() {
      submit_update($scope, $http, $routeParams, $location);
    };
    
    $http.get('/invests/' + $routeParams.invest_id)
      .success(function(response) {
        setup_invest($scope, response.invest, ownerService);
      });
  });

app.controller("valuelogsCtrl",
  function($scope, $http, $routeParams, $location) {
    $http.get('/valuelogs/' + $routeParams.invest_id)
      .success(function(response) {
        if ($routeParams.invest_id == 0) {
          draw_valuelogs(prepare_valuelogs_for_chart(response.valuelogs),"Total value");
        } else {
          $http.get('/invests/' + $routeParams.invest_id)
            .success(function(response_inv) {      
              draw_valuelogs(prepare_valuelogs_for_chart(response.valuelogs), response_inv.invest.name);
            });
        }
      })        
  });
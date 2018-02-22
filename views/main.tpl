<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>投资记录</title>

    <!-- Bootstrap core CSS -->
    <link href="/static/bootstrap.min.css" rel="stylesheet">
    
    <script src="/static/angular.js"></script>
    <script src="/static/angular-route.js"></script>
    
    <script src="/static/ui-bootstrap-tpls-0.14.3.min.js"></script>
    
    <script src="/static/moment.js"></script>
    
    <script src="/static/Chart.js"></script>
    
    <script src="/app/app.js"></script>

    <!-- Custom styles for this template -->
    <link href="/static/dashboard.css" rel="stylesheet">
    
    <style>
      .nav, .pagination, .carousel, .panel-title a { cursor: pointer; }
    </style>

    <!-- IE10 viewport hack for Surface/desktop Windows 8 bug -->
    <script src="/static/ie10-viewport-bug-workaround.js"></script>
    
    <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
    <style>
    * {
      font-family:"Microsoft YaHei","黑体",sans-serif;
    }
    .my-v1 {
      font-size: 30px;
      padding: 20px;
    }
    .my-v2 {
      font-size: 20px;
      padding: 10px;
    }
    .my-v3 {
      font-size: 15px;
      padding: 5px;
    }
    li.right { float:right; padding: 0 10pt 0 0; }
    
    canvas {
      width: 100%;
      height: auto;
    }
    
    .filterButton {
      padding: 1px;
      margin: 1px;
      font-size: 15px;
    }
      
    /*
    #statPane {
      background-color: #f2f2f2;
    }*/
    
/*
    thead tr th {
      text-align: center;
      background-color: #f2f2f2;
      border-style: solid;
      border-color: white;
      border-width: 0px 5px 0px 5px;

    } */

    img.inactive {
        opacity: 0.2;
    }
    


    </style>
    <script>

var myAppNav = angular.module('myAppNav', ['ui.bootstrap', 'ui.bootstrap']);
myAppNav.controller("NavBarCtrl", 
function ($scope, $location) {
$scope.isCollapsed = true;
});
    </script>
  </head>
  <body ng-app="myApp">
<nav ng-controller="NavBarCtrl" class="navbar navbar-inverse navbar-fixed-top" >

  <div class="container-fluid">
    <div class="navbar-header">
      <button class="navbar-toggle" type="button" ng-click="isCollapsed = !isCollapsed">
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
      </button>
      <a class="navbar-brand" href="#/invests">记录 ({{file_name}})</a>
    </div>
    <div uib-collapse="isCollapsed" class="navbar-collapse bs-js-navbar-collapse">
      <ul class="nav navbar-nav navbar-right">
      <li class="right">
        <a href="/logout">退出</a>
      </li>
      </ul>
    </div>
  </div>
</nav>

    <div class="container">
        <div ng-view></div>
    </div>
  </body>
</html>
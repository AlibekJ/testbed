"use strict";


var URLPrefix = "./templates/";

let socket = {};


TheM.newEvent("app started");

theApp = theApp || angular.module("theApp", ["ngRoute"])
  .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

    $routeProvider.when("/main", {
      templateUrl: URLPrefix + "main.html"
    });


    $routeProvider.when("/:name*", {
      templateUrl: function (params) {
        let givenPath = params.name;
        if (theApp.alternativeRoutes && params.name) {

          try {
            if (theApp.alternativeRoutes[givenPath] && theApp.alternativeRoutes[givenPath].path) return URLPrefix + theApp.alternativeRoutes[givenPath].path;
            if (theApp.alternativeRoutes[givenPath]) return URLPrefix + theApp.alternativeRoutes[givenPath];
          } catch (err) {
            console.error(err);
          }

          let parseGiven = function (givenStr) {
            if (typeof givenStr !== "string") return false;
            let parsed = givenStr.split("/");
            for (let i = parsed.length - 1; i >= 0; i--)
              if (parsed[i] === "") parsed.splice(i, 1);
            return parsed;
          }

          let parsed = parseGiven(givenPath);
          let t = theApp.alternativeRoutes;
          for (let a of parsed) {
            let numberOfProps = 0;
            let lastProp;
            for (let prop in t) {
              numberOfProps++;
              lastProp = prop;
            }
            // if (numberOfProps === 1 && lastProp.startsWith(":")) {
            if (numberOfProps === 1 || lastProp.startsWith(":")) {
              params[lastProp.substring(1, (lastProp.length))] = a;
              t = t[lastProp];
            } else {
              t = t[a];
            }
          }
          if (t.path) return URLPrefix + t.path.toLocaleLowerCase();
        }
        console.error("Failed finding a path");
        console.error(params);
        return URLPrefix + "main.html";
      }
    });


    $routeProvider.otherwise({
      templateUrl: function (params) {
        return URLPrefix + "main.html"
      }
    });
  }]);

theApp.alternativeRoutes = theApp.alternativeRoutes || {};








theApp.controller("GeneralController", function ($window, $scope, $routeParams, $location, $rootScope) {

  $scope.$on('$viewContentLoaded', function () { });


  $scope.$on('$routeChangeSuccess', function ($event, next, current) { });

  $scope.echo = function (given) { //used for debug
    console.log(given);
  }

  let temp = {};

  $scope.TheM = TheM;
  $scope.moment = moment;
  $scope.temp = temp;
  $scope.routeParams = $routeParams;

  $scope.go = function (path, $event) {
    console.log("going to " + path);
    $rootScope.askedToGo = path;
    $location.path(decodeURI(path));
  };
 

  $scope.goBack = function () {
    window.history.back();
  };

  //re-render the data when TheM instructs to do so 
  document.addEventListener("some data refreshed", function (e) {
    if (!$scope.$$phase) {
      $scope.$apply()
    }
  }, false);



  $scope.$on('$locationChangeStart', function (event, next, current) { });

  //if url was like /test/123 
  //it gets matched with paths like /test/:param
  //and $scope.routeParams = {param:123}
  $scope.doParseRouteParams = function (givenStr) {
    let parseGiven = function (givenStr) {
      if (typeof givenStr !== "string") return false;
      let parsed = givenStr.split("/");
      for (let i = parsed.length - 1; i >= 0; i--)
        if (parsed[i] === "") parsed.splice(i, 1);
      return parsed;
    }
    let parsed = parseGiven($routeParams.name);
    let params = {};
    let t = theApp.alternativeRoutes;

    for (let a of parsed) {
      let numberOfProps = 0;
      let lastProp;
      for (let prop in t) {
        numberOfProps++;
        lastProp = prop;
      }
      if (numberOfProps === 1 && lastProp.startsWith(":")) {
        params[lastProp.substring(1)] = a;
        t = t[lastProp];
      } else {
        t = t[a];
      }
    }
    if (t.path) {
      $scope.routeParams = $scope.routeParams;
      for (let prop in params)
        $scope.routeParams[prop] = params[prop];
    }
  }



});

TheM.newEvent("app ready");


{
  //routes specific to this branding
  let parseGiven = function (givenStr) {
    if (typeof givenStr !== "string") return false;
    let parsed = givenStr.split("/");
    for (let i = parsed.length - 1; i >= 0; i--)
      if (parsed[i] === "") parsed.splice(i, 1);
    return parsed;
  };



  let addPath = function (givenStr, givenPath) {
    if (typeof givenStr !== "string") return false;
    let parsed = parseGiven(givenStr);

    let t = theApp.alternativeRoutes;
    for (let a of parsed) {
      t[a] = t[a] || {};
      t = t[a];
    }
    t.path = givenPath;
  };


  addPath("/demodata/:id", "demodata.html");
}



theApp.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.debugInfoEnabled(false);
}]);
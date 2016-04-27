angular.module('starter.controllers', [])

  .controller('LoginCtrl', function($rootScope, $scope, $q, $state, $timeout, $ionicSlideBoxDelegate, $ionicLoading, $cordovaFacebook, $cordovaSplashscreen) {
    var fbLogged = $q.defer();
    $scope.show = {};

    if(window.cordova)
      $cordovaSplashscreen.hide();

    // Facebook connect login
    var fbLoginSuccess = function (response) {
      $scope.isLoging = true;
      console.log('login success', response);

      if (!response.authResponse) {
        fbLoginError("Cannot find the authResponse");
        return;
      }

      var expDate = new Date(
        new Date().getTime() + response.authResponse.expiresIn * 1000
      ).toISOString();

      var authData = {
        _id: String(response.authResponse.userID),
        access_token: response.authResponse.accessToken,
        expiration_date: expDate
      };
      window.localStorage['id'] = response.authResponse.userID;
      fbLogged.resolve(authData);

    };
    var fbLoginError = function (error) {
      //fbLogged.reject(error);
      console.log(error);
    };
    var getFacebookProfileInfo = function () {
      var info = $q.defer();
      facebookConnectPlugin.api('/me', '',
        function (response) {
          info.resolve(response);
        },
        function (response) {
          info.reject(response);
        }
      );
      return info.promise;
    };
    $scope.facebookAppRequest = function () {
      var options = {
        method: "apprequests",
        message: "Come on man, check out my application."
      };
      var info = $q.defer();
      $cordovaFacebook.showDialog(options)
        .then(function (success) {
          info.resolve(response);
        }, function (error) {
          info.reject(response);
        });
      return info.promise;
    };
    fbLogged.promise.then(function (authData) {

      $ionicLoading.hide();
      $state.go('tab.dash');

    });

    $scope.next = function () {
      $ionicSlideBoxDelegate.next();
    };
    $scope.previous = function () {
      $ionicSlideBoxDelegate.previous();
    };

    // Called each time the slide changes
    $scope.slideChanged = function (index) {
      $scope.slideIndex = index;
    };

    $scope.options = {
      FB: {
        login: function () {
        }

      },
      FBlogin: function () {
        console.log('login..');
        $ionicLoading.show({
          template: 'Logging in to Facebook...'
        });
        if (!window.cordova) {
          facebookConnectPlugin.browserInit('466269356751173');
        }
        facebookConnectPlugin.login(['email', 'user_birthday', 'user_friends'], fbLoginSuccess, fbLoginError);
      }
    }
  })

  .controller('DashCtrl', function($scope, $q, $http, $filter, facebookEvents, ImageUploadService, $ionicPopup, $ionicLoading) {

    //TODO: change development to production
    var baseUrl = "https://salty-peak-2515.herokuapp.com/";

    //var eventsCtrl = this;
    $scope.activities = undefined;

    $scope.getEventsByLocation = function(location) {
      $ionicLoading.show({
        template: 'Loading...'
      });
      $scope.activities = [];

      facebookEvents.getFacebookPlacesByLocation(location).then(function(placesIds){
        facebookEvents.mapPlacesToQueryList(placesIds).then(function(placesIdsList) {

            async.waterfall([
                function(callback){
                  var resActivities = [];
                  var iterator = function(query, callbackI){
                    console.log('Query', query);
                    facebookEvents.getFacebookEvents(query).then(function(events, err) {
                        if(err){ callback(err); }
                        else{
                          // Add to events list
                          angular.forEach(events, function(event) {
                            resActivities.push(event);
                          });
                          callbackI(null); }
                    });
                  };
                  async.eachSeries(placesIdsList, iterator, function(err){
                    if(err){  callback(err); }
                    else{ callback(null, resActivities); }
                  })
                }
              ],
              function(err, resActivities){
                if(err){
                  console.error(err);
                  console.log('Finished',{result: 'error', data: resActivities});
                }
                else{
                  //console.log('ALL ACTIVITIES DONE');
                  console.log('Finished',{result: 'success', data: resActivities, total: resActivities.length});
                  $ionicLoading.hide();
                  //var events = facebookEvents.filterEvents(resActivities);

                  var activities = facebookEvents.mapEventsToActivities(resActivities);
                  console.log('Activities list', activities.length, activities);



                  facebookEvents.postEvents(activities).then(function(){
                    $ionicLoading.hide();
                    //$scope.openPopup();
                  });
                }
              });


            // Fetch events by location

            //facebookEvents.getFacebookEvents(value).then(function(events){
            //
            //  events = facebookEvents.filterEvents(events,value);
            //
            //  $scope.activities = (facebookEvents.mapEventsToActivities(events));
            //
            //  console.log('$scope.activities1',$scope.activities.length);
            //  //console.log( $scope.activities);
            //  //$timeout(function(){
            //  //  facebookEvents.postEvents($scope.activities).then(function(){
            //  //    //$scope.openPopup();
            //  //  });
            //  //}, 1000);
            //
            //})
          });

          console.log('$scope.activities',$scope.activities.length);
        //});
      });
    };

    $scope.getEvents = function(query, placeId){

      $ionicLoading.show({
        template: '<ion-spinner icon="lines" class="spinner-positive"></ion-spinner>'
      });
      $scope.activities = [];

      facebookEvents.getFacebookEvents(query).then(function(events){
        console.log('Raw Events', events.length, events);

        // filter events

        //events = facebookEvents.filterEvents(events,query);
        console.log('Filtered Events', events.length, events);


        // map events to activities
        $scope.activities = facebookEvents.mapEventsToActivities(events);
        console.log('Activities2', $scope.activities.length, $scope.activities);


        //$scope.activities = [$scope.activities[1]];
        //console.log('Activities[0]', $scope.activities.length, $scope.activities)
        // post activity
        facebookEvents.postEvents($scope.activities).then(function(response){
          $ionicLoading.hide();
          console.log('response', response);
          $scope.openPopup(null, response.data.data);
        });


        // get event resized picture
        // TODO: not working properly
        //facebookEvents.resizeEventsImages(events).then(function(resizedEvents){
        //  events = resizedEvents;
        //
        //  // map events to activities
        //  $scope.activities = facebookEvents.mapEventsToActivities(events);
        //  console.log('Activities2', $scope.activities.length, $scope.activities);
        //
        //
        //  //$scope.activities = [$scope.activities[1]];
        //  //console.log('Activities[0]', $scope.activities.length, $scope.activities)
        //  // post activity
        //  facebookEvents.postEvents($scope.activities).then(function(){
        //      $scope.openPopup();
        //  });
        //});




        //$scope.image = facebookEvents.getDataUri('https://fbcdn-sphotos-e-a.akamaihd.net/hphotos-ak-xtp1/t31.0-8/s720x720/12184318_935652719804479_2910625109010592260_o.jpg', function(dataUri) {
        //  // Do whatever you'd like with the Data URI!
        //  console.log('done');
        //
        //  ImageUploadService.upload(dataUri,activityId).then(function(url){
        //    $scope.localFileImage='';
        //    var urlArray = url.split('/');
        //    createdActivity.imageUrl = 'https://s3.amazonaws.com/nosoloimages/' + urlArray[urlArray.length-1];
        //    MyActivitiesService.updateImage(createdActivity).then(function(){
        //      delete $localStorage.createdActivity;
        //    });
        //  });
        //
        //});

        // ready to post activities

      });

    };

    // An elaborate, custom popup
    $scope.openPopup = function(uploaded, created){
      var myPopup = $ionicPopup.show({
        template: $scope.activities.length + ' Activities successfully uploaded<br>' +created+' Activities successfully created',
        title: 'FB Content',
        subTitle: 'Post Activities',
        scope: $scope,
        buttons: [
          {
            text: '<b>OK</b>',
            type: 'button-positive'
          }
        ]
      });

      myPopup.then(function(res) {
        console.log('Tapped!', res);
      });
    }

  })

  .controller('ChatsCtrl', function($scope, Chats) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.chats = Chats.all();
    $scope.remove = function(chat) {
      Chats.remove(chat);
    };
  })

  .controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
  })

  .controller('AccountCtrl', function($scope) {
    $scope.settings = {
      enableFriends: true
    };
  });

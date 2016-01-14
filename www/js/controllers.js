angular.module('starter.controllers', [])

  .controller('DashCtrl', function($scope, $q, $http, $filter, facebookEvents, ImageUploadService) {

    //TODO: change development to production
    var baseUrl = "https://salty-peak-2515.herokuapp.com/";

    //var eventsCtrl = this;
    $scope.activities = undefined;

    $scope.getEvents = function(query, placeId){

      facebookEvents.getFacebookEvents(query).then(function(events){
        console.log('Raw Events', events.length, events);

        // filter events
        events = facebookEvents.filterEvents(events,query);
        console.log('Filtered Events', events.length, events);

        // get event resized picture
        // TODO: not working properly
        facebookEvents.resizeEventsImages(events).then(function(resizedEvents){
          events = resizedEvents;

          // map events to activities
          $scope.activities = facebookEvents.mapEventsToActivities(events);
          console.log('Activities2', $scope.activities.length, $scope.activities);


          //$scope.activities = [$scope.activities[1]];
          //console.log('Activities[0]', $scope.activities.length, $scope.activities)
          // post activity
          facebookEvents.postEvents($scope.activities);
        });




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

    $scope.getFacebookEvents = function(query){
      var fetchEvents = $q.defer();

      // Fetch events by query
      FB.api(
        "/search?q="+query+"&type=event&want_localized_name=true&limit=5000&fields=id,name,owner,description,location,venue,privacy,start_time,end_time,updated_time,is_date_only",
        function (response) {
          if (response && !response.error) {
            console.log('Events', response.data.length, response);
            fetchEvents.resolve(response.data);
            $scope.mapsEventsToActivities(response.data);
          }
          else {
            console.log('getEvents response - error', response);
          }
        }
      );

      return fetchEvents.promise;
    }

    $scope.filterEvents = function(events){

      var filteredEvents = [];

      filteredEvents = $filter('filter')(events, {privacy: 'OPEN'});

      return filteredEvents;
    };

    $scope.mapsEventsToActivities = function(events){

      var activities = [];
      var activity = null;

      angular.forEach(events, function(value, key){

        // Validation - location
        if(value.venue && value.venue.longitude) {

          activity = {};
          activity = {
            "title": value.name,
            "creator": {
              "_id": value.owner.id,
              "name": value.owner.name
            },
            "fbId": value.id,
            "date": {
              "timeFinish": value.end_time,
              "timeStart": value.start_time
            },
            "location": [
              value.venue.longitude,
              value.venue.latitude
            ],
            "imageUrl": "https://s3.amazonaws.com/nosoloimages/ttest.png",
            "description": value.description,

            "invitees": [],
            "isApprovalNeeded": false,
            "isPrivate": false,
            "maxMembers": 21,
            "tags": [],
            "timeFinish": value.end_time,
            "timeStart": value.start_time
          };
          activities.push(activity);

        }

      });

      return activities;
    };

    $scope.postEvent = function(activity){

      //$http.post(baseUrl+'create_activity', JSON.stringify(activity))
      //  .success(function(data, status, headers, config){
      //    if(data.result == "success"){
      //      console.log('ActivityService - post: SUCCESS', data);
      //    }
      //    else {
      //      console.log('ActivityService - post: ERROR', data);
      //    }
      //    return activity;
      //  })
      //  .error(function(data, status, headers, config) {
      //    console.log('ActivityService - post: ERROR', status);
      //  });

    }

    $scope.postEvents = function(activities){

      console.log("Activities List", activities.length, activities);


      //// TODO: get route from ignat
      //$http.post(baseUrl+'create_events', JSON.stringify(events))
      //  .success(function(data, status, headers, config){
      //    if(data.result == "success"){
      //      console.log('create_events - post: SUCCESS', data);
      //    }
      //    else {
      //      console.log('create_events - post: ERROR', data);
      //    }
      //    return activity;
      //  })
      //  .error(function(data, status, headers, config) {
      //    console.log('ActivityService - post: ERROR', status);
      //  });

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

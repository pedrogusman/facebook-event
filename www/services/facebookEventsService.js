angular.module('starter.services')

  .factory('facebookEvents', function($q, $http, $filter, $ionicPlatform, $cordovaFacebook) {

    //TODO: change development to production
    var baseUrl = "https://nosolo-web-admin.herokuapp.com/";

    // Some fake testing data
    var activities = undefined;
    var places = undefined;

    // Get Events from Facebook
    var getFacebookEvents = function (query) {
      var fetchEvents = $q.defer();

      if (window.cordova) {
        $cordovaFacebook.getLoginStatus()
          .then(function(success) {
              $cordovaFacebook.api(
                "/search?q=" + query + "&type=event&want_localized_name=true&limit=5000&fields=id,name,owner,description,location,venue,privacy,start_time,end_time,updated_time,is_date_only,cover")
                .then(function (response) {
                  if (response && !response.error) {
                    console.log('facebookEventsService - getFacebookEvents response - success', response.data);
                    fetchEvents.resolve(response.data);
                  }
                  else {
                    console.log('facebookEventsService - getFacebookEvents response - error', response);
                  }
                })
          }, function (error) {
            alert('failed')
          });
      }
      else {
        FB.api(
          "/search?q=" + query + "&type=event&want_localized_name=true&limit=5000&fields=id,name,owner,description,location,venue,privacy,start_time,end_time,updated_time,is_date_only,cover",
          function (response) {
            if (response && !response.error) {
              console.log('facebookEventsService - getFacebookEvents response - success', response.data);
              fetchEvents.resolve(response.data);
            }
            else {
              console.log('facebookEventsService - getFacebookEvents response - error', response);
            }
          }
        );
      }

      return fetchEvents.promise;
    };

    var getFacebookPlacesByLocation = function(location){
      var fetchEvents = $q.defer();

      // Fetch events by location
      FB.api(
        "/search?limit=5000&type=place&q=*&center=31.258889%2C34.799708&distance=300&fields=id,name",
        function (response) {
          if (response && !response.error) {
            console.log('getFacebookEventsByLocation - getFacebookEvents response - success', response.data);
            //mapPlacesToQueryList(response.data);
            fetchEvents.resolve(response.data);
          }
          else {
            console.log('getFacebookEventsByLocation - getFacebookEvents response - error', response);
          }
        }
      );

      return fetchEvents.promise;
    };

    var mapPlacesToQueryList = function(placesIds){
      var fetchEvents = $q.defer();
      var placesIdsList = [];

      // Map placesIds object-array to string-array
      angular.forEach(placesIds, function(value, key){
        placesIdsList.push(value.name);
      });

      fetchEvents.resolve(placesIdsList);



      return fetchEvents.promise;
    };

    // Filter Events by venue, date & cover image
    var filterEvents = function(events,city){

      var filteredEvents;

      //filteredEvents = $filter('filter')(events, {privacy: 'OPEN', venue: {city: 'Tel Aviv'} });

      filteredEvents = $filter('eventsFilter')(filteredEvents, {privacy: 'OPEN', venue: {city: 'Tel Aviv'} });

      return filteredEvents;
    };

    // Map Events to Activities
    var mapEventsToActivities = function(events){

      var activities = [];
      var activity = null;

      angular.forEach(events, function(value, key){

        // Validation - location
        if((value.venue && value.venue.longitude) && (value.cover && value.cover.source)) {

          activity = {};

          // Remove tokens
          var title = convertToPlain(value.name);
          var creatorName = convertToPlain(value.owner.name);
          console.log('creatorName',creatorName);
          var description = convertToPlain(value.description);

          value.description = typeof value.description === "object" ? "" : value.description;

          activity = {
            "title": title,
            "creator": {
              "_id": value.owner.id,
              "name": creatorName
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
            "imageUrl": value.cover.source,
            "description": description,

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

    // Convert rtf to plain text
    var convertToPlain = function(rtf) {

      if(!rtf || Object.keys(rtf).length == 0 )
        return;

      rtf = rtf.replace(/\\par[d]?/g, "");
      return rtf.replace(/\{'\*?\\\/[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, "").trim();
    };

    // Get event resized picture (300x400)
    var getEventPicture = function(eventId){

      var eventPicture = $q.defer();

      FB.api(
        eventId+"/picture?width=400&height=300",
        function (response) {
          if (response && !response.error) {
            eventPicture.resolve(response.data.url);
          }
          else {
            console.log('facebookEventsService - getFacebookEvents response - error', response);
          }
        }
      );

      return eventPicture.promise;
    };

    // Get events resized pictures (300x400)
    var resizeEventsImages = function(events){

      var defferred = $q.defer();

      var iterator = function(event, callback){
        getEventPicture(event.cover.id)
          .then(function(imageUrl){
            event.cover.source.url = imageUrl;
            callback(null);
          });
      };
      async.each(events, iterator, function(err, result){
        if(err){ console.error("Error2", err); }
        else{
          console.log('Resized events pictures', events);
          defferred.resolve(events);
        }
      });

      return defferred.promise
    };

    // Get image Data URI
    var getDataUri = function(url, callback) {
      var image = new Image();

      image.setAttribute('crossOrigin', 'anonymous');

      image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

        canvas.getContext('2d').drawImage(this, 0, 0);

        // Get raw image data
        callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

        // ... or get as Data URI
        callback(canvas.toDataURL('image/png'));
      };

      image.src = url;
    };

    // Post Activities
    var postEvents = function(activities){

      console.log("facebookEventsService - postEvents - Activities List", activities.length, activities);

      //// TODO: get route from ignat
      return $http.post(baseUrl+'create_fb_activities', JSON.stringify(activities))
        .success(function(data, status, headers, config){
          if(data.result == "success"){
            console.log('create_events - post: SUCCESS', status, data);
          }
          else {
            console.log('create_events - post: ERROR', status, data);
          }
        })
        .error(function(data, status, headers, config) {
          console.log('ActivityService - post: ERROR', status, data);
        });

    };

    return {
      getFacebookEvents: getFacebookEvents,
      getFacebookPlacesByLocation: getFacebookPlacesByLocation,
      mapPlacesToQueryList: mapPlacesToQueryList,
      filterEvents: filterEvents,
      mapEventsToActivities: mapEventsToActivities,
      resizeEventsImages: resizeEventsImages,
      postEvents: postEvents,
      getDataUri: getDataUri,

      all: function() {
        return activities;
      },
      remove: function(activity) {
        activities.splice(activities.indexOf(activity), 1);
      },
      get: function(activityId) {
        for (var i = 0; i < activities.length; i++) {
          if (activities[i]._id === parseInt(activityId)) {
            return activities[i];
          }
        }
        return null;
      }
    };
  });

angular.module('starter.filters')

  .filter('eventsFilter', function() {
    return function(input, params, place) {

      var out = [];
      var dateNow = new Date();
      var dateInput;

      angular.forEach(input, function(value, key) {

        dateInput = new Date(value.start_time);

        //(value.end_time && value.end_time > value.start_time)
        if( (value.cover && value.cover.source) && (value.start_time && dateInput > dateNow)) {
          out.push(value)
        }
        else {
          //console.log('failed', value.end_time, value.start_time);
        }

      });

      return out;
    };
  });

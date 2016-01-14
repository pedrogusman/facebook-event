angular.module('starter.services', [])

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'img/ben.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'img/max.png'
  }, {
    id: 2,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'img/adam.jpg'
  }, {
    id: 3,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'img/perry.png'
  }, {
    id: 4,
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'img/mike.png'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
})

  .factory('ImageUploadService', function($q, $http) {

    var upload = function(data,activityId){

      var url = $q.defer();
      var b64Image = data.split(',')[1];
      var binaryImg = b64toBlob(b64Image);
      uploadToTinyPng(binaryImg,b64Image,activityId).then(function(data){
        var tempUtl = data.data.output.url;
        uploadToS3(tempUtl,b64Image,activityId).then(function(){
          url.resolve(tempUtl);
        });
      });

      return url.promise;
    };

    function uploadToTinyPng(data,b64Image,activityId) {

      var req = {
        method: 'POST',
        url: 'https://api.tinify.com/shrink',
        headers: {
          'Authorization': 'Basic YXBpOlRnTWhTSTV3bWp6VU5UUXZxeG04aS0tN2w5RUV6M0tSOg==',
          'Content-Type': undefined
        },
        data: data
      };

      return $http(req).success(function(data, status, headers, config) {
        console.log('ImageUploadService - uploadToTinyPng: SUCCESS', data);
      }).error(function(data, status, headers, config) {
        backUpUpload(b64Image,activityId);
        console.log('ImageUploadService - uploadToTinyPng: ERROR', data);
      });
    }

    var backUpUpload = function(data,activityId){

      var req = {
        method: 'POST',
        url: 'https://nosolo-upoader.herokuapp.com/upoad',
        data: { base64: data, activityId: activityId }
      };

      $http(req).success(function(data, status, headers, config) {
        console.log('ImageUploadService - backUpUpload: SUCCESS', data);
      }).error(function(data, status, headers, config) {
        console.log('ImageUploadService - backUpUpload: ERROR', data);
      });
    };

    function uploadToS3(data,b64Image,activityId){

      var dataArray = data.split('/');
      var path = "nosoloimages/" + dataArray[dataArray.length-1];
      var req = {
        method: 'POST',
        url: data,
        headers: {
          'Authorization': 'Basic YXBpOlRnTWhTSTV3bWp6VU5UUXZxeG04aS0tN2w5RUV6M0tSOg==',
          'Content-Type': 'application/json'
        },
        data: {
          "store" : {
            "service": "s3",
            "aws_access_key_id": "AKIAJOI6JEK3WUOV6COQ",
            "aws_secret_access_key": "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",
            "path": path
          }
        }
      };

      return $http(req).success(function(data, status, headers, config) {
        console.log('ImageUploadService - uploadToS3: SUCCESS', data);
      }).error(function(data, status, headers, config) {
        backUpUpload(b64Image,activityId);
        console.log('ImageUploadService - uploadToS3: ERROR', data);
      });
    }

    function b64toBlob(b64Data, sliceSize) {
      sliceSize = sliceSize || 512;
      var byteCharacters = atob(b64Data);
      var byteArrays = [];
      for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);
        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      return new Blob(byteArrays, {type: 'image/jpeg'});
    }

    return{
      upload:upload
    }
  });

var socketIO = io();
var chatId = getParameterByName("chatId");
console.log("chat id is " + chatId);

var userName = window.prompt("Enter your name");
angular.module('ionicApp', ['ionic'])

// All this does is allow the message
// to be sent when you tap return
    .directive('input', function($timeout) {
        return {
            restrict: 'E',
            scope: {
                'returnClose': '=',
                'onReturn': '&',
                'onFocus': '&',
                'onBlur': '&'
            },
            link: function(scope, element, attr) {
                element.bind('focus', function(e) {
                    if (scope.onFocus) {
                        $timeout(function() {
                            scope.onFocus();
                        });
                    }
                });
                element.bind('blur', function(e) {
                    if (scope.onBlur) {
                        $timeout(function() {
                            scope.onBlur();
                        });
                    }
                });
                element.bind('keydown', function(e) {
                    if (e.which == 13) {
                        if (scope.returnClose) element[0].blur();
                        if (scope.onReturn) {
                            $timeout(function() {
                                scope.onReturn();
                            });
                        }
                    }
                });
            }
        }
    })


    .controller('Messages', function($scope, $timeout, $ionicScrollDelegate, $http) {

        $scope.hideTime = true;

        var alternate,
            isIOS = ionic.Platform.isWebView() && ionic.Platform.isIOS();
        $http.defaults.headers.post["Content-Type"] = "application/json";
        function pushMessage(msg) {
            console.log("message received" + JSON.stringify(msg));
            $scope.messages.push({
                userId: '12345',
                text: msg.name +" : " + msg.text
            });
        }
        $http.post("https://73017e53.ngrok.io/fetchMessages", {chatId: chatId}, {headers: {'Content-Type': 'application/json'} })
            .success(function(res) {
                console.log((res));
                $scope.messages.length = 0;
                for(r in res) {
                    pushMessage(res[r])
                }
            });
        socketIO.on(chatId, function (msg) {
            pushMessage(msg)
        });


        $scope.sendMessage = function() {
            alternate = !alternate;

            socketIO.emit("sendMessage", {
                chatId : chatId,
                message: $scope.data.message,
                name: userName
            });
            $scope.messages.push({
                userId: '54321',
                text: $scope.data.message,
            });
            delete $scope.data.message;
            $ionicScrollDelegate.scrollBottom(true);
        };


        $scope.inputUp = function() {
            if (isIOS) $scope.data.keyboardHeight = 216;
            $timeout(function() {
                $ionicScrollDelegate.scrollBottom(true);
            }, 300);

        };

        $scope.inputDown = function() {
            if (isIOS) $scope.data.keyboardHeight = 0;
            $ionicScrollDelegate.resize();
        };

        $scope.closeKeyboard = function() {
            // cordova.plugins.Keyboard.close();
        };


        $scope.data = {};
        $scope.myId = '12345';
        $scope.messages = [];

    });




var clientBaseUrl = "some.ngrok.io/";
var serverBaseUrl = "server.ngrok.io/";

var express = require('express');
var router = express.Router();

var flock = require('flockos');

flock.appId = '493ddb14-0344-4deb-8829-b6d5d231cf76';
flock.appSecret = '972a7c6f-76b3-432e-93ea-56692ebe308f';

var userIdToToken = {};
var chatIdDetails = {};
var chatIdToMessages = {};

flock.events.on('install', function (event, callback) {
    userIdToToken[event.userId] = event.token
});

flock.events.on('chat.pressButton', function (event, callback) {
    var chatDetails = chatIdDetails[event.chat];
    if (chatDetails != null) {
        chatIdDetails[event.chat] = event;
    }
    var webhookUrl = serverBaseUrl + "chat/";
    callback(null, {text: 'share this url:' + getClientUrl(event.chat) + ' webhookUrl: ' + webhookUrl})
});

function getClientUrl(chatId) {
    return clientBaseUrl + "?chatId=" + chatId;
}

var socket = null; // TODO update

router.post('/chat/', function (req, res, next) {
    var message = req.body;
    var chatId = message.to;
    chatIdToMessages[chatId] = chatIdToMessages[chatId] || [];
    chatIdToMessages[chatId].push(message);

    socket.emit(chatId, message)
});
router.post('/events', flock.events.listener);

socket.on('fetch', function (param) {

});
socket.on('sendMessage', function (param) {
    var chatId = param.chatId;
    var message = param.message;
    var chatDetails = chatIdDetails[chatId];
    if (chatDetails != null) {
        var token = userIdToToken[chatDetails.userId];
        flock.callMethod('chat.sendMessage', token, {
            to: chatId,
            text: message
        }, function (error, response) {
            if (!error) {
                console.log("unable to send message " + response);
            }
        });
    }
});

module.exports = router;

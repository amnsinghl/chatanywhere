var clientBaseUrl = "some.ngrok.io/";
var serverBaseUrl = "server.ngrok.io/";

var express = require('express');
var router = express.Router();
var server = require('http').Server(express);
var io = require('socket.io')(server);

var flock = require('flockos');

flock.appId = '493ddb14-0344-4deb-8829-b6d5d231cf76';
flock.appSecret = '972a7c6f-76b3-432e-93ea-56692ebe308f';

var userIdToToken = {};
var chatIdDetails = {};
var chatIdToMessages = {};

flock.events.on('app.install', function (event, callback) {
    console.log("app install received");
    userIdToToken[event.userId] = event.token;
    callback(null)
});

flock.events.on('client.pressButton', function (event, callback) {
    var chatDetails = chatIdDetails[event.chat];
    if (!chatDetails) {
        chatIdDetails[event.chat] = event;
        chatDetails = event;
    }
    var webhookUrl = serverBaseUrl + "chat";
    var message = 'share this url:' + getClientUrl(event.chat) + ' webhookUrl: ' + webhookUrl;
    sendMessageToFlock(chatDetails, message, "Chat Anywhere Bot");
    callback(null, {text: message})
});

function getClientUrl(chatId) {
    return clientBaseUrl + "?chatId=" + chatId;
}

router.post('/chat', function (req, res, next) {
    var message = req.body;
    var chatId = message.to;
    chatIdToMessages[chatId] = chatIdToMessages[chatId] || [];
    chatIdToMessages[chatId].push(message);
    if (chatIdToMessages[chatId].length > 20) {
        chatIdToMessages[chatId].shift()
    }
    io.emit(chatId, message)
});
router.post('/events', flock.events.listener);

router.post('/fetchMessages', function (req, res, next) {
    var chatId = param.chatId;
    res.send(chatIdToMessages[chatId] || [])
});

io.on('connection', function (socket) {
    socket.on('sendMessage', function (param) {
        var chatId = param.chatId;
        var message = param.message;
        var name = param.name;
        var chatDetails = chatIdDetails[chatId];
        if (!chatDetails) {
            sendMessageToFlock(chatDetails, message, name)
        }
    });
});

function sendMessageToFlock(chatDetails, message, senderName) {
    var token = userIdToToken[chatDetails.userId];
    flock.callMethod('chat.sendMessage', token, {
        to: chatDetails.chat,
        text: message,
        sendAs : {
            name: senderName,
            profileImage: "http://www.iconsdb.com/icons/preview/caribbean-blue/chat-4-xxl.png"
        }
    }, function (error, response) {
        if (!error) {
            console.log("unable to send message " + response);
        }
    });
}

module.exports = router;

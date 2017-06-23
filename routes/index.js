module.exports = function (io) {

    var clientBaseUrl = "https://73017e53.ngrok.io/";
    var serverBaseUrl = "https://73017e53.ngrok.io/";

    var express = require('express');
    var router = express.Router();
    var flock = require('flockos');

    flock.appId = '81aaeee2-721b-4bd9-badc-337202e1ab6e';
    flock.appSecret = '6be160e3-09a2-4fa2-994a-537dede8b411';

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

    router.post('/chat*', function (req, res, next) {
        console.log("received message");
        console.log(JSON.stringify(req.body));
        var message = req.body;
        var chatId = message.to;
        if(!message.sendAs) {
            pushToClient(chatId, message);
        }
        res.send("ok");
    });
    router.post('/events', flock.events.listener);

    router.post('/fetchMessages', function (req, res, next) {
        console.log(JSON.stringify(req.body));
        var chatId = req.body.chatId;
        res.send(chatIdToMessages[chatId] || [])
    });


    io.on('connection', function (socket) {
        console.log("client connected");
        socket.on('sendMessage', function (param) {
            console.log("received params" + param);
            var chatId = param.chatId;
            var message = param.message;
            var name = param.name;
            var chatDetails = chatIdDetails[chatId];
            if (chatDetails) {
                sendMessageToFlock(chatDetails, message, name)
            }
        });
    });

    function sendMessageToFlock(chatDetails, message, senderName) {
        var token = userIdToToken[chatDetails.userId];
        flock.callMethod('chat.sendMessage', token, {
            to: chatDetails.chat,
            text: message,
            sendAs: {
                name: senderName,
                profileImage: "http://www.iconsdb.com/icons/preview/caribbean-blue/chat-4-xxl.png"
            }
        }, function (error, response) {
            if (!error) {
                console.log("success in sending message " + response);
            }
        });
    }

    function pushToClient(chatId, message) {
        var chatDetails = chatIdDetails[chatId];
        var token = userIdToToken[chatDetails.userId];
        flock.callMethod('users.getPublicProfile', token, {
            userId: message.from
        }, function (error, response) {
            if (!error) {
                console.log("received user details" + response);
                message.name = response.firstName + " " + response.lastName;
                chatIdToMessages[chatId] = chatIdToMessages[chatId] || [];
                chatIdToMessages[chatId].push(message);
                io.emit(chatId, message);
            }
        });
    }

    return router;
};

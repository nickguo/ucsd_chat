$(function() {
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
'#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

// Initialize varibles
var $window = $(window);
var $usernameInput = $('.usernameInput'); // Input for username
var $messages = $('.messages'); // Messages area
var $inputMessage = $('.inputMessage'); // Input message input box

var $loginPage = $('.login.page'); // The login page
var $chatPage = $('.chat.page'); // The chatroom pagei
var $userCont = $('.userCont');
var $topicCont = $('.topicCont');
var $topicInput = $('.topicInput');

// Prompt for setting a username
var username;
var topic;
var connected = false;
var post = "";
var typing = false;
var lastTypingTime;
var $currentInput = $topicInput.focus();

//TODO: CHANGE LOCALHOST to the host url in production
var socket = io.connect("http://tritonchat.me");

//TODO: GET THE ROOM VALUE HERE, SIMILAR TO usernameInput
socket.on('connect', function() {
    //TODO: NVM, doing it in set topic
});

function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
        message += "there's 1 participant";
    } else {
        message += "there are " + data.numUsers + " participants";
    }
    log(message);
}
// Sets the client's topic

// Sets the client's username
function setTopic () {
    topic = cleanInput($topicInput.val().trim());

    // If the username is valid
    if (topic) {
        $topicCont.animate({
            'marginTop' : "-=100px"
        });
        $userCont.delay(300).fadeIn( function() {
            $usernameInput.focus()});
        $topicInput.blur();
        $currentInput = $usernameInput.focus();

        // Tell the server your username
        socket.emit('add topic', {topic: topic});
    }
}

$("#submitPost").click( function() {
    post = cleanInput($(".postInput").val().trim());

    if ( post) {
        socket.emit('add body', {body: post});
        post=null;
    }
});
    

function setUsername (){
    username  = cleanInput($usernameInput.val().trim());
    // if topic is valid
    if(username){

        //tell server the topic
        socket.emit('add user', username);
    }

}

// Sends a chat message
function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
        $inputMessage.val('');
        addChatMessage({
            username: username,
            message: message
        });
        // tell server to execute 'new message' and send along one parameter
        socket.emit('new message', message);
    }
}

// Log a message
function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
}

// Adds the visual chat message to the message list
function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
        options.fade = false;
        $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
        .text(data.username)
        .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
        .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
        .data('username', data.username)
        .addClass(typingClass)
        .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
}


function addEvent(data, options) {
    // Don't fade the message in if there is an 'X was typing'
    options = options || {};

    var $messageBodyDiv = $('<span class="messageBody">')
        .text(data.message);

    var $messageDiv = $('<li class="message"/>')
        .data('username', data.username)
        .addClass(typingClass)
        .append($usernameDiv, $messageBodyDiv);

    addEventElement($messageDiv, options);
}

// Adds the visual chat typing message
function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
}

// Removes the visual chat typing message
function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
        $(this).remove();
    });
}

// Adds a message element to the messages and scrolls to the bottom
// el - The element to add as a message
// options.fade - If the element should fade-in (default = true)
// options.prepend - If the element should prepend
//   all other messages (default = false)
function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
        options = {};
    }
    if (typeof options.fade === 'undefined') {
        options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
        options.prepend = false;
    }

    // Apply options
    if (options.fade) {
        $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
        $messages.prepend($el);
    } else {
        $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
}

// Prevents input from having injected markup
function cleanInput (input) {
    return $('<div/>').text(input).text();
}

/*function updateEvent () {
    if (connected) {
        if (!typing) {
            typing = true;
            socket.emit('typing');
        }
        lastTypingTime = (new Date()).getTime();

        setTimeout(function () {
            var typingTimer = (new Date()).getTime();
            var timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                socket.emit('stop typing');
                typing = false;
            }
        }, TYPING_TIMER_LENGTH);
    }
}*/

// Updates the typing event
function updateTyping () {
    if (connected) {
        if (!typing) {
            typing = true;
            socket.emit('typing');
        }
        lastTypingTime = (new Date()).getTime();

        setTimeout(function () {
            var typingTimer = (new Date()).getTime();
            var timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                socket.emit('stop typing');
                typing = false;
            }
        }, TYPING_TIMER_LENGTH);
    }
}

// Gets the 'X is typing' messages of a user
function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
        return $(this).data('username') === data.username;
    });
}

// Gets the color of a username through our hash function
function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
}

// Keyboard events

$window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey))  {
        $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
        if (!topic) {
            setTopic();
        }
        else if(topic && !username){
            setUsername();
        //    document.title=topic;
        }
        else if(username && topic){
            sendMessage();
            socket.emit('stop typing');
            typing = false;
        }
    }
});

$inputMessage.on('input', function() {
    updateTyping();
});

var inFocus = true;

// blinking events
var PageTitleNotification = {
    Vars:{
             OriginalTitle: document.title,
             titles: [document.title],
             counter: 1,
             Interval: null
         },    
    On: function(notification, intervalSpeed){
            if (!inFocus) {
                var _this = this;
                if (_this.Vars.titles.length == 1) {
                    _this.Vars.Interval = setInterval(function(){
                        document.title = _this.Vars.titles[_this.Vars.counter % _this.Vars.titles.length];
                        _this.Vars.counter++;
                        /*document.title = (_this.Vars.OriginalTitle == document.title)
                          ? notification
                          : _this.Vars.OriginalTitle;*/
                    }, (intervalSpeed) ? intervalSpeed : 500);
                }

                if (_this.Vars.titles.indexOf(notification) == -1) {
                    _this.Vars.titles[_this.Vars.titles.length] = notification;
                }
            }
        },
    Off: function(){
             clearInterval(this.Vars.Interval);
             document.title = this.Vars.OriginalTitle;   
             this.Vars.titles = [this.Vars.OriginalTitle];
             this.Vars.counter = 1;
         }
}
// turn off blinking on window focus
$window.focus( function(e) {
    PageTitleNotification.Off();
    inFocus = true;
});

$window.blur( function(e) {
    inFocus = false;
});

// Click events

// Focus input when clicking anywhere on login page
$loginPage.click(function () {
    $currentInput.focus();
});

// Focus input when clicking on the message input's border
$inputMessage.click(function () {
    $inputMessage.focus();
});


// Socket events

// Whenever the server emits 'login', log the login message
socket.on('valid login', function (data) {
        $loginPage.fadeOut();
        $chatPage.show();
        $loginPage.off('click');
        $("#test").show();
        $currentInput = $inputMessage.focus();
    connected = true;
    // Display the welcome message
    $(".chatRoomName").append(topic + " chatroom – Triton Chat");
    var message = "Welcome to the " + topic + " chatroom – Triton Chat";
    log(message, {
        prepend: true
    });
    addParticipantsMessage(data);
});

socket.on('new body', function(data) {
    console.log("new body socket on");
    alert(data.body);
});


socket.on('invalid login', function(data) {
    username=null;
    $("#errorMes").show().delay(1000).fadeOut();
});

// Whenever the server emits 'new message', update the chat body
socket.on('new message', function (data) {
    addChatMessage(data);
    PageTitleNotification.On(data.username + " sent a message...");
});

// Whenever the server emits 'user joined', log it in the chat body
socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
});

// Whenever the server emits 'user left', log it in the chat body
socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
});

// Whenever the server emits 'typing', show the typing message
socket.on('typing', function (data) {
    addChatTyping(data);
});

// Whenever the server emits 'stop typing', kill the typing message
socket.on('stop typing', function (data) {
    removeChatTyping(data);
});

});

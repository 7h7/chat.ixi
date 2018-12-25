const REST_URL = "http://localhost:4567/";
const REST_URL_GET = REST_URL+"getMessage/";
const REST_URL_SUBMIT = REST_URL+"submitMessage/";
const REST_URL_ADD_CHANNEL = REST_URL+"addChannel/";

const CHANNEL_CODES = {};

const HUES = {
    'A': 14, 'B': 28, 'C': 42, 'D': 56, 'E': 70,
    'F': 84, 'G': 98, 'H': 112, 'I': 126, 'J': 140,
    'K': 154, 'L': 168, 'M': 182, 'N': 196, 'O': 210,
    'P': 214, 'Q': 238, 'R': 252, 'S': 266, 'T': 280,
    'U': 290, 'V': 300, 'W': 312, 'X': 324, 'Y': 336,
    'Z': 348, '9': 0,
};

var channels = {};
var last_read_of_channel = {};
var current_channel;

function change_channel(new_channel_name) {

    const channel = CHANNEL_CODES[new_channel_name];
    if(channels[channel] === undefined)
        channels[channel] = [];
    current_channel = channel;

    $('#channel_header').text("#"+new_channel_name);
    $('#msgs').html("");

    let hue = HUES[channel[0]];
    $('body').css("background-color", " hsl(" + hue + ", 70%, 30%)");

    channels[channel].forEach(function (tx) {
        show_message(tx);
    });
    update_new_msg_counter(channel);
}

function update_new_msg_counter(channel) {
    const unread_msgs = channels[channel].length - last_read_of_channel[channel];
    $('#channel_' + channel + " .new_msg_counter").text(unread_msgs == 0 ? "" : unread_msgs);
}

function new_message(tx) {
    const channel = tx['channel'];
    channels[channel].push(tx);
    show_message(tx);
    update_new_msg_counter(channel);
}

function show_message(tx) {

    const channel = tx['channel'];
    const message = tx['message'];
    const timestamp = tx['timestamp'];
    const username = tx['username'];

    if(channel !== current_channel) { return; }

    const date = new Date(timestamp);
    const time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    const $msg_head = $('<div>').addClass("msg_head")
        .append($('<label>').addClass("username").text(username))
        .append(" at " + time);
    const $msg_body = $('<div>').addClass("msg_body").text(decode(message));
    const $msg = $('<div>').addClass("msg").addClass("hidden")
        .append($msg_head)
        .append($msg_body);
    $('#msgs').append($msg);
    setTimeout(function (e) {
        $msg.removeClass("hidden");
    }, 0);

    last_read_of_channel[current_channel] = channels[current_channel].length;

    scrollToBottom();
}

function read_message() {
    $.ajax({
        dataType: "json",
        url: REST_URL_GET,
        data: [],
        success: function (tx) {
            new_message(tx);
            read_message();
        },
        error: function (err) { console.log(err) }
    });
}

function submit_message(channel, message) {
    const $input_loading = $('#input_loading');
    $input_loading.removeClass("hidden");
    $.ajax({
        url: REST_URL_SUBMIT+channel+"/",
        data: [{"name": "message", "value": encode(message)}],
        success: function (data) { console.log("submitted"); $input_loading.addClass("hidden"); },
        error: function (err) { console.log(err); $input_loading.addClass("hidden"); },
    });
}

function add_channel(channel_name) {

    const code = channel_name.toUpperCase().padEnd(81, "9");
    CHANNEL_CODES[channel_name] = code;
    channels[code] = [];
    last_read_of_channel[code] = 0;

    const $channel =
        $('<div>').addClass('channel').attr("id", "channel_"+CHANNEL_CODES[channel_name]).text("#"+channel_name)
            .append($('<label>').addClass('new_msg_counter').text(""))
            .click(function () { change_channel(channel_name); });
    $('#channels').append($channel);

    $.ajax({
        url: REST_URL_ADD_CHANNEL+CHANNEL_CODES[channel_name],
        error: function (err) { console.log(err) }
    });
}

function submit() {
    submit_message(current_channel, $('#message').val());
}

function encode(str) {
    return str.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
        return '&#'+i.charCodeAt(0)+';';
    });
}

function decode(str) {
    return (str+"").replace(/&#\d+;/gm,function(s) {
        return String.fromCharCode(s.match(/\d+/gm)[0]);
    })
}

function scrollToBottom() {
    var objDiv = document.getElementById("log");
    objDiv.scrollTop = objDiv.scrollHeight;
}
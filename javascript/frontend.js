$(function () {
    "use strict";

    let content = document.getElementById('content');
    let input = document.getElementById('input');
    let status = document.getElementById('status');

    let myColor = false;
    let myName = false;

    window.WebSocket = window.WebSocket || window.MozWebSocket;

    if (!window.WebSocket) {
        content.html($('<p>',
            { text:'Sorry, but your browser doesn\'t support WebSocket.'}
        ));
        input.hide();
        $('span').hide();
        return;
    }

    let connection = new WebSocket('ws://127.0.0.1:8080');
    connection.onopen = () => {
      input.removeAttribute('disabled');
      status.text('Please enter a username:')
    };

    connection.onerror = ( error ) => {
        content.html($('<p>', {
            text: 'Sorry, but there\'s some problem with your '
            + 'connection or the server is down. Please, try again later. Error message: '
            + error
        }));
    };

    connection.onmessage = ( message ) => {
        let json = false;
        try {
            json = JSON.parse(message.data);
        } catch ( e ) {
            console.log(new Date() +
                ` | Invalid JSON: ${message.data}`);
            return;
        }

        if (json.type === 'color') {
            myColor = json.data;
            status.text(`${myName}: `).cssText('color', myColor);
            input.removeAttribute('disabled').focus();
            // from now user can start sending messages
        } else if (json.type === 'history') {
            for ( let i = 0; i < json.data.length; i++ ) {
                addMessage(json.data[i].author, json.data[i].text,
                    json.data[i].color, new Date(json.data[i].time));
            }
        } else if (json.type === 'message') {
            input.removeAttribute('disabled');
            addMessage(json.data.author, json.data.text,
                json.data.color, new Date(json.data.time));
        } else {
            console.log('Hmm..., I\'ve never seen JSON like this:', json);
        }
    };

    input.onkeydown = (e) => {
        if (e.code === 13) {
            let msg = $(this).val();
            if (!msg) {
                return;
            }
            connection.send(msg);
            $(this).val('');
            input.setAttribute('disabled', 'disabled');
            if (myName === false) {
                myName = msg;
            }
        }
    };

    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.setAttribute('disabled', 'disabled').val(
                'Unable to communicate with the WebSocket server.');
        }
    }, 3000);

    function addMessage(author, message, color, dt) {
        content.append('<p><span style="color:' + color + '">'
            + author + '</span> @ ' + (dt.getHours() < 10 ? '0'
                + dt.getHours() : dt.getHours()) + ':'
            + (dt.getMinutes() < 10
                ? '0' + dt.getMinutes() : dt.getMinutes())
            + ': ' + message + '</p>');
    }

    const canvas = document.getElementById('paint');
    const ctx = canvas.getContext('2d');

    canvas.width = 500;
    canvas.height = 250;

    let mouse = {x: 0, y: 0};

    /* Mouse Capturing Work */
    canvas.addEventListener('mousemove', function(e) {
        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
    }, false);

    /* Drawing on Paint App */
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = myColor;

    let slider = document.getElementById("myRange");
    ctx.lineWidth = slider.value;

    //function getSize(size){ctx.lineWidth = size;}

    canvas.addEventListener('mousedown', () => {
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);

        canvas.addEventListener('mousemove', onPaint, false);
    }, false);

    canvas.addEventListener('mouseup', () => {
        canvas.removeEventListener('mousemove', onPaint, false);
    }, false);

    const onPaint = () => {
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
    };
});
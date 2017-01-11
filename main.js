var canvas = document.getElementById('canvas');
var size = Math.min(window.innerWidth, 500);
var ctx = canvas.getContext('2d');
var img = document.createElement('img');
var button = document.getElementById('share');
var loaded = false;
var thoughtText = '';

if ( XMLHttpRequest.prototype.sendAsBinary === undefined ) {
  XMLHttpRequest.prototype.sendAsBinary = function(string) {
    var bytes = Array.prototype.map.call(string, function(c) {
      return c.charCodeAt(0) & 0xff;
    });
    this.send(new Uint8Array(bytes).buffer);
  };
}

function postImageToFacebook( authToken, filename, mimeType, imageData, message )
{
    // this is the multipart/form-data boundary we'll use
    var boundary = '----ThisIsTheBoundary1234567890';

    // let's encode our image file, which is contained in the var
    var formData = '--' + boundary + '\r\n'
    formData += 'Content-Disposition: form-data; name="source"; filename="' + filename + '"\r\n';
    formData += 'Content-Type: ' + mimeType + '\r\n\r\n';
    for ( var i = 0; i < imageData.length; ++i )
    {
        formData += String.fromCharCode( imageData[ i ] & 0xff );
    }
    formData += '\r\n';
    formData += '--' + boundary + '\r\n';
    formData += 'Content-Disposition: form-data; name="message"\r\n\r\n';
    formData += message + '\r\n'
    formData += '--' + boundary + '--\r\n';

    var xhr = new XMLHttpRequest();
    xhr.open( 'POST', 'https://graph.facebook.com/me/photos?access_token=' + authToken, true );
    xhr.onload = xhr.onerror = function() {
      console.log( xhr.responseText );
      try {
        var res = JSON.parse(xhr.responseText);
        if (res.id) {
          var link = document.getElementById('shared-link');
          link.setAttribute('href', 'https://www.facebook.com/photo.php?fbid=' + res.id);
          $('.shared-link-modal').modal({show: true});
        }
      }
      catch(e) {
        console.error(e);
      }
    };
    xhr.setRequestHeader( "Content-Type", "multipart/form-data; boundary=" + boundary );
    xhr.sendAsBinary( formData );
}

img.src = 'original.png';
img.onload = function () {
  loaded = true;
  ctx.drawImage(img, 0, 0, size, size);
}

var thought = document.getElementById('thought');
thought.addEventListener('input', evt => {
  thoughtText = evt.target.value;
  var fontSize = 0.05 * size;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);

  if (loaded) {
    ctx.drawImage(img, 0, 0, size, size);
  }

  ctx.fillStyle = '#000000'
  ctx.font = fontSize + 'px PingFangTC-Regular, sans-serif';
  evt.target.value.split('\n').forEach((line, index) => {
    ctx.fillText(line, 0.35 * size, 0.6 * size + (fontSize * index * 1.2));
  });
})

window.addEventListener('resize', function (){
  console.log('window width', window.innerWidth);
  size = Math.min(window.innerWidth, 500);
  canvas.setAttribute('width', size);
  canvas.setAttribute('height', size);

  if (loaded) {
    ctx.drawImage(img, 0, 0, size, size);
  }
});

function setupFb() {
  FB.getLoginStatus(function(response) {
    var login = false;
    if (response.status === 'connected') {
      login = true;
      button.innerText = '分享到 Facebook';
    }
    else {
      button.innerText = '連接 Facebook 分享此圖';
    }

    button.addEventListener('click', evt => {
      if (login) {
        var c = canvas.toDataURL('image/png');
        var encodedPng = c.substring(c.indexOf(',')+1,c.length);
        var decodedPng = Base64Binary.decode(encodedPng);
        postImageToFacebook(response.authResponse.accessToken, 'test.png', 'image/png', decodedPng, '')
      }
      else {
        FB.login(response => {
          login = response.status === 'connected'
          if (login) {
            button.innerText = '分享到 Facebook';
          }
        }, {scope: 'publish_actions'});
      }
    });
  });
}

canvas.setAttribute('width', size);
canvas.setAttribute('height', size);


window.fbAsyncInit = function() {
  FB.init({
    appId      : '390592127957211',
    xfbml      : true,
    version    : 'v2.8'
  });
  FB.AppEvents.logPageView();
  setupFb();
};

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
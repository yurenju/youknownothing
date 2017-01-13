var canvas = document.getElementById('canvas');
var max = 500;
var width = Math.min(window.innerWidth, max);
var height = width;
var ctx = canvas.getContext('2d');
var img = document.createElement('img');
var shareButton = document.getElementById('share');
var downloadButton = document.getElementById('download');
var loaded = false;
var thoughtText = '';
var thought = document.getElementById('thought');

function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(dataURI.split(',')[1]);
  else
      byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {type:mimeString});
}

function postImageToFacebook( authToken, filename, mimeType, imageData, message )
{
    var data = new FormData();
    data.append('source', dataURItoBlob(imageData), filename);
    data.append('message', message);

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
          ga('send', 'event', 'Photos', 'upload');
          shareButton.classList.remove('disabled');
        }
      }
      catch(e) {
        console.error(e);
      }
    };
    xhr.send(data);
}

function updateText(val, offset) {
  offset = offset || 0;
  thoughtText = val;
  var fontSize = 0.05 * width;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  if (loaded) {
    var devicePixelRatio = window.devicePixelRatio || 1;
    ctx.drawImage(img, 0, offset * devicePixelRatio, width * devicePixelRatio, height * devicePixelRatio);
  }

  ctx.fillStyle = '#000000'
  ctx.font = fontSize + 'px PingFangTC-Regular, sans-serif';
  ctx.save();
  thoughtText.split('\n').forEach((line, index) => {
    ctx.fillText(line, 0.28 * width, 0.40 * width + (fontSize * index * 1.2) + offset);
  });
  ctx.restore();
}

function update(offsetTop, offsetBottom) {
  offsetTop = offsetTop || 0;
  offsetBottom = offsetBottom || 0;
  console.log('window width', window.innerWidth);
  width = Math.min(window.innerWidth, max);
  height = width * img.naturalHeight / img.naturalWidth;
  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height + offsetTop + offsetBottom);
  ctx = canvas.getContext('2d');
  updateText(thought.value, offsetTop);
}

function applyInformation() {
  var offsetTop = 35;
  var offsetBottom = 20;
  update(offsetTop, offsetBottom);
  ctx.fillRect(0, 0, width, offsetTop - 2);
  ctx.fillRect(0, offsetTop +  height + 2, width, offsetBottom);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px PingFangTC-Regular, sans-serif';
  var msg = '小孩，不是你的工具。';
  var textwidth = ctx.measureText(msg).width;
  ctx.fillText(msg, (width - textwidth) / 2, 25);

  ctx.font = '12px PingFangTC-Regular, sans-serif';
  msg = 'https://bit.ly/kidnottool';
  textwidth = ctx.measureText(msg).width;
  ctx.fillText(msg, (width - textwidth) / 2, offsetTop + height + offsetBottom - 4);
}

function setupFb() {
  FB.getLoginStatus(function(response) {
    var login = false;
    var token;
    if (response.status === 'connected') {
      login = true;
      token = response.authResponse.accessToken;
      shareButton.innerText = '分享到 Facebook';
    }
    else {
      shareButton.innerText = '連接 Facebook 分享此圖';
    }

    shareButton.addEventListener('click', evt => {
      if (login) {
        shareButton.classList.add('disabled');
        applyInformation();
        postImageToFacebook(token, 'thought.png', 'image/png', canvas.toDataURL('image/png'), thoughtText);
        update();
      }
      else {
        FB.login(response => {
          login = response.status === 'connected'
          if (login) {
            token = response.authResponse.accessToken;
            shareButton.innerText = '分享到 Facebook';
          }
        }, {scope: 'publish_actions'});
      }
    });
  });
}

img.src = 'original.jpg';
img.onload = function () {
  loaded = true;
  update();
}

downloadButton.addEventListener('click', function(evt) {
  applyInformation();
  canvas.toBlob(function(blob) {
      saveAs(blob, "youknownothing.png");
      update();
  });
});

thought.addEventListener('input', evt => updateText(evt.target.value));
window.addEventListener('resize', evt => update());

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
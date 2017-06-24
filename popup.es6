window.onload = function() {
  navigator.getUserMedia = (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia || 
                            navigator.msGetUserMedia);

  if (navigator.getUserMedia) {
    var vid = document.getElementById('camera-stream');

    navigator.getUserMedia(
      {
        video: true,
        audio: true
      },
      localMediaStream => {
        vid.src = window.URL.createObjectURL(localMediaStream); 
      },
      err => {
        alert('Oops, you should feel bad') 
      });

  } else {
    alert('Your potato does not support getUserMedia');
  }
}

const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
let analyser = null;
let dataArray = null;

window.onload = function() {
  navigator.getUserMedia = (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia);

  if (navigator.getUserMedia) {
    var vid = document.getElementById('camera-stream');

    navigator.getUserMedia(
      {
        video: false,
        audio: {
          "mandatory": {
              "googEchoCancellation": "false",
              "googAutoGainControl": "false",
              "googNoiseSuppression": "false",
              "googHighpassFilter": "false"
            }
          }
      },
      localMediaStream => {
        handleStream(localMediaStream);
      },
      err => {
        alert('Oops, you should feel bad')
      });

  } else {
    alert('Your potato does not support getUserMedia');
  }
}

const handleStream = stream => {
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  mediaStreamSource = audioCtx.createMediaStreamSource(stream);
  mediaStreamSource.connect( analyser );

  var bufferLength = analyser.frequencyBinCount;
  dataArray = new Float32Array(bufferLength);
  analyser.getFloatTimeDomainData(dataArray);

  window.setInterval(getPitch, 100);
}

const getPitch = () => {
  analyser.getFloatTimeDomainData(dataArray);

  const pitch = autoCorrelate(dataArray, audioCtx.sampleRate);
  if(pitch > 90 && pitch < 150){
    chrome.tabs.query({active: true}, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, {scrollDir: "down"});
    });
  } else if(pitch > 290 && pitch < 390) {
    chrome.tabs.query({active: true}, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, {scrollDir: "up"});
    });
  }
}

function autoCorrelate( buf, sampleRate ) {
  var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.
  var GOOD_ENOUGH_CORRELATION = 0.9; // this is the "bar" for how close a correlation needs to be
  var SIZE = buf.length;
  var MAX_SAMPLES = Math.floor(SIZE/2);
  var best_offset = -1;
  var best_correlation = 0;
  var rms = 0;
  var foundGoodCorrelation = false;
  var correlations = new Array(MAX_SAMPLES);

  for (var i=0;i<SIZE;i++) {
    var val = buf[i];
    rms += val*val;
  }
  rms = Math.sqrt(rms/SIZE);
  if (rms<0.01) // not enough signal
    return -1;

  var lastCorrelation=1;
  for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
    var correlation = 0;

    for (var i=0; i<MAX_SAMPLES; i++) {
      correlation += Math.abs((buf[i])-(buf[i+offset]));
    }
    correlation = 1 - (correlation/MAX_SAMPLES);
    correlations[offset] = correlation; // store it, for the tweaking we need to do below.
    if ((correlation>GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
      foundGoodCorrelation = true;
      if (correlation > best_correlation) {
        best_correlation = correlation;
        best_offset = offset;
      }
    } else if (foundGoodCorrelation) {
      // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
      // Now we need to tweak the offset - by interpolating between the values to the left and right of the
      // best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
      // we need to do a curve fit on correlations[] around best_offset in order to better determine precise
      // (anti-aliased) offset.

      // we know best_offset >=1,
      // since foundGoodCorrelation cannot go to true until the second pass (offset=1), and
      // we can't drop into this clause until the following pass (else if).
      var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];
      return sampleRate/(best_offset+(8*shift));
    }
    lastCorrelation = correlation;
  }
  if (best_correlation > 0.01) {
    // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
    return sampleRate/best_offset;
  }
  return -1;
//  var best_frequency = sampleRate/best_offset;
}

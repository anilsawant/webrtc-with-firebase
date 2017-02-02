window.onload = function () {
  initializeFirebase();
  setupLogin();
  setupHome();
}
let setupHome = function () {
  setupVideoCall();

  let btnTakeBreak = document.getElementById('btnTakeBreak'),
      btnLogout = document.getElementById('btnLogout');

  btnTakeBreak.addEventListener('click', function (evt) {
    if (evt.target.textContent == 'Take Break') {
      window.myFirebaseObj.takeBreak(function (err, result) {
        if (err) {
          console.log("ERROR: Take break", err);
          return;
        }
        if (result == true) {
          evt.target.textContent = 'End Break';
        }
      });
    } else {
      window.myFirebaseObj.endBreak(function (err, result) {
        if (err) {
          console.log("ERROR: End break", err);
          return;
        }
        if (result == true) {
          evt.target.textContent = 'Take Break';
        }
      });
    }
  });

  btnLogout.addEventListener('click', function (evt) {
    evt.preventDefault();
    window.myFirebaseObj.logout(function (err, result) {
      if (err) {
        console.log("ERROR: Logout", err);
        return;
      }
      if (result == true) {
        console.log("SUCCESS: Logout.");
      }
    });
  });
}
let setupVideoCall = function () {
  let videoOverlay = document.querySelector('.video-overlay'),
      localVideo = window.localVideo = videoOverlay.querySelector('#localVideo'),
      remoteVideo = window.remoteVideo = videoOverlay.querySelector('#remoteVideo'),
      btnEndCall = window.btnEndCall = videoOverlay.querySelector('.glyphicon-remove-sign');

  window.$videoOverlay = $(videoOverlay);
  btnEndCall.addEventListener('click', function () {
    endCallHandler(true);
  });
}
let popupCall = function(caller, done) {
  if (caller && done && (typeof done == 'function')) {
    let callerName = caller.name || 'Call',
        callerPic = caller.photoURL || "static/img/default-avatar.png",
        popupOverlay = document.createElement('div'),
        callBox = `<div class="call-box margin-auto text-center">
                      <div><span class="glyphicon glyphicon-phone-alt"></span> <span>${callerName}</span></div>
                      <div>
                        <img class="caller-pic" src="${callerPic}" alt="Caller pic">
                      </div>
                      <div class="call-controls"></div>
                    </div>`;
    popupOverlay.className = 'incoming-call-overlay display-flex';
    popupOverlay.innerHTML = callBox;
    popupOverlay.tabIndex = 1;

    let callWaitTimeout = setTimeout(function () {
      done('timeout');
      popupCall.done();
    }, 10*1000);// wait for 10s for user action, then timeout
    let btnReject = document.createElement('button');
    btnReject.className = 'btn-reject btn btn-sm btn-danger';
    btnReject.textContent = 'Reject';
    btnReject.addEventListener('click', function() {
      clearTimeout(callWaitTimeout);
      done(false);
      popupCall.done();
    });
    let btnAccept = document.createElement('button');
    btnAccept.className = 'btn-accept btn btn-sm btn-success';
    btnAccept.textContent = 'Accept';
    btnAccept.addEventListener('click', function() {
      clearTimeout(callWaitTimeout);
      done(true);
      popupCall.done();
    });
    popupOverlay.querySelector('.call-controls').appendChild(btnReject);
    popupOverlay.querySelector('.call-controls').appendChild(btnAccept);
    document.body.appendChild(popupOverlay);
    setTimeout(function () {
      popupOverlay.querySelector('.call-box').style.transform = 'scale(1)';
      popupOverlay.style.opacity = 1;
      btnAccept.focus();
    }, 10);
  } else {
    console.log("ERROR: cannot show call.", caller, done);
  }
}
popupCall.done = function () {
  let popupOverlay = document.querySelector('.incoming-call-overlay');
  if (popupOverlay) {
    popupOverlay.querySelector('.call-box').style.transform = 'scale(.2)';
    popupOverlay.style.opacity = 0;
    setTimeout(function () {
        document.body.removeChild(popupOverlay);
    }, 300);//more than transform-scale time
  }
}

let intitiateCall = function (caller, done) {
  if (done && typeof done == 'function') {
    window.$videoOverlay.find('.call-to').text("Call from " + caller.userId + "...");
    window.$videoOverlay.fadeIn(function () {
      getWebcamAccess(window.localVideo, function (accessReceived) {
        if (!accessReceived) {
          console.log("ERROR: Did not get Webcam access.");
          window.$videoOverlay.fadeOut(function () {
            window.$videoOverlay.find('.call-to').text("Calling...");
          });
          done(false);
        } else {
          done(true);
        }
      });
    });
  } else {
    console.log("ERROR: incorrect usage. User callback missing.");
  }
}
let endCallHandler = function (sendEndCallMsg) {
  if (window.localStream) {
    if (window.localStream.stop)
      window.localStream.stop();
    window.localStream.getTracks().forEach(function (track) { track.stop(); });
    window.localStream = null;
  }
  window.myFirebaseObj.endCall(sendEndCallMsg);
  window.$videoOverlay.fadeOut(function () {
    window.$videoOverlay.find('.call-to').text("Calling...");
  });
}
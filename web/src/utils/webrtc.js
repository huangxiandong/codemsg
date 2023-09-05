class Webrtc {
  createPeerConnection() {
    console.log("Setting up a connection...");
    // Create an RTCPeerConnection which knows to use our chosen
    // STUN server.

    this.myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                url: "turn:127.0.0.1:19302?transport=udp",
                username: "1677220814:flutter-webrtc",
                credential: "w/gSIapxMvER2Mka5TnCXiomqBU",
            },
        ],
    });
    console.log(this.myPeerConnection);

    // Set up event handlers for the ICE negotiation process.

    this.myPeerConnection.onicecandidate = this.handleICECandidateEvent;
    this.myPeerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.myPeerConnection.onicegatheringstatechange = this.handleICEGatheringStateChangeEvent;
    this.myPeerConnection.onsignalingstatechange =this.handleSignalingStateChangeEvent;
    // this.myPeerConnection.onnegotiationneeded = this.handleNegotiationNeededEvent;
    this.myPeerConnection.ontrack = this.handleTrackEvent;
  }

  handleICECandidateEvent(event) {
    if (event.candidate) {
      console.log("*** Outgoing ICE candidate: " + event.candidate.candidate);

      this.sendToServer({
        type: "new-ice-candidate",
        target: "targetUsername",
        candidate: event.candidate,
      });
    }
  }

  handleICEConnectionStateChangeEvent(event) {
    console.log(
      "*** ICE connection state changed to " +
        this.myPeerConnection.iceConnectionState
    );

    switch (this.myPeerConnection.iceConnectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        this.closeVideoCall();
        break;
    }
  }

  handleICEGatheringStateChangeEvent(event) {
    console.log(
      "*** ICE gathering state changed to: " +
        this.myPeerConnection.iceGatheringState
    );
  }

  handleSignalingStateChangeEvent(event) {
    console.log("*** WebRTC signaling state changed to: ");
    console.log(this.myPeerConnection.signalingState);
    switch(this.myPeerConnection.signalingState) {
      case "closed":
        this.closeVideoCall();
        break;
    }
  }

  async handleNegotiationNeededEvent() {
    console.log("*** Negotiation needed");
  
    try {
      console.log("---> Creating offer");
      const offer = await this.myPeerConnection.createOffer();
  
      // If the connection hasn't yet achieved the "stable" state,
      // return to the caller. Another negotiationneeded event
      // will be fired when the state stabilizes.
  
      if (this.myPeerConnection.signalingState != "stable") {
        console.log("     -- The connection isn't stable yet; postponing...")
        return;
      }
  
      // Establish the offer as the local peer's current
      // description.
  
      console.log("---> Setting local description to the offer");
      await this.myPeerConnection.setLocalDescription(offer);
  
      // Send the offer to the remote peer.
  
      console.log("---> Sending the offer to the remote peer");
      this.sendToServer({
        name: "myUsername",
        target: "targetUsername",
        type: "video-offer",
        sdp: this.myPeerConnection.localDescription
      });
    } catch(err) {
      console.log("*** The following error occurred while handling the negotiationneeded event:");
      this.reportError(err);
    };
  }

  handleTrackEvent(event) {
    console.log("*** Track event");
    document.getElementById("received_video").srcObject = event.streams[0];
    document.getElementById("hangup-button").disabled = false;
  }

  sendToServer(obj) {
    console.log(obj);
  }

  closeVideoCall() {
    console.log("closeVideoCall")
  }

  async sendVideoOffer() {
    const offer = await this.myPeerConnection.createOffer();

    // 描述
    await this.myPeerConnection.setLocalDescription(offer);

    console.log("---> Sending the offer to the remote peer");
    this.sendToServer({
    name: "myUsername",
    target: "targetUsername",
    type: "video-offer",
    sdp: this.myPeerConnection.localDescription
    });
  }

  reportError(err) {
    console.log(err);
  }

  log(msg) {
    console.log(msg);
  }
}

export default Webrtc;

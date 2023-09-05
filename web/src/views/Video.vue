<template>
    <div id="container">
    <h1><a href="//webrtc.github.io/samples/" title="WebRTC samples homepage">WebRTC samples</a>
        <span>Peer connection</span></h1>

    <p>This sample shows how to setup a connection between two peers using
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection">RTCPeerConnection</a>.
    </p>

    <video id="localVideo" playsinline autoplay muted></video>
    <video id="remoteVideo" playsinline autoplay></video>

    <div class="box">
        <button id="startButton">Start</button>
        <button id="callButton">Call</button>
        <button id="hangupButton">Hang Up</button>
    </div>

    <p>View the console to see logging. The <code>MediaStream</code> object <code>localStream</code>, and the <code>RTCPeerConnection</code>
        objects <code>pc1</code> and <code>pc2</code> are in global scope, so you can inspect them in the console as
        well.</p>

    <p>For more information about RTCPeerConnection, see <a href="http://www.html5rocks.com/en/tutorials/webrtc/basics/"
                                                            title="HTML5 Rocks article about WebRTC by Sam Dutton">Getting
        Started With WebRTC</a>.</p>


    <a href="https://github.com/webrtc/samples/tree/gh-pages/src/content/peerconnection/pc1"
       title="View source for this page on GitHub" id="viewSource">View source on GitHub</a>

    </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
    mounted() {
        const startButton = document.getElementById('startButton');
        const callButton = document.getElementById('callButton');
        const hangupButton = document.getElementById('hangupButton');
        callButton.disabled = true;
        hangupButton.disabled = true;
        startButton.addEventListener('click', start);
        callButton.addEventListener('click', call);
        hangupButton.addEventListener('click', hangup);

        let startTime;
        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');

        localVideo.addEventListener('loadedmetadata', function() {
        console.log(`Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
        });

        remoteVideo.addEventListener('loadedmetadata', function() {
        console.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
        });

        remoteVideo.addEventListener('resize', () => {
        console.log(`Remote video size changed to ${remoteVideo.videoWidth}x${remoteVideo.videoHeight} - Time since pageload ${performance.now().toFixed(0)}ms`);
        // We'll use the first onsize callback as an indication that video has started
        // playing out.
        if (startTime) {
            const elapsedTime = window.performance.now() - startTime;
            console.log('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
            startTime = null;
        }
        });

        let localStream;
        let pc1;
        let pc2;
        const offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
        };

        function getName(pc) {
        return (pc === pc1) ? 'pc1' : 'pc2';
        }

        function getOtherPc(pc) {
        return (pc === pc1) ? pc2 : pc1;
        }

        async function start() {
        console.log('Requesting local stream');
        startButton.disabled = true;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
            console.log('Received local stream');
            localVideo.srcObject = stream;
            localStream = stream;
            callButton.disabled = false;
        } catch (e) {
            console.log("-----", e);
        }
        }

        async function call() {
        callButton.disabled = true;
        hangupButton.disabled = false;
        console.log('Starting call');
        startTime = window.performance.now();
        const videoTracks = localStream.getVideoTracks();
        const audioTracks = localStream.getAudioTracks();
        if (videoTracks.length > 0) {
            console.log(`Using video device: ${videoTracks[0].label}`);
        }
        if (audioTracks.length > 0) {
            console.log(`Using audio device: ${audioTracks[0].label}`);
        }
        const configuration = {};
        console.log('RTCPeerConnection configuration:', configuration);
        pc1 = new RTCPeerConnection(configuration);
        console.log('Created local peer connection object pc1');
        pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
        pc2 = new RTCPeerConnection(configuration);
        console.log('Created remote peer connection object pc2');
        pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
        pc1.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc1, e));
        pc2.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc2, e));
        pc2.addEventListener('track', gotRemoteStream);

        localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));
        console.log('Added local stream to pc1');

        try {
            console.log('pc1 createOffer start');
            const offer = await pc1.createOffer(offerOptions);
            await onCreateOfferSuccess(offer);
        } catch (e) {
            onCreateSessionDescriptionError(e);
        }
        }

        function onCreateSessionDescriptionError(error) {
        console.log(`Failed to create session description: ${error.toString()}`);
        }

        async function onCreateOfferSuccess(desc) {
        console.log(`Offer from pc1\n${desc.sdp}`);
        console.log('pc1 setLocalDescription start');
        try {
            await pc1.setLocalDescription(desc);
            onSetLocalSuccess(pc1);
        } catch (e) {
            onSetSessionDescriptionError();
        }

        console.log('pc2 setRemoteDescription start');
        try {
            await pc2.setRemoteDescription(desc);
            onSetRemoteSuccess(pc2);
        } catch (e) {
            onSetSessionDescriptionError();
        }

        console.log('pc2 createAnswer start');
        // Since the 'remote' side has no media stream we need
        // to pass in the right constraints in order for it to
        // accept the incoming offer of audio and video.
        try {
            const answer = await pc2.createAnswer();
            await onCreateAnswerSuccess(answer);
        } catch (e) {
            onCreateSessionDescriptionError(e);
        }
        }

        function onSetLocalSuccess(pc) {
        console.log(`${getName(pc)} setLocalDescription complete`);
        }

        function onSetRemoteSuccess(pc) {
        console.log(`${getName(pc)} setRemoteDescription complete`);
        }

        function onSetSessionDescriptionError(error) {
        console.log(`Failed to set session description: ${error.toString()}`);
        }

        function gotRemoteStream(e) {
        if (remoteVideo.srcObject !== e.streams[0]) {
            remoteVideo.srcObject = e.streams[0];
            console.log('pc2 received remote stream');
        }
        }

        async function onCreateAnswerSuccess(desc) {
        console.log(`Answer from pc2:\n${desc.sdp}`);
        console.log('pc2 setLocalDescription start');
        try {
            await pc2.setLocalDescription(desc);
            onSetLocalSuccess(pc2);
        } catch (e) {
            onSetSessionDescriptionError(e);
        }
        console.log('pc1 setRemoteDescription start');
        try {
            await pc1.setRemoteDescription(desc);
            onSetRemoteSuccess(pc1);
        } catch (e) {
            onSetSessionDescriptionError(e);
        }
        }

        async function onIceCandidate(pc, event) {
        try {
            await (getOtherPc(pc).addIceCandidate(event.candidate));
            onAddIceCandidateSuccess(pc);
        } catch (e) {
            onAddIceCandidateError(pc, e);
        }
        console.log(`${getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
        }

        function onAddIceCandidateSuccess(pc) {
        console.log(`${getName(pc)} addIceCandidate success`);
        }

        function onAddIceCandidateError(pc, error) {
        console.log(`${getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
        }

        function onIceStateChange(pc, event) {
        if (pc) {
            console.log(`${getName(pc)} ICE state: ${pc.iceConnectionState}`);
            console.log('ICE state change event: ', event);
        }
        }

        function hangup() {
        console.log('Ending call');
        pc1.close();
        pc2.close();
        pc1 = null;
        pc2 = null;
        hangupButton.disabled = true;
        callButton.disabled = false;
        }
    }
})
</script>

<style scoped>
button {
  margin: 0 20px 0 0;
  width: 83px;
}

button#hangupButton {
    margin: 0;
}

video {
  --width: 45%;
  width: var(--width);
  height: calc(var(--width) * 0.75);
  margin: 0 0 20px 0;
  vertical-align: top;
}

video#localVideo {
  margin: 0 20px 20px 0;
}

div.box {
  margin: 1em;
}

@media screen and (max-width: 400px) {
  button {
    width: 83px;
    margin: 0 11px 10px 0;
  }

  video {
    height: 90px;
    margin: 0 0 10px 0;
    width: calc(50% - 7px);
  }
  video#localVideo {
    margin: 0 10px 20px 0;
  }

}
</style>
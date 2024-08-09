import AgoraRTC from "agora-rtc-sdk-ng";
import { AudienceLatencyLevelType } from "agora-rtc-sdk-ng";
const axios = require('axios');

let rtc = {
    localAudioTrack: null,
    localVideoTrack: null,
    screenTrack: null,
    client: null,
    isScreenSharing: false
};

let options = {
    appId: "4d6be4271ce442b9912fa568bb508bfd",
    channel: "282183123",
    uid: 12345226,
};

async function initializeStreamPage() {
    rtc.client = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
        clientRoleOptions: {
            level: AudienceLatencyLevelType.AUDIENCE_LEVEL_ULTRA_LOW_LATENCY
        }
    });

    document.getElementById("stream-webcam").onclick = function () {
        rtc.isScreenSharing = false;
    };

    document.getElementById("stream-screen").onclick = function () {
        rtc.isScreenSharing = true;
    };

    document.getElementById("host-join").onclick = async function () {
        rtc.client.setClientRole("host");

        const uid = Math.floor(Math.random() * 1000000);
        let token = await fetchToken(options.channel, uid);
        await rtc.client.join(options.appId, options.channel, token, uid);

        const micAudioEnabled = document.getElementById("mic-audio").checked;
        const systemAudioEnabled = document.getElementById("system-audio").checked;

        if (rtc.isScreenSharing) {
            // Захват экрана с опциональным системным аудио
            rtc.screenTrack = await AgoraRTC.createScreenVideoTrack({
                encoderConfig: {
                    width: 1280,
                    height: 720,
                    frameRate: 60,
                    bitrateMax: 1500
                },
                withAudio: systemAudioEnabled ? "system" : false
            });

            // Захват микрофона, если выбран
            if (micAudioEnabled) {
                rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                await rtc.client.publish([rtc.screenTrack, rtc.localAudioTrack]);
            } else {
                await rtc.client.publish([rtc.screenTrack]);
            }
        } else {
            // Захват веб-камеры и опционального микрофона
            const tracks = [];
            if (micAudioEnabled) {
                rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                tracks.push(rtc.localAudioTrack);
            }
            rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
            tracks.push(rtc.localVideoTrack);

            await rtc.client.publish(tracks);
        }
        
        const localPlayerContainer = document.createElement("div");
        localPlayerContainer.className = 'video-container'; // Применяем CSS-класс
        localPlayerContainer.id = uid;
        document.body.querySelector(".video-container").append(localPlayerContainer);

        if (rtc.isScreenSharing) {
            rtc.screenTrack.play(localPlayerContainer);
        } else {
            rtc.localVideoTrack.play(localPlayerContainer);
        }

        console.log("publish success!");
    };

    document.getElementById("leave").onclick = async function () {
        if (rtc.localAudioTrack) rtc.localAudioTrack.close();
        if (rtc.localVideoTrack) rtc.localVideoTrack.close();
        if (rtc.screenTrack) rtc.screenTrack.close();

        const localPlayerContainer = document.getElementById(options.uid);
        if (localPlayerContainer) {
            localPlayerContainer.remove();
        }

        rtc.client.remoteUsers.forEach(user => {
            const playerContainer = document.getElementById(user.uid);
            playerContainer && playerContainer.remove();
        });

        await rtc.client.leave();
    };
}

async function initializeAudiencePage() {
    rtc.client = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
        clientRoleOptions: {
            level: AudienceLatencyLevelType.AUDIENCE_LEVEL_ULTRA_LOW_LATENCY
        }
    });

    document.getElementById("audience-join").onclick = async function () {
        rtc.client.setClientRole("audience");

        const uid = Math.floor(Math.random() * 1000000);
        let token = await fetchToken(options.channel, uid);
        await rtc.client.join(options.appId, options.channel, token, uid);

        rtc.client.on("user-published", async (user, mediaType) => {
            await rtc.client.subscribe(user, mediaType);
            console.log("subscribe success");

            if (mediaType === "video") {
                const remoteVideoTrack = user.videoTrack;
                const remotePlayerContainer = document.createElement("div");
                remotePlayerContainer.className = 'video-container'; // Применяем CSS-класс
                remotePlayerContainer.id = user.uid.toString();
                document.body.querySelector(".video-container").append(remotePlayerContainer);

                remoteVideoTrack.play(remotePlayerContainer);
            }

            if (mediaType === "audio") {
                const remoteAudioTrack = user.audioTrack;
                remoteAudioTrack.play();
            }
        });

        rtc.client.on("user-unpublished", user => {
            const remotePlayerContainer = document.getElementById(user.uid);
            remotePlayerContainer.remove();
        });
    };
}

function fetchToken(channelName, uid) {
    return new Promise(function (resolve, reject) {
        axios.post("https://test-site-domens.site:8080/generate-token", {
            channelName: channelName,
            uid: uid
        }, {
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            }
        })
        .then(function (response) {
            const token = response.data.token;
            resolve(token);
        })
        .catch(function (error) {
            console.log(error);
            reject(error);
        });
    });
}

// Initialize page based on URL
window.onload = function () {
    if (window.location.pathname.endsWith('stream.html')) {
        initializeStreamPage();
    } else {
        initializeAudiencePage();
    }
};

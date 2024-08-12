import AgoraRTC from "agora-rtc-sdk-ng";
import { AudienceLatencyLevelType } from "agora-rtc-sdk-ng";
import { fetchToken } from './agoraLogic.js';
const axios = require('axios');

let rtc = {
    localAudioTrack: null,
    localVideoTrack: null,
    screenTrack: null,
    client: null,
    isScreenSharing: false
};

let options = {
    appId: "4d6be4271ce442b9912fa568bb508bfd"
};

export async function initializeStreamPage() {

    const uid = Math.floor(Math.random() * 1000000);
    const channelName = Math.floor(Math.random() * 10000000).toString();
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

        
        let token = await fetchToken(channelName, uid);
        await rtc.client.join(options.appId, channelName, token, uid);

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

        // Отправка информации о стриме на сервер
        try {
            await sendStreamInfoToServer(
                channelName, 
                uid, 
                options.appId, 
                document.getElementById("stream-name").value, // Предполагается, что есть элемент с id "stream-name" для имени стрима
                document.getElementById("stream-description").value // Предполагается, что есть элемент с id "stream-description" для описания стрима
            );
        } catch (error) {
            console.error('Failed to send stream info to server:', error);
        }
    };

    document.getElementById("leave").onclick = async function () {
        if (rtc.localAudioTrack) rtc.localAudioTrack.close();
        if (rtc.localVideoTrack) rtc.localVideoTrack.close();
        if (rtc.screenTrack) rtc.screenTrack.close();

        const localPlayerContainer = document.getElementById(uid);
        if (localPlayerContainer) {
            localPlayerContainer.remove();
        }

        rtc.client.remoteUsers.forEach(user => {
            const playerContainer = document.getElementById(user.uid);
            playerContainer && playerContainer.remove();
        });
        console.log(uid)
        try {
            await sendStreamStopToServer( 
                uid
            );

        } catch (error) {
            console.error('Failed to send stream info to server:', error);
        }

        await rtc.client.leave();
    };

}



// фукция для проверки запущен ли стрим
async function startStreamCheckInterval(uid) {
    setInterval(async () => {
        try {
            if (!rtc.client || !rtc.client.remoteUsers) {
                console.log("RTC client is not initialized or remote users list is not available.");
                return;
            }

            // Проверьте, есть ли пользователь с данным uid в списке remoteUsers
            const isStreamActive = rtc.client.remoteUsers.some(user => user.uid === uid);

            if (!isStreamActive) {
                console.log("Stream is not active for UID:", uid);
                await sendStreamStopToServer(uid);
            } else {
                console.log("Stream is active for UID:", uid);
            }
        } catch (error) {
            console.error("Error checking stream status:", error);
        }
    }, 20000); // 20000 миллисекунд = 20 секунд
}


async function sendStreamInfoToServer(channelName, uid, appId, streamName, streamDescription) {
    const response = await fetch('https://test-site-domens.site:7070/create-stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            channelName,
            uid,
            appId,
            StreamName: streamName,
            StreamDescription: streamDescription,
            Launched: true
        })
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Stream info sent successfully:', data);
}


async function sendStreamStopToServer(uid) {
    const response = await fetch('https://test-site-domens.site:7070/stop-stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uid
        })
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Stream stop sent successfully:', data);
}
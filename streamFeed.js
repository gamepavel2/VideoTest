import AgoraRTC from "agora-rtc-sdk-ng";
import { AudienceLatencyLevelType } from "agora-rtc-sdk-ng";
import { fetchToken } from './agoraLogic.js';
const axios = require('axios')

let rtc = {
    client: null
};


export async function initializeAudiencePage() {
    const loadingSpinner = document.getElementById("loading-spinner");

    // Делаем запрос на сервер для получения appId и channelName
    const response = await axios.get('https://test-site-domens.site:7070/get-stream-user-feed');
    const { appId, channelName } = response.data;

    rtc.client = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
        clientRoleOptions: {
            level: AudienceLatencyLevelType.AUDIENCE_LEVEL_ULTRA_LOW_LATENCY
        }
    });

    // Показываем значок загрузки при подключении к каналу
    loadingSpinner.style.display = "block";

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

            // Скрываем значок загрузки после того, как видео начнет воспроизводиться
            loadingSpinner.style.display = "none";
        }

        if (mediaType === "audio") {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack.play();
        }
    });

    rtc.client.on("user-unpublished", user => {
        const remotePlayerContainer = document.getElementById(user.uid);
        if (remotePlayerContainer) {
            remotePlayerContainer.remove();
        }
    });

    rtc.client.setClientRole("audience");
    
    const uid = Math.floor(Math.random() * 1000000);
    let token = await fetchToken(channelName, uid);
    await rtc.client.join(appId, channelName, token, uid);
}

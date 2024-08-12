import AgoraRTC from "agora-rtc-sdk-ng";
import { AudienceLatencyLevelType } from "agora-rtc-sdk-ng";
import { fetchToken } from './agoraLogic.js';
import axios from 'axios';

let rtc = {
    client: null,
    currentChannelName: null
};

export async function initializeAudiencePage() {
    const loadingSpinner = document.getElementById("loading-spinner");

    // Загружаем данные о стриме
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

    // Обновляем текущий канал
    rtc.currentChannelName = channelName;
    const uid = Math.floor(Math.random() * 1000000);
    const token = await fetchToken(channelName, uid);
    await rtc.client.join(appId, channelName, token, uid);
}

// Функция для перезагрузки стрима
async function reloadStream() {
    const loadingSpinner = document.getElementById("loading-spinner");
    loadingSpinner.style.display = "block";

    // Отключаемся от текущего канала
    if (rtc.client) {
        await rtc.client.leave();
    }

    // Загружаем новый стрим
    await initializeAudiencePage();
}

// Определение обработчика свайпов
function handleSwipe(event) {
    const threshold = 50; // минимальное расстояние свайпа для активации
    let startY;

    if (event.type === 'touchstart') {
        startY = event.touches[0].clientY;
    } else if (event.type === 'touchmove') {
        const endY = event.touches[0].clientY;
        const distance = startY - endY;

        if (distance > threshold) {
            // Свайп вверх
            reloadStream();
        }
    }
}

// Привязываем обработчик свайпов к элементу документа
document.addEventListener('touchstart', handleSwipe);
document.addEventListener('touchmove', handleSwipe);

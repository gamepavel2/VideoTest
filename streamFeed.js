// streamFeed.js
import AgoraRTC from "agora-rtc-sdk-ng";
import { AudienceLatencyLevelType } from "agora-rtc-sdk-ng";
import { fetchToken } from './agoraLogic.js';
const axios = require('axios');

let rtc = {
    client: null
};

let scoreInterval = null;
let streamInfoInterval = null;
async function joinStream(startWebAppliveStreamNew) {


    const tg = window.Telegram.WebApp;
    const userId_tg = tg.initDataUnsafe.user.id;
    const WebAppTelegramData = tg.initDataUnsafe;
    const start_param_code = WebAppTelegramData.start_param;

    // Объявляем переменные на уровне всей функции
    let appId, channelName, viewerCount, LikeCount, Launched, LaunchedInFeed, commentCount, StreamName, StreamDescription;
    if (startWebAppliveStreamNew) {
        try {
            if (start_param_code) {
                // Разделение строки по дефису
                const parts = start_param_code.split('-');

                // Присвоение значений переменным
                const refCode = parts[0]; // Первое значение или весь код, если дефис не найден
                const streamChannelName = parts.length > 1 ? parts[1] : null; // Второе значение, если оно есть

                if (streamChannelName) {
                    // Запрос информации о канале
                    ({ appId, channelName, viewerCount, LikeCount, Launched, LaunchedInFeed, commentCount, StreamName, StreamDescription } = await getStreaminfoChannelName(streamChannelName));
                } else {
                    // Если streamChannelName не найден, получаем данные по пользователю
                    ({ appId, channelName, viewerCount, LikeCount, Launched, LaunchedInFeed, commentCount, StreamName, StreamDescription } = await getStreamUserFeed());
                }
            } else {
                // Если start_param_code отсутствует, получаем данные по пользователю
                ({ appId, channelName, viewerCount, LikeCount, Launched, LaunchedInFeed, commentCount, StreamName, StreamDescription } = await getStreamUserFeed());
            }
        } catch (error) {
            console.error('Error retrieving stream information:', error);
            // В случае ошибки, получаем данные по пользователю
            ({ appId, channelName, viewerCount, LikeCount, Launched, LaunchedInFeed, commentCount, StreamName, StreamDescription } = await getStreamUserFeed());
        }
    } else {
        // Если startWebAppliveStreamNew = false, получаем данные по пользователю
        ({ appId, channelName, viewerCount, LikeCount, Launched, LaunchedInFeed, commentCount, StreamName, StreamDescription } = await getStreamUserFeed());
    }

    if (!Launched) {
        await showStreamEndedMessage()
    }
    await saveChannelNameElement(channelName)

    const userName = "TestUser"
    // Отображаем количество просмотров и лайков
    document.getElementById('viewer-number').textContent = `${viewerCount}`;
    document.getElementById('statistic-like').textContent = `${LikeCount}`;
    document.getElementById('comments-count').textContent = `${commentCount}`;
    document.getElementById('streamer-name').innerText = userName;
    document.getElementById('stream-title').innerText = StreamName;

    rtc.client = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
        clientRoleOptions: {
            level: AudienceLatencyLevelType.AUDIENCE_LEVEL_ULTRA_LOW_LATENCY
        }
    });

    rtc.client.on("user-published", async (user, mediaType) => {
        await rtc.client.subscribe(user, mediaType);
        console.log("subscribe success");

        if (mediaType === "video") {
            const remoteVideoTrack = user.videoTrack;
            const remotePlayerContainer = document.createElement("div");
            remotePlayerContainer.className = 'video-container';
            remotePlayerContainer.id = user.uid.toString();
            document.body.querySelector(".video-container").append(remotePlayerContainer);

            remoteVideoTrack.play(remotePlayerContainer);

            document.getElementById("loading-spinner").style.display = "none";
        }

        if (mediaType === "audio") {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack.play();
        }
        // Запускаем таймер для начисления очков
        startScoreTimer(userId_tg, WebAppTelegramData);
        startInfoStreamTimer(channelName);
    });


    
   // Устанавливаем роль клиента как "аудитория"
    rtc.client.setClientRole("audience");

    // Обработчик для события "user-unpublished"
    rtc.client.on("user-unpublished", async (user) => {
        // Удаляем контейнер игрока, если он существует
        const remotePlayerContainer = document.getElementById(user.uid);
        if (remotePlayerContainer) {
            remotePlayerContainer.remove();
        }
        // Останавливаем таймеры
        stopScoreTimer(userId_tg);
        stopInfoStreamTimer();

        // Проверяем, закончился ли стрим
        await showStreamEndedMessage();
    });

    // Обработчик для события "stream-removed"
    rtc.client.on("stream-removed", async (evt) => {
        const stream = evt.stream;
        const streamId = stream.getId();
        console.log(`Stream removed: ${streamId}`);
        
        // Удаляем контейнер игрока
        const remotePlayerContainer = document.getElementById(streamId);
        if (remotePlayerContainer) {
            remotePlayerContainer.remove();
        }
        
        // Проверяем, закончился ли стрим
        await checkStreamEnded();
    });

    // Обработчик для события "client-leave"
    rtc.client.on("client-leave", async () => {
        console.log("Client left the stream");
        await showStreamEndedMessage();
    });

    // Функция для проверки, закончился ли стрим
    async function checkStreamEnded() {
        if (rtc.client.remoteUsers.length === 0) {
            await showStreamEndedMessage();
        }
    }

    // Функция для показа сообщения о завершении стрима


    // Генерируем случайный uid и присоединяемся к стриму
    const uid = Math.floor(Math.random() * 1000000);
    let token = await fetchToken(appId, channelName, uid);
    await rtc.client.join(appId, channelName, token, uid);
}

async function showStreamEndedMessage() {
    console.log("Stream ended");
    
    // Создаем контейнер для сообщения
    const messageContainer = document.createElement("div");
    messageContainer.className = 'stream-ended-message';
    messageContainer.textContent = "Stream has ended.";
    document.body.appendChild(messageContainer);

    document.getElementById("loading-spinner").style.display = "none";
}


export async function initializeAudiencePage() {
    const loadingSpinner = document.getElementById("loading-spinner");
    loadingSpinner.style.display = "block";
    const startWebAppliveStreamNew = true;
    await joinStream(startWebAppliveStreamNew);

}


export default async function switchStream() {
    // Останавливаем таймер, когда пользователь уходит
    stopInfoStreamTimer();

    // Удаляем сообщение о завершении стрима
    const messageContainer = document.querySelector('.stream-ended-message');
    if (messageContainer) {
        messageContainer.remove();
    }
    // Убираем лайки
    const heartPath = document.getElementById('heart-path');
    heartPath.classList.remove('heart-like-red');
    heartPath.classList.remove('heart-like-animation');
     // Очищаем чат и контент в нем
    const chatBox = document.getElementById('chat-box');
    chatBox.classList.remove('open');
    const chatContent = document.getElementById('chat-content');
    // Удаление всех сообщений из chat-content
    chatContent.innerHTML = '';
    // Отключаем текущий стрим
    if (rtc.client) {
        document.querySelector(".video-container").classList.add('fade-out');
        await rtc.client.leave();
        console.log('Left current stream');
        setTimeout(() => {
            document.querySelector(".video-container").classList.remove('fade-out');
            document.querySelector(".video-container").innerHTML = ''; // Очищаем видео контейнер
        }, 500);
    }

    document.getElementById("loading-spinner").style.display = "block";

    // Запрашиваем новый стрим и присоединяемся к нему
    const startWebAppliveStreamNew = false;
    await joinStream(startWebAppliveStreamNew);
    
    // Добавляем эффект появления
    document.querySelector(".video-container").classList.add('fade-in');
}


// Запускаем таймер для начисления очков
function startScoreTimer(userId_tg, WebAppTelegramData) {
    if (scoreInterval) return; // Если таймер уже работает, не запускаем новый

    scoreInterval = setInterval(async () => {
        const score_update_server = 0.1
        let score = await updateUserScore(userId_tg, score_update_server, WebAppTelegramData);
        // Проверяем, что score является числом
        document.querySelector('#user-score .score').textContent = score.toFixed(2); // Обновляем отображение счёта 
         // Отправляем счёт на сервер
    }, 60000); // 60000 мс = 1 минута
}

// Останавливаем таймер и сбрасываем его
function stopScoreTimer(userId_tg) {
    if (scoreInterval) {
        clearInterval(scoreInterval);
        scoreInterval = null;
    }
}


// Запускаем таймер для обновления данных о стриме
function startInfoStreamTimer(channelName) {
    if (streamInfoInterval) return; // Если таймер уже работает, не запускаем новый

    streamInfoInterval = setInterval(async () => {
        const { appId, channelName2, viewerCount, LikeCount, Launched, LaunchedInFeed, commentCount } = await getStreaminfoChannelName(channelName);
        // Проверяем, что score является числом
        // Отображаем количество просмотров и лайков
        document.getElementById('viewer-number').textContent = `${viewerCount}`;
        document.getElementById('statistic-like').textContent = `${LikeCount}`;
        document.getElementById('comments-count').textContent = `${commentCount}`;
        if (!Launched) {
            await showStreamEndedMessage()
        }
         // Отправляем счёт на сервер
    }, 5000); // 60000 мс = 1 минута
}

// Останавливаем таймер и сбрасываем его
function stopInfoStreamTimer() {
    if (streamInfoInterval) {
        clearInterval(streamInfoInterval);
        streamInfoInterval = null;
    }
}


async function showNoStreamsliveMessage() {
    console.log("Stream is not active right now");
    
    // Создаем контейнер для сообщения
    const messageContainer = document.createElement("div");
    messageContainer.className = 'stream-ended-message';
    messageContainer.textContent = "No active streams";
    document.body.appendChild(messageContainer);

    document.getElementById("loading-spinner").style.display = "none";
}
async function getStreamUserFeed() {
    // Запрашиваем новый стрим и присоединяемся к нему
    try {
        const response = await axios.get('https://test-site-domens.site:7070/get-stream-user-feed');
        const { appId, channelName, viewerCount, LikeCount, Launched, LaunchedInFeed, commentCount, StreamName, StreamDescription } = response.data;
        return response.data    
    }
    catch (error) {
        // Проверяем, если ошибка связана с 404
        if (error.response && error.response.status === 404) {
            await showNoStreamsliveMessage();
        } else {
            console.error('Error fetching stream data:', error);
        }

        // Возвращаем пустые данные или `null`, чтобы показать, что данные не были получены
        return null;
    }
}

async function getStreaminfoChannelName(channelName) {
    // Запрашиваем новый стрим и присоединяемся к нему
    try {
        const response = await axios.get('https://test-site-domens.site:7070/get-stream-info-channelname', {
            params: { channelName }
        });

        const { appId, channelName2, viewerCount, LikeCount, Launched, LaunchedInFeed, commentCount, StreamName, StreamDescription } = response.data;
        return response.data

    } catch (error) {
        console.error('Error fetching stream data:', error.response ? error.response.data : error.message);
    }
}

// Функция для отправки текущего счёта пользователя на сервер
async function updateUserScore(userId_tg, score, WebAppTelegramData) {
    try {
        const response = await axios.post('https://test-site-domens.site:7070/api/gamecenter/users/score', {
            id_user: userId_tg,
            score: score,
            WebAppTelegramData: WebAppTelegramData
        });
        
        if (response.data && response.data.score !== undefined) {
            console.log('Score updated successfully:', response.data.score);
            return response.data.score;
        } else {
            console.error('Unexpected response format:', response);
            return null;
        }
    } catch (error) {
        console.error('Error updating score:', error);
        return null;
    }
}




// Скрипт 1: Запись данных в скрытый элемент
async function saveChannelNameElement(ChannelName) {
    const hiddenElement = document.getElementById('ChannelNameData');
    const ElementUpdateSwitchStream = Math.random().toString().slice(10, 20);
    hiddenElement.value = `${ChannelName}:${ElementUpdateSwitchStream}`;
}

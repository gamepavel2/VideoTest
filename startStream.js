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

let uid;
let channelName;
let appId;

let scoreInterval = null;


export async function initializeStreamPage() {
    const tg = window.Telegram.WebApp;
    let userId_tg;
    try {
        userId_tg = tg.initDataUnsafe.user.id;
    } catch (error) {
        console.error('Failed to send stream info to server:', error);
    }
    const WebAppTelegramData = tg.initDataUnsafe;
    console.log(WebAppTelegramData)
    console.log(userId_tg)
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

        appId = await getAppIdCreateStream(WebAppTelegramData)
        uid = Math.floor(Math.random() * 1000000);
        channelName = Math.floor(Math.random() * 10000000).toString()
        console.log("Joining channel:", channelName, "with UID:", uid);

        rtc.client.setClientRole("host");

        
        let token = await fetchToken(appId, channelName, uid);
        await rtc.client.join(appId, channelName, token, uid);

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
                appId, 
                document.getElementById("stream-name").value, // Предполагается, что есть элемент с id "stream-name" для имени стрима
                document.getElementById("stream-description").value // Предполагается, что есть элемент с id "stream-description" для описания стрима
            );
        } catch (error) {
            console.error('Failed to send stream info to server:', error);
        }
        // Запускаем таймер для начисления очков
        startScoreTimer(userId_tg, WebAppTelegramData);
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
        // Останавливаем таймер, когда пользователь уходит
        stopScoreTimer();
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



// Запускаем таймер для начисления очков
function startScoreTimer(userId_tg, WebAppTelegramData) {
    if (scoreInterval) return; // Если таймер уже работает, не запускаем новый

    scoreInterval = setInterval(async () => {
        const score_update_server = 1; // Количество очков, которые мы добавляем каждую минуту
        let score = await updateUserScore(userId_tg, score_update_server, WebAppTelegramData);
        // Проверяем, что score является числом
        document.querySelector('#user-score .score').textContent = score.toFixed(2); // Обновляем отображение счёта 
         // Отправляем счёт на сервер
    }, 60000); // 60000 мс = 1 минута
}

// Останавливаем таймер и сбрасываем его
function stopScoreTimer() {
    if (scoreInterval) {
        clearInterval(scoreInterval);
        scoreInterval = null;
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


async function getAppIdCreateStream(TelegramWebApp) {
    try {
        // Отправляем GET-запрос с любым параметром
        const response = await axios.get('https://test-site-domens.site:7070/get-app-id-create-stream', {
            params: {
                TelegramWebApp: TelegramWebApp
            }
        });

        // Обрабатываем полученные данные
        const { appId } = response.data;
        return appId;
    } catch (error) {
        console.error('Error fetching random appId:', error);
    }
}

import AgoraRTC from "agora-rtc-sdk-ng";
import { AudienceLatencyLevelType } from "agora-rtc-sdk-ng";
import { fetchToken } from './agoraLogic.js';
const axios = require('axios');

let streamInfoInterval = null;

let rtc = {
    localAudioTrack: null,
    localVideoTrack: null,
    screenTrack: null,
    client: null,
    isScreenSharing: false,
    useBackCamera: false // Флаг для выбора задней камеры
};

let options = {
    appId: "4d6be4271ce442b9912fa568bb508bfd"
};

let uid;
let channelName;
let appId;

let scoreInterval = null;


export async function initializeStreamPage() {
    // Получаем список доступных камер
    let cameras = [];

    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameras = devices.filter(device => device.kind === 'videoinput');
        console.log("Available cameras:", cameras);
    } catch (error) {
        console.error("Error accessing camera:", error);
    }

    cameras.forEach(camera => {
        console.log(`ID камеры: ${camera.deviceId}, Название: ${camera.label}`);
    });

    let frontCamera = cameras.find(camera => {
    const label = camera.label.toLowerCase().replace(/\s+/g, ''); // Удаляем все пробелы
    return label.includes("user") || 
           label.includes("front") ||
           label.includes("facing");
    });

    let backCamera = cameras.find(camera => {
        const label = camera.label.toLowerCase().replace(/\s+/g, '');
        return label.includes("world") || 
            label.includes("back") ||
            label.includes("environment");
    });

    // Если фронтальная камера не найдена, используем первую доступную камеру
    const hasFrontCamera = !!frontCamera || cameras.length > 0;
    const hasBackCamera = !!backCamera;

    // Если фронтальная камера не определена, но есть доступные камеры, используем первую
    if (!frontCamera && cameras.length > 0) {
        frontCamera = cameras[0];
    }
    
    // Проверяем доступность экрана
    // Проверяем доступность захвата экрана
    const hasScreenShare = !!navigator.mediaDevices.getDisplayMedia;
    
    // Получаем ссылку на select элемент
    const streamTypeSelect = document.getElementById("stream-type");
    
    // Удаляем опции, если устройство не доступно
    if (!hasFrontCamera) {
        const webcamOption = streamTypeSelect.querySelector('option[value="webcam"]');
        if (webcamOption) webcamOption.remove();
    }
    
    if (!hasBackCamera) {
        const backCameraOption = streamTypeSelect.querySelector('option[value="back-camera"]');
        if (backCameraOption) backCameraOption.remove();
    }

    if (!hasScreenShare) {
        const screenOption = streamTypeSelect.querySelector('option[value="screen"]');
        if (screenOption) screenOption.remove();
    }

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

    

    document.getElementById("host-join").onclick = async function () {
        const isCropVideoEnabled = document.getElementById("crop-video").checked;    
        const streamType = document.getElementById("stream-type").value;

        if (streamType === "webcam") {
            rtc.isScreenSharing = false;
            rtc.useBackCamera = false;
        } else if (streamType === "screen") {
            rtc.isScreenSharing = true;
            rtc.useBackCamera = false;
        } else if (streamType === "back-camera") {
            rtc.isScreenSharing = false;
            rtc.useBackCamera = true;
        }

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
            // Если выбран захват экрана
            rtc.screenTrack = await AgoraRTC.createScreenVideoTrack({
                encoderConfig: {
                    width: 1280,
                    height: 720,
                    frameRate: 60,
                    bitrateMax: 1500
                },
                withAudio: systemAudioEnabled ? "system" : false // Включаем системный звук, если выбран
            });
    
            if (micAudioEnabled) {
                rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                await rtc.client.publish([rtc.screenTrack, rtc.localAudioTrack]);
            } else {
                await rtc.client.publish([rtc.screenTrack]);
            }
        } else {
            // Получаем идентификатор нужной камеры
            const cameraId = await getCameraId(rtc.useBackCamera);

            const tracks = [];
            if (micAudioEnabled) {
                rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                tracks.push(rtc.localAudioTrack);
            }

            rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
                cameraId: cameraId,
                encoderConfig: {
                    width: 640, // Уменьшение разрешения для снижения эффекта приближения
                    height: 480,
                    frameRate: 30,
                    bitrateMax: 1000
                }
            });
            tracks.push(rtc.localVideoTrack);

            await rtc.client.publish(tracks);
        }

        const localPlayerContainer = document.createElement("div");
        localPlayerContainer.className = 'video-container'; // Применяем CSS-класс
        localPlayerContainer.id = uid;
        // Применение зеркального эффекта, если используется задняя камера
        if (rtc.useBackCamera) {
            localPlayerContainer.style.transform = 'scaleX(-1)';
        }
        document.body.querySelector(".video-container").append(localPlayerContainer);

        if (rtc.isScreenSharing) {
            rtc.screenTrack.play(localPlayerContainer);
        } else {
            rtc.localVideoTrack.play(localPlayerContainer);
        }

        
        console.log("publish success!");
        

        await saveChannelNameElement(channelName)
        startInfoStreamTimer(channelName)

        // Отправка информации о стриме на сервер
        try {
            await sendStreamInfoToServer(
                channelName, 
                uid, 
                appId, 
                userId_tg, 
                WebAppTelegramData,
                document.getElementById("stream-name").value, // Имя стрима
                document.getElementById("stream-description").value, // Описание стрима
                streamType, // Тип стрима
                isCropVideoEnabled // Обрезка видео
            );
        } catch (error) {
            console.error('Failed to send stream info to server:', error);
        }
        // Запускаем таймер для начисления очков
        startScoreTimer(userId_tg, WebAppTelegramData);
    };


    document.getElementById("show-in-feed").onclick = async function () {
        await updateLaunchedInFeed(uid)

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


// Функция для получения идентификатора камеры
async function getCameraId(useBackCamera) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    if (useBackCamera) {
        // Поиск камеры с названием, включающим "back" или использование последней камеры
        const backCamera = videoDevices.find(device => device.label.toLowerCase().includes('back'));
        return backCamera ? backCamera.deviceId : videoDevices[videoDevices.length - 1].deviceId;
    } else {
        // Используем первую камеру в списке (обычно передняя)
        return videoDevices[0].deviceId;
    }
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


async function sendStreamInfoToServer(channelName, uid, appId, id_user, WebAppTelegramData, streamName, streamDescription, streamType, isCropVideoEnabled) {
    const response = await fetch('https://test-site-domens.site:7070/create-stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            channelName,
            uid,
            appId,
            id_user,
            WebAppTelegramData,
            StreamName: streamName,
            StreamDescription: streamDescription,
            StreamType: streamType,
            IsCropVideoEnabled: isCropVideoEnabled,
            Launched: true
        })
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Stream info sent successfully:', data);
}

async function updateLaunchedInFeed(uid) {
    try {
        const response = await axios.get(`https://test-site-domens.site:7070/api/streams/${uid}/launch-in-feed`);
        console.log('Response data:', response.data);
    } catch (error) {
        console.error('Error occurred:', error.response ? error.response.data : error.message);
    }
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

// Скрипт 1: Запись данных в скрытый элемент
async function saveChannelNameElement(ChannelName) {
    const hiddenElement = document.getElementById('ChannelNameData');
    const ElementUpdateSwitchStream = Math.random().toString().slice(10, 20);
    hiddenElement.value = `${ChannelName}:${ElementUpdateSwitchStream}`;
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
async function showStreamEndedMessage() {
    console.log("Stream ended");
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

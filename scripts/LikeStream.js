const tg = window.Telegram.WebApp;
const userId_tg = tg.initDataUnsafe.user.id;
const WebAppTelegramData = tg.initDataUnsafe;
console.log(tg) 
console.log(WebAppTelegramData)


document.querySelector('.svg-container-like').addEventListener('click', async function() {
    const heartPath = document.getElementById('heart-path');

    
    let {channelName, updateSwitch} = getStoredValues();

    console.log("Like");

    // Проверка текущего класса для изменения состояния
    if (heartPath.classList.contains('heart-like-red')) {
        // Если уже красный, сбросить обратно на исходное состояние
        heartPath.classList.remove('heart-like-animation');
    } else {
        // Если не красный, закрасить в красный и добавить анимацию
        heartPath.classList.add('heart-like-red');
        heartPath.classList.add('heart-like-animation');
        
        // Удаление анимации после её завершения, чтобы можно было повторно применить
        heartPath.addEventListener('animationend', () => {
            heartPath.classList.remove('heart-like-animation');
        });

        // Вызов асинхронной функции для добавления лайка
        try {
            const result = await addLikeToStream(channelName, userId_tg, WebAppTelegramData);
            if (result) {
                console.log('Like added successfully:', result);
            }
        } catch (error) {
            console.error('Error adding like:', error);
        }
    }
});


// Чтение данных из скрытого элемента
// Функция для получения значения из скрытого элемента
function getStoredValues() {
    const hiddenElement = document.getElementById('ChannelNameData').value;
    const [channelName, updateSwitch] = hiddenElement.split(':');
    return { channelName, updateSwitch };
}

// Функция для проверки изменений в значении ChannelName
function watchChannelName(callback) {
    let { channelName: lastChannelName, updateSwitch: lastUpdateSwitch } = getStoredValues(); // Сохраняем текущие значения

    setInterval(async () => { // Делаем внутреннюю функцию асинхронной
        const { channelName: currentChannelName, updateSwitch: currentUpdateSwitch } = getStoredValues(); // Получаем текущие значения

        if (currentChannelName !== lastChannelName || currentUpdateSwitch !== lastUpdateSwitch) { // Проверяем изменилось ли какое-либо значение
            console.log("Values changed:", { currentChannelName, currentUpdateSwitch });
            await callback(currentChannelName); // Используем await для асинхронного вызова
            lastChannelName = currentChannelName; // Обновляем последнее известное значение
            lastUpdateSwitch = currentUpdateSwitch;
        }
    }, 500); // Проверка каждые полсекунды
}

// Пример использования
watchChannelName(async (newChannelName) => { // Делаем функцию обратного вызова асинхронной
    const heartPath = document.getElementById('heart-path');
    const liked = await checkIfUserLikedStream(newChannelName, userId_tg);
    if (liked) {
        // Если пользователь уже лайкнул, выполняем действия
        heartPath.classList.add('heart-like-red');
        heartPath.classList.add('heart-like-animation');
    } else {
        // Если пользователь еще не лайкнул, выполняем другие действия
        heartPath.classList.remove('heart-like-red');
        heartPath.classList.remove('heart-like-animation');
    }
});


async function addLikeToStream(channelName, user_id, WebAppTelegramData) {
    try {
        // Отправка POST запроса на сервер
        const response = await axios.post('https://test-site-domens.site:7070/api/stream-add-like', {
            channelName: channelName,
            user_id: user_id,
            WebAppTelegramData: WebAppTelegramData
        });

        // Проверка наличия ожидаемого ответа
        if (response.data && response.data.message) {
            console.log('Response:', response.data.message);
            return response.data.message;
        } else {
            console.error('Unexpected response format:', response);
            return null;
        }
    } catch (error) {
        console.error('Error response data:', error);
        return null;
    }
}

async function checkIfUserLikedStream(channelName, user_id) {
    try {
        // Отправка GET-запроса с параметрами channelName и user_id
        const response = await axios.get('https://test-site-domens.site:7070/api/check-like', {
            params: {
                channelName: channelName,
                user_id: user_id
            }
        });

        // Проверка и вывод результата
        if (response.data && response.data.liked !== undefined) {
            console.log(`User has ${response.data.liked ? 'liked' : 'not liked'} the stream.`);
            return response.data.liked;
        } else {
            console.error('Unexpected response format:', response);
            return null;
        }
    } catch (error) {
        console.error('Error checking if user liked the stream:', error);
        return null;
    }
}


async function fetchRefCode(id_user) {
    try {
        // Отправка POST-запроса к API с id_user
        const response = await axios.post('https://test-site-domens.site:7070/api/get-refcode', {
            id_user: id_user
        });

        // Проверка успешного ответа
        if (response.status === 200) {
            console.log('RefCode:', response.data.refCode);
            return response.data.refCode;
        } else {
            console.warn('Unexpected response:', response);
            return null;
        }
    } catch (error) {
        // Обработка ошибок
        if (error.response) {
            console.error('Error:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
        return null;
    }
}
document.querySelector('.svg-container-share').addEventListener('click', async () => {
    const botUsername = 'test_yotubesdd_bot/test';
    let { channelName, updateSwitch } = getStoredValues();

    try {
        // Используем await внутри асинхронной функции
        const refCode = await fetchRefCode(userId_tg);

        // Обрабатываем, если refCode не найден
        if (!refCode) {
            console.error('RefCode не найден');
            return;
        }

        const startParameter = `${refCode}-${channelName}`;
        const messageText = 'Join the stream and collect your CMA tokens😎';
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${botUsername}?startapp=${startParameter}`)}&text=${encodeURIComponent(messageText)}`;

        // Открываем ссылку в Telegram
        Telegram.WebApp.openTelegramLink(shareUrl);
    } catch (error) {
        console.error('Error fetching refCode:', error);
    }
});

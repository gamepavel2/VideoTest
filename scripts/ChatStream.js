// Обработчик клика на элемент с классом .svg-container-comments, который открывает или закрывает чат
document.querySelector('.svg-container-comments').addEventListener('click', async () => {
    const chatBox = document.getElementById('chat-box');
    chatBox.classList.toggle('open'); // Переключает класс 'open' у элемента с id 'chat-box'

    // Если чат открыт, загружаем комментарии
    if (chatBox.classList.contains('open')) {
        const {channelName, updateSwitch} = getStoredValues(); // Предполагается, что getStoredValues() возвращает объект с channelName
        await loadComments(channelName); // Загружаем комментарии для указанного channelName
    }
});

// Обработчик клика на кнопку закрытия чата с id 'close-chat'
document.getElementById('close-chat').addEventListener('click', () => {
    const chatBox = document.getElementById('chat-box');
    chatBox.classList.remove('open'); // Убирает класс 'open', закрывая чат
});

// Обработчик события 'blur' на поле ввода сообщения, вызывается при потере фокуса
document.getElementById('chat-input').addEventListener('blur', () => {
    window.scrollTo(0, 0); // Прокручивает страницу вверх, чтобы вернуть элементы в поле зрения
});

// Функция для добавления сообщения в чат
let userIsAtBottom = true;
const existingComments = new Set();
const chatContent = document.getElementById('chat-content');

chatContent.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = chatContent;
    userIsAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
});

function addMessageToChat(message, username, commentId) {
    if (existingComments.has(commentId)) {
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');

    const usernameElement = document.createElement('div');
    usernameElement.classList.add('chat-username');
    usernameElement.textContent = username;
    messageElement.appendChild(usernameElement);

    const messageTextElement = document.createElement('div');
    messageTextElement.classList.add('chat-text');
    messageTextElement.textContent = message;
    messageElement.appendChild(messageTextElement);

    chatContent.appendChild(messageElement);

    if (userIsAtBottom) {
        chatContent.scrollTop = chatContent.scrollHeight;
    }

    existingComments.add(commentId);
}

// Обработчик клика на кнопку отправки сообщений с id 'send-message'
document.getElementById('send-message').addEventListener('click', async () => {
    const chatInput = document.getElementById('chat-input'); // Находим поле ввода сообщения
    const message = chatInput.value.trim(); // Получаем и обрезаем значение из поля ввода
    const username = tg.initDataUnsafe.user.first_name || tg.initDataUnsafe.user.username; // Получаем имя пользователя из данных Telegram Web App
    chatContent.scrollTop = chatContent.scrollHeight;
    if (message) {
        addMessageToChat(message, username); // Добавляем сообщение и имя пользователя в чат
        chatInput.value = ''; // Очищаем поле ввода после отправки сообщения
        const { channelName } = getStoredValues();
        // Отправляем комментарий на сервер
        await sendComment(username, message, channelName); // Ожидаем завершения отправки комментария
    }
});

// Обработчик события 'keypress' на поле ввода сообщения для отправки сообщения по нажатию клавиши Enter
document.getElementById('chat-input').addEventListener('keypress', async (event) => {
    chatContent.scrollTop = chatContent.scrollHeight;
    if (event.key === 'Enter') { // Проверяем, была ли нажата клавиша Enter
        event.preventDefault(); // Предотвращаем стандартное поведение Enter (перевод строки)
        await document.getElementById('send-message').click(); // Имитируем клик по кнопке отправки сообщения и ожидаем завершения
    }
});

// Функция для отправки комментария на сервер с помощью axios
async function sendComment(username, message, channelName) {
    try {
        const response = await axios.post('https://test-site-domens.site:7070/api/add-comment', {
            user_id: tg.initDataUnsafe.user.id, // ID пользователя
            name_user: username, // Имя пользователя
            comment: message, // Текст комментария
            channelName: channelName, // channelName
            WebAppTelegramData: tg.initDataUnsafe // Передаем данные WebApp
        });
        console.log('Comment added successfully:', response.data);
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

// Функция для получения комментариев из сервера с помощью axios
async function loadComments(channelName) {
    try {
        const response = await axios.post('https://test-site-domens.site:7070/api/get-comments', { channelName });
        const comments = response.data.comments;

        comments.forEach(comment => {
            addMessageToChat(comment.comment, comment.name_user, comment.commentId);
        });

        const { scrollTop, scrollHeight, clientHeight } = chatContent;
        userIsAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Функция для получения значения из скрытого элемента
function getStoredValues() {
    const hiddenElement = document.getElementById('ChannelNameData').value;
    const [channelName, updateSwitch] = hiddenElement.split(':');
    return { channelName, updateSwitch };
}

// Функция для проверки изменений в значении ChannelName
async function watchChannelName(callback) {
    let { channelName: lastChannelName, updateSwitch: lastUpdateSwitch } = getStoredValues(); // Сохраняем текущие значения

    while (true) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Проверка каждые полсекунды

        const { channelName: currentChannelName, updateSwitch: currentUpdateSwitch } = getStoredValues(); // Получаем текущие значения

        if (currentChannelName !== lastChannelName || currentUpdateSwitch !== lastUpdateSwitch) { // Проверяем изменилось ли какое-либо значение
            console.log("Values changed:", { currentChannelName, currentUpdateSwitch });
            await callback(currentChannelName); // Используем await для асинхронного вызова
            lastChannelName = currentChannelName; // Обновляем последнее известное значение
            lastUpdateSwitch = currentUpdateSwitch;
        }
    }
}

// Пример использования
watchChannelName(async (newChannelName) => {
    existingComments.clear();
    await loadComments(newChannelName);
});

// Функция для обновления чата каждые 2 секунды
function startChatUpdater() {
    // Устанавливаем интервал обновления чата каждые 2 секунды (2000 миллисекунд)
    setInterval(async () => {
        try {
            // Получаем актуальные значения channelName и updateSwitch перед загрузкой комментариев
            const { channelName } = getStoredValues();
            await loadComments(channelName); // Загружаем комментарии для указанного channelName
        } catch (error) {
            console.error('Error updating chat:', error);
        }
    }, 2000);
}

// Запускаем обновление чата при загрузке страницы
startChatUpdater(); // Запускаем обновление чата

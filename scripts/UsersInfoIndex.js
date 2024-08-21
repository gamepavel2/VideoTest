document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем, доступен ли Telegram Web App API
    if (window.Telegram && window.Telegram.WebApp) {

        // Получаем информацию о пользователе
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        const user_id = user ? user.id : null;

        // Если пользователь есть, отображаем его имя
        if (user) {
            document.getElementById('user-name').textContent = `${user.first_name || 'Unknown'}`;
        } else {
            document.getElementById('user-name').textContent = 'Anonim';
        }    

        // Инициализируем счет
        if (user_id) {
            // Вызов функции UserScore и ожидание её завершения
            const userScore = await UserScore(user_id, 0, window.Telegram.WebApp.initDataUnsafe);
            console.log(userScore);

            // Обновляем счет
            const updateScoreDisplay = () => {
                document.querySelector('#user-score .score').textContent = userScore.toFixed(2);
            };
            updateScoreDisplay();
        }

    } else {
        console.error('Telegram Web App API is not available.');
    }
});


// Функция для отправки запроса на обновление или получение счёта пользователя
async function UserScore(userId, score, tg_info) {
    try {
        const response = await axios.post('https://test-site-domens.site:7070/api/gamecenter/users/score', {
            id_user: userId,
            score: score,
            WebAppTelegramData: tg_info
        });
        
        // Обрабатываем успешный ответ
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

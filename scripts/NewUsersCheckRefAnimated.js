// Функция для извлечения параметров запроса из URL
const start_param_code = WebAppTelegramData.start_param;


async function UserCheckNew() {
    try {
        const response = await axios.post('https://test-site-domens.site:7070/api/usersinfo/startwebapp', {
            id_user: tg.initDataUnsafe.user.id, // ID пользователя
            WebAppTelegramData: tg.initDataUnsafe // Передаем данные WebApp
        });
        console.log('Comment added successfully:', response.data.status);
        return response.data.status;
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

// Функция для отправки данных на /api/add-referral
async function addReferral(refCode) {
    try {
        const response = await axios.post('https://test-site-domens.site:7070/api/add-referral', {
            id_user: userId_tg,
            refCode: refCode,
            WebAppTelegramData: WebAppTelegramData
        });
        console.log('Referral added successfully:', response.data.message);
        return response.data.message;
    } catch (error) {
        console.error('Error adding referral:', error);
    }
}

async function CheckRefCode(){
    try {
        if (start_param_code) {
            // Разделение строки по дефису
            const parts = start_param_code.split('-');

            // Присвоение значений переменным
            const refCode = parts[0]; // Первое значение или весь код, если дефис не найден
            const streamChannelName = parts.length > 1 ? parts[1] : null; // Второе значение, если оно есть
            if (refCode) {
                await addReferral(refCode)
                console.log("Реферальный код:", start_param);
            
                // Обработка реферального кода 
            }
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
    await UserCheckNew()
}


CheckRefCode()




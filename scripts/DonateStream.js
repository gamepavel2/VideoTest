document.addEventListener('DOMContentLoaded', () => {
    const donateButton = document.querySelector('.svg-container-donate');
    const modal = document.getElementById('donate-modal');
    const closeButton = document.querySelector('.close-button');

    // Открытие модального окна при нажатии на SVG
    donateButton.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Закрытие модального окна при нажатии на кнопку закрытия
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Закрытие модального окна при клике вне его области
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Обработка нажатий на кнопки (для будущих действий)
    document.getElementById('btn-ton').addEventListener('click', () => {
        // Обработка нажатия кнопки "TON"
        console.log('TON button clicked');
    });

    document.getElementById('btn-telegram-stars').addEventListener('click', () => {
        // Обработка нажатия кнопки "Звезды Telegram"
        console.log('Telegram Stars button clicked');
    });

    document.getElementById('btn-cma-token').addEventListener('click', () => {
        // Обработка нажатия кнопки "Токен CMA"
        console.log('CMA Token button clicked');
    });
});

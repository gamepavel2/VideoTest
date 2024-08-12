import { reloadStream } from './streamFeed.js';
// Определение обработчика свайпов
function handleSwipe(event) {
    const threshold = 50; // Минимальное расстояние свайпа
    let startY;

    if (event.type === 'touchstart') {
        startY = event.touches[0].clientY;
    } else if (event.type === 'touchmove') {
        const endY = event.touches[0].clientY;
        const distance = startY - endY;

        console.log('Swipe detected. Distance:', distance); // Отладочный вывод

        if (distance > threshold) {
            console.log('Swipe up detected. Reloading stream.'); // Отладочный вывод
            reloadStream();
        }
    }
}

// Привязываем обработчик свайпов к элементу документа
document.addEventListener('touchstart', handleSwipe);
document.addEventListener('touchmove', handleSwipe);

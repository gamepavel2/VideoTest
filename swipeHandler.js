import switchStream from './streamFeed.js';
import Hammer from 'hammerjs';



document.addEventListener('DOMContentLoaded', () => {
    let startY = 0;
    let currentY = 0;
    let startTime = 0;
    const threshold = window.innerHeight * 0.5;
    const transitionOverlay = document.getElementById('transition-overlay');
    const chatBox = document.getElementById('chat-box');
    
    if (!transitionOverlay) {
        console.error('Transition overlay element not found');
        return;
    }

    const mc = new Hammer(document.body);
    mc.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });

    mc.on('panstart', function(event) {
        // Отключаем свайпы, если чат открыт
        if (chatBox.classList.contains('open')) return;

        startY = event.center.y;
        startTime = event.timeStamp;
        transitionOverlay.classList.add('show');
        transitionOverlay.style.transform = `translateY(100%)`;
        transitionOverlay.style.opacity = `1`;
    });

    mc.on('panmove', function(event) {
        if (chatBox.classList.contains('open')) return;

        currentY = event.center.y;
        const deltaY = currentY - startY;
        const translateYValue = 100 + (deltaY / window.innerHeight) * 100;

        if (deltaY < 0) {
            transitionOverlay.style.transform = `translateY(${translateYValue}%)`;
        }
    });

    mc.on('panend', function(event) {
        if (chatBox.classList.contains('open')) return;

        const deltaY = currentY - startY;
        const finalPosition = 100 + (deltaY / window.innerHeight) * 100;
        const endTime = event.timeStamp;
        const timeDiff = endTime - startTime;
        const swipeSpeed = Math.abs(deltaY / timeDiff);

        const fastSwipeThreshold = 0.3;
        let animationDuration = 300;

        if (swipeSpeed > fastSwipeThreshold || finalPosition <= 50) {
            animationDuration = swipeSpeed > fastSwipeThreshold ? 200 : 300;

            transitionOverlay.style.transition = `transform ${animationDuration}ms ease-out`;
            transitionOverlay.style.transform = `translateY(0)`;

            setTimeout(() => {
                switchStream();

                transitionOverlay.style.transition = 'none';
                transitionOverlay.style.opacity = `0`;
                transitionOverlay.style.transform = `translateY(100%)`;

                setTimeout(() => {
                    transitionOverlay.classList.remove('show');
                }, animationDuration);
            }, animationDuration);
        } else {
            transitionOverlay.style.transition = `transform ${animationDuration}ms ease-out`;
            transitionOverlay.style.transform = `translateY(100%)`;

            setTimeout(() => {
                transitionOverlay.style.opacity = `0`;
                transitionOverlay.classList.remove('show');
            }, animationDuration);
        }
    });
});

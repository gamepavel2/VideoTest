document.addEventListener("DOMContentLoaded", function () {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const videoElements = document.querySelectorAll('.video-container video');
                videoElements.forEach((video) => {
                    video.addEventListener('loadedmetadata', function () {
                        adjustVideoObjectFit(video);
                    });

                    // Если метаданные уже загружены
                    if (video.readyState >= 1) {
                        adjustVideoObjectFit(video);
                    }

                    // Добавляем отслеживание изменения размеров контейнера или видео
                    let resizeObserver = new ResizeObserver(() => {
                        adjustVideoObjectFit(video);
                    });

                    resizeObserver.observe(video);
                });
            }
        });
    });

    observer.observe(document.querySelector('.video-container'), { childList: true });

    function adjustVideoObjectFit(video) {
        const videoRatio = video.videoWidth / video.videoHeight;

        console.log(`Video Ratio: ${videoRatio}`);

        if (videoRatio > 1) {
            // Видео горизонтальное
            console.log('Applying object-fit: contain');
            video.style.objectFit = 'contain';
        } else {
            // Видео вертикальное или квадратное
            console.log('Applying object-fit: cover');
            video.style.objectFit = 'cover';
        }
    }
});

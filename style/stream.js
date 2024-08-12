document.addEventListener("DOMContentLoaded", function () {
    const hostJoinButton = document.getElementById('host-join');
    const leaveButton = document.getElementById('leave');
    const videoContainer = document.querySelector('.video-container');
    const streamOptions = document.getElementById('stream-options');
    const audioOptions = document.getElementById('audio-options');
    const streamInfo = document.getElementById('stream-info');

    hostJoinButton.addEventListener('click', function() {
        // Показать контейнер с видео и скрыть другие элементы
        videoContainer.classList.remove('hidden');
        streamOptions.classList.add('hidden');
        audioOptions.classList.add('hidden');
        hostJoinButton.classList.add('hidden');
        leaveButton.classList.remove('hidden');
        streamInfo.classList.add('hidden');
    });

    leaveButton.addEventListener('click', function() {
        // Показать остальные элементы и скрыть контейнер с видео
        videoContainer.classList.add('hidden');
        streamOptions.classList.remove('hidden');
        audioOptions.classList.remove('hidden');
        hostJoinButton.classList.remove('hidden');
        leaveButton.classList.add('hidden');
        streamInfo.classList.remove('hidden');
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const hostJoinButton = document.getElementById('host-join');
    const videoContainer = document.querySelector('.video-container');

    hostJoinButton.addEventListener('click', function() {
        videoContainer.classList.remove('hidden');
    });
});
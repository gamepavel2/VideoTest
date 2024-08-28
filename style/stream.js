document.addEventListener("DOMContentLoaded", function () {


    const hostJoinButton = document.getElementById('host-join');
    const leaveButton = document.getElementById('leave');
    const ShowInFeedButton = document.getElementById('show-in-feed');
    const videoContainer = document.querySelector('.video-container');
    const streamOptions = document.getElementById('stream-options');
    const audioOptions = document.getElementById('audio-options');
    const streamInfo = document.getElementById('stream-info');
    const streamContainer = document.querySelector('.stats-container');
    const UserInfo = document.getElementById('user-info');

    hostJoinButton.addEventListener('click', function() {
        // Показать контейнер с видео и скрыть другие элементы
        videoContainer.classList.remove('hidden');
        streamOptions.classList.add('hidden');
        audioOptions.classList.add('hidden');
        hostJoinButton.classList.add('hidden');
        ShowInFeedButton.classList.remove('hidden');
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
        ShowInFeedButton.classList.add('hidden');
        streamInfo.classList.remove('hidden');
        streamContainer.classList.add('hidden');
        UserInfo.classList.add('hidden');
    });

    ShowInFeedButton.addEventListener('click', function() {
        // Показать остальные элементы и скрыть контейнер с видео
        ShowInFeedButton.classList.add('hidden');
        streamContainer.classList.remove('hidden');
        UserInfo.classList.remove('hidden');
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const hostJoinButton = document.getElementById('host-join');
    const videoContainer = document.querySelector('.video-container');

    hostJoinButton.addEventListener('click', function() {
        videoContainer.classList.remove('hidden');
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const streamTypeSelect = document.getElementById("stream-type");
    const systemAudioLabel = document.getElementById("system-audio-label");
    const cropVideoLabel = document.getElementById("crop-video-label");

    // Устанавливаем галочку для микрофона по умолчанию
    document.getElementById("mic-audio").checked = true;

    // Обработчик изменения типа стрима
    streamTypeSelect.addEventListener("change", function() {
        const selectedType = streamTypeSelect.value;

        if (selectedType === "webcam") {
            systemAudioLabel.classList.add("hidden");
            cropVideoLabel.classList.add("hidden");
        } else {
            systemAudioLabel.classList.remove("hidden");
            cropVideoLabel.classList.remove("hidden");
        }
    });

    // Вызовем обработчик сразу при загрузке, чтобы проверить текущий выбор
    streamTypeSelect.dispatchEvent(new Event("change"));
});








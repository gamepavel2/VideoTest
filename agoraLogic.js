//agoraLogic

import AgoraRTC from "agora-rtc-sdk-ng";
import { AudienceLatencyLevelType } from "agora-rtc-sdk-ng";
import { initializeStreamPage } from './startStream.js';
import { initializeAudiencePage } from './streamFeed.js';
import './swipeHandler.js';

const axios = require('axios');



export async function fetchToken(appId, channelName, uid) {
    return new Promise(function (resolve, reject) {
        axios.post("https://test-site-domens.site:8080/generate-token", {
            appId: appId,
            channelName: channelName,
            uid: uid
        }, {
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            }
        })
        .then(function (response) {
            const token = response.data.token;
            resolve(token);
        })
        .catch(function (error) {
            console.log(error);
            reject(error);
        });
    });
}

// Initialize page based on URL
window.onload = function () {
    if (window.location.pathname.endsWith('stream.html')) {
        initializeStreamPage();
    } else {
        initializeAudiencePage();
    }
};

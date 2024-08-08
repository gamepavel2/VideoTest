const express = require('express');
const cors = require('cors');
const RtcTokenBuilder = require("../src/RtcTokenBuilder2").RtcTokenBuilder;
const RtcRole = require("../src/RtcTokenBuilder2").Role;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Используйте cors middleware
app.use(cors());

function generateAgoraToken(channelName) {
    const appId = "4d6be4271ce442b9912fa568bb508bfd";
    const appCertificate = "0cfee6aef52941ebb323bc87d6f6c48f";
    const uid = Math.floor(Math.random() * 1000000);
    const role = RtcRole.PUBLISHER;
    const tokenExpirationInSecond = 3600;
    const privilegeExpirationInSecond = 3600;

    if (!appId || !appCertificate) {
        throw new Error("AGORA_APP_ID and AGORA_APP_CERTIFICATE environment variables are required.");
    }

    const tokenWithUid = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, tokenExpirationInSecond, privilegeExpirationInSecond);
    return tokenWithUid;
}

app.get('/generate-token', (req, res) => {
    const channelName = req.query.channelName;
    if (!channelName) {
        return res.status(400).send('channelName query parameter is required');
    }

    try {
        const token = generateAgoraToken(channelName);
        res.json({ token });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

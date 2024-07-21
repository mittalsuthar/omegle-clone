const express = require("express");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(cors({ origin: "http://localhost:3001" }));

// Replace these values with your Agora App ID and App Certificate
const APP_ID = "c82e859dbdc64a4ea75cab5c51df3985";
const APP_CERTIFICATE = "3b85d0dc93f84462a6885069443e9e29";

app.get("/token", (req, res) => {
  const channelName = req.query.channel;
  if (!channelName) {
    return res.status(400).json({ error: "Channel name is required" });
  }

  const uid = 0; // The UID for the user, set to 0 to let Agora assign one
  const role = RtcRole.PUBLISHER; // Role of the user (PUBLISHER or SUBSCRIBER)
  const expirationTimeInSeconds = 3600; // Token expiration time in seconds
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Build the token
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );

  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

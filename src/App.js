import React, { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import "./App.css";

const App = () => {
  const [channelJoined, setChannelJoined] = useState(false);
  const remoteVideoRef = useRef(null);
  const currentUserVideoRef = useRef(null);

  const client = useRef(
    AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
  ).current;
  const localTracks = useRef({
    videoTrack: null,
    audioTrack: null,
  }).current;

  const appId = "c82e859dbdc64a4ea75cab5c51df3985";

  const joinChannel = async () => {
    try {
      const channelName = "Omegle";
      const response = await fetch(
        `https://YOUR_VERCEL_PROJECT_NAME.vercel.app/api?channel=${channelName}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch token");
      }
      const data = await response.json();
      const token = data.token;

      console.log("Joining channel with token:", token);

      await client.join(appId, channelName, token, null);

      localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
      localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

      localTracks.videoTrack.play(currentUserVideoRef.current);
      await client.publish(Object.values(localTracks));
      console.log("Tracks published");

      setChannelJoined(true);

      client.on("user-published", async (user, mediaType) => {
        console.log("User published:", user);
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          console.log("Remote video track received");
          const remoteVideoTrack = user.videoTrack;
          if (remoteVideoTrack) {
            remoteVideoTrack.play(remoteVideoRef.current, { fit: "contain" });
          } else {
            console.log("Remote video track is null");
          }
        }
        if (mediaType === "audio") {
          console.log("Remote audio track received");
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack.play();
        }
      });

      client.on("user-unpublished", (user) => {
        console.log("User unpublished:", user);
        if (user.videoTrack) {
          user.videoTrack.stop();
        }
      });
    } catch (error) {
      console.error("Error joining channel:", error);
    }
  };

  const leaveChannel = async () => {
    try {
      if (!channelJoined) {
        console.log("Not in channel");
        return;
      }

      for (let trackName in localTracks) {
        const track = localTracks[trackName];
        if (track) {
          track.stop();
          track.close();
          localTracks[trackName] = null;
        }
      }
      await client.leave();
      console.log("Left the channel");
      setChannelJoined(false);
    } catch (error) {
      console.error("Error leaving channel:", error);
    }
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("Permissions granted");
      })
      .catch((error) => {
        console.error("Permissions not granted", error);
      });
  }, []);

  return (
    <div className="App">
      <header className="app-header">
        <h1>Video Chat App</h1>
      </header>
      <div className="video-container">
        <div className="video-wrapper">
          <h2>Your Video</h2>
          <video ref={currentUserVideoRef} autoPlay playsInline muted />
        </div>
        <div className="video-wrapper">
          <h2>Remote Video</h2>
          <video ref={remoteVideoRef} autoPlay playsInline />
        </div>
      </div>
      <div className="controls">
        {!channelJoined ? (
          <button onClick={joinChannel} className="call-button join-button">
            Join Channel
          </button>
        ) : (
          <button onClick={leaveChannel} className="call-button leave-button">
            Leave Channel
          </button>
        )}
      </div>
    </div>
  );
};

export default App;

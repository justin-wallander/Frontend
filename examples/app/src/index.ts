import {
  Config,
  PixelStreaming,
  SPSApplication,
  TextParameters,
  PixelStreamingApplicationStyle,
} from "@tensorworks/libspsfrontend";

// Apply default styling from Epic Games Pixel Streaming Frontend
export const PixelStreamingApplicationStyles =
  new PixelStreamingApplicationStyle();
PixelStreamingApplicationStyles.applyStyleSheet();

// websocket url env
declare var WEBSOCKET_URL: string;

function openLegalNotice(url: string) {
  const newTab = window.open(url, "_blank");
  newTab?.focus();
}

function toggleFullscreenMode(messageType: string) {
  const element = document.documentElement;
  switch (messageType) {
    case "fullscreen":
      if (
        !document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement
      ) {
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen();
        }
      }
      break;
    case "minscreen":
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      ) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
      break;
    default:
      console.error(`Unknown message type: ${messageType}`);
  }
}

// stream.addResponseEventListener("UEMessage", (message: string) => {
//   console.log(message);
//   toggleFullscreenMode(message);
// });

document.body.onload = function () {
  // Create a config object.
  // Note: This config is extremely important, SPS only supports the browser sending the offer.
  const config = new Config({
    useUrlParams: true,
    initialSettings: {
      OfferToReceive: true,
      TimeoutIfIdle: true,
      AutoConnect: true,
      AutoPlayVideo: true,
      StartVideoMuted: true,
      HoveringMouse: true,
    },
  });

  // const minimizeIcon = document.getElementById("minimizeIcon");
  // minimizeIcon.
  // minimizeIcon.setAttribute(
  //   "data",
  //   "https://storage.googleapis.com/aireal-apps/zom/images/FSMin-f1785a59158fbb571cf9.png"
  // );

  // const maximizeIcon = document.getElementById("maximizeIcon");
  // maximizeIcon.setAttribute(
  //   "data",
  //   "https://storage.googleapis.com/aireal-apps/zom/images/FSMax-2240b47d3bb1d051e4f6.png"
  // );

  const videoOverlay = document.createElement("div");
  videoOverlay.className = "video-overlay";

  const video = document.createElement("video");
  video.src =
    "https://storage.googleapis.com/aireal-apps/zom/images/Hazel_Galleria_Loading.mp4";
  //   video.controls = true;
  video.id = "loading-video";
  video.autoplay = true;
  video.muted = true;
  video.loop = true;

  // Append the video element to the video overlay container
  videoOverlay.appendChild(video);

  // Append the video overlay container to the body
  document.body.appendChild(videoOverlay);

  // make usage of WEBSOCKET_URL if it is not empty
  let webSocketAddress = WEBSOCKET_URL;
  if (webSocketAddress != "") {
    config.setTextSetting(TextParameters.SignallingServerUrl, webSocketAddress);
  }

  // Create stream and spsApplication instances that implement the Epic Games Pixel Streaming Frontend PixelStreaming and Application types
  const stream = new PixelStreaming(config);

  stream.addResponseEventListener("UEMessage", (message: string) => {
    console.log(typeof message);
    if (message.length < 11) {
      toggleFullscreenMode(message);
    } else {
      try {
        let data = JSON.parse(message);
        console.log(data);
        if (data.hasOwnProperty("url")) {
          openLegalNotice(data.url);
        }
      } catch (error) {
        console.error(`Error parsing message: ${error}`);
      }
    }
  });

  stream.addEventListener("videoInitialized", () => {
    video.pause();

    setTimeout(() => {
      document.body.removeChild(videoOverlay);
    }, 4000);
  });

  const spsApplication = new SPSApplication({
    stream,
    onColorModeChanged: (isLightMode: boolean) =>
      PixelStreamingApplicationStyles.setColorMode(
        isLightMode
      ) /* Light/Dark mode support. */,
  });

  document.body.appendChild(spsApplication.rootElement);
};

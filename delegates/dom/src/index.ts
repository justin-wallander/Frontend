import "bootstrap/dist/js/bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/css/bootstrap-grid.min.css";
import "bootstrap/dist/css/bootstrap-reboot.min.css";
import "bootstrap/dist/css/bootstrap-utilities.min.css";
import { NativeDOMDelegate } from "./NativeDOMDelegate";
import * as libspsfrontend from "@tensorworks/libspsfrontend";
import * as pixStream from "./assets/app.js";

// set the logger level
//libspsfrontend.Logger.SetLoggerVerbosity(10);

function myHandleResponseFunction(data: any) {
  console.warn("Response received!");
  switch (data) {
    case "Test":
      console.log("Test event received");
    // case "AnotherEvent":
    //     ... // handle another event
  }
}

pixStream.addResponseEventListener(
  "handle_responses",
  myHandleResponseFunction
);

// Determine whether a signalling server WebSocket URL was specified at compile-time or if we need to compute it at runtime
declare var WEBSOCKET_URL: string;
let signallingServerAddress = WEBSOCKET_URL;
if (signallingServerAddress == "") {
  // define our signallingServerProtocol to be used based on whether
  // or not we're accessing our frontend via a tls
  let signallingServerProtocol = "ws:";
  if (location.protocol === "https:") {
    signallingServerProtocol = "wss:";
  }

  // build the websocket endpoint based on the protocol used to load the frontend
  signallingServerAddress =
    signallingServerProtocol + "//" + window.location.hostname;

  // if the frontend for an application is served from a base-level domain
  // it has a trailing slash, so we need to account for this when appending the 'ws' for the websocket ingress
  if (window.location.pathname == "/") {
    signallingServerAddress += "/ws";
  } else {
    signallingServerAddress += window.location.pathname + "/ws";
  }
}

// prep the player div element
let playerElement = document.getElementById("player") as HTMLDivElement;

// Create a config object
let config = CreateConfig(signallingServerAddress, playerElement);
config.enableSpsAutoConnect = true;
config.enableSpsAutoplay = true;
config.startVideoMuted = true;

// Create a Native DOM delegate instance that implements the Delegate interface class
let delegate = new NativeDOMDelegate(config);

// Create and return a new webRtcPlayerController instance
let RTCPlayer = create(config, delegate);

// create takes in a delage interface type which our NativeDomDelegate class implements
function create(
  config: libspsfrontend.Config,
  delegate: libspsfrontend.IDelegate
) {
  return new libspsfrontend.webRtcPlayerController(config, delegate);
}

document.ontouchmove = (event: TouchEvent) => {
  event.preventDefault();
};

// Using fetch
// async function downloadImage(imageSrc: string) {
//   const image = await fetch(imageSrc)
//   const imageBlog = await image.blob()
//   const imageURL = URL.createObjectURL(imageBlog)

//   const link = document.createElement('a')
//   link.href = imageURL
//   link.download = imageSrc
//   document.body.appendChild(link)
//   link.click()
//   document.body.removeChild(link)
// }

// function myHandleResponseFunction(data: any) {
//     console.warn("Response received!");
//     data = JSON.parse(data);
//     data = new URL(data.imgSrc)
//     downloadImage(data);
// } npm run build -- --env "WEBSOCKET_URL=wss://sps.tenant-aireal-labs.ord1.ingress.coreweave.cloud/test1/ws"
// RTCPlayer.dataChannelController.onResponse = myHandleResponseFunction;

// Create a config object instance
function CreateConfig(signalingAddress: string, playerElement: HTMLDivElement) {
  let config = new libspsfrontend.Config(signalingAddress, playerElement);
  config.enableSpsAutoConnect = true;
  config.controlScheme = libspsfrontend.ControlSchemeType.HoveringMouse;
  config.enableSpsAutoplay = true;
  config.startVideoMuted = true;
  return config;
}

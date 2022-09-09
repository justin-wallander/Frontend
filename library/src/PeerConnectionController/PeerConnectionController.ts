import { Logger } from "../Logger/Logger";
import { AggregatedStats } from "./AggregatedStats";

/**
 * Handles the Peer Connection 
 */
export class PeerConnectionController {
    peerConnection: RTCPeerConnection;
    aggregatedStats: AggregatedStats;
    forceTurn: boolean;

    /**
     * Create a new RTC Peer Connection client
     * @param options - Peer connection Options
     */
    constructor(options: RTCConfiguration, turnState: boolean) {

        // Set the turn state to true or false for rtc options
        this.forceTurn = turnState;

        if (this.forceTurn === true) {
            options.iceTransportPolicy = "relay";
            Logger.Log(Logger.GetStackTrace(), "Forcing TURN usage by setting ICE Transport Policy in peer connection config.");
        }

        // build a new peer connection with the options
        this.peerConnection = new RTCPeerConnection(options);
        this.peerConnection.onsignalingstatechange = (ev: Event) => this.handleSignalStateChange(ev);
        this.peerConnection.oniceconnectionstatechange = (ev: Event) => this.handleIceConnectionStateChange(ev);
        this.peerConnection.onicegatheringstatechange = (ev: Event) => this.handleIceGatheringStateChange(ev);
        this.peerConnection.ontrack = (ev: RTCTrackEvent) => this.handleOnTrack(ev);
        this.peerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => this.handelIceCandidate(ev);
        this.aggregatedStats = new AggregatedStats();
    }

    /**
     * Create an offer for the Web RTC handshake and send the offer to the signaling server via websocket
     * @param offerOptions - RTC Offer Options
     */
    createOffer(offerOptions: RTCOfferOptions, useMic: boolean) {
        Logger.Log(Logger.GetStackTrace(), "Create Offer", 6);

        this.setupTracksToSendAsync(useMic).finally(() => { });

        this.peerConnection.createOffer(offerOptions).then((offer: RTCSessionDescriptionInit) => {
            this.showTextOverlayConnecting();
            offer.sdp = this.mungeOffer(offer.sdp, useMic);
            this.peerConnection.setLocalDescription(offer);
            this.onSendWebRTCOffer(offer);
        }).catch((onRejectedReason: string) => {
            this.showTextOverlaySetupFailure();
        });
    }

    /**
     * Generate Aggregated Stats and then fire a onVideo Stats event
     */
    generateStats() {
        this.peerConnection.getStats(null).then((StatsData: RTCStatsReport) => {
            this.aggregatedStats.processStats(StatsData);
            this.onVideoStats(this.aggregatedStats);
        });
    }

    /**
     * Close The Peer Connection
     */
    close() {
        if (this.peerConnection) {
            this.peerConnection.close()
            this.peerConnection = null;
        }
    }

    /**
     * Modify the Session Descriptor 
     * @param sdp - Session Descriptor as a string
     * @param useMic - Is the microphone in use
     * @returns A modified Session Descriptor
     */
    mungeOffer(sdp: string, useMic: boolean) {
        let temp = sdp;
        temp.replace(/(a=fmtp:\d+ .*level-asymmetry-allowed=.*)\r\n/gm, "$1;x-google-start-bitrate=10000;x-google-max-bitrate=100000\r\n");
        temp.replace('useinbandfec=1', 'useinbandfec=1;stereo=1;sprop-maxcapturerate=48000');

        // Increase the capture rate of audio so we can have higher quality audio over mic
        if (useMic) {
            temp = temp.replace('useinbandfec=1', 'useinbandfec=1;sprop-maxcapturerate=48000;maxaveragebitrate=510000');
        }

        return temp;
    }

    /**
     * Set the Remote Descriptor from the signaling server to the RTC Peer Connection 
     * @param sdpAnswer - RTC Session Descriptor from the Signaling Server
     */
    handleAnswer(sdpAnswer: RTCSessionDescriptionInit) {
        this.peerConnection.setRemoteDescription(sdpAnswer);
    }

    /**
     * When a Ice Candidate is received add to the RTC Peer Connection 
     * @param iceCandidate - RTC Ice Candidate from the Signaling Server
     */
    handleOnIce(iceCandidate: RTCIceCandidate) {
        Logger.Log(Logger.GetStackTrace(), "peerconnection handleOnIce", 6);

        // // if forcing TURN, reject any candidates not relay
        if (this.forceTurn) {
            // check if no relay address is found, if so, we are assuming it means no TURN server
            if (iceCandidate.candidate.indexOf("relay") < 0) {
                Logger.Info(Logger.GetStackTrace(), `Dropping candidate because it was not TURN relay. | Type= ${iceCandidate.type} | Protocol= ${iceCandidate.protocol} | Address=${iceCandidate.address} | Port=${iceCandidate.port} |`, 6);
                return;
            }
        }

        this.peerConnection.addIceCandidate(iceCandidate);
    }

    /**
     * When the RTC Peer Connection Signaling server state Changes
     * @param state - Signaling Server State Change Event
     */
    handleSignalStateChange(state: Event) {
        Logger.Log(Logger.GetStackTrace(), 'signaling state change: ' + state, 6);
    }

    /**
     * Handle when the Ice Connection State Changes
     * @param state - Ice Connection State
     */
    handleIceConnectionStateChange(state: Event) {
        Logger.Log(Logger.GetStackTrace(), 'ice connection state change: ' + state, 6);
    }

    /**
     * Handle when the Ice Gathering State Changes
     * @param state - Ice Gathering State Change
     */
    handleIceGatheringStateChange(state: Event) {
        Logger.Log(Logger.GetStackTrace(), 'ice gathering state change: ' + JSON.stringify(state), 6);
    }

    /**
     * Activates the onTrack method
     * @param event - The webRtc track event 
     */
    handleOnTrack(event: RTCTrackEvent) {
        this.onTrack(event);
    }

    /**
     * Activates the onPeerIceCandidate 
     * @param event - The peer ice candidate
     */
    handelIceCandidate(event: RTCPeerConnectionIceEvent) {
        this.onPeerIceCandidate(event);
    }

    /**
     * An override method for onTrack for use outside of the PeerConnectionController
     * @param trackEvent - The webRtc track event
     */
    onTrack(trackEvent: RTCTrackEvent) { }

    /**
     * An override method for onPeerIceCandidate for use outside of the PeerConnectionController
     * @param peerConnectionIceEvent - The peer ice candidate
     */
    onPeerIceCandidate(peerConnectionIceEvent: RTCPeerConnectionIceEvent) { }


    /**
     * Setup tracks on the RTC Peer Connection 
     */
    async setupTracksToSendAsync(useMic: boolean) {

        let hasTransceivers = this.peerConnection.getTransceivers().length > 0;

        // Setup a transceiver for getting UE video
        this.peerConnection.addTransceiver("video", { direction: "recvonly" });

        // Setup a transceiver for sending mic audio to UE and receiving audio from UE
        if (!useMic) {
            this.peerConnection.addTransceiver("audio", { direction: "recvonly" });
        }
        else {

            // set the audio options based on mic usage
            let audioOptions = useMic ?
                {
                    autoGainControl: false,
                    channelCount: 1,
                    echoCancellation: false,
                    latency: 0,
                    noiseSuppression: false,
                    sampleRate: 48000,
                    sampleSize: 16,
                    volume: 1.0
                } : false;

            // set the media send options 
            let mediaSendOptions: MediaStreamConstraints = {
                video: false,
                audio: audioOptions,
            }

            // Note using mic on android chrome requires SSL or chrome://flags/ "unsafely-treat-insecure-origin-as-secure"
            const stream = await navigator.mediaDevices.getUserMedia(mediaSendOptions);
            if (stream) {
                if (hasTransceivers) {
                    for (let transceiver of this.peerConnection.getTransceivers()) {
                        if (transceiver && transceiver.receiver && transceiver.receiver.track && transceiver.receiver.track.kind === "audio") {
                            for (const track of stream.getTracks()) {
                                if (track.kind && track.kind == "audio") {
                                    transceiver.sender.replaceTrack(track);
                                    transceiver.direction = "sendrecv";
                                }
                            }
                        }
                    }
                }
                else {
                    for (const track of stream.getTracks()) {
                        if (track.kind && track.kind == "audio") {
                            this.peerConnection.addTransceiver(track, { direction: "sendrecv" });
                        }
                    }
                }
            }
            else {
                this.peerConnection.addTransceiver("audio", { direction: "recvonly" });
            }
        }
    }

    /**
     * And override event for when the video stats are fired
     * @param event - Aggregated Stats
     */
    onVideoStats(event: AggregatedStats) { }

    /**
     * Event to send the RTC offer to the Signaling server
     * @param offer - RTC Offer
     */
    onSendWebRTCOffer(offer: RTCSessionDescriptionInit) { }

    /**
     * An override for showing the Peer connection connecting Overlay
     */
    showTextOverlayConnecting() { }

    /**
     * An override for showing the Peer connection Failed overlay
     */
    showTextOverlaySetupFailure() { }
}
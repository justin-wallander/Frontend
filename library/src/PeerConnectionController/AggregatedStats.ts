import { inboundAudioStats } from "./InboundAudioStats";
import { inboundVideoStats } from "./InboundVideoStats";
import { dataChannelStats } from "./DataChannelStats";
import { CandidateStat } from "./CandidateStat";
import { CandidatePairStats } from "./CandidatePairStats";
import { OutBoundVideoStats } from "./OutBoundVideoStats";
import { StreamStats } from "./StreamStats";
import { Logger } from "../Logger/Logger";

/**
 * The Aggregated Stats that is generated from the RTC Stats Report
 */

type RTCStatsTypeSPS = RTCStatsType | "stream"
export class AggregatedStats {
    inboundVideoStats: inboundVideoStats;
    inboundAudioStats: inboundAudioStats;
    lastVideoStats: inboundVideoStats;
    candidatePair: CandidatePairStats
    dataChannelStats: dataChannelStats;
    localCandidates: Array<CandidateStat>;
    remoteCandidates: Array<CandidateStat>;
    outBoundVideoStats: OutBoundVideoStats;
    streamStats: StreamStats

    constructor() {
        this.inboundVideoStats = new inboundVideoStats();
        this.inboundAudioStats = new inboundAudioStats();
        this.candidatePair = new CandidatePairStats();
        this.dataChannelStats = new dataChannelStats();
        this.outBoundVideoStats = new OutBoundVideoStats();
        this.streamStats = new StreamStats();
    }

    /**
     * Gather all the information from the RTC Peer Connection Report
     * @param rtcStatsReport - RTC Stats Report
     */
    processStats(rtcStatsReport: RTCStatsReport) {
        this.localCandidates = new Array<CandidateStat>();
        this.remoteCandidates = new Array<CandidateStat>();

        rtcStatsReport.forEach((stat) => {
            let type: RTCStatsTypeSPS = stat.type;

            switch (type) {
                case "candidate-pair":
                    this.handleCandidatePair(stat);
                    break;
                case "certificate":
                    break;
                case "codec":
                    break;
                case "csrc":
                    break;
                case "data-channel":
                    this.handleDataChannel(stat);
                    break;
                case "inbound-rtp":
                    this.handleInBoundRTP(stat);
                    break;
                case "local-candidate":
                    this.handleLocalCandidate(stat);
                    break;
                case "media-source":
                    break;
                case "outbound-rtp":
                    break;
                case "peer-connection":
                    break;
                case "remote-candidate":
                    this.handleRemoteCandidate(stat);
                    break;
                case "remote-inbound-rtp":
                    break;
                case "remote-outbound-rtp":
                    this.handleRemoteOutBound(stat);
                    break;
                case "track":
                    this.handleTrack(stat);
                    break;
                case "transport":
                    break;
                case "stream":
                    this.handleStream(stat);
                    break;
                default:
                    Logger.Error(Logger.GetStackTrace(), "unhandled Stat Type");
                    Logger.Log(Logger.GetStackTrace(), stat);
                    break;
            }

        })

    }

    /**
     * Process stream stats data from webrtc
     * 
     * @param stat the stats coming in from webrtc
     */
    handleStream(stat: any) {
        this.streamStats = stat
    }

    /** 
     * Process the Ice Candidate Pair Data 
     */
    handleCandidatePair(stat: any) {
        this.candidatePair.bytesReceived = stat.bytesReceived;
        this.candidatePair.bytesSent = stat.bytesSent;
        this.candidatePair.localCandidateId = stat.localCandidateId
        this.candidatePair.remoteCandidateId = stat.remoteCandidateId
        this.candidatePair.nominated = stat.nominated;
        this.candidatePair.readable = stat.readable;
        this.candidatePair.selected = stat.selected;
        this.candidatePair.writable = stat.writable;
        this.candidatePair.state = stat.state;
        this.candidatePair.currentRoundTripTime = stat.currentRoundTripTime;
    }

    /** 
     * Process the Data Channel Data 
     */
    handleDataChannel(stat: any) {
        this.dataChannelStats.bytesReceived = stat.dataytesReceived;
        this.dataChannelStats.bytesSent = stat.bytesSent
        this.dataChannelStats.dataChannelIdentifier = stat.dataChannelIdentifier
        this.dataChannelStats.id = stat.id
        this.dataChannelStats.label = stat.label
        this.dataChannelStats.messagesReceived = stat.messagesReceived
        this.dataChannelStats.messagesSent = stat.messagesSent
        this.dataChannelStats.protocol = stat.protocol
        this.dataChannelStats.state = stat.state
        this.dataChannelStats.timestamp = stat.timestamp
    }

    /** 
     * Process the Local Ice Candidate Data 
     */
    handleLocalCandidate(stat: any) {
        let localCandidate = new CandidateStat();
        localCandidate.label = "local-candidate"
        localCandidate.address = stat.address;
        localCandidate.port = stat.port
        localCandidate.protocol = stat.protocol;
        localCandidate.candidateType = stat.candidateType;
        localCandidate.id = stat.id;
        this.localCandidates.push(localCandidate);
    }

    /**
     * Process the Remote Ice Candidate Data 
     */
    handleRemoteCandidate(stat: any) {
        let RemoteCandidate = new CandidateStat();
        RemoteCandidate.label = "local-candidate"
        RemoteCandidate.address = stat.address;
        RemoteCandidate.port = stat.port
        RemoteCandidate.protocol = stat.protocol;
        RemoteCandidate.id = stat.id;
        RemoteCandidate.candidateType = stat.candidateType;
        this.remoteCandidates.push(RemoteCandidate);
    }

    /** 
     * Process the Inbound RTP Audio and Video Data  
     */
    handleInBoundRTP(stat: any) {
        switch (stat.kind) {
            case "video":
                this.inboundVideoStats.timestamp = stat.timestamp;
                this.inboundVideoStats.bytesReceived = stat.bytesReceived;
                this.inboundVideoStats.framesDecoded = stat.framesDecoded;
                this.inboundVideoStats.packetsLost = stat.packetsLost;
                this.inboundVideoStats.jitter = stat.jitter;

                this.inboundVideoStats.bytesReceivedStart = (this.inboundVideoStats.bytesReceivedStart == null) ? stat.bytesReceived : this.inboundVideoStats.bytesReceivedStart;
                this.inboundVideoStats.framesDecodedStart = (this.inboundVideoStats.framesDecodedStart == null) ? stat.framesDecoded : this.inboundVideoStats.framesDecodedStart;
                this.inboundVideoStats.timestampStart = (this.inboundVideoStats.timestampStart == null) ? stat.timestamp : this.inboundVideoStats.timestampStart;
                this.inboundVideoStats.framesDecodedStart = (this.inboundVideoStats.framesDecodedStart == null) ? stat.framesDecoded : this.inboundVideoStats.framesDecodedStart;

                if (this.lastVideoStats != undefined) {

                    this.inboundVideoStats.bitrate = 8 * (stat.bytesReceived - this.lastVideoStats.bytesReceived) / (stat.timestamp - this.lastVideoStats.timestamp);
                    this.inboundVideoStats.bitrate = Math.floor(this.inboundVideoStats.bitrate);

                    this.inboundVideoStats.lowBitrate = (this.inboundVideoStats.lowBitrate == undefined || Number.isNaN(this.inboundVideoStats.lowBitrate)) ? this.inboundVideoStats.bitrate : this.inboundVideoStats.lowBitrate;
                    this.inboundVideoStats.lowBitrate = (this.inboundVideoStats.bitrate < this.inboundVideoStats.lowBitrate || Number.isNaN(this.inboundVideoStats.lowBitrate)) ? this.inboundVideoStats.bitrate : this.inboundVideoStats.lowBitrate;

                    this.inboundVideoStats.highBitrate = (this.inboundVideoStats.highBitrate == undefined || Number.isNaN(this.inboundVideoStats.highBitrate)) ? this.inboundVideoStats.bitrate : this.inboundVideoStats.highBitrate;
                    this.inboundVideoStats.highBitrate = (this.inboundVideoStats.bitrate > this.inboundVideoStats.highBitrate) ? this.inboundVideoStats.bitrate : this.inboundVideoStats.highBitrate;

                    this.inboundVideoStats.avgBitrate = 8 * (this.inboundVideoStats.bytesReceived - this.lastVideoStats.bytesReceived) / (this.inboundVideoStats.timestamp - this.lastVideoStats.timestamp);
                    this.inboundVideoStats.avgBitrate = Math.floor(this.inboundVideoStats.avgBitrate);

                    this.inboundVideoStats.framerate = (this.inboundVideoStats.framesDecoded - this.lastVideoStats.framesDecoded) / ((this.inboundVideoStats.timestamp - this.lastVideoStats.timestamp) / 1000);
                    this.inboundVideoStats.framerate = Math.floor(this.inboundVideoStats.framerate);

                    this.inboundVideoStats.lowFramerate = (this.inboundVideoStats.lowFramerate == undefined || Number.isNaN(this.inboundVideoStats.lowFramerate)) ? this.inboundVideoStats.framerate : this.inboundVideoStats.lowFramerate;
                    this.inboundVideoStats.lowFramerate = (this.inboundVideoStats.framerate < this.inboundVideoStats.lowFramerate) ? this.inboundVideoStats.framerate : this.inboundVideoStats.lowFramerate;

                    this.inboundVideoStats.highFramerate = (this.inboundVideoStats.highFramerate == undefined || Number.isNaN(this.inboundVideoStats.highFramerate)) ? this.inboundVideoStats.framerate : this.inboundVideoStats.highFramerate;
                    this.inboundVideoStats.highFramerate = (this.inboundVideoStats.framerate < this.inboundVideoStats.highFramerate) ? this.inboundVideoStats.framerate : this.inboundVideoStats.highFramerate;

                    this.inboundVideoStats.averageFrameRate = (this.inboundVideoStats.framesDecoded - this.lastVideoStats.framesDecodedStart) / ((this.inboundVideoStats.timestamp - this.lastVideoStats.timestampStart) / 1000);
                    this.inboundVideoStats.averageFrameRate = Math.floor(this.inboundVideoStats.averageFrameRate);
                }
                this.lastVideoStats = { ...this.inboundVideoStats };
                break;
            case "audio":
                this.inboundAudioStats.bytesReceived = stat.bytesReceived
                this.inboundAudioStats.jitter = stat.jitter;
                this.inboundAudioStats.packetsLost = stat.packetslost;
                this.inboundAudioStats.timestamp = stat.timestamp;
                break;
            default:
                Logger.Log(Logger.GetStackTrace(), "Kind is not handled");
                break;

        }

    }

    /** 
     * Process the outbound RTP Audio and Video Data  
     */
    handleRemoteOutBound(stat: any) {
        switch (stat.kind) {
            case "video":
                this.outBoundVideoStats.bytesSent = stat.bytesSent;
                this.outBoundVideoStats.id = stat.id;
                this.outBoundVideoStats.localId = stat.localId;
                this.outBoundVideoStats.packetsSent = stat.packetsSent;
                this.outBoundVideoStats.remoteTimestamp = stat.remoteTimestamp;
                this.outBoundVideoStats.timestamp = stat.timestamp;
                break;
            case "audio":
                break;

            default:
                break;
        }
    }

    /** 
     * Process the Inbound Video Track Data  
     */
    handleTrack(stat: any) {

        // we only want to extract stats from the video track
        if(stat.type === 'track' && (stat.trackIdentifier === 'video_label' || stat.kind === 'video')) {
            this.inboundVideoStats.framesDropped = stat.framesDropped;
            this.inboundVideoStats.framesReceived = stat.framesReceived;
            this.inboundVideoStats.framesDroppedPercentage = stat.framesDropped / stat.framesReceived * 100;
            this.inboundVideoStats.frameHeight = stat.frameHeight;
            this.inboundVideoStats.frameWidth = stat.frameWidth;
            this.inboundVideoStats.frameHeightStart = (this.inboundVideoStats.frameHeightStart == null) ? stat.frameHeight : this.inboundVideoStats.frameHeightStart;
            this.inboundVideoStats.frameWidthStart = (this.inboundVideoStats.frameWidthStart == null) ? stat.frameWidth : this.inboundVideoStats.frameWidthStart;
        }
    }

    /** 
     * Check if a value coming in from our stats is actually a number  
     */
    isNumber(value: any): boolean {
        return typeof value === 'number' && isFinite(value);
    }
}














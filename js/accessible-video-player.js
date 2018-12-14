/**
 * accessible-video-player.js
 *
 * Accessible Video Player is a utility which helps to make embedded video content from
 * Videomore accessible. It uses the VideoJS API (https://github.com/vimeo/player.js)
 * methods and events to manipulte embedded videos.
 *
 * Video controls are generated on the fly, a set for each video on the page
 * which has a `accessibleVideoPlayer` object available.
 *
 * Repository URL: https://github.com/svinkle/accessible-video-player
 *
 * @author: Scott Vinkle <scott.vinkle@shopify.com>
 * @version: 0.7.5
 */
var accessibleVideoPlayer = (function(window, document, undefined) {
  'use strict';

  // Unique video identifier
  var videoId = 0;

  // Flexbox support test
  var flexboxSupport =
    document.createElement('p').style.flex === undefined ? false : true;

  // Fullscreen support test
  var fullscreenSupport =
    document.documentElement.requestFullscreen === undefined &&
    document.documentElement.mozRequestFullScreen === undefined &&
    document.documentElement.webkitRequestFullscreen === undefined &&
    document.documentElement.msRequestFullscreen === undefined
      ? false
      : true;

  // Lookup table of common, unique strings
  var strings = {
    domain: 'player.vimeo.com',
    accessibleVideoPlayer: 'accessible-video-player',
    dataA11y: 'data-accessible',
    dataState: 'data-state',
    dataAspectRatio: 'data-aspect-ratio',
    timeline: 'Timeline:',
    timelineSetTo: 'Timeline set to ',
    volume: 'Volume:',
    volume100: 'Volume set to 100 percent',
    volumeSetTo1: 'Volume set to ',
    volumeSetTo2: '0 percent',
    mute: 'Mute',
    muted: 'Muted',
    unmute: 'Unmute',
    unmuted: 'Unmuted',
    videoMuted: 'Video muted',
    videoUnmuted: 'Video unmuted',
    track: 'track',
    tracks: 'Tracks:',
    closedCaption: 'Closed Caption',
    trackSetTo: 'Caption set to ',
    trackOff: 'Caption off',
    fullscreenBtn: 'Enter fullscreen mode',
    exitFullscreenBtn: 'Exit fullscreen mode',
    fullscreen: 'Now playing in full screen mode, use the escape key to exit',
    exitFullscreen: 'Exited full screen mode',
    elapsed: 'Elapsed time: ',
    duration: 'Total duration: ',
    play: 'Play',
    pause: 'Pause',
    nowPlaying: 'Now playing ',
    pausedVideo: 'Paused video at ',
    videoLabel: ', video',
    videoEnded: 'Video ended',
    videoIdMissing:
      'Please add an ID to the embedded player and pass to the accessibleVideoPlayer object',
    videoNotFound: 'Video not found: ',
    off: 'Off',
    px: 'px'
  };

  // Lookup table of selectors
  var selectors = {
    iFrame: 'iframe[src*="' + strings.domain + '"]',
    videoFrame: 'accessible-video-frame',
    videoWrapper: 'accessible-video-wrapper-',
    controlsContainer: 'controls-container-',
    playBtn: 'toggle-btn-',
    timeline: 'timeline-',
    timelineWrapper: 'timeline-wrapper',
    timelineOutput: 'timeline-output',
    timelineTotal: 'timeline-total',
    timelineTooltip: 'timeline-tooltip',
    volume: 'volume-',
    track: 'track-',
    tracks: 'tracks-',
    trackOff: 'track-off-',
    ccBtn: 'cc-btn-',
    fullscreenBtn: 'fullscreen-btn-',
    announcements: 'announcements-'
  };

  // Lookup table of CSS classes
  var classes = {
    accessibleVideoPlayer: strings.accessibleVideoPlayer,
    fullscreenActive: strings.accessibleVideoPlayer + '--fullscreen',
    video: strings.accessibleVideoPlayer + '__video',
    controlsContainer: strings.accessibleVideoPlayer + '__controls-container',
    controlContainer: strings.accessibleVideoPlayer + '__control-container',
    btn: strings.accessibleVideoPlayer + '__btn',
    rng: strings.accessibleVideoPlayer + '__rng',
    playBtnContainer: strings.accessibleVideoPlayer + '__play-btn-container',
    playBtn: strings.accessibleVideoPlayer + '__play-btn',
    timelineContainer: strings.accessibleVideoPlayer + '__timeline-container',
    timelineWrapper: strings.accessibleVideoPlayer + '__timeline-wrapper',
    timeline: strings.accessibleVideoPlayer + '__timeline',
    timelineOutput: strings.accessibleVideoPlayer + '__timeline-output',
    timelineTooltip: strings.accessibleVideoPlayer + '__timeline-tooltip',
    timelineTooltipActive:
      strings.accessibleVideoPlayer + '__timeline-tooltip--active',
    volumeContainer: strings.accessibleVideoPlayer + '__volume-container',
    volume: strings.accessibleVideoPlayer + '__volume',
    muteBtn: strings.accessibleVideoPlayer + '__mute-btn',
    tracksContainer: strings.accessibleVideoPlayer + '__tracks-container',
    trackList: strings.accessibleVideoPlayer + '__track-list',
    trackListActive: strings.accessibleVideoPlayer + '__track-list--active',
    trackListItem: strings.accessibleVideoPlayer + '__track-list-item',
    trackListInput: strings.accessibleVideoPlayer + '__track-list-input',
    trackListLabel: strings.accessibleVideoPlayer + '__track-list-label',
    trackListLabelActive:
      strings.accessibleVideoPlayer + '__track-list-label--active',
    ccBtn: strings.accessibleVideoPlayer + '__cc-btn',
    fullscreenBtnContainer:
      strings.accessibleVideoPlayer + '__fullscreen-btn-container',
    fullscreenBtn: strings.accessibleVideoPlayer + '__fullscreen-btn',
    svgContainer: strings.accessibleVideoPlayer + '__icon-container',
    svg: strings.accessibleVideoPlayer + '__icon',
    visuallyHidden: 'visuallyhidden',
    clearfix: 'clearfix',
    flex: 'flex',
    noFlex: 'no-flex'
  };

  // Lookup table of settings
  var settings = {
    videoWidth: 640,
    videoHeight: 360,
    controlPanelHeight: 52,
    initialVolume: 1,
    timeout: 1000,
    timelineMin: 0,
    timelineStep: 1,
    timelineValue: 0,
    volumeInputMin: 0,
    volumeInputMax: 1,
    volumeInputStep: 0.2
  };

  // Lookup table of key codes
  var keyCode = {
    tab: 9,
    enter: 13,
    esc: 27,
    space: 32
  };

  // Lookup table of SVG icons
  var svg = {
    play:
      '<svg class="' +
      classes.svg +
      '" width="32" height="32"><g transform="scale(0.03125 0.03125)"><path d="M192 128l640 384-640 384z"></path></g></svg>',
    pause:
      '<svg class="' +
      classes.svg +
      '" width="32" height="32"><g transform="scale(0.03125 0.03125)"><path d="M128 128h320v768h-320zM576 128h320v768h-320z"></path></g></svg>',
    volume:
      '<svg class="' +
      classes.svg +
      '" width="32" height="32"><g transform="scale(0.03125 0.03125)"><path d="M719.53 831.53c-12.286 0-24.566-4.686-33.942-14.056-18.744-18.744-18.744-49.136 0-67.882 131.006-131.006 131.006-344.17 0-475.176-18.744-18.746-18.744-49.138 0-67.882 18.744-18.742 49.138-18.744 67.882 0 81.594 81.59 126.53 190.074 126.53 305.466 0 115.39-44.936 223.876-126.53 305.47-9.372 9.374-21.656 14.060-33.94 14.060v0zM549.020 741.020c-12.286 0-24.566-4.686-33.942-14.058-18.746-18.746-18.746-49.134 0-67.88 81.1-81.1 81.1-213.058 0-294.156-18.746-18.746-18.746-49.138 0-67.882s49.136-18.744 67.882 0c118.53 118.53 118.53 311.392 0 429.922-9.372 9.368-21.656 14.054-33.94 14.054z"></path><path d="M416.006 960c-8.328 0-16.512-3.25-22.634-9.374l-246.626-246.626h-114.746c-17.672 0-32-14.326-32-32v-320c0-17.672 14.328-32 32-32h114.746l246.626-246.628c9.154-9.154 22.916-11.89 34.874-6.936 11.958 4.952 19.754 16.622 19.754 29.564v832c0 12.944-7.796 24.612-19.754 29.564-3.958 1.64-8.118 2.436-12.24 2.436z"></path></g></svg>',
    mute:
      '<svg class="' +
      classes.svg +
      '" width="32" height="32"><g transform="scale(0.03125 0.03125)"><path d="M960 619.148v84.852h-84.852l-107.148-107.148-107.148 107.148h-84.852v-84.852l107.148-107.148-107.148-107.148v-84.852h84.852l107.148 107.148 107.148-107.148h84.852v84.852l-107.148 107.148 107.148 107.148z"></path><path d="M416.006 960c-8.328 0-16.512-3.25-22.634-9.374l-246.626-246.626h-114.746c-17.672 0-32-14.326-32-32v-320c0-17.672 14.328-32 32-32h114.746l246.626-246.628c9.154-9.154 22.916-11.89 34.874-6.936 11.958 4.952 19.754 16.622 19.754 29.564v832c0 12.944-7.796 24.612-19.754 29.564-3.958 1.64-8.118 2.436-12.24 2.436z"></path></g></svg>',
    cc:
      '<svg class="' +
      classes.svg +
      '" width="36.57143783569336" height="32"><g transform="scale(0.03125 0.03125)"><path d="M448.571 576h118.286q-8 90.286-56.286 142t-122.571 51.714q-92.571 0-145.429-66.286t-52.857-180.571q0-110.857 53.143-178t133.143-67.143q84.571 0 132.571 49.714t55.429 141.143h-116q-2.857-36.571-20.286-56.571t-46.571-20q-32.571 0-50.571 34.571t-18 101.429q0 27.429 2.857 48t10.286 39.714 22.857 29.429 37.714 10.286q54.286 0 62.286-79.429zM855.429 576h117.714q-8 90.286-56 142t-122.286 51.714q-92.571 0-145.429-66.286t-52.857-180.571q0-110.857 53.143-178t133.143-67.143q84.571 0 132.571 49.714t55.429 141.143h-116.571q-2.286-36.571-20-56.571t-46.286-20q-32.571 0-50.571 34.571t-18 101.429q0 27.429 2.857 48t10.286 39.714 22.571 29.429 37.429 10.286q28 0 43.714-21.714t19.143-57.714zM1060.571 508q0-118.286-8.857-175.429t-34.571-92q-3.429-4.571-7.714-8t-12.286-8.571-9.143-6.286q-49.143-36-398.286-36-357.143 0-405.714 36-2.857 2.286-10 6.571t-12 8-8.286 8.286q-25.714 34.286-34.286 91.143t-8.571 176.286q0 118.857 8.571 175.714t34.286 91.714q3.429 4.571 8.571 8.571t11.714 8 10 6.857q25.143 18.857 136.857 28t268.857 9.143q348.571 0 398.286-37.143 2.857-2.286 9.714-6.286t11.714-8 7.714-9.143q26.286-34.286 34.857-90.857t8.571-176.571zM1170.286 73.143v877.714h-1170.286v-877.714h1170.286z" /></g></svg>',
    fullscreen:
      '<svg class="' +
      classes.svg +
      '" width="32" height="32"><g transform="scale(0.03125 0.03125)"><path d="M1024 0h-416l160 160-192 192 96 96 192-192 160 160z"></path><path d="M1024 1024v-416l-160 160-192-192-96 96 192 192-160 160z"></path><path d="M0 1024h416l-160-160 192-192-96-96-192 192-160-160z"></path><path d="M0 0v416l160-160 192 192 96-96-192-192 160-160z"></path></g></svg>',
    exitFullscreen:
      '<svg class="' +
      classes.svg +
      '" width="32" height="32"><g transform="scale(0.03125 0.03125)"><path d="M576 448h416l-160-160 192-192-96-96-192 192-160-160z"></path><path d="M576 576v416l160-160 192 192 96-96-192-192 160-160z"></path><path d="M448 575.996h-416l160 160-192 192 96 96 192-192 160 160z"></path><path d="M448 448v-416l-160 160-192-192-96 96 192 192-160 160z"></path></g></svg>'
  };

  // Class constructor.
  var accessibleVideoPlayer = function(playerId) {
    var _this = this;

    // Instance properties
    this.player = null;
    this.video = null;
    this.videoId = 0;
    this.videoWidth = 0;
    this.videoHeight = 0;
    this.videoAspect = 0;
    this.currentWidth = 0;
    this.currentHeight = 0;
    this.videoWrapper = null;
    this.controlsContainer = null;
    this.playBtn = null;
    this.timeline = null;
    this.timelineTooltip = null;
    this.timelineOutput = null;
    this.timelineContainer = null;
    this.timelineTotal = 0;
    this.volumeInput = null;
    this.muteBtn = null;
    this.tracksList = null;
    this.isTracksListVisible = false;
    this.currentTrack = '';
    this.ccBtn = null;
    this.fullscreenBtn = null;
    this.isFullscreen = false;
    this.announcements = null;
    this.player = null;
    this.currentVolume = settings.initialVolume;
    this.videoTitle = '';
    this.elapsedTime = 0;
    this.totalDuration = 0;
    this.startTime = '';
    this.timeFormat = '';
    this.timeOutputFormat = '';

    // Check to see if the video param is present.
    // Then check to see if it exists in the DOM.
    // If all good, assign the element to `thisVideo`.
    if (!playerId) {
      console.error(strings.videoIdMissing);
      return;
    } else if (!document.querySelector('#' + playerId)) {
      console.error(strings.videoNotFound + playerId);
      return;
    } else {
      this.video = document.querySelector('#' + playerId);
      this.player = new Vimeo.Player(this.video);
    }

    // Prevent autoplay
    if (this.video.src.indexOf('autoplay') > 0) {
      this.video.src = this.video.src.replace('autoplay=1', 'autoplay=0');
    }

    // Get the initial width and height, set defaults if non present
    this.videoWidth = this.video.width || settings.videoWidth;
    this.videoHeight = this.video.height || settings.videoHeight;

    /**
     * Sets a unique identifier for the current video.
     */
    this.setVideoId = function() {
      this.videoId = videoId;
    };

    /**
     * Gets the unique identifier value of the current video.
     *
     * @return videoId {Number} index of the current video.
     */
    this.getVideoId = function() {
      return this.videoId;
    };

    /**
     * Gets the video element.
     *
     * @return video {Object} video element.
     */
    this.getVideo = function() {
      return this.video;
    };

    /**
     * Gets the video width.
     *
     * @return videoWidth {Number} video width.
     */
    this.getVideoWidth = function() {
      return this.videoWidth;
    };

    /**
     * Gets the video height.
     *
     * @return videoHeight {Number} video height.
     */
    this.getVideoHeight = function() {
      return this.videoHeight;
    };

    /**
     * Sets the video wrapper element.
     */
    this.setVideoWrapper = function(videoWrapper) {
      this.videoWrapper = videoWrapper;
    };

    /**
     * Gets the video wrapper element.
     *
     * @return videoWrapper {Object} wrapper element.
     */
    this.getVideoWrapper = function() {
      return this.videoWrapper;
    };

    /**
     * Sets the current width value.
     */
    this.setCurrentWidth = function(currentWidth) {
      this.currentWidth = currentWidth;
    };

    /**
     * Gets the current width value.
     *
     * @return currentWidth {Number} current width value.
     */
    this.getCurrentWidth = function() {
      return this.currentWidth;
    };

    /**
     * Sets the current height value.
     */
    this.setCurrentHeight = function(currentHeight) {
      this.currentHeight = currentHeight;
    };

    /**
     * Gets the current height value.
     *
     * @return currentHeight {Number} current height value.
     */
    this.getCurrentHeight = function() {
      return this.currentHeight;
    };

    /**
     * Gets the Videoplayer object.
     *
     * @return player {Object} Videoplayer object.
     */
    this.getPlayer = function() {
      return this.player;
    };

    /**
     * Sets the Videoplayer object.
     */
    this.setPlayer = function(player) {
      this.player = player;
    };

    /**
     * Gets the controls container.
     *
     * @return controlsContainer {Object} player controls container element.
     */
    this.getControlsContainer = function() {
      return this.controlsContainer;
    };

    /**
     * Sets the controls container.
     */
    this.setControlsContainer = function(controlsContainer) {
      this.controlsContainer = controlsContainer;
    };

    /**
     * Gets the play/pause button.
     *
     * @return playBtn {Object} play/pause `button` element.
     */
    this.getPlayBtn = function() {
      return this.playBtn;
    };

    /**
     * Sets the play/pause button.
     */
    this.setPlayBtn = function(playBtn) {
      this.playBtn = playBtn;
    };

    /**
     * Gets the timeline `input` control.
     *
     * @return timeline {Object} timeline `input` element.
     */
    this.getTimeline = function() {
      return this.timeline;
    };

    /**
     * Sets the timeline control.
     */
    this.setTimeline = function(timeline) {
      this.timeline = timeline;
    };

    /**
     * Gets the timeline output content.
     *
     * @return timelineOutput {String} timeline output content.
     */
    this.getTimelineOutput = function() {
      return this.timelineOutput;
    };

    /**
     * Sets the timeline output content.
     */
    this.setTimelineOutput = function(timelineOutput) {
      this.timelineOutput = timelineOutput;
    };

    /**
     * Gets the timeline container object.
     *
     * @return timelineContainer {Object} timeline container.
     */
    this.getTimelineContainer = function() {
      return this.timelineContainer;
    };

    /**
     * Sets the timeline container object.
     */
    this.setTimelineContainer = function(timelineContainer) {
      this.timelineContainer = timelineContainer;
    };

    /**
     * Gets the timelineTooltip container.
     *
     * @return timelineTooltip {Object} timeline tooltip container.
     */
    this.getTimelineTooltip = function() {
      return this.timelineTooltip;
    };

    /**
     * Sets the timelineTooltip control.
     */
    this.setTimelineTooltip = function(timelineTooltip) {
      this.timelineTooltip = timelineTooltip;
    };

    /**
     * Gets the starting time format.
     *
     * @return startTime {String} start time format.
     */
    this.getStartTime = function() {
      return this.startTime;
    };

    /**
     * Gets the time format.
     *
     * @return timeFormat {String} time formating.
     */
    this.getTimeFormat = function() {
      return this.timeFormat;
    };

    /**
     * Gets the time announcement format.
     *
     * @return timeOutputFormat {String} tine announcement format.
     */
    this.getTimeOutputFormat = function() {
      return this.timeOutputFormat;
    };

    /**
     * Gets the volume `input` control.
     *
     * @return volumeInput {Object} volume `input` element.
     */
    this.getVolumeInput = function() {
      return this.volumeInput;
    };

    /**
     * Sets the volume control.
     */
    this.setVolume = function(volumeInput) {
      this.volumeInput = volumeInput;
    };

    /**
     * Gets the mute button.
     *
     * @return muteBtn {Object} mute `button` element.
     */
    this.getMuteBtn = function() {
      return this.muteBtn;
    };

    /**
     * Sets the mute button.
     */
    this.setMuteBtn = function(muteBtn) {
      this.muteBtn = muteBtn;
    };

    /**
     * Gets the set track button.
     *
     * @return ccBtn {Object} caption `button` element.
     */
    this.getCcBtn = function() {
      return this.ccBtn;
    };

    /**
     * Sets the set track button.
     */
    this.setCcBtn = function(ccBtn) {
      this.ccBtn = ccBtn;
    };

    /**
     * Gets the fullscreen button.
     *
     * @return fullscreenBtn {Object} fullscreen `button` element.
     */
    this.getFullscreenBtn = function() {
      return this.fullscreenBtn;
    };

    /**
     * Sets the fullscreen button.
     */
    this.setFullscreenBtn = function(fullscreenBtn) {
      this.fullscreenBtn = fullscreenBtn;
    };

    /**
     * Gets the fullscreen flag.
     *
     * @return isFullscreen {Boolean} fullscreen flag.
     */
    this.getFullscreen = function() {
      return this.isFullscreen;
    };

    /**
     * Sets the fullscreen flag.
     */
    this.setFullscreen = function(fullscreen) {
      this.isFullscreen = fullscreen;
    };

    /**
     * Gets the track list.
     *
     * @return tracksList {Object} closed caption `ul` element.
     */
    this.getTracksList = function() {
      return this.tracksList;
    };

    /**
     * Sets the track list.
     */
    this.setTracksList = function(tracksList) {
      this.tracksList = tracksList;
    };

    /**
     * Gets the track list visibility flag.
     *
     * @return isTracksListVisible {Boolean} visibility flag.
     */
    this.getTracksListVisible = function() {
      return this.isTracksListVisible;
    };

    /**
     * Sets the track list visibility flag.
     */
    this.setTracksListVisible = function(visible) {
      this.isTracksListVisible = visible;
    };

    /**
     * Gets the current track, `id` of the track control.
     *
     * @return currentTrack {String} current track.
     */
    this.getCurrentTrack = function() {
      return this.currentTrack;
    };

    /**
     * Sets the curernt track, `id` of the track control.
     */
    this.setCurrentTrack = function(track) {
      this.currentTrack = track;
    };

    /**
     * Gets the announcements element in order to update the player status.
     *
     * @return announcements {Object} announcement `div` element.
     */
    this.getAnnouncements = function() {
      return this.announcements;
    };

    /**
     * Sets the announcements element container.
     */
    this.setAnnouncements = function(announcements) {
      this.announcements = announcements;
    };

    /**
     * Sets the current volume level of the video.
     */
    this.setCurrentVolume = function(volume) {
      this.currentVolume = volume;
    };

    /**
     * Gets the current volume level of the video.
     *
     * @return currentVolume {number} volume level.
     */
    this.getCurrentVolume = function() {
      return this.currentVolume;
    };

    /**
     * Gets the video aspect ratio.
     *
     * @return videoAspect {number} aspect ratio value.
     */
    this.getVideoAspect = function() {
      return this.videoAspect;
    };

    // Set the unique identifier for the current video, then increment for
    // the next video.
    this.setVideoId();
    videoId++;

    // Set some attributes on the player in order to avoid screen readers
    // from reaching the original controls
    this.video.setAttribute('aria-hidden', true);
    this.video.setAttribute('tabindex', -1);

    // Set a class for styling
    this.video.setAttribute('class', classes.video);

    // Create player controls
    this.createControlsContainer();
    this.createPlayBtn();
    this.createTimeline();
    this.createVolumeControls();
    this.createTracksControls();
    this.createAnnouncementsContainer();
    this.createVideoWrapper();

    if (fullscreenSupport) {
      this.createFullscreenBtn();
    }

    // Setup video to flex with screen width
    this.videoAspect = this.videoHeight / this.videoWidth;
    this.flexVideo();
    window.addEventListener(
      'resize',
      accessibleVideoPlayer.prototype.flexVideo.bind(this),
      false
    );

    // Set a flag in order to not create a new instace on the same video
    // in case the script runs more than once without a page refresh
    this.video.setAttribute(strings.dataA11y, true);

    /*
     * Events
     */

    // On timer update
    this.player.on('timeupdate', function(data) {
      _this.elapsedTime = Math.round(data.seconds);

      // Update the timeline range value and time output
      _this.timeline.value = _this.elapsedTime;
      _this.timelineOutput.innerHTML =
        '<span aria-hidden="true">' +
        moment
          .duration(_this.elapsedTime, 'seconds')
          .format(_this.timeFormat, {trim: false}) +
        '</span><span class="' +
        classes.visuallyHidden +
        '">' +
        strings.elapsed +
        moment
          .duration(_this.elapsedTime, 'seconds')
          .format(_this.timeOutputFormat) +
        '</span>';
    });

    // On video play
    this.player.on('play', function(data) {
      _this.playBtn.setAttribute(strings.dataState, strings.play.toLowerCase());
      _this.playBtn.innerHTML = _this.iconTemplate(svg.pause, strings.pause);

      _this.announcements.textContent = strings.nowPlaying + _this.videoTitle;
    });

    // On video pause
    this.player.on('pause', function(data) {
      _this.playBtn.setAttribute(
        strings.dataState,
        strings.pause.toLowerCase()
      );
      _this.playBtn.innerHTML = _this.iconTemplate(svg.play, strings.play);

      _this.announcements.textContent =
        strings.pausedVideo +
        moment
          .duration(_this.elapsedTime, 'seconds')
          .format(_this.timeOutputFormat);
    });

    // On playback end
    this.player.on('ended', function(data) {
      _this.playBtn.setAttribute(
        strings.dataState,
        strings.pause.toLowerCase()
      );
      _this.playBtn.innerHTML = _this.iconTemplate(svg.play, strings.play);

      _this.announcements.textContent = strings.videoEnded;
    });

    /*
     * Data
     */

    // Get video duration
    this.player
      .getDuration()
      .then(function(duration) {

        // Set time format based on duration length
        if (duration < 600) {

          // Less than 10 minutes
          _this.startTime = '0:00';
          _this.timeFormat = 'm:ss';
          _this.timeOutputFormat = 'm [minute(s)], s [second(s)]';
        } else if (duration >= 600 && duration < 3600) {

          // More than 10 minutes, less than 1 hour
          _this.startTime = '00:00';
          _this.timeFormat = 'mm:ss';
          _this.timeOutputFormat = 'm [minute(s)], s [second(s)]';
        } else if (duration >= 3600 && duration < 36000) {

          // More than 1 hour, less than 10 hours
          _this.startTime = '0:00:00';
          _this.timeFormat = 'h:mm:ss';
          _this.timeOutputFormat = 'h [hour(s)], m [minute(s)], s [second(s)]';
        } else if (duration >= 36000) {

          // More than 10 hours
          _this.startTime = '00:00:00';
          _this.timeFormat = 'hh:mm:ss';
          _this.timeOutputFormat = 'h [hour(s)], m [minute(s)], s [second(s)]';
        }

        // Set the max value of the timeline range input
        _this.timeline.max = duration;

        // Format the start time
        _this.timelineOutput.innerHTML =
          '<span aria-hidden="true">' +
          _this.startTime +
          '</span><span class="' +
          classes.visuallyHidden +
          '">' +
          strings.elapsed +
          moment.duration(0, 'seconds').format(_this.timeOutputFormat) +
          '</span>';
        _this.totalDuration = moment
          .duration(duration, 'seconds')
          .format(_this.timeFormat, {trim: false});

        // Get the total duration and add to the DOM
        _this.timelineTotal = document.createElement('div');
        _this.timelineTotal.id = selectors.timelineTotal;
        _this.timelineTotal.setAttribute('class', classes.timelineOutput);
        _this.timelineTotal.innerHTML =
          '<span aria-hidden="true">' +
          _this.totalDuration +
          '</span><span class="' +
          classes.visuallyHidden +
          '">' +
          strings.duration +
          moment.duration(duration, 'seconds').format(_this.timeOutputFormat) +
          '</span>';

        _this.timelineContainer.appendChild(_this.timelineTotal);
      })
      .catch(function(error) {});

    // Get the video title
    this.player
      .getVideoTitle()
      .then(function(title) {
        _this.videoTitle = title;
        _this.videoWrapper.setAttribute(
          'aria-label',
          title + strings.videoLabel
        );
      })
      .catch(function(error) {});
  };

  /**
   * Create the video wrapper element.
   *
   * @method createControlsContainer
   */
  accessibleVideoPlayer.prototype.createVideoWrapper = function() {
    var _this = this,
      video = this.getVideo(),
      videoId = this.getVideoId(),
      videoWidth = this.getVideoWidth(),
      controlsContainer = this.getControlsContainer(),
      videoWrapper = this.getVideoWrapper();

    // Container
    videoWrapper = document.createElement('div');

    // Wrapper element
    videoWrapper.id = selectors.videoWrapper + videoId;
    videoWrapper.setAttribute('class', classes.accessibleVideoPlayer);
    videoWrapper.setAttribute('role', 'region');
    videoWrapper.setAttribute('tabindex', 0);
    videoWrapper.style.maxWidth = videoWidth + strings.px;

    // Event listener
    videoWrapper.addEventListener(
      'keydown',
      function(ev) {
        if (ev.which === keyCode.space) {
          ev.preventDefault();
          _this.toggleVideo();
        }
      },
      false
    );

    // Add to DOM
    video.parentNode.replaceChild(videoWrapper, video);
    videoWrapper.appendChild(video);
    videoWrapper.appendChild(controlsContainer);

    // Update instance property
    this.setVideoWrapper(videoWrapper);
  };

  /**
   * Create the controls container element.
   *
   * @method createControlsContainer
   */
  accessibleVideoPlayer.prototype.createControlsContainer = function() {
    var video = this.getVideo(),
      videoId = this.getVideoId(),
      controlsContainer = this.getControlsContainer();

    // Container
    controlsContainer = document.createElement('div');
    controlsContainer.id = selectors.controlsContainer + videoId;
    controlsContainer.setAttribute('class', classes.controlsContainer);
    controlsContainer.setAttribute('role', 'toolbar');

    // Check for flexbox support in order to add proper classes for styling
    if (flexboxSupport) {
      controlsContainer.setAttribute(
        'class',
        controlsContainer.getAttribute('class') + ' ' + classes.flex
      );
    } else {
      controlsContainer.setAttribute(
        'class',
        controlsContainer.getAttribute('class') +
          ' ' +
          classes.noFlex +
          ' ' +
          classes.clearfix
      );
    }

    // Add to DOM
    video.parentNode.insertBefore(controlsContainer, video.nextSibling);

    // Update instance properties
    this.setControlsContainer(controlsContainer);
  };

  /**
   * Create the play/pause button.
   *
   * @method createPlayControls
   */
  accessibleVideoPlayer.prototype.createPlayBtn = function() {
    var videoId = this.getVideoId(),
      controlsContainer = this.getControlsContainer(),
      playBtn = this.getPlayBtn(),
      playBtnContainer = null;

    // Container
    playBtnContainer = document.createElement('div');
    playBtnContainer.setAttribute(
      'class',
      classes.controlContainer + ' ' + classes.playBtnContainer
    );

    // Play button control
    playBtn = document.createElement('button');
    playBtn.id = selectors.playBtn + videoId;
    playBtn.setAttribute('class', classes.btn + ' ' + classes.playBtn);
    playBtn.setAttribute(strings.dataState, strings.pause.toLowerCase());
    playBtn.innerHTML = this.iconTemplate(svg.play, strings.play);

    // Events
    playBtn.addEventListener(
      'click',
      accessibleVideoPlayer.prototype.toggleVideo.bind(this),
      false
    );

    // Add to DOM
    playBtnContainer.appendChild(playBtn);
    controlsContainer.appendChild(playBtnContainer);

    // Update instance properties
    this.setPlayBtn(playBtn);
  };

  /**
   * Create the video timeline control.
   *
   * @method createTimeline
   */
  accessibleVideoPlayer.prototype.createTimeline = function() {
    var videoId = this.getVideoId(),
      controlsContainer = this.getControlsContainer(),
      timeline = this.getTimeline(),
      timelineContainer = this.getTimelineContainer(),
      timelineOutput = this.getTimelineOutput(),
      timelineTooltip = this.getTimelineTooltip(),
      timelineWrapper = null,
      timelineLabel = null;

    // Container
    timelineContainer = document.createElement('div');
    timelineContainer.setAttribute(
      'class',
      classes.controlContainer + ' ' + classes.timelineContainer
    );

    timelineWrapper = document.createElement('div');
    timelineWrapper.id = selectors.timelineWrapper;
    timelineWrapper.setAttribute('class', classes.timelineWrapper);

    // Range input control
    timeline = document.createElement('input');
    timeline.id = selectors.timeline + videoId;
    timeline.setAttribute('class', classes.rng + ' ' + classes.timeline);
    timeline.type = 'range';
    timeline.min = settings.timelineMin;
    timeline.step = settings.timelineStep;
    timeline.value = settings.timelineValue;

    // Input label
    timelineLabel = document.createElement('label');
    timelineLabel.setAttribute('class', classes.visuallyHidden);
    timelineLabel.setAttribute('for', timeline.id);
    timelineLabel.textContent = strings.timeline;

    // Timeline text output, time remaining
    timelineOutput = document.createElement('div');
    timelineOutput.id = selectors.timelineOutput;
    timelineOutput.setAttribute('class', classes.timelineOutput);

    // Tooltip
    timelineTooltip = document.createElement('div');
    timelineTooltip.id = selectors.timelineTooltip;
    timelineTooltip.setAttribute('class', classes.timelineTooltip);
    timelineTooltip.setAttribute('role', 'tooltip');

    // Events
    timeline.addEventListener(
      'change',
      accessibleVideoPlayer.prototype.updateTimeline.bind(this),
      false
    );
    timeline.addEventListener(
      'input',
      accessibleVideoPlayer.prototype.updateTimeline.bind(this),
      false
    );
    timeline.addEventListener(
      'mousemove',
      accessibleVideoPlayer.prototype.updateTooltip.bind(this),
      false
    );
    timeline.addEventListener(
      'mouseenter',
      accessibleVideoPlayer.prototype.showTooltip.bind(this),
      false
    );
    timeline.addEventListener(
      'mouseout',
      accessibleVideoPlayer.prototype.hideTooltip.bind(this),
      false
    );

    // Add to DOM
    timelineContainer.appendChild(timelineOutput);
    timelineContainer.appendChild(timelineLabel);
    timelineWrapper.appendChild(timelineTooltip);
    timelineWrapper.appendChild(timeline);
    timelineContainer.appendChild(timelineWrapper);
    controlsContainer.appendChild(timelineContainer);

    // Update instance properties
    this.setTimeline(timeline);
    this.setTimelineTooltip(timelineTooltip);
    this.setTimelineOutput(timelineOutput);
    this.setTimelineContainer(timelineContainer);
  };

  /**
   * Create the volume controls.
   *
   * @method createVolumeControls
   */
  accessibleVideoPlayer.prototype.createVolumeControls = function() {
    var videoId = this.getVideoId(),
      controlsContainer = this.getControlsContainer(),
      volumeInput = this.getVolumeInput(),
      muteBtn = this.getMuteBtn(),
      volumeContainer = null,
      volumeLabel = null;

    // Container
    volumeContainer = document.createElement('div');
    volumeContainer.setAttribute(
      'class',
      classes.controlContainer + ' ' + classes.volumeContainer
    );

    // Range input control
    volumeInput = document.createElement('input');
    volumeInput.id = selectors.volume + videoId;
    volumeInput.setAttribute('class', classes.rng + ' ' + classes.volume);
    volumeInput.type = 'range';
    volumeInput.min = settings.volumeInputMin;
    volumeInput.max = settings.volumeInputMax;
    volumeInput.step = settings.volumeInputStep;
    volumeInput.value = settings.initialVolume;

    // Input label
    volumeLabel = document.createElement('label');
    volumeLabel.setAttribute('class', classes.visuallyHidden);
    volumeLabel.setAttribute('for', volumeInput.id);
    volumeLabel.textContent = strings.volume;

    // Mute button
    muteBtn = document.createElement('button');
    muteBtn.id = strings.mute.toLowerCase();
    muteBtn.setAttribute('class', classes.btn + ' ' + classes.muteBtn);
    muteBtn.setAttribute(strings.dataState, strings.unmuted.toLowerCase());
    muteBtn.innerHTML = this.iconTemplate(svg.volume, strings.mute);

    // Events
    volumeInput.addEventListener(
      'change',
      accessibleVideoPlayer.prototype.updateVolume.bind(this),
      false
    );
    volumeInput.addEventListener(
      'input',
      accessibleVideoPlayer.prototype.updateVolume.bind(this),
      false
    );
    muteBtn.addEventListener(
      'click',
      accessibleVideoPlayer.prototype.muteVolume.bind(this),
      false
    );

    // Add to DOM
    volumeContainer.appendChild(volumeLabel);
    volumeContainer.appendChild(volumeInput);
    volumeContainer.appendChild(muteBtn);
    controlsContainer.appendChild(volumeContainer);

    // Update instance properties
    this.setVolume(volumeInput);
    this.setMuteBtn(muteBtn);
  };

  /**
   * Create the tracks (closed captions) controls.
   *
   * @method createTracksControls
   */
  accessibleVideoPlayer.prototype.createTracksControls = function() {
    var _this = this,
      player = this.getPlayer(),
      videoId = this.getVideoId(),
      controlsContainer = this.getControlsContainer(),
      tracksList = this.getTracksList(),
      ccBtn = this.getCcBtn(),
      tracksContainer = null;

    // Container
    tracksContainer = document.createElement('div');
    tracksContainer.setAttribute(
      'class',
      classes.controlContainer + ' ' + classes.tracksContainer
    );

    // Track list element
    tracksList = document.createElement('ul');
    tracksList.id = selectors.tracks + videoId;
    tracksList.setAttribute('class', classes.trackList);

    // Closed caption button
    ccBtn = document.createElement('a');
    ccBtn.id = selectors.ccBtn + videoId;
    ccBtn.href = '#' + selectors.trackOff + videoId;
    ccBtn.setAttribute('class', classes.btn + ' ' + classes.ccBtn);
    ccBtn.setAttribute('aria-expanded', false);
    ccBtn.innerHTML = this.iconTemplate(svg.cc, strings.closedCaption);

    // Events
    ccBtn.addEventListener(
      'click',
      accessibleVideoPlayer.prototype.toggleTracks.bind(this),
      false
    );

    // Get the tracks from the API
    player.getTextTracks().then(function(tracks) {
      if (tracks.length) {
        var tracksLength = tracks.length,
          trackOptionItem = null,
          trackOptionLabel = null,
          trackOptionLabelText = null,
          trackOption = null,
          createElements = null,
          setEvents = null,
          i = 0;

        // Create the track elements
        createElements = function(trackLang, trackLabel) {
          trackOptionItem = document.createElement('li');
          trackOptionLabel = document.createElement('label');
          trackOptionLabelText = document.createElement('span');
          trackOption = document.createElement('input');

          trackOptionItem.setAttribute('class', classes.trackListItem);

          if (trackLabel === strings.off) {
            trackOption.id = selectors.trackOff + videoId;
          } else {
            trackOption.id = selectors.track + i;
          }

          trackOption.setAttribute('class', classes.trackListInput);
          trackOption.type = 'radio';
          trackOption.name = strings.track;
          trackOption.value = trackLang;

          trackOptionLabel.setAttribute('class', classes.trackListLabel);
          trackOptionLabelText.textContent = trackLabel;

          tracksList.appendChild(trackOptionItem);
          trackOptionItem.appendChild(trackOptionLabel);
          trackOptionLabel.appendChild(trackOption);
          trackOptionLabel.appendChild(trackOptionLabelText);

          // Set events for the 'off' track
          setEvents(trackOption, trackOptionLabel, trackLang, trackLabel);
        };

        // Set event listeners
        setEvents = function(
          trackOption,
          trackOptionLabel,
          trackLang,
          trackLabel
        ) {

          // Ser the track on input change (click or arrow keys)
          trackOption.addEventListener(
            'change',
            function() {
              _this.setTrack(trackOption.id, trackLang, trackLabel);
            },
            false
          );

          // On mouse click, hide the track menu
          trackOptionLabel.addEventListener(
            'mousedown',
            function(e) {
              window.setTimeout(function() {
                _this.toggleTracks(e);
              }, settings.timeout);
            },
            false
          );

          // If the 'enter' or 'tab' key is clicked, hide the menu
          trackOption.addEventListener(
            'keydown',
            function(e) {
              if (e.which === keyCode.enter || e.which === keyCode.tab) {
                if (_this.getTracksListVisible()) {
                  _this.toggleTracks(e);
                  ccBtn.focus();
                }
              }
            },
            false
          );

          // Add a class to the label on input focus
          trackOption.addEventListener(
            'focus',
            function() {
              trackOptionLabel.setAttribute(
                'class',
                trackOptionLabel.getAttribute('class') +
                  ' ' +
                  classes.trackListLabelActive
              );
            },
            false
          );

          // Remove the class from the label on input blur
          trackOption.addEventListener(
            'blur',
            function() {
              trackOptionLabel.setAttribute('class', classes.trackListLabel);
            },
            false
          );
        };

        // Hide the track menu at any point when clicking esc
        document.addEventListener(
          'keyup',
          function(e) {
            if (e.which === keyCode.esc) {
              if (_this.getTracksListVisible()) {
                _this.toggleTracks(e);
                ccBtn.focus();
              }
            }
          },
          false
        );

        // Add the initial 'off' track
        createElements('', strings.off);

        // Add the rest of the available tracks
        for (; i < tracksLength; i++) {
          createElements(tracks[i].language, tracks[i].label);
        }

        // Add to the DOM
        tracksContainer.appendChild(tracksList);
        tracksContainer.appendChild(ccBtn);
        controlsContainer.appendChild(tracksContainer);

        // Fix IE11
        _this.fixIE11(tracksContainer);
      }
    });

    // Update instance properties
    this.setCcBtn(ccBtn);
    this.setTracksList(tracksList);
  };

  /**
   * Create the fullscreen button.
   *
   * @method createFullscreenBtn
   */
  accessibleVideoPlayer.prototype.createFullscreenBtn = function() {
    var videoId = this.getVideoId(),
      controlsContainer = this.getControlsContainer(),
      fullscreenBtn = this.getFullscreenBtn(),
      fullscreenBtnContainer = null;

    // Container
    fullscreenBtnContainer = document.createElement('div');
    fullscreenBtnContainer.setAttribute(
      'class',
      classes.controlContainer + ' ' + classes.fullscreenBtnContainer
    );

    // Fullscreen button control
    fullscreenBtn = document.createElement('button');
    fullscreenBtn.id = selectors.fullscreenBtn + videoId;
    fullscreenBtn.setAttribute(
      'class',
      classes.btn + ' ' + classes.fullscreenBtn
    );
    fullscreenBtn.innerHTML = this.iconTemplate(
      svg.fullscreen,
      strings.fullscreenBtn
    );

    // Events
    fullscreenBtn.addEventListener(
      'click',
      accessibleVideoPlayer.prototype.toggleFullscreen.bind(this),
      false
    );
    document.addEventListener(
      'focus',
      accessibleVideoPlayer.prototype.trapFocus.bind(this),
      true
    );

    // Add to DOM
    fullscreenBtnContainer.appendChild(fullscreenBtn);
    controlsContainer.appendChild(fullscreenBtnContainer);

    // Update instance properties
    this.setFullscreenBtn(fullscreenBtn);
  };

  /**
   * Create the announcements container.
   *
   * @method createAnnouncementsContainer
   */
  accessibleVideoPlayer.prototype.createAnnouncementsContainer = function() {
    var videoId = this.getVideoId(),
      announcements = this.getAnnouncements(),
      controlsContainer = this.getControlsContainer();

    // Container
    announcements = document.createElement('div');

    // Announcements elements
    announcements.id = selectors.announcements + videoId;
    announcements.setAttribute('class', classes.visuallyHidden);
    announcements.setAttribute('aria-live', 'polite');
    announcements.setAttribute('aria-atomic', true);

    // Add to DOM
    controlsContainer.appendChild(announcements);

    // Update instance property
    this.setAnnouncements(announcements);
  };

  /**
   * Toggle the state of the video, either 'playing' or 'paused'.
   *
   * @method toggleVideo
   */
  accessibleVideoPlayer.prototype.toggleVideo = function() {
    var player = this.getPlayer(),
      state = this.getPlayBtn().getAttribute(strings.dataState);

    if (state === strings.pause.toLowerCase()) {

      // Play the video
      player
        .play()
        .then(function() {})
        .catch(function(error) {
          switch (error.name) {
          case 'PasswordError':
            break;
          case 'PrivacyError':
            break;
          default:
            break;
          }
        });
    } else {

      // Pause the video
      player
        .pause()
        .then(function() {})
        .catch(function(error) {
          switch (error.name) {
          case 'PasswordError':
            break;
          case 'PrivacyError':
            break;
          default:
            break;
          }
        });
    }
  };

  /**
   * Update the video position when using the timeline control.
   * Time and position are based on the 'seconds' value.
   *
   * @method updateTimeline
   */
  accessibleVideoPlayer.prototype.updateTimeline = function() {
    var _this = this,
      player = this.getPlayer(),
      timeline = this.getTimeline(),
      announcements = this.getAnnouncements();

    // Set the current time and update the announcement
    player
      .setCurrentTime(timeline.value)
      .then(function(seconds) {
        window.setTimeout(function() {
          announcements.textContent =
            strings.timelineSetTo +
            moment
              .duration(seconds, 'seconds')
              .format(_this.getTimeOutputFormat());
        }, settings.timeout);
      })
      .catch(function(error) {
        switch (error.name) {
        case 'RangeError':
          break;
        default:
          break;
        }
      });
  };

  /**
   * Update the video volume when the volume timeline is used.
   * Volume can be changed by 20% at a time.
   *
   * @method updateVolume
   */
  accessibleVideoPlayer.prototype.updateVolume = function() {
    var player = this.getPlayer(),
      volumeInput = this.getVolumeInput(),
      announcements = this.getAnnouncements();

    // Set the volume to the current range value
    player
      .setVolume(volumeInput.value)
      .then(function(volume) {
        var friendlyVolume = '';

        switch (volume) {
        case '1':
          friendlyVolume = strings.volume100;
          break;
        case '0':
          friendlyVolume = strings.muted;
          break;
        default:
          friendlyVolume =
              strings.volumeSetTo1 +
              volume.replace('0.', '') +
              strings.volumeSetTo2;
        }

        // Update the announcements
        announcements.textContent = friendlyVolume;
      })
      .catch(function(error) {
        switch (error.name) {
        case 'RangeError':
          break;
        default:
          break;
        }
      });
  };

  /**
   * Mute the video volume when the mute button is clicked. Unmute when
   * clicked again. Volume timeline value has to be set first, then call
   * the updateVolume() method.
   *
   * @method muteVolume
   */
  accessibleVideoPlayer.prototype.muteVolume = function() {
    var volumeInput = this.getVolumeInput(),
      muteBtn = this.getMuteBtn(),
      announcements = this.getAnnouncements(),
      state = muteBtn.getAttribute(strings.dataState);

    if (state === strings.unmuted.toLowerCase()) {

      // Mute the volume, capturing the current value
      this.setCurrentVolume(volumeInput.value);
      volumeInput.value = 0;

      muteBtn.setAttribute(strings.dataState, strings.muted.toLowerCase());
      muteBtn.innerHTML = this.iconTemplate(svg.mute, strings.unmute);

      announcements.textContent = strings.videoMuted;
    } else {

      // Unmute, setting the volume back to where it was previously
      volumeInput.value = this.getCurrentVolume();

      muteBtn.setAttribute(strings.dataState, strings.unmuted.toLowerCase());
      muteBtn.innerHTML = this.iconTemplate(svg.volume, strings.mute);

      announcements.textContent = strings.videoUnmuted;
    }

    this.updateVolume();
  };

  /**
   * Set the track based on the selected track radio control.
   *
   * @method setTrack
   */
  accessibleVideoPlayer.prototype.setTrack = function(id, lang, label) {
    var _this = this,
      player = this.getPlayer(),
      announcements = this.getAnnouncements(),
      ccBtn = this.getCcBtn(),
      currentTrack = '';

    if (label === strings.off) {

      // Turn tracks off
      player
        .disableTextTrack()
        .then(function() {
          ccBtn.innerHTML = _this.iconTemplate(svg.cc, strings.closedCaption);

          window.setTimeout(function() {
            announcements.textContent = strings.trackOff;
          }, settings.timeout);
        })
        .catch(function(error) {});
    } else {

      // Set to the desired language track
      player
        .enableTextTrack(lang)
        .then(function(track) {
          currentTrack =
            strings.trackSetTo +
            '<span lang="' +
            lang +
            '">' +
            label +
            '</span>';
          ccBtn.innerHTML = _this.iconTemplate(
            svg.cc,
            strings.closedCaption + ', ' + currentTrack
          );

          window.setTimeout(function() {
            announcements.innerHTML = currentTrack;
          }, settings.timeout);
        })
        .catch(function(error) {
          switch (error.name) {
          case 'InvalidTrackLanguageError':
            break;
          case 'InvalidTrackError':
            break;
          default:
            break;
          }
        });
    }

    // Update instance properties
    this.setCurrentTrack(id);
  };

  /**
   * Toggle the visibility of the tracks list.
   *
   * @method toggleTracks
   */
  accessibleVideoPlayer.prototype.toggleTracks = function(e) {
    e.preventDefault();

    var ccBtn = this.getCcBtn(),
      tracksList = this.getTracksList(),
      tracksListVisible = this.getTracksListVisible(),
      currentTrack = this.getCurrentTrack();

    // Toggle the active class and set focus to the button
    tracksList.classList.toggle(classes.trackListActive);

    // Set the focus to the currently set track
    if (!tracksListVisible) {
      if (currentTrack === '') {
        tracksList.querySelectorAll('input')[0].focus();
      } else {
        tracksList.querySelector('#' + currentTrack).focus();
      }
    }

    // Toggle the expanded attribute
    ccBtn.setAttribute(
      'aria-expanded',
      ccBtn.getAttribute('aria-expanded') === 'true' ? false : true
    );

    // Update instance property
    this.setTracksListVisible(tracksListVisible ? false : true);
  };

  /**
   * Toggle the fullscreen state of the video.
   *
   * @method toggleFullscreen
   */
  accessibleVideoPlayer.prototype.toggleFullscreen = function() {
    var _this = this,
      video = this.getVideo(),
      videoId = this.getVideoId(),
      videoWrapper = this.getVideoWrapper(),
      fullscreenBtn = this.getFullscreenBtn(),
      announcements = this.getAnnouncements(),
      fullscreenChange = null;

    if (
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    ) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }

      videoWrapper.setAttribute('class', classes.accessibleVideoPlayer);
      fullscreenBtn.innerHTML = this.iconTemplate(
        svg.fullscreen,
        strings.fullscreenBtn
      );
      this.setFullscreen(false);

      window.setTimeout(function() {
        announcements.textContent = strings.exitFullscreen;
      }, settings.timeout);
    } else {
      this.setCurrentWidth(video.offsetWidth);
      this.setCurrentHeight(video.offsetHeight);

      if (videoWrapper.requestFullscreen) {
        videoWrapper.requestFullscreen();
      } else if (videoWrapper.mozRequestFullScreen) {
        videoWrapper.mozRequestFullScreen();
      } else if (videoWrapper.webkitRequestFullscreen) {
        videoWrapper.webkitRequestFullscreen();
      } else if (videoWrapper.msRequestFullscreen) {
        videoWrapper.msRequestFullscreen();
      }

      videoWrapper.setAttribute(
        'class',
        classes.accessibleVideoPlayer + ' ' + classes.fullscreenActive
      );
      fullscreenBtn.innerHTML = this.iconTemplate(
        svg.exitFullscreen,
        strings.exitFullscreenBtn
      );
      this.setFullscreen(true);

      window.setTimeout(function() {
        announcements.textContent = strings.fullscreen;
      }, settings.timeout);
    }

    fullscreenChange = function() {

      // blur/focus pseudo hack for Safari
      document.activeElement.blur();
      videoWrapper
        .querySelector('#' + selectors.fullscreenBtn + videoId)
        .focus();

      videoWrapper.setAttribute('class', classes.accessibleVideoPlayer);
      fullscreenBtn.innerHTML = _this.iconTemplate(
        svg.fullscreen,
        strings.fullscreenBtn
      );

      _this.flexVideo(null, true);
      _this.setFullscreen(false);
    };

    document.onfullscreenchange = function() {
      if (!document.fullscreenElement) {
        fullscreenChange();
      }
    };
    document.onwebkitfullscreenchange = function() {
      if (!document.webkitFullscreenElement) {
        fullscreenChange();
      }
    };
    document.onmozfullscreenchange = function() {
      if (!document.mozFullScreenElement) {
        fullscreenChange();
      }
    };
    document.onmsfullscreenchange = function() {
      if (!document.msFullscreenElement) {
        fullscreenChange();
      }
    };
  };

  /**
   * Sets videos to be flexible with browser width.
   *
   * @method flexVideo
   * @param ev {Object} click event information object.
   * @param fromFullscreen {Boolean} flag notice from full screen button click.
   */
  accessibleVideoPlayer.prototype.flexVideo = function(ev, fromFullscreen) {

    // This setTimeout is required for Safari to properly set a fullscreen
    // video as it seems to fire too early. Moving the logic in to a
    // setTimeout allows it to drop into the next tick. Not ideal but it works.
    window.setTimeout(
      function() {
        var video = this.getVideo(),
          videoWrapper = this.getVideoWrapper(),
          videoWidth = this.getVideoWidth(),
          videoAspect = this.getVideoAspect(),
          currentWidth = this.getCurrentWidth(),
          currentHeight = this.getCurrentHeight(),
          videoWrapperWidth = videoWrapper.offsetWidth;

        // If there's a full screen element
        if (
          document.fullscreenElement ||
          document.mozFullScreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
        ) {
          video.style.width = '100%';
          video.style.height = videoWrapperWidth * videoAspect + strings.px;
        } else {
          if (fromFullscreen) {

            // Set back to the current width and height when clicking the
            // fullscreen toggle
            video.style.width = currentWidth + strings.px;
            video.style.height = currentHeight + strings.px;
          } else {

            // Set the width of the video to the container width
            // only if it's smaller than the original video width
            if (videoWrapperWidth <= videoWidth) {

              // Attempt to account for hidden parent elements
              if (videoWrapperWidth === 0) {
                video.style.width = videoWidth + strings.px;
                video.style.height = videoWidth * videoAspect + strings.px;
              } else {
                video.style.width = videoWrapperWidth + strings.px;
                video.style.height =
                  videoWrapperWidth * videoAspect + strings.px;
              }
            }
          }
        }
      }.bind(this),
      0
    );
  };

  /**
   * When video is fullscreen, trap the keyboard focus within the player.
   *
   * @method trapFocus
   * @param ev {Object} click event information object.
   */
  accessibleVideoPlayer.prototype.trapFocus = function(ev) {
    var videoWrapper = this.getVideoWrapper(),
      isFullscreen = this.getFullscreen();

    if (isFullscreen && !videoWrapper.contains(ev.target)) {
      ev.stopPropagation();
      videoWrapper.focus();
    }
  };

  /**
   * Update the tooltip content based on the current mouse position of the
   * timeline element. Format the output as the current time of the
   * video, based on the mouse position.
   *
   * @method updateTooltip
   * @param ev {Object} mouse event information object.
   */
  accessibleVideoPlayer.prototype.updateTooltip = function(ev) {
    var timeline = this.getTimeline(),
      timeFormat = this.getTimeFormat(),
      timelineOutput = this.getTimelineOutput(),
      timelineTooltip = this.getTimelineTooltip(),
      totalDuration = 0,
      currentPosition = 0,
      endPosition = 0,
      currentPercent = 0,
      currrentTime = 0;

    // Set the total durarion in seconds from the timeline element
    totalDuration = timeline.max;

    // Use the offsetX value from the event object to set the current
    // mouse position along the timeline element
    currentPosition = ev.offsetX;

    // Set the timeline end position, the width of the timeline element
    endPosition = timeline.offsetWidth;

    // Get the current percent of where the mouse currently is
    // along the timeline element
    currentPercent = Math.round((currentPosition / endPosition) * 100);

    // Using the current percent and total duration we can calculate
    // the current time point in the video, based on seconds
    currrentTime = Math.round((currentPercent / 100) * totalDuration);

    // Set the tooltip content, the current time in the video to where
    // the mouse pointer currently sits, in a human readable format
    timelineTooltip.textContent = moment
      .duration(currrentTime, 'seconds')
      .format(timeFormat, {trim: false});

    // Position the tooltip with the mouse pointer, half the tooltip
    // width in order to position in its middle point.
    timelineTooltip.style.marginLeft =
      -(timelineTooltip.offsetWidth / 2) + strings.px;
    timelineTooltip.style.left =
      ev.offsetX + timelineOutput.offsetWidth + strings.px;
  };

  /**
   * Show the tooltip element when the mouse enters the timeline element.
   *
   * @method showTooltip
   */
  accessibleVideoPlayer.prototype.showTooltip = function() {
    var tooltip = this.getTimelineTooltip();

    tooltip.setAttribute(
      'class',
      tooltip.getAttribute('class') + ' ' + classes.timelineTooltipActive
    );
  };

  /**
   * Hide the tooltip element when the mouse leaves the timeline element.
   *
   * @method hideTooltip
   */
  accessibleVideoPlayer.prototype.hideTooltip = function() {
    var tooltip = this.getTimelineTooltip();

    tooltip.setAttribute('class', classes.timelineTooltip);
  };

  /**
   * Icon template used to create icons with appropriate elements.
   *
   * @method iconTemplate
   * @param icon {String} string representation of the SVG.
   * @param name {String} accessible name for the icon element.
   * @return {String} the icon template.
   */
  accessibleVideoPlayer.prototype.iconTemplate = function(icon, name) {
    return (
      '<span class="' +
      classes.svgContainer +
      '" aria-hidden="true">' +
      icon +
      '</span><span class="' +
      classes.visuallyHidden +
      '">' +
      name +
      '</span>'
    );
  };

  /**
   * Unfortunate layout hack for IE11. The timeline control doesn't adjust
   * its width after it loads the [container] control, so there needs to
   * be a force width set.
   *
   * @method fixIE11
   * @param container {DOM Node} container element.
   */
  accessibleVideoPlayer.prototype.fixIE11 = function(container) {
    var timelineContainer = this.getTimelineContainer();

    if (!window.ActiveXObject && 'ActiveXObject' in window) {
      timelineContainer.style.width =
        timelineContainer.offsetWidth - container.offsetWidth + strings.px;
    }
  };

  /**
   * Unload the custom player and set everything back the way it was
   *
   * @method unload
   */
  accessibleVideoPlayer.prototype.unload = function() {
    var video = this.getVideo(),
      videoWrapper = this.getVideoWrapper(),
      controlsContainer = this.getControlsContainer();

    // Move the video out of the wrapper
    videoWrapper.parentNode.insertBefore(video, videoWrapper);

    // Remove the wrapper and controls
    videoWrapper.remove();
    controlsContainer.remove();

    // Remove attributes from the video element
    video.removeAttribute(strings.dataA11y);
    video.removeAttribute('class');
    video.removeAttribute('tabindex');
    video.removeAttribute('style');
    video.removeAttribute('aria-hidden');

    // Update instance property
    this.setPlayer(null);
  };

  /**
   * Initialize each video on the page with the custom player.
   *
   * @method init
   */
  accessibleVideoPlayer.prototype.init = function() {
    var players = document.querySelectorAll(selectors.iFrame),
      playersLength = players.length,
      thisPlayer = null,
      i = 0;

    for (; i < playersLength; i++) {
      thisPlayer = players[i];

      if (!thisPlayer.getAttribute(strings.dataA11y)) {
        if (!thisPlayer.id) {
          thisPlayer.id = selectors.videoFrame + '-' + i;
        }

        new accessibleVideoPlayer(thisPlayer.id);
      }
    }
  };

  // Wait for the document to finish loading before initializing
  document.addEventListener('DOMContentLoaded', function() {
    accessibleVideoPlayer.prototype.init();
  });

  return accessibleVideoPlayer;
})(window, document);

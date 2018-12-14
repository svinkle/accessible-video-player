# ▶️ Accessible Video Player

Accessible Video Player creates keyboard and assistive technology friendly videos from [Vimeo](https://vimeo.com/).

Accessible Video Player uses the [Vimeo JS API](https://github.com/vimeo/player.js) to manipulate each embedded video. Controls are generated on the fly, a set for each embedded Vimeo player found on a page.

## Features

The following video controls are made available:

- Play/pause toggle button
- Timeline slider
- Volume slider
- Mute button
- Full screen button
- View and set closed caption track (if available)
- Video and controls flex to viewport width
- Events are announced out loud as they happen

## Usage

**1)** Include the Vimeo JS API and Moment.js dependencies:

```html
<script src="https://player.vimeo.com/api/player.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.14.1/moment.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/moment-duration-format/1.3.0/moment-duration-format.min.js"></script>
```

**2)** Include this lib at the bottom of your page:

```html
<script src="accessible-video-player.js"></script>
```

The included script will automatically find any `<iframe>` elements on the page with embedded videos from the domain `player.vimeo.com` and attaches the controls on the fly. No other configuration is required!

### Manual integration

If you need to manually create a video player you can do so by the following.

**1)** Add an `id` to the embedded video `iframe` element _and_ the `data-accessible` attribute. The attribute tells the script to not run on this video automatically.

```html
<iframe id="myVideo" data-accessible="true" src="..." ...></iframe>
```

**2)** Create a new object and pass the `id` of the embedded video to the object:

```html
<script>
  var myVideo = new accessibleVideoPlayer('myVideo');
</script>
```

# My GitHub Widget

Dynamic Spotify SVG status cards and widgets for GitHub Profiles.

## Language

**Card Canvas**:
The outer SVG container module that encapsulates viewport dimensions, theme palettes, gradient definitions, rounded borders, common styles, and Spotify branding.
_Avoid_: SVG frame, card wrapper, template

**Widget Content**:
The internal dynamic SVG markup representing specific audio data (such as currently playing track or top tracks carousel) hosted inside a Card Canvas.
_Avoid_: Widget body, card content, inner HTML

**Spotify Presence**:
The real-time or most recent listening state of a user (playing, paused, recently played, or idle).
_Avoid_: User status, now playing state

**Top Tracks**:
A ranked collection of a user's most listened tracks over a specified time range with automated carousel presentation.
_Avoid_: Popular songs, favorite music

**Carousel Inspection**:
The interaction state where hovering over a Top Tracks widget freezes the auto-scrolling animation, toggles the badge to paused, and highlights the focused track row.
_Avoid_: Mouse pause, track hover

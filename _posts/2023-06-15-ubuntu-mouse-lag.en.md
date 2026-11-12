---
title: "Ubuntu mouse lag"
date: 2023-06-15 15:00
categories: dev
tags: ["dev", "ops", "ubuntu"]
lang: en
locale: en_US
ref: ubuntu-mouse-lag
permalink: /en/ubuntu-mouse-lag.html
---

# Symptom

The mouse often moves a little slowly, as if it's lagging.

# Attempts to fix

## Editing `/etc/environment` (workaround)

I searched "ubuntu 22.04 mouse lag" and got more replies than I expected.

I found [this comment](https://bugs.launchpad.net/ubuntu/+source/gnome-shell/+bug/1982560/comments/24), tried adding the following to `/etc/environment`, then restarted.

```bash
MUTTER_DEBUG_ENABLE_ATOMIC_KMS=0
MUTTER_DEBUG_FORCE_KMS_MODE=simple
```

These two values are Mutter debug flags, so it's hard to treat them as a long-term proper fix. Still, on my machine, putting in this workaround and restarting made the lag go away right then.

# Why?

There's [a comment that offered a theory about the cause](https://bugs.launchpad.net/ubuntu/+source/gnome-shell/+bug/1982560/comments/23), roughly that a "triple buffering patch" might be the cause.

At first they treated that as the cause, but around the same time [an analysis that it might not be](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/1441#note_1568056) was attached to that MR. Still, it does seem to happen when triple buffering is on. It might be related to the workaround working on my machine, but I'm not sure. They say that when triple buffering is on, the current update gets merged into the next frame. From the outside it seems like, when there's a frame still sitting in a not-yet-updated state, they merge it into the very next frame and send the update request together. That's why the lag-like symptom shows up.

According to what I studied above, triple buffering is a way of using two buffers for computation and one buffer for display, to compute the screen to show on the monitor faster. By default they go with double buffering, using only one compute buffer, and it seems they tried to go with triple buffering for a performance improvement.

So if I reinterpret the original comment...

Reviewing this again it appears there is no visible problem, and a different problem.

I do not _see_ cursor frame skipping.

-   frame skipping seems to mean a phenomenon where a frame that the GPU didn't finish computing in time for the next frame occurs, and the current frame's image is held through the next frame.

Debug logging however suggests that `meta_kms_update_assign_plane` is dropping some assignments during cursor-only updates, but only when triple buffering is enabled, despite the debug logging saying it's using double buffering. This seems to happen when:

`cogl_onscreen_count_pending_frames (onscreen) > 0`

in `meta_onscreen_native_finish_frame`. It returns without a result, which is the same as `IDLE` and the frame clock gets unthrottled. But we also can't return `PENDING_PRESENTED` (despite the fact it avoids the dropped assignments) because then some animations will stutter. Rightfully so because the frame is not pending presentation but has instead been merged into the next frame because that is known to contain a primary plane update.

-   It looks like a state where there is a waiting frame is being emitted as the enum IDLE, a nothing-is-happening state, so the current frame isn't applied and only the next frame's compute result is shown.

Maybe a new frame result enum is required, or maybe nothing needs fixing at all. Needs more analysis...

So it seems like a bug that came out while developing triple buffer..? At the time of writing, the MR(!1441) this analysis was on had not been merged yet. (This MR was merged into GNOME 48 in February 2025.) I still don't really know whether this could be the cause of my symptom.

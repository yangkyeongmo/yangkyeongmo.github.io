---
title: "우분투 마우스 렉"
date: 2023-06-15 15:00
categories: dev
tags: ["dev", "ops", "ubuntu"]
lang: ko
locale: ko_KR
ref: ubuntu-mouse-lag
---

# 현상

마우스가 자주 렉걸린듯이 조금씩 느리게 움직인다.

# 해결 시도

## `/etc/environment` 수정 (워크어라운드)

“ubuntu 22.04 mouse lag” 이라고 검색했는데 생각보다 많은 응답이 나왔다.

[이 코멘트](https://bugs.launchpad.net/ubuntu/+source/gnome-shell/+bug/1982560/comments/24)를 발견해서 아래 내용을 `/etc/environment` 에 추가하는 것을 시도한 후 재시작해봤다.

```bash
MUTTER_DEBUG_ENABLE_ATOMIC_KMS=0
MUTTER_DEBUG_FORCE_KMS_MODE=simple
```

이 두 값은 Mutter의 디버그 플래그라서 장기적인 정식 수정이라고 보기는 어렵다. 다만 내 머신에서는 이 워크어라운드를 넣고 재시작하니 렉이 바로 사라졌다.

# 왜?

[원인에 대한 이론을 제시한 코멘트](https://bugs.launchpad.net/ubuntu/+source/gnome-shell/+bug/1982560/comments/23)가 있는데, 대략 “triple buffering patch” 가 원인일 수 있다는 것이다.

하지만 처음에는 그것을 원인으로 잡았는데, 같은 시기에 [아닐 수도 있다는 분석](https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/1441#note_1568056)이 그 MR에 달려 있었다. 다만 트리플 버퍼링이 켜졌을 때 발생하는 건 맞다는듯. 내 머신에서 워크어라운드가 통한 것과 관련이 있을지도 모르겠지만, 확실하지는 않다. triple buffering 이 켜졌을 때 현재 업데이트가 다음 프레임에 합쳐지는 현상이 있다고 한다. 겉보기로는 업데이트가 아직 안 된 상태로 남아있는 프레임이 있을 때 바로 다음 프레임에 같이 합쳐서 업데이트 요청을 보내는 것 같다. 그래서 렉걸리는 듯한 현상이 나타나는 것이고.

위 공부한 내용에 따르면 트리플 버퍼링은 모니터에 보여줄 화면을 더 빠르게 계산하기 위해 연산용 버퍼를 두 개 쓰고 보여주기용 버퍼를 하나 쓰는 방식이다. 기본적으로는 더블 버퍼링, 연산용 버퍼를 하나만 쓰는 방식을 택하는데 성능 향상을 위해서 트리플 버퍼링을 택하려고 했나보다.

그래서 원문 코멘트를 다시 해석해보자면..

Reviewing this again it appears there is no visible problem, and a different problem.

I do not _see_ cursor frame skipping.

-   frame skipping 은 GPU에서 다음 프레임까지 미처 계산되지 못한 프레임이 발생하면서 현재 프레임의 이미지가 다음 프레임까지 유지되는 현상을 의미하는듯 하다.

Debug logging however suggests that `meta_kms_update_assign_plane` is dropping some assignments during cursor-only updates, but only when triple buffering is enabled, despite the debug logging saying it's using double buffering. This seems to happen when:

`cogl_onscreen_count_pending_frames (onscreen) > 0`

in `meta_onscreen_native_finish_frame`. It returns without a result, which is the same as `IDLE` and the frame clock gets unthrottled. But we also can't return `PENDING_PRESENTED` (despite the fact it avoids the dropped assignments) because then some animations will stutter. Rightfully so because the frame is not pending presentation but has instead been merged into the next frame because that is known to contain a primary plane update.

-   기다리고있는 프레임이 있는 상태를 아무 현상도 아닌 상태인 IDLE 이라는 enum 으로 내보내면서 현재의 프레임이 반영되지 않고 다음 프레임 연산 결과만 표시되는 현상이 발생 중인것으로 보임.

Maybe a new frame result enum is required, or maybe nothing needs fixing at all. Needs more analysis...

즉 triple buffer 개발하면서 나온 버그..?인것 같다. 작성 당시 이 분석이 달린 MR(!1441)은 아직 머지되지 않은 상태였다. (이 MR은 2025년 2월에 GNOME 48로 머지되었다.) 이게 내 증상의 원인이 될 수가 있는지는 여전히 잘 모르겠다.

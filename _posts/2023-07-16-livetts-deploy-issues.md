---
title: "라이브TTS를 올리며 겪은 도메인, CORS, 성능 문제"
date: 2023-07-16 17:56
categories: dev
tags: ["livetts", "dns", "nginx"]
published: false
---

이후에는 나만 도메인 이름으로 접근이 잘 되는 문제가 생깁니다. 접속이 잘 되어 모든 준비가 끝났다고 생각하고 사이트 테스트를 요청했는데, 도메인에 접속이 안 된다고 합니다. 알고보니 도메인과 관련된 이슈였습니다.

도메인 네임을 IP 주소로 바꿀때는 DNS를 통하고, 도메인 이름을 가지고있는 서버를 네임 서버, 줄여서 NS라고 합니다. 각 NS가 서로 가지고있는 이름이 다를 수 있기 때문에 이 설정을 잘못하면 나의 도메인을 인터넷을 통해 찾지 못할 수도 있습니다.

이번 케이스가 적절한 예시입니다. 기존에 `planmoji.com` 도메인을 구매하고 가비아에 NS를 등록해둔 상태였습니다. 이 때는 해당 도메인만 사용했기 때문에 `planmoji.com` 및 `www.planmoji.com` 만 등록해둔 상태입니다. 이 때는 Route53을 사용했습니다.

하지만 이번에는 `speak.planmoji.com` 으로 서비스를 띄우려고 합니다. 저번에는 Route53을 사용했지만 이번에는 편의성을 위해 Lightsail 서비스를 활용했습니다. Lightsail 서비스는 네트워크를 구성할 때 새로 NS를 띄우는지 NS를 등록하기 위한 주소를 알려줍니다.

때문에 이런 구성이 됩니다.

- 이전 정보
    - `www.planmoji.com`
    - `planmoji.com`
- 새 정보
    - `speak.planmoji.com`

가비아에서 도메인을 구매해둔 상태여서 가비아에 NS를 등록했습니다. 아무것도 모를 때라 이전 정보를 들고있는 NS를 1~4순위로 등록하고 그 뒤에 5~8순위로 새 정보를 들고있는 NS를 등록했습니다.

때문에 `speak.planmoji.com` 을 전달받은 이전 NS는 당연히 별개의 주소가 아닌 `planmoji.com` 의 하위 도메인일것이라고 판단하고 "그런거 없다!" 라고 응답합니다.

이후 새 정보를 들고있는 NS를 1~4순위로 등록한 뒤 5분 정도 기다리니 모두가 `speak.planmoji.com`을 확인할 수 있게 되었습니다.

## CORS

CORS 이슈가 계속 발생합니다. 개발하다보니 HTTPS가 안 되는게 안 그래도 계속 걸렸는데, CORS 이슈가 HTTPS를 활성화하면 괜찮을 수 있다는 얘기가 StackOverflow에 보입니다. 언젠가는 활성화시키려고 했기 때문에 한번 해보기로 했습니다. HTTPS 설정은 [이전에 적어 둔 글](/https-setup.html)에 있습니다.

이후로 CORS 이슈를 해결하려다가 정말 진땀뺐습니다. 계속 [CORSDidNotSucceed](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSDidNotSucceed) 에 해당하는 에러가 떠서 뭔가 했는데, 어딘가 잘못 생각한 부분이 있었기 때문이었습니다.

서버에 요청을 보내는 흐름은 아래와 같습니다.

1. 브라우저가 서버에 자바스크립트 파일 요청
2. 자바스크립트는 "`localhost:8000`에 요청하세요"라고 되어있음
3. 브라우저가 "클라이언트의 `localhost:8000`"에 요청

브라우저에서는 `localhost:8000` 에 요청하라는 것만 알고있습니다. 로컬에서 진행한다면 이 주소가 나의 로컬의 8000 포트를 의미하고 나의 컴퓨터 8000 포트는 서버 어플리케이션을 보고 있으므로 정상 동작합니다. 하지만 유저의 8000 포트에는 서버가 당연히 떠있지 않습니다. 때문에 에러가 발생합니다. 정말 경솔했네요.

## Jmeter를 이용한 성능 튜닝

### 테스트 계획

1. Load test
    - RPS: 10
    - Time: 6h
    - Workload: Random
2. Spike test
    - RPS: 50
    - Time: 10m
    - Workload: Random

### 테스트 결과

(노트에는 여기에 테스트 결과 이미지가 있었음.)

테스트 결과.

#### 500RPS, 600s, caching

초회 테스트에서 0000~9999 랜덤으로 보내서 캐싱이 많이 되었음. 이 때 약 480RPS 수용.

#### 500RPS, 100s, all fresh

두 번째 테스트에서 10000~99999 랜덤으로 보내서 전부 fresh하게 가져오는걸 시도. 이 때 120RPS 정도 발생했고 에러가 40% 정도로 많이 나왔음.

에러가 왜 발생했는지 보려고 `/var/log/nginx/errors.log`를 봤는데 아래와 같은 에러로그가 있었다.

```
2023/05/05 12:30:49 [alert] 176093#176093: *59377 768 worker_connections are not enough while connecting to upstream, client: [redacted], server: speak.planmoji.com, request: "GET /api/speak?text=67710 HTTP/1.1", upstream: "http://127.0.0.1:8000/speak?text=67710", host: "speak.planmoji.com"
```

### 에러 원인 분석

로컬에서 테스트했을 때 새로 발생한 polly 요청은 대략 200ms 정도 걸린다. 클라이언트가 만든 요청은 nginx worker가 하나 떠서 커넥션을 담당한다. 모든 커넥션이 그 시간 동안 대기해야한다면, 최대 RPS는 worker_connections를 요청당 대기 시간으로 나눈 정도가 된다. 로컬에서 200ms라면 이론상 상한은 worker_connections의 다섯 배 근처여야 하는데, 실제로는 RPS가 150을 넘기면서 이 에러가 났다. 이 계산만으로 설명하기는 부족한 것 같다. 확보 가능한 커넥션이 없으면 500 에러가 발생한다.

이 에러는 RPS가 150 넘게 발생한다는 행복한 상황에서 발생할 에러여서 투자비용을 감안해 현재는 고치지 않는다.

## Locale 성능

(노트에 프로파일러 이미지가 있었습니다.)

Locale을 20개 이상으로 늘린 뒤 진입하는데 10초 이상 걸리기 시작했다. 프로파일러로 확인해보니 약 8초간 `https://api.country.is` 라는 도메인에서 요청을 받아서 dom paint를 하고있다.

알고보니 `country_ip` 패키지가 해당 도메인에 API 호출을 해서 ip를 가져오고 있었고, 제거했을 때 동일한 요청이 발생하지 않음을 확인할 수 있었다.

## 출시 후 반응

(노트에는 여기에 분석 이미지가 있었음.)

Reached 25 users in two days after advertising on reddit!!

- Which decreased down to 5 users on 06/09/2023.
- [Reddit post 1](https://www.reddit.com/r/mute/comments/1438yg3/speak_instantly_with_a_tts_i_made_might_help/)
- [Reddit post 2](https://www.reddit.com/r/AssistiveTechnology/comments/1438u3t/i_made_a_texttospeech_website_that_speaks_word_by/)

- Make an app
    - Connection-free version
        - Since 90kbps(=about 12kB/s) mp3 is about 15kb for a word(from guessing a word would take 1~2 seconds), maybe storing up to 60,000 words would take about 100MB. Then, I could provide downloadable language pack.
    - Internet version
        - If one needs something better, they could use premium internet version. This would include more words, more voices or else.

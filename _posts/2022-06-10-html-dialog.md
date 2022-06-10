---
title: "HTML dialog tag"
date: 2022-06-10 13:36
categories: dev
tags: ["html"]
---

[긱뉴스](https://news.hada.io/new)에서 [공유된 아티클](https://tomquinonero.com/blog/native-html-modals-with-the-dialog-tag?utm_source=hada)을 보고 dialog 태그를 사용하면 앞으로 개발할 때 모달을 직접 구현하지 않아도 되지 않을까 하여 간단한 예시를 만들어 테스트해봤습니다.

모달 구현 시 직접 구현하는 경우를 많이 본것 같은데 아마 커스터마이징 목적이었을것 같습니다만 간단하게 구현할때는 편리할것 같습니다.

# 예시

## 코드

```html
<html>
    <head>
        <title>Dialog test</title>
        <link rel="stylesheet" href="index.css">
    </head>
    <body>
        <h1>Hello!</h1>
        <button id="modal-button" data-modal="modal">Open a modal</button>
        <dialog id="modal">
            <h2>I'm dialog. Who are you?</h2>
            <button id="close-dialog">close</button>
        </dialog>
        <script>
            const button = document.getElementById('modal-button')
            button.addEventListener('click', (event) => {
                const modal = document.getElementById('modal')
                modal.showModal()
            })

            const closeButton = document.getElementById('close-dialog')
            closeButton.addEventListener('click', (event) => {
                const modal = event.target.closest('dialog')
                modal.close()
            })
        </script>
    </body>
    <style>
        dialog {
            background-color: aqua;
        }

        dialog::backdrop {
            background-color: blueviolet 
        }
    </style>
</html>
```

## 실행 예시

![메인 화면](/assets/img/html-dialog/main-page.jpg)
![dialog 오픈](/assets/img/html-dialog/dialog-open.jpg)

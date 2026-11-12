---
title: "HTTPS 활성화하기"
date: 2023-03-30 15:00
categories: dev
tags: []
lang: ko
locale: ko_KR
ref: https-setup
---

SSL certificate을 직접 만들어 사용하는 방법[^1]도 있으니 나중에 흥미가 생기면 참고해보려고 합니다.
여기서는 certbot을 활용합니다. certbot은 ISRG라는 비영리재단이 운영하는 무료, 오픈소스  CA인 Let's Encrypt[^2]의 클라이언트입니다. 

아래 내용으로 해보려고 했는데, lightsail에서는 뭔가 다른지 세팅이 잘 안 되더라구요.

```bash
sudo add-apt-repository ppa:certbot/certbot
```

```bash
$ sudo snap install --classic certbot
...
certbot 2.4.0 from Certbot Project (certbot-eff✓) installed
```

알고보니 Lightsail에서 하는 방법이 따로 있는것 같습니다[^3]. 다만 아래 내용은 phind를 통해서 알아낸 내용입니다.

```bash
$ sudo certbot certonly --manual --preferred-challenges dns -d planmoji.com -d *.planmoji.com
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Requesting a certificate for planmoji.com and *.planmoji.com

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Please deploy a DNS TXT record under the name:

_acme-challenge.planmoji.com.

...

Before continuing, verify the TXT record has been deployed. Depending on the DNS
provider, this may take some time, from a few seconds to multiple minutes. You can
check if it has finished deploying with aid of online tools, such as the Google
Admin Toolbox: https://toolbox.googleapps.com/apps/dig/#TXT/_acme-challenge.planmoji.com.
Look for one or more bolded line(s) below the line ';ANSWER'. It should show the
value(s) you've just added.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Press Enter to Continue

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/planmoji.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/planmoji.com/privkey.pem
This certificate expires on 2023-06-27.
These files will be updated when the certificate renews.

NEXT STEPS:
- This certificate will not be renewed automatically. Autorenewal of --manual certificates requires the use of an authentication hook script (--manual-auth-hook) but one was not provided. To renew this certificate, repeat this same certbot command before the certificate's expiry date.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
If you like Certbot, please consider supporting our work by:
 * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
 * Donating to EFF:                    https://eff.org/donate-le
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

수동 설정에 성공하면 위처럼 메시지가 나옵니다. 그 뒤에 nginx에 ssl_certificate와 ssl_certificate_key를 설정해줬습니다.
```conf
listen 443 ssl default_server;
listen [::]:443 ssl default_server;
ssl_certificate /etc/letsencrypt/live/planmoji.com/fullchain.pem;
ssl_certificate_key    /etc/letsencrypt/live/planmoji.com/privkey.pem;
```

(노트에는 여기에 HTTPS가 동작하는 화면 이미지가 있었음.)
성공! 당시 발급된 인증서의 만료일은 2023-06-27이었다. 아직 HTTP -> HTTPs redirect가 안 되어있으나 HTTPS 자체는 잘 동작합니다.

[^1]: Boucheron, Brian and Jeanelle Horcasitas. "How To Create a Self-Signed SSL Certificate for Nginx in Ubuntu 20.04." DigitalOcean, 23 Sept. 2021, www.digitalocean.com/community/tutorials/how-to-create-a-self-signed-ssl-certificate-for-nginx-in-ubuntu-20-04-1.
[^2]: "About Let's Encrypt - Let's Encrypt." 29 Mar. 2023, letsencrypt.org/about.
[^3]: "Tutorial: Using Let’s Encrypt SSL certificates with your Nginx instance in Amazon Lightsail | Lightsail Documentation." 30 Mar. 2023, lightsail.aws.amazon.com/ls/docs/en_us/articles/amazon-lightsail-using-lets-encrypt-certificates-with-nginx.

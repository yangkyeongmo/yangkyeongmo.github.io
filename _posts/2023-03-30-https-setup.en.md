---
title: "Enabling HTTPS"
date: 2023-03-30 15:00
categories: dev
tags: []
lang: en
locale: en_US
ref: https-setup
permalink: /en/https-setup.html
---

There's also a way to make and use an SSL certificate yourself[^1], so I might look it up later if I get interested.
Here I use certbot. certbot is a client for Let's Encrypt[^2], a free, open-source CA run by a nonprofit called ISRG.

I tried to do it with the content below, but on lightsail something was different and the setup didn't go well.

```bash
sudo add-apt-repository ppa:certbot/certbot
```

```bash
$ sudo snap install --classic certbot
...
certbot 2.4.0 from Certbot Project (certbot-eff✓) installed
```

Turns out there seems to be a separate way to do it on Lightsail[^3]. That said, the content below is what I found out through phind.

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

If the manual setup succeeds, you get a message like the above. After that I set ssl_certificate and ssl_certificate_key on nginx.
```conf
listen 443 ssl default_server;
listen [::]:443 ssl default_server;
ssl_certificate /etc/letsencrypt/live/planmoji.com/fullchain.pem;
ssl_certificate_key    /etc/letsencrypt/live/planmoji.com/privkey.pem;
```

(The note had a screenshot of HTTPS working here.)
Success! The expiration date of the certificate issued at the time was 2023-06-27. HTTP -> HTTPS redirect still isn't in place, but HTTPS itself works fine.

[^1]: Boucheron, Brian and Jeanelle Horcasitas. "How To Create a Self-Signed SSL Certificate for Nginx in Ubuntu 20.04." DigitalOcean, 23 Sept. 2021, www.digitalocean.com/community/tutorials/how-to-create-a-self-signed-ssl-certificate-for-nginx-in-ubuntu-20-04-1.
[^2]: "About Let's Encrypt - Let's Encrypt." 29 Mar. 2023, letsencrypt.org/about.
[^3]: "Tutorial: Using Let’s Encrypt SSL certificates with your Nginx instance in Amazon Lightsail | Lightsail Documentation." 30 Mar. 2023, lightsail.aws.amazon.com/ls/docs/en_us/articles/amazon-lightsail-using-lets-encrypt-certificates-with-nginx.

#!/bin/bash

# installing configs, assuming all programs installed

# crontab configs/boks.crontab

# forever stopall
# forever start -o logs/o.log -e logs/e.log server.js
# sudo cp configs/boks.logrotate /etc/logrotate.d/

sudo cp configs/boks.nginx /etc/nginx/sites-enabled/
sudo mv /etc/nginx/sites-enabled/default configs/default.nginx
sudo service nginx restart


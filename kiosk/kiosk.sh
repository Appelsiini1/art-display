#!/usr/bin/env bash

# Disable xset blanking, let xscreensaver handle that.
xset s noblank
xset s off

# Let Chromium think it always exited cleanly.
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' '~/.config/chromium/Default/Preferences'
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' '~/.config/chromium/Default/Preferences'

# Start Chromium.
chromium --kiosk --noerrdialogs --disable-infobars --password-store=basic '### INSERT URL HERE ###' &

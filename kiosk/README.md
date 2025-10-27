# How to use

Place kiosk.sh to home folder

Place kiosk.service & xsession.target to `~/.config/systemd/user/`

Enable service:
`systemctl --user enable kiosk`

Start service:
`systemctl --user start kiosk`

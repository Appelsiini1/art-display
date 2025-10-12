# How to use

Place kiosk.sh to home folder

Place kiosk.service & xsession.target to `~/.config/systemd/user/`

Enable service:
`systemd --user enable kiosk`

Start service:
`systemd --user start kiosk`

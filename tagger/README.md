# Tagger

The tagger is a service that tags images with XMP tags using locally run classification models. Currently this is on the proof-of-concept stage. POC files can be found under the POC folder.

Intention is to use `wd-eva02-large-tagger` and `JoyTag` models simultaniously. After testing in POC, it has been concluded that while EVA-02 model is great at 2D/drawn art, JoyTag handles photos and 3D artwork better. Both models still seem to produce tags that the other one has missed, hence the future plan is to use both models simultaniously and the results run through filtering and transformation layers.
SJB Piano Keys is a pure js web component that will generate an SVG drawing of a piano keyboard.  You can specify starting and ending keys for the range that you want to have drawn.  You can also specify keys to highlight. This could be useful for visual demonstrations of how to play chords.

Use the component by first loading the script into your page:

`<script type="text/javascript" src="piano.js"></script>`

Then adding the component's markup:

`<piano-keys-sjb  startNote="A0" endNote="G8" highlightedNotes="A#0,B4,C#6"></piano-keys-sjb>`

The highlightedNotes attribute must be a comma separated list of the note names you wish to have highlighted. Highlighted notes outside the range you specified will be ignored

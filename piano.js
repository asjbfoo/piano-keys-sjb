class PianoKeyboard extends HTMLElement {
    constructor() {
        super();
        var shadowRoot = this.attachShadow({
            mode: 'open'
        });
        /* Not much to see here since per custom element spec you can't access dom attributes in the constructor.
        Since everything starts with the selected notes (in attributes), all the processing is done in connectedCallback()    */
        // set up shadow root right away so we can add midi port selector
        console.log("beginning of constructor function");

        var _endNoteName = "A0";
        var _startNoteName = "G#0";
        var _octaves;
        var _selectedMidiOut;
        var midiAccess;
        var number = 3.14;
        this.selectedOutputPort = null;
        this.initMidi = function(options) {
            console.log("in initMidi()");
            return navigator.requestMIDIAccess(options);
        };
        this.listMidiOutputsAndWaitForSelection = function() { // set up a list of possible outputs, tell user to select one
            

            //add selector for midi output port
            // to tell how many entries there are:
            var outputs = this.midiAccessObject.outputs;
            var portSelectorElement = document.createElement("select");
            portSelectorElement.id = "outputportselector";
            shadowRoot.appendChild(portSelectorElement);
            var blankOption = document.createElement("option");
            blankOption.text = output.name;
            blankOption.setAttribute("value", output.id);
            shadowRoot.getElementById("outputportselector").appendChild(blankOption);
            for (let output of outputs.values()) {
                var opt = document.createElement("option");
                opt.text = output.name;
                opt.setAttribute("value", output.id);
                shadowRoot.getElementById("outputportselector").appendChild(opt);
            }
            console.log("in dealWithMIDIOutputs()");
            portSelectorElement.addEventListener('change', function (event) {
                resolve(event.target.value);
            });
        };
        this.openOutputPort = function(portId) {

            midiAccessObject.outputs.get(portId).open();
            return this.midiAccessObject.outputs.get(portId).open();
        };
        this.assignOutputPort = function(midiPortPromise){
            selectedOutputPort = midiPortPromise.value;
        };
        this.outputNote = function(midiNoteNumber) {
            var noteOnMessage = [0x90, midiNoteNumber, 0x7f];
            var noteOffMessage = [0x80, midiNoteNumber, 0x00];
            this.selectedOutputPort.send(noteOnMessage);
            this.selectedOutputPort.send(noteOffMessage, window.performance.now() + 100); // 1/10 second later turn off the note
        };

        this.midiAccessObject = this.initMidi({"sysex": false, "software": false}).value;
        let midiOutputSelectedPromise = this.listMidiOutputsAndWaitForSelection();
        this.selecteOutputPort = midiOutputSelectedPromise.then(openOutputPort).value;


        //        .then(this.dealWithMidiOutputs).then(this.openOutputPort).then();


    }
    connectedCallback() {

        function listInputsAndOutputs(midiAccess) {
            for (var entry of midiAccess.inputs) {
                var input = entry[1];
                console.log("Input port [type:'" + input.type + "'] id:'" + input.id +
                    "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
                    "' version:'" + input.version + "'");
            }

            for (var entry of midiAccess.outputs) {
                var output = entry[1];
                console.log("Output port [type:'" + output.type + "'] id:'" + output.id +
                    "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
                    "' version:'" + output.version + "'");
            }
        }







        console.log("calling midi init");



        this.startNote = this.getAttribute("startNote");
        this.endNote = this.getAttribute("endNote");

        var numOctaves = (this.noteList.indexOf(this.endNote) - this.noteList.indexOf(this.startNote) + 2) / 12; // plus twothere as a quick & dirty way to account for last key going over the edge of the viewbox. accounts for up to two black key widths

        var i;
        var numWhiteKeyWidths = 0; // determine the number of white key widths to account for in scaling
        for (i = this.noteList.indexOf(this.startNote); i <= this.noteList.indexOf(this.endNote); i++) {
            if (this.isNoteBW(this.noteIndexToScalePosition(i)) === "W") {
                numWhiteKeyWidths++;
            }
        }
        if (this.isNoteBW(this.noteIndexToScalePosition(this.noteList.indexOf(this.startNote))) === "B") {
            numWhiteKeyWidths++; // if the first note selected is black, add one to account for the blank space that will be to the left
        }
        if (this.isNoteBW(this.noteIndexToScalePosition(this.noteList.indexOf(this.endNote))) === "B") {
            numWhiteKeyWidths++; // if the last note selected....
        }

        let setAttributes = function (el, attrs) {
            for (var key in attrs) {
                el.setAttribute(key, attrs[key]);
            }
        };

        var xKeyStartPos = 0;
        var xIncToDrawKey = 0;
        var drawWidth = 161; // from the sample piano svg I used
        var wkWidth = drawWidth / numWhiteKeyWidths;
        var bkWidth = (7 / 12) * wkWidth;
        var wkHeight = 1;
        var bkHeight = 2 / 3;
        console.log("white key width" + wkWidth);

        let xIncThisNote = function (positionInScale) {
            switch (positionInScale) {
                case 4: // with no accidental, next key is one white keuy width from the last
                    return wkWidth;
                case 9:
                    return wkWidth;
                case 1: // A
                    return 0.5 * bkWidth;
                case 2: // A#
                    return wkWidth - (0.25 * bkWidth);
                case 3: // B
                    return (0.25 * bkWidth);
                case 5: // C#
                    return (wkWidth) - ((2 / 3) * bkWidth);
                case 6:
                    return (2 / 3) * bkWidth;
                case 7:
                    return (wkWidth) - ((1 / 3) * bkWidth);
                case 8:
                    return (1 / 3) * bkWidth;
                case 10:
                    return (wkWidth) - (0.75 * bkWidth);
                case 11:
                    return 0.75 * bkWidth;
                case 12:
                    return (wkWidth) - (0.5 * bkWidth);
            }
        };



        var xDrawPos = 0;
        var startNoteNum = 0;
        var endNoteNum = 0;
        //var startSelection = document.getElementById("startNoteSelection");
        //var endSelection = document.getElementById("endNoteSelection");

        /* Create the SVG. Note that we need createElementNS, not createElement */
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 161 120");
        svg.setAttribute("stroke-width", "0.25%");

        // create note drawing using range
        var drawIndex;
        var stopIndex = this.noteList.indexOf(this.endNote);
        let blackKeys = [];
        console.log(this.noteList);
        console.log("start note attribute:");
        console.log(this.startNote);
        for (drawIndex = this.noteList.indexOf(this.startNote); drawIndex <= stopIndex; drawIndex++) {
            console.log("current index drawIndex:");
            console.log(drawIndex);
            if (drawIndex > this.noteList.indexOf(this.startNote) || this.isNoteBW(this.noteIndexToScalePosition(this.startNote)) === "B") {
                xDrawPos += xIncThisNote(this.noteIndexToScalePosition(drawIndex));
            }
            console.log("scale position of this note:");
            console.log(this.noteIndexToScalePosition(drawIndex));
            console.log("x increment to draw this note: ");
            console.log(xIncThisNote(this.noteIndexToScalePosition(drawIndex)));
            console.log("x draw start position for this note:");
            console.log(xDrawPos);
            let newKey = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            var midiNote = drawIndex + 21;
            newKey.onclick = this.outputNote(this.selectedMidiOut, midiNote);
            if (this.isNoteBW(this.noteIndexToScalePosition(drawIndex)) == "W") {
                setAttributes(newKey, {
                    "style": "fill:white;stroke:black",
                    "x": xDrawPos,
                    "y": 0,
                    "width": wkWidth,
                    "height": (wkHeight * 100).toString() + "%"
                });
                svg.appendChild(newKey); // add white keys right away sothey're on the bottom
            } else {
                setAttributes(newKey, {
                    "style": "fill:black;stroke:black",
                    "x": xDrawPos,
                    "y": 0,
                    "width": bkWidth,
                    "height": (bkHeight * 100).toString() + "%"
                });
                blackKeys.push(newKey.cloneNode()); // add the black note to the array of black note nodes to apply later
            }
        }
        blackKeys.forEach(function (blackNote) {
            svg.appendChild(blackNote);
        });




        shadowRoot.appendChild(svg);

        var style = document.createElement("style");
        style.innerHTML = ":host {display: block; position: relative; contain: content;}";
        shadowRoot.appendChild(style);

        console.log("end of connectedCallback function");
    }
    noteIndexToScalePosition(noteNumber) { // returns the position in the scale given a particular note array index
        return (noteNumber % 12) + 1; // plus one since we're using the array index (zero based indexing)
    }
    isNoteBW(positionInScale) {
        if ([1, 3, 4, 6, 8, 9, 11].includes(positionInScale)) {
            return "W";
        } else if ([2, 5, 7, 10, 12].includes(positionInScale)) {
            return "B";
        }
    }
    noteIndexToMidiNum(noteIdx) {
        return noteIdx + 21;
    }

    /* class properties */
    get noteList() { // array of note values.  scale numbering based on minor scale because life sucks
        return ['A0', 'A#0', 'B0', 'C0', 'C#0', 'D0', 'D#0', 'E0', 'F0', 'F#0', 'G0', 'G#0',
            'A1', 'A#1', 'B1', 'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1', 'G1', 'G#1',
            'A2', 'A#2', 'B2', 'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2',
            'A3', 'A#3', 'B3', 'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3',
            'A4', 'A#4', 'B4', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4',
            'A5', 'A#5', 'B5', 'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5',
            'A6', 'A#6', 'B6', 'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6',
            'A7', 'A#7', 'B7', 'C7', 'C#7', 'D7', 'D#7', 'E7', 'F7', 'F#7', 'G7', 'G#7',
            'A8', 'A#8', 'B8', 'C8', 'C#8', 'D8', 'D#8', 'E8', 'F8', 'F#8', 'G8', 'G#8'
        ];
    }
    get startNote() {
        return this._startNoteName;
    }
    set startNote(noteToSet) {
        this.setAttribute("startNote", noteToSet);
        this._startNoteName = noteToSet;
        var startNoteNum = this.noteList.indexOf(noteToSet);
    }
    get endNote() {
        return this._endNoteName;
    }
    set endNote(noteToSet) {
        this.setAttribute("endNote", noteToSet);
        this._endNoteName = noteToSet;
        var endNoteNum = this.noteList.indexOf(noteToSet);

    }
    get octaves() {
        return this.getAttribute('octaves');
    }
    set octaves(newValue) {
        // later add processing to adjust existing svg & midi stuff
        this.setAttribute('octaves', newValue);
    }
    get selectedMidiOut() {
        return this._selectedMidiOut;
    }
    set selectedMidiOut(midiPort) {
        this._selectedMidiOut = midiPort;
    }
}

customElements.define('sjb-piano-keyboard', PianoKeyboard);
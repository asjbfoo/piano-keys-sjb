class PianoKeyboard extends HTMLElement {
    static get observedAttributes() {
        return ['startNote', 'endNote', 'highlightNotes'];
    }
    constructor() {
        super();
        var shadowRoot = this.attachShadow({
            mode: 'open'
        });

        this.wkWidth = 1;  // width of the white key is the "base unit" for drawing everything else
        this.bkWidth = (7 / 12) * this.wkWidth;
        this.wkHeight = 6;
        this.bkHeight = (2 / 3)*this.wkHeight;

        /* Not much to see here since per custom element spec you can't access dom attributes in the constructor.
        Since everything starts with the selected notes (in attributes), all the processing is done in connectedCallback()    */

    }
    connectedCallback() {
        // get initial drawing parameters
        this.startNote = this.getAttribute("startNote");
        this.endNote = this.getAttribute("endNote");
        if(this.getAttribute("highlightedNotes")){
            this.highlightedNoteIndices = this.getAttribute("highlightedNotes").split(",").map(x => this.noteList.indexOf(x));
        }
        //this.highlightedNoteIndices = this.highlightedNoteNames.map(x => this.noteList.indexOf(x));
        console.log("highlighted notes:", this.highlightedNoteIndices);
        this.drawKeyboard();

        var style = document.createElement("style");
        style.innerHTML = ":host {display: block; position: relative; contain: content;}";
        this.shadowRoot.appendChild(style);
    }
    drawKeyboard(){
        let setAttributes = function (el, attrs) {
            for (var key in attrs) {
                el.setAttribute(key, attrs[key]);
            }
        };

        var xDrawPos = 0;

        // create note drawing using range
        var stopIndex = this.noteList.indexOf(this.endNote);
        let blackKeys = [];
        let whiteKeys = [];

        for (let drawIndex = this.noteList.indexOf(this.startNote); drawIndex <= stopIndex; drawIndex++) {

            if (drawIndex > this.noteList.indexOf(this.startNote) || this.isNoteBW(this.noteIndexToScalePosition(this.startNote)) === "B") {
                xDrawPos += this.xIncThisNote(this.noteIndexToScalePosition(drawIndex));
            }

            let newKey = document.createElementNS("http://www.w3.org/2000/svg", "rect");

            if (this.isNoteBW(this.noteIndexToScalePosition(drawIndex)) == "W") {
                setAttributes(newKey, {
                    "style": "fill:white;stroke:black",
                    "x": xDrawPos,
                    "y": 0,
                    "width": this.wkWidth,
                    "height": this.wkHeight
                });
                if(this.highlightedNoteIndices && this.highlightedNoteIndices.indexOf(drawIndex)>=0){
                    setAttributes(newKey,{"style": "fill:red;stroke:black"});
                }
                whiteKeys.push(newKey.cloneNode());
            } else {
                setAttributes(newKey, {
                    "style": "fill:black;stroke:black",
                    "x": xDrawPos,
                    "y": 0,
                    "width": this.bkWidth,
                    "height": this.bkHeight
                });
                if(this.highlightedNoteIndices && this.highlightedNoteIndices.indexOf(drawIndex)>=0){
                    setAttributes(newKey,{"style": "fill:red;stroke:black"});
                }
                blackKeys.push(newKey.cloneNode()); // add the black note to the array of black note nodes to apply later
            }
        }


        let viewboxWidth = this.wkWidth*this.numWhiteKeyWidths;
        /* Create the SVG. Note that we need createElementNS, not createElement */
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 " + viewboxWidth + " " + this.wkHeight);
        svg.setAttribute("stroke-width", "0.25%");
        whiteKeys.forEach(function (whiteNote){ // white keys first so that black gets draw on top
            svg.appendChild(whiteNote);
        });
        blackKeys.forEach(function (blackNote) {
            svg.appendChild(blackNote);
        });

        this.shadowRoot.appendChild(svg);
    }
    xIncThisNote(positionInScale) { // returns the width increment needed to correctly position the current note in the scale
        switch (positionInScale) {
            case 4: // with no accidental, next key is one white keuy width from the last
            case 9:
                return this.wkWidth;
            case 1: // A
                return 0.5 * this.bkWidth;
            case 2: // A#
                return this.wkWidth - (0.25 * this.bkWidth);
            case 3: // B
                return (0.25 * this.bkWidth);
            case 5: // C#
                return (this.wkWidth) - ((2 / 3) * this.bkWidth);
            case 6:
                return (2 / 3) * this.bkWidth;
            case 7:
                return (this.wkWidth) - ((1 / 3) * this.bkWidth);
            case 8:
                return (1 / 3) * this.bkWidth;
            case 10:
                return (this.wkWidth) - (0.75 * this.bkWidth);
            case 11:
                return 0.75 * this.bkWidth;
            case 12:
                return (this.wkWidth) - (0.5 * this.bkWidth);
        }
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
    }
    get endNote() {
        return this._endNoteName;
    }
    set endNote(noteToSet) {
        this.setAttribute("endNote", noteToSet);
        this._endNoteName = noteToSet;
    }
    get numWhiteKeyWidths(){
        let numKeys = 0;

        for (let i = this.noteList.indexOf(this.startNote); i <= this.noteList.indexOf(this.endNote); i++) {
            if (this.isNoteBW(this.noteIndexToScalePosition(i)) === "W") {
                numKeys++;
            }
        }
        if (this.isNoteBW(this.noteIndexToScalePosition(this.noteList.indexOf(this.startNote))) === "B") {
            numKeys++; // if the first note selected is black, add one to account for the blank space that will be to the left
        }
        if (this.isNoteBW(this.noteIndexToScalePosition(this.noteList.indexOf(this.endNote))) === "B") {
            numKeys++; // if the last note selected....
        }

        return numKeys;
    }
    get octaves() {
        return this.getAttribute('octaves');
    }
    set octaves(newValue) {
        // later add processing to adjust existing svg & midi stuff
        this.setAttribute('octaves', newValue);
    }
}

customElements.define('sjb-piano-keyboard', PianoKeyboard);
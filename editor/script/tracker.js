// tracker tool card

registerCard(function(card) {
	card.name = "tracker"; // name? tracker-tool?

	/* todo : what's the right format for this?
		- single var vs list
		- name? type, content, registry???
		- full type name vs short codes?
		- can you define new types?
	*/
	card.type = "TRK";

	var curTrack = "1"; // hack : hardcoded

	card.select = function(id) {
		curTrack = id;
		card.stop();
	};

	// draw loop
	card.draw = function() {
		if (!(curTrack in track)) {
			return;
		}

		// console.log("draw!!");

		// use default bitsy palette
		gfx.setPaletteColor(0, 0, 82, 204);
		gfx.setPaletteColor(1, 128, 159, 255);
		gfx.setPaletteColor(2, 255, 255, 255);

		// clear screen
		gfx.clear(0);

		// mock tracker ui
		for (var row = 0; row < 4; row ++) {
			for (var col = 0; col < 4; col ++) {
				var trackIndex = (row * 4) + col;
				var instruction = track[curTrack].instructions[trackIndex];

				gfx.drawPixel(1, 15 + (col * 32), 15 + (row * 32));

				if (instruction.op != "0") {
					// hacky! (many reasons including global access of trackCard)
					var offset = trackCard.getNoteCode(instruction.op);
					gfx.drawPixel(2, 15 + (col * 32) + offset, 15 + (row * 32));
				}

				var curNote = trackCard.getCurNote();
				if (curNote === trackIndex) {
					gfx.drawPixel(2, 15 + (col * 32), 15 + (row * 32) + 1);
				}
			}
		}
	};

	var lastClickedNote = 0;

	card.click = function(x, y) {
		if (!(curTrack in track)) {
			return;
		}

		// console.log("CARD CLICK!");

		// recreate note index from (x,y) coords
		var trackIndex = (Math.floor(y / 32) * 4) + Math.floor(x / 32);

		console.log("note? " + trackIndex);

		var instruction = track[curTrack].instructions[trackIndex];

		var note = "C"; // default

		if (instruction.op != "0") {
			var noteCode = trackCard.getNoteCode(instruction.op);
			noteCode = (noteCode + 1);

			if (noteCode < 12) { // todo : hardcoded max!!!
				note = trackCard.getNoteFromCode(noteCode);
			}
			else {
				note = "0"; // rest
			}
		}

		instruction.op = note;

		// my hackiest of hacky global function :(
		refreshGameData();

		lastClickedNote = trackIndex;
	};

	card.menu = function() {
		if (!(curTrack in track)) {
			return;
		}

		var trackIndex = lastClickedNote;
		var instruction = track[curTrack].instructions[trackIndex];

		if (isPreviewPlaying) {
			menu.add({
				control: "button",
				text: "stop",
				icon: "stop",
				onclick: "stop",
			});
		}
		else {
			menu.add({
				control: "button",
				text: "play",
				icon: "play",
				onclick: "play", // todo : function name? or function reference???
			});
		}

		menu.startGroup();

		menu.add({
			control: "label", // todo : naming?
			text: "NOTE: " + (instruction.op === "0" ? "REST" : instruction.op),
		});

		menu.add({
			control: "label", // todo : naming?
			text: "INDEX: " + lastClickedNote,
		});

		menu.endGroup();
	};

	var isPreviewPlaying = false;

	card.play = function() {
		console.log("PLAY!!");
		isPreviewPlaying = true;
		// hacky to do this every time
		sound.init();
		trackCard.setTrack(curTrack);
	};

	card.stop = function() {
		if (isPreviewPlaying) {
			isPreviewPlaying = false;
			sound.stopChannel();
		}
	};

	// really hacky (I don't want to use setInterval in cards)
	setInterval(function() {
		if (isPreviewPlaying) {
			trackCard.roll();
		}
	}, 500);
});
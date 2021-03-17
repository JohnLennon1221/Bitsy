/*
TODO
- why is the config separate from the card definition?
- is "register" the term I want?

categories
- should they be part of the system?
- or handled by the card?
- to what extent are they part of the engine?
- how to handle localization and icons?
- it might help to have some kind of global worldData storage thingy

todo : what about localization??

todo : what's the best way to handle config for cards (especially pre-load config? is there pre-load config?)
*/

installCard(function(card) {
	card.name = "paint";
	card.icon = "paint";
	// todo : what about title? loc?

	// todo : name? part of some larger config?
	card.sizeHint = "S"; // todo : enum? string? int?

	// naming? how are these defined? (data?)
	card.data = [ "AVA", "TIL", "SPR", "ITM", ];

	var dataStorage = {
		"AVA" : { store: sprite, filter: function(id) { return (id === "A"); }, },
		"SPR" : { store: sprite, filter: function(id) { return (id != "A"); }, },
		"TIL" : { store: tile, },
		"ITM" : { store: item, },
	};

	var curDataType = "AVA";
	var dataId = "A";
	var drawingId = null;
	var imageSource = null;
	var frameIndex = 0;

	var controlTab = "edit";

	var bigPixelSize = 16;
	var showGrid = true;

	// todo : will this be needed in the end? name?? (boot, load, start, init??)
	card.boot = function() {
		onSelect(dataId);
	};

	function drawBigPixel(index, x, y) { // todo : add square drawing func?
		for (var pY = 0; pY < bigPixelSize; pY++) {
			for (var pX = 0; pX < bigPixelSize; pX++) {
				gfx.drawPixel(index, (x * bigPixelSize) + pX, (y * bigPixelSize) + pY);
			}
		}
	}

	card.draw = function() {
		var store = dataStorage[curDataType].store;
		var data = store[dataId];

		// use current palette
		var r = room[curRoom];
		var colors = palette[r.pal].colors;
		// console.log(colors);
		gfx.setPaletteColor(0, colors[0][0], colors[0][1], colors[0][2]);
		gfx.setPaletteColor(1, colors[1][0], colors[1][1], colors[1][2]);
		gfx.setPaletteColor(2, colors[2][0], colors[2][1], colors[2][2]);

		var colorIndex = data.col;

		gfx.clear(0);

		if (imageSource) {
			for (var y = 0; y < tilesize; y++) {
				for (var x = 0; x < tilesize; x++) {
					if (imageSource[frameIndex][y][x] > 0) {
						drawBigPixel(colorIndex, x, y);
					}

					if (showGrid) {
						gfx.drawPixel(2, x * bigPixelSize, y * bigPixelSize);
					}
				}
			}
		}
	}

	var isCursorDown = false;
	var paintValue = 0;

	card.cursorDown = function(x, y) {
		isCursorDown = true;

		// convert screen coords to drawing coords
		var pX = Math.floor(x / bigPixelSize);
		var pY = Math.floor(y / bigPixelSize);

		paintValue = (imageSource[frameIndex][pY][pX] > 0) ? 0 : 1;

		imageSource[frameIndex][pY][pX] = paintValue;

		// somewhat hacky
		renderer.SetImageSource(drawingId, imageSource);

		// super hacky..
		refreshGameData();
	};

	card.cursorMove = function(x, y) {
		if (isCursorDown) {
			// convert screen coords to drawing coords
			var pX = Math.floor(x / bigPixelSize);
			var pY = Math.floor(y / bigPixelSize);

			imageSource[frameIndex][pY][pX] = paintValue;

			// somewhat hacky
			renderer.SetImageSource(drawingId, imageSource);

			// super hacky..
			refreshGameData();
		}
	};

	card.cursorUp = function(x, y) {
		isCursorDown = false;
	};

	card.menu = function() {
		var store = dataStorage[curDataType].store;
		var data = store[dataId];

		// menu.setName(data.name);

		menu.add({
			control: "tabs",
			name: "paintControlTabs", // todo : should this be generated?
			value: controlTab,
			event: "changeControlTab",
			tabs: [
				{ text: "edit", icon: "edit", value: "edit", },
				{ text: "dialog", icon: "dialog", value: "dialog", },
				{ text: "animate", icon: "sprite", value: "animation", }, // todo : needs icon
				{ text: "rules", icon: "settings", value: "rules", }, // todo : also needs icons
			],
		});

		if (controlTab === "edit") {
			menu.startGroup();

			menu.add({
				control: "toggle",
				text: "grid",
				icon: (showGrid ? "visibility" : "visibility_off"),
				value: showGrid,
				event: "toggleGrid",
			});

			menu.add({
				control: "button",
				text: "find",
				icon: "search",
				event: "openFindTool",
			});

			menu.endGroup();
		}
		else if (controlTab === "dialog") {
			if (curDataType === "SPR" || curDataType === "ITM") {
				menu.add({
					control: "dialog",
					name: "dialog",
					id: data.dlg,
				});
			}
		}
		else if (controlTab === "animation") {
			// preview
			menu.startGroup();

			menu.add({
				control: "thumbnail",
				type: curDataType, // todo : name?
				id: dataId,
				selected: true,
			});

			if (imageSource.length > 1) {
				menu.add({
					control: "button",
					icon: "delete",
					event: "deleteFrame",
				});
			}

			if (flags.SUPER_ANM || imageSource.length < shortAnimationMax) {
				menu.add({
					control: "button",
					icon: "add",
					event: "addFrame",
				});
			}

			menu.endGroup();

			// frames
			menu.startGroup();

			for (var i = 0; (i < imageSource.length) && (flags.SUPER_ANM || i < shortAnimationMax); i++) {
				menu.add({
					control: "thumbnail",
					type: curDataType, // todo : name?
					id: dataId,
					frame: i,
					value: i,
					selected: (frameIndex === i),
					event: "selectFrame",
				});
			}

			menu.endGroup();
		}
		else if (controlTab === "rules") {
			if (curDataType === "TIL") {
				menu.add({
					control: "toggle",
					text: "wall",
					icon: (data.isWall ? "wall_on" : "wall_off"),
					value: data.isWall,
					event: "toggleWall",
				});
			}
			else if (curDataType === "ITM") {
				menu.startGroup();

				menu.add({
					control: "label",
					text: "inventory:",
					icon: "item",
				});

				var inventoryCount = player().inventory[dataId];

				menu.add({
					control: "number", // todo : name? numberField, numberInput, numberPicker?
					value: (inventoryCount != undefined ? inventoryCount : 0),
					event: "onInventoryChange",
				});

				menu.add({
					control: "button",
					icon: "open_tool",
					event: "openInventoryTool",
				});

				menu.endGroup();
			}
		}
	};

	var testTabVal = 0;

	card.changeControlTab = function(value) {
		controlTab = value;
	};

	card.toggleGrid = function(value) {
		console.log("toggle grid ? " + value);
		showGrid = value;
	};

	card.openFindTool = function() {
		showPanel("paintExplorerPanel");
	};

	card.openInventoryTool = function() {
		showPanel("inventoryPanel");
	};

	card.onInventoryChange = function(value) {
		// console.log("inventory " + value);
		player().inventory[dataId] = value;
		refreshGameData();
	};

	card.selectFrame = function(value) {
		console.log("on frame? " + value);
		frameIndex = value;
	};

	card.addFrame = function() {
		var store = dataStorage[curDataType].store;
		var data = store[dataId];

		data.animation.frameIndex = 0;
		data.animation.frameCount++;
		data.animation.isAnimated = (data.animation.frameCount > 1);

		addNewFrameToDrawing(data.drw);

		// doing this all the time seems bleh
		imageSource = renderer.GetImageSource(drawingId).slice();

		frameIndex = (data.animation.frameCount - 1);
	};

	card.deleteFrame = function() {
		var store = dataStorage[curDataType].store;
		var data = store[dataId];

		// it's annoying to keep animation data in sync with the drawing
		data.animation.frameIndex = 0;
		data.animation.frameCount--;
		data.animation.isAnimated = (data.animation.frameCount > 1);

		removeLastFrameFromDrawing(data.drw);

		imageSource = renderer.GetImageSource(drawingId).slice();

		if (frameIndex >= data.animation.frameCount) {
			frameIndex = (data.animation.frameCount - 1);
		}
	};

	card.toggleWall = function(value) {
		var store = dataStorage[curDataType].store;
		var data = store[dataId];
		data.isWall = value ? value : null;
		refreshGameData();
	}

	card.prev = function() {
		if (curDataType === "AVA") {
			return;
		}

		var idList = Object.keys(dataStorage[curDataType].store);

		if (dataStorage[curDataType].filter) {
			idList = idList.filter(dataStorage[curDataType].filter);
		}

		var i = idList.indexOf(dataId);

		i--;

		if (i < 0) {
			i = (idList.length - 1);
		}

		onSelect(idList[i]);
	};

	card.next = function() {
		if (curDataType === "AVA") {
			return;
		}

		var idList = Object.keys(dataStorage[curDataType].store);

		if (dataStorage[curDataType].filter) {
			idList = idList.filter(dataStorage[curDataType].filter);
		}

		var i = idList.indexOf(dataId);

		i++;

		if (i >= idList.length) {
			i = 0;
		}

		onSelect(idList[i]);
	};

	function addDrawing(imageData) {
		// todo : make sure this works with other tools (like the find tool)

		if (curDataType === "AVA") {
			return;
		}

		var nextId;

		if (curDataType === "SPR") {
			nextId = nextSpriteId();
			makeSprite(nextId, imageData);
		}
		else if (curDataType === "TIL") {
			nextId = nextTileId();
			makeTile(nextId, imageData);
		}
		else if (curDataType === "ITM") {
			nextId = nextItemId();
			makeItem(nextId, imageData);
		}

		refreshGameData();
		onSelect(nextId);
	}

	card.add = function() {
		addDrawing();
	};

	card.copy = function() {
		if (curDataType === "AVA") {
			return;
		}

		console.log("copy!");

		var sourceImageData = renderer.GetImageSource(drawingId);
		var copiedImageData = copyDrawingData(sourceImageData);

		// tiles have extra data to copy
		var tileIsWall = false;
		if (curDataType === "TIL") {
			// hacky to reference tile store directly?
			tileIsWall = tile[dataId].isWall;
		}

		addDrawing(copiedImageData);

		// tiles have extra data to copy
		if (curDataType === "TIL") {
			tile[dataId].isWall = tileIsWall;
		}
	};

	// todo : name too short??
	card.del = function() {
		if (curDataType === "AVA") {
			return;
		}

		console.log("delete!");

		var tempId = dataId;

		card.prev();

		var store = dataStorage[curDataType].store;
		delete store[tempId];

		refreshGameData();

		// todo : bring this up to parity with old delete function
	};

	card.changeDataType = function(type) {
		console.log("data change! " + type);
		curDataType = type;

		var idList = Object.keys(dataStorage[curDataType].store);

		if (dataStorage[curDataType].filter) {
			idList = idList.filter(dataStorage[curDataType].filter);
		}

		onSelect(idList[0]);
	};

	// todo : I don't really like this function name..
	card.getDataName = function() {
		var store = dataStorage[curDataType].store;
		var data = store[dataId];
		return data.name;
	};

	card.changeDataName = function(name) {
		var store = dataStorage[curDataType].store;
		var data = store[dataId];
		data.name = name;
		refreshGameData();
	};

	function onSelect(id) {
		dataId = id;
		drawingId = dataStorage[curDataType].store[dataId].drw;
		imageSource = renderer.GetImageSource(drawingId).slice();
		frameIndex = 0;
	};

	// TODO : this might return once I have a universal way to handle data type navigation
	// card.select = function(id) {}
});
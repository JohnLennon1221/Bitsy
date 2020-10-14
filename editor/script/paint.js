/*
	PAINT
*/

function PaintTool(canvas, roomTool) {
	var self = this; // feels a bit hacky

	var paint_scale = 32;
	var curPaintBrush = 0;
	var isPainting = false;
	var drawPaintGrid = true;

	var drawingId = "A";
	var curDrawingFrameIndex = 0;

	var animationControl = new AnimationControl(
		function(index) {
			if (index != undefined && index != null) {
				curDrawingFrameIndex = index;
			}

			if (curDrawingFrameIndex >= tile[drawingId].animation.frameCount) {
				curDrawingFrameIndex = tile[drawingId].animation.frameCount - 1;
			}

			self.UpdateCanvas();
		},
		{
			framesDiv: document.getElementById("animationFrames"),
			removeButton: document.getElementById("animationRemove"),
			addButton: document.getElementById("animationAdd"),
		});

	//paint canvas & context
	canvas.width = tilesize * paint_scale;
	canvas.height = tilesize * paint_scale;
	var ctx = canvas.getContext("2d");

	// paint events
	canvas.addEventListener("mousedown", onMouseDown);
	canvas.addEventListener("mousemove", onMouseMove);
	canvas.addEventListener("mouseup", onMouseUp);
	canvas.addEventListener("mouseleave", onMouseUp);
	canvas.addEventListener("touchstart", onTouchStart);
	canvas.addEventListener("touchmove", onTouchMove);
	canvas.addEventListener("touchend", onTouchEnd);

	// TODO : 
	function onMouseDown(e) {
		e.preventDefault();
		
		if (isPlayMode) {
			return; //can't paint during play mode
		}

		console.log("PAINT TOOL!!!");
		console.log(e);

		var off = getOffset(e);

		off = mobileOffsetCorrection(off,e,(tilesize));

		var x = Math.floor(off.x);
		var y = Math.floor(off.y);

		// non-responsive version
		// var x = Math.floor(off.x / paint_scale);
		// var y = Math.floor(off.y / paint_scale);

		if (curDrawingData()[y][x] == 0) {
			curPaintBrush = 1;
		}
		else {
			curPaintBrush = 0;
		}
		curDrawingData()[y][x] = curPaintBrush;
		self.UpdateCanvas();
		isPainting = true;
	}

	function onMouseMove(e) {
		if (isPainting) {
			var off = getOffset(e);

			off = mobileOffsetCorrection(off,e,(tilesize));

			var x = Math.floor(off.x);// / paint_scale);
			var y = Math.floor(off.y);// / paint_scale);
			curDrawingData()[y][x] = curPaintBrush;
			self.UpdateCanvas();
		}
	}

	function onMouseUp(e) {
		if (isPainting) {
			isPainting = false;

			refreshGameData();

			// hacky way to force drawing to re-render
			renderer.SetImageSource(getRenderId(), getImageSource());

			events.Raise("change_drawing", { id: drawingId });

			roomTool.drawEditMap(); // TODO : events instead of direct coupling

			animationControl.RefreshFrame(curDrawingFrameIndex);
		}
	}

	function onTouchStart(e) {
		e.preventDefault();
		var fakeEvent = { target:e.target, clientX:e.touches[0].clientX, clientY:e.touches[0].clientY };
		onMouseDown(fakeEvent);
	}

	function onTouchMove(e) {
		e.preventDefault();
		var fakeEvent = { target:e.target, clientX:e.touches[0].clientX, clientY:e.touches[0].clientY };
		onMouseMove(fakeEvent);
	}

	function onTouchEnd(e) {
		e.preventDefault();
		onMouseUp();
	}

	this.UpdateCanvas = function() {
		//background
		ctx.fillStyle = "rgb("+getPal(curPal())[0][0]+","+getPal(curPal())[0][1]+","+getPal(curPal())[0][2]+")";
		ctx.fillRect(0,0,canvas.width,canvas.height);

		//pixel color
		var colorIndex = tile[drawingId].col;
		var color = getPal(curPal())[colorIndex];
		ctx.fillStyle = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";

		//draw pixels
		for (var x = 0; x < 8; x++) {
			for (var y = 0; y < 8; y++) {
				// draw alternate frame
				if (isCurDrawingAnimated() && curDrawingAltFrameData()[y][x] === 1) {
					ctx.globalAlpha = 0.3;
					ctx.fillRect(x*paint_scale,y*paint_scale,1*paint_scale,1*paint_scale);
					ctx.globalAlpha = 1;
				}
				// draw current frame
				if (curDrawingData()[y][x] === 1) {
					ctx.fillRect(x*paint_scale,y*paint_scale,1*paint_scale,1*paint_scale);
				}
			}
		}

		//draw grid
		if (drawPaintGrid) {
			ctx.fillStyle = getContrastingColor();

			for (var x = 1; x < tilesize; x++) {
				ctx.fillRect(x*paint_scale,0*paint_scale,1,tilesize*paint_scale);
			}
			for (var y = 1; y < tilesize; y++) {
				ctx.fillRect(0*paint_scale,y*paint_scale,tilesize*paint_scale,1);
			}
		}
	}

	function getImageSource() {
		return renderer.GetImageSource(tile[drawingId].drw);
	}

	function getFrameData(frameIndex) {
		return getImageSource()[frameIndex];
	}

	function getRenderId() {
		return tile[drawingId].drw;
	}

	function getDrawingType() {
		return getDrawingTypeFromId(drawingId);
	}

	function isCurDrawingAnimated() {
		return tile[drawingId].animation.isAnimated;
	}

	function curDrawingData() {
		return getFrameData(curDrawingFrameIndex);
	}

	function curDrawingAltFrameData() {
		var frameIndex = Math.max(0, curDrawingFrameIndex - 1);
		return getFrameData(frameIndex);
	}

	// TODO : rename!
	this.ReloadDrawing = function() {
		// animation UI
		animationControl.ChangeDrawing(drawingId);

		// wall UI
		if (tile[drawingId].type === "TIL") {
			document.getElementById("wall").setAttribute("style", "display:block;");
			updateWallCheckboxOnCurrentTile();
		}
		else {
			document.getElementById("wall").setAttribute("style", "display:none;");
		}

		// dialog UI
		if (drawingId === "A" || tile[drawingId].type === "TIL") {
			document.getElementById("dialog").setAttribute("style", "display:none;");
		}
		else {
			document.getElementById("dialog").setAttribute("style", "display:block;");
			reloadDialogUI();
		}

		if (tile[drawingId].type === "ITM") {
			document.getElementById("showInventoryButton").setAttribute("style","display:inline-block;");
		}
		else {
			document.getElementById("showInventoryButton").setAttribute("style","display:none;");
		}

		updateDrawingNameUI(drawingId != "A");

		var disableForAvatarElements = document.getElementsByClassName("disableForAvatar");
		for (var i = 0; i < disableForAvatarElements.length; i++) {
			disableForAvatarElements[i].disabled = drawingId === "A";
		}

		// update paint canvas
		self.UpdateCanvas();
	}

	// TODO : remove this after moving everything to events
	this.SelectDrawing = function(id) {
		events.Raise("select_drawing", { id: id });
	}

	events.Listen("select_drawing", function(e) {
		drawingId = e.id;
		curDrawingFrameIndex = 0;
		self.ReloadDrawing();
	});

	this.ToggleWall = function(checked) {
		if (getDrawingType() != TileType.Tile) {
			return;
		}

		if (tile[drawingId].isWall == undefined || tile[drawingId].isWall == null) {
			// clear out any existing wall settings for this tile in any rooms
			// (this is back compat for old-style wall settings)
			for (roomId in room) {
				var i = room[roomId].walls.indexOf(drawingId);
				
				if (i > -1) {
					room[roomId].walls.splice(i , 1);
				}
			}
		}

		tile[drawingId].isWall = checked;

		refreshGameData();

		// TODO : move this global function into paint.js
		if (toggleWallUI != null && toggleWallUI != undefined) {
			toggleWallUI(checked);
		}
	}

	// TODO : who uses this? once in reload paint dialog ui, and once in this file... probably could be removed
	this.GetCurTile = function() {
		return tile[drawingId];
	}

	this.NewDrawing = function(type, imageData) {
		var nextId = nextObjectId(sortedBase36IdList(tile)); // TODO : helper function?
		createTile(nextId, type, { drawingData:imageData });
		refreshGameData();

		events.Raise("add_drawing", { id: nextId });
		self.SelectDrawing(nextId);

		// TODO : hack... replace with event hookup
		if (type === "ITM") {
			updateInventoryItemUI();
		}
	}

	// TODO : hacky global document stuff
	this.ShowNewDrawingControls = function(isVisible) {
		document.getElementById("paintEditRoot").style.display = isVisible ? "none" : "block";
		document.getElementById("addDrawingOptions").style.display = isVisible ? "flex" : "none";
	}

	this.DuplicateDrawing = function() {
		var sourceImageData = renderer.GetImageSource(getRenderId());

		var type = tile[drawingId].type;

		// tiles have extra data to copy
		var tileIsWall = false;
		if (getDrawingType() === TileType.Tile) {
			tileIsWall = tile[drawingId].isWall;
		}

		this.NewDrawing(type, sourceImageData);

		// HACKY
		// tiles have extra data to copy
		if (getDrawingType() === TileType.Tile) {
			tile[drawingId].isWall = tileIsWall;
			// make sure the wall toggle gets updated
			self.ReloadDrawing();
		}
	}

	// TODO - may need to extract this for different tools beyond the paint tool (put it in core.js?)
	this.DeleteDrawing = function() {
		if (getDrawingType() == TileType.Avatar) {
			alert("You can't delete the player! :(");
			return;
		}

		if (confirm("Are you sure you want to delete this drawing?")) {
			if (getDrawingType() == TileType.Tile) {
				findAndReplaceTileInAllRooms(drawingId, "0");
			}
			else if (getDrawingType() == TileType.Item) {
				removeAllItems(drawingId);
			}
			// TODO : remove all sprite locations

			var dlgId = tile[drawingId].dlg;
			if (dlgId && dialog[dlgId]) {
				delete dialog[dlgId];
			}

			delete tile[drawingId];

			events.Raise("delete_drawing", { id: drawingId });

			// TODO : replace these things with events!
			refreshGameData();
			// TODO RENDERER : refresh images
			roomTool.drawEditMap();
			updateInventoryItemUI();

			nextDrawing();

			// TODO : add event
			// self.explorer.DeleteThumbnail(drawingId);
			// self.explorer.ChangeSelection(drawingId);
		}
	}

	function updateWallCheckboxOnCurrentTile() {
		var isCurTileWall = false;

		if (tile[drawingId].isWall == undefined || tile[drawingId].isWall == null ) {
			if (room[curRoom]) {
				isCurTileWall = (room[curRoom].walls.indexOf(drawingId) != -1);
			}
		}
		else {
			isCurTileWall = tile[drawingId].isWall;
		}

		if (isCurTileWall) {
			document.getElementById("wallCheckbox").checked = true;
			iconUtils.LoadIcon(document.getElementById("wallCheckboxIcon"), "wall_on");
		}
		else {
			document.getElementById("wallCheckbox").checked = false;
			iconUtils.LoadIcon(document.getElementById("wallCheckboxIcon"), "wall_off");
		}
	}

	function getCurPaintModeStr() {
		var drawingType = getDrawingType();
		if (drawingType == TileType.Sprite || drawingType == TileType.Avatar) {
			return localization.GetStringOrFallback("sprite_label", "sprite");
		}
		else if (drawingType == TileType.Item) {
			return localization.GetStringOrFallback("item_label", "item");
		}
		else if (drawingType == TileType.Tile) {
			return localization.GetStringOrFallback("tile_label", "tile");
		}
	}

	function updateDrawingNameUI() {
		var til = tile[drawingId];

		if (til.id === "A") { // hacky
			document.getElementById("drawingName").value = "avatar"; // TODO: localize
		}
		else if (til.name != null) {
			document.getElementById("drawingName").value = til.name;
		}
		else {
			document.getElementById("drawingName").value = "";
		}

		document.getElementById("drawingName").placeholder = getCurPaintModeStr() + " " + til.id;

		document.getElementById("drawingName").readOnly = til.id === "A";
	}

	this.SetPaintGrid = function(isVisible) {
		drawPaintGrid = isVisible;
		iconUtils.LoadIcon(document.getElementById("paintGridIcon"), isVisible ? "visibility" : "visibility_off");
		self.UpdateCanvas();
	}

	// let's us restore the animation during the session if the user wants it back
	function cacheDrawingAnimation(drawing, sourceId) {
		var imageSource = renderer.GetImageSource(sourceId);
		var oldImageData = imageSource.slice(0);
		drawing.cachedAnimation = [ oldImageData[1] ]; // ah the joys of javascript
	}

	function restoreDrawingAnimation(sourceId, cachedAnimation) {
		var imageSource = renderer.GetImageSource(sourceId);
		for (f in cachedAnimation) {
			imageSource.push( cachedAnimation[f] );
		}
		renderer.SetImageSource(sourceId, imageSource);
	}

	/* NAVIGATION */
	function nextDrawing() {
		var ids = sortedDrawingIdList();

		var index = ids.indexOf(drawingId);
		index = (index + 1) % ids.length;

		self.SelectDrawing(ids[index]);
	}
	this.NextDrawing = nextDrawing;

	function prevDrawing() {
		var ids = sortedDrawingIdList();

		var index = ids.indexOf(drawingId);
		index = (index - 1) % ids.length;
		if (index < 0) {
			index = (ids.length - 1); // loop
		}

		self.SelectDrawing(ids[index]);
	}
	this.PrevDrawing = prevDrawing;

	events.Listen("change_room_palette", function(event) {
		self.UpdateCanvas();
		animationControl.RefreshAll();
	});

	events.Listen("select_room", function(event) {
		self.UpdateCanvas();
		animationControl.RefreshAll();
	});
}

function AnimationControl(onSelectFrame, controls) {
	var drawingId = null;
	var previewImg = null;
	var thumbnailImgList = [];

	var animationThumbnailRenderer = CreateDrawingThumbnailRenderer();

	function renderThumbnail(img, id, options) {
		function onRenderFinished(uri) {
			img.src = uri;
		};

		animationThumbnailRenderer.Render(id, onRenderFinished, options);
	}

	function refreshFrame(frameIndex) {
		renderThumbnail(previewImg, drawingId, { isAnimated: true, cacheId: "anim_" + drawingId + "_preview", });

		for (var i = 0; i < tile[drawingId].animation.frameCount; i++) {
			if (frameIndex === undefined || frameIndex === null || frameIndex === i) {
				console.log("REFRESH " + i);
				var thumbnailImg = thumbnailImgList[i];
				renderThumbnail(thumbnailImg, drawingId, { frameIndex: i, cacheId: "anim_" + drawingId + "_" + i, });
			}
		}
	}

	// todo : add animation caching back? or just replace with an undo/redo system?
	function addNewFrameToDrawing() {
		// copy last frame data into new frame
		var prevFrameIndex = tile[drawingId].animation.frameCount - 1;
		var imageSource = renderer.GetImageSource(drawingId);
		var prevFrame = imageSource[prevFrameIndex];
		var newFrame = [];
		for (var y = 0; y < tilesize; y++) {
			newFrame.push([]);
			for (var x = 0; x < tilesize; x++) {
				newFrame[y].push(prevFrame[y][x]);
			}
		}
		imageSource.push(newFrame);
		renderer.SetImageSource(drawingId, imageSource);

		// update animation settings
		tile[drawingId].animation.frameCount++;
		tile[drawingId].animation.isAnimated = (tile[drawingId].animation.frameCount > 1);

		//refresh data model
		refreshGameData();

		// add thumbnail
		var newFrameIndex = tile[drawingId].animation.frameCount - 1;
		createThumbnailImg(newFrameIndex);
		refreshFrame(newFrameIndex);

		// refresh paint UI
		onSelectFrame(tile[drawingId].animation.frameCount - 1);

		// reset animations
		resetAllAnimations();
	}

	controls.addButton.onclick = addNewFrameToDrawing;

	function removeLastFrameFromDrawing() {
		if (tile[drawingId].animation.frameCount <= 1) {
			return;
		}

		// remove last frame!
		var imageSource = renderer.GetImageSource(drawingId);
		renderer.SetImageSource(drawingId, imageSource.slice(0, imageSource.length - 1));

		// update animation settings
		tile[drawingId].animation.frameCount--;
		tile[drawingId].animation.isAnimated = (tile[drawingId].animation.frameCount > 1);

		//refresh data model
		refreshGameData();

		// remove thumbnail
		controls.framesDiv.removeChild(thumbnailImgList[thumbnailImgList.length - 1]);
		thumbnailImgList = thumbnailImgList.slice(0, thumbnailImgList.length - 1);
		refreshFrame(0);

		// refresh paint UI
		onSelectFrame();

		// reset animations
		resetAllAnimations();
	}

	controls.removeButton.onclick = removeLastFrameFromDrawing;

	function createThumbnailImg(index) {
		var thumbnailImg = document.createElement("img");
		thumbnailImg.classList.add("animationThumbnail");
		thumbnailImg.onclick = function() { onSelectFrame(index); };
		thumbnailImgList.push(thumbnailImg);
		controls.framesDiv.appendChild(thumbnailImg);		
	}

	this.ChangeDrawing = function(id) {
		drawingId = id;

		controls.framesDiv.innerHTML = "";

		previewImg = document.createElement("img");
		previewImg.classList.add("animationThumbnail");
		previewImg.classList.add("preview");
		controls.framesDiv.appendChild(previewImg);

		thumbnailImgList = [];

		for (var i = 0; i < tile[drawingId].animation.frameCount; i++) {
			createThumbnailImg(i);
		}

		refreshFrame();
	}

	this.RefreshFrame = function(index) {
		refreshFrame(index);
	}

	this.RefreshAll = function() {
		refreshFrame();
	}
}

/*
 PAINT UTILS
*/

function getDrawingTypeFromId(drawingId) {
	if (drawingId === "A") {
		return TileType.Avatar;
	}
	else if (tile[drawingId].type === "SPR") {
		return TileType.Sprite;
	}
	else if (tile[drawingId].type === "TIL") {
		return TileType.Tile;
	}
	else if (tile[drawingId].type === "ITM") {
		return TileType.Item;
	}

	return null; // uh oh
}

/* 
 GLOBAL UI HOOKS
 TODO : someday I'll get rid of these, right? who knows...
*/

function on_toggle_animated() {
	paintTool.SetAnimated(document.getElementById("animatedCheckbox").checked);
}

function on_paint_frame1() {
	paintTool.SelectAnimationFrame(0);
}

function on_paint_frame2() {
	paintTool.SelectAnimationFrame(1);
}

function next() {
	paintTool.NextDrawing();
}

function prev() {
	paintTool.PrevDrawing();
}

function on_toggle_wall(e) {
	paintTool.ToggleWall(e.target.checked);
}

function newDrawing() {
	paintTool.ShowNewDrawingControls(true);
}

// TODO : these global hookups are weird to me...
// I think maybe the buttons should be generated by the tool
function newTile() {
	paintTool.NewDrawing("TIL");
	paintTool.ShowNewDrawingControls(false);
}

function newSprite() {
	paintTool.NewDrawing("SPR");
	paintTool.ShowNewDrawingControls(false);
}

function newItem() {
	paintTool.NewDrawing("ITM");
	paintTool.ShowNewDrawingControls(false);
}

function cancelNewDrawing() {
	paintTool.ShowNewDrawingControls(false);
}

function duplicateDrawing() {
	paintTool.DuplicateDrawing();
}

function deleteDrawing() {
	paintTool.DeleteDrawing();
}

function togglePaintGrid(e) {
	paintTool.SetPaintGrid(e.target.checked);
}

function on_drawing_name_change() {
	var str = document.getElementById("drawingName").value;
	var til = paintTool.GetCurTile();
	var oldName = til.name;

	if (str.length > 0) {
		til.name = str;
	}
	else {
		til.name = null;
	}

	updateNamesFromCurData()

	// make sure items referenced in scripts update their names
	if (til.type === TileType.Item) {
		// console.log("SWAP ITEM NAMES");

		var ItemNameSwapVisitor = function() {
			var didSwap = false;
			this.DidSwap = function() { return didSwap; };

			this.Visit = function(node) {
				// console.log("VISIT!");
				// console.log(node);

				if (node.type != "function" || node.name != "item") {
					return; // not the right type of node
				}
				
				if (node.arguments.length <= 0 || node.arguments[0].type != "literal") {
					return; // no argument available
				}

				if (node.arguments[0].value === oldName) { // do swap
					node.arguments[0].value = newName;
					didSwap = true;
				}
			};
		};

		var newName = til.name;

		if (newName === null || newName === undefined) {
			newName = til.id;
		}

		if (oldName === null || oldName === undefined) {
			oldName = til.id;
		}

		if (newName != oldName) {
			for (dlgId in dialog) {
				var dialogScript = scriptInterpreter.Parse(dialog[dlgId].src);
				var visitor = new ItemNameSwapVisitor();

				dialogScript.VisitAll(visitor);

				if (visitor.DidSwap()) {
					var newDialog = dialogScript.Serialize();

					if (newDialog.indexOf("\n") > -1) {
						newDialog = '"""\n' + newDialog + '\n"""';
					}

					dialog[dlgId].src = newDialog;
				}
			}
		}

		updateInventoryItemUI();
	}

	refreshGameData();

	events.Raise("change_drawing_name", { id: til.id, name: til.name });
}
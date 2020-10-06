// todo : update for new names, new functions, etc
var expressionDescriptionMap = {
	"END" : {
		GetName : function() {
			return localization.GetStringOrFallback("function_end_name", "end");
		},
		GetDescription : function() {
			return localization.GetStringOrFallback("function_end_description", "stop the game");
		},
		GetHelpText : function() {
			return localization.GetStringOrFallback(
				"function_end_help",
				"the game stops immediately, but if there is dialog after this action, it will still play");
		},
		parameters : [],
	},
	"EXT" : {
		GetName : function() {
			return localization.GetStringOrFallback("function_exit_name", "exit");
		},
		GetDescription : function() {
			return localization.GetStringOrFallback("function_exit_description", "move player to _ at (_,_)[ with effect _]");
		},
		parameters : [
			{ types: ["room", "string", "symbol"], index: 0, name: "room", },
			{ types: ["number", "symbol"], index: 1, name: "x", },
			{ types: ["number", "symbol"], index: 2, name: "y", },
			{ types: ["transition", "string", "symbol"], index: 3, name: "transition effect", },
		],
		commands : [RoomMoveDestinationCommand],
	},
	// todo : add to text effects instead? along with BR?
	// "PG" : {
	// 	GetName : function() {
	// 		return localization.GetStringOrFallback("function_pg_name", "pagebreak");
	// 	},
	// 	GetDescription : function() {
	// 		return localization.GetStringOrFallback("function_pg_description", "start a new page of dialog");
	// 	},
	// 	GetHelpText : function() {
	// 		return localization.GetStringOrFallback(
	// 			"function_pg_help",
	// 			"if there are actions after this one, they will start after the player presses continue");
	// 	},
	// 	parameters : [],
	// },
	"ITM" : {
		GetName : function() {
			return localization.GetStringOrFallback("function_item_name", "item");
		},
		GetDescription : function() {
			// todo : update text to match "is set to" convention?
			return localization.GetStringOrFallback("function_item_description", "_ in inventory[ = _]");
		},
		parameters : [
			{ types: ["item", "string", "symbol"], index: 0, name: "item", },
			{ types: ["number", "symbol"], index: 1, name: "amount", },
		],
	},
	"SAY" : {
		GetName : function() {
			return localization.GetStringOrFallback("function_say_name", "say");
		},
		GetDescription : function() {
			return localization.GetStringOrFallback("function_print_description", "print _ in the dialog box");
		},
		parameters : [
			{ types: ["string", "symbol"], index: 0, name: "output", },
		],
	},
	"SET" : {
		GetName : function() { return "set variable value"; }, // todo : localize
		GetDescription : function() { return "variable _ is set to _" }, // todo : localize
		parameters : [
			{ types: ["symbol"], index: 0, name: "variable", },
			{ types: ["number", "boolean", "string", "symbol", "list"], index: 1, name: "value", },
		],
	},
	"@" : {
		GetName : function() { return "slot"; }, // todo : localize // todo : name? slot? attribute? property? field?
		GetDescription : function() { return "slot _ of _[ is set to _]"; },
		parameters : [
			// todo : create special parameter type for sprite references
			{ types: ["symbol", "list"], index: 0, name: "box", }, // todo : name?
			{ types: ["symbol", "list"], index: 1, name: "slot", }, // todo : name?
			{ types: ["number", "boolean", "string", "symbol", "list"], index: 2, name: "value", },
		],
		// TODO : add help text?
	},
	"HOP" : {
		GetName : function() { return "hop"; }, // todo : localize
		GetDescription : function() { return "move _ one space _"; },
		parameters : [
			// todo : create special parameter type for sprite references
			{ types: ["symbol", "list"], index: 0, name: "sprite", },
			{ types: ["direction", "string", "symbol", "list"], index: 1, name: "direction", },
		],
	},
	"NEW" : {
		GetName : function() { return "new sprite"; }, // todo : localize
		GetDescription : function() { return "make new sprite _[ at _][,_]"; }, // todo : localize
		parameters : [
			// todo : create special parameter type for sprite IDs
			{ types: ["string", "symbol", "list"], index: 0, name: "sprite", },
			// todo : it would be better if these were added all at once instead of piecemeal (command like room pos?)
			{ types: ["number", "symbol", "list"], index: 1, name: "x", },
			{ types: ["number", "symbol", "list"], index: 2, name: "y", },
		],
	},
	"BYE" : {
		GetName : function() { return "remove sprite"; }, // todo : localize
		GetDescription : function() { return "goodbye, sprite _!"; }, // todo : localize todo : swap title and description?
		parameters : [
			// todo : create special parameter type for sprite IDs
			{ types: ["string", "symbol", "list"], index: 0, name: "sprite", },
		],
	},
	"PAL" : {
		GetName : function() { return "palette swap"; }, // todo : localize
		GetDescription : function() { return "change palette of current room to _"; }, // todo : localize
		parameters : [
			// todo : create special parameter type for palette IDs
			{ types: ["string", "symbol", "list"], index: 0, name: "palette", },
		],
	},
	// todo : do I really want this function?
	"NOT" : {
		GetName : function() { return "not"; }, // todo : localize
		GetDescription : function() { return "not _"; },
		parameters : [
			{ types: ["number", "boolean", "string", "symbol", "list"], index: 0, name: "value", },
		],
		// TODO : add help text?
	},
	"default" : {
		GetName : function() { return "function"; }, // todo : localize
		GetDescription : function() {
			return "evaluate _ with input:"; // todo : localize
		},
		parameters: [ { types: ["symbol"], index: -1, name: "name", } ], // todo : the -1 is hacky
	},
};

var isHelpTextOn = true;

// TODO : support UNDESCRIBED functions! need a new editor?
function ExpressionEditor(expression, parentEditor, isInline) {
	if (isInline === undefined || isInline === null) {
		isInline = false;
	}

	var self = this;

	// todo : what if the first expression is not a symbol?
	var symbol = expression.list[0].value;
	var descriptionId = symbol in expressionDescriptionMap ? symbol : "default";
	var paramLength = expression.list.length - 1;

	var div = document.createElement(isInline ? "span" : "div");
	div.classList.add("functionEditor");
	div.classList.add("actionEditor");
	if (isInline) {
		div.classList.add("inline");
	}

	var orderControls = null;

	if (!isInline) {
		orderControls = new OrderControls(this, parentEditor);
		div.appendChild(orderControls.GetElement());
	}

	if (!isInline) {
		var titleText = expressionDescriptionMap[descriptionId].GetName();
		var titleDiv = document.createElement("div");
		titleDiv.classList.add("actionTitle");
		titleDiv.innerText = titleText;
		div.appendChild(titleDiv);
	}

	var descriptionDiv = document.createElement(isInline ? "span" : "div");
	div.appendChild(descriptionDiv);

	var customCommandsDiv = null;
	var addParameterDiv = null;
	var helpTextDiv = null;
	var helpTextContent = null;
	var hasHelpText = false;

	var editParameterTypes = false;
	var toggleParameterTypesButton = document.createElement("button");
	toggleParameterTypesButton.title = "toggle editing parameter types";
	toggleParameterTypesButton.appendChild(iconUtils.CreateIcon("settings"));
	toggleParameterTypesButton.onclick = function() {
		editParameterTypes = !editParameterTypes;
		CreateExpressionDescription(true);
	}

	if (!isInline) {
		customCommandsDiv = document.createElement("div");
		customCommandsDiv.style.marginTop = "5px"; // hack : need to hide these spacers...
		div.appendChild(customCommandsDiv);

		addParameterDiv = document.createElement("div");
		addParameterDiv.style.marginTop = "5px"; // hack
		div.appendChild(addParameterDiv);

		helpTextDiv = document.createElement("div");
		helpTextDiv.classList.add("helpText");
		helpTextDiv.style.display = "none";
		div.appendChild(helpTextDiv);
		var helpTextImgHolder = document.createElement("div");
		helpTextImgHolder.classList.add("helpTextImg");
		helpTextDiv.appendChild(helpTextImgHolder);
		var catImg = document.createElement("img");
		catImg.src = "image/cat.svg";
		helpTextImgHolder.appendChild(catImg);
		helpTextContent = document.createElement("div");
		helpTextContent.classList.add("helpTextContent");
		helpTextDiv.appendChild(helpTextContent);

		var helpTextFunc = expressionDescriptionMap[descriptionId].GetHelpText;
		hasHelpText = helpTextFunc != undefined && helpTextFunc != null;
		if (hasHelpText) {
			helpTextContent.innerText = helpTextFunc();
		}

		var toggleHelpButton = document.createElement("button");
		toggleHelpButton.title = "turn help text on/off";
		toggleHelpButton.appendChild(iconUtils.CreateIcon("help"));
		toggleHelpButton.onclick = function() {
			isHelpTextOn = !isHelpTextOn;

			// hacky
			if (hasHelpText && isHelpTextOn) {
				helpTextDiv.style.display = "flex";
			}
			else {
				helpTextDiv.style.display = "none";
			}
		}

		var customControls = orderControls.GetCustomControlsContainer();
		customControls.appendChild(toggleParameterTypesButton);

		if (hasHelpText) {
			customControls.appendChild(toggleHelpButton);
		}
	}

	// TODO : populate default values!!
	var curParameterEditors = [];
	var curCommandEditors = []; // store custom commands
	function CreateExpressionDescription(isEditable) {
		curParameterEditors = [];
		descriptionDiv.innerHTML = "";

		if (!isInline) {
			customCommandsDiv.innerHTML = "";
			addParameterDiv.innerHTML = "";
		}

		var descriptionText = expressionDescriptionMap[descriptionId].GetDescription();
		var descriptionTextSplit = descriptionText.split("_");

		console.log(descriptionTextSplit);

		var i = 0;

		for (; i < descriptionTextSplit.length; i++) {
			var descriptionSpan = document.createElement("span");
			descriptionDiv.appendChild(descriptionSpan);

			var text = descriptionTextSplit[i];
			if (text.indexOf("][") >= 0) {
				// hacky way to handle multiple optional parameters D:
				var optionalTextMidSplit = text.split("][");

				var prevParam = expressionDescriptionMap[descriptionId].parameters[i-1];
				if (paramLength > prevParam.index) {
					descriptionSpan.innerText = optionalTextMidSplit[0];
				}

				var nextParam = expressionDescriptionMap[descriptionId].parameters[i];
				if (paramLength > nextParam.index && optionalTextStartSplit.length > 1) {
					descriptionSpan.innerText += optionalTextMidSplit[1];
				}
			}
			else if (text.indexOf("[") >= 0) { // optional parameter text start
				var optionalTextStartSplit = text.split("[");
				descriptionSpan.innerText = optionalTextStartSplit[0];
				var nextParam = expressionDescriptionMap[descriptionId].parameters[i];
				if (paramLength > nextParam.index && optionalTextStartSplit.length > 1) {
					descriptionSpan.innerText += optionalTextStartSplit[1];
				}
			}
			else if (text.indexOf("]") >= 0) { // optional parameter text end
				var optionalTextEndSplit = text.split("]");
				var prevParam = expressionDescriptionMap[descriptionId].parameters[i-1];
				if (paramLength > prevParam.index) {
					descriptionSpan.innerText = optionalTextEndSplit[0];
				}
			}
			else { // regular description text
				descriptionSpan.innerText = text;
			}

			if (i < descriptionTextSplit.length - 1) {
				var parameterInfo = expressionDescriptionMap[descriptionId].parameters[i];

				if (paramLength > parameterInfo.index) {
					var parameterEditor = new ParameterEditor(
						expression,
						parameterInfo.index + 1,
						self,
						parameterInfo.types.concat(["list"]),
						isEditable && !(parameterInfo.doNotEdit),
						!isInline && editParameterTypes,
						function(expressionString, onAcceptHandler) {
							parentEditor.OpenExpressionBuilder(expressionString, onAcceptHandler);
						});

					curParameterEditors.push(parameterEditor);
					descriptionDiv.appendChild(parameterEditor.GetElement());
				}
				else if (!isInline && isEditable && paramLength == parameterInfo.index && parameterInfo.name) {
					function createAddParameterHandler(expression, parameterInfo) {
						return function() {
							expression.list.push(CreateDefaultArgNode(parameterInfo.types[0]));
							CreateExpressionDescription(true);
							parentEditor.NotifyUpdate();
						}
					}

					var addParameterButton = document.createElement('button');
					addParameterButton.innerHTML = iconUtils.CreateIcon("add").outerHTML + parameterInfo.name;
					addParameterButton.onclick = createAddParameterHandler(expression, parameterInfo);
					addParameterDiv.appendChild(addParameterButton);
				}
			}
		}

		// add any additional parameters that go beyond the defined description
		i -= (descriptionId === "default" ? 2 : 1); // ok this is pretty awkward to me
		var inputSeperator = " ";

		for (; i < paramLength; i++) {
			var spaceSpan = document.createElement("span");
			spaceSpan.innerText = inputSeperator;
			descriptionDiv.appendChild(spaceSpan);

			var parameterEditor = new ParameterEditor(
				expression,
				i + 1,
				self, // or should this be parent editor?
				["number", "text", "boolean", "symbol", "list"],
				isEditable,
				!isInline && editParameterTypes,
				function(expressionString, onAcceptHandler) {
					parentEditor.OpenExpressionBuilder(expressionString, onAcceptHandler);
				});

			curParameterEditors.push(parameterEditor);
			descriptionDiv.appendChild(parameterEditor.GetElement());

			inputSeperator = ", ";
		}


		if (!isInline) {
			// clean up and reset command editors
			for (var i = 0; i < curCommandEditors.length; i++) {
				curCommandEditors[i].OnDestroy();
			}
			curCommandEditors = [];

			// add custom edit commands
			var commands = expressionDescriptionMap[descriptionId].commands;
			if (isEditable && commands) {
				for (var i = 0; i < commands.length; i++) {
					var commandEditor = new commands[i](expression, parentEditor, CreateExpressionDescription);
					curCommandEditors.push(commandEditor);
					customCommandsDiv.appendChild(commandEditor.GetElement());
				}
			}

			if (isEditable && hasHelpText && isHelpTextOn) {
				helpTextDiv.style.display = "flex";
			}
			else {
				helpTextDiv.style.display = "none";
			}
		}
	}

	CreateExpressionDescription(false);

	this.GetElement = function() {
		return div;
	}

	this.GetNodes = function() {
		return [node];
	}

	this.NotifyUpdate = function() {
		parentEditor.NotifyUpdate();
	}

	this.OpenExpressionBuilder = function(expressionString, onAcceptHandler) {
		parentEditor.OpenExpressionBuilder(expressionString, onAcceptHandler);
	}

	AddSelectionBehavior(
		this,
		function() { CreateExpressionDescription(true); }, /*onSelect*/
		function() { /*onDeselect*/
			for (var i = 0; i < curParameterEditors.length; i++) {
				if (curParameterEditors[i].Deselect) {
					curParameterEditors[i].Deselect();
				}
			}

			CreateExpressionDescription(false);
		},
		isInline);

	this.OnNodeEnter = function(event) {
		if (!isInline && event.id === node.GetId()) {
			div.classList.add("executing");
		}
	};

	this.OnNodeExit = function(event) {
		if (!isInline && (event.id === node.GetId() || event.forceClear)) {
			div.classList.remove("executing");
			div.classList.remove("executingLeave");
			void div.offsetWidth; // hack to force reflow to allow animation to restart
			div.classList.add("executingLeave");
			setTimeout(function() { div.classList.remove("executingLeave") }, 1100);
		}
	};
}

function RoomMoveDestinationCommand(functionNode, parentEditor, createExpressionDescriptionFunc) {
	var listener = new EventListener(events);

	var isMoving = false;

	var commandDescription = iconUtils.CreateIcon("set_exit_location").outerHTML + " "
		+ localization.GetStringOrFallback("exit_destination_move", "move destination");

	var moveCommand = document.createElement("div");

	var moveMessageSpan = document.createElement("span");
	moveCommand.appendChild(moveMessageSpan);

	var moveButton = document.createElement("button");
	moveButton.innerHTML = commandDescription;
	moveButton.title = "click to select new destination";
	moveButton.onclick = function() {
		isMoving = !isMoving;

		if (isMoving) {
			moveMessageSpan.innerHTML = "<i>" + localization.GetStringOrFallback("marker_move_click", "click in room") + "</i> ";
			moveButton.innerHTML = iconUtils.CreateIcon("cancel").outerHTML + " "
				+ localization.GetStringOrFallback("action_cancel", "cancel");
			events.Raise("disable_room_tool"); // TODO : don't know if I like this design
		}
		else {
			moveMessageSpan.innerHTML = "";
			moveButton.innerHTML = commandDescription;
			events.Raise("enable_room_tool");
		}
	}
	moveCommand.appendChild(moveButton);

	listener.Listen("click_room", function(event) {
		if (isMoving) {
			roomId = event.roomId;
			roomPosX = event.x;
			roomPosY = event.y;

			functionNode.args.splice(0, 1, scriptUtils.CreateStringLiteralNode(roomId));
			functionNode.args.splice(1, 1, scriptUtils.CreateLiteralNode(roomPosX));
			functionNode.args.splice(2, 1, scriptUtils.CreateLiteralNode(roomPosY));

			isMoving = false;
			moveMessageSpan.innerHTML = "";
			moveButton.innerHTML = commandDescription;

			createExpressionDescriptionFunc(true);
			parentEditor.NotifyUpdate();
			events.Raise("enable_room_tool");
		}
	});

	this.GetElement = function() {
		return moveCommand;
	}

	this.OnDestroy = function() {
		listener.UnlistenAll();
	}
}
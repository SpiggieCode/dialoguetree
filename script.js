
  (() => {
    let nodeCount = 0;
    let characterCount = 0;
    let nodes = [];
    let connectors = [];
    let characters = [];

    const SPACING_X = 300; // Horizontal spacing from the parent node
    const SPACING_Y = 100; // Vertical spacing between sibling nodes

    const storyMap = document.getElementById("storyMap");
    let connectorCanvas = document.getElementById("connectorCanvas");
    const storyMapWrapper = document.getElementById("storyMapWrapper");

    // Sidebar elements
    const characterList = document.getElementById("characterList");
    const addCharacterButton = document.getElementById("addCharacterButton");
    const exportButton = document.getElementById("exportButton");
    const importButton = document.getElementById("importButton");
    const importFileInput = document.getElementById("importFileInput");

    addCharacterButton.addEventListener("click", addCharacter);
    exportButton.addEventListener("click", exportData);
    importButton.addEventListener("click", () => importFileInput.click());
    importFileInput.addEventListener("change", importData);

    window.addEventListener("resize", () => {
      updateStoryMapSize();
      updateConnectorPositions();
    });

    // Panning functionality
    let isPanning = false;
    let panStartX, panStartY, scrollStartX, scrollStartY;

    storyMapWrapper.addEventListener("mousedown", (e) => {
      if (e.button === 1 || e.ctrlKey) {
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        scrollStartX = storyMapWrapper.scrollLeft;
        scrollStartY = storyMapWrapper.scrollTop;
        storyMapWrapper.style.cursor = "grabbing";
        e.preventDefault();
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (isPanning) {
        const dx = panStartX - e.clientX;
        const dy = panStartY - e.clientY;
        storyMapWrapper.scrollLeft = scrollStartX + dx;
        storyMapWrapper.scrollTop = scrollStartY + dy;
      }
    });

    document.addEventListener("mouseup", () => {
      if (isPanning) {
        isPanning = false;
        storyMapWrapper.style.cursor = "grab";
      }
    });

    // Random Color Generator
    function getRandomColor() {
      const randomInt = Math.floor(Math.random() * 16777215);
      const hexColor = `#${randomInt.toString(16).padStart(6, "0")}`;
      return hexColor;
    }

    // Add Character Function
    function addCharacter() {
      const characterId = `char-${characterCount++}`;
      const character = {
        id: characterId,
        name: `Character ${characterCount}`,
        color: getRandomColor(),
        description: "",
      };
      characters.push(character);
      createCharacterItem(character);
      updateStoryMapSize();
    }

    function createCharacterItem(character) {
      const characterItem = document.createElement("div");
      characterItem.className = "character-item";
      characterItem.id = character.id;
      characterItem.style.backgroundColor = character.color;

      const characterHeader = document.createElement("div");
      characterHeader.className = "character-header";

      const nameInput = document.createElement("input");
      nameInput.className = "character-name";
      nameInput.value = character.name;

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-character";
      deleteButton.innerHTML = getTrashIconSVG();

      characterHeader.appendChild(nameInput);
      characterHeader.appendChild(deleteButton);

      const descriptionArea = document.createElement("textarea");
      descriptionArea.placeholder = "Character Description";
      descriptionArea.value = character.description;

      // Updated Color Icon and Input
      const colorIconWrapper = document.createElement("div");
      colorIconWrapper.className = "color-icon-wrapper";

      const colorIcon = document.createElement("div");
      colorIcon.className = "color-icon";
      colorIcon.innerHTML = getColorIconSVG();

      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = character.color;
      colorInput.className = "color-input";

      colorIconWrapper.appendChild(colorIcon);
      colorIconWrapper.appendChild(colorInput);

      characterItem.appendChild(characterHeader);
      characterItem.appendChild(descriptionArea);
      characterItem.appendChild(colorIconWrapper);

      characterList.appendChild(characterItem);

      // **Prevent Drag and Drop on Input Fields**
      // Disable dragging from input fields
      nameInput.setAttribute("draggable", "false");
      descriptionArea.setAttribute("draggable", "false");

      // Prevent dropping on input fields
      nameInput.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      nameInput.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      descriptionArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      descriptionArea.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      // **Event listeners**
      nameInput.addEventListener("input", (e) => {
        character.name = e.target.value;
        updateNodesByCharacterId(character.id, { character: character.name });
        updateAllCharacterSelects();
      });

      colorInput.addEventListener("input", (e) => {
        character.color = e.target.value;
        characterItem.style.backgroundColor = character.color;
        updateNodesByCharacterId(character.id, { color: character.color });
        updateAllCharacterSelects();
      });

      descriptionArea.addEventListener("input", (e) => {
        character.description = e.target.value;
      });

      deleteButton.addEventListener("click", () => {
        deleteCharacter(character.id);
      });

      // Make the character item draggable
      characterItem.setAttribute("draggable", "true");
      characterItem.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", character.id);
        const dragIcon = characterItem.cloneNode(true);
        dragIcon.style.position = "absolute";
        dragIcon.style.top = "-1000px";
        dragIcon.style.left = "-1000px";
        document.body.appendChild(dragIcon);
        e.dataTransfer.setDragImage(dragIcon, 0, 0);
        setTimeout(() => document.body.removeChild(dragIcon), 0);
      });
    }

    function getTrashIconSVG() {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
          <path d="M320-120q-33 0-56.5-23.5T240-200v-520h-40v-80h200v-40h160v40h200v80h-40v520q0 33-23.5 56.5T640-120H320Zm320-600H320v520h320v-520ZM400-300h80v-320h-80v320Zm160 0h80v-320h-80v320Z"/>
        </svg>
      `;
    }

    function deleteCharacter(characterId) {
      // Remove character from characters array
      const index = characters.findIndex((c) => c.id === characterId);
      if (index !== -1) {
        characters.splice(index, 1);
      }

      // Remove all nodes associated with this character
      const nodesToDelete = nodes.filter((n) => n.characterId === characterId);
      nodesToDelete.forEach((n) => {
        deleteNode(n.id);
      });

      // Remove character item from DOM
      const characterItem = document.getElementById(characterId);
      if (characterItem) {
        characterItem.parentNode.removeChild(characterItem);
      }

      // Update character selects
      updateAllCharacterSelects();
      updateStoryMapSize();
    }

    function getOrCreateDefaultCharacter(id, name, color, description) {
      let character = characters.find((c) => c.id === id);
      if (!character) {
        character = { id, name, color, description };
        characters.push(character);
        createCharacterItem(character);
      }
      return character;
    }


// Define Node Types and Their Icons
const NODE_TYPES = {
  dialogue: {
    name: "Dialogue",
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
        <path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/>
      </svg>
    `
  },
  action: {
    name: "Action",
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
        <path d="M520-40v-240l-84-80-40 176-276-56 16-80 192 40 64-324-72 28v136h-80v-188l158-68q35-15 51.5-19.5T480-720q21 0 39 11t29 29l40 64q26 42 70.5 69T760-520v80q-66 0-123.5-27.5T540-540l-24 120 84 80v300h-80Zm20-700q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z"/>
      </svg>
    `
  },
  choice: {
    name: "Choice",
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
        <path d="M160-440v-80h304l200-200H560v-80h240v240h-80v-104L496-440H160Zm400 280v-80h104L536-366l58-58 126 128v-104h80v240H560Z"/>
      </svg>
    `
  }
};

// Helper function to get icon HTML based on node type
function getNodeTypeIcon(type) {
  return NODE_TYPES[type] ? NODE_TYPES[type].icon : '';
}


function addNode(type = 'dialogue', character, parentIds = [], x = null, y = null, dialogue = "") {
  const nodeId = `node-${nodeCount++}`;
  const node = {
    id: nodeId,
    type: type, // Default type is 'dialogue'
    dialogue: dialogue,
    parentIds: parentIds,
    characterId: character.id,
    character: character.name,
    color: character.color,
  };

  nodes.push(node);
  const nodeElement = createNodeElement(node);

  if (x !== null && y !== null) {
    nodeElement.style.left = `${x}px`;
    nodeElement.style.top = `${y}px`;
  } else {
    positionNodeElement(nodeElement, node.parentIds);
  }

  storyMap.appendChild(nodeElement);

  // Draw connectors for all parents
  node.parentIds.forEach((parentId) => {
    const parentElement = document.getElementById(parentId);
    if (parentElement) {
      drawConnector(parentElement, nodeElement);
    }
  });

  updateStoryMapSize();
  setTimeout(() => scrollToNode(nodeElement), 0);

  updateCanvasMessage();
}


    function createNodeElement(node) {
      const nodeElement = document.createElement("div");
      nodeElement.className = `node ${node.type}`;
      nodeElement.id = node.id;
      nodeElement.style.backgroundColor = node.color;
    
      // Header with character selection
      const header = document.createElement("div");
      header.className = "header";
    
      const characterSelect = document.createElement("select");
      characterSelect.className = "character-select";
    
      updateCharacterSelectOptions(characterSelect, node.characterId);
    
      characterSelect.addEventListener("change", (e) => {
        const selectedCharacter = characters.find((c) => c.id === e.target.value);
        if (selectedCharacter) {
          Object.assign(node, {
            characterId: selectedCharacter.id,
            character: selectedCharacter.name,
            color: selectedCharacter.color,
          });
          nodeElement.style.backgroundColor = node.color;
          updateStoryMapSize();
        }
      });
    
      header.appendChild(characterSelect);
    
      // Type Icon
      const typeIconWrapper = document.createElement("div");
      typeIconWrapper.className = "type-icon";
      typeIconWrapper.innerHTML = getNodeTypeIcon(node.type);
      typeIconWrapper.title = "Change Node Type"; // Tooltip
    
      // Event listener for changing node type
      typeIconWrapper.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering other events
    
        // Create a dropdown menu for selecting node type
        const typeSelect = document.createElement("select");
        typeSelect.className = "type-select";
    
        // Populate dropdown with node types
        for (const [type, data] of Object.entries(NODE_TYPES)) {
          const option = document.createElement("option");
          option.value = type;
          option.textContent = data.name;
          if (type === node.type) {
            option.selected = true;
          }
          typeSelect.appendChild(option);
        }
    
        // Position the dropdown near the icon
        typeSelect.style.position = "absolute";
        typeSelect.style.zIndex = "1000";
        typeSelect.style.top = `${typeIconWrapper.offsetTop + typeIconWrapper.offsetHeight}px`;
        typeSelect.style.left = `${typeIconWrapper.offsetLeft}px`;
    
        // Append to the node
        nodeElement.appendChild(typeSelect);
    
        // Focus on the dropdown
        typeSelect.focus();
    
        // Handle type change
        typeSelect.addEventListener("change", (event) => {
          const newType = event.target.value;
          if (NODE_TYPES[newType]) {
            // Update node type in data
            node.type = newType;
    
            // Update node class for styling
            nodeElement.className = `node ${node.type}`;
    
            // Update node color if needed
            // nodeElement.style.backgroundColor = NODE_TYPES[newType].color; // Optional
    
            // Update the type icon
            typeIconWrapper.innerHTML = getNodeTypeIcon(node.type);
    
            // Remove the dropdown
            nodeElement.removeChild(typeSelect);
    
            // Update connector positions in case node type affects layout
            updateConnectorPositions();
          }
        });
    
        // Remove dropdown if clicked outside
        document.addEventListener("click", function onClickOutside(event) {
          if (!nodeElement.contains(event.target)) {
            if (nodeElement.contains(typeSelect)) {
              nodeElement.removeChild(typeSelect);
            }
            document.removeEventListener("click", onClickOutside);
          }
        });
      });
    
      header.appendChild(typeIconWrapper);
    
      // Dialogue textarea
      const dialogueTextArea = document.createElement("textarea");
      dialogueTextArea.className = "dialogue-text";
      dialogueTextArea.placeholder = "Dialogue";
      dialogueTextArea.value = node.dialogue; // Set initial value
      dialogueTextArea.addEventListener("input", (e) => {
        node.dialogue = e.target.value; // Store raw text
      });
    
      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-node";
      deleteButton.innerHTML = getTrashIconSVG();
    
      // Assemble node element
      nodeElement.appendChild(header);
      nodeElement.appendChild(dialogueTextArea);
      nodeElement.appendChild(deleteButton);
    
      positionNodeElement(nodeElement, node.parentIds);
      makeDraggable(nodeElement);
      enableNodeDrop(nodeElement);
    
      deleteButton.addEventListener("click", () => {
        deleteNode(node.id);
      });
    
      return nodeElement;
    }
    

    function deleteNode(nodeId) {
      // Remove connectors associated with this node
      const connectorsToRemove = connectors.filter(
        (c) => c.parentElement.id === nodeId || c.childElement.id === nodeId
      );
      connectorsToRemove.forEach((c) => {
        connectorCanvas.removeChild(c.line);
      });

      // Remove connectors from connectors array
      connectors = connectors.filter(
        (c) => c.parentElement.id !== nodeId && c.childElement.id !== nodeId
      );

      // Remove node from nodes array
      const index = nodes.findIndex((n) => n.id === nodeId);
      if (index !== -1) {
        nodes.splice(index, 1);
      }

      // Remove node element from DOM
      const nodeElement = document.getElementById(nodeId);
      if (nodeElement) {
        nodeElement.parentNode.removeChild(nodeElement);
      }

      // Update connector positions
      updateConnectorPositions();

      // Update the canvas message
      updateCanvasMessage();

      updateStoryMapSize();
    }

    function updateCanvasMessage() {
      const canvasMessage = document.getElementById("canvasMessage");
      if (nodes.length === 0) {
        canvasMessage.style.display = "block";
      } else {
        canvasMessage.style.display = "none";
      }
    }

    function updateCharacterSelectOptions(selectElement, selectedCharacterId) {
      selectElement.innerHTML = "";
      characters.forEach((character) => {
        const option = document.createElement("option");
        option.value = character.id;
        option.textContent = character.name;
        if (character.id === selectedCharacterId) {
          option.selected = true;
        }
        selectElement.appendChild(option);
      });
    }

    function updateAllCharacterSelects() {
      document.querySelectorAll(".character-select").forEach((select) => {
        const currentCharacterId = select.value;
        updateCharacterSelectOptions(select, currentCharacterId);
        const character = characters.find((c) => c.id === currentCharacterId);
        if (character) {
          select.style.backgroundColor = character.color;
        }
      });
    }

    function updateNodesByCharacterId(characterId, updates) {
      nodes.forEach((node) => {
        if (node.characterId === characterId) {
          Object.assign(node, updates);
          const nodeElement = document.getElementById(node.id);
          if (nodeElement) {
            const characterSelect = nodeElement.querySelector(".character-select");
            //characterSelect.style.backgroundColor = node.color;
            nodeElement.style.backgroundColor = node.color;
          }
        }
      });
    }

    function getColorIconSVG() {
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
          <path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-220 40q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120-160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm200 0q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120 160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z"/>
        </svg>
      `;
    }

    function positionNodeElement(element, parentIds) {
      if (parentIds && parentIds.length > 0) {
        const parentElement = document.getElementById(parentIds[0]);
        if (parentElement) {
          const parentLeft = parseFloat(parentElement.style.left) || 0;
          const parentTop = parseFloat(parentElement.style.top) || 0;

          // Find existing children of the parent node
          const existingChildren = nodes.filter((n) => n.parentIds.includes(parentElement.id));
          const childCount = existingChildren.length;

          // Calculate new position based on the number of existing children
          const newLeft = parentLeft + SPACING_X;
          const newTop = parentTop + 50 + childCount * SPACING_Y;

          element.style.left = `${newLeft}px`;
          element.style.top = `${newTop}px`;
        } else {
          // If parent element not found, position as root node
          positionNodeElement(element, []);
        }
      } else {
        const rootNodes = nodes.filter(
          (n) => (!n.parentIds || n.parentIds.length === 0) && n.id !== element.id
        );
        const lastRootElement = rootNodes.length
          ? document.getElementById(rootNodes[rootNodes.length - 1].id)
          : null;
        const newTop = lastRootElement
          ? parseFloat(lastRootElement.style.top) +
            lastRootElement.offsetHeight +
            SPACING_Y
          : 100;

        element.style.left = "100px";
        element.style.top = `${newTop}px`;
      }
    }

    function drawConnector(parentElement, childElement) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("stroke", "white");
      line.setAttribute("stroke-width", "2");

      updateConnectorPosition(line, parentElement, childElement);
      connectorCanvas.appendChild(line);
      connectors.push({ line, parentElement, childElement });
    }

    function updateConnectorPosition(line, parentElement, childElement) {
      const parentRect = parentElement.getBoundingClientRect();
      const childRect = childElement.getBoundingClientRect();
      const canvasRect = connectorCanvas.getBoundingClientRect();

      const parentX = parentRect.left + parentRect.width / 2 - canvasRect.left;
      const parentY = parentRect.top + parentRect.height / 2 - canvasRect.top;
      const childX = childRect.left + childRect.width / 2 - canvasRect.left;
      const childY = childRect.top + childRect.height / 2 - canvasRect.top;

      line.setAttribute("x1", parentX);
      line.setAttribute("y1", parentY);
      line.setAttribute("x2", childX);
      line.setAttribute("y2", childY);
    }

    function updateConnectorPositions() {
      connectors.forEach(({ line, parentElement, childElement }) => {
        if (
          document.body.contains(parentElement) &&
          document.body.contains(childElement)
        ) {
          updateConnectorPosition(line, parentElement, childElement);
        } else {
          // Remove the connector if one of the elements is missing
          connectorCanvas.removeChild(line);
        }
      });

      // Clean up connectors array
      connectors = connectors.filter(
        ({ parentElement, childElement }) =>
          document.body.contains(parentElement) && document.body.contains(childElement)
      );
    }

    function makeDraggable(element) {
      let offsetX, offsetY;
      let isDragging = false;
      let isResizing = false;

      const resizeHandle = document.createElement("div");
      resizeHandle.className = "resize-handle";
      element.appendChild(resizeHandle);

      // Resizing
      resizeHandle.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        isResizing = true;
        const initialWidth = element.offsetWidth;
        const initialHeight = element.offsetHeight;
        const initialMouseX = e.clientX;
        const initialMouseY = e.clientY;

        function onMouseMove(event) {
          const width = Math.max(initialWidth + (event.clientX - initialMouseX), 250);
          const height = Math.max(initialHeight + (event.clientY - initialMouseY), 200);

          element.style.width = `${width}px`;
          element.style.height = `${height}px`;

          updateConnectorPositions();
        }

        function onMouseUp() {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          isResizing = false;
          updateStoryMapSize();
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });

      // Dragging
      element.addEventListener("mousedown", (e) => {
        if (
          isResizing ||
          e.button !== 0 ||
          e.target.closest("select, input, textarea, button")
        )
          return;

        isDragging = true;
        const rect = element.getBoundingClientRect();
        const containerRect = storyMap.getBoundingClientRect();

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        // Store original position
        element.dataset.originalLeft = element.style.left;
        element.dataset.originalTop = element.style.top;

        function onMouseMove(event) {
          if (!isDragging) return;

          const x = event.clientX - containerRect.left - offsetX;
          const y = event.clientY - containerRect.top - offsetY;
          element.style.left = `${x}px`;
          element.style.top = `${y}px`;

          updateConnectorPositions();
          updateStoryMapSize();
        }

        function onMouseUp() {
          isDragging = false;
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);

          // **Removed Collision Detection and Linking**

          // Update the stored original position to the new position
          element.dataset.originalLeft = element.style.left;
          element.dataset.originalTop = element.style.top;

          updateConnectorPositions();
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    }

    function linkNodes(parentElement, childElement) {
      const childNode = nodes.find((n) => n.id === childElement.id);
      const parentNode = nodes.find((n) => n.id === parentElement.id);

      if (childNode && parentNode) {
        if (!childNode.parentIds) {
          childNode.parentIds = [];
        }

        if (!childNode.parentIds.includes(parentNode.id)) {
          // Add the parentId to the childNode's parentIds array
          childNode.parentIds.push(parentNode.id);

          // Draw new connector
          drawConnector(parentElement, childElement);
        }
      }
    }

    function enableNodeDrop(nodeElement) {
      nodeElement.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        nodeElement.classList.add("drag-over");
      });
    
      nodeElement.addEventListener("dragleave", (e) => {
        e.preventDefault();
        e.stopPropagation();
        nodeElement.classList.remove("drag-over");
      });
    
      nodeElement.addEventListener("drop", (e) => {
        e.stopPropagation();
        e.preventDefault();
        nodeElement.classList.remove("drag-over");
        storyMap.classList.remove("drag-over");
        const characterId = e.dataTransfer.getData("text/plain");
        const character = characters.find((c) => c.id === characterId);
    
        if (character) {
          const parentId = nodeElement.id;
          // Set the default type to 'dialogue' when dropping onto a node
          addNode("dialogue", character, [parentId]);
        }
      });
    }
    

    // Enable drop on the storyMap (canvas)
    storyMap.addEventListener("dragover", (e) => {
      e.preventDefault();
      storyMap.classList.add("drag-over");
    });

    storyMap.addEventListener("dragleave", (e) => {
      e.preventDefault();
      storyMap.classList.remove("drag-over");
    });

    storyMap.addEventListener("drop", (e) => {
      e.preventDefault();
      storyMap.classList.remove("drag-over");
      const characterId = e.dataTransfer.getData("text/plain");
      const character = characters.find((c) => c.id === characterId);

      if (character) {
        const rect = storyMap.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addNode("dialogue", character, [], x, y);
      }
    });

    function updateStoryMapSize() {
      let maxRight = 0;
      let maxBottom = 0;

      nodes.forEach((node) => {
        const element = document.getElementById(node.id);
        const left = parseFloat(element.style.left) || 0;
        const top = parseFloat(element.style.top) || 0;
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        maxRight = Math.max(maxRight, left + width);
        maxBottom = Math.max(maxBottom, top + height);
      });

      const padding = 200;
      const viewportWidth = storyMapWrapper.clientWidth;
      const viewportHeight = storyMapWrapper.clientHeight;

      let newWidth = Math.max(maxRight + padding, viewportWidth);
      let newHeight = Math.max(maxBottom + padding, viewportHeight);

      const threshold = 100;
      if (maxRight + threshold > newWidth - padding) newWidth += 500;
      if (maxBottom + threshold > newHeight - padding) newHeight += 500;

      if (nodes.length === 0) {
        newWidth = viewportWidth;
        newHeight = viewportHeight;
      }

      storyMap.style.width = `${newWidth}px`;
      storyMap.style.height = `${newHeight}px`;

      connectorCanvas.setAttribute("width", newWidth);
      connectorCanvas.setAttribute("height", newHeight);
    }

    function scrollToNode(nodeElement) {
      const rect = nodeElement.getBoundingClientRect();
      const containerRect = storyMapWrapper.getBoundingClientRect();

      const offsetX = rect.left - containerRect.left;
      const offsetY = rect.top - containerRect.top;

      storyMapWrapper.scrollTo({
        left:
          storyMapWrapper.scrollLeft +
          offsetX -
          storyMapWrapper.clientWidth / 2 +
          nodeElement.offsetWidth / 2,
        top:
          storyMapWrapper.scrollTop +
          offsetY -
          storyMapWrapper.clientHeight / 2 +
          nodeElement.offsetHeight / 2,
        behavior: "smooth",
      });
    }

    // Initialize default characters with random colors
    const playerCharacter = {
      id: "player",
      name: "Player",
      color: getRandomColor(),
      description: "Player placeholder",
    };
    const npcCharacter = {
      id: "npc",
      name: "NPC",
      color: getRandomColor(),
      description: "NPC placeholder",
    };
    characters.push(playerCharacter, npcCharacter);
    createCharacterItem(playerCharacter);
    createCharacterItem(npcCharacter);

    // Update all character selects and set initial canvas size
    updateAllCharacterSelects();
    updateStoryMapSize();
    updateCanvasMessage();

    function exportData() {
      const exportObject = {
        characters: characters.map((char) => ({
          id: char.id,
          name: char.name,
          color: char.color,
          description: char.description,
        })),
        nodes: nodes.map((node) => {
          const nodeElement = document.getElementById(node.id);
          return {
            id: node.id,
            type: node.type, // Ensure type is exported
            dialogue: node.dialogue,
            parentIds: node.parentIds,
            characterId: node.characterId,
            position: {
              left: parseFloat(nodeElement.style.left) || 0,
              top: parseFloat(nodeElement.style.top) || 0,
            },
            size: {
              width: parseInt(nodeElement.style.width) || nodeElement.offsetWidth,
              height: parseInt(nodeElement.style.height) || nodeElement.offsetHeight,
            },
          };
        }),
      };
    
      const dataStr = JSON.stringify(exportObject, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
    
      // Create a link and trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = "dialogue_tree.json";
      a.click();
      URL.revokeObjectURL(url);
    }    

    // Import Data Function
    function importData(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const data = JSON.parse(e.target.result);
          loadImportedData(data);
        } catch (error) {
          alert("Invalid JSON file.");
          console.error("Error parsing JSON:", error);
        } finally {
          // Reset the file input
          importFileInput.value = "";
        }
      };
      reader.readAsText(file);
    }

    function loadImportedData(data) {
      // Clear existing data
      clearAllData();
    
      // Load Characters
      characters = [];
      characterCount = 0;
      data.characters.forEach((charData) => {
        const character = {
          id: charData.id,
          name: charData.name,
          color: charData.color,
          description: charData.description,
        };
        characters.push(character);
        createCharacterItem(character);
    
        // Update characterCount if necessary
        const idNumber = parseInt(charData.id.split("-")[1]);
        if (!isNaN(idNumber) && idNumber >= characterCount) {
          characterCount = idNumber + 1;
        }
      });
    
      // Load Nodes
      nodes = [];
      nodeCount = 0;
      data.nodes.forEach((nodeData) => {
        const character = characters.find((c) => c.id === nodeData.characterId);
        if (character) {
          const node = {
            id: nodeData.id,
            type: nodeData.type, // Ensure type is loaded
            dialogue: nodeData.dialogue,
            parentIds: nodeData.parentIds,
            characterId: nodeData.characterId,
            character: character.name,
            color: character.color,
          };
          nodes.push(node);
          const nodeElement = createNodeElement(node);
    
          // Set node position
          nodeElement.style.left = `${nodeData.position.left}px`;
          nodeElement.style.top = `${nodeData.position.top}px`;
    
          // Set node size
          if (nodeData.size) {
            nodeElement.style.width = `${nodeData.size.width}px`;
            nodeElement.style.height = `${nodeData.size.height}px`;
          }
    
          storyMap.appendChild(nodeElement);
    
          // Update nodeCount if necessary
          const idNumber = parseInt(nodeData.id.split("-")[1]);
          if (!isNaN(idNumber) && idNumber >= nodeCount) {
            nodeCount = idNumber + 1;
          }
        }
      });
    
      // Draw connectors
      nodes.forEach((node) => {
        const nodeElement = document.getElementById(node.id);
        node.parentIds.forEach((parentId) => {
          const parentElement = document.getElementById(parentId);
          if (parentElement) {
            drawConnector(parentElement, nodeElement);
          }
        });
      });
    
      updateAllCharacterSelects();
      updateStoryMapSize();
      updateCanvasMessage();
    }
    

    function clearAllData() {
      // Clear nodes and connectors
      nodes.slice().forEach((node) => { // Use slice() to clone the array
        deleteNode(node.id);
      });
      nodes = [];
      connectors = [];

      // Clear characters
      characters = [];
      characterList.innerHTML = "";

      // Clear the story map
      storyMap.innerHTML = '<svg id="connectorCanvas"></svg><div id="canvasMessage">Drag a character from the sidebar onto the screen to start a dialogue tree.<br />Drop a character card onto an existing card to link them.</div>';
      connectorCanvas = document.getElementById("connectorCanvas"); // Re-select the connectorCanvas
    }
  })();

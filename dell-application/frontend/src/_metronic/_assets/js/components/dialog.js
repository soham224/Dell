"use strict";

// Class definition
const KTDialog = function(element, options) {
  ////////////////////////////
  // ** Private variables  ** //
  ////////////////////////////
  let the = this;

  if (!element) {
    return;
  }

  // Initialize options and state
  _initializeOptionsAndState(element, options);

  // Construct class
  _construct();

  ///////////////////////
  // ** Public API  ** //
  ///////////////////////

  // Plugin API
  the.open = function() {
    the.element.style.display = "block";
    the.state.isOpen = true;
  };

  the.close = function() {
    the.element.style.display = "none";
    the.state.isOpen = false;
  };

  the.destroy = function() {
    the.element.parentNode.removeChild(the.element);
  };
};

let _initializeOptionsAndState = function(element, options) {
  let defaultOptions = {
    width: 500,
    height: 400,
    position: {
      top: 100,
      left: 100
    },
    buttons: [],
    title: "Dialog",
    content: "",
    draggable: true,
    resizable: true,
    modal: false,
    autoOpen: true,
    closeOnEscape: true,
    closeOnClickOutside: true
  };

  the.element = element;
  the.options = KTUtil.deepExtend({}, defaultOptions, options);
  the.state = {
    isOpen: false,
    isDragging: false,
    isResizing: false,
    dragOffset: { x: 0, y: 0 },
    resizeOffset: { x: 0, y: 0 }
  };

  KTUtil.data(the.element).set("dialog", the);
};

let _construct = function() {
  if (KTUtil.data(the.element).has("dialog")) {
    // the is already defined in the outer scope, no need to reassign
  } else {
    _init();
  }
};

let _init = function() {
  _build();
  _bind();

  if (the.options.autoOpen) {
    the.open();
  }
};

let _build = function() {
  // Create dialog structure
  const dialog = document.createElement("div");
  dialog.className = "kt-dialog";
  dialog.style.width = the.options.width + "px";
  dialog.style.height = the.options.height + "px";
  dialog.style.position = "absolute";
  dialog.style.top = the.options.position.top + "px";
  dialog.style.left = the.options.position.left + "px";
  dialog.style.display = "none";

  // Create header
  const header = document.createElement("div");
  header.className = "kt-dialog__header";
  header.innerHTML = `<h3 class="kt-dialog__title">${the.options.title}</h3>`;

  // Create content
  const content = document.createElement("div");
  content.className = "kt-dialog__content";
  content.innerHTML = the.options.content;

  // Create footer
  const footer = document.createElement("div");
  footer.className = "kt-dialog__footer";

  // Add buttons
  the.options.buttons.forEach(button => {
    const btn = document.createElement("button");
    btn.className = "btn " + (button.class || "btn-secondary");
    btn.innerHTML = button.text;
    btn.onclick = button.click;
    footer.appendChild(btn);
  });

  // Append elements
  dialog.appendChild(header);
  dialog.appendChild(content);
  dialog.appendChild(footer);

  // Replace original element
  element.parentNode.replaceChild(dialog, element);
  the.element = dialog;
};

let _bind = function() {
  if (the.options.draggable) {
      _makeDraggable();
  }
  if (the.options.resizable) {
      _makeResizable();
  }
  _addDocumentListeners();
  if (the.options.closeOnEscape) {
      _addCloseOnEscapeListener();
  }
  if (the.options.closeOnClickOutside) {
      _addCloseOnClickOutsideListener();
  }
};

let _makeDraggable = function() {
  const header = the.element.querySelector(".kt-dialog__header");
  header.style.cursor = "move";
  header.addEventListener("mousedown", _onDragStart);
};

let _onDragStart = function(e) {
  const header = the.element.querySelector(".kt-dialog__header");
  if (e.target === header || e.target.parentNode === header) {
      the.state.isDragging = true;
      the.state.dragOffset = {
          x: e.clientX - the.element.offsetLeft,
          y: e.clientY - the.element.offsetTop
      };
  }
};

let _makeResizable = function() {
  const resizer = document.createElement("div");
  resizer.className = "kt-dialog__resizer";
  the.element.appendChild(resizer);
  resizer.addEventListener("mousedown", _onResizeStart);
};

let _onResizeStart = function(e) {
  the.state.isResizing = true;
  the.state.resizeOffset = {
      x: e.clientX - the.element.offsetWidth,
      y: e.clientY - the.element.offsetHeight
  };
};

let _addDocumentListeners = function() {
  document.addEventListener("mousemove", _onMouseMove);
  document.addEventListener("mouseup", _onMouseUp);
};

let _onMouseMove = function(e) {
  if (the.state.isDragging) {
      the.element.style.left = (e.clientX - the.state.dragOffset.x) + "px";
      the.element.style.top = (e.clientY - the.state.dragOffset.y) + "px";
  }
  if (the.state.isResizing) {
      the.element.style.width = (e.clientX - the.state.resizeOffset.x) + "px";
      the.element.style.height = (e.clientY - the.state.resizeOffset.y) + "px";
  }
};

let _onMouseUp = function() {
  the.state.isDragging = false;
  the.state.isResizing = false;
};

let _addCloseOnEscapeListener = function() {
  document.addEventListener("keydown", function(e) {
      if (e.key === 'Escape' && the.state.isOpen) {
          the.close();
      }
  });
};

let _addCloseOnClickOutsideListener = function() {
  document.addEventListener("mousedown", function(e) {
      if (the.state.isOpen && !the.element.contains(e.target)) {
          the.close();
      }
  });
};

// Static methods
KTDialog.getInstance = function(element) {
  if (element && KTUtil.data(element).has("dialog")) {
    return KTUtil.data(element).get("dialog");
  } else {
    return null;
  }
};

// Create instances
KTDialog.createInstances = function(selector = '[data-kt-dialog="true"]') {
  let elements = document.body.querySelectorAll(selector);
  if (elements && elements.length > 0) {
    for (let i = 0, len = elements.length; i < len; i++) {
      instances.push(new KTDialog(elements[i]));
    }
  }
};

// Global initialization
KTDialog.init = function() {
  KTDialog.createInstances();
};

// Webpack support
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = KTDialog;
}

// Create instances
KTDialog.createInstances();

// Export KTUtil
export default KTDialog;
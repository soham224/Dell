"use strict";

// Class definition
const KTImageInput = function(element, options) {
  let the = this;
  if (!element) return;

  let defaultOptions = {
    width: 200,
    height: 200,
    quality: 0.8,
    allowedTypes: ["image/jpeg", "image/png", "image/gif"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    showPreview: true,
    showRemove: true,
    showCancel: true,
    showUpload: true,
    showError: true,
    showSuccess: true,
    showLoading: true,
    showProgress: true,
    showFileInfo: true,
    showFileSize: true,
    showFileType: true,
    showFileName: true,
    showFileDimensions: true,
    showFileDimensionsOnError: true,
    showFileDimensionsOnSuccess: true,
    showFileDimensionsOnLoading: true,
    showFileDimensionsOnProgress: true,
    showFileDimensionsOnRemove: true,
    showFileDimensionsOnCancel: true,
    showFileDimensionsOnUpload: true
  };
  the.options = KTUtil.deepExtend({}, defaultOptions, options);
  the.element = element;
  the.state = {
    file: null,
    preview: null,
    error: null,
    success: null,
    loading: false,
    progress: 0
  };

  // Build UI
  buildUI(the.element, the.options);

  // Bind events
  bindEvents(the, showError, showSuccess, showLoading, hideLoading, updateProgress, removeFile, cancelUpload, uploadFile);

  // Public API
  the.update = function() { updatePreview(the); updateFileInfo(the); };
  the.remove = function() { removeFile(the); };
  the.cancel = function() { cancelUpload(the); };
  the.upload = function() { uploadFile(the); };
};

// Static methods
KTImageInput.getInstance = function(element) {
  if (element && KTUtil.data(element).has("image-input")) {
    return KTUtil.data(element).get("image-input");
  } else {
    return null;
  }
};

// Create instances
KTImageInput.createInstances = function(selector = '[data-kt-image-input="true"]') {
  let elements = document.body.querySelectorAll(selector);

  if (elements && elements.length > 0) {
    for (let i = 0, len = elements.length; i < len; i++) {
      instances.push(new KTImageInput(elements[i]));
    }
  }
};

// Global initialization
KTImageInput.init = function() {
  KTImageInput.createInstances();
};

// Webpack support
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = KTImageInput;
}

// Create instances
KTImageInput.createInstances();

// Export KTUtil
export default KTImageInput;
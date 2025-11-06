/* eslint-disable */
"use strict";

import {KTUtil} from "./../../components/util.js";

const KTLayoutExamples = function () {

    const initDefaultMode = function (element) {
        let elements = element;
        if (typeof elements === 'undefined') {
            elements = document.querySelectorAll('.example:not(.example-compact):not(.example-hover):not(.example-basic)');
        }

        if (elements && elements.length > 0) {
            for (const example of elements) {
                const copy = KTUtil.find(example, '.example-copy');

                if (copy) {
                    const clipboard = new ClipboardJS(copy, {
                        target: function (trigger) {
                            const example = trigger.closest('.example');
                            let el = KTUtil.find(example, '.example-code .tab-pane.active');

                            if (!el) {
                                el = KTUtil.find(example, '.example-code');
                            }

                            return el;
                        }
                    });

                    clipboard.on('success', function (e) {
                        KTUtil.addClass(e.trigger, 'example-copied');
                        e.clearSelection();

                        setTimeout(function () {
                            KTUtil.removeClass(e.trigger, 'example-copied');
                        }, 2000);
                    });
                }
            }
        }
    }

    function handleToggleClick(event) {
        const example = event.currentTarget.closest('.example');
        const code = KTUtil.find(example, '.example-code');
        const the = event.currentTarget;

        if (KTUtil.hasClass(the, 'example-toggled')) {
            KTUtil.slideUp(code, 300, function () {
                KTUtil.removeClass(the, 'example-toggled');
                KTUtil.removeClass(code, 'example-code-on');
                KTUtil.hide(code);
            });
        } else {
            KTUtil.addClass(code, 'example-code-on');
            KTUtil.addClass(the, 'example-toggled');
            KTUtil.slideDown(code, 300, function () {
                KTUtil.show(code);
            });
        }
    }

    function handleClipboardSuccess(e) {
        KTUtil.addClass(e.trigger, 'example-copied');
        e.clearSelection();

        setTimeout(function () {
            KTUtil.removeClass(e.trigger, 'example-copied');
        }, 2000);
    }

    function setupClipboard(copy) {
        const clipboard = new ClipboardJS(copy, {
            target: function (trigger) {
                const example = trigger.closest('.example');
                let el = KTUtil.find(example, '.example-code .tab-pane.active');
                if (!el) {
                    el = KTUtil.find(example, '.example-code');
                }
                return el;
            }
        });

        clipboard.on('success', handleClipboardSuccess);
    }

    const initCompactMode = function (element) {
        let elements = element;
        if (typeof elements === 'undefined') {
            elements = document.querySelectorAll('.example.example-compact');
        }

        if (elements && elements.length > 0) {
            for (const example of elements) {
                const toggle = KTUtil.find(example, '.example-toggle');
                const copy = KTUtil.find(example, '.example-copy');

                // Handle toggle
                if (toggle) {
                    KTUtil.addEvent(toggle, 'click', handleToggleClick);
                }

                // Handle copy
                if (copy) {
                    setupClipboard(copy);
                }
            }
        }
    }

    return {
        init: function (element, options) {
            initDefaultMode(element);
            initCompactMode(element);
        }
    };
}();

export default KTLayoutExamples;
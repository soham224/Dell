/* eslint-disable */
"use strict";

import {KTUtil} from "./util";

// Component Definition
const KTMenu = function (elementId, options) {
    let the = this;
    let init = false;
    const element = KTUtil.getById(elementId);
    if (!element) return;

    let defaultOptions = {
        // scrollable area with Perfect Scroll
        scroll: {
            rememberPosition: false
        },

        // accordion submenu mode
        accordion: {
            slideSpeed: 200, // accordion toggle slide speed in milliseconds
            autoScroll: false, // enable auto scrolling(focus) to the clicked menu item
            autoScrollSpeed: 1200,
            expandAll: true // allow having multiple expanded accordions in the menu
        },

        // dropdown submenu mode
        dropdown: {
            timeout: 500 // timeout in milliseconds to show and hide the hoverable submenu dropdown
        }
    };

    const eventManager = createEventManager();

    // Merge options
    the.options = KTUtil.deepExtend({}, defaultOptions, options);
    the.element = element;

    // Public API
    the.setDefaults = function (options) { defaultOptions = options; };
    the.scrollUpdate = function () { /* ... */ };
    the.scrollReInit = function () { /* ... */ };
    the.scrollTop = function () { /* ... */ };
    the.setActiveItem = function (item) { /* ... */ };
    the.reload = function () { /* ... */ };
    the.update = function (options) { /* ... */ };
    the.getBreadcrumbs = function (item) { /* ... */ };
    the.getPageTitle = function (item) { /* ... */ };
    the.getSubmenuMode = function (el) { /* ... */ };
    the.hideDropdown = function (item) { /* ... */ };
    the.hideDropdowns = function () { /* ... */ };
    the.pauseDropdownHover = function (time) { /* ... */ };
    the.resumeDropdownHover = function () { /* ... */ };
    the.on = function (name, handler) { eventManager.addEvent(name, handler, false); return the; };
    the.off = function (name) { eventManager.removeEvent(name); return the; };
    the.one = function (name, handler) { eventManager.addEvent(name, handler, true); return the; };

    // Wire up event handlers using the extracted functions

    // Handle plugin on window resize
    KTUtil.addResizeHandler(function () {
        if (init) {
            the.reload();
        }
    });

    // Init done
    init = true;

    return the;
};

// Plugin global lazy initialization
const handleDocumentClick = function (e) {
    const body = KTUtil.getByTagName('body')[0];
    const query = body.querySelectorAll('.menu-nav .menu-item.menu-item-submenu.menu-item-hover:not(.menu-item-tabs)[data-menu-toggle="click"]');
    if (query) {
        for (let i = 0, len = query.length; i < len; i++) {
            const element = query[i].closest('.menu-nav').parentNode;
            if (!element) continue;
            const the = KTUtil.data(element).get('menu');
            if (shouldCloseMenu(element, the, e)) {
                // Menu was closed, continue to next
                continue;
            }
        }
    }
};

document.addEventListener("click", handleDocumentClick);

export default KTMenu;

function createEventManager() {
    const events = [];
    return {
        addEvent(name, handler, one) {
            events.push({ name, handler, one, fired: false });
        },
        removeEvent(name) {
            const idx = events.findIndex(e => e.name === name);
            if (idx !== -1) events.splice(idx, 1);
        },
        trigger(name, context, args) {
            for (const event of events) {
                if (event.name === name) {
                    if (event.one && !event.fired) {
                        event.fired = true;
                        return event.handler.call(context, context, args);
                    } else if (!event.one) {
                        return event.handler.call(context, context, args);
                    }
                }
            }
        }
    };
}

function shouldCloseMenu(element, the, e) {
    if (!the || the.getSubmenuMode() !== 'dropdown') {
        return false;
    }
    if (e.target !== element && !element.contains(e.target)) {
        the.hideDropdowns();
        return true;
    }
    return false;
}
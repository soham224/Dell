/* eslint-disable */
"use strict";

import {KTUtil} from "./util";

// Component Definition
const KTScrolltop = function (elementId, options) {
    let the = this;
    const element = KTUtil.getById(elementId);
    const body = KTUtil.getBody();
    if (!element) return;

    let defaultOptions = { offset: 300, speed: 6000 };
    const eventManager = createEventManager();

    // Merge options
    the.options = KTUtil.deepExtend({}, defaultOptions, options);
    the.element = element;

    // Public API
    the.setDefaults = function (options) { defaultOptions = options; };
    the.on = function (name, handler) { eventManager.addEvent(name, handler, false); return the; };
    the.one = function (name, handler) { eventManager.addEvent(name, handler, true); return the; };

    // Scroll event
    let timer;
    window.addEventListener('scroll', function () {
        KTUtil.throttle(timer, function () {
            handleScroll(the, body, the.options, eventManager);
        }, 200);
    });

    // Click event
    KTUtil.addEvent(element, 'click', function (e) {
        handleClick(e, the, the.options);
    });

    return the;
};

function createEventManager() {
    const events = [];
    return {
        addEvent(name, handler, one) {
            events.push({ name, handler, one, fired: false });
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

function handleScroll(the, body, options, eventManager) {
    const pos = KTUtil.getScrollTop();
    if (pos > options.offset) {
        if (!body.hasAttribute('data-scrolltop')) {
            body.setAttribute('data-scrolltop', 'on');
        }
    } else {
        if (body.hasAttribute('data-scrolltop')) {
            body.removeAttribute('data-scrolltop');
        }
    }
}

function handleClick(e, the, options) {
    e.preventDefault();
    KTUtil.scrollTop(0, options.speed);
}

export default KTScrolltop;
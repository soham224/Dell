/* eslint-disable */
"use strict";

import {KTUtil} from "./util";

// Component Definition
const KTToggle = function (toggleElement, targetElement, options) {
    let the = this;
    const element = toggleElement;
    const target = targetElement;
    if (!element) return;

    let defaultOptions = { targetToggleMode: 'class' };
    const eventManager = createEventManager();

    // Merge options
    the.options = KTUtil.deepExtend({}, defaultOptions, options);
    the.element = element;
    the.target = target;
    let state;
    if (the.options.targetToggleMode === 'class') {
        if (KTUtil.hasClasses(target, the.options.targetState)) {
            state = 'on';
        } else {
            state = 'off';
        }
    } else {
        if (KTUtil.hasAttr(target, 'data-' + the.options.targetState)) {
            state = KTUtil.attr(target, 'data-' + the.options.targetState);
        } else {
            state = 'off';
        }
    }
    the.state = state;

    // Public API
    the.setDefaults = function (options) { defaultOptions = options; };
    the.getState = function () { return the.state; };
    the.toggle = function () {
        eventManager.trigger('beforeToggle', the);
        if (the.state == 'off') {
            toggleOn(the, the.options, element, target, eventManager);
        } else {
            toggleOff(the, the.options, element, target, eventManager);
        }
        eventManager.trigger('afterToggle', the);
        return the;
    };
    the.toggleOn = function () { return toggleOn(the, the.options, element, target, eventManager); };
    the.toggleOff = function () { return toggleOff(the, the.options, element, target, eventManager); };
    the.on = function (name, handler) { eventManager.addEvent(name, handler, false); return the; };
    the.one = function (name, handler) { eventManager.addEvent(name, handler, true); return the; };

    KTUtil.addEvent(element, 'mouseup', the.toggle);

    return the;
};

function createEventManager() {
    const events = [];
    return {
        addEvent(name, handler, one) {
            events.push({ name, handler, one, fired: false });
        },
        trigger(name, context) {
            for (const event of events) {
                if (event.name === name) {
                    if (event.one && !event.fired) {
                        event.fired = true;
                        return event.handler.call(context, context);
                    } else if (!event.one) {
                        return event.handler.call(context, context);
                    }
                }
            }
        }
    };
}

function toggleOn(the, options, element, target, eventManager) {
    eventManager.trigger('beforeOn', the);
    if (options.targetToggleMode == 'class') {
        KTUtil.addClass(target, options.targetState);
    } else {
        KTUtil.attr(target, 'data-' + options.targetState, 'on');
    }
    if (options.toggleState) {
        KTUtil.addClass(element, options.toggleState);
    }
    the.state = 'on';
    eventManager.trigger('afterOn', the);
    eventManager.trigger('toggle', the);
    return the;
}

function toggleOff(the, options, element, target, eventManager) {
    eventManager.trigger('beforeOff', the);
    if (options.targetToggleMode == 'class') {
        KTUtil.removeClass(target, options.targetState);
    } else {
        KTUtil.removeAttr(target, 'data-' + options.targetState);
    }
    if (options.toggleState) {
        KTUtil.removeClass(element, options.toggleState);
    }
    the.state = 'off';
    eventManager.trigger('afterOff', the);
    eventManager.trigger('toggle', the);
    return the;
}

export default KTToggle;
/* eslint-disable */
"use strict";

import {KTUtil} from "./util";

// Helper functions (already extracted, add more as needed)
function initializeCardOptions(element, options, defaultOptions) {
    const cardOptions = KTUtil.deepExtend({}, defaultOptions, options);
    const header = KTUtil.child(element, '.card-header');
    const footer = KTUtil.child(element, '.card-footer');
    const body = KTUtil.child(element, '.card-body') || KTUtil.child(element, '.form');
    return { cardOptions, header, footer, body };
}

function addEventListeners(header, Plugin) {
    const tools = ['remove', 'reload', 'toggle'];
    tools.forEach(tool => {
        const element = KTUtil.find(header, `[data-card-tool=${tool}]`);
        if (element) {
            KTUtil.addEvent(element, 'click', function (e) {
                e.preventDefault();
                Plugin[tool]();
            });
        }
    });
}

function handleStickyBehavior(st, offset, body, Plugin) {
    if (st >= offset && !KTUtil.hasClass(body, 'card-sticky-on')) {
        Plugin.eventTrigger('stickyOn');
        KTUtil.addClass(body, 'card-sticky-on');
        Plugin.updateSticky();
    } else if ((st * 1.5) <= offset && KTUtil.hasClass(body, 'card-sticky-on')) {
        Plugin.eventTrigger('stickyOff');
        KTUtil.removeClass(body, 'card-sticky-on');
        Plugin.resetSticky();
    }
}

function updateStickyPosition(the, body) {
    if (!the.header) return;
    if (KTUtil.hasClass(body, 'card-sticky-on')) {
        const top = typeof the.options.sticky.position?.top === 'function'
            ? parseInt(the.options.sticky.position.top.call(this, the))
            : parseInt(the.options.sticky.position?.top || 0);
        const left = typeof the.options.sticky.position?.left === 'function'
            ? parseInt(the.options.sticky.position.left.call(this, the))
            : parseInt(the.options.sticky.position?.left || 0);
        const right = typeof the.options.sticky.position?.right === 'function'
            ? parseInt(the.options.sticky.position.right.call(this, the))
            : parseInt(the.options.sticky.position?.right || 0);
        KTUtil.css(the.header, 'z-index', the.options.sticky.zIndex);
        KTUtil.css(the.header, 'top', top + 'px');
        KTUtil.css(the.header, 'left', left + 'px');
        KTUtil.css(the.header, 'right', right + 'px');
    }
}

function handleCardStateChange(element, Plugin, isCollapsed, body, toggleSpeed) {
    if (isCollapsed) {
        if (Plugin.eventTrigger('beforeExpand') === false) return;
        KTUtil.slideDown(body, toggleSpeed, () => Plugin.eventTrigger('afterExpand'));
        KTUtil.removeClass(element, 'card-collapse');
        KTUtil.removeClass(element, 'card-collapsed');
    } else {
        if (Plugin.eventTrigger('beforeCollapse') === false) return;
        KTUtil.slideUp(body, toggleSpeed, () => Plugin.eventTrigger('afterCollapse'));
        KTUtil.addClass(element, 'card-collapse');
    }
}

const EVENT_FIRED = true;

// Helper: Default options
function getDefaultCardOptions() {
    return {
        toggleSpeed: 400,
        sticky: {
            releseOnReverse: false,
            offset: 300,
            zIndex: 101
        }
    };
}

// Helper: Merge options
function mergeCardOptions(defaultOptions, userOptions) {
    return KTUtil.deepExtend({}, defaultOptions, userOptions);
}

// Helper: Initialize plugin data
function initializeCardPlugin(element, the, Plugin, options) {
    if (KTUtil.data(element).has('card')) {
        return KTUtil.data(element).get('card');
    } else {
        Plugin.init(options);
        Plugin.build();
        KTUtil.data(element).set('card', the);
        return the;
    }
}

// Helper: Create Plugin object
function createCardPlugin(element, the, defaultOptions, options) {
    return {
        construct: function (options) {
            return initializeCardPlugin(element, the, this, options);
        },
        init: function (options) {
            the.element = element;
            the.events = [];
            const { cardOptions, header, footer, body: cardBody } = initializeCardOptions(element, options, defaultOptions);
            the.options = cardOptions;
            the.header = header;
            the.footer = footer;
            the.body = cardBody;
        },
        build: function () {
            addEventListeners(the.header, this);
        },
        initSticky: function () {
            if (!the.header) return;
            window.addEventListener('scroll', this.onScrollSticky);
        },
        onScrollSticky: function () {
            const offset = the.options.sticky.offset;
            if (isNaN(offset)) return;
            const st = KTUtil.getScrollTop();
            handleStickyBehavior(st, offset, KTUtil.getBody(), this);
        },
        updateSticky: function () {
            updateStickyPosition(the, KTUtil.getBody());
        },
        resetSticky: function () {
            if (!the.header) return;
            if (!KTUtil.hasClass(KTUtil.getBody(), 'card-sticky-on')) {
                KTUtil.css(the.header, 'z-index', '');
                KTUtil.css(the.header, 'top', '');
                KTUtil.css(the.header, 'left', '');
                KTUtil.css(the.header, 'right', '');
            }
        },
        remove: function () {
            if (this.eventTrigger('beforeRemove') === false) return;
            KTUtil.remove(element);
            this.eventTrigger('afterRemove');
        },
        setContent: function (html) {
            if (html) the.body.innerHTML = html;
        },
        getBody: function () {
            return the.body;
        },
        getSelf: function () {
            return element;
        },
        reload: function () {
            this.eventTrigger('reload');
        },
        toggle: function () {
            const isCollapsed = KTUtil.hasClass(element, 'card-collapse') || KTUtil.hasClass(element, 'card-collapsed');
            handleCardStateChange(element, this, isCollapsed, the.body, the.options.toggleSpeed);
        },
        collapse: function () {
            handleCardStateChange(element, this, false, the.body, the.options.toggleSpeed);
        },
        expand: function () {
            handleCardStateChange(element, this, true, the.body, the.options.toggleSpeed);
        },
        eventTrigger: function (name) {
            for (const event of the.events) {
                if (event.name === name) {
                    const shouldFireEvent = !event.fired || !event.one;
                    if (shouldFireEvent) {
                        event.fired = EVENT_FIRED;
                        return event.handler.call(this, the);
                    }
                }
            }
        },
        addEvent: function (name, handler, one) {
            the.events.push({
                name: name,
                handler: handler,
                one: one,
                fired: false
            });
            return the;
        }
    };
}

const KTCard = function (elementId, options) {
    let the = this;
    const element = KTUtil.getById(elementId);
    if (!element) return;
    let defaultOptions = getDefaultCardOptions();
    const Plugin = createCardPlugin(element, the, defaultOptions, options);

    // Public Methods
    the.setDefaults = function (options) { defaultOptions = options; };
    the.remove = function () { return Plugin.remove(); };
    the.initSticky = function () { return Plugin.initSticky(); };
    the.updateSticky = function () { return Plugin.updateSticky(); };
    the.resetSticky = function () { return Plugin.resetSticky(); };
    the.destroySticky = function () {
        Plugin.resetSticky();
        window.removeEventListener('scroll', Plugin.onScrollSticky);
    };
    the.reload = function () { return Plugin.reload(); };
    the.setContent = function (html) { return Plugin.setContent(html); };
    the.getBody = function () { return Plugin.getBody(); };
    the.getSelf = function () { return Plugin.getSelf(); };
    the.on = function (name, handler) { return Plugin.addEvent(name, handler); };
    the.one = function (name, handler) { return Plugin.addEvent(name, handler, true); };

    Plugin.construct.apply(the, [options]);
    return the;
};

export default KTCard;
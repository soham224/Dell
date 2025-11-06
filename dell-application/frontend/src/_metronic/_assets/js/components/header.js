/* eslint-disable */
"use strict";

import {KTUtil} from "./util";

// Helper functions
function initScroll(element) {
    KTUtil.scrollInit(element, {
        disableForMobile: true,
        resetHeightOnDestroy: true,
        handleWindowResize: true,
        height: function () {
            let height = parseInt(KTUtil.getCss(element, 'height'));

            if (KTUtil.isInResponsiveRange('tablet')) {
                height = height - 50;
            }

            return height;
        }
    });
}

function isDropdownOverflow(itemPos, subWidth, viewportWidth) {
    return itemPos + subWidth > viewportWidth;
}

function handleDropdownSubmenu(sub, itemPos, subWidth, options) {
    if (options.submenu?.desktop === 'dropdown') {
        if (isDropdownOverflow(itemPos, subWidth, KTUtil.getViewPort().width)) {
            KTUtil.addClass(sub, 'menu-submenu-left');
        }
    }
}

function getSubmenuElements(element, toggle) {
    const sub = KTUtil.find(element, '#' + toggle.getAttribute('data-menu-toggle'));
    const item = toggle.closest('.menu-item');
    const parentItem = item.closest('.menu-item.menu-item-submenu');
    const parentSub = parentItem ? KTUtil.find(element, '#' + parentItem.querySelector('[data-menu-toggle]').getAttribute('data-menu-toggle')) : null;
    
    return { sub, item, parentItem, parentSub };
}

function initEventHandlers(element, options) {
    const toggles = KTUtil.find(element, '.menu-item[data-menu-toggle]');
    if (!toggles || toggles.length === 0) return;
    
    for (const toggle of toggles) {
        const { sub } = getSubmenuElements(element, toggle);
        if (sub) {
            const subWidth = parseInt(KTUtil.actualWidth(sub));
            const itemPos = KTUtil.offset(toggle).left;
            handleDropdownSubmenu(sub, itemPos, subWidth, options);
        }
    }
}

// Helper: Default options
function getDefaultHeaderOptions() {
    return {
        offset: {
            default: 200,
            sticky: {
                desktop: 200,
                mobile: 150
            }
        },
        minimize: {
            desktop: {
                on: 'header-minimize',
                off: 'header-minimize-off'
            },
            mobile: {
                on: 'header-minimize-mobile',
                off: 'header-minimize-mobile-off'
            }
        },
        sticky: {
            on: 'header-sticky',
            off: 'header-sticky-off'
        }
    };
}

// Helper: Merge options
function mergeHeaderOptions(defaultOptions, userOptions) {
    return KTUtil.deepExtend({}, defaultOptions, userOptions);
}

// Helper: Initialize plugin data
function initializeHeaderPlugin(element, the, Plugin, options) {
    if (KTUtil.data(element).has('header')) {
        return KTUtil.data(element).get('header');
    } else {
        Plugin.init(options);
        Plugin.build();
        KTUtil.data(element).set('header', the);
        return the;
    }
}

// Helper: Create Plugin object
function createHeaderPlugin(element, the, defaultOptions, options) {
    return {
        construct: function (options) {
            return initializeHeaderPlugin(element, the, this, options);
        },
        init: function (options) {
            the.element = element;
            the.events = [];
            the.options = mergeHeaderOptions(defaultOptions, options);
        },
        build: function () {
            this.initScroll();
            this.initEventHandlers();
        },
        initScroll: function () {
            initScroll(element);
        },
        initEventHandlers: function () {
            initEventHandlers(element, options);
        },
        initSubmenuToggle: function () {
            if (!(the.submenuToggle && the.submenuToggle.length > 0)) return;
            
            for (const toggle of the.submenuToggle) {
                const { sub, parentItem } = getSubmenuElements(element, toggle);
                if (sub) {
                    handleParentItemClass(parentItem);
                    handleSubmenuClass(sub, the.options.accordion && the.options.accordion.expandAll);
                }
            }
        },
        initAccordionMode: function () {
            this.initSubmenuMode('click');
        },
        initDropdownMode: function () {
            this.initSubmenuMode('hover');
        },
        initHoverMode: function () {
            this.initSubmenuMode('hover');
        },
        initSubmenuMode: function (mode) {
            if (!(the.submenuToggle && the.submenuToggle.length > 0)) return;
            
            for (const toggle of the.submenuToggle) {
                const { sub, item } = getSubmenuElements(element, toggle);
                
                if (sub) {
                    if (mode === 'click') {
                        KTUtil.addEvent(toggle, 'click', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            this.click(item);
                        });
                    } else {
                        KTUtil.addEvent(item, 'mouseenter', function () {
                            this.enter(item);
                        });
                        KTUtil.addEvent(item, 'mouseleave', function () {
                            this.leave(item);
                        });
                    }
                }
            }
        },
        click: function (item) {
            const { parentItem, parentSub } = getSubmenuElements(element, item.querySelector('[data-menu-toggle]'));

            if (KTUtil.hasClass(item, 'menu-item-open')) {
                this.close(item);
                if (parentItem && parentSub) {
                    this.close(parentItem);
                }
            } else {
                this.open(item);
                if (parentItem && parentSub) {
                    this.open(parentItem);
                }
            }
        },
        open: function (item) {
            const { sub, parentItem, parentSub } = getSubmenuElements(element, item.querySelector('[data-menu-toggle]'));

            if (sub) {
                if (parentItem && parentSub) {
                    this.open(parentItem);
                }

                KTUtil.addClass(item, 'menu-item-open');
                KTUtil.addClass(sub, 'show');
                this.eventTrigger('submenuShow', sub);
            }
        },
        close: function (item) {
            const { sub, parentItem, parentSub } = getSubmenuElements(element, item.querySelector('[data-menu-toggle]'));

            if (sub) {
                KTUtil.removeClass(item, 'menu-item-open');
                KTUtil.removeClass(sub, 'show');
                this.eventTrigger('submenuHide', sub);

                if (parentItem && parentSub) {
                    this.close(parentItem);
                }
            }
        },
        enter: function (item) {
            const { sub, parentItem, parentSub } = getSubmenuElements(element, item.querySelector('[data-menu-toggle]'));

            if (sub) {
                if (parentItem && parentSub) {
                    this.enter(parentItem);
                }

                KTUtil.addClass(item, 'menu-item-open');
                KTUtil.addClass(sub, 'show');
                this.eventTrigger('submenuShow', sub);
            }
        },
        leave: function (item) {
            const { sub, parentItem, parentSub } = getSubmenuElements(element, item.querySelector('[data-menu-toggle]'));

            if (sub) {
                KTUtil.removeClass(item, 'menu-item-open');
                KTUtil.removeClass(sub, 'show');
                this.eventTrigger('submenuHide', sub);

                if (parentItem && parentSub) {
                    this.leave(parentItem);
                }
            }
        },
        eventTrigger: function (name, args) {
            for (const event of the.events) {
                if (event.name === name) {
                    if (event.one === true) {
                        if (event.fired === false) {
                            event.fired = true;
                            return event.handler.call(this, the, args);
                        }
                    } else {
                        return event.handler.call(this, the, args);
                    }
                }
            }
        },
        on: function (name, handler) {
            the.events.push({
                name: name,
                handler: handler,
                one: false,
                fired: false
            });
            return the;
        },
        one: function (name, handler) {
            the.events.push({
                name: name,
                handler: handler,
                one: true,
                fired: false
            });
            return the;
        },
        off: function (name) {
            for (let i = 0; i < the.events.length; i++) {
                const event = the.events[i];
                if (event.name === name) {
                    the.events.splice(i, 1);
                    break;
                }
            }
            return the;
        }
    };
}

const KTHeader = function (elementId, options) {
    let the = this;
    const element = KTUtil.getById(elementId);
    if (!element) return;
    let defaultOptions = getDefaultHeaderOptions();
    const Plugin = createHeaderPlugin(element, the, defaultOptions, options);

    // Public Methods
    the.setDefaults = function (options) { defaultOptions = options; };
    the.initToggle = function () { return Plugin.initSubmenuToggle(); };
    the.initAccordionMode = function () { return Plugin.initAccordionMode && Plugin.initAccordionMode(); };
    the.initDropdownMode = function () { return Plugin.initDropdownMode && Plugin.initDropdownMode(); };
    the.initHoverMode = function () { return Plugin.initHoverMode && Plugin.initHoverMode(); };
    the.initAside = function () { return Plugin.initAside && Plugin.initAside(); };
    the.initScroll = function () { return Plugin.initScroll(); };
    the.minimize = function () { return Plugin.minimize && Plugin.minimize(); };
    the.close = function (item) { return Plugin.close && Plugin.close(item); };
    the.open = function (item) { return Plugin.open && Plugin.open(item); };
    the.toggle = function (item) { return Plugin.click && Plugin.click(item); };
    the.getItem = function (item) { return Plugin.getItem && Plugin.getItem(item); };
    the.getSub = function (item) { return Plugin.getSub && Plugin.getSub(item); };
    the.on = function (name, handler) { return Plugin.addEvent(name, handler); };

    Plugin.construct.apply(the, [options]);
    return the;
};

export default KTHeader;
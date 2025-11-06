/* eslint-disable */
"use strict";

import { KTUtil } from "./util";

const KTOffcanvas = function (elementId, options) {
    const element = KTUtil.getById(elementId);
    const body = KTUtil.getBody();

    if (!element) return;

    let the = this;
    const defaultOptions = { attrCustom: '' };

    const state = {
        events: [],
        overlay: null,
        target: null,
        options: {},
        state: 'hidden',
    };

    const initState = () => {
        state.options = KTUtil.deepExtend({}, defaultOptions, options);
        Object.assign(state, {
            classBase: state.options.baseClass,
            attrCustom: state.options.attrCustom,
            classShown: `${state.options.baseClass}-on`,
            classOverlay: `${state.options.baseClass}-overlay`,
            state: KTUtil.hasClass(element, `${state.options.baseClass}-on`) ? 'shown' : 'hidden'
        });
    };

    const updateBodyState = (isShown) => {
        const action = isShown ? KTUtil.attr : KTUtil.removeAttr;
        const method = isShown ? KTUtil.addClass : KTUtil.removeClass;

        action(body, `data-offcanvas-${state.classBase}`, 'on');
        method(element, state.classShown);

        if (state.attrCustom) {
            action(body, `data-offcanvas-${state.attrCustom}`, 'on');
        }
    };

    const manageOverlay = (show) => {
        if (!state.options.overlay) return;
        if (show) {
            state.overlay = KTUtil.insertAfter(document.createElement('DIV'), element);
            KTUtil.addClass(state.overlay, state.classOverlay);
            KTUtil.addEvent(state.overlay, 'click', (e) => {
                e.preventDefault();
                hide();
            });
        } else if (state.overlay) {
            KTUtil.remove(state.overlay);
        }
    };

    const toggleClass = (mode) => {
        const config = getToggleByConfig();
        if (!config) return;
        const el = KTUtil.getById(config.target);
        if (!el) return;
        (mode === 'show' ? KTUtil.addClass : KTUtil.removeClass)(el, config.state);
    };

    const triggerEvent = (name, args) => {
        const matchingEvents = state.events.filter(event =>
            event.name === name && (!event.one || !event.fired)
        );

        matchingEvents.forEach(event => {
            if (event.one) event.fired = true;
            event.handler.call(this, the, args);
        });
    };

    const getToggleByConfig = () => {
        const id = KTUtil.attr(state.target, 'id');
        const toggleBy = state.options.toggleBy;

        if (!id || !toggleBy) return null;
        if (Array.isArray(toggleBy)) return toggleBy.find(item => item.target === id);
        return toggleBy.target ? toggleBy : null;
    };

    const show = () => {
        if (state.state === 'shown') return;
        triggerEvent('beforeShow');
        toggleClass('show');
        updateBodyState(true);
        manageOverlay(true);
        state.state = 'shown';
        triggerEvent('afterShow');
    };

    const hide = () => {
        if (state.state === 'hidden') return;
        triggerEvent('beforeHide');
        toggleClass('hide');
        updateBodyState(false);
        manageOverlay(false);
        state.state = 'hidden';
        triggerEvent('afterHide');
    };

    const toggle = () => {
        triggerEvent('toggle');
        (state.state === 'shown' ? hide : show)();
    };

    const addClickHandler = (targetId, handler) => {
        const el = KTUtil.getById(targetId);
        if (el) {
            KTUtil.addEvent(el, 'click', function (e) {
                e.preventDefault();
                state.target = this;
                handler();
            });
        }
    };

    const getToggleTargets = (toggleBy) => {
        if (!toggleBy) return [];
        return Array.isArray(toggleBy)
            ? toggleBy.map(item => item.target || item)
            : [toggleBy.target || toggleBy];
    };

    const setupToggleHandlers = () => {
        const targets = getToggleTargets(state.options.toggleBy);
        targets.forEach(id => addClickHandler(id, toggle));
    };

    const setupCloseHandler = () => {
        const closeId = state.options.closeBy;
        if (closeId) addClickHandler(closeId, hide);
    };

    const setupHandlers = () => {
        setupToggleHandlers();
        setupCloseHandler();
    };

    const construct = () => {
        const existing = KTUtil.data(element).get('offcanvas');
        if (existing) return existing;

        initState();
        setupHandlers();
        KTUtil.data(element).set('offcanvas', the);
        return the;
    };

    // Public API
    the.setDefaults = (opts) => Object.assign(defaultOptions, opts);
    the.isShown = () => state.state === 'shown';
    the.show = show;
    the.hide = hide;
    the.on = (name, handler) => {
        state.events.push({ name, handler, one: false, fired: false });
        return the;
    };
    the.one = (name, handler) => {
        state.events.push({ name, handler, one: true, fired: false });
        return the;
    };
    the.off = (name) => {
        state.events = state.events.filter(e => e.name !== name);
        return the;
    };

    return construct();
};

export default KTOffcanvas;

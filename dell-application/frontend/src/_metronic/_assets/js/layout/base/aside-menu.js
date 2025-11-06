/* eslint-disable */
"use strict";

import {KTUtil} from "./../../components/util.js";
import KTLayoutBrand from "./brand.js";
import KTMenu from "./../../components/menu.js";
import KTLayoutAside from "./aside.js";

const KTLayoutAsideMenu = function () {
    // Private properties
    let _body;
    let _element;
    let _menuObject;

    // Initialize
    const _init = function () {
        const menuDesktopMode = (KTUtil.attr(_element, 'data-menu-dropdown') === '1' ? 'dropdown' : 'accordion');
        let scroll;

        if (KTUtil.attr(_element, 'data-menu-scroll') === '1') {
            scroll = {
                rememberPosition: true, // remember position on page reload
                height: function () { // calculate available scrollable area height
                    let height = parseInt(KTUtil.getViewPort().height);

                    if (KTUtil.isBreakpointUp('lg')) {
                        height = height - KTLayoutBrand.getHeight();
                    }

                    height = height - (parseInt(KTUtil.css(_element, 'marginBottom')) + parseInt(KTUtil.css(_element, 'marginTop')));

                    return height;
                }
            };
        }

        _menuObject = new KTMenu(_element, {
            // Vertical scroll
            scroll: scroll,

            // Submenu setup
            submenu: {
                desktop: menuDesktopMode,
                tablet: 'accordion', // menu set to accordion in tablet mode
                mobile: 'accordion' // menu set to accordion in mobile mode
            },

            // Accordion setup
            accordion: {
                expandAll: false // allow having multiple expanded accordions in the menu
            }
        });
    }

    const _initHover = function () {
        if (KTUtil.hasClass(_body, 'aside-fixed') && KTUtil.hasClass(_body, 'aside-minimize-hoverable')) {
            let insideTm;
            let outsideTm;

            KTUtil.addEvent(_element, 'mouseenter', function (e) {
                ({ insideTm, outsideTm } = handleMouseEnter(e, _body, insideTm, outsideTm));
            });

            KTUtil.addEvent(KTLayoutAside.getElement(), 'mouseleave', function (e) {
                ({ insideTm, outsideTm } = handleMouseLeave(e, _body, insideTm, outsideTm));
            });
        }
    }

    function handleMouseEnter(e, _body, insideTm, outsideTm) {
        e.preventDefault();
        if (KTUtil.isBreakpointUp('lg') === false) return { insideTm, outsideTm };

        clearTimers(insideTm, outsideTm);

        insideTm = setTimeout(function () {
            if (KTUtil.hasClass(_body, 'aside-minimize') && KTUtil.isBreakpointUp('lg')) {
                KTUtil.addClass(_body, 'aside-minimize-hover');
                KTLayoutAsideMenu.getMenu().scrollUpdate();
                KTLayoutAsideMenu.getMenu().scrollTop();
            }
        }, 50);

        return { insideTm, outsideTm };
    }

    function handleMouseLeave(e, _body, insideTm, outsideTm) {
        e.preventDefault();
        if (KTUtil.isBreakpointUp('lg') === false) return { insideTm, outsideTm };

        clearTimers(insideTm, outsideTm);

        outsideTm = setTimeout(function () {
            if (KTUtil.hasClass(_body, 'aside-minimize-hover') && KTUtil.isBreakpointUp('lg')) {
                KTUtil.removeClass(_body, 'aside-minimize-hover');
                KTLayoutAsideMenu.getMenu().scrollUpdate();
                KTLayoutAsideMenu.getMenu().scrollTop();
            }
        }, 100);

        return { insideTm, outsideTm };
    }

    function clearTimers(insideTm, outsideTm) {
        if (outsideTm) {
            clearTimeout(outsideTm);
            outsideTm = null;
        }
        if (insideTm) {
            clearTimeout(insideTm);
            insideTm = null;
        }
        return { insideTm, outsideTm };
    }

    // Public methods
    return {
        init: function (id) {
            _body = KTUtil.getBody();
            _element = KTUtil.getById(id);

            if (!_element) {
                return;
            }

            // Initialize menu
            _init();
            _initHover();
        },

        getElement: function () {
            return _element;
        },

        getMenu: function () {
            return _menuObject;
        },

        pauseDropdownHover: function (time) {
            if (_menuObject) {
                _menuObject.pauseDropdownHover(time);
            }
        },

        closeMobileOffcanvas: function () {
            if (_menuObject && KTUtil.isMobileDevice()) {
                _menuObject.hide();
            }
        }
    };
}();

export default KTLayoutAsideMenu;
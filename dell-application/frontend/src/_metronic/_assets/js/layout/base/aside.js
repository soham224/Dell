/* eslint-disable */
"use strict";

import {KTUtil} from "./../../components/util.js";
import KTOffcanvas from "./../../components/offcanvas.js";

const KTLayoutAside = function () {
    // Private properties
    let _body;
    let _element;
    let _offcanvasObject;

    // Private functions
    // Initialize
    const _init = function () {
        const offcanvasClass = KTUtil.hasClass(_element, 'aside-offcanvas-default') ? 'aside-offcanvas-default' : 'aside';

        // Initialize mobile aside offcanvas
        _offcanvasObject = new KTOffcanvas(_element, {
            baseClass: offcanvasClass,
            overlay: true,
            closeBy: 'kt_aside_close_btn',
            toggleBy: {
                target: 'kt_aside_mobile_toggle',
                state: 'mobile-toggle-active'
            }
        });
    }

    // Public methods
    return {
        init: function (id) {
            _element = KTUtil.getById(id);
            _body = KTUtil.getBody();

            if (!_element) {
                return;
            }

            // Initialize
            _init();
        },

        getElement: function () {
            return _element;
        },

        getOffcanvas: function () {
            return _offcanvasObject;
        },

        isFixed: function () {
            return KTUtil.hasClass(_body, 'aside-fixed');
        },

        isMinimized: function () {
            return (KTUtil.hasClass(_body, 'aside-fixed') && KTUtil.hasClass(_body, 'aside-minimize'));
        },

        isHoverable: function () {
            return (KTUtil.hasClass(_body, 'aside-fixed') && KTUtil.hasClass(_body, 'aside-minimize-hoverable'));
        }
    };
}();

export default KTLayoutAside;
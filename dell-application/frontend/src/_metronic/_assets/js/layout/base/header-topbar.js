/* eslint-disable */
"use strict";

import KTToggle from "./../../components/toggle.js";
import {KTUtil} from "./../../components/util.js";

const KTLayoutHeaderTopbar = function () {
    // Private properties
    let _toggleElement;
    let _toggleObject;

    // Private functions
    const _init = function () {
        _toggleObject = new KTToggle(_toggleElement, KTUtil.getBody(), {
            targetState: 'topbar-mobile-on',
            toggleState: 'active',
        });
    }

    // Public methods
    return {
        init: function (id) {
            _toggleElement = KTUtil.getById(id);

            if (!_toggleElement) {
                return;
            }

            // Initialize
            _init();
        },

        getToggleElement: function () {
            return _toggleElement;
        }
    };
}();


export default KTLayoutHeaderTopbar;
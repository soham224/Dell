/* eslint-disable */
"use strict";

import KTScrolltop from "./../../components/scrolltop.js";
import {KTUtil} from "./../../components/util.js";

const KTLayoutScrolltop = function () {
    // Private properties
    let _element;
    let _object;

    // Private functions
    const _init = function () {
        _object = new KTScrolltop(_element, {
            offset: 300,
            speed: 600,
        });
    }

    // Public methods
    return {
        init: function (id) {
            _element = KTUtil.getById(id);

            if (!_element) {
                return;
            }

            // Initialize
            _init();
        },

        getElement: function () {
            return _element;
        }
    };
}();


export default KTLayoutScrolltop;
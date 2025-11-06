/* eslint-disable */
"use strict";

import {KTUtil} from "./../../components/util.js";

const KTLayoutFooter = function () {
    // Private properties
    let _element;

    // Private functions
    const _getHeight = function () {
        let height = 0;

        if (_element) {
            height = KTUtil.actualHeight(_element);
        }

        return height;
    }

    // Public methods
    return {
        init: function (id) {
            _element = KTUtil.getById(id);
        },

        getHeight: function () {
            return _getHeight();
        },

        getElement: function () {
            return _element;
        }
    };
}();


export default KTLayoutFooter;
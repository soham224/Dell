/* eslint-disable */
"use strict";

import {KTUtil} from "./../../components/util.js";
import KTOffcanvas from "./../../components/offcanvas.js";

const KTLayoutQuickPanel = function () {
    // Private properties
    let _element;
    let _offcanvasObject;
    let _notificationsElement;
    let _logsElement;
    let _settingsElement;

    // Private functions
    const _getContentHeight = function () {
        const header = KTUtil.find(_element, '.offcanvas-header');
        const content = KTUtil.find(_element, '.offcanvas-content');

        let height = parseInt(KTUtil.getViewPort().height);

        if (header) {
            height = height - parseInt(KTUtil.actualHeight(header));
            height = height - parseInt(KTUtil.css(header, 'marginTop'));
            height = height - parseInt(KTUtil.css(header, 'marginBottom'));
        }

        if (content) {
            height = height - parseInt(KTUtil.css(content, 'marginTop'));
            height = height - parseInt(KTUtil.css(content, 'marginBottom'));
        }

        height = height - parseInt(KTUtil.css(_element, 'paddingTop'));
        height = height - parseInt(KTUtil.css(_element, 'paddingBottom'));

        height = height - 2;

        return height;
    }

    const _init = function () {
        _offcanvasObject = new KTOffcanvas(_element, {
            overlay: true,
            baseClass: 'offcanvas',
            placement: 'right',
            closeBy: 'kt_quick_panel_close',
            toggleBy: 'kt_quick_panel_toggle'
        });
    }

    const _initNotifications = function () {
        KTUtil.scrollInit(_notificationsElement, {
            mobileNativeScroll: true,
            resetHeightOnDestroy: true,
            handleWindowResize: true,
            height: function () {
                return _getContentHeight();
            }
        });
    }

    const _initLogs = function () {
        KTUtil.scrollInit(_logsElement, {
            mobileNativeScroll: true,
            resetHeightOnDestroy: true,
            handleWindowResize: true,
            height: function () {
                return _getContentHeight();
            }
        });
    }

    const _initSettings = function () {
        KTUtil.scrollInit(_settingsElement, {
            mobileNativeScroll: true,
            resetHeightOnDestroy: true,
            handleWindowResize: true,
            height: function () {
                return _getContentHeight();
            }
        });
    }

    // Public methods
    return {
        init: function (id) {
            _element = KTUtil.getById(id);
            _notificationsElement = KTUtil.getById('kt_quick_panel_notifications');
            _logsElement = KTUtil.getById('kt_quick_panel_logs');
            _settingsElement = KTUtil.getById('kt_quick_panel_settings');

            _init();
            _initNotifications();
            _initLogs();
            _initSettings();
        }
    };
}();


export default KTLayoutQuickPanel;
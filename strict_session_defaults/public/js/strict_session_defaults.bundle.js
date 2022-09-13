/*
*  Frappe Strict Session Defaults © 2022
*  Author:  Ameen Ahmed
*  Company: Level Up Marketing & Software Development Services
*  Licence: Please refer to license.txt
*/

document.addEventListener('DOMContentLoaded', function() {
    frappe.provide('frappe.router');
    let route = frappe.router.current_route;
    
    if (!Array.isArray(route) || !route.length
    || route[0].toLowerCase() === 'login'
    || (route[1] && route[1].toLowerCase() === 'login')) return;
    
    frappe.provide('frappe.strict_session_defaults');
    frappe.provide('frappe.ui.toolbar');
    
    frappe.strict_session_defaults.init = function() {
        frappe.call({
            method: 'strict_session_defaults.override.get_status',
        }).then(function(data) {
            if (data && $.isPlainObject(data)) data = data.message || data;
            if (!$.isPlainObject(data)) {
                frappe.throw(__('The data received from Strict Session Defaults is invalid.'));
                return;
            }
            if (!data.is_ready || !data.show) return;
            frappe.strict_session_defaults._reqd_fields = data.reqd_fields;
            frappe.strict_session_defaults.show();
        });
    };
    
    frappe.strict_session_defaults.show = function() {
        if (frappe.strict_session_defaults._is_shown) return;
        if (!frappe.ui.toolbar.setup_session_defaults) {
            window.setTimeout(function() {
                frappe.strict_session_defaults.show();
            }, 200);
            return;
        }
        frappe.strict_session_defaults._is_shown = true;
        frappe.call({
            method: 'frappe.core.doctype.session_default_settings.session_default_settings.get_session_default_values',
            callback: function(data) {
                let fields = JSON.parse(data.message);
                var d = new frappe.ui.Dialog({
                    fields: fields,
                    title: __('Session Defaults'),
                    'static': true
                });
                d.set_primary_action(__('Save'), function() {
                    var values = d.get_values();
                    if (!values) {
                        d.hide();
                        frappe.throw(_('An error occurred while setting Session Defaults'));
                        return;
                    }
                    
                    let reqd_fields = frappe.strict_session_defaults._reqd_fields || [],
                    count = 0;
                    fields.forEach(function(d) {
                        let fd = d.fieldname;
                        if (
                            (!reqd_fields.length || reqd_fields.indexOf(fd) >= 0)
                            && !!values[fd]
                        ) {
                            count++;
                        }
                        else if (!values[fd]) values[fd] = "";
                    });
                    
                    if (reqd_fields.length && count !== reqd_fields.length) {
                        frappe.show_alert({
                            'message': __('Please fill at least all the required fields.'),
                            'indicator': 'orange'
                        });
                        return;
                    } else if (!count) {
                        frappe.show_alert({
                            'message': __('Please fill at least one field.'),
                            'indicator': 'orange'
                        });
                        return;
                    }
                    
                    frappe.call({
                        method: 'frappe.core.doctype.session_default_settings.session_default_settings.set_session_default_values',
                        args: {default_values: values},
                        callback: function(data) {
                            d.hide();
                            if (data.message == "success") {
                                frappe.show_alert({
                                    'message': __('Session Defaults Saved'),
                                    'indicator': 'green'
                                });
                                frappe.ui.toolbar.clear_cache();
                            } else {
                                frappe.throw(__('An error occurred while setting Session Defaults'));
                            }
                        }
                    });
                });
                d.header.find('.modal-actions').remove();
                d.show();
            }
        });
    };
    frappe.strict_session_defaults.init();
});
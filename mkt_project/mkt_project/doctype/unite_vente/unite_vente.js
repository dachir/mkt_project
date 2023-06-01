// Copyright (c) 2023, Kossivi and contributors
// For license information, please see license.txt

const delay = ms => new Promise(res => setTimeout(res, ms));

frappe.ui.form.on('Unite Vente', {
	refresh: function(frm) {
		/*frm.add_custom_button(
			__("Calcul Coût"),
			function () {
				var cout = 0;
				var variant = "";
				//Calcul des couts
				frm.doc.items.forEach(e => {
					frappe.call({
						method: "erpnext.stock.get_item_details.get_valuation_rate",
						args: {
							item_code: e.item_code,
							company: "Marsavco",
							warehouse: "Marketing Store - MCO",
						},
						callback: function (r) {
							setTimeout(function(){
								e.rate = r.message.valuation_rate;
								frm.refresh_field("items");
								frm.dirty();
								frm.save();
							}, 1000);
							
						}
					});
				});

				
				frm.refresh();
				frappe.msgprint("Calcul terminé!");
			}, "Utilitaires"
		);*/
	}
});

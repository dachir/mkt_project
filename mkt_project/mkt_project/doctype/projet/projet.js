// Copyright (c) 2023, Kossivi and contributors
// For license information, please see license.txt

const on_item_row_change = (item,company,cout) =>{
	frappe.call({
		//method: "mkt_project.mkt_project.doctype.projet.projet.get_item_price",
		method: "erpnext.stock.get_item_details.get_valuation_rate",
		args: {
			item_code: item,
			company: company,
			warehouse: "Marketing Store - MCO",
		},
		callback: function (r) {
			cout = r.message.valuation_rate;
			frm.refresh();
		}
	});
}

frappe.ui.form.on('Projet', {
	setup: function(frm) {
		frm.set_query("price_list", function(frm) {
			return {
				filters: {
					selling: 1,
				}
			};
		});
		frm.set_query("item","sellings", function() {
			return {
				"filters": {
					"item_group": ["IN", ["Products", "Package"]],
				}
			};
		});
		frm.set_query("item","sales_materials_details", function() {
			return {
				"filters": {
					"item_group": "Marketing Materials",
				}
			};
		});
		frm.set_query("produits", function() {
			return {
				"filters": {
					"name": ["LIKE", "FG%"],
				}
			};
		});
	},
	refresh: function(frm) {
		frm.add_custom_button(
			__("Calcul Objectifs"),
			function () {
				var volume = 0;
				var revenue = 0;
				frm.doc.rh_sales.forEach(e => {
					volume += e.nombre * e.objectif_jour;
				});
				volume *= frm.doc.duration;
				frm.doc.sellings.forEach(e => {
					revenue += e.prix_vente * frm.doc.exchange_rate * volume;
				});
				//frm.doc.audience_sales = volume;
				//frm.doc.volume_sales = volume;
				//frm.doc.revenue_sales = revenue;
				frm.set_value("audience_sales", volume);
				frm.set_value("volume_sales", volume);
				frm.set_value("revenue_sales", revenue);

				volume = 0;
				frm.doc.rh_tasting.forEach(e => {
					volume += e.nombre * e.objectif_jour;
				});
				volume *= frm.doc.duration;

				frm.set_value("audience_tasting", volume);
				frm.set_value("volume_tasting", volume);

				volume = 0;
				frm.doc.rh_sampling.forEach(e => {
					volume += e.nombre * e.objectif_jour;
				});
				volume *= frm.doc.duration;

				frm.doc.audience_sampling = volume;
				frm.doc.volume_sampling = volume;

				volume = 0;
				frm.doc.rh_survey.forEach(e => {
					volume += e.nombre * e.objectif_jour;
				});
				volume *= frm.doc.duration;

				frm.set_value("nb_survey", volume);

				//Calcul des couts
				frm.doc.sellings.forEach(e => {
					frappe.call({
						method: "erpnext.stock.get_item_details.get_valuation_rate",
						args: {
							item_code: e.item,
							company: frm.doc.societe,
							warehouse: "Marketing Store - MCO",
						},
						callback: function (r) {
							e.cout = r.message.valuation_rate;
							frm.refresh_field("sales_materials_details");
						}
					});
				});
				frm.doc.sales_materials_details.forEach(e => {
					frappe.call({
						method: "erpnext.stock.get_item_details.get_valuation_rate",
						args: {
							item_code: e.item,
							company: frm.doc.societe,
							warehouse: "Marketing Store - MCO",
						},
						callback: function (r) {
							e.cout = r.message.valuation_rate;
							frm.refresh_field("sales_materials_details");
						}
					});
				});

				frm.doc.logistics.forEach(e => {
					frappe.call({
						method: "erpnext.stock.get_item_details.get_valuation_rate",
						args: {
							item_code: e.item,
							company: frm.doc.societe,
							warehouse: "Marketing Store - MCO",
						},
						callback: function (r) {
							e.cout = r.message.valuation_rate;
							frm.refresh_field("logistics");
						}
					});
				});

				
				frm.refresh();
				frappe.msgprint("Calcul terminé!");
			}, "Utilitaires"
		);
		frm.add_custom_button(
			__("Générer Budget"),
			function () {
				frm.clear_table("details")
				frm.refresh_field('details');
				frm.doc.sellings.forEach(e => {
					var row = frm.add_child('details');
					row.item = e.item;
					row.qte = frm.doc.volume_sales;
					row.pu = e.cout * frm.doc.exchange_rate;
					row.total = row.qte * row.pu;
				});
				frm.doc.sales_materials_details.forEach(e => {
					var row = frm.add_child('details');
					row.item = e.item;
					row.qte = e.qty * frm.doc.duration;
					row.pu = e.cout * frm.doc.exchange_rate;
					row.total = row.qte * row.pu;
				});
				frm.doc.logistics.forEach(e => {
					var row = frm.add_child('details');
					row.item = e.item;
					row.qte = e.qty * frm.doc.duration;
					row.pu = e.cout * frm.doc.exchange_rate;
					row.total = row.qte * row.pu;
				});
				frm.doc.rh_sales.forEach(e => {
					var row = frm.add_child('details');
					row.document_type = "Promoteur Salaire";
					row.item = e.type;
					row.qte = e.nombre * frm.doc.duration;
					row.pu = (e.transport_jour + e.salaire_jour) ;
					row.total = row.qte * row.pu;
				});

				frm.doc.samplings.forEach(e => {
					var row = frm.add_child('details');
					row.item = e.item;
					row.qte = frm.doc.volume_sampling;
					row.pu = e.cout * frm.doc.exchange_rate;
					row.total = row.qte * row.pu;
				});
				frm.doc.sampling_material_details.forEach(e => {
					var row = frm.add_child('details');
					row.item = e.item;
					row.qte = e.qty;
					row.pu = e.cout * frm.doc.exchange_rate;
					row.total = row.qte * row.pu;
				});
				frm.doc.rh_sampling.forEach(e => {
					var row = frm.add_child('details');
					row.document_type = "Promoteur Salaire";
					row.item = e.type;
					row.qte = e.nombre * frm.doc.duration;
					row.pu = (e.transport_jour + e.salaire_jour);
					row.total = row.qte * row.pu;
				});

				frm.doc.tastings.forEach(e => {
					var row = frm.add_child('details');
					row.item = e.item;
					row.qte = frm.doc.volume_tasting;
					row.pu = e.cout * frm.doc.exchange_rate;
					row.total = row.qte * row.pu;
				});
				frm.doc.tasting_material_details.forEach(e => {
					var row = frm.add_child('details');
					row.item = e.item;
					row.qte = e.qty;
					row.pu = e.cout * frm.doc.exchange_rate;
					row.total = row.qte * row.pu;
				});
				frm.doc.rh_tasting.forEach(e => {
					var row = frm.add_child('details');
					row.document_type = "Promoteur Salaire";
					row.item = e.type;
					row.qte = e.nombre * frm.doc.duration;
					row.pu = (e.transport_jour + e.salaire_jour) ;
					row.total = row.qte * row.pu;
				});

				frm.doc.rh_survey.forEach(e => {
					var row = frm.add_child('details');
					row.document_type = "Promoteur Salaire";
					row.item = e.type;
					row.qte = e.nombre * frm.doc.duration;
					row.pu = (e.transport_jour + e.salaire_jour) ;
					row.total = row.qte * row.pu;
				});
				frm.doc.survey_material_details.forEach(e => {
					var row = frm.add_child('details');
					row.item = e.item;
					row.qte = e.qty;
					row.pu = e.cout * frm.doc.exchange_rate;
					row.total = row.qte * row.pu;
				});

				frm.doc.visibilities.forEach(e => {
					var row = frm.add_child('details');
					row.item = e.item;
					row.qte = e.qty * frm.doc.duration;
					row.pu = e.cout * frm.doc.exchange_rate;
					row.total = row.qte * row.pu;
				});
				frm.refresh_field('details');
			}, "Utilitaires"
		);
		/*frm.set_query("product", "brand_product", function(frm, cdt, cdn) {
			var row = locals[cdt][cdn];
			return {
				filters: {
					brand: row.brand,
				}
			};
		});*/

		let i = 0;
		frm.fields_dict.sellings.grid.grid_rows.forEach(s => {
			s.columns['item'].on('click', 'input[data-fieldname="item"][data-doctype="Sales Details"]', () => {
				frappe.set_route("Form", "Unite Vente", s.doc.item);
			});
			i++;
		});
	},
	activite: function(frm){
		on_activite_change(frm);
	},
	start_date: function(frm){
		if(frm.doc.start_date && frm.doc.end_date) frm.set_value("duration",frappe.datetime.get_day_diff(frm.doc.end_date,frm.doc.start_date) + 1);
	},
	end_date: function(frm){
		if(frm.doc.start_date && frm.doc.end_date) frm.set_value("duration",frappe.datetime.get_day_diff(frm.doc.end_date,frm.doc.start_date) + 1);
	},

	get_exchange_rate: function(frm){
		if (frm.doc.devise_vente && frm.doc.company_currency) {
			if (frm.doc.devise_vente != frm.doc.company_currency) {
				frappe.call({
					method: "erpnext.setup.utils.get_exchange_rate",
					args: {
						from_currency: frm.doc.devise_vente,
						to_currency: frm.doc.company_currency,
					},
					callback: function (r) {
						frm.set_value("exchange_rate", flt(r.message));
						frm.refresh_field("exchange_rate");
					}
				});
			} else {
				frm.set_value("exchange_rate", 1.0);
			}
		}
	},
	company_currency: function (frm) {
		frm.events.get_exchange_rate(frm);
	},
	devise_vente: function (frm) {
		frm.events.get_exchange_rate(frm);
	},
	
});

/*frappe.ui.form.on(cur_frm.doctype, {
    'onload_post_render': function(frm, cdt, cdn) {
		let i = 0;
		frm.fields_dict.sellings.grid.grid_rows.forEach(s => {
			s.columns['item'].on('click', 'input[data-fieldname="item"][data-doctype="Sales Details"]', function(e) {
				console.log(s.doc.item);
				frappe.set_route("Form", "Unite Vente", s.doc.item);
			});
			i++;
		});
    }
});*/

frappe.ui.form.on('Budget Details', {
	
    qte(frm, cdt, cdn) {
		var row = locals[cdt][cdn]; 
        if(row.qte && row.pu){
			row.total = row.qte * row.pu;
		}
		else{
			row.total = 0;
		}
		frm.refresh_field("details");
    },

	pu(frm, cdt, cdn) {
		//frm.events.calcul(frm); todo
		var row = locals[cdt][cdn]; 
        if(row.qte && row.pu){
			row.total = row.qte * row.pu;
		}
		else{
			row.total = 0;
		}
		frm.refresh_field("details");
	},
});

frappe.ui.form.on('Sales Details', {
	sellings_add(frm, cdt, cdn) {
		var row = locals[cdt][cdn]; 
		const item = frm.fields_dict.sellings.grid.grid_rows[row.idx - 1].doc.item;
		console.log(item);
		frm.fields_dict.sellings.grid.grid_rows[row.idx - 1].columns['item'].on('click', () => {
		if(item){
			//console.log(item);
			frappe.set_route("Form", "Unite Vente", item);
		}
	  });
	}
});

/*frappe.ui.form.on("Projet","onload", function(frm, cdt, cdn) { 
	on_activite_change(frm);

});

const on_activite_change = (frm) =>{
	var is_corporate = frappe.meta.get_docfield("Projet","is_corporate", cur_frm.doc.name);
	var lieu = frappe.meta.get_docfield("Projet","lieu", cur_frm.doc.name);
	var selling = frappe.meta.get_docfield("Projet","selling", cur_frm.doc.name);
	var tasting = frappe.meta.get_docfield("Projet","tasting", cur_frm.doc.name);
	var sampling = frappe.meta.get_docfield("Projet","sampling", cur_frm.doc.name);
	var visibility = frappe.meta.get_docfield("Projet","visibility", cur_frm.doc.name);
	var logistic = frappe.meta.get_docfield("Projet","logistic", cur_frm.doc.name);
    //is_corporate.read_only = 1;
	//is_corporate.reqd = 1;

	switch (frm.doc.activite) {
		case "DOOR TO DOOR":
			is_corporate.read_only = 1;
			lieu.read_only = 1;
			selling.read_only = 1;
			tasting.read_only = 1;
			sampling.read_only = 1;
			frm.doc.visibility = 0;
			visibility.read_only = 1;
			logistic.read_only = 0;
			frm.doc.selling = 1;
			clear_tasting(frm);
			clear_sampling(frm);
			break;
		case "ECOLES":
			is_corporate.read_only = 1;
			lieu.read_only = 1;
			selling.read_only = 0;
			tasting.read_only = 0;
			sampling.read_only = 0;
			frm.doc.visibility = 0;
			visibility.read_only = 1;
			frm.doc.logistic = 0;
			logistic.read_only = 1;
			break;
		case "PLACE PUBLIQUE":
			is_corporate.read_only = 1;
			lieu.read_only = 1;
			selling.read_only = 0;
			tasting.read_only = 0;
			sampling.read_only = 0;
			frm.doc.visibility = 0;
			visibility.read_only = 1;
			frm.doc.logistic = 0;
			logistic.read_only = 1;
			break;
		case "MATERNITES":
			is_corporate.read_only = 1;
			lieu.read_only = 1;
			selling.read_only = 0;
			tasting.read_only = 1;
			sampling.read_only = 1;
			frm.doc.visibility = 0;
			visibility.read_only = 1;
			frm.doc.logistic = 0;
			logistic.read_only = 1;
			clear_tasting(frm);
			clear_sampling(frm);
			break;
		case "SURVEY QUANTI":
			is_corporate.read_only = 1;
			lieu.read_only = 1;
			selling.read_only = 1;
			selling.read_only = 1;
			tasting.read_only = 1;
			sampling.read_only = 1;
			frm.doc.visibility = 0;
			visibility.read_only = 1;
			frm.doc.logistic = 0;
			logistic.read_only = 1;
			clear_vente(frm);
			clear_tasting(frm);
			clear_sampling(frm);
			break;
		case "SURVEY QUALI":
			is_corporate.read_only = 1;
			lieu.read_only = 1;
			selling.read_only = 1;
			tasting.read_only = 1;
			sampling.read_only = 1;
			frm.doc.visibility = 0;
			visibility.read_only = 1;
			frm.doc.logistic = 0;
			logistic.read_only = 1;
			clear_vente(frm);
			clear_tasting(frm);
			clear_sampling(frm);
			break;
		case  "EVENEMENTS PAYANTS":
			is_corporate.read_only = 1;
			lieu.read_only = 0;
			selling.read_only = 0;
			tasting.read_only = 0;
			sampling.read_only = 0;
			visibility.read_only = 0;
			frm.doc.logistic = 0;
			logistic.read_only = 1;
			break;
		case  "EVENEMENTS GRATUITS":
			is_corporate.read_only = 0;
			lieu.read_only = 0;
			selling.read_only = 1;
			tasting.read_only = 0;
			sampling.read_only = 0;
			frm.doc.visibility = 0;
			visibility.read_only = 1;
			frm.doc.logistic = 0;
			logistic.read_only = 1;
			clear_vente(frm);
			break;
		default:
			is_corporate.read_only = 0;
			lieu.read_only = 0;
			selling.read_only = 0;
			tasting.read_only = 0;
			sampling.read_only = 0;
			frm.doc.selling = 1;
			frm.doc.tasting = 1;
			frm.doc.tasting = 1;
			visibility.read_only = 0;
			logistic.read_only = 0;
	}
	frm.refresh();
}*/

const clear_vente = (frm) =>{
	frm.doc.selling = 0;
	frm.doc.type_sale = "";
	frm.doc.nombre_sale = 0;
	frm.doc.objectif_jour_sale = 0;
	frm.doc.transport_jour_sale = 0;
	frm.doc.salaire_jour_sale = 0;
	frm.doc.sellings = [];
	frm.doc.sales_materials_details = [];
}
const clear_tasting = (frm) =>{
	frm.doc.tasting = 0;
	frm.doc.type_tasting = "";
	frm.doc.nombre_tasting = 0;
	frm.doc.objectif_jour_tasting = 0;
	frm.doc.transport_jour_tasting = 0;
	frm.doc.salaire_jour_tasting = 0;
	frm.doc.tastings = [];
	frm.doc.tasting_material_details = [];
}
const clear_sampling = (frm) =>{
	frm.doc.sampling = 0;
	frm.doc.type_sampling = "";
	frm.doc.nombre_sampling = 0;
	frm.doc.transport_jour_sampling = 0;
	frm.doc.salaire_jour_sampling = 0;
	frm.doc.samplings = [];
	frm.doc.sampling_material_details = [];
}

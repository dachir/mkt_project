// Copyright (c) 2023, Kossivi and contributors
// For license information, please see license.txt

frappe.ui.form.on('Unite Vente', {
	refresh: function(frm) {
		async function getSumOfSageItemCosts(frm, items) {
			const variantMap = new Map();

			// Group items by variant
			items.forEach(({ item_code, qty, variant }) => {
				if (!variantMap.has(variant)) {
					variantMap.set(variant, []);
				}
				variantMap.get(variant).push({ item_code, qty });
			});

			const promises = Array.from(variantMap.entries()).map(async ([variant, variantItems]) => {
				const sumOfCosts = await Promise.all(variantItems.map(({ item_code, qty }) => {
					return new Promise((resolve, reject) => {
						frappe.call({
							method: "mkt_project.mkt_project.doctype.projet.projet.get_gross_selling_price",
							args: {
								"site": frm.doc.branch,
								"item": item_code,
							},
							callback: (r) => {
								if (r.message) resolve(r.message * qty);
								else resolve(0);
							},
							error: (err) => {
								reject(err);
							},
						});
					});
				}));

				const averageCost = sumOfCosts.reduce((acc, cost) => acc + cost, 0) / variantItems.length;
				return { variant, averageCost };
			});

			try {
				// Wait for all promises to resolve
				const results = await Promise.all(promises);

				// Sum up the average costs for all variants
				const totalAverageCost = results.reduce((acc, { averageCost }) => acc + averageCost, 0);
				return totalAverageCost;
			} catch (error) {
				console.error("Error fetching item costs:", error);
				throw error;
			}
		}

		async function getSumOfSageCM29Prices(items) {
			const variantMap = new Map();

			// Group items by variant
			items.forEach(({ item_code, qty, variant }) => {
				if(! item_code.startsWith("9999")){
					if (!variantMap.has(variant)) {
						variantMap.set(variant, []);
					}
					variantMap.get(variant).push({ item_code, qty });
				}
			});

			const promises = Array.from(variantMap.entries()).map(async ([variant, variantItems]) => {
				const sumOfCosts = await Promise.all(variantItems.map(({ item_code, qty }) => {
					return new Promise((resolve, reject) => {
						frappe.call({
							method: "mkt_project.mkt_project.doctype.projet.projet.get_cm29_price",
							args: {
								//"site": frm.doc.branch,
								"item": item_code,
							},
							callback: (r) => {
								if (r.message) resolve(r.message * qty);
								else resolve(0);
							},
							error: (err) => {
								reject(err);
							},
						});
					});
				}));

				const averageCost = sumOfCosts.reduce((acc, cost) => acc + cost, 0) / variantItems.length;
				return { variant, averageCost };
			});

			try {
				// Wait for all promises to resolve
				const results = await Promise.all(promises);

				// Sum up the average costs for all variants
				const totalAverageCost = results.reduce((acc, { averageCost }) => acc + averageCost, 0);
				return totalAverageCost;
			} catch (error) {
				console.error("Error fetching item Prix Achat:", error);
				throw error;
			}
		}

		frm.add_custom_button(
			__("Calcul Coût"),
			async function () {
				try {
					const items = cur_frm.doc.items;
					const sum = await getSumOfSageItemCosts(cur_frm, items);
					cur_frm.set_value("cout", sum);
					cur_frm.refresh_field("cout");

					const prix = await getSumOfSageCM29Prices(items);
					cur_frm.set_value("prix_achat", prix);
					cur_frm.refresh_field("prix_achat");
				} catch (error) {
					console.error("Error:", error);
				}
			}, "Utilitaires"
		);
	}
});

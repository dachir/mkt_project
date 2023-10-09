# Copyright (c) 2023, Kossivi and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.model.naming import getseries
from erpnext.utilities.product import get_price
from erpnext.stock.get_item_details import (
	get_bin_details,
	get_conversion_factor,
	get_default_cost_center,
	get_reserved_qty_for_so,
)

class Projet(Document):
	pass
	#def autoname(self):
    #    # select a project name based on customer
	#	prefix = 'P-{}-'.format(self.customer)
	#	self.name = getseries(prefix, 3)

@frappe.whitelist()
def get_item_price(item, price_list):
	price_struct = get_price(item,price_list,"","")
	return price_struct.price_list_rate

@frappe.whitelist()
def get_item_cost(item):
	doc = frappe.db.sql(
		"""
		SELECT valuation_rate
		FROM tabBin
		WHERE item_code = %s AND warehouse = 'DEPOT308 - MES' AND actual_qty > 0
		ORDER BY creation DESC
		LIMIT 1
		""",(item),as_dict = 1
	)
	#doc = get_bin_details(item,"DEPOT308 - MES") #todo à changer, ne pas figer
	return doc[0].valuation_rate if doc else 0

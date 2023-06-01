# Copyright (c) 2023, Kossivi and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.model.naming import getseries
from erpnext.utilities.product import get_price

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

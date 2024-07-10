# Copyright (c) 2023, Kossivi and contributors
# For license information, please see license.txt

import frappe
from frappe.website.website_generator import WebsiteGenerator
from frappe.model.naming import getseries
from frappe.utils import getdate
from erpnext.utilities.product import get_price
from erpnext.stock.get_item_details import (
	get_bin_details,
	get_conversion_factor,
	get_default_cost_center,
	get_reserved_qty_for_so,
)
import pymssql

class Projet(WebsiteGenerator):
	def on_validate(self):
		if len(self.marque_produit) > 0:
			self.marque_principale = self.marque_produit[0].marque

	def before_submit(self):
		self.route = self.name
		self.is_published = 1

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

@frappe.whitelist()
def get_sage_selling_price(site,item):
	if site == 'Kinshasa':
		site = 'M0001'
	else:
		site = 'M0002'

	end_of_year = str(getdate().year) + "-12-31"
	conn = pymssql.connect("172.16.0.40:49954", "erpnext", "Xn5uFLyR", "dc7x3v12")
	cursor = conn.cursor(as_dict=True)
	cursor.execute("SELECT PLICRI1_0, PRI_0 / PCUSTUCOE_0 * PCUSTUCOE_1 AS cout_pc FROM LIVE.SPRICLIST INNER JOIN LIVE.ITMMASTER ON ITMREF_0 = PLICRI1_0 WHERE PLI_0 = 'T01' AND PLICRI2_0 = %s AND PLIENDDAT_0 = %s  AND PLICRI1_0 = %s", (site, end_of_year, item))
	row = cursor.fetchone()
	conn.close()
	if row:
		#frappe.msgprint(str(row['cout_pc']))
		return row['cout_pc']
	return 0


@frappe.whitelist()
def get_sage_item_cost(site,item):
	if site == 'Kinshasa':
		site = 'M0001'
	else:
		site = 'M0002'

	conn = pymssql.connect("172.16.0.40:49954", "erpnext", "Xn5uFLyR", "dc7x3v12")
	cursor = conn.cursor(as_dict=True)
	cursor.execute('SELECT i.ITMREF_0, i.TCLCOD_0, m.AVC_0 cout_tn, m.AVC_0 * CASE WHEN i.PCUSTUCOE_0 = 0 THEN 1 ELSE i.PCUSTUCOE_0 END AS  cout_ct, m.AVC_0 * CASE WHEN i.PCUSTUCOE_1 = 0 THEN 1 ELSE i.PCUSTUCOE_1 END AS cout_pc FROM LIVE.ITMMASTER i INNER JOIN LIVE.ITMMVT m ON m.ITMREF_0 = i.ITMREF_0   WHERE m.STOFCY_0 = %s AND i.ITMREF_0 = %s', (site,item))
	row = cursor.fetchone()
	conn.close()
	if row:
		#frappe.msgprint(str(row['cout_pc']))
		return row['cout_pc']
	return 0


@frappe.whitelist()
def get_sage_cm29_price(item):
	end_of_year = str(getdate().year) + "-12-31"

	conn = pymssql.connect("172.16.0.40:49954", "erpnext", "Xn5uFLyR", "dc7x3v12")
	cursor = conn.cursor(as_dict=True)
	cursor.execute("SELECT PLICRI1_0, PRI_0, PRI_0 * (1-(DCGVAL_0 + DCGVAL_1 + DCGVAL_2 + DCGVAL_3 + DCGVAL_4 + DCGVAL_5 + DCGVAL_6 + DCGVAL_7 + DCGVAL_8)/100) / PCUSTUCOE_0 * PCUSTUCOE_1 AS price FROM LIVE.SPRICLIST INNER JOIN LIVE.ITMMASTER ON ITMREF_0 = PLICRI1_0 WHERE PLI_0 = 'T511' AND PLICRI2_0  = '040' AND PLIENDDAT_0 = %s AND PLICRI1_0 = %s", (end_of_year,item))
	row = cursor.fetchone()
	conn.close()
	if row:
		return row['price']
	return 0


@frappe.whitelist()
def get_package_cost(site,item):

	result =  frappe.db.sql(
		"""
		SELECT cout, prix_achat
		FROM `tabUnite Vente`
		WHERE branch = %s AND name = %s
		""", (site,item), as_dict = 1
	)

	return result[0] if len(result) > 0 else 0

#@frappe.whitelist()
#def get_label(item):
	#doc = frappe.get_doc("")
	#match lang:
    #case "JavaScript":
    #    print("You can become a web developer.")

    #case "Python":
    #    print("You can become a Data Scientist")
    #case _:
    #    print("The language doesn't matter, what matters is solving problems.")
	#return 

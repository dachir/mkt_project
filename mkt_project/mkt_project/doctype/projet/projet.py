# Copyright (c) 2023, Kossivi and contributors
# For license information, please see license.txt

import frappe
from frappe.website.website_generator import WebsiteGenerator
from frappe.model.naming import getseries
from frappe.utils import (getdate, flt)
from erpnext.utilities.product import get_price
from erpnext.stock.get_item_details import (
	get_bin_details,
	get_conversion_factor,
	get_default_cost_center,
)
import pymssql
from bpm.utils.data_layer import share_doc
from erp_space import erpspace

class Projet(WebsiteGenerator):

	def before_save(self):
		erpspace.share_doc(self)

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
def get_item_cost(site,item):
	doc = frappe.db.sql(
		"""
		SELECT b.item_code, b.creation, b.warehouse, w.branch, 
		CASE WHEN i.item_group = 'FG' THEN b.valuation_rate / ct.conversion_factor * pc.conversion_factor ELSE b.valuation_rate END AS valuation_rate
		FROM tabBin b INNER JOIN tabWarehouse w ON w.name = b.warehouse INNER JOIN tabItem i ON i.item_code = b.item_code
			LEFT JOIN `tabUOM Conversion Detail` ct ON ct.parent = b.item_code AND ct.uom = 'CT'
			LEFT JOIN `tabUOM Conversion Detail` pc ON pc.parent = b.item_code AND pc.uom = 'PC'
		WHERE w.branch = %s AND b.item_code = %s AND b.actual_qty > 0 AND warehouse NOT LIKE '%%ROOM%%' AND warehouse NOT LIKE '%%TRANSIT%%'
		ORDER BY creation DESC
		LIMIT 1
		""",(site,item),as_dict = 1
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
def get_gross_selling_price(site,item):

	item_price = frappe.db.sql(
		"""
		SELECT p.item_code, p.price_list_rate, p.uom, c1.conversion_factor t_to_ct_conversion, c2.uom AS piece_uom, c2.conversion_factor AS t_to_pc_conversion,
		p.price_list_rate / c1.conversion_factor * c2.conversion_factor as pc_rate
		FROM `tabItem Price` p INNER JOIN `tabUOM Conversion Detail` c1 ON c1.parent = p.item_code AND c1.uom = p.uom
			INNER JOIN `tabUOM Conversion Detail` c2 ON c2.parent = p.item_code AND c2.uom = 'PC' 
		WHERE p.price_list LIKE %s AND p.price_list LIKE '%%gross%%' AND p.item_code = %s
		""",(f"%{site}%",item),as_dict = 1
	)
	if item_price:
		return flt(item_price[0].pc_rate,4) or 0
	else: 
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
def get_cm29_price(item):
	item_price = frappe.db.sql(
		"""
		SELECT DISTINCT i.item_code, t.price_list_rate / ct.conversion_factor * pc.conversion_factor AS price_list_rate, 
    		t.price_list_rate / ct.conversion_factor * pc.conversion_factor * (100-IFNULL(t.discount_percentage, 0))/100 AS rate
		FROM tabItem i INNER JOIN `tabUOM Conversion Detail` ct ON ct.parent = i.name AND ct.uom = 'CT'
		    INNER JOIN `tabUOM Conversion Detail` pc ON pc.parent = i.name AND pc.uom = 'PC'
    		LEFT JOIN 
    		(   
    			SELECT DISTINCT ri.item_code, r.discount_percentage, p.price_list_rate, p.price_list
    			FROM `tabPricing Rule` r INNER JOIN `tabPricing Rule Item Code` ri ON ri.parent = r.name AND r.disable = 0 
    					AND (r.valid_from <= CURDATE()) AND (r.valid_upto IS NULL OR r.valid_upto >= CURDATE()) 
    				INNER JOIN `tabItem Price` p ON p.price_list = r.for_price_list AND p.item_code = ri.item_code 
    					AND (p.valid_from <= CURDATE()) AND (p.valid_upto IS NULL OR p.valid_upto >= CURDATE()) 
    				INNER JOIN `tabPrice List` l ON l.name = p.price_list AND l.enabled = 1
    				INNER JOIN tabCustomer c ON r.for_price_list = c.default_price_list
    			WHERE c.name = 'CM000029' 
    				AND ((r.applicable_for = 'Customer Group' AND c.customer_group = r.customer_group) XOR (r.applicable_for = 'Customer' AND c.name = r.customer))
    		) t ON t.item_code = i.item_code 
		WHERE i.item_group = 'FG' AND NOT t.price_list_rate IS NULL AND i.item_code =%s
		""",(item),as_dict = 1
	)
	if item_price:
		return flt(item_price[0].rate,4) or 0
	else :
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


@frappe.whitelist()
def get_agence_site(agence):

	result =  frappe.db.sql(
		"""
		SELECT *
		FROM `tabPromotion Site`
		WHERE parent = %s 
		""", (agence), as_dict = 1
	)

	return result

@frappe.whitelist()
def get_address(address):

	result =  frappe.db.sql(
		"""
		SELECT *
		FROM `tabAddress`
		WHERE name = %s 
		""", (address), as_dict = 1
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

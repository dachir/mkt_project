import frappe
from erpnext.buying.doctype.supplier.supplier import Supplier

class CustomSupplier(Supplier):

    def on_save(self):
        pass

        liste = frappe.db.sql(
            """
            SELECT SUM(distance) total, AVG(distance) moyenne
            FROM `tabPromotion Site`
            WHERE parent = %s
            """, (self.name), as_dict = 1
        )
        self.total =  liste[0].total
        self.avarage =  liste[0].moyenne
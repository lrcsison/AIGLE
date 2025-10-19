from .auth import auth_bp
from .inventory import inventory_bp
from .transactions import transactions_bp
from .employees import employees_bp
from .charts import charts_bp

from .medicines import medicines_bp
from .deliveries import deliveries_bp
from .manufacturer import manufacturer_bp
from .suppliers import suppliers_bp
from .users import users_bp
from .top_sales import top_sales_bp

__all__ = [
    "auth_bp",
    "inventory_bp",
    "transactions_bp",
    "employees_bp",
    "charts_bp",
    "medicines_bp",
    "deliveries_bp",
    "manufacturer_bp",
    "suppliers_bp",
    "users_bp",
    "top_sales_bp",
]

import os
import sqlite3

from invests import sql_create_invest
from invests import sql_create_valuelog

os.system("del mim.db")
conn = sqlite3.connect("mim.db")
with conn:
  conn.execute(sql_create_invest)
  conn.execute(sql_create_valuelog)
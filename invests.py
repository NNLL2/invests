from collections import namedtuple
from copy import deepcopy
from operator import itemgetter

sql_create_invest = """
create table invest (
  name text, 
  owner text,
  category integer,
  initial_value integer,
  current_value integer,
  start_day text, 
  end_day text, 
  update_day text,
  yearly_rate integer, 
  year_days integer,
  actual_gain integer, 
  closed integer,
  comments text, 
  create_day text);
"""

sql_create_valuelog = """
create table valuelog (
invest_id integer,
date text,
value integer
);
"""


FIELDS = (
    ("name", ""),
    ("owner", ""),
	("category", 0),
	("initial_value", 0),
    ("current_value", 0),
    ("start_day", ""),
    ("end_day", ""),
	("update_day", ""),
    ("yearly_rate", 0),
    ("actual_gain", 0),
    ("year_days", 365),
	("closed", 0),
    ("comments", ""),
    ("create_day", ""),
)

def print_sql(sql):
    pass
    
def new_invest():
    d = dict(map(itemgetter(0, 1), FIELDS))
    d["id"] = None
    return d
    
def sql_repr(value):

    if value is None:
        return "NULL"
    if isinstance(value, str):
        return "'" + value + "'"
    elif isinstance(value, unicode):
        return "'" + value + "'"
    else:
        return str(value)
        
def _repr_invest(invest):
    d = deepcopy(invest)
    d.pop('id')
    return {k: sql_repr(v) for k, v in d.items() if k in map(itemgetter(0), FIELDS)}.items()

def db_delete_invest(cursor, id):
    sql = "delete from invest where rowid=" + str(id)
    print_sql(sql)
    cursor.execute(sql)
    
def db_insert_invest(cursor, invest):
    r = _repr_invest(invest)
    fields = ",".join(map(itemgetter(0), r))
    values = ",".join(map(itemgetter(1), r))
    sql = "insert into invest (" + fields + ") values (" + values + ")"
    print_sql(sql)
    cursor.execute(sql)
    invest["id"] = cursor.lastrowid
    
def db_load_invest(cursor, id):
    fields = map(itemgetter(0), FIELDS)
    sql = "select " + ",".join(fields) + " from invest where rowid=" + str(id)
    print_sql(sql)
    cursor.execute(sql)
    row = cursor.fetchone()
    d = dict(zip(fields, row))
    d["id"] = id
    return d
    
def db_update_invest(cursor, invest):
    r = _repr_invest(invest)
    updates = ",".join(map(lambda x: x[0] + "=" + x[1], r))
    sql = "update invest set " + updates + " where rowid=" + str(invest["id"])
    print_sql(sql)
    cursor.execute(sql)
    
def db_getall_invest(cursor, where_clause=None):
    fields = map(itemgetter(0), FIELDS)
    sql = "select " + ",".join(fields) + ",rowid from invest"
    if where_clause:
        sql += " where " + where_clause 
    print_sql(sql)
    cursor.execute(sql)
    rows = cursor.fetchall()
    fields.append("id")
    return [dict(zip(fields, row)) for row in rows]
    
def db_insert_valuelog(cursor, invest_id, date, value):
    sql = "insert into valuelog (invest_id, date, value) values({0}, '{1}', {2});".format(invest_id, date, value)
    print_sql(sql)
    cursor.execute(sql)
    
def db_getall_valuelog(cursor, invest_id):
    sql = "select date, value from valuelog where invest_id={0}".format(invest_id)
    print_sql(sql)
    cursor.execute(sql)
    rows = cursor.fetchall()
    return [dict(zip(["date", "value"], row)) for row in rows]

def db_delete_valuelog(cursor, invest_id, date=None):
    sql = "delete from valuelog where invest_id={0}".format(invest_id)
    if date:
        sql += " and date='{0}'".format(date)
    print_sql(sql)
    cursor.execute(sql)

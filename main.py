#-*- coding:utf-8 -*-
import argparse
from datetime import datetime
from datetime import timedelta
from decimal import Decimal
from copy import deepcopy
from bottle import *
from invests import *

import sqlite3
DB_FILE = "mim.db"
DATE_FORMAT = "%Y-%m-%d"
DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"

app = Bottle()

def delta_day(end, start):
    return (datetime.strptime(end, "%Y-%m-%d") - datetime.strptime(start, "%Y-%m-%d")).days
    
def total_value(invests):
    active_invests = [inv for inv in invests if inv["closed"] == 0]
    return sum([inv["current_value"] for inv in invests])
    
def compute_current_value(inv):
    day_rate = Decimal(inv["yearly_rate"]) / Decimal(10000) / Decimal(inv["year_days"])
    days = delta_day(datetime.now().strftime(DATE_FORMAT), inv["start_day"])
    earnings = day_rate * Decimal(days) * inv["initial_value"]
    cv = Decimal(inv["initial_value"]) + earnings
    return int(cv)

def db_call(func, *args, **kwargs):
    with sqlite3.connect(DB_FILE) as conn:
        conn.text_factory = str
        cursor = conn.cursor()
        return func(cursor, *args, **kwargs)
    
def logined():
    def alog(f):
        def wrapper(*args, **kwargs):
            if not request.get_cookie('session-id'):
                redirect('/login?_next=' + request.path)
            else:
                return f(*args, **kwargs)
        return wrapper
    return alog
 
@app.route("/")
@view('main')
@logined()
def index():
    return {"file_name": DB_FILE}
    
@app.route("/owners", method="GET")
@logined()
def getall_owners():
    owners = db_call(db_getall_owner)
    return dict(owners=owners)
        
@app.route("/invests", method="GET")
@logined()
def content():
    invests = db_call(db_getall_invest)
    for inv in invests:
        if inv["category"] == 0:
            inv["current_value"] = compute_current_value(inv)
    return dict(
        invests=invests, 
        total=total_value(invests))
    
@app.route('/invests/<id>', method="GET")
@logined()
def get_invest(id):
    inv = db_call(db_load_invest, int(id))
    if inv["category"] == 0:
        inv["current_value"] = compute_current_value(inv)
    return dict(invest=inv)
    
@app.route('/invests', method="POST")
def create_invest():
    inv = new_invest() # Get default values
    inv.update(request.json)
    inv["create_day"] = datetime.now().strftime(DATETIME_FORMAT)
    inv["update_day"] = datetime.now().strftime(DATE_FORMAT)
    db_call(db_insert_invest, inv)
    db_call(update_total_valuelog)
    
    if inv["category"] != 0: 
         db_call(update_invest_valuelog, inv["id"], inv["current_value"])
         
    return {}
    
def update_total_valuelog(cursor):
    today = datetime.now().strftime(DATE_FORMAT)
    db_delete_valuelog(cursor, 0, today)
    ongoing_invests = db_getall_invest(cursor, "closed=0")
    initial_sum = reduce(lambda x,y: x + y["initial_value"], ongoing_invests, 0)
    valuelogs = sorted(db_getall_valuelog(cursor, 0), key=lambda x: x["date"], reverse=True)
    if (not valuelogs) or (valuelogs and valuelogs[0]["value"] != initial_sum): 
        db_insert_valuelog(cursor, 0, today, initial_sum)       

def update_invest_valuelog(cursor, invest_id, new_value):
    today = datetime.now().strftime(DATE_FORMAT)
    db_delete_valuelog(cursor, invest_id, today)
    db_insert_valuelog(cursor, invest_id, today, new_value)
            
@app.route('/invests/<id>', method="PUT")
@logined()
def update_invest(id):
    inv = request.json
    inv["id"] = int(id)
    old_inv = db_call(db_load_invest, int(id))
    # Current value changed, update valuelog
    if inv["category"] != 0: 
        if old_inv["current_value"] != inv["current_value"]:
            db_call(update_invest_valuelog, int(id), inv["current_value"])
            inv["update_day"] = datetime.now().strftime(DATE_FORMAT)

    db_call(db_update_invest, inv)
    db_call(update_total_valuelog)
         
    return {}
    
@app.route('/invests/<id>', method="DELETE")
@logined()
def delete_invest(id):
    db_call(db_delete_invest, int(id))
    db_call(db_delete_valuelog, int(id))
    db_call(update_total_valuelog)
    return {}
    
@app.route('/valuelogs/<id>', method="GET")
@logined()
def getall_valuelog(id):
    vls = db_call(db_getall_valuelog, int(id))
    return dict(valuelogs=vls)
 
@app.route('/static/:path#.+#')
def server_static(path):
    return static_file(path, root='static')
    
@app.route('/fonts/:path#.+#')
def fonts_static(path):
    return static_file(path, root='fonts')
    
@app.route('/app/:path#.+#')
def fonts_static(path):
    return static_file(path, root='app')
    
@app.route('/login',  method='GET')
@view('login')
def login_form():
    next = request.query.get('_next', '/')
    return dict(next=next, error=None)

@app.route('/login',  method='POST')
def login():
    password = request.forms.get('password')  
    next = request.forms.get('_next', '/')    
    if password != "xxx":       
        return template("login", next=next, error=u"密码错误！")
    
    response.set_cookie('session-id', '0')
    redirect(next)
    
@app.route('/logout')
@view('logout')
def logout():
    response.delete_cookie('session-id')

def print_ip():
    import socket
    local_ip = socket.gethostbyname(socket.gethostname())
    print "Server IP: ", local_ip
    
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=80)
    args = parser.parse_args()
    print_ip()
    run(app, host="0.0.0.0", port=args.port)
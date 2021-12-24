from flask import Flask, render_template
import socket
import datetime
# from pytz import timezone

app = Flask(__name__)
 
@app.route('/')
def info():
    hostname = socket.gethostname()
    time = datetime.datetime.now().replace(microsecond=0) 
    # now = datetime.datetime.now().replace(microsecond=0)
    # cn_tz = timezone('Asia/Shanghai')
    # time = now.astimezone(cn_tz)
    return render_template('index.html', hostname=hostname, time=time)
 
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)

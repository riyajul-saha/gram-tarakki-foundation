from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def home():
  return render_template('index.html')


@app.route("/about")
def about():
  return render_template('about.html')


@app.route("/programs")
def programs():
  return render_template('programs.html')


@app.route("/join")
def join():
  return render_template('join.html')

@app.route("/karate")
def karate():
  return render_template('programs/programs-karate.html')

@app.route("/yoga")
def yoga():
  return render_template('programs/programs-yoga.html')

@app.route("/donate")
def donate():
  return render_template('donate.html')

@app.route("/gallery")
def gallery():
  return render_template('gallery.html')

@app.route("/volunteer")
def volunteer():
  return render_template('volunteer.html')

if __name__ == "__main__":
  app.run(host="0.0.0.0", port=3000, debug=True)

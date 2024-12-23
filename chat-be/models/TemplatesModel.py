from app import db

class Templates(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    template = db.Column(db.Text, nullable=False)

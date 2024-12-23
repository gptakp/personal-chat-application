from app import db

class EmailTemplates(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    template = db.Column(db.Text, nullable=False)

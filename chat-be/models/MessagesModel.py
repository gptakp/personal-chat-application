from app import db

class Messages(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    connected_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    msg = db.Column(db.Text, nullable=False)

    user = db.relationship('User', foreign_keys=[user_id])
    connected_user = db.relationship('User', foreign_keys=[connected_user_id])

    def __repr__(self):
        return f'<Messages user_id={self.user_id}, connected_user_id={self.connected_user_id}>'
